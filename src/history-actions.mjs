// One delegated tap guard per list: scrolling, cancelled/multiple contacts and
// compatibility duplicate clicks never edit/share; native keyboard clicks work.
export function attachHistoryActions(root,onAction){
 const win=root.ownerDocument.defaultView,contacts=new Set();let active=null,pending=null;
 const button=e=>e.target.closest?.('button[data-history-action]');
 const cancel=()=>{active=null;pending=null;contacts.clear()};
 const down=e=>{contacts.add(e.pointerId);if(active&&active.id!==e.pointerId)active.cancelled=true;const target=button(e);if(!target||!root.contains(target))return;pending=null;if(contacts.size!==1||e.isPrimary===false||e.button!==0)return;active={id:e.pointerId,button:target,x:e.clientX,y:e.clientY,cancelled:false}};
 const move=e=>{if(active?.id===e.pointerId&&Math.hypot(e.clientX-active.x,e.clientY-active.y)>8)active.cancelled=true};
 const up=e=>{contacts.delete(e.pointerId);if(active?.id!==e.pointerId)return;move(e);const r=active.button.getBoundingClientRect();active.cancelled ||= e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;pending=active;active=null};
 const aborted=e=>{contacts.delete(e.pointerId);if(active?.id===e.pointerId){active=null;pending=null}};
 const scroll=()=>{if(active)active.cancelled=true;pending=null};
 const click=e=>{const target=button(e);if(!target||!root.contains(target)||target.disabled)return;const allowed=e.detail===0||pending?.button===target&&!pending.cancelled;pending=null;if(!allowed){e.preventDefault();return}e.preventDefault();onAction(target.dataset.historyAction,target.dataset.historyId)};
 const hidden=()=>{if(root.ownerDocument.hidden)cancel()};
 const events=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',aborted],['blur',e=>{if(e.target===win)cancel()}],['resize',cancel],['pagehide',cancel]];
 for(const [name,fn]of events)win.addEventListener(name,fn,true);root.addEventListener('click',click);root.addEventListener('scroll',scroll,true);root.ownerDocument.addEventListener('visibilitychange',hidden);
 return()=>{cancel();for(const[name,fn]of events)win.removeEventListener(name,fn,true);root.removeEventListener('click',click);root.removeEventListener('scroll',scroll,true);root.ownerDocument.removeEventListener('visibilitychange',hidden)};
}
