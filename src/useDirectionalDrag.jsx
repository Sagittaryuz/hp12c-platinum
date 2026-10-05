import {useEffect,useRef} from 'react';
import {createDirectionalDrag} from './directional-drag.mjs';
export function useDirectionalDrag(direction,onDrag,enabled=true,onProgress=()=>{}){
 const latest=useRef({onDrag,onProgress});latest.current={onDrag,onProgress};
 const tracker=useRef(null);if(!tracker.current)tracker.current=createDirectionalDrag(direction);
 useEffect(()=>{const t=tracker.current,cancel=()=>{t.cancel();latest.current.onProgress(0)},other=e=>{t.other(e);if(!t.active())latest.current.onProgress(0)};document.addEventListener('pointerdown',other,true);window.addEventListener('blur',cancel);window.addEventListener('resize',cancel);window.addEventListener('pagehide',cancel);document.addEventListener('visibilitychange',cancel);return()=>{cancel();document.removeEventListener('pointerdown',other,true);window.removeEventListener('blur',cancel);window.removeEventListener('resize',cancel);window.removeEventListener('pagehide',cancel);document.removeEventListener('visibilitychange',cancel)}},[]);
 useEffect(()=>{if(!enabled)tracker.current.cancel()},[enabled]);
 return {onPointerDown:e=>{if(!enabled||e.target.closest('button,a,input,select,textarea,[role="button"]'))return;if(tracker.current.down(e)){try{e.currentTarget.setPointerCapture(e.pointerId)}catch{tracker.current.cancel()}}},onPointerMove:e=>{tracker.current.move(e);latest.current.onProgress(tracker.current.active()?tracker.current.distance():0)},onPointerUp:e=>{if(tracker.current.up(e))latest.current.onDrag();else latest.current.onProgress(0)},onPointerCancel:()=>{tracker.current.cancel();latest.current.onProgress(0)},onLostPointerCapture:()=>{if(tracker.current.active()){tracker.current.cancel();latest.current.onProgress(0)}}};
}
