import {useLayoutEffect,useRef} from 'react';
export function HistoryDialog({label,onClose,children}){
 const ref=useRef(null),lastFocus=useRef(document.activeElement),closeRef=useRef(onClose);closeRef.current=onClose;
 useLayoutEffect(()=>{
  const dialog=ref.current,viewport=window.visualViewport;
  const size=()=>{dialog.style.setProperty('--history-dialog-height',(viewport?.height||window.innerHeight)+'px');dialog.style.setProperty('--history-dialog-top',(viewport?.offsetTop||0)+'px')};
  size();dialog.showModal();dialog.querySelector('[data-initial-focus]')?.focus({preventScroll:true});
  viewport?.addEventListener('resize',size);viewport?.addEventListener('scroll',size);window.addEventListener('resize',size);
  return()=>{viewport?.removeEventListener('resize',size);viewport?.removeEventListener('scroll',size);window.removeEventListener('resize',size);dialog.close();queueMicrotask(()=>{if(dialog.isConnected&&dialog.open)return;const target=lastFocus.current;target?.isConnected&&target.focus({preventScroll:true})})};
 },[]);
 return <dialog ref={ref} className="history-dialog" aria-label={label} onCancel={e=>{e.preventDefault();e.stopPropagation();closeRef.current()}} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();closeRef.current()}}}>{children}</dialog>;
}
