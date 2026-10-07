import {Component,useLayoutEffect,useRef,useState,useEffect} from 'react';
import {usePanelMotion} from './usePanelMotion';
import {useSurfacePull} from './useSurfacePull';
import {useHistoryActions} from './useHistoryActions';
import {HistoryCalculation} from './HistoryCalculation';
import {useLocalNow} from './useLocalNow';
import {HistorySessionHeader} from './HistorySessionHeader';
import {MemoryRegisters} from './MemoryRegisters';
import {transferDisplay} from './display-transfer.mjs';
import {historySessionText} from './history-sharing.mjs';
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
 render(){const {history,sessions,surface,now,copyState,state,onEditMemory}=this.props;return <div ref={surface} className="history-board-lines" tabIndex={0} aria-label="Histórico de operações, até 100 linhas">
  <MemoryRegisters state={state} onEdit={onEditMemory}/>{!sessions.length&&<p>Nenhuma operação registrada.</p>}
  <ol>{[...sessions].reverse().flatMap(session=>[
   <li key={session.id} data-history-id={session.id} className="history-separator history-session-header"><HistorySessionHeader session={session} now={now} copyState={copyState}/></li>,
   ...[...session.entries].reverse().map(item=><li key={item.id} data-history-id={item.id} className="history-calculation-row"><HistoryCalculation item={item} now={now}/></li>)
  ])}</ol>
 </div>}
}
export function HistoryBoard({state,onEditMemory,history,sessions,onClose,onHistoryAction,noteModalOpen=false,revealStart=0}){
 const dialog=useRef(null),close=useRef(null),lines=useRef(null),lastFocus=useRef(document.activeElement);
 const motion=usePanelMotion(dialog,-1,onClose,revealStart);
  const now=useLocalNow(),[copyState,setCopyState]=useState(null),copyLifetime=useRef({alive:true,busy:false,timer:null});
 useEffect(()=>{const s=copyLifetime.current;s.alive=true;return()=>{s.alive=false;clearTimeout(s.timer)}},[]);
 useHistoryActions(dialog,(kind,id)=>{if(kind!=='copy'){onHistoryAction(kind,id);return}const s=copyLifetime.current,session=sessions.find(session=>session.id===id);if(!session||s.busy)return;s.busy=true;transferDisplay(historySessionText(session,true),false).then(result=>{if(!s.alive)return;clearTimeout(s.timer);setCopyState({id,copied:result.copied,failed:!result.copied,nonce:performance.now()});s.timer=setTimeout(()=>setCopyState(null),1600)}).finally(()=>{s.busy=false})});
 useSurfacePull(dialog,motion.close,!noteModalOpen,undefined,motion.progress,{direction:-1,freeMotion:true,ignoreSelector:'.history-board-lines',onStart:motion.begin});
 useLayoutEffect(()=>{const previous=lastFocus.current;if(!dialog.current.open)dialog.current.showModal();close.current.focus({preventScroll:true});lines.current.scrollTop=0;return()=>{dialog.current?.close();queueMicrotask(()=>{const target=previous?.isConnected?previous:document.querySelector('.brand');target?.focus?.({preventScroll:true})})}},[]);
 return <dialog ref={dialog} className="history-board" aria-labelledby="history-board-title" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();motion.close()}}} onCancel={e=>{e.preventDefault();motion.close()}}>
  <span className="panel-reveal-bar" aria-hidden="true"/>
  <header className="history-board-heading"><h1 id="history-board-title">Memória</h1></header>
  <HistoryLines history={history} sessions={sessions} surface={lines} now={now} state={state} onEditMemory={onEditMemory} copyState={copyState}/>
  <footer className="history-board-handle"><button ref={close} onClick={motion.close} aria-label="Voltar à calculadora"><span aria-hidden="true">⌃</span> Puxe para cima para voltar</button></footer>
 </dialog>;
}
