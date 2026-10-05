import {Component,useLayoutEffect,useRef} from 'react';
import {historyNewestFirst} from './hp-panel-state.mjs';
import {usePanelMotion} from './usePanelMotion';
import {useDirectionalDrag} from './useDirectionalDrag';
// Read the anchor before React changes the rows, independently of delayed native
// scroll events. Updating the list must not move a reader inspecting older rows.
class HistoryLines extends Component{
 getSnapshotBeforeUpdate(previous){
  if(previous.history===this.props.history)return null;
  const el=this.props.surface.current;if(el.scrollTop<=1)return {top:true};
  const top=el.getBoundingClientRect().top,row=[...el.querySelectorAll('li')].find(r=>r.getBoundingClientRect().bottom>top);
  return row?{id:row.dataset.historyId,offset:row.getBoundingClientRect().top-top}:null;
 }
 componentDidUpdate(previous,state,anchor){
  const el=this.props.surface.current;if(anchor?.top){el.scrollTop=0;return}
  if(anchor){const row=[...el.querySelectorAll('li')].find(r=>r.dataset.historyId===anchor.id);if(row)el.scrollTop+=row.getBoundingClientRect().top-el.getBoundingClientRect().top-anchor.offset}
 }
 render(){const {history,surface}=this.props;return <div ref={surface} className="history-board-lines" tabIndex={0} aria-label="Histórico de operações, até 100 linhas">
  {!history.length&&<p>Nenhuma operação registrada.</p>}
  <ol>{historyNewestFirst(history).map(item=><li key={item.id} data-history-id={item.id} className={item.kind==='separator'?'history-separator':''}>{item.kind==='separator'?<><span className="history-rule" aria-label={item.operation}/><time dateTime={item.time}>{new Date(item.time).toLocaleString('pt-BR')}</time></>:<><span>{item.operation}</span><strong>= {item.display}</strong></>}</li>)}</ol>
 </div>}
}
export function HistoryBoard({history,onClose,revealStart=0}){
 const dialog=useRef(null),close=useRef(null),lines=useRef(null),lastFocus=useRef(document.activeElement);
 const motion=usePanelMotion(dialog,-1,onClose,revealStart),drag=useDirectionalDrag(-1,motion.close,true,motion.progress);
 useLayoutEffect(()=>{const previous=lastFocus.current;if(!dialog.current.open)dialog.current.showModal();close.current.focus({preventScroll:true});lines.current.scrollTop=0;return()=>{dialog.current?.close();queueMicrotask(()=>{const target=previous?.isConnected?previous:document.querySelector('.brand');target?.focus?.({preventScroll:true})})}},[]);
 return <dialog ref={dialog} className="history-board" aria-labelledby="history-board-title" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();motion.close()}}} onCancel={e=>{e.preventDefault();motion.close()}}>
  <span className="panel-reveal-bar" aria-hidden="true"/>
  <header className="history-board-handle" {...drag}><div><h1 id="history-board-title">Quadro negro</h1><p>Puxe esta faixa para cima para voltar</p></div><button ref={close} onClick={motion.close}>Voltar à calculadora</button></header>
  <HistoryLines history={history} surface={lines}/>
 </dialog>;
}
