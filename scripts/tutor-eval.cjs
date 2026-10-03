'use strict';
// Optional real-model evaluation. Uses checked public examples and disposable app data.
// It does not download models, train weights, or automatically grade prose.
const {_electron:electron}=require('@playwright/test'),fs=require('node:fs/promises'),path=require('node:path'),{randomUUID}=require('node:crypto'),{seed}=require('../core.cjs');
(async()=>{
 if(!process.env.STUDORA_LOCAL_AI_DIR)throw Error('Set STUDORA_LOCAL_AI_DIR to the existing, installed local tutor folder.');
 const root=path.resolve(process.env.STUDORA_TEST_OUTPUT_DIR||path.join(__dirname,'../../tutor-eval-'+Date.now())),state=seed();state.settings.sound=false;
 const cases=require('../test/tutor-eval-cases.json').filter(c=>!process.argv[2]||c.id===process.argv[2]);if(!cases.length)throw Error('Unknown evaluation case.');
 for(const c of cases){c.subjectId=state.subjects.find(s=>s.name===c.name).id;c.sourceIds=[];if(c.source){const id=randomUUID();state.sources.push({id,subjectId:c.subjectId,name:'Evaluation reference',ext:'.txt',status:'ready',pages:[{page:1,text:c.source}]});c.sourceIds.push(id)}}
 await fs.mkdir(root,{recursive:true});await fs.writeFile(path.join(root,'workspace.json'),JSON.stringify(state));
 const env={...process.env,STUDORA_TEST:'1',STUDORA_DATA_DIR:root};delete env.ELECTRON_RUN_AS_NODE;const app=await electron.launch({args:require('./test-env.cjs').args,env}),results=[];
 try{const page=await app.firstWindow();await page.getByRole('heading',{name:'Overview',exact:true}).waitFor();for(const c of cases){const start=Date.now();let answer;try{answer=await page.evaluate(c=>window.studora.ask({subjectId:c.subjectId,prompt:c.prompt,sourceIds:c.sourceIds,language:['Arabic','Islamic Studies'].includes(c.name)?'Arabic':'English'}),c)}catch(e){answer={error:e.message}}results.push({id:c.id,subject:c.name,prompt:c.prompt,expected:c.expected,seconds:Math.round((Date.now()-start)/1000),...answer});await fs.writeFile(path.join(root,'results.json'),JSON.stringify(results,null,2));console.log(c.id+': '+results.at(-1).seconds+' seconds'+(answer.error?' · '+answer.error:''))}console.log('Review answers against the expected facts in '+path.join(root,'results.json')+'. This run does not certify an accuracy percentage.');}finally{await app.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
