import {useEffect,useRef,useState} from 'react';
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
      busy.current=true;clearTimeout(timer.current);setMessage('');
      transferDisplay(current.current.display,share).then(result=>{
        if(!alive.current)return;
        if(!result.copied)setManual(result.text);
        let text=result.copied?'Valor copiado.':'Cópia automática indisponível. Selecione o valor para copiar.';
        if(result.shared==='unavailable')text+=' Compartilhamento indisponível neste navegador.';
        if(result.shared==='failed')text+=' Não foi possível abrir o compartilhamento.';
        setMessage(text);timer.current=setTimeout(()=>setMessage(''),4000);
      }).finally(()=>{busy.current=false});
    });
    return()=>{alive.current=false;detach();clearTimeout(timer.current)};
  },[manual,disabled]);
  return {ref,message,manual,closeManual:()=>{restoreFocus.current=true;setManual(null)}};
}
export function DisplayTransferFeedback({message,manual,closeManual}){
  const dialog=useRef(null),field=useRef(null);
  useEffect(()=>{if(manual!==null){dialog.current.showModal();field.current.focus();field.current.select()}},[manual]);
  return <>
    <span id="lcd-transfer-help" className="lcd-readable">Toque para copiar. Segure por meio segundo e solte para copiar e compartilhar. Teclado: Enter ou espaço copia; Shift junto compartilha.</span>
    <div role="status" aria-live="polite" aria-atomic="true" className="lcd-transfer-status">{message}</div>
    {manual!==null&&<dialog ref={dialog} className="lcd-transfer-dialog" aria-labelledby="lcd-manual-title" onCancel={closeManual}>
      <p id="lcd-manual-title">Selecione o valor para copiar</p>
      <textarea ref={field} readOnly value={manual} aria-label="Valor mostrado no visor"/>
      <button onClick={closeManual}>Fechar</button>
    </dialog>}
  </>;
}
