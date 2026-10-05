import {useEffect,useRef} from 'react';
import {useDirectionalDrag} from './useDirectionalDrag';
export function HistoryBoard({history,onClose}){
 const dialog=useRef(null),close=useRef(null),drag=useDirectionalDrag(-1,onClose);
 useEffect(()=>{const previous=document.activeElement;dialog.current.showModal();close.current.focus();return()=>{dialog.current?.close();queueMicrotask(()=>previous?.focus?.())}},[]);
 return <dialog ref={dialog} className="history-board" aria-labelledby="history-board-title" onCancel={e=>{e.preventDefault();onClose()}}>
  <header className="history-board-handle" {...drag}><div><h1 id="history-board-title">Quadro negro</h1><p>Puxe esta faixa para cima para voltar</p></div><button ref={close} onClick={onClose}>Voltar à calculadora</button></header>
  <div className="history-board-lines" tabIndex={0} aria-label="Histórico de operações, até 100 linhas">
   {!history.length&&<p>Nenhuma operação registrada.</p>}
   <ol>{history.map(item=><li key={item.id} className={item.kind==='separator'?'history-separator':''}>{item.kind==='separator'?<><span className="history-rule" aria-label={item.operation}/><time dateTime={item.time}>{new Date(item.time).toLocaleString('pt-BR')}</time></>:<><span>{item.operation}</span><strong>= {item.display}</strong></>}</li>)}</ol>
  </div>
 </dialog>;
}
