export function animatePanel(el,keyframes,duration=260){
 const win=el.ownerDocument.defaultView,reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 if(reduced||!el.animate){Object.assign(el.style,keyframes.at(-1));return {cancel(){},finished:Promise.resolve()}}
 const animation=el.animate(keyframes,{duration,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});
 // A stalled frame clock must not leave a dismissed panel intercepting touches.
 let timer;
 const complete=()=>{if(animation.playState==='paused'){timer=win.setTimeout(complete,duration+150);return}if(animation.playState==='running')animation.finish()};
 timer=win.setTimeout(complete,duration+150);
 const finished=animation.finished.finally(()=>win.clearTimeout(timer));
 return {finished,cancel(){win.clearTimeout(timer);animation.cancel()}};
}
const pullBlurValues=new WeakMap();
export function setPullBlur(distance){
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const value=reduce||!distance?'':`blur(${Math.min(3,distance/12)}px)`;
 const root=document.querySelector('.calculator');if(!root||pullBlurValues.get(root)===value)return;
  pullBlurValues.set(root,value);
  for(const el of root.querySelectorAll(':scope > :is(.silver-panel,.lcd,.keyboard-crossbar,.keyboard-frame,.keyboard-panel,.portrait-footer-frame,.keys,.brackets,.maker-strip)'))el.style.filter=value;
}
