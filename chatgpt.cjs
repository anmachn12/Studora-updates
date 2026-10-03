'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {randomUUID,randomBytes,createHash,createPublicKey,verify,timingSafeEqual}=require('node:crypto');
const AUTH='https://auth.openai.com',RESOURCE='https://api.openai.com/v1',SCOPE='openid profile email offline_access resource.invoke chatgpt.tokens.use.direct';
const tokenEndpoint=AUTH+'/api/accounts/oauth/token';
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
function safeOAuthDetail(out,fields){
 let text=typeof out.error_description==='string'?out.error_description:'';
 for(const value of [...['code','code_verifier','refresh_token'].map(k=>fields[k]),...['access_token','refresh_token','id_token'].map(k=>out[k])].filter(Boolean))for(const secret of [value,encodeURIComponent(value)])text=text.split(secret).join('[hidden]');
 return text.replace(/https?:\/\/\S+/g,'[link hidden]').replace(/\bsk-[A-Za-z0-9_-]+/g,'[hidden]').replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[hidden]').replace(/[\x00-\x1f\x7f]/g,' ').slice(0,300).trim();
}
function validateIdToken(token,{clientId,nonce,keys,now=Date.now()}){
 const parts=String(token||'').split('.');if(parts.length!==3)throw new Error('Invalid ChatGPT identity token.');
 let header,claims;try{header=JSON.parse(Buffer.from(parts[0],'base64url'));claims=JSON.parse(Buffer.from(parts[1],'base64url'))}catch{throw new Error('Invalid ChatGPT identity token.');}
 const jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.use||k.use==='sig')&&(!k.alg||k.alg==='RS256'));
 if(header.alg!=='RS256'||!jwk||!verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),createPublicKey({key:jwk,format:'jwk'}),Buffer.from(parts[2],'base64url')))throw new Error('ChatGPT identity verification failed.');
 const audiences=Array.isArray(claims.aud)?claims.aud:[claims.aud];
 if(claims.iss!==AUTH||!audiences.includes(clientId)||(audiences.length>1&&claims.azp!==clientId)||!Number.isFinite(claims.exp)||claims.exp*1000<=now||claims.nbf*1000>now+30000||!equal(claims.nonce,nonce)||typeof claims.sub!=='string'||!claims.sub)throw new Error('ChatGPT sign-in identity or expiry did not match. Please try again.');
 return claims;
}
function planError(status,error={}){
 const code=error.code||'',param=error.param||'';let message;
 if(code==='subscription_sharing_user_not_eligible')message='OpenAI does not allow ChatGPT plan access for this account or workspace. Studora cannot enable access for an ineligible account. Check account access in ChatGPT settings.';
 else if(code==='subscription_sharing_usage_limit_exceeded'||status===429)message='Your ChatGPT plan or Studora usage limit was reached. Review Manage usage in ChatGPT settings, then retry when access is available. Studora will not switch to a paid API key.';
 else if(code==='subscription_sharing_unsupported_capability')message='Your ChatGPT plan rejected a model, setting, or tool'+(param?' ('+String(param).slice(0,100)+')':'')+'. Refresh models or use Model default reasoning.';
 else if(status===401)message='ChatGPT did not accept this session or its permissions. Sign in again using Continue with ChatGPT.';
 else if(status===403)message='ChatGPT plan access is restricted for this account, workspace, region, or permission. Check access in ChatGPT settings.';
 else if(status>=500)message='ChatGPT plan access is temporarily unavailable. Try again later; your saved connection is preserved.';
 else message='ChatGPT rejected this request. '+String(error.message||error.detail||code||'Check your model and settings.').replace(/\bsk-[A-Za-z0-9_-]+/g,'[hidden]');
 return new Error(message);
}
function planBody(body){
 const next={...body,store:false,stream:true};
 for(const field of ['background','conversation','max_output_tokens','max_tool_calls','metadata','moderation','multi_agent','prompt','prompt_cache_retention','safety_identifier','temperature','top_logprobs','top_p','truncation','user','previous_response_id'])delete next[field];
 if(!Array.isArray(next.input))next.input=[{role:'user',content:String(next.input||'')}];
 if(next.tools?.length)next.tools=[{type:'namespace',name:'studora',description:'Studora learning tools',tools:next.tools}];
 return next;
}
async function consumeStream(response){
 if(!response.body?.getReader)throw new Error('ChatGPT did not return a readable stream.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',count=0,terminal;
 function event(block){const raw=block.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(!raw||raw==='[DONE]')return;
  let data;try{data=JSON.parse(raw)}catch{throw new Error('ChatGPT returned an unreadable stream event.');}
  if(data.type==='response.completed')terminal=data.response;
  if(data.type==='response.failed'||data.type==='error')throw planError(400,data.response?.error||data.error||data);
  if(data.type==='response.incomplete')throw new Error('ChatGPT stopped before completing the explanation. Try a shorter question.');
 }
 try{while(true){const {done,value}=await reader.read();if(done){buffer+=decoder.decode();break;}count+=value.length;if(count>32*1024*1024)throw new Error('ChatGPT response was too large.');buffer=(buffer+decoder.decode(value,{stream:true})).replace(/\r\n/g,'\n');let at;while((at=buffer.indexOf('\n\n'))>=0){event(buffer.slice(0,at));buffer=buffer.slice(at+2)}if(terminal)return terminal;}
  if(buffer.trim())event(buffer);if(terminal)return terminal;throw new Error('ChatGPT connection ended before the explanation completed. Please retry.');
 }finally{await reader.cancel().catch(()=>{});}
}
function createChatGPT({dataDir,safeStorage,openExternal,fetcher=(...args)=>fetch(...args),timeoutMs=180000}){
 const file=path.join(dataDir,'chatgpt-accounts.bin'),hostFile=path.join(dataDir,'chatgpt-host.json');
 let db=null,host,pending=null,refreshes=new Map(),writeQueue=Promise.resolve(),persistent=safeStorage.isEncryptionAvailable();
 async function load(){if(db)return db;try{db=JSON.parse(safeStorage.decryptString(await fs.readFile(file)));if(!Array.isArray(db.accounts))throw new Error('Invalid account store.');}catch{db={active:null,accounts:[]}}return db;}
 async function save(){persistent=safeStorage.isEncryptionAvailable();if(!persistent)return;const bytes=safeStorage.encryptString(JSON.stringify(db));writeQueue=writeQueue.then(async()=>{await fs.mkdir(dataDir,{recursive:true});await fs.writeFile(file+'.tmp',bytes);await fs.rename(file+'.tmp',file)});await writeQueue;}
 async function hostId(){if(host)return host;try{host=JSON.parse(await fs.readFile(hostFile,'utf8')).id;if(!/^urn:uuid:[0-9a-f-]{36}$/.test(host))host=null}catch{}if(!host){host='urn:uuid:'+randomUUID();await fs.mkdir(dataDir,{recursive:true});await fs.writeFile(hostFile,JSON.stringify({id:host}))}return host;}
 async function status(){const db=await load();const active=db.accounts.find(a=>a.client_id===db.active);return {connected:!!active?.access_token,enabled:!!active?.scopes?.includes('chatgpt.tokens.use.direct'),persistent,active:db.active,accounts:db.accounts.map(a=>({id:a.client_id,email:a.email||'ChatGPT account',label:a.label||a.client_id.slice(-8),signedIn:!!a.access_token})),firstWelcome:!!active&&!active.welcomed};}
 async function tokenPost(fields){let r;try{r=await fetcher(tokenEndpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields).toString(),signal:AbortSignal.timeout(30000)})}catch{throw new Error('Could not reach ChatGPT sign-in. Check your connection.');}const out=await r.json().catch(()=>({}));if(!r.ok){const code=typeof out.error==='string'&&/^[a-z_]{1,64}$/.test(out.error)?out.error:'oauth_error',detail=safeOAuthDetail(out,fields);const error=new Error('OpenAI rejected the ChatGPT sign-in request ('+code+').'+(detail?' '+detail:' Please try again.'));error.code=code;throw error;}return out;}
 async function metadata(){const r=await fetcher(AUTH+'/.well-known/openid-configuration',{signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('ChatGPT identity configuration is unavailable.');const out=await r.json();if(out.issuer!==AUTH)throw new Error('Unexpected ChatGPT identity issuer.');return out;}
 async function signIn(selectedId){
  if(pending)throw new Error('A ChatGPT sign-in is already open. Cancel it or finish in your browser.');
  let cancelled=false,activeCancel;const operation={cancel:()=>{cancelled=true;activeCancel?.(new Error('ChatGPT sign-in cancelled.'));}};pending=operation;
  try{
  const db=await load(),previous=selectedId?db.accounts.find(a=>a.client_id===selectedId):null;if(selectedId&&!previous)throw new Error('Saved account not found.');
  let clientId=previous?.client_id;
  for(let attempt=0;attempt<2;attempt++){
   if(cancelled)throw new Error('ChatGPT sign-in cancelled.');
   try{return await authorize(clientId,attempt)}catch(error){
    if(!cancelled&&attempt===0&&error.code==='invalid_grant'&&error.issuedClientId){clientId=error.issuedClientId;continue;}
    if(attempt===1&&error.code==='invalid_grant')error.message+=' A fresh sign-in was also rejected. Please retry later; this does not establish account eligibility.';
    throw error;
   }
  }
  async function authorize(clientId,attempt){
  const state=randomBytes(32).toString('base64url'),nonce=randomBytes(32).toString('base64url'),verifier=randomBytes(32).toString('base64url'),host=await hostId();
  if(cancelled)throw new Error('ChatGPT sign-in cancelled.');
  return new Promise((resolve,reject)=>{
   let timer,processing=false,settled=false,redirect;
   const server=http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Cache-Control','no-store');
    if(req.method!=='GET'||url.pathname!=='/auth/callback'){res.writeHead(404);res.end('Not found');return;}
    if(!equal(url.searchParams.get('state'),state)){res.writeHead(400);res.end('Invalid sign-in state. Return to Studora.');return;}
    if(processing||settled){res.writeHead(409);res.end('Sign-in is already being processed.');return;}processing=true;
    try{
     if(url.searchParams.has('error'))throw new Error('ChatGPT sign-in was declined or cancelled.');
     const issued=url.searchParams.get('client_id')||clientId;if(!issued||issued==='dynamic_agent_client'||(clientId&&issued!==clientId))throw new Error('ChatGPT did not return the expected account registration.');
     const code=url.searchParams.get('code');if(!code)throw new Error('ChatGPT sign-in did not return an authorization code.');
     let tokens;try{tokens=await tokenPost({grant_type:'authorization_code',client_id:issued,code,code_verifier:verifier,redirect_uri:redirect,resource:RESOURCE});}catch(error){if(error.code==='invalid_grant')error.issuedClientId=issued;throw error;}
     const config=await metadata(),jwksURL=new URL(config.jwks_uri);if(jwksURL.origin!==AUTH)throw new Error('Unexpected ChatGPT identity key location.');
     const jwks=await fetcher(jwksURL.href,{signal:AbortSignal.timeout(30000)});if(!jwks.ok)throw new Error('ChatGPT identity keys are unavailable.');
     const claims=validateIdToken(tokens.id_token,{clientId:issued,nonce,keys:(await jwks.json()).keys||[]});
     if(previous&&claims.sub!==previous.subject)throw new Error('The signed-in account did not match the selected saved account.');
     if(settled||cancelled)throw new Error('This sign-in was cancelled.');
     const scopes=String(tokens.scope||'').split(/\s+/),record={client_id:issued,subject:claims.sub,email:claims.email||'',label:previous?.label||issued.slice(-8),...tokens,scopes,expires_at:Date.now()+(Number(tokens.expires_in)||3600)*1000,welcomed:previous?.welcomed||false};
     const index=db.accounts.findIndex(a=>a.client_id===issued);if(index>=0)db.accounts[index]=record;else db.accounts.push(record);db.active=issued;await save();
     res.end('Studora sign-in completed. You can close this tab and return to Studora.');finish(null);
    }catch(error){res.writeHead(400);res.end(error.code==='invalid_grant'&&attempt===0&&!cancelled?'OpenAI rejected this sign-in code. Studora is opening a fresh sign-in automatically. Finish in the new browser tab.':'Studora could not complete sign-in. '+error.message+' Return to the app.');finish(error);}
   });
   function finish(error){if(settled)return;settled=true;clearTimeout(timer);server.close();activeCancel=null;if(error)reject(error);else status().then(resolve,reject);}
   activeCancel=finish;
   server.once('error',()=>finish(new Error('Could not open the local ChatGPT callback. Please retry.')));
   server.listen(0,'127.0.0.1',async()=>{if(settled)return;redirect='http://127.0.0.1:'+server.address().port+'/auth/callback';timer=setTimeout(()=>finish(new Error('ChatGPT sign-in timed out. Try again.')),timeoutMs);
    const params=new URLSearchParams({client_id:clientId||'dynamic_agent_client',ext_agent_host_id:host,response_type:'code',redirect_uri:redirect,scope:SCOPE,resource:RESOURCE,state,nonce,code_challenge_method:'S256',code_challenge:createHash('sha256').update(verifier).digest('base64url')});
    if(!clientId)params.set('agent_name_hint','Studora');if(previous){if(previous.id_token)params.set('id_token_hint',previous.id_token);if(previous.email)params.set('login_hint',previous.email);if(!previous.scopes?.includes('chatgpt.tokens.use.direct'))params.set('prompt','consent');}
    try{await openExternal(AUTH+'/api/accounts/authorize?'+params.toString())}catch{finish(new Error('Could not open ChatGPT sign-in in your browser.'));}
   });
  });
  }
  }finally{if(pending===operation)pending=null;}
 }
 async function access(){const db=await load(),record=db.accounts.find(a=>a.client_id===db.active);if(!record?.access_token)throw new Error('Continue with ChatGPT in Settings → AI connection.');if(!record.scopes?.includes('chatgpt.tokens.use.direct'))throw new Error('Permission to use your ChatGPT plan was not granted. Enable it with Continue with ChatGPT in Settings.');
  if(record.expires_at<=Date.now()+60000){if(!refreshes.has(record.client_id)){const task=(async()=>{try{if(!record.refresh_token)throw new Error('Sign in again to renew your ChatGPT connection.');const tokens=await tokenPost({grant_type:'refresh_token',client_id:record.client_id,refresh_token:record.refresh_token,resource:RESOURCE});if(!record.access_token)throw new Error('ChatGPT was signed out while renewing.');Object.assign(record,tokens,{scopes:tokens.scope?tokens.scope.split(/\s+/):record.scopes,expires_at:Date.now()+(Number(tokens.expires_in)||3600)*1000});await save();}catch(error){if(['invalid_grant','invalid_refresh_token','token_expired','refresh_token_expired','refresh_token_invalidated','refresh_token_reused'].includes(error.code)){delete record.access_token;delete record.refresh_token;delete record.id_token;await save();throw new Error('Your ChatGPT session expired or was revoked. Sign in again.');}throw error;}finally{refreshes.delete(record.client_id)}})();refreshes.set(record.client_id,task);}await refreshes.get(record.client_id);}
  if(!record.scopes?.includes('chatgpt.tokens.use.direct'))throw new Error('ChatGPT plan permission is no longer granted. Sign in again in Settings.');return record.access_token;
 }
 async function request(endpoint,body,signal){const token=await access();let r;try{r=await fetcher(RESOURCE+'/'+endpoint,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(planBody(body)):undefined,signal:signal||AbortSignal.timeout(30000)})}catch{throw new Error(signal?.aborted?'Response stopped or timed out. Your question is saved.':'Could not reach ChatGPT. Check your internet connection.');}
  if(!r.ok){const out=await r.json().catch(()=>({}));throw planError(r.status,out.error||out);}if(body)return consumeStream(r);return r.json();
 }
 async function select(id){const db=await load();if(!db.accounts.some(a=>a.client_id===id))throw new Error('Saved account not found.');db.active=id;await save();return status();}
 async function signOut(){pending?.cancel();const db=await load(),record=db.accounts.find(a=>a.client_id===db.active);let revoked=!record?.refresh_token;if(record?.refresh_token){try{const config=await metadata(),url=new URL(config.revocation_endpoint);if(url.origin!==AUTH)throw new Error('Unexpected revocation endpoint.');const r=await fetcher(url.href,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:record.refresh_token,token_type_hint:'refresh_token',client_id:record.client_id}).toString(),signal:AbortSignal.timeout(15000)});revoked=r.status===200;}catch{}}
  if(record){delete record.access_token;delete record.refresh_token;delete record.id_token;}await save();return {...await status(),revoked};
 }
 return {status,signIn,select,signOut,request,cancel:()=>{pending?.cancel();return true},welcome:async()=>{const db=await load(),r=db.accounts.find(a=>a.client_id===db.active);if(r){r.welcomed=true;await save()}return status()}};
}
module.exports={createChatGPT,validateIdToken,consumeStream,planBody,planError};
