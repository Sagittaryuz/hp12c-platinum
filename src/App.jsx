import { useCallback, useEffect, useLayoutEffect, useRef, useState, useReducer } from 'react';
import { INITIAL_STATE, restoreState, formatDisplay, pressKey, pressAction, KEY_DEFINITIONS, resolveKeyAction } from '@sagittaryuz/hp12c-core';
import { HpMenu } from './HpMenu';
import {HISTORY_KEY,UI_SETTINGS_KEY,UI_DEFAULTS,readHistory,readUiSettings,historyEntry,appendHistory,editMemory,recallResult,resetSelected} from './hp-panel-state.mjs';
import { FaceKeys, Brackets } from './face';
import { Lcd } from './Lcd';
import {useHeaderAlignment} from './useHeaderAlignment';
import {createBackup,parseBackup,restoreBackupStorage} from './backup.mjs';
import { ViewportDiagnostics } from './ViewportDiagnostics';
import { displayDefaults, initializeDefaults, DEFAULT_PROGRAM_VERSION, DEFAULT_DISPLAY_VERSION } from './defaults';

function useJoinedFrame() {
  useLayoutEffect(() => {
    const calculator=document.querySelector('.calculator');
    let alive=true,lastSignature=null,fontRevision=0;
    const panels=[...calculator.querySelectorAll(".keyboard-panel,.keyboard-frame,.keyboard-crossbar")];
    const controls=[...calculator.querySelectorAll(".key,.bracket")];
    const layout=()=>{
      if(!alive)return;
      const style=getComputedStyle(calculator),modelStyle=getComputedStyle(calculator.querySelector('.model-name')),lcdStyle=getComputedStyle(calculator.querySelector('.lcd'));
      const signature=[calculator.clientWidth,calculator.clientHeight,fontRevision,style.getPropertyValue('--portrait-safe-bottom'),modelStyle.top,lcdStyle.top,lcdStyle.translate].join('|');
      if(signature===lastSignature)return;
      lastSignature=signature;
      calculator.classList.remove('joined-frame');
      // Clear only the portrait expansion from the preceding measurement pass.
      for(const panel of panels)panel.style.removeProperty('top');
      for(const control of controls)for(const prop of ['top','bottom','height','left','width'])control.style.removeProperty(prop);
      const visible=controls.filter(el=>getComputedStyle(el).display!=='none');
      const rects=visible.map(el=>({el,rect:el.getBoundingClientRect()}));
      const ink=[...calculator.querySelectorAll('.key,.legend-f,.bracket,.bracket span')].filter(el=>getComputedStyle(el).display!=='none').map(el=>el.getBoundingClientRect());
      const body=calculator.getBoundingClientRect(),panel=calculator.querySelector('.keyboard-panel').getBoundingClientRect();
      const portrait=body.height>=body.width;
      const makerElement=calculator.querySelector('.maker-name'),lettering=calculator.querySelector('.maker-lettering');
      calculator.style.removeProperty('--maker-label-width');
      lettering.style.removeProperty('transform');
      if(portrait){
        const natural=lettering.getBoundingClientRect().width;
        const fitted=Math.min(natural,Math.max(1,body.width-36));
        calculator.style.setProperty('--maker-label-width',fitted+'px');
        lettering.style.transform='scaleX('+fitted/natural+') translateY(var(--maker-ink-offset,0px))';
      }
      const maker=makerElement.getBoundingClientRect();
      const min=Math.min(...ink.map(r=>r.top)),max=Math.max(...ink.map(r=>r.bottom));
      const base=body.bottom-maker.bottom;
      const rise=portrait?20:0;
      calculator.style.setProperty('--joined-base','45px');
      // Portrait maker rails: 10 CSS px; landscape uses its existing height.
      calculator.style.setProperty('--joined-label-height',(portrait?10:maker.height)+'px');
      calculator.style.setProperty('--maker-cutout-width',(maker.width+(portrait?20:0))+'px');
      const shift=Math.min(50,Math.max(0,(maker.top-panel.top)*.22));
      calculator.style.setProperty('--joined-top',(panel.top-body.top+shift)+'px');
      calculator.classList.add('joined-frame');
      const newPanel=calculator.querySelector('.keyboard-panel').getBoundingClientRect();
      const top=Math.max(min+shift-rise,newPanel.top+8),bottom=portrait?Math.min(maker.top-10-rise,newPanel.bottom-8):maker.top-10;
      const scale=Math.min(1,Math.max(.2,(bottom-top)/(max-min)));
      const previousFrame=Math.min(10,Math.max(4,body.width*.012));
      const previousTop=newPanel.top-(8-previousFrame)/2;
      const safeBottom=parseFloat(getComputedStyle(calculator).getPropertyValue('--portrait-safe-bottom'))||0;
      const previousBase=Math.max(previousFrame,safeBottom);
      const heightScale=portrait?Math.min(1,Math.max(.2,(bottom+base-previousBase-Math.max(min+shift-rise,previousTop+8))/(max-min))):scale;
      calculator.style.setProperty('--joined-scale',String(heightScale));
      const span=(max-min)*scale;
      const start=Math.max(top,newPanel.top+(newPanel.height-span)/2);
      const parentRects=new Map([...new Set(rects.map(({el})=>el.parentElement))].map(el=>[el,el.getBoundingClientRect()]));
      for(const {el,rect} of rects){
        const parent=parentRects.get(el.parentElement);
        el.style.top=(start+(rect.top-min)*scale-parent.top)+'px';
        el.style.bottom='auto';
        el.style.height=(rect.height*heightScale)+'px';
      }
      if(portrait){
        const enter=calculator.querySelector('.key-enter');
        const last=Math.max(...visible.filter(el=>el.matches('.key:not(.key-enter)')).map(el=>el.getBoundingClientRect().bottom));
        enter.style.height=(last-enter.getBoundingClientRect().top)+'px';
      }
      const bounds=[...calculator.querySelectorAll('.key,.legend-f,.bracket,.bracket span')].map(el=>el.getBoundingClientRect()).filter(r=>r.width>0);
      const left=Math.min(...bounds.map(r=>r.left)),right=Math.max(...bounds.map(r=>r.right));
      const actualTop=Math.min(...bounds.map(r=>r.top)),actualBottom=Math.max(...bounds.map(r=>r.bottom));
      const dx=(newPanel.left+newPanel.right-left-right)/2;
      const centeredDy=(newPanel.top+newPanel.bottom-actualTop-actualBottom)/2;
      const dy=portrait?Math.min(centeredDy,body.bottom-safeBottom-2-actualBottom):centeredDy;
      for(const {el,rect} of rects){
        const parent=parentRects.get(el.parentElement);
        el.style.left=(rect.left-parent.left+dx)+'px';
        el.style.top=(parseFloat(el.style.top)+dy)+'px';
      }
      calculator.dataset.keyboardShift=String(shift);
      calculator.dataset.keyboardScale=String(scale);
      // Final shared layout: uniform rows, identical label gaps and group tiers.
      // Measurements stay relative to the real smooth plate, not screen pixels.
      const referenceLegend=calculator.querySelector('.key-n .legend-f');
      const font=parseFloat(getComputedStyle(referenceLegend).fontSize);
      const gap=referenceLegend.parentElement.getBoundingClientRect().top-referenceLegend.getBoundingClientRect().bottom;
      const padding=8;
      const simple=visible.filter(el=>el.matches('.key:not(.key-enter)'));
      const rows=[];
      const simpleRects=simple.map(el=>({el,rect:el.getBoundingClientRect()}));
      for(const {el,rect} of simpleRects.sort((a,b)=>a.rect.top-b.rect.top)){
        const y=rect.top;
        let row=rows.find(r=>Math.abs(r.y-y)<1);
        if(!row){row={y,els:[]};rows.push(row)}row.els.push(el);
      }
      const bottomLimit=Math.min(newPanel.bottom-padding,body.bottom-safeBottom-2);
      const tier=font+gap;
      const firstY=newPanel.top+padding+2*tier;
      const oldHeight=Math.min(...simpleRects.map(({rect})=>rect.height));
      const keyHeight=Math.min(oldHeight,(bottomLimit-firstY-(rows.length-1)*2*tier)/rows.length);
      const pitch=(bottomLimit-firstY-keyHeight)/(rows.length-1);
      const put=(el,y,h)=>{el.style.top=(y-parentRects.get(el.parentElement).top)+'px';el.style.bottom='auto';el.style.height=h+'px'};
      rows.forEach((row,i)=>row.els.forEach(el=>put(el,firstY+i*pitch,keyHeight)));
      const enter=calculator.querySelector('.key-enter');
      const enterRow=portrait?5:2;
      put(enter,firstY+enterRow*pitch,bottomLimit-(firstY+enterRow*pitch));
      const groups=[['bond','pow','reciprocal'],['depreciation','pctT','pct'],['clear','sst','clx']];
      for(const [name,startId,endId] of groups){
        const el=calculator.querySelector('.'+name),a=calculator.querySelector('.key-'+startId).getBoundingClientRect(),z=calculator.querySelector('.key-'+endId).getBoundingClientRect();
        el.style.left=(a.left-el.parentElement.getBoundingClientRect().left)+'px';el.style.width=(z.right-a.left)+'px';
        put(el,a.top-gap-font-gap-font/2,font/2);
      }
      const prefix=calculator.querySelector('.prefix'),er=enter.getBoundingClientRect();
      prefix.style.left=(er.left-prefix.parentElement.getBoundingClientRect().left)+'px';prefix.style.width=er.width+'px';put(prefix,er.top-gap-font,font);
      const all=[...calculator.querySelectorAll('.key,.legend-f,.bracket,.bracket span')].filter(el=>getComputedStyle(el).display!=='none').map(el=>el.getBoundingClientRect()).filter(r=>r.width>0);
      const adjustment=(newPanel.top+bottomLimit-Math.min(...all.map(r=>r.top))-Math.max(...all.map(r=>r.bottom)))/2;
      for(const el of visible)el.style.top=(parseFloat(el.style.top)+adjustment)+'px';
      if(portrait){
        // Expand upward after the approved layout is measured, retaining normal
        // key sizes and the last row. No change to the header, LCD or base.
        const lcd=calculator.querySelector('.lcd'),lr=lcd.getBoundingClientRect();
        const rimHeight=parseFloat(getComputedStyle(lcd,'::before').height)||lr.height;
        // Keep the approved keyboard expansion referenced to the 0.2.10 LCD
        // position; extra header movement must not expand a compact keyboard.
        const lcdTranslateY=parseFloat(getComputedStyle(lcd).translate.split(/\s+/)[1])||0;
        const extraHeaderRise=Math.max(0,-15-lcdTranslateY);
        const rimBottom=lr.top+lr.height/2+rimHeight/2+extraHeaderRise;
        const crossbar=calculator.querySelector('.keyboard-crossbar');
        const expansion=Math.min(20,Math.max(0,crossbar.getBoundingClientRect().top-rimBottom-8));
        const gain=expansion/(rows.length-1);
        const move=(el,amount)=>{el.style.top=(parseFloat(el.style.top)-amount)+'px'};
        rows.forEach((row,i)=>row.els.forEach(el=>move(el,expansion-i*gain)));
        move(enter,gain);enter.style.height=(parseFloat(enter.style.height)+gain)+'px';
        // Group tiers gain space on both sides; ordinary legends remain attached
        // to their own key. PREFIX follows ENTER and retains its key clearance.
        for(const [name,row] of [['bond',1],['depreciation',1],['clear',2]])move(calculator.querySelector('.'+name),expansion-row*gain+gain/2);
        move(prefix,gain);
        for(const selector of ['.keyboard-panel','.keyboard-frame','.keyboard-crossbar']){
          const el=calculator.querySelector(selector),parent=el.parentElement.getBoundingClientRect();
          el.style.top=(el.getBoundingClientRect().top-parent.top-expansion)+'px';
        }
        calculator.dataset.portraitExpansion=String(expansion);
      }else calculator.dataset.portraitExpansion='0';
    };
    layout();
    let frame=0;
    const schedule=()=>{if(!alive||frame)return;frame=requestAnimationFrame(()=>{frame=0;layout()})};
    const fontChanged=()=>{fontRevision++;schedule()};
    const observer=new ResizeObserver(schedule);observer.observe(calculator);
    document.fonts.ready.then(fontChanged);
    document.fonts.addEventListener('loadingdone',fontChanged);
    window.addEventListener('pageshow',schedule);window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);
    return()=>{alive=false;observer.disconnect();cancelAnimationFrame(frame);document.fonts.removeEventListener('loadingdone',fontChanged);window.removeEventListener('pageshow',schedule);window.removeEventListener('resize',schedule);window.removeEventListener('orientationchange',schedule)};
  },[]);
}

