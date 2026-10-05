export function animatePanel(el,keyframes,duration=260){
 const win=el.ownerDocument.defaultView,reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 if(reduced||!el.animate){Object.assign(el.style,keyframes.at(-1));return {cancel(){},finished:Promise.resolve()}}
 return el.animate(keyframes,{duration,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});
}
