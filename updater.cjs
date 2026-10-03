// The renderer can request actions, but cannot choose executable URLs or update feeds.
function createUpdateManager({app, updater, config, emit=()=>{}, beforeInstall=async()=>{},isBackground=()=>false}) {
  const configured=/^[\w-]+$/.test(config.owner||'') && /^[\w.-]+$/.test(config.repo||'');
  let state={status:app.isPackaged?(configured?'idle':'unconfigured'):'development',currentVersion:app.getVersion(),repository:configured?`${config.owner}/${config.repo}`:'',version:null,releaseNotes:'',percent:0,error:null,checkedAt:null};
  let pending=null;
  const snapshot=()=>({...state});
  const change=patch=>{state={...state,...patch};emit(snapshot());return snapshot()};
  const fail=()=>change({status:'error',error:'Could not reach the update service. Check your connection and try again.'});
  updater.autoDownload=false;
  updater.autoInstallOnAppQuit=false;
  updater.allowDowngrade=false;
  updater.allowPrerelease=false;
  updater.disableWebInstaller=true;
  updater.logger=null;
  if(configured)updater.setFeedURL({provider:'github',owner:config.owner,repo:config.repo,private:false});
  updater.on('checking-for-update',()=>change({status:'checking',error:null}));
  const notes=info=>(typeof info?.releaseNotes==='string'?info.releaseNotes:Array.isArray(info?.releaseNotes)?info.releaseNotes.map(x=>`### ${x.version}\n${x.note||''}`).join('\n\n'):'').slice(0,20000);
  updater.on('update-available',info=>{change({status:'available',version:info.version,releaseNotes:notes(info),error:null,checkedAt:new Date().toISOString()});Promise.resolve().then(downloadInBackground)});
  updater.on('update-not-available',info=>change({status:'up_to_date',version:null,releaseNotes:notes(info),error:null,checkedAt:new Date().toISOString()}));
  updater.on('download-progress',info=>change({status:'downloading',percent:Math.min(100,Math.max(0,Number(info.percent)||0))}));
  updater.on('update-downloaded',info=>change({status:'downloaded',version:info.version,releaseNotes:notes(info)||state.releaseNotes,percent:100,error:null}));
  updater.on('error',fail);
  async function check(){
    if(!app.isPackaged||!configured)return snapshot();
    if(['downloading','downloaded','installing'].includes(state.status))return snapshot();
    if(pending)return pending;
    change({status:'checking',error:null});
    pending=(async()=>{try{await updater.checkForUpdates();return snapshot()}catch{ return fail()}finally{pending=null}})();
    return pending;
  }
  async function download(){
    if(state.status!=='available')return snapshot();
    change({status:'downloading',percent:0,error:null});
    try{await updater.downloadUpdate();return snapshot()}catch{return fail()}
  }
  async function downloadInBackground(){if(app.isPackaged&&isBackground())return download();return snapshot()}
  async function install(){
    if(state.status!=='downloaded')throw new Error('Download the update before installing.');
    await beforeInstall(); // Refuse while AI is running; await all saved workspace writes.
    change({status:'installing'});
    try{updater.quitAndInstall(true,true)}catch{fail()}
    return snapshot();
  }
  return {snapshot,check,download,downloadInBackground,install};
}
module.exports={createUpdateManager};
