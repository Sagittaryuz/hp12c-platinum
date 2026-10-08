import {setHistoryNote,sanitizeHistoryNote} from './history-notes.mjs';
export const HISTORY_ACTIVITY_KEY='hp12c-history-activity-v1';
export const HISTORY_KEY='hp12c-history-v1', UI_SETTINGS_KEY='hp12c-ui-settings-v1';
export const UI_DEFAULTS=Object.freeze({suspendSeconds:0,sound:false,vibration:false,keyEntry:'press'});
export function readUiSettings(storage){try{const s=JSON.parse(storage.getItem(UI_SETTINGS_KEY)||'null');return{suspendSeconds:[0,30,60,300].includes(s?.suspendSeconds)?s.suspendSeconds:0,sound:s?.sound===true,vibration:s?.vibration===true,keyEntry:s?.keyEntry==='release'?'release':'press'}}catch{return {...UI_DEFAULTS}}}
export function readHistory(storage){try{const list=JSON.parse(storage.getItem(HISTORY_KEY)||'[]');return Array.isArray(list)?list.filter(e=>typeof e?.id==='string'&&typeof e.time==='string'&&typeof e.operation==='string'&&typeof e.display==='string'&&(e.kind==='separator'?Number.isFinite(Date.parse(e.time)):e.kind==='error'?e.value===null:Number.isFinite(e.value))).slice(-100).map(sanitizeHistoryNote):[]}catch{return []}}
const results=new Set(['plus','minus','multiply','divide','pow','reciprocal','pctT','deltaPct','pct','sqrt','exp','ln','square','factorial','sin','cos','tan','mean','stddev','weightedMean','estimateX','estimateY','amortize','interest','npv','irr','bondPrice','bondYield','deprSL','deprSOYD','deprDB','days','date','round','12x','12div','sigmaPlus','sigmaMinus','intg','frac']);
export function isHistoryOperation(before,action){
 return results.has(action)||before.mode==='ALG'&&['enter','equals'].includes(action)&&before.algOperators.length>0||['n','i','pv','pmt','fv'].includes(action)&&!before.financialInputReady;
}
export function historyEntry(before,after,action,{id,time,display}){
 if(!before.powered||before.pendingRegister||before.pendingGoto!==null||before.programMode)return null;
 if(before.error)return null;
 const symbols={plus:'+',minus:'−',multiply:'×',divide:'÷',pow:'^'};
 const algEquals=before.mode==='ALG'&&['equals','enter'].includes(action)&&before.algOperators.length;
 if(!isHistoryOperation(before,action))return null;
 if(action==='enter'&&!algEquals)return null;
 if(before.mode==='ALG'&&symbols[action]&&(!before.algOperators.length||before.displayLabel==='ALG OP'))return null;
 const algSymbol={'+':'+','-':'−','*':'×','/':'÷','^':'^'}[before.pendingOp];
 const unary=new Set(['reciprocal','sqrt','exp','ln','square','factorial','sin','cos','tan','intg','frac','round','12x','12div']);
 const operation=before.mode==='RPN'&&symbols[action]?`${before.y} ${symbols[action]} ${before.x}`
  :before.mode==='ALG'&&algSymbol&&(symbols[action]||algEquals)?`${before.algOperands.at(-1)} ${algSymbol} ${before.x}`
  :unary.has(action)?`${action} (${before.x})`:(after.displayLabel&&!['RESULTADO','ALG OP','PRONTO'].includes(after.displayLabel)?after.displayLabel:action);
 if(after.error)return {id,time,kind:'error',operation,display,value:null};
 if(after.entering||!Number.isFinite(after.x)||!after.powered)return null;
 return{id,time,operation,display,value:after.x,decimalComma:after.decimalComma};
}
export function appendHistory(history,item){return item&&!history.some(e=>e.id===item.id)?[...history,item].slice(-100):history}
export function parseMemoryValue(text){
 const raw=String(text).trim();if(!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(raw))throw new Error('Informe um número com ponto ou vírgula decimal.');
 const value=Number(raw.replace(',','.'));if(!Number.isFinite(value)||Math.abs(value)>9.999999999e99)throw new Error('Valor fora do intervalo da calculadora.');
 return Math.abs(value)<1e-99?0:Number(value.toPrecision(10));
}
export function editMemory(state,index,text){
 if(!Number.isInteger(index)||index<0||index>=20)throw new Error('Registrador inválido.');
 if(state.running||state.paused||state.programMode)throw new Error('Pare o programa e saia de PRGM para editar memórias.');
 const value=parseMemoryValue(text),next=structuredClone(state);next.registers[index]=value;
 // Core STO keeps existing cash-flow slots synchronized with R0..R19.
 if(index<next.cashflows.length)next.cashflows[index]=value;
 return next;
}
export function recallResult(state,value,pressAction){
 if(!Number.isFinite(value)||Math.abs(value)>9.999999999e99)throw new Error('Resultado inválido.');
 if(!state.powered||state.error||state.programMode||state.running||state.paused||state.pendingRegister||state.pendingGoto!==null)throw new Error('Conclua a entrada/comando e saia de PRGM antes de reutilizar.');
 const next=pressAction({...state,lastX:value,shift:null},'lastX');
 const {undoState,...previous}=structuredClone(state);
 return {...next,lastX:state.lastX,displayLabel:'HISTÓRICO',undoState:previous};
}
export function resetSelected(state,selected,initial){
 let next=structuredClone(state);
 if(selected.values){const keep={program:next.program,decimals:next.decimals,fixed:next.fixed,decimalComma:next.decimalComma,angular:next.angular,mode:next.mode,dateFormat:next.dateFormat};next={...structuredClone(initial),...keep};}
 if(selected.program)next={...next,program:[],pc:0,programPrefix:[],programMode:false,pendingGoto:null,gotoPosition:false,running:false,paused:false};
 if(selected.settings)next={...next,decimals:initial.decimals,fixed:initial.fixed,decimalComma:initial.decimalComma,angular:'DEG',mode:'RPN',dateFormat:'MDY',algOperands:[],algOperators:[],pendingOp:null,shift:null};
 return next;
}

