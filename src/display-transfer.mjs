// Start both protected APIs synchronously in the release event: share consumes activation.
export function transferDisplay(text, share, {nav=globalThis.navigator,doc=globalThis.document}={}) {
  let copy;
  try {
    if (nav.clipboard?.writeText) copy=Promise.resolve(nav.clipboard.writeText(text)).then(()=>true,()=>false);
    else copy=Promise.resolve(legacyCopy(text,doc));
  } catch { copy=Promise.resolve(false); }
  let sharing=Promise.resolve('none');
  if (share) {
    try {
      sharing=typeof nav.share==='function' && (!nav.canShare || nav.canShare({text}))
        ? Promise.resolve(nav.share({text})).then(()=>'shared',e=>e?.name==='AbortError'?'cancelled':'failed')
        : Promise.resolve('unavailable');
    } catch(e) { sharing=Promise.resolve(e?.name==='AbortError'?'cancelled':'failed'); }
  }
  return Promise.all([copy,sharing]).then(([copied,shared])=>({copied,shared,text}));
}
export function legacyCopy(text,doc) {
  const focused=doc.activeElement, selection=doc.getSelection?.();
  const caret=focused && typeof focused.selectionStart==='number' ? [focused.selectionStart,focused.selectionEnd,focused.selectionDirection] : null;
  const ranges=selection ? Array.from({length:selection.rangeCount},(_,i)=>selection.getRangeAt(i).cloneRange()) : [];
  const field=doc.createElement('textarea');field.value=text;field.readOnly=true;
  field.setAttribute('aria-hidden','true');field.style.cssText='position:fixed;top:0;left:0;opacity:0;font-size:16px;pointer-events:none';
  try { doc.body.append(field);field.focus({preventScroll:true});field.select();return doc.execCommand?.('copy')===true; }
  catch { return false; }
  finally {field.remove();focused?.focus?.({preventScroll:true});if(selection){selection.removeAllRanges();ranges.forEach(r=>selection.addRange(r));}if(caret)focused.setSelectionRange?.(...caret);}
}
// A single click copies the displayed number. Pointer guards only cancel drags; duration is irrelevant.
export function bindDisplayGestures(el,activate,{win=window,doc=document,slop=8}={}) {
 let gesture=null,blocked=false;
 const inside=e=>{const r=el.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};
 const reset=()=>{gesture=null;blocked=true};
 const down=e=>{if(e.button!==0||e.isPrimary===false){reset();return}blocked=false;gesture={id:e.pointerId,x:e.clientX,y:e.clientY};try{el.setPointerCapture(e.pointerId)}catch{}};
 const move=e=>{if(gesture?.id===e.pointerId&&(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>slop||!inside(e)))reset()};
 const up=e=>{if(gesture?.id!==e.pointerId)return;move(e);gesture=null};
 const click=e=>{e.preventDefault();e.stopPropagation();if(blocked&&(e.detail!==0||e.pointerType))return;activate(false)};
 const key=e=>{if(e.key==='Escape'){reset();return}if(['Enter',' '].includes(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopPropagation();if(!e.repeat)activate(false)}};
 let width=win.innerWidth,height=win.innerHeight;
 const resized=()=>{if(width!==win.innerWidth||height!==win.innerHeight){width=win.innerWidth;height=win.innerHeight;reset()}};
 const hidden=()=>{if(doc.hidden)reset()};
 const context=e=>e.preventDefault();
 const bindings=[[el,'pointerdown',down],[el,'pointermove',move],[el,'pointerup',up],[el,'pointercancel',reset],[el,'click',click],[el,'keydown',key],[el,'contextmenu',context],[win,'blur',reset],[win,'pagehide',reset],[win,'resize',resized],[doc,'visibilitychange',hidden]];
 bindings.forEach(([target,type,handler])=>target.addEventListener(type,handler));
 return()=>bindings.forEach(([target,type,handler])=>target.removeEventListener(type,handler));
}