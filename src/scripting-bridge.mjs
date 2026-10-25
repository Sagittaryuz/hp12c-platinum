import {BACKUP_KEYS} from './backup.mjs';
export const isScripting=import.meta.env?.VITE_SCRIPTING_BUILD==='1';
export function nativeCall(name,params){
 const handler=globalThis.window?.webkit?.messageHandlers?.[name];
 if(!handler)return Promise.reject(new Error('Ponte Scripting indisponível.'));
 try{return Promise.resolve(handler.postMessage(params))}catch(error){return Promise.reject(error)}
}
export function validateEntries(entries){
 if(!entries||typeof entries!=='object'||Array.isArray(entries))throw new Error('Armazenamento inválido.');
 for(const [key,value]of Object.entries(entries))if(!BACKUP_KEYS.includes(key)||typeof value!=='string')throw new Error('Armazenamento inválido.');
 if(JSON.stringify(entries).length>1024*1024)throw new Error('Armazenamento muito grande.');
 return entries;
}
// Synchronous reads for React; serialized native snapshots with acknowledged revisions.
// Failed writes retain the dirty snapshot for explicit/lifecycle retry.
export function createScriptingStorage(initial,call=nativeCall,onError=()=>{}){
 let entries={...validateEntries(initial.entries)},revision=initial.revision,dirty=false,queue=Promise.resolve();
 const flush=()=>{
  const operation=queue.then(async()=>{
   if(!dirty)return;
   const snapshot={...entries};
   const reply=await call('hpSave',{entries:snapshot,revision});
   if(!reply?.ok||reply.revision!==revision+1)throw new Error('Não foi possível confirmar o salvamento.');
   revision=reply.revision;
   if(JSON.stringify(snapshot)===JSON.stringify(entries))dirty=false;
  });
  queue=operation.catch(error=>{onError(error)});return operation;
 };
 const schedule=()=>{dirty=true;void flush().catch(()=>{})};
 return {
  getItem:key=>entries[key]??null,
  setItem(key,value){if(!BACKUP_KEYS.includes(key))throw new Error('Chave inválida.');value=String(value);if(entries[key]!==value){entries[key]=value;schedule()}},
  removeItem(key){if(Object.hasOwn(entries,key)){delete entries[key];schedule()}},
  async replace(next){
   validateEntries(next);await flush();
   // Commit before publishing the restored state to React. One native transaction.
   const operation=queue.then(async()=>{const reply=await call('hpSave',{entries:next,revision});if(!reply?.ok||reply.revision!==revision+1)throw new Error('Falha ao restaurar.');revision=reply.revision;entries={...next};dirty=false});
   queue=operation.catch(onError);return operation;
  },flush,
 };
}
export let calculatorStorage;
export async function initializeStorage(){
 if(!isScripting){calculatorStorage={getItem:key=>globalThis.localStorage.getItem(key),setItem:(key,value)=>globalThis.localStorage.setItem(key,value),removeItem:key=>globalThis.localStorage.removeItem(key)};return}
 const initial=await nativeCall('hpRead');
 if(initial.entries?.['hp12c-state']){const state=JSON.parse(initial.entries['hp12c-state']);if(!state||state.schemaVersion!==2||!Array.isArray(state.program)||!Array.isArray(state.registers)||!Number.isFinite(state.x))throw new Error('Estado salvo inválido.')}
 calculatorStorage=createScriptingStorage(initial,nativeCall,error=>window.dispatchEvent(new CustomEvent('hp-storage-error',{detail:error.message})));
 if(calculatorStorage.getItem('hp12c-ui-settings-v1')===null)calculatorStorage.setItem('hp12c-ui-settings-v1',JSON.stringify({vibration:true}));
 const flush=()=>{void calculatorStorage.flush().catch(()=>{})};
 window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',flush);
}
