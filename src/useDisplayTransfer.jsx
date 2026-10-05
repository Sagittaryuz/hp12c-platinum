import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {bindDisplayGestures,transferDisplay} from './display-transfer.mjs';
export function useDisplayTransfer(display,disabled){
  const ref=useRef(null),current=useRef({display,disabled}),busy=useRef(false),alive=useRef(false),timer=useRef(null),restoreFocus=useRef(false);
  current.current={display,disabled};
  const [message,setMessage]=useState(''),[manual,setManual]=useState(null);
  useEffect(()=>{
    alive.current=true;
    if(manual===null&&restoreFocus.current){restoreFocus.current=false;ref.current?.focus({preventScroll:true})}
    const detach=bindDisplayGestures(ref.current,share=>{
      if(current.current.disabled||busy.current||manual!==null)return;
      busy.current=true;clearTimeout(timer.current);
      // Clear the visible toast before the native sheet captures its background.
      // Synchronous rendering preserves the gesture's transient activation.
      if(share)flushSync(()=>setMessage(''));else setMessage('');
      transferDisplay(current.current.display,share).then(result=>{
        if(!alive.current)return;
        if(!result.copied)setManual(result.text);
        let text=result.copied?(share?'':'Valor copiado.'):'Cópia automática indisponível. Selecione o valor para copiar.';
        if(result.shared==='unavailable')text+=' Compartilhamento indisponível neste navegador.';
        if(result.shared==='failed')text+=' Não foi possível abrir o compartilhamento.';
        setMessage(text.trim());if(text.trim())timer.current=setTimeout(()=>setMessage(''),4000);
      }).finally(()=>{busy.current=false});
    });
    return()=>{alive.current=false;detach();clearTimeout(timer.current)};
  },[manual,disabled]);
  return {ref,message,manual,closeManual:()=>{restoreFocus.current=true;setManual(null)}};
}
export function DisplayTransferFeedback({message,manual,closeManual}){
  const dialog=useRef(null),field=useRef(null),success=useRef(null);
  const copied=message.startsWith('Valor copiado.');
  useLayoutEffect(()=>{
    if(!copied)return;
    const model=success.current.closest('.calculator').querySelector('.model-name');
    const brand=success.current.closest('.calculator').querySelector('.brand');
    const position=()=>{
      const a=model.getBoundingClientRect(),b=brand.getBoundingClientRect();
      const gap=Math.max(0,b.left-a.right);
      Object.assign(success.current.style,{
        left:`${(a.right+b.left)/2}px`,
        top:`${(Math.min(a.top,b.top)+Math.max(a.bottom,b.bottom))/2}px`,
        maxWidth:`${Math.max(0,gap-8)}px`,
        paddingBlock:`${Math.min(4,Math.max(0,(Math.max(a.bottom,b.bottom)-Math.min(a.top,b.top)-14)/2))}px`
      });
    };
    position();const observer=new ResizeObserver(position);observer.observe(model);observer.observe(brand);
    window.addEventListener('resize',position);window.visualViewport?.addEventListener('resize',position);
    window.visualViewport?.addEventListener('scroll',position);
    return()=>{observer.disconnect();window.removeEventListener('resize',position);window.visualViewport?.removeEventListener('resize',position);window.visualViewport?.removeEventListener('scroll',position)};
  },[copied]);
  useEffect(()=>{if(manual!==null){dialog.current.showModal();field.current.focus();field.current.select()}},[manual]);
  return <>
    <span id="lcd-transfer-help" className="lcd-readable">Toque para copiar. Segure por meio segundo e solte para copiar e compartilhar. Teclado: Enter ou espaço copia; Shift junto compartilha.</span>
    <div role="status" aria-live="polite" aria-atomic="true" className="lcd-transfer-status">
      {copied?<><span ref={success} className="lcd-copy-success">Valor copiado.</span>{message.slice(14).trim()&&<span className="lcd-transfer-notice">{message.slice(14)}</span>}</>:message&&<span className="lcd-transfer-notice">{message}</span>}
    </div>
    {manual!==null&&<dialog ref={dialog} className="lcd-transfer-dialog" aria-labelledby="lcd-manual-title" onCancel={closeManual}>
      <p id="lcd-manual-title">Selecione o valor para copiar</p>
      <textarea ref={field} readOnly value={manual} aria-label="Valor mostrado no visor"/>
      <button onClick={closeManual}>Fechar</button>
    </dialog>}
  </>;
}
