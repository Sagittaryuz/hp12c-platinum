import {useEffect,useRef} from 'react';
import {createDirectionalDrag} from './directional-drag.mjs';
export function useDirectionalDrag(direction,onDrag,enabled=true){
 const latest=useRef(onDrag);latest.current=onDrag;
 const tracker=useRef(null);if(!tracker.current)tracker.current=createDirectionalDrag(direction);
 useEffect(()=>{const t=tracker.current,cancel=()=>t.cancel(),other=e=>t.other(e);document.addEventListener('pointerdown',other,true);window.addEventListener('blur',cancel);window.addEventListener('resize',cancel);window.addEventListener('pagehide',cancel);document.addEventListener('visibilitychange',cancel);return()=>{cancel();document.removeEventListener('pointerdown',other,true);window.removeEventListener('blur',cancel);window.removeEventListener('resize',cancel);window.removeEventListener('pagehide',cancel);document.removeEventListener('visibilitychange',cancel)}},[]);
 useEffect(()=>{if(!enabled)tracker.current.cancel()},[enabled]);
 return {onPointerDown:e=>{if(!enabled||e.target.closest('button,a,input,select,textarea,[role="button"]'))return;if(tracker.current.down(e)){try{e.currentTarget.setPointerCapture(e.pointerId)}catch{tracker.current.cancel()}}},onPointerMove:e=>tracker.current.move(e),onPointerUp:e=>{if(tracker.current.up(e))latest.current()},onPointerCancel:()=>tracker.current.cancel(),onLostPointerCapture:()=>tracker.current.cancel()};
}
