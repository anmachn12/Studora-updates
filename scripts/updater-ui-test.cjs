const {_electron:electron}=require('playwright'),path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{
const data=path.resolve(__dirname,'../../update-test-data-'+Date.now()),output=process.env.STUDORA_TEST_OUTPUT_DIR||path.resolve(__dirname,'../../../outputs');await fs.mkdir(output,{recursive:true});
const env={...process.env,STUDORA_TEST:'1',STUDORA_DATA_DIR:data};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({args:require('./test-env.cjs').args,env});const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
await page.getByRole('heading',{name:'Overview',exact:true}).waitFor();
assert.equal(await page.locator('#updates + button').getAttribute('data-action'),'settings');
await page.getByRole('button',{name:'Check for updates',exact:true}).click();await page.getByRole('heading',{name:'Updates work in the installed app'}).waitFor();
await page.locator('#modal').getByRole('button',{name:'Close',exact:true}).click();
// Only this disposable test receives a fake release. No release server or installer runs.
await app.evaluate(()=>{const u=global.__studoraTestUpdater;u.emit('update-available',{version:'0.2.0'});u.downloadUpdate=async()=>{u.emit('download-progress',{percent:47});await new Promise(r=>setTimeout(r,800));u.emit('update-downloaded',{version:'0.2.0'})}});
await page.getByRole('button',{name:'Update available',exact:true}).click();await page.getByRole('heading',{name:'A new version is available'}).waitFor();
await page.screenshot({path:path.join(output,'Studora-updates.png')});
await page.getByRole('button',{name:'Download update',exact:true}).click();await page.getByRole('progressbar').waitFor();assert.equal(await page.getByRole('progressbar').getAttribute('value'),'47');
await page.getByRole('button',{name:'Restart and install',exact:true}).waitFor();assert.equal(await page.locator('#updates').getAttribute('aria-label'),'Update ready to install');
await page.locator('#modal').getByRole('button',{name:'Close',exact:true}).click();await page.locator('.rail button[aria-label="Settings"]').click();await page.locator('#updates-settings').waitFor();assert.match(await page.locator('#updates-settings').textContent(),/anmachn12\/Studora-updates/);
assert.deepEqual(errors,[]);console.log('PASS: updater position, development state, available badge, modal, download progress, ready state, and settings repository.');
}finally{await app.close()}
})().catch(e=>{console.error(e);process.exitCode=1});


