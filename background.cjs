function createBackgroundManager({app,win,Tray,Menu,nativeImage,updates,getEnabled,testMode=false,onHide=()=>{}}){
  let tray=null,quitting=false;
  const supported=app.isPackaged;
  function show(){if(win.isDestroyed())return;if(win.isMinimized())win.restore();win.show();win.focus();updates.check()}
  function apply(){
    if(!supported)return;
    const enabled=getEnabled();
    // Test processes never change the real user's Windows startup settings.
    if(!testMode&&process.platform==='win32')app.setLoginItemSettings({openAtLogin:enabled,path:process.execPath,args:['--background'],name:'Studora'});
    if(enabled&&!tray){
      tray=new Tray(nativeImage.createFromBuffer(require('./tray-icon.cjs')()).resize({width:16,height:16}));
      tray.setToolTip('Studora · Background updates');tray.on('click',show);tray.on('double-click',show);
      tray.setContextMenu(Menu.buildFromTemplate([{label:'Open Studora',click:show},{label:'Check for updates',click:()=>updates.check()},{type:'separator'},{label:'Quit Studora',click:()=>{quitting=true;app.quit()}}]));
    }else if(!enabled&&tray){tray.destroy();tray=null}
  }
  win.on('close',event=>{if(!quitting&&tray&&getEnabled()){event.preventDefault();onHide();win.hide();updates.downloadInBackground()}});
  app.on('before-quit',()=>{quitting=true});
  app.on('will-quit',()=>{tray?.destroy();tray=null});
  function status(value){if(tray)tray.setToolTip(value.status==='downloaded'?`Studora ${value.version} · Update ready to install`:value.status==='downloading'?`Studora · Downloading update ${Math.round(value.percent)}%`:'Studora · Background updates')}
  apply();return {apply,show,status,running:()=>!!tray&&!quitting,isBackground:()=>supported&&!!tray&&getEnabled()&&!win.isVisible()};
}
module.exports={createBackgroundManager};
