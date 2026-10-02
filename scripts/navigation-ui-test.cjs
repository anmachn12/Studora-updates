const {_electron:electron}=require('playwright'),path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict'),{seed}=require('../core.cjs');
(async()=>{
 const data=path.resolve(__dirname,'../../navigation-test-'+Date.now()),state=seed();state.settings.sound=false;
 const math=state.subjects.find(s=>s.name==='Math'),arabic=state.subjects.find(s=>s.name==='Arabic'),now=new Date().toISOString();
 for(const [subject,title,draft] of [[math,'Geometry review','Where does this angle come from?'],[arabic,'Arabic review','Explain this grammar example.']])state.chats.push({id:subject.id,subjectId:subject.id,title,messages:[],sourceIds:[],createdAt:now,updatedAt:now,draft,pinned:false,archived:false});
 await fs.mkdir(data,{recursive:true});await fs.writeFile(path.join(data,'workspace.json'),JSON.stringify(state));
 const env={...process.env,STUDORA_TEST:'1',STUDORA_DATA_DIR:data};delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({args:require('./test-env.cjs').args,env});const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const settled=()=>page.waitForFunction(()=>!window.StudoraMotion.active());
 const rail=name=>page.locator('#subject-rail button[aria-label="'+name+'"]');
 try{
  await page.getByRole('heading',{name:'Overview',exact:true}).waitFor();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].show());await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{window.__mathRailButton=document.querySelector('#subject-rail button[aria-label="Math"]')});
  await rail('Math').click();await page.getByRole('heading',{name:'Geometry review',exact:true}).waitFor();await settled();assert.equal(await page.locator('#prompt').inputValue(),'Where does this angle come from?');
  await page.locator('#prompt').fill('Keep this draft while I switch.');await rail('Arabic').click();
  await page.waitForFunction(()=>document.getAnimations().some(a=>a.animationName==='study-main-in'),null,{timeout:4000});
  await settled();assert.equal(await page.locator('#prompt').inputValue(),'Explain this grammar example.');assert.equal(await page.evaluate(()=>window.__mathRailButton===document.querySelector('#subject-rail button[aria-label="Math"]')),true);
  // Several clicks in the same frame must resolve to the last selection.
  await page.evaluate(()=>{for(const name of ['Biology','Physics','Arabic','Math'])document.querySelector('#subject-rail button[aria-label="'+name+'"]').click()});
  await page.getByRole('heading',{name:'Geometry review',exact:true}).waitFor();await settled();assert.equal(await page.locator('#prompt').inputValue(),'Keep this draft while I switch.');assert.equal(await page.locator('#subject-rail button.selected').getAttribute('aria-label'),'Math');
  await page.getByRole('button',{name:'Sources',exact:true}).click();await page.getByRole('heading',{name:'Sources',exact:true}).waitFor();await settled();
  await page.evaluate(()=>{for(const name of ['Notebook','Practice','Tutor'])document.querySelector('.tabs button[data-tab="'+name+'"]').click()});
  await page.getByRole('heading',{name:'Geometry review',exact:true}).waitFor();await settled();assert.equal(await page.locator('#prompt').inputValue(),'Keep this draft while I switch.');
  // A different page must cancel a pending subject switch.
  await page.evaluate(()=>{document.querySelector('#subject-rail button[aria-label="Arabic"]').click();document.querySelector('.rail button[data-action="settings"]').click()});
  await page.getByRole('heading',{name:'Make it yours',exact:true}).waitFor();await settled();
  await page.emulateMedia({reducedMotion:'reduce'});await rail('Arabic').click();await page.getByRole('heading',{name:'Arabic review',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.StudoraMotion.active()),false);assert.equal(await page.evaluate(()=>document.getAnimations().some(a=>(a.animationName||'').startsWith('study-'))),false);
  assert.deepEqual(errors,[]);console.log('PASS: real workspace animation, stable rail, rapid subjects/tabs, restored drafts, interrupted navigation, and reduced motion.');
 }finally{await app.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
