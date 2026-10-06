import {createDirectionalDrag} from './directional-drag.mjs';
// A gesture started in scroll content stays scrolling until it ends.
export function attachSurfacePull(root,{onPull,enabled=()=>true,scrollSelector,ignoreSelector,direction=1,freeMotion=false,onProgress=()=>{},onStart=()=>{}}){
 const win=root.ownerDocument.defaultView,tracker=createDirectionalDrag(direction,freeMotion),host=root.closest('.calculator')||root;
 let start=null,touch=null,width=win.innerWidth,height=win.innerHeight;
 const clear=()=>{tracker.cancel();start=null;touch=null;onProgress(0,{active:false})};
 const block=()=>{host.dataset.swipeClickBlocked='1'};
 const down=e=>{
  if(root.contains(e.target))host.dataset.swipeClickBlocked='0';
  if(start&&start.id!==e.pointerId){tracker.cancel();onProgress(0);start.moved=true;return}
  if(!enabled()||!root.contains(e.target)||e.target.closest('input,textarea,select,[contenteditable="true"]')||(ignoreSelector&&e.target.closest(ignoreSelector)))return;
  if(scrollSelector){const scroller=e.target.closest(scrollSelector);if(scroller&&scroller.scrollTop>1)return}
  if(tracker.down(e)){start={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,dragged:false};onStart()}
 };
 const move=e=>{if(start?.id!==e.pointerId)return;if(!enabled()){clear();return}start.moved ||= Math.hypot(e.clientX-start.x,e.clientY-start.y)>8;tracker.move(e);const distance=freeMotion?tracker.offset():tracker.distance(),vertical=Math.abs(distance)>=Math.abs(e.clientX-start.x)*.8;if(!tracker.active()||!vertical&&!start.dragged){onProgress(0,{active:false});return}if(Math.abs(distance)>8)start.dragged=true;if(start.dragged)onProgress(distance,{active:true})};
 const up=e=>{if(start?.id!==e.pointerId)return;move(e);if(!start)return;const distance=Math.max(0,(e.clientY-start.y)*direction),accepted=enabled()&&tracker.up(e),moved=start.moved;clear();if(moved||accepted)block();if(accepted)onPull({distance})};
 const click=e=>{if(e.detail!==0&&host.dataset.swipeClickBlocked==='1'){host.dataset.swipeClickBlocked='0';e.preventDefault();e.stopImmediatePropagation()}};
 const touchDown=e=>{touch=null;if(!enabled()||e.touches.length!==1||e.target.closest('input,textarea,select,[contenteditable="true"]')||(ignoreSelector&&e.target.closest(ignoreSelector)))return;const scroller=scrollSelector?e.target.closest(scrollSelector):null;if(!scroller||scroller.scrollTop<=1){const t=e.touches[0];touch={id:t.identifier,x:t.clientX,y:t.clientY}}};
 const touchMove=e=>{if(!touch||e.touches.length!==1){touch=null;return}const t=e.touches[0];if(t.identifier!==touch.id)return;const dx=t.clientX-touch.x,dy=(t.clientY-touch.y)*direction;if(dy>0&&dy>=Math.abs(dx)*.8&&e.cancelable)e.preventDefault()};
 const touchEnd=()=>{touch=null};
 root.addEventListener('touchstart',touchDown,{passive:true});root.addEventListener('touchmove',touchMove,{passive:false});root.addEventListener('touchend',touchEnd);root.addEventListener('touchcancel',touchEnd);
 const hidden=()=>{if(root.ownerDocument.hidden)clear()},resize=()=>{if(width!==win.innerWidth||height!==win.innerHeight){width=win.innerWidth;height=win.innerHeight;clear()}};
 // Capture observes descendant focus blur too. Focusing the calculator after
 // returning from a panel must not cancel the pointerdown that caused it.
 const blur=e=>{if(e.target===win)clear()};
 const events=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',clear],['lostpointercapture',e=>{if(start?.id===e.pointerId)clear()}],['blur',blur],['resize',resize],['pagehide',clear],['click',click]];
 for(const [name,fn]of events)win.addEventListener(name,fn,true);root.ownerDocument.addEventListener('visibilitychange',hidden);
 return()=>{clear();root.removeEventListener('touchstart',touchDown);root.removeEventListener('touchmove',touchMove);root.removeEventListener('touchend',touchEnd);root.removeEventListener('touchcancel',touchEnd);for(const [name,fn]of events)win.removeEventListener(name,fn,true);root.ownerDocument.removeEventListener('visibilitychange',hidden)};
}
