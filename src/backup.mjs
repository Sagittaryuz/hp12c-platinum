// Portable, local-only backup. Read/write only this calculator's own keys.
export const BACKUP_KEYS=['hp12c-state','hp12c-default-display','hp12c-default-program','hp12c-program-before-default','hp12c-history-v1','hp12c-ui-settings-v1'];
export function createBackup(storage,state){
 const entries={};for(const key of BACKUP_KEYS){const value=storage.getItem(key);if(value!==null)entries[key]=value;}
 entries['hp12c-state']=JSON.stringify(state);
 return{format:'hp12c-platinum-backup',version:1,createdAt:new Date().toISOString(),entries};
}
export function parseBackup(text){
 if(text.length>1024*1024)throw new Error('Arquivo de backup muito grande.');
 const data=JSON.parse(text);
 if(data?.format!=='hp12c-platinum-backup'||data.version!==1||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries))throw new Error('Este arquivo não é um backup da calculadora.');
 for(const [key,value]of Object.entries(data.entries)){if(!BACKUP_KEYS.includes(key)||typeof value!=='string')throw new Error('Backup inválido.');}
 if(typeof data.entries['hp12c-default-display']!=='string'||typeof data.entries['hp12c-default-program']!=='string')throw new Error('Backup sem configurações de migração.');
 const state=JSON.parse(data.entries['hp12c-state']||'null');
 if(!state||state.schemaVersion!==2||!Array.isArray(state.program)||!Array.isArray(state.registers)||!Number.isFinite(state.x))throw new Error('Estado da calculadora inválido.');
 return{entries:data.entries,state};
}
export function restoreBackupStorage(storage,entries){
 const previous=Object.fromEntries(BACKUP_KEYS.map(key=>[key,storage.getItem(key)]));
 try{for(const key of BACKUP_KEYS){if(Object.hasOwn(entries,key))storage.setItem(key,entries[key]);else storage.removeItem(key);}}
 catch(error){for(const key of BACKUP_KEYS){try{previous[key]===null?storage.removeItem(key):storage.setItem(key,previous[key])}catch{}}throw error;}
}
