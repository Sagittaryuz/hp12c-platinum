export const NOTE_LIMIT=2000;
export function setHistoryNote(history,id,text){
 if(typeof text!=='string'||text.length>NOTE_LIMIT)throw new Error(`Use até ${NOTE_LIMIT} caracteres.`);
 const item=history.find(row=>row.id===id&&row.kind!=='separator');if(!item)throw new Error('Este cálculo não está mais no histórico.');
 const note=text.replace(/\r\n?/g,'\n');
 return history.map(row=>{if(row.id!==id)return row;const {note:previous,...rest}=row;return note.trim()?{...rest,note}:rest});
}
export function sanitizeHistoryNote(row){
 if(row.note===undefined)return row;
 if(row.kind!=='separator'&&typeof row.note==='string'&&row.note.length<=NOTE_LIMIT&&row.note.trim())return {...row,note:row.note.replace(/\r\n?/g,'\n')};
 const {note,...rest}=row;return rest;
}
