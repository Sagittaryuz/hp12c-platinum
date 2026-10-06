// Format local wall-clock fields with reusable UTC formatters: Date's local
// getters follow timezone changes, so no cached formatter retains an old zone.
let formats;
function localFormats(){return formats ||= {
 date:new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC'}),
 time:new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',hour:'numeric',minute:'numeric',second:'numeric'}),
 weekday:new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',weekday:'long'})
}}
function localWallClock(date){const wall=new Date(0);wall.setUTCFullYear(date.getFullYear(),date.getMonth(),date.getDate());wall.setUTCHours(date.getHours(),date.getMinutes(),date.getSeconds(),date.getMilliseconds());return wall}
export function localClockKey(date){return [date.getFullYear(),date.getMonth(),date.getDate(),date.getTimezoneOffset(),Intl.DateTimeFormat().resolvedOptions().timeZone].join('|')}
// Compare local calendar dates, never elapsed24-hour periods (DST can be23/25h).
export function localDayNumber(date){return Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000}
export function historyDateLabel(time,now=new Date()){
 const date=new Date(time);if(!Number.isFinite(date.getTime()))return 'Data indisponível';
 const days=localDayNumber(now)-localDayNumber(date),wall=localWallClock(date),f=localFormats();
 const label=days===0?'Hoje':days===1?'Ontem':days===2?'Anteontem':f.weekday.format(wall);
 return `${label} · ${f.date.format(wall)} às ${f.time.format(wall)}`;
}
export function nextLocalMidnight(now=new Date()){return new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime()}
