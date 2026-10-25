import {validateEntries} from '../src/scripting-bridge.mjs';
const CURRENT='hp12c-scripting-v1',PREVIOUS='hp12c-scripting-previous-v1';
export function createNativeStore(storage){
 const read=()=>{
  const saved=storage.get(CURRENT);
  if(saved===null)return {revision:0,entries:{}};
  if(!Number.isSafeInteger(saved.revision)||saved.revision<1)throw new Error('Revisão inválida; dados preservados.');
  validateEntries(saved.entries);return saved;
 };
 return {read,save(params){
  validateEntries(params?.entries);const current=read();
  if(params.revision!==current.revision)throw new Error('Outra janela alterou os dados. Feche e reabra; salve um backup da sessão atual.');
  const next={revision:current.revision+1,entries:{...params.entries}};
  if(!storage.set(PREVIOUS,current))throw new Error('Falha ao preservar a cópia anterior.');
  if(!storage.set(CURRENT,next))throw new Error('Falha no salvamento.');
  const confirmed=read();if(JSON.stringify(confirmed)!==JSON.stringify(next))throw new Error('Salvamento não confirmado.');
  return {ok:true,revision:next.revision};
 }};
}
