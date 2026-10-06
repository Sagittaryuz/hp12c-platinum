import {it,expect,vi} from 'vitest';
import {setHistoryNote,NOTE_LIMIT} from '../src/history-notes.mjs';
import {readHistory,appendHistory,reducePanel} from '../src/hp-panel-state.mjs';
import {historyDateLabel,nextLocalMidnight,localDayNumber} from '../src/history-dates.mjs';
import {historyShareText,shareHistory,canHistoryShare,copyHistoryImage,wrapCanvasText} from '../src/history-sharing.mjs';
import {createBackup,parseBackup,restoreBackupStorage} from '../src/backup.mjs';
import {INITIAL_STATE} from '@sagittaryuz/hp12c-core';
import {attachHistoryActions} from '../src/history-actions.mjs';
const item={id:'stable-id',time:'2026-10-06T14:35:12Z',operation:'2 + 3',display:'5,0000000',value:5};
it('notas usam ID estável sem cálculo/atividade novos e cancelamento não altera dados',()=>{
 const history=[item],text='Pagamento\n<script>alert(1)</script> & orçamento';
 const next=setHistoryNote(history,item.id,text);expect(next[0]).toEqual({...item,note:text});expect(history).toEqual([item]);
 const current={state:INITIAL_STATE,history,historyActive:false};const panel=reducePanel(current,{type:'history-note',id:item.id,text},{});
 expect(panel.state).toBe(INITIAL_STATE);expect(panel.historyActive).toBe(false);expect(panel.history[0].id).toBe(item.id);expect(panel.history).toHaveLength(1);
 expect(setHistoryNote(next,item.id,'')[0]).toEqual(item);expect(setHistoryNote(next,item.id,text)[0].note).toBe(text);
});
it('limite, IDs ausentes e separadores não ganham notas; legado malformado não perde contas',()=>{
 expect(()=>setHistoryNote([item],item.id,'x'.repeat(NOTE_LIMIT+1))).toThrow();expect(()=>setHistoryNote([item],'gone','nota')).toThrow();
 const separator={...item,id:'separator',kind:'separator',value:null};expect(()=>setHistoryNote([separator],'separator','nota')).toThrow();
 const rows=[{...item,note:{unsafe:true}},separator,{...item,id:'normal',note:' a\r\nb '}];
 const read=readHistory({getItem:()=>JSON.stringify(rows)});expect(read).toHaveLength(3);expect(read[0]).toEqual(item);expect(read[2].note).toBe(' a\nb ');
});
it('100linhas guardam notas juntas, sem índice paralelo/órfãos após eviction/reset',()=>{
 const rows=Array.from({length:100},(_,i)=>({...item,id:String(i),note:'nota'+i}));const next=appendHistory(rows,{...item,id:'100'});
 expect(next).toHaveLength(100);expect(next.some(row=>row.id==='0')).toBe(false);expect(next[0].note).toBe('nota1');
 const current={state:INITIAL_STATE,history:next,historyActive:true};expect(reducePanel(current,{type:'clear-history'},{}).history).toEqual([]);
});
it('backup antigo e anotado restaura texto/identidade sem trocar schema/novas chaves',()=>{
 const map=new Map([['hp12c-default-display','1'],['hp12c-default-program','1'],['hp12c-history-v1',JSON.stringify(setHistoryNote([item],item.id,'linha1\nlinha2'))]]);
 const storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>map.set(k,v),removeItem:(k:string)=>map.delete(k)};
 const backup=parseBackup(JSON.stringify(createBackup(storage,INITIAL_STATE)));map.clear();restoreBackupStorage(storage,backup.entries);
 expect(readHistory(storage)[0].note).toBe('linha1\nlinha2');expect(readHistory({getItem:()=>JSON.stringify([item])})).toEqual([item]);
});
function timezone(zone:string,run:()=>void){const previous=process.env.TZ;try{process.env.TZ=zone;run()}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous}}
it('Hoje/Ontem/Anteontem usam dia local, preservam data/hora e antigos/futuros têm contexto',()=>timezone('America/Sao_Paulo',()=>{
 const now=new Date('2026-10-07T03:00:01Z');expect(historyDateLabel('2026-10-07T02:59:59Z',now)).toMatch(/^Ontem.*06\/10\/2026.*23:59:59/);
 expect(historyDateLabel('2026-10-07T03:00:00Z',now)).toMatch(/^Hoje/);expect(historyDateLabel('2026-10-05T14:00:00Z',now)).toMatch(/^Anteontem/);
 expect(historyDateLabel('2026-09-28T14:00:00Z',now)).toMatch(/^segunda-feira.*28\/09\/2026/);expect(historyDateLabel('2026-10-09T14:00:00Z',now)).toMatch(/^sexta-feira.*09\/10\/2026/);
 expect(historyDateLabel('invalid',now)).toBe('Data indisponível');
}));
it('dias e próximo midnight sobrevivem DST de23/25h, ano novo e mudança de fuso',()=>{
 timezone('America/New_York',()=>{for(const [before,after,hours]of [['2026-03-08T00:00:00','2026-03-09T00:00:00',23],['2026-11-01T00:00:00','2026-11-02T00:00:00',25]]){
  const a=new Date(before),b=new Date(after);expect((b.getTime()-a.getTime())/3600000).toBe(hours);expect(localDayNumber(b)-localDayNumber(a)).toBe(1);expect(nextLocalMidnight(a)).toBe(b.getTime());expect(historyDateLabel(a,b)).toMatch(/^Ontem/);
 }});timezone('Pacific/Auckland',()=>expect(historyDateLabel('2026-12-31T10:59:59Z',new Date('2026-12-31T11:00:01Z'))).toMatch(/^Ontem.*31\/12\/2026/));
});
it('texto conserva expressão/display completos e nota só por seleção explícita',()=>{
 const row={...item,display:'1,234567890e+30',note:'Descrição\nOutra linha'};const plain=historyShareText(row);expect(plain).toContain('1,234567890e+30');expect(plain).not.toContain('Descrição');expect(historyShareText(row,true)).toContain('Descrição\nOutra linha');
});
it('WebShare chamado antes de qualquer await, valida files e trata cancelamento sem erro',async()=>{
 let called=false;const file={type:'image/png'};const nav={canShare:vi.fn(()=>true),share:vi.fn(()=>{called=true;return Promise.reject({name:'AbortError'})})};const result=shareHistory({files:[file]},{nav});expect(called).toBe(true);expect(nav.canShare).toHaveBeenCalledWith({files:[file]});expect(await result).toBe('cancelled');
 expect(await shareHistory({files:[file]},{nav:{share:vi.fn()}})).toBe('unavailable');expect(canHistoryShare({text:'x'},{share:()=>{},canShare:()=>{throw Error()}})).toBe(false);
 expect(await shareHistory({text:'x'},{nav:{share:()=>{throw {name:'NotAllowedError'}}}})).toBe('failed');
});
it('copia somente PNG suportado; rejeições viram fallback, sem leitura de clipboard',async()=>{
 class Item{static supports(type:string){return type==='image/png'};value:any;constructor(value:any){this.value=value}};
 const nav={clipboard:{write:vi.fn(()=>Promise.resolve())}};const blob={type:'image/png'};const promise=copyHistoryImage(blob,{nav,Item});expect(nav.clipboard.write).toHaveBeenCalledTimes(1);expect(await promise).toBe(true);
 expect(await copyHistoryImage(blob,{nav:{},Item})).toBe(false);expect(await copyHistoryImage(blob,{nav:{clipboard:{write:()=>Promise.reject(Error())}},Item})).toBe(false);
});
it('PNG wrapping não perde caracteres, multiline nem números longos',()=>{
 const text='1,234567890e+30\nAnotação 💡';const lines=wrapCanvasText({measureText:(s:string)=>({width:Array.from(s).length})},text,5);expect(lines.join('').replaceAll('\n','')).toBe(text.replaceAll('\n',''));expect(lines.every(line=>Array.from(line).length<=5)).toBe(true);
});
it('toque delegado rejeita arraste, scroll, multitoque, cancelamento e click duplicado; teclado funciona',()=>{
 const win=new EventTarget(),doc=new EventTarget() as any;doc.defaultView=win;const root=new EventTarget() as any;root.ownerDocument=doc;root.contains=(target:any)=>target===button;
 const button={disabled:false,dataset:{historyAction:'note',historyId:'stable'},getBoundingClientRect:()=>({left:0,right:100,top:0,bottom:100})};const target={closest:()=>button};const action=vi.fn();const detach=attachHistoryActions(root,action);
 const send=(type:string,fields:any={},where:any=win)=>{const e=new Event(type,{cancelable:true});Object.defineProperties(e,Object.fromEntries(Object.entries({target,button:0,isPrimary:true,pointerId:1,clientX:20,clientY:20,detail:1,...fields}).map(([key,value])=>[key,{value}])));where.dispatchEvent(e)};
 const tap=()=>{send('pointerdown');send('pointerup');send('click',{},root)};
 tap();expect(action).toHaveBeenCalledTimes(1);send('click',{},root);expect(action).toHaveBeenCalledTimes(1);
 for(const interrupt of [()=>send('pointermove',{clientY:50}),()=>send('scroll',{},root),()=>send('pointerdown',{pointerId:2,isPrimary:false}),()=>send('pointercancel'),()=>send('resize'),()=>send('blur',{target:win})]){send('pointerdown');interrupt();send('pointerup');send('pointerup',{pointerId:2});send('click',{},root)}
 expect(action).toHaveBeenCalledTimes(1);send('pointerdown');send('pointerup');send('blur');send('click',{},root);expect(action).toHaveBeenCalledTimes(2);send('click',{detail:0},root);expect(action).toHaveBeenCalledTimes(3);detach();tap();expect(action).toHaveBeenCalledTimes(3);
});
