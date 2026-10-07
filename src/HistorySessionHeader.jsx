import {historyDateLabel} from './history-dates.mjs';
export function HistorySessionHeader({session,now,copyState}){
 const time=session.end||session.start,feedback=copyState?.id===session.id?copyState:null;
 return <><span className="history-rule" aria-hidden="true"/><div className="history-session-label"><time dateTime={time} title={new Date(time).toLocaleString('pt-BR')}>{historyDateLabel(time,now)}</time><small>{session.closed?'Bloco encerrado':'Bloco em andamento'}{session.partial?' · Início parcial':''}</small></div>
 <div className="history-copy-control"><button data-history-action="copy" data-history-id={session.id} aria-label={`Copiar bloco de ${session.entries.length} ${session.entries.length===1?'operação':'operações'}`}>Copiar</button>{feedback?.copied&&<span key={feedback.nonce} className="history-copied" role="status">Copiado</span>}{feedback?.failed&&<span role="alert">Não foi possível copiar.</span>}</div><span className="history-rule" aria-hidden="true"/></>;
}
