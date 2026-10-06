// Compare local calendar dates, never elapsed24-hour periods (DST can be23/25h).
export function localDayNumber(date){return Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000}
export function historyDateLabel(time,now=new Date()){
 const date=new Date(time);if(!Number.isFinite(date.getTime()))return 'Data indisponível';
 const days=localDayNumber(now)-localDayNumber(date);
 const label=days===0?'Hoje':days===1?'Ontem':days===2?'Anteontem':date.toLocaleDateString('pt-BR',{weekday:'long'});
 return `${label} · ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR')}`;
}
export function nextLocalMidnight(now=new Date()){return new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime()}
