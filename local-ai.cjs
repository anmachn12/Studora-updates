'use strict';
const fs=require('node:fs/promises'), path=require('node:path'), crypto=require('node:crypto');
const {createReadStream}=require('node:fs'), {spawn}=require('node:child_process'), net=require('node:net');
const config=require('./local-ai-config.json');
const assets=[config.runtime,config.model,config.vision];
const extractEngineScript="$ErrorActionPreference='Stop'; $null=[Reflection.Assembly]::LoadWithPartialName('System.IO.Compression.FileSystem'); $root=[IO.Path]::GetFullPath($env:STUDORA_EXTRACT)+[IO.Path]::DirectorySeparatorChar; $archive=[IO.Compression.ZipFile]::OpenRead($env:STUDORA_ARCHIVE); try { foreach($entry in $archive.Entries) { $target=[IO.Path]::GetFullPath([IO.Path]::Combine($root,$entry.FullName)); if(-not $target.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid engine archive path'}; if($entry.Name.Length -eq 0){$null=[IO.Directory]::CreateDirectory($target)} else {$null=[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)); [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$target,$true)} } } finally { $archive.Dispose() }";
const catalog=[{id:config.id,label:config.name,reasoning:false}];
async function verified(file,asset){try{if((await fs.stat(file)).size!==asset.size)return false;const hash=crypto.createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex')===asset.sha256}catch{return false}}
function toMessages(body){
 const messages=[];if(body.instructions)messages.push({role:'system',content:body.instructions});
 const input=typeof body.input==='string'?[{role:'user',content:body.input}]:body.input||[];
 for(const item of input){
  if(item.type==='function_call'){let last=messages.at(-1);if(last?.role!=='assistant'){last={role:'assistant',content:null};messages.push(last)}last.tool_calls||=[];last.tool_calls.push({id:item.call_id,type:'function',function:{name:item.name,arguments:item.arguments}});continue}
  if(item.type==='function_call_output'){messages.push({role:'tool',tool_call_id:item.call_id,content:item.output});continue}
  if(!['user','assistant','system'].includes(item.role))continue;
  const content=typeof item.content==='string'?item.content:(item.content||[]).map(part=>{
   if(['input_text','output_text','text'].includes(part.type))return {type:'text',text:part.text};
   if(part.type==='input_image')return {type:'image_url',image_url:{url:part.image_url}};
   throw new Error('This file could not be prepared for the local tutor. Try a photo of the relevant page.');
  });if(Array.isArray(content))content.sort((a,b)=>(a.type==='image_url'?0:1)-(b.type==='image_url'?0:1));messages.push({role:item.role,content});
 }return messages;
}
function fromCompletion(out){
 const choice=out.choices?.[0],message=choice?.message;if(!message)throw new Error('The local tutor returned no answer. Try again.');
 // Some Gemma generations leave a native calculator call in visible content.
 // Accept only its complete, narrowly defined string form; the existing tool gate validates it again.
 const raw=message.content?.trim(),native=raw?.match(/^<\|tool_call>call:calculate\{expression\s*[=:]\s*("(?:[^"\\]|\\.)*"|<\|"\|>[^\n]*?<\|"\|>|[0-9.\s()+\-*/^%]+)\}\s*<tool_call\|>$/);
 if(native&&!message.tool_calls?.length){const expression=native[1].startsWith('"')?JSON.parse(native[1]):native[1].startsWith('<|"|>')?native[1].slice(5,-5):native[1].trim();message.content='';message.tool_calls=[{id:'local-'+crypto.randomUUID(),function:{name:'calculate',arguments:JSON.stringify({expression})}}];}
 else if(raw?.includes('<|tool_call>'))return {status:'incomplete',needsExplanation:true,output:[],usage:{input_tokens:out.usage?.prompt_tokens||0,output_tokens:out.usage?.completion_tokens||0}};
 const output=[];if(message.content?.trim())output.push({type:'message',role:'assistant',content:[{type:'output_text',text:message.content}]});
 for(const call of message.tool_calls||[]){if(!call.id||!call.function?.name||typeof call.function.arguments!=='string')throw new Error('The local tutor returned an invalid learning-tool request. Please retry.');output.push({type:'function_call',call_id:call.id,name:call.function.name,arguments:call.function.arguments})}
 if(!output.length)throw new Error('The local tutor returned no explanation. Try asking one step at a time.');
 if(choice.finish_reason==='length')output.push({type:'message',role:'assistant',content:[{type:'output_text',text:'\n\n*This response reached its length limit. Ask “continue” for the remaining explanation.*'}]});
 return {status:choice.finish_reason==='length'?'incomplete':'completed',output,usage:{input_tokens:out.usage?.prompt_tokens||0,output_tokens:out.usage?.completion_tokens||0}};
}
async function readLocalStream(body,onText=()=>{}){
 const decoder=new TextDecoder(),message={content:'',tool_calls:[]};let buffer='',done=false,finish=null,usage;
 function line(value){if(!value.startsWith('data:'))return;const data=value.slice(5).trim();if(data==='[DONE]'){done=true;return}if(!data)return;const event=JSON.parse(data);if(event.error)throw Error('The local tutor interrupted its answer. Please retry.');if(event.usage)usage=event.usage;const choice=event.choices?.[0];if(!choice)return;if(choice.finish_reason)finish=choice.finish_reason;const delta=choice.delta||{};if(delta.content){message.content+=delta.content;onText(message.content)}for(const call of delta.tool_calls||[]){const index=call.index||0;const target=message.tool_calls[index]||(message.tool_calls[index]={id:'',type:'function',function:{name:'',arguments:''}});if(call.id)target.id=call.id;if(call.function?.name)target.function.name+=call.function.name;if(call.function?.arguments)target.function.arguments+=call.function.arguments}}
 for await(const chunk of body){buffer+=decoder.decode(chunk,{stream:true});let n;while((n=buffer.indexOf('\n'))>=0){line(buffer.slice(0,n).replace(/\r$/,''));buffer=buffer.slice(n+1)}}buffer+=decoder.decode();if(buffer.trim())line(buffer.trim());if(!done||!finish)throw Error('The local response was interrupted. Your question is saved; please retry.');message.tool_calls=message.tool_calls.filter(Boolean);return {choices:[{message,finish_reason:finish}],usage};
}
async function completeInParts(body,invoke,signal,onText=()=>{}){
 const original=toMessages(body);let text='',previous='',usage={prompt_tokens:0,completion_tokens:0},continuing=false;
 for(;;){signal?.throwIfAborted();const messages=continuing?[...original,{role:'assistant',content:text.slice(-6000)},{role:'user',content:'Continue exactly where your explanation stopped. Finish the remaining requested parts. Do not repeat the introduction or restart the answer.'}]:original;
  const out=await invoke(messages,part=>onText(text+part),continuing),choice=out.choices?.[0];usage.prompt_tokens+=out.usage?.prompt_tokens||0;usage.completion_tokens+=out.usage?.completion_tokens||0;
  const chunk=choice?.message?.content||'';text+=chunk;if(choice?.finish_reason!=='length'||choice.message?.tool_calls?.length||chunk.includes('<|tool_call>')||body.localSchema)return {...out,choices:[{...choice,message:{...choice?.message,content:text}}],usage};
  if(!chunk.trim()||chunk===previous)throw Error('The model repeated itself while continuing. Try narrowing the lesson or asking for the next section.');previous=chunk;continuing=true;
 }
}
function createLocalAI({dataDir,emit=()=>{},onText=()=>{},fetchImpl=fetch,spawnImpl=spawn,idleMs=120000}){
 const root=path.resolve(dataDir),engine=path.join(root,'engine'),exe=path.join(engine,'llama-server.exe');
 let state={status:'not-installed',installed:false,progress:0,message:'One-time download · 5.61 GB. No account or API charges.'},setupController,setupPromise,server,startPromise,idleTimer,token,base,disposed=false,active=0;
 const snapshot=()=>({...state,model:config.id,name:config.name});
 const set=next=>{state={...state,...next};emit(snapshot());return snapshot()};
 async function status(){if(!state.installed&&!setupPromise){try{const marker=JSON.parse(await fs.readFile(path.join(root,'installed.json'),'utf8'));if(marker.id===config.id&&marker.runtime===config.runtime.sha256&&marker.model===config.model.sha256&&marker.vision===config.vision.sha256){await fs.access(exe);for(const asset of assets.slice(1))if((await fs.stat(path.join(root,asset.name))).size!==asset.size)throw Error();set({installed:true,status:'installed',progress:100,message:'Ready to tutor on this computer.'})}}catch{}}return snapshot()}
 async function download(asset,signal,completed,total){
  const target=path.join(root,asset.name);if(await verified(target,asset))return;
  const part=target+'.part';let offset=0;try{offset=(await fs.stat(part)).size;if(offset>=asset.size){await fs.rm(part,{force:true});offset=0}}catch{}
  const response=await fetchImpl(asset.url,{headers:offset?{Range:`bytes=${offset}-`}:{},signal});if(!response.ok||!response.body)throw Error('Download unavailable. Check your connection and retry.');
  if(offset&&response.status!==206)offset=0;
  if(response.status===206&&!String(response.headers.get('content-range')).startsWith(`bytes ${offset}-`))throw Error('The download server returned an unexpected range. Please retry.');
  const file=await fs.open(part,offset?'a':'w');let done=offset,last=0;
  try{for await(const chunk of response.body){signal.throwIfAborted();done+=chunk.length;if(done>asset.size)throw Error('Download size did not match the verified release.');await file.writeFile(chunk);if(Date.now()-last>300){last=Date.now();set({status:'downloading',progress:Math.round((completed+done)/total*100),message:`Downloading ${asset===config.model?'tutor model':asset===config.vision?'image support':'AI engine'}…`})}}}finally{await file.close()}
  set({status:'verifying',message:'Checking the download…'});if(!await verified(part,asset)){await fs.rm(part,{force:true});throw Error('Download verification failed. Retry to download a clean copy.')}signal.throwIfAborted();await fs.rename(part,target);
 }
 async function setup(){if(setupPromise)return setupPromise;if((await status()).installed)return snapshot();if(setupPromise)return setupPromise;setupController=new AbortController();const signal=setupController.signal;
  setupPromise=(async()=>{try{await fs.mkdir(root,{recursive:true});let needed=256*1024**2;for(const asset of assets){let existing=0;for(const name of [asset.name,asset.name+'.part'])try{existing=Math.max(existing,(await fs.stat(path.join(root,name))).size)}catch{}needed+=Math.max(0,asset.size-existing)}const disk=await fs.statfs(root);if(disk.bavail*disk.bsize<needed)throw Error('Not enough disk space. Free '+Math.ceil(needed/1024**3)+' GB, then retry setup.');const total=assets.reduce((n,a)=>n+a.size,0);let done=0;set({status:'downloading',progress:0,message:'Preparing your free tutor…'});for(const asset of assets){await download(asset,signal,done,total);done+=asset.size}signal.throwIfAborted();set({status:'verifying',progress:99,message:'Installing the verified AI engine…'});
   await fs.mkdir(engine,{recursive:true});await new Promise((resolve,reject)=>{const child=spawnImpl('powershell.exe',['-NoProfile','-NonInteractive','-Command',extractEngineScript],{windowsHide:true,stdio:'ignore',env:{...process.env,STUDORA_ARCHIVE:path.join(root,config.runtime.name),STUDORA_EXTRACT:engine},signal});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Could not install the AI engine. Retry setup.')))});
   signal.throwIfAborted();await fs.access(exe);await fs.writeFile(path.join(root,'installed.json'),JSON.stringify({id:config.id,runtime:config.runtime.sha256,model:config.model.sha256,vision:config.vision.sha256}));return set({installed:true,status:'installed',progress:100,message:'Your free tutor is ready. Open a subject and ask a question.'});
  }catch(error){set({status:signal.aborted?'not-installed':'error',message:signal.aborted?'Download paused. Retry setup to resume.':error.message});throw new Error(state.message)}finally{setupController=null;setupPromise=null}})();return setupPromise;
 }
 async function useExisting(source){
  if(setupPromise||active)throw Error('Finish the current setup or answer first.');
  const from=path.resolve(source);setupController=new AbortController();const signal=setupController.signal;
  setupPromise=(async()=>{try{
   set({status:'verifying',progress:0,message:'Checking your existing download…'});
   for(const asset of assets){signal.throwIfAborted();if(!await verified(path.join(from,asset.name),asset))throw Error('This folder does not contain the verified Studora model and engine. Choose the original download folder.');}
   signal.throwIfAborted();await fs.mkdir(engine,{recursive:true});
   for(const asset of assets){const target=path.join(root,asset.name);if(await verified(target,asset))continue;try{await fs.link(path.join(from,asset.name),target)}catch(error){if(error.code==='EXDEV')throw Error('Choose an existing download on the same drive as Studora data to reuse it without a second copy.');if(error.code==='EEXIST')throw Error('A different file already exists in Studora AI storage. Review it before importing.');throw error}}
   await new Promise((resolve,reject)=>{const child=spawnImpl('powershell.exe',['-NoProfile','-NonInteractive','-Command',extractEngineScript],{windowsHide:true,stdio:'ignore',env:{...process.env,STUDORA_ARCHIVE:path.join(root,config.runtime.name),STUDORA_EXTRACT:engine},signal});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Could not install the verified engine. Retry importing.')))});
   signal.throwIfAborted();await fs.access(exe);await fs.writeFile(path.join(root,'installed.json'),JSON.stringify({id:config.id,runtime:config.runtime.sha256,model:config.model.sha256,vision:config.vision.sha256}));return set({installed:true,status:'installed',progress:100,message:'Your existing model is ready. Open a subject and ask a question.'});
  }catch(error){set({status:'error',message:signal.aborted?'Import stopped. Your download is kept.':error.message});throw Error(state.message)}finally{setupController=null;setupPromise=null}})();return setupPromise;
 }
 function stopServer(){clearTimeout(idleTimer);const child=server;server=null;base=null;token=null;child?.kill();if(state.installed)set({status:'installed',message:'Ready. The AI engine starts when you ask a question.'})}
 async function start(signal){if(disposed)throw Error('Studora is closing.');if(server&&base)return;if(startPromise)return startPromise;
  startPromise=(async()=>{if(!(await status()).installed)throw Error('Set up the free local tutor in Settings → AI connection first.');set({status:'loading',message:'Starting your local tutor…'});
   const port=await new Promise((resolve,reject)=>{const socket=net.createServer();socket.once('error',reject);socket.listen(0,'127.0.0.1',()=>{const n=socket.address().port;socket.close(()=>resolve(n))})});token=crypto.randomBytes(32).toString('hex');const secretFile=path.join(root,'session-key');await fs.writeFile(secretFile,token,{mode:0o600});
   const child=spawnImpl(exe,['-m',path.join(root,config.model.name),'--mmproj',path.join(root,config.vision.name),'--no-mmproj-offload','--host','127.0.0.1','--port',String(port),'-c','8192','-np','1','-t','6','-b','256','-ub','128','--fit','on','--fit-target','512','--api-key-file',secretFile,'--reasoning-budget','256','--log-disable'],{windowsHide:true,stdio:'ignore'});server=child;let failed=false;child.once('error',()=>{failed=true});child.once('exit',()=>{failed=true;if(server===child){server=null;base=null;set({status:'installed',message:'The local engine stopped. Retry your question.'})}});
   try{for(let i=0;i<240;i++){signal?.throwIfAborted();if(disposed||failed)throw Error('The local tutor could not start. Close unneeded apps to free memory, then retry.');try{const r=await fetchImpl(`http://127.0.0.1:${port}/health`,{signal:AbortSignal.timeout(1000)});if(r.ok){base=`http://127.0.0.1:${port}`;set({status:'ready',message:'Tutoring locally · no API charges.'});return}}catch{}await new Promise(r=>setTimeout(r,500))}throw Error('Starting the local tutor took too long. Free some memory and retry.')}catch(error){stopServer();throw error}finally{await fs.rm(secretFile,{force:true}).catch(()=>{})}
  })().finally(()=>{startPromise=null});return startPromise;
 }
 async function request(endpoint,body,signal){if(endpoint==='models')return {data:catalog};if(endpoint!=='responses')throw Error('Unsupported local request.');active++;clearTimeout(idleTimer);const abort=()=>stopServer();signal?.addEventListener('abort',abort,{once:true});
  try{await start(signal);signal?.throwIfAborted();const out=await completeInParts(body,async(messages,partial,continuing)=>{const response=await fetchImpl(base+'/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},signal,body:JSON.stringify({model:config.id,messages,tools:continuing||body.tool_choice==='none'?undefined:body.tools?.map(t=>({type:'function',function:{name:t.name,description:t.description,parameters:t.parameters}})),tool_choice:continuing?'none':body.tool_choice||'auto',max_tokens:Math.min(body.max_output_tokens||2048,body.localSchema?1200:2048),...(body.localSchema?{response_format:{type:'json_object',schema:body.localSchema}}:{}),temperature:1,top_p:0.95,top_k:64,chat_template_kwargs:{enable_thinking:continuing||body.tool_choice==='none'?false:body.localThinking!==false},stream:true,stream_options:{include_usage:true}})});if(!response.ok){if(process.env.STUDORA_TEST){const details=await response.text().catch(()=>'');console.error('Local engine HTTP '+response.status+': '+details.slice(0,500))}if(response.status>=500)stopServer();throw Error(response.status===400?'This question and its sources are too large for the local tutor. Select fewer pages or start a fresh chat.':'The local tutor could not finish. Retry your question to restart the engine.')}return readLocalStream(response.body,partial)},signal,onText);return fromCompletion(out)}catch(error){if(signal?.aborted)throw Error('Response stopped or timed out. Your question is saved.');throw error}finally{signal?.removeEventListener('abort',abort);active--;if(!active){idleTimer=setTimeout(stopServer,idleMs);idleTimer.unref()}}
 }
 return {status,snapshot,setup,useExisting,request,cancel:()=>{setupController?.abort();return snapshot()},dispose:()=>{disposed=true;setupController?.abort();stopServer()}};
}
module.exports={createLocalAI,toMessages,fromCompletion,readLocalStream,verified,catalog,config,completeInParts};