function savedState() {
  try {
    const saved = JSON.parse(localStorage.getItem('hp12c-state') || 'null');
    return initializeDefaults(restoreState(saved),localStorage.getItem('hp12c-default-program') !== DEFAULT_PROGRAM_VERSION,
      localStorage.getItem('hp12c-default-display') !== DEFAULT_DISPLAY_VERSION);
  } catch { return initializeDefaults(restoreState(INITIAL_STATE),true); }
}
function panelReducer(current,action){
 if(action.type==='state')return {...current,state:typeof action.updater==='function'?action.updater(current.state):action.updater};
 if(action.type==='clear-history')return {...current,history:[]};
 if(action.type==='restore-history')return {...current,history:action.history};
 const state=displayDefaults(pressKey(current.state,action.id));
 const entry=historyEntry(current.state,state,resolveKeyAction(action.id,current.state.shift),{id:action.eventId,time:action.time,display:formatDisplay(state)});
 return {state,history:appendHistory(current.history,entry)};
}
export function App() {
  useJoinedFrame();
  useHeaderAlignment();
  const [{state,history},dispatch]=useReducer(panelReducer,null,()=>({state:savedState(),history:readHistory(localStorage)}));
  const setState=useCallback(updater=>dispatch({type:'state',updater}),[]);
  const [prefs,setPrefs]=useState(()=>readUiSettings(localStorage));
  const latestSaved=useRef({state,history,prefs});
  useLayoutEffect(()=>{latestSaved.current={state,history,prefs}},[state,history,prefs]);
  useEffect(()=>{const flush=()=>{try{const current=latestSaved.current;localStorage.setItem('hp12c-state',JSON.stringify(current.state));localStorage.setItem(HISTORY_KEY,JSON.stringify(current.history));localStorage.setItem(UI_SETTINGS_KEY,JSON.stringify(current.prefs))}catch{}};const hidden=()=>{if(document.visibilityState==='hidden')flush()};window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',hidden);return()=>{window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',hidden)}},[]);
  const audio=useRef(null),eventCounter=useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const heldKeys = useRef(new Set());
  const backupInput=useRef(null);
  const activate=useCallback(id=>{
    if(prefs.vibration&&typeof navigator.vibrate==='function')navigator.vibrate(12);
    if(prefs.sound){try{const Context=window.AudioContext||window.webkitAudioContext;if(Context){const ctx=audio.current||(audio.current=new Context());ctx.resume().then(()=>{const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.frequency.value=880;gain.gain.setValueAtTime(.035,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.035);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+.04)}).catch(()=>{})}}catch{}}
    dispatch({type:'key',id,eventId:Date.now()+'-'+(++eventCounter.current),time:new Date().toISOString()});
  },[prefs.sound,prefs.vibration]);
  useEffect(()=>{const timer=setTimeout(()=>{try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history));localStorage.setItem(UI_SETTINGS_KEY,JSON.stringify(prefs))}catch{}},150);return()=>clearTimeout(timer)},[history,prefs]);
  useEffect(()=>{if(!prefs.suspendSeconds||menuOpen||!state.powered||state.running||state.paused)return;let timer;const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>setState(current=>displayDefaults(pressAction(current,'off'))),prefs.suspendSeconds*1000)};reset();window.addEventListener('pointerdown',reset);window.addEventListener('keydown',reset);return()=>{clearTimeout(timer);window.removeEventListener('pointerdown',reset);window.removeEventListener('keydown',reset)}},[prefs.suspendSeconds,menuOpen,state.powered,state.running,state.paused,setState]);
  useEffect(()=>()=>{audio.current?.close().catch(()=>{})},[]);
  useEffect(()=>{for(const el of document.querySelectorAll('.keys,.brand'))el.inert=menuOpen;return()=>{for(const el of document.querySelectorAll('.keys,.brand'))el.inert=false}},[menuOpen]);
  const openMenu=useCallback(()=>setMenuOpen(true),[]);
  useEffect(() => {
    try {
      localStorage.setItem('hp12c-default-display',DEFAULT_DISPLAY_VERSION);
      if (localStorage.getItem('hp12c-default-program') !== DEFAULT_PROGRAM_VERSION) {
        const previous = JSON.parse(localStorage.getItem('hp12c-state') || 'null');
        if (previous?.program?.length) localStorage.setItem('hp12c-program-before-default',JSON.stringify(previous.program));
        localStorage.setItem('hp12c-default-program',DEFAULT_PROGRAM_VERSION);
      }
    } catch {}
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => { try { localStorage.setItem('hp12c-state', JSON.stringify(state)); } catch {} }, 150);
    return () => clearTimeout(timer);
  }, [state]);
  useEffect(() => {
    if (!state.paused || !state.program.length || state.displayLabel === 'PROGRAMA PAUSADO') return;
    const timer = setTimeout(() => setState(current => displayDefaults(pressAction(current, 'runStop'))), 1000);
    return () => clearTimeout(timer);
  }, [state.paused, state.program.length, state.displayLabel]);
  useEffect(() => {
    const handle = event => {
      if(event.defaultPrevented||event.target?.closest?.('input,textarea,select,.lcd,.lcd-transfer-dialog,[contenteditable="true"]'))return;
      if (menuOpen || diagnosticsOpen) {
        if(event.key==='Backspace')event.preventDefault();
        if(event.key==='Escape'){setMenuOpen(false);setDiagnosticsOpen(false)}
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target?.tagName === 'BUTTON' && [' ', 'Enter'].includes(event.key)) return;
      if (event.key === 'Backspace' || event.key === '=') {
        event.preventDefault(); setState(current => displayDefaults(pressAction(current, event.key === '=' ? 'equals' : 'backspace'))); return;
      }
      const shortcut = event.code === 'Space' ? 'Enter' : event.key === ',' ? '.' : event.key;
      const key = KEY_DEFINITIONS.find(key => key.shortcut.toUpperCase() === shortcut.toUpperCase());
      if (!key || event.key === 'Tab') return;
      event.preventDefault(); activate(key.id);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [menuOpen, diagnosticsOpen, activate]);
  useEffect(() => {
    if (state.displayLabel !== 'MANTISSA' || !state.displayOverride) return;
    const timer = setTimeout(() => setState(current => ({ ...current, displayOverride: null })), 650);
    return () => clearTimeout(timer);
  }, [state.displayLabel, state.displayOverride]);
  useEffect(()=>{
    const calculator=document.querySelector('.calculator');
    const movable=target=>target.closest?.('.menu-panel,.viewport-diagnostics,textarea');
    const stopDrag=event=>{if(!movable(event.target)&&event.cancelable)event.preventDefault()};
    calculator.addEventListener('touchmove',stopDrag,{passive:false});
    calculator.addEventListener('contextmenu',stopDrag);
    return()=>{calculator.removeEventListener('touchmove',stopDrag);calculator.removeEventListener('contextmenu',stopDrag)};
  },[]);
  const saveBackup=()=>{
    try{
      const backup=createBackup(localStorage,state);
      backup.entries[HISTORY_KEY]=JSON.stringify(history);
      backup.entries[UI_SETTINGS_KEY]=JSON.stringify(prefs);
      const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='hp12c-backup-'+new Date().toISOString().slice(0,10)+'.json';
      document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      setNotice('Backup gerado. Confirme que o arquivo foi salvo antes de remover o app.');
    }catch{setNotice('Não foi possível gerar o backup. Nenhum dado foi alterado.');}
  };
  const importBackup=async event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try{
      if(file.size>1024*1024)throw new Error();
      const backup=parseBackup(await file.text());
      const restored=restoreState(backup.state);
      restoreBackupStorage(localStorage,backup.entries);
      dispatch({type:'restore-history',history:readHistory(localStorage)});
      setPrefs(readUiSettings(localStorage));
      setState(restored);setMenuOpen(false);setNotice('Backup restaurado: programas, registradores e configurações.');
    }catch{setNotice('Não foi possível restaurar este arquivo. Os dados atuais foram mantidos.');}
  };
  const display = formatDisplay(state);
  const fullscreen = async () => {
    setMenuOpen(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setNotice('No iPhone: Compartilhar → Adicionar à Tela de Início → Abrir como app.');
    } catch { setNotice('Para abrir sem as barras do navegador, adicione a calculadora à Tela de Início.'); }
  };
  return <main className="page">
    <div className="ios-pwa-blur-sentinel" aria-hidden="true"/>
    <div className="status-bar-color" aria-hidden="true"><span/><span/></div>
    <section className="calculator" data-case-width-mm="129" data-case-height-mm="79" data-case-depth-mm="15" aria-label="Calculadora financeira HP 12c Platinum">
      <header className="silver-panel"><div className="model-name"><strong>HP 12c</strong><span>Platinum</span></div><button className="brand" aria-label="Menu da calculadora" title="Abrir menu" onClick={() => setMenuOpen(true)}><img src={`${import.meta.env.BASE_URL}assets/hp-emblem-hd.png`} alt="HP"/></button></header>
      <Lcd state={state} display={display} disabled={menuOpen||diagnosticsOpen}/>
      <div className="keyboard-crossbar" aria-hidden="true"/>
      <div className="keyboard-frame" aria-hidden="true"/>
      <div className="keyboard-lower-bridge" aria-hidden="true"/>
      <div className="keyboard-panel" aria-hidden="true"/>
      <div className="portrait-footer-frame" aria-hidden="true"><span className="footer-corner-transition"/></div>
      <Brackets/>
      <FaceKeys activate={activate} heldKeys={heldKeys} menu={openMenu} keyEntry={prefs.keyEntry}/>
      <footer className="maker-strip" aria-hidden="true"><span className="maker-name"><span className="maker-lettering">HEWLETT <span className="maker-dot"/> PACKARD</span></span></footer>
      {menuOpen&&<HpMenu state={state} history={history} prefs={prefs} setPrefs={setPrefs} onClose={()=>setMenuOpen(false)}
        onRecall={value=>setState(recallResult(state,value,pressAction))} onEditMemory={(index,value)=>setState(editMemory(state,index,value))}
        onClearHistory={()=>dispatch({type:'clear-history'})}
        onReset={selected=>{setState(resetSelected(state,selected,INITIAL_STATE));if(selected.settings)setPrefs({...UI_DEFAULTS});if(selected.history)dispatch({type:'clear-history'})}}
        onBackup={saveBackup} onRestore={()=>backupInput.current.click()} onFullscreen={fullscreen}
        onDiagnostics={()=>{setMenuOpen(false);setDiagnosticsOpen(true)}} onAngular={()=>setState(current=>displayDefaults(pressAction(current,'toggleAngular')))}
        onRestoreProgram={()=>setState(current=>initializeDefaults(current,true,false))} onPower={()=>activate('on')}/>} 
      {diagnosticsOpen && <ViewportDiagnostics onClose={()=>setDiagnosticsOpen(false)}/>}
      <input ref={backupInput} type="file" accept="application/json,.json" hidden aria-label="Arquivo de backup" onChange={importBackup}/>
      {notice && <button className="notice" onClick={() => setNotice('')}>{notice}</button>}
    </section>
  </main>;
}

