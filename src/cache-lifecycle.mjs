// No reload, skipWaiting, cache deletion, or data migrations in a live session.
export const cacheStatus={phase:'initial',waiting:false};
function publish(phase,waiting=false){Object.assign(cacheStatus,{phase,waiting});document.documentElement.dataset.hpCachePhase=phase;window.dispatchEvent(new CustomEvent('hp-cache-status',{detail:{...cacheStatus}}))}
export async function inspectWaitingUpdate(){try{const registration=await navigator.serviceWorker?.getRegistration();if(registration?.waiting)publish('waiting',true)}catch{}}
export async function startCacheLifecycle(url){
 try{
  const registration=await navigator.serviceWorker.register(url,{updateViaCache:'none'});
  let lastCheck=Date.now(),checking=false;
  const waiting=()=>{if(registration.waiting)publish('waiting',true)};
  const inspect=()=>{waiting();const worker=registration.installing;if(!worker)return;publish('installing',Boolean(registration.waiting));worker.addEventListener('statechange',()=>{if(worker.state==='installed'){if(navigator.serviceWorker.controller)publish('waiting',true);else publish('ready');setTimeout(waiting,0)}else if(worker.state==='activated')publish('ready')})};
  registration.addEventListener('updatefound',inspect);inspect();
  if(registration.waiting)waiting();else if(registration.active)publish('ready');
  const check=async(force=false)=>{if(checking||document.visibilityState!=='visible'||!navigator.onLine||(!force&&Date.now()-lastCheck<15*60*1000))return;checking=true;lastCheck=Date.now();try{await registration.update();waiting()}catch{/* Keep current cached calculator usable. */}finally{checking=false}};
  window.addEventListener('online',()=>check(true));window.addEventListener('pageshow',()=>check());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()});
  // Browsers may evict stored data/processes; this is not a keep-alive guarantee.
  return registration;
 }catch{publish('unavailable');return null}
}
