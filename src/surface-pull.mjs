import {createDirectionalDrag} from './directional-drag.mjs';
// Track only pointers that start inside this surface. Other global listeners
// merely finish/cancel that gesture; scrollable content keeps native scrolling.
export function attachSurfacePull(root,{onPull,enabled=()=>true,scrollSelector,onProgress=()=>{}}){
 const win=root.ownerDocument.defaultView,tracker=createDirectionalDrag(1);
 const host=root.closest('.calculator')||root;let start=null;
 const clear=()=>{tracker.cancel();start=null;touch=null;onProgress(0)};
 const block=()=>{host.dataset.swipeClickBlocked='1'};
 const down=e=>{
  if(root.contains(e.target))host.dataset.swipeClickBlocked='0';
  if(start&&start.id!==e.pointerId){tracker.cancel();onProgress(0);start.moved=true;return}
  if(!enabled()||!root.contains(e.target)||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(scrollSelector){const scroller=e.target.closest(scrollSelector);if(scroller&&scroller.scrollTop>1)return}
  if(tracker.down(e))start={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
 };
 const move=e=>{if(start?.id!==e.pointerId)return;start.moved ||= Math.hypot(e.clientX-start.x,e.clientY-start.y)>12;tracker.move(e);onProgress(tracker.active()&&tracker.distance()>12?tracker.distance():0)};
 const up=e=>{if(start?.id!==e.pointerId)return;move(e);const distance=Math.max(0,e.clientY-start.y),accepted=enabled()&&tracker.up(e),moved=start.moved;clear();if(moved||accepted)block();if(accepted)onPull({distance})};
 const click=e=>{if(e.detail!==0&&host.dataset.swipeClickBlocked==='1'){host.dataset.swipeClickBlocked='0';e.preventDefault();e.stopImmediatePropagation()}};
 // Safari may reserve native panning before pointerup. At the menu's
 // scroll boundary reserve only the downward finger movement, never body scrolling.
 let touch=null;
 const touchDown=e=>{touch=null;if(!scrollSelector||!enabled()||e.touches.length!==1||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;const scroller=e.target.closest(scrollSelector);if(scroller&&scroller.scrollTop<=1){const t=e.touches[0];touch={id:t.identifier,x:t.clientX,y:t.clientY}}};
 const touchMove=e=>{if(!touch||e.touches.length!==1){touch=null;return}const t=e.touches[0];if(t.identifier!==touch.id)return;const dx=t.clientX-touch.x,dy=t.clientY-touch.y;if(dy>0&&Math.abs(dx)<=24&&dy>Math.abs(dx)&&e.cancelable)e.preventDefault()};
 const touchEnd=()=>{touch=null};
 root.addEventListener('touchstart',touchDown,{passive:true});root.addEventListener('touchmove',touchMove,{passive:false});root.addEventListener('touchend',touchEnd);root.addEventListener('touchcancel',touchEnd);
 const hidden=()=>{if(root.ownerDocument.hidden)clear()};
 const events=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',clear],['blur',clear],['resize',clear],['pagehide',clear],['click',click]];
 for(const [name,fn]of events)win.addEventListener(name,fn,true);root.ownerDocument.addEventListener('visibilitychange',hidden);
 return()=>{clear();root.removeEventListener('touchstart',touchDown);root.removeEventListener('touchmove',touchMove);root.removeEventListener('touchend',touchEnd);root.removeEventListener('touchcancel',touchEnd);for(const [name,fn]of events)win.removeEventListener(name,fn,true);root.ownerDocument.removeEventListener('visibilitychange',hidden)};
}
