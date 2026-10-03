const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {toMessages,fromCompletion,readLocalStream,verified,createLocalAI}=require('../local-ai.cjs');
test('streaming preserves split Arabic and tool arguments, and rejects a dropped connection',async()=>{
 const events=[{choices:[{delta:{content:'شرح ',reasoning_content:'hidden'}}]},{choices:[{delta:{content:'عربي'}}]},{choices:[{delta:{tool_calls:[{index:0,id:'call-1',function:{name:'calculate',arguments:'{"expression":'}}]}}]},{choices:[{delta:{tool_calls:[{index:0,function:{arguments:'"2+2"}'}}]},finish_reason:'tool_calls'}],usage:{prompt_tokens:4,completion_tokens:6}}];
 const bytes=Buffer.from(events.map(e=>'data: '+JSON.stringify(e)+'\r\n\r\n').join('')+'data: [DONE]\n\n');async function* chunks(){for(let i=0;i<bytes.length;i+=3)yield bytes.subarray(i,i+3)}const seen=[];const out=await readLocalStream(chunks(),x=>seen.push(x));assert.equal(out.choices[0].message.content,'شرح عربي');assert.equal(out.choices[0].message.tool_calls[0].function.arguments,'{"expression":"2+2"}');assert.ok(!JSON.stringify(out).includes('hidden'));assert.equal(seen.at(-1),'شرح عربي');await assert.rejects(readLocalStream([Buffer.from('data: {"choices":[]}\n')]),/interrupted/);
});
test('local adapter keeps pictures and calculator results in their correct roles',()=>{
 const messages=toMessages({instructions:'Teach carefully',input:[{role:'user',content:[{type:'input_text',text:'Solve this'},{type:'input_image',image_url:'data:image/png;base64,abc'}]},{type:'function_call',call_id:'a',name:'calculate',arguments:'{"expression":"180-60"}'},{type:'function_call',call_id:'b',name:'calculate',arguments:'{"expression":"2+2"}'},{type:'function_call_output',call_id:'a',output:'120'},{type:'function_call_output',call_id:'b',output:'4'}]});
 assert.equal(messages[0].role,'system');assert.equal(messages[1].content[0].image_url.url,'data:image/png;base64,abc');assert.equal(messages[2].tool_calls.length,2);assert.equal(messages[3].tool_call_id,'a');assert.equal(messages[4].content,'4');assert.throws(()=>toMessages({input:[{role:'user',content:[{type:'input_file'}]}]}),/prepared/);
});
test('local results never display hidden reasoning or present a truncated answer as complete',()=>{
 const out=fromCompletion({choices:[{finish_reason:'length',message:{content:'Partial explanation',reasoning_content:'private trace'}}],usage:{prompt_tokens:7,completion_tokens:9}});assert.equal(out.status,'incomplete');assert.match(JSON.stringify(out),/remaining explanation/);assert.ok(!JSON.stringify(out).includes('private trace'));assert.equal(out.usage.output_tokens,9);
 assert.throws(()=>fromCompletion({choices:[{message:{content:''}}]}),/no explanation/);assert.throws(()=>fromCompletion({choices:[{message:{tool_calls:[{function:{name:'calculate'}}]}}]}),/invalid/);
});
test('a corrupt engine download is never installed or executed',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studora-local-test-'));let spawned=0;const ai=createLocalAI({dataDir:root,fetchImpl:async()=>new Response(new Uint8Array([1,2,3])),spawnImpl:()=>{spawned++;throw Error('Must not execute')}});
 try{await assert.rejects(ai.setup(),/verification failed/);assert.equal(spawned,0);assert.equal((await ai.status()).installed,false);assert.equal((await ai.status()).status,'error');await assert.rejects(fs.access(path.join(root,'installed.json')))}finally{ai.dispose();await fs.rm(root,{recursive:true,force:true})}
});
test('integrity verification checks both exact size and SHA256',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studora-hash-test-')),file=path.join(root,'model');try{await fs.writeFile(file,'model');const asset={size:5,sha256:crypto.createHash('sha256').update('model').digest('hex')};assert.equal(await verified(file,asset),true);await fs.writeFile(file,'other');assert.equal(await verified(file,asset),false)}finally{await fs.rm(root,{recursive:true,force:true})}
});

test('reusing an existing download rejects unverified assets before linking or executing',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studora-reuse-test-')),from=path.join(root,'untrusted');await fs.mkdir(from);let spawned=0;const ai=createLocalAI({dataDir:path.join(root,'installed'),spawnImpl:()=>{spawned++;throw Error('Must not execute')}});
 try{await assert.rejects(ai.useExisting(from),/verified Studora/);assert.equal(spawned,0);assert.equal((await ai.status()).installed,false);await assert.rejects(fs.access(path.join(root,'installed','installed.json')))}finally{ai.dispose();await fs.rm(root,{recursive:true,force:true})}
});
test('PDF source pages become actual local vision images',async()=>{
 const {PDFDocument}=require('pdf-lib');const pdf=await PDFDocument.create();pdf.addPage([400,300]).drawText('Triangle: 30, 60, x');const data='data:application/pdf;base64,'+Buffer.from(await pdf.save()).toString('base64');const {prepareLocalContent}=require('../local-sources.cjs');const result=await prepareLocalContent([{type:'input_text',text:'Original page 4'},{type:'input_file',file_data:data}]);assert.equal(result[0].text,'Original page 4');assert.match(result[1].image_url,/^data:image\/png;base64,/);await assert.rejects(prepareLocalContent(Array.from({length:3},()=>({type:'input_image',image_url:'x'}))),/at most two/);
});
