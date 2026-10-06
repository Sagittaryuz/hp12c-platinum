import {historyDateLabel} from './history-dates.mjs';
export function HistorySessionHeader({session,now}){
 const time=session.end||session.start;
 return <>
  <span className="history-rule" aria-hidden="true"/>
  <div className="history-session-label"><time dateTime={time} title={new Date(time).toLocaleString('pt-BR')}>{historyDateLabel(time,now)}</time><small>{session.closed?'Bloco encerrado por CLx':'Bloco em andamento'}{session.partial?' · Início parcial':''}</small></div>
  <button className="history-share-button history-session-share" data-history-action="share" data-history-id={session.id} aria-label={`Compartilhar bloco de ${session.entries.length} ${session.entries.length===1?'operação':'operações'}`}>
   <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M5 13v8h14v-8"/></svg>
  </button>
  <span className="history-rule" aria-hidden="true"/>
 </>;
}
