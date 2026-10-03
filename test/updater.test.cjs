const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createUpdateManager}=require('../updater.cjs');
function setup(packaged=true,beforeInstall=async()=>{},isBackground=()=>false){
  const updater=new EventEmitter();updater.setFeedURL=x=>updater.feed=x;
  updater.checkForUpdates=async()=>{updater.emit('update-available',{version:'0.2.0'})};
  updater.downloadUpdate=async()=>{updater.emit('download-progress',{percent:45});updater.emit('update-downloaded',{version:'0.2.0'})};
  updater.quitAndInstall=(...x)=>updater.installArgs=x;
  const states=[],manager=createUpdateManager({app:{isPackaged:packaged,getVersion:()=> '0.1.2'},updater,config:{owner:'anmachn12',repo:'Studora-updates'},emit:x=>states.push(x),beforeInstall,isBackground});
  return {updater,manager,states};
}
test('public release feed checks without downloading or installing automatically',async()=>{
  const {manager,updater}=setup();assert.equal(updater.autoDownload,false);assert.equal(updater.autoInstallOnAppQuit,false);
  assert.deepEqual(updater.feed,{provider:'github',owner:'anmachn12',repo:'Studora-updates',private:false});
  assert.equal((await manager.check()).status,'available');assert.equal(updater.installArgs,undefined);
  assert.equal((await manager.download()).status,'downloaded');assert.equal(updater.installArgs,undefined);
  await manager.install();assert.deepEqual(updater.installArgs,[true,true]);
});
test('Windows updater launches the installer silently and requests relaunch',async()=>{
  const {NsisUpdater}=require('electron-updater/out/NsisUpdater');
  const {manager,updater}=setup();let launch;
  updater.quitAndInstall=(isSilent,isForceRunAfter)=>{
    const receiver={installerPath:'C:\\Studora test\\update.exe',downloadedUpdateHelper:null,spawnLog:async(file,args)=>{launch={file,args}},dispatchError:error=>{throw error}};
    assert.equal(NsisUpdater.prototype.doInstall.call(receiver,{isSilent,isForceRunAfter,isAdminRightsRequired:false}),true);
  };
  await manager.check();await manager.download();assert.equal(launch,undefined);
  await manager.install();assert.deepEqual(launch,{file:'C:\\Studora test\\update.exe',args:['--updated','/S','--force-run']});
});
test('saving must complete before update installation',async()=>{
  let saved=false;const {manager,updater}=setup(true,async()=>{saved=true});
  updater.quitAndInstall=()=>assert.equal(saved,true);await manager.check();await manager.download();await manager.install();
});
test('busy tutor prevents restart and leaves the downloaded update ready',async()=>{
  const {manager,updater}=setup(true,async()=>{throw new Error('Finish your explanation first.')});
  await manager.check();await manager.download();await assert.rejects(manager.install(),/Finish/);
  assert.equal(manager.snapshot().status,'downloaded');assert.equal(updater.installArgs,undefined);
});
test('development builds do not access update servers; failed checks are retryable',async()=>{
  const dev=setup(false);dev.updater.checkForUpdates=()=>assert.fail('Development network check');assert.equal((await dev.manager.check()).status,'development');
  const {manager,updater}=setup();updater.checkForUpdates=async()=>{throw new Error('network')};assert.equal((await manager.check()).status,'error');
  updater.checkForUpdates=async()=>updater.emit('update-not-available');assert.equal((await manager.check()).status,'up_to_date');
});
test('overlapping checks share one request and progress stays within range',async()=>{
  const {manager,updater}=setup();let complete,calls=0;updater.checkForUpdates=()=>{calls++;return new Promise(resolve=>complete=resolve)};
  const first=manager.check(),second=manager.check();assert.equal(calls,1);updater.emit('update-not-available');complete();await Promise.all([first,second]);
  updater.emit('download-progress',{percent:120});assert.equal(manager.snapshot().percent,100);
});
test('hidden app downloads new releases automatically without installing',async()=>{
  let hidden=false,downloads=0;
  const {manager,updater}=setup(true,async()=>{},()=>hidden);
  updater.downloadUpdate=async()=>{downloads++;updater.emit('update-downloaded',{version:'0.2.0'})};
  await manager.check();assert.equal(downloads,0);hidden=true;await manager.downloadInBackground();assert.equal(downloads,1);assert.equal(manager.snapshot().status,'downloaded');assert.equal(updater.installArgs,undefined);
  const fresh=setup(true,async()=>{},()=>true);await fresh.manager.check();await new Promise(resolve=>setImmediate(resolve));assert.equal(fresh.manager.snapshot().status,'downloaded');assert.equal(fresh.updater.installArgs,undefined);
});
test('release descriptions persist through download and support provider arrays',async()=>{
  const {manager,updater}=setup();updater.emit('update-available',{version:'0.2.0',releaseNotes:'Clear description.'});await manager.download();assert.equal(manager.snapshot().releaseNotes,'Clear description.');
  updater.emit('update-not-available',{releaseNotes:[{version:'0.2.0',note:'New change.'}]});assert.match(manager.snapshot().releaseNotes,/0.2.0\nNew change/);
  updater.emit('update-available',{version:'0.3.0',releaseNotes:'x'.repeat(50000)});assert.equal(manager.snapshot().releaseNotes.length,20000);
});
