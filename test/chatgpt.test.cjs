const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {generateKeyPairSync,sign,createHash}=require('node:crypto');
const {createChatGPT,validateIdToken,consumeStream,planBody,planError}=require('../chatgpt.cjs');
const pair=generateKeyPairSync('rsa',{modulusLength:2048}),jwk={...pair.publicKey.export({format:'jwk'}),kid:'fixture',alg:'RS256',use:'sig'};
function jwt(claims){const h=Buffer.from(JSON.stringify({alg:'RS256',kid:'fixture'})).toString('base64url'),p=Buffer.from(JSON.stringify(claims)).toString('base64url');return h+'.'+p+'.'+sign('RSA-SHA256',Buffer.from(h+'.'+p),pair.privateKey).toString('base64url')}
const claims={iss:'https://auth.openai.com',aud:'oaiapp_fixture',sub:'fixture-user',nonce:'nonce',exp:Math.floor(Date.now()/1000)+3600};
test('OAuth identity verifies signature, nonce, expiry, issuer, audience and authorized party',()=>{
 const options={clientId:claims.aud,nonce:'nonce',keys:[jwk]};assert.equal(validateIdToken(jwt(claims),options).sub,claims.sub);
 for(const bad of [{nonce:'bad'},{aud:'different'},{iss:'https://attacker.invalid'},{exp:1},{aud:[claims.aud,'another'],azp:'wrong'}])assert.throws(()=>validateIdToken(jwt({...claims,...bad}),options));
 assert.throws(()=>validateIdToken(jwt(claims).slice(0,-12)+'different',options));
});
test('plan request uses supported streaming shape, tool namespace and no paid API token cap',()=>{
 const tool={type:'function',name:'calculate',parameters:{type:'object'}},body=planBody({model:'gpt-6.1-sol',input:'Hi',tools:[tool],max_output_tokens:6000,temperature:.4,store:true});
 assert.equal(body.stream,true);assert.equal(body.store,false);assert.equal(body.max_output_tokens,undefined);assert.equal(body.temperature,undefined);assert.ok(Array.isArray(body.input));assert.equal(body.tools[0].type,'namespace');assert.equal(body.tools[0].tools[0],tool);
});
test('stream reader waits for completion, handles split Unicode/CRLF and rejects failed or interrupted streams',async()=>{
 const stream=events=>new Response(new ReadableStream({start(c){const bytes=new TextEncoder().encode(events);for(let i=0;i<bytes.length;i+=3)c.enqueue(bytes.slice(i,i+3));c.close()}}));
 const response={status:'completed',output:[{type:'message',content:[{type:'output_text',text:'شرح عربي'}]}]};
 const out=await consumeStream(stream('data: '+JSON.stringify({type:'response.output_text.delta',delta:'شرح'})+'\r\n\r\ndata: '+JSON.stringify({type:'response.completed',response})+'\r\n\r\n'));assert.deepEqual(out,response);
 await assert.rejects(consumeStream(stream('data: {"type":"response.failed","response":{"error":{"code":"subscription_sharing_usage_limit_exceeded"}}}\n\n')),/will not switch/);
 await assert.rejects(consumeStream(stream('data: {"type":"response.incomplete"}\n\n')),/before completing/);
 await assert.rejects(consumeStream(stream('data: {"type":"response.output_text.delta","delta":"hello"}\n\n')),/before the explanation completed/);
 assert.match(planError(403,{code:'subscription_sharing_user_not_eligible'}).message,/does not allow/);
});
test('official OAuth loopback registration, PKCE, separate accounts, refresh, consent and revocation',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'studora-auth-test-'));let authorization,invalidStateStatus,refreshCount=0,apiCalls=[],signIns=0;
 const json=data=>({ok:true,status:200,json:async()=>data});
 const safeStorage={isEncryptionAvailable:()=>true,encryptString:s=>Buffer.from(s).map(x=>x^93),decryptString:b=>Buffer.from(b).map(x=>x^93).toString()};
 const fetcher=async(url,opts)=>{
  if(url.endsWith('openid-configuration'))return json({issuer:'https://auth.openai.com',jwks_uri:'https://auth.openai.com/.well-known/jwks.json',revocation_endpoint:'https://auth.openai.com/revoke'});
  if(url.endsWith('jwks.json'))return json({keys:[jwk]});if(url.endsWith('/revoke'))return {ok:true,status:200};
  if(url.endsWith('/oauth/token')){const f=new URLSearchParams(opts.body);if(f.get('grant_type')==='refresh_token'){refreshCount++;assert.equal(f.get('client_id'),'oaiapp_fixture');return json({access_token:'refreshed-fixture',refresh_token:'rotated-fixture',expires_in:3600});}
   assert.equal(f.get('redirect_uri'),authorization.searchParams.get('redirect_uri'));assert.equal(createHash('sha256').update(f.get('code_verifier')).digest('base64url'),authorization.searchParams.get('code_challenge'));
   const id=f.get('client_id');return json({access_token:'access-fixture-'+signIns,refresh_token:'refresh-fixture',id_token:jwt({...claims,aud:id,nonce:authorization.searchParams.get('nonce'),email:'fixture@example.invalid'}),scope:signIns===3?'openid email':'openid email chatgpt.tokens.use.direct',expires_in:1});
  }
  apiCalls.push({url,body:opts.body&&JSON.parse(opts.body),authorization:opts.headers.Authorization});
  if(url.endsWith('/models'))return json({models:[{slug:'gpt-6.1-sol',visibility:'list'}]});
  return new Response('data: {"type":"response.completed","response":{"status":"completed","output":[]}}\n\n');
 };
 const openExternal=async raw=>{
  signIns++;authorization=new URL(raw);assert.equal(authorization.origin,'https://auth.openai.com');assert.equal(authorization.searchParams.get('agent_name_hint'),signIns===2?null:'Studora');
  const callback=new URL(authorization.searchParams.get('redirect_uri'));callback.search=new URLSearchParams({code:'fixture-code',state:'wrong',client_id:signIns===3?'oaiapp_other':'oaiapp_fixture'}).toString();invalidStateStatus=(await fetch(callback)).status;
  callback.searchParams.set('state',authorization.searchParams.get('state'));await fetch(callback);
 };
 const manager=createChatGPT({dataDir:dir,safeStorage,fetcher,openExternal,timeoutMs:5000});
 try{
  const first=await manager.signIn();assert.equal(invalidStateStatus,400);assert.equal(first.enabled,true);assert.equal(first.firstWelcome,true);const host=authorization.searchParams.get('ext_agent_host_id');await manager.welcome();
  await Promise.all([manager.request('models'),manager.request('models')]);assert.equal(refreshCount,1);assert.ok(apiCalls.every(x=>x.authorization==='Bearer refreshed-fixture'));
  const next=await manager.signIn('oaiapp_fixture');assert.equal(authorization.searchParams.get('ext_agent_host_id'),host);assert.equal(next.firstWelcome,false);
  await manager.request('responses',{model:'gpt-6.1-sol',input:'Hi',max_output_tokens:256});assert.equal(apiCalls.at(-1).body.max_output_tokens,undefined);assert.equal(apiCalls.at(-1).body.stream,true);
  const file=await fs.readFile(path.join(dir,'chatgpt-accounts.bin'));assert.ok(!file.toString().includes('access-fixture'));
  const other=await manager.signIn();assert.equal(other.accounts.length,2);assert.equal(other.enabled,false);await assert.rejects(manager.request('models'),/not granted/);
  await manager.select('oaiapp_fixture');assert.equal((await manager.signOut()).revoked,true);assert.equal((await manager.status()).connected,false);assert.equal((await manager.status()).accounts.length,2);
 }finally{manager.cancel();await fs.rm(dir,{recursive:true,force:true});}
});
test('cancelled OAuth does not replace an account or leave a callback server running',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'studora-cancel-test-'));let notify;const opened=new Promise(r=>notify=r);
 const manager=createChatGPT({dataDir:dir,safeStorage:{decryptString:()=>{throw Error()},isEncryptionAvailable:()=>false},openExternal:async()=>notify(),timeoutMs:5000});
 const signIn=manager.signIn();await opened;manager.cancel();await assert.rejects(signIn,/cancelled/);assert.equal((await manager.status()).connected,false);await fs.rm(dir,{recursive:true,force:true});
});
