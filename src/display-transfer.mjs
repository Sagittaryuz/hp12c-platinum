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
// Hold is classified at release, not a timer: touch pointerup supplies fresh iOS activation.
export function bindDisplayGestures(el,activate,{win=window,doc=document,now=()=>performance.now(),holdMs=500,slop=10}={}) {
  let gesture=null, contacts=new Set(),blockedClick=false;
  const inside=e=>{const r=el.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};
  const cancel=()=>{gesture=null;};
  const down=e=>{
    contacts.add(e.pointerId);
    if(contacts.size>1){cancel();return;}
    if(!el.contains(e.target)||e.button!==0||e.isPrimary===false)return;
    blockedClick=true;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,time:now()};
    try{el.setPointerCapture(e.pointerId)}catch{}
  };
  const move=e=>{if(gesture?.id===e.pointerId && (Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>slop||!inside(e)))cancel();};
  const up=e=>{
    contacts.delete(e.pointerId);
    if(gesture?.id!==e.pointerId)return;
    const g=gesture;cancel();
    if(inside(e)&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<=slop)activate(now()-g.time>=holdMs);
  };
  const aborted=e=>{contacts.delete(e.pointerId);cancel();};
  const reset=()=>{cancel();contacts.clear();};
  const visibility=()=>{if(doc.hidden)reset();};
  const click=e=>{e.preventDefault();e.stopPropagation();if(blockedClick&&(e.detail!==0||e.pointerType))return;activate(false);};
  const key=e=>{
    if(e.key==='Escape'){cancel();return;}
    if(['Enter',' '].includes(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopPropagation();if(!e.repeat)activate(Boolean(e.shiftKey));}
  };
  const context=e=>e.preventDefault();
  const bindings=[[win,'pointerdown',down,true],[win,'pointermove',move,true],[win,'pointerup',up,true],[win,'pointercancel',aborted,true],[win,'blur',reset],[win,'pagehide',reset],[doc,'visibilitychange',visibility],[el,'lostpointercapture',cancel],[el,'click',click],[el,'keydown',key],[el,'contextmenu',context]];
  bindings.forEach(([target,type,handler,capture])=>target.addEventListener(type,handler,{capture:Boolean(capture)}));
  return()=>bindings.forEach(([target,type,handler,capture])=>target.removeEventListener(type,handler,{capture:Boolean(capture)}));
}
