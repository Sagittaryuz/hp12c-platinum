// Read-only view of the chronological log. Existing records, notes and backups
// keep their identities; every existing separator remains a session boundary.
export function historySessions(history){
 const sessions=[];let entries=[],start=null;
 const finish=end=>{
  if(entries.length){const first=entries[0];sessions.push({id:'session:'+first.id,entries,start:start?.time||first.time,end:end?.time||null,closed:Boolean(end),partial:sessions.length===0&&!start&&history.length>=100});entries=[]}
 };
 for(const item of history){if(item.kind==='separator'){finish(item);start=item}else entries.push(item)}
 finish(null);return sessions;
}
export const sessionHasNotes=session=>session.entries.some(item=>Boolean(item.note));
