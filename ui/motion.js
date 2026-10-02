/* Keep navigation immediate while the browser blends the outgoing and incoming workspace. */
window.StudoraMotion=(()=>{
  const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let sequence=0,transition=null,fallback=[];
  function stop(){transition?.skipTransition();transition=null;fallback.forEach(a=>a.cancel());fallback=[]}
  function clear(){delete root.dataset.navigationMotion;delete root.dataset.navigationState;root.style.removeProperty('--navigation-x');root.style.removeProperty('--navigation-y')}
  function cancel(){sequence++;stop();clear()}
  function navigate(update,{mode='subject',direction=1}={}){
    const token=++sequence;stop();
    if(reduced.matches||document.visibilityState==='hidden'){clear();update();return Promise.resolve()}
    root.dataset.navigationMotion=mode;root.dataset.navigationState='running';
    root.style.setProperty('--navigation-x',mode==='tab'?direction*6+'px':'0px');
    root.style.setProperty('--navigation-y',mode==='subject'?direction*8+'px':'0px');
    const apply=()=>{if(token===sequence)update()};
    if(document.startViewTransition){
      try{
        const active=document.startViewTransition(apply);transition=active;
        active.ready.catch(()=>{}); // Hidden windows and interrupted captures simply render normally.
        active.finished.catch(()=>{}).finally(()=>{if(token===sequence){transition=null;clear()}});
        return active.updateCallbackDone;
      }catch{/* Preserve navigation if the platform cannot capture this frame. */}
    }
    apply();
    const canvas=document.querySelector('#main');
    if(canvas?.animate){const animation=canvas.animate([{opacity:.7,transform:mode==='tab'?`translateX(${direction*6}px)`:`translateY(${direction*8}px)`},{opacity:1,transform:'none'}],{duration:mode==='tab'?200:240,easing:'cubic-bezier(.22,1,.36,1)'});fallback=[animation];animation.finished.catch(()=>{}).finally(()=>{if(token===sequence){fallback=[];clear()}})}else clear();
    return Promise.resolve();
  }
  reduced.addEventListener('change',event=>{if(event.matches){stop();clear()}});
  return Object.freeze({navigate,cancel,active:()=>root.dataset.navigationState==='running'});
})();