export function historySeparator({id,time},operation='Memória reiniciada'){
 if(!Number.isFinite(Date.parse(time)))return null;
 return {id,time,kind:'separator',operation:({clearReg:'Registradores e memória reiniciados',clearFin:'Memória financeira limpa',clearStats:'Memória estatística limpa'})[operation]||operation,display:'',value:null};
}
export function historyActivity(state,history,saved){
 if(saved==='true'||saved==='false')return saved==='true';
 return Boolean(history.length&&history.at(-1).kind!=='separator')||Boolean(state.error||state.entering&&state.input!=='0'||state.x!==0);
}
export function reducePanel(current,event,{pressKey,pressAction,formatDisplay,displayDefaults,initial}){
 if(event.type==='state')return {...current,state:typeof event.updater==='function'?event.updater(current.state):event.updater};
 if(event.type==='history-note')return {...current,history:setHistoryNote(current.history,event.id,event.text)};
 if(event.type==='clear-history')return {...current,history:[],historyActive:false};
 if(event.type==='restore-history'){const state=event.state||current.state;return {...current,state,history:event.history,historyActive:historyActivity(state,event.history,event.activity)}};
 if(event.type==='reset'){
  const history=event.selected.history?[]:current.history;
  return {...current,state:resetSelected(current.state,event.selected,initial),history,historyActive:event.selected.history?false:current.historyActive};
 }
 const state=displayDefaults(event.type==='action'?pressAction(current.state,event.action):pressKey(current.state,event.id));
 const operation=event.action;
 const item=isHistoryOperation(current.state,operation)?historyEntry(current.state,state,operation,{id:event.eventId,time:event.time,display:formatDisplay(state)}):null;
 const active=current.historyActive??historyActivity(current.state,current.history);
 // A confirmed key counts even when X remains zero; repeated clear never does.
 const historyActive=operation==='clx'?false:active||event.type==='key'||event.physical===true||Boolean(item);
 return {...current,state,history:appendHistory(current.history,item),historyActive};
}

// Persistence remains chronological, compatible with all existing backups.
export const historyNewestFirst=history=>[...history].reverse();
