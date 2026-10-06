import {useLayoutEffect,useRef} from 'react';
import {animatePanel,setRevealBlur,panelCoverage,PANEL_DURATION,PANEL_CANCEL_DURATION} from './panel-motion.mjs';
export function usePanelMotion(surface,direction,onClosed,start=0){
 const state=useRef({alive:true,closing:false,dragging:false,base:0,y:0,animation:null,generation:0});
 const latest=useRef(onClosed);latest.current=onClosed;
 const stop=()=>{state.current.generation++;state.current.animation?.cancel();state.current.animation=null};
 const visual=el=>{const value=getComputedStyle(el).transform;return value==='none'?0:new DOMMatrixReadOnly(value).m42};
 const settle=(target,closing,duration=PANEL_DURATION)=>{
  const s=state.current,el=surface.current;if(!el)return;const from=visual(el);stop();s.closing=closing;s.dragging=false;s.base=0;s.y=target;
  el.dataset.closing=String(closing);el.style.transform=`translate3d(0,${target}px,0)`;
  setRevealBlur(panelCoverage(from,el.clientHeight));
  const generation=s.generation,a=animatePanel(el,[{transform:`translate3d(0,${from}px,0)`},{transform:`translate3d(0,${target}px,0)`}],duration,{onFrame:()=>setRevealBlur(panelCoverage(visual(el),el.clientHeight))});s.animation=a;
  a.finished.then(()=>{if(!s.alive||generation!==s.generation)return;stop();setRevealBlur(0);if(closing)latest.current();else el.style.transform=''}).catch(()=>{});
 };
 const begin=()=>{const s=state.current,el=surface.current;if(!el)return;const from=visual(el);stop();s.closing=false;s.dragging=true;s.base=from;s.y=from;el.dataset.closing='false';el.style.transform=`translate3d(0,${from}px,0)`;setRevealBlur(panelCoverage(from,el.clientHeight))};
 const progress=(distance,phase)=>{const s=state.current,el=surface.current;if(!el)return;if(!distance&&!phase?.active){if(s.dragging){s.dragging=false;settle(0,false,PANEL_CANCEL_DURATION)}return}if(!s.dragging)begin();const raw=s.base+direction*distance,y=direction<0?Math.max(-el.clientHeight,Math.min(0,raw)):Math.min(el.clientHeight,Math.max(0,raw));s.y=y;el.style.transform=`translate3d(0,${y}px,0)`;setRevealBlur(panelCoverage(y,el.clientHeight))};
 const close=()=>{const el=surface.current;if(el&&!state.current.closing)settle(direction*el.clientHeight,true)};
 useLayoutEffect(()=>{
  const s=state.current,el=surface.current;s.alive=true;s.closing=false;s.dragging=false;
  if(el.tagName==='DIALOG'&&!el.open)el.showModal();
  const height=el.clientHeight,from=direction*Math.max(0,height-Math.min(height,start));
  el.style.transform=`translate3d(0,${from}px,0)`;settle(0,false);
  let width=el.clientWidth,h=el.clientHeight;
  const reset=()=>{stop();if(s.closing){setRevealBlur(0);latest.current()}else{s.dragging=false;s.base=0;s.y=0;el.style.transform='';setRevealBlur(0)}};
  const resize=()=>{if(width!==el.clientWidth||h!==el.clientHeight){width=el.clientWidth;h=el.clientHeight;reset()}};
  const media=window.matchMedia('(prefers-reduced-motion: reduce)'),preference=()=>{if(media.matches)reset()};
  window.addEventListener('resize',resize);media.addEventListener('change',preference);
  return()=>{s.alive=false;stop();setRevealBlur(0);window.removeEventListener('resize',resize);media.removeEventListener('change',preference)};
 },[surface]);
 return {close,progress,begin};
}
