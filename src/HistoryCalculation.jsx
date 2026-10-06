import {memo} from 'react';
import {historyDateLabel} from './history-dates.mjs';
export const HistoryCalculation=memo(function HistoryCalculation({item,now}){
 return <>
  <button className="history-calculation" data-history-action="note" data-history-id={item.id} aria-label={`${item.operation} = ${item.display}. ${item.note?'Editar':'Adicionar'} anotação`}>
   <span>{item.operation}</span><strong>= {item.display}</strong>
   <time dateTime={item.time} title={new Date(item.time).toLocaleString('pt-BR')}>{historyDateLabel(item.time,now)}</time>
   {item.note&&<span className="history-note-text">{item.note}</span>}
  </button>
  <button className="history-share-button" data-history-action="share" data-history-id={item.id} aria-label={`Compartilhar cálculo: ${item.operation} = ${item.display}`}>
   <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M5 13v8h14v-8"/></svg>
  </button>
 </>;
});
