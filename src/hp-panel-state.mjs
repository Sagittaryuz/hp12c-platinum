export const HISTORY_KEY='hp12c-history-v1', UI_SETTINGS_KEY='hp12c-ui-settings-v1';
export const UI_DEFAULTS=Object.freeze({suspendSeconds:0,sound:false,vibration:false,keyEntry:'press'});
export function readUiSettings(storage){try{const s=JSON.parse(storage.getItem(UI_SETTINGS_KEY)||'null');return{suspendSeconds:[0,30,60,300].includes(s?.suspendSeconds)?s.suspendSeconds:0,sound:s?.sound===true,vibration:s?.vibration===true,keyEntry:s?.keyEntry==='release'?'release':'press'}}catch{return {...UI_DEFAULTS}}}
export function readHistory(storage){try{const list=JSON.parse(storage.getItem(HISTORY_KEY)||'[]');return Array.isArray(list)?list.filter(e=>typeof e?.id==='string'&&typeof e.time==='string'&&typeof e.operation==='string'&&typeof e.display==='string'&&Number.isFinite(e.value)).slice(-100):[]}catch{return []}}
const results=new Set(['plus','minus','multiply','divide','pow','reciprocal','pctT','deltaPct','pct','sqrt','exp','ln','square','factorial','sin','cos','tan','mean','stddev','weightedMean','estimateX','estimateY','amortize','interest','npv','irr','bondPrice','bondYield','deprSL','deprSOYD','deprDB','days','date','round','12x','12div','sigmaPlus','sigmaMinus','runStop','equals']);
export function historyEntry(before,after,action,{id,time,display}){
 if(after.error||after.entering||!Number.isFinite(after.x)||!after.powered||before.programMode)return null;
 if(!results.has(action)&&!(['n','i','pv','pmt','fv'].includes(action)&&!before.financialInputReady))return null;
 if(action==='runStop'&&(after.running||after.paused||after.programMode))return null;
 const symbols={plus:'+',minus:'−',multiply:'×',divide:'÷',pow:'^'};
 const operation=before.mode==='RPN'&&symbols[action]?`${before.y} ${symbols[action]} ${before.x}`:action==='runStop'?'Programa':after.displayLabel||action;
 return{id,time,operation,display,value:after.x};
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
 if(selected.settings)next={...next,decimals:7,fixed:true,decimalComma:true,angular:'DEG',mode:'RPN',dateFormat:'MDY',algOperands:[],algOperators:[],pendingOp:null,shift:null};
 return next;
}
