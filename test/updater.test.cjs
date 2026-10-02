const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createUpdateManager}=require('../updater.cjs');
function setup(packaged=true,beforeInstall=async()=>{}){
  const updater=new EventEmitter();updater.setFeedURL=x=>updater.feed=x;
  updater.checkForUpdates=async()=>{updater.emit('update-available',{version:'0.2.0'})};
  updater.downloadUpdate=async()=>{updater.emit('download-progress',{percent:45});updater.emit('update-downloaded',{version:'0.2.0'})};
  updater.quitAndInstall=(...x)=>updater.installArgs=x;
  const states=[],manager=createUpdateManager({app:{isPackaged:packaged,getVersion:()=> '0.1.1'},updater,config:{owner:'anmachn12',repo:'Studora-updates'},emit:x=>states.push(x),beforeInstall});
  return {updater,manager,states};
}
test('public release feed checks without downloading or installing automatically',async()=>{
  const {manager,updater}=setup();assert.equal(updater.autoDownload,false);assert.equal(updater.autoInstallOnAppQuit,false);
  assert.deepEqual(updater.feed,{provider:'github',owner:'anmachn12',repo:'Studora-updates',private:false});
  assert.equal((await manager.check()).status,'available');assert.equal(updater.installArgs,undefined);
  assert.equal((await manager.download()).status,'downloaded');assert.equal(updater.installArgs,undefined);
  await manager.install();assert.deepEqual(updater.installArgs,[false,true]);
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
