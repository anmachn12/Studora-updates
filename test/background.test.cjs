const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createBackgroundManager}=require('../background.cjs');
function fixture(packaged=true){
  const app=new EventEmitter();app.isPackaged=packaged;app.quit=()=>app.emit('before-quit');
  const win=new EventEmitter();let visible=true,enabled=true,downloads=0;
  win.isDestroyed=()=>false;win.isMinimized=()=>false;win.isVisible=()=>visible;win.hide=()=>visible=false;win.show=()=>visible=true;win.focus=()=>{};
  class Tray extends EventEmitter{setToolTip(x){this.tooltip=x}setContextMenu(x){this.menu=x}destroy(){this.destroyed=true}}
  const image={resize(){return this}};
  const manager=createBackgroundManager({app,win,Tray,Menu:{buildFromTemplate:x=>x},nativeImage:{createFromBuffer:bytes=>{assert.equal(bytes[0],137);return image}},updates:{check:()=>{},downloadInBackground:()=>downloads++},getEnabled:()=>enabled,testMode:true});
  return {app,win,manager,disable:()=>enabled=false,downloads:()=>downloads};
}
test('closing the installed window keeps the updater alive without quitting',()=>{
  const f=fixture();let prevented=false;f.win.emit('close',{preventDefault:()=>prevented=true});assert.equal(prevented,true);assert.equal(f.manager.isBackground(),true);assert.equal(f.downloads(),1);f.manager.show();assert.equal(f.manager.isBackground(),false);
});
test('disabling background updates and quitting restore normal shutdown',()=>{
  const f=fixture();f.disable();f.manager.apply();let prevented=false;f.win.emit('close',{preventDefault:()=>prevented=true});assert.equal(prevented,false);assert.equal(f.manager.running(),false);
  const second=fixture();second.app.emit('before-quit');second.win.emit('close',{preventDefault:()=>assert.fail('Quit was intercepted')});assert.equal(second.manager.running(),false);
});
test('development windows do not become a startup/background app',()=>{const f=fixture(false);assert.equal(f.manager.running(),false);assert.equal(f.manager.isBackground(),false)});
