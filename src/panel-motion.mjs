// Memória's approved timing is shared by both retractable panels.
export const PANEL_DURATION=260;
export const PANEL_EASING='cubic-bezier(.2,.7,.2,1)';
export const PANEL_CANCEL_DURATION=160;
export function animatePanel(el,keyframes,duration=PANEL_DURATION,{onFrame}={}){
 const win=el.ownerDocument.defaultView,reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 if(reduced||!el.animate){Object.assign(el.style,keyframes.at(-1));onFrame?.(1);return {cancel(){},finished:Promise.resolve()}}
 const animation=el.animate(keyframes,{duration,easing:PANEL_EASING,fill:'both'});
 let frame,timer,cancelled=false;
 // WAAPI progress includes the approved easing. It describes the same
 // geometry without flushing computed transform/layout after filter writes.
 const progress=()=>animation.effect?.getComputedTiming().progress??(animation.playState==='finished'?1:0);
 const sample=()=>{if(cancelled)return;onFrame(progress());frame=win.requestAnimationFrame(sample)};
 const stopFrame=()=>{if(frame!==undefined)win.cancelAnimationFrame(frame)};
 if(onFrame){onFrame(progress());if(win.requestAnimationFrame)frame=win.requestAnimationFrame(sample)}
 // A stalled frame clock must not leave a dismissed panel intercepting touches.
 const complete=()=>{if(animation.playState==='paused'){timer=win.setTimeout(complete,duration+150);return}if(animation.playState==='running')animation.finish()};
 timer=win.setTimeout(complete,duration+150);
 const finished=animation.finished.then(()=>{if(!cancelled)onFrame?.(1)}).finally(()=>{win.clearTimeout(timer);stopFrame()});
 // Cancellation transfers the current geometry to the next gesture; it must
 // not write an old animation's target blur over the new owner.
 return {finished,cancel(){cancelled=true;win.clearTimeout(timer);stopFrame();animation.cancel()}};
}
export function panelCoverage(offset,height){return height>0?Math.max(0,Math.min(1,1-Math.abs(offset)/height)):0}
export function blurForCoverage(coverage){
 const p=Math.max(0,Math.min(1,Number.isFinite(coverage)?coverage:0));
 if(p<=.05||p>=.95)return 0;
 const t=(Math.min(p,1-p)-.05)/.45;
 return 3*t*t*(3-2*t);
}
const pullBlurValues=new WeakMap();
export function setRevealBlur(coverage){
 const amount=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:blurForCoverage(coverage);
 const rounded=Number(amount.toFixed(3)),value=rounded?`blur(${rounded}px)`:'';
 const root=document.querySelector('.calculator');if(!root||pullBlurValues.get(root)===value)return;
 pullBlurValues.set(root,value);
 for(const el of root.querySelectorAll(':scope > :is(.silver-panel,.lcd,.keyboard-crossbar,.keyboard-frame,.keyboard-panel,.portrait-footer-frame,.keys,.brackets,.maker-strip)'))el.style.filter=value;
}
