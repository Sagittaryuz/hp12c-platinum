import React, {memo, useRef, useEffect} from 'react';
import { KEY_DEFINITIONS } from '@sagittaryuz/hp12c-core';

// Coordinates measured from the supplied landscape and portrait references.
// Each face has its own geometry; the calculator engine remains shared.
const portraitRows = [
  ['sin','n','i','pv','pmt','fv'],
  ['cos','pow','reciprocal','pctT','deltaPct','pct'],
  ['tan','rs','sst','roll','swap','clx'],
  ['rcl','chs','7','8','9','divide'],
  ['sto','eex','4','5','6','multiply'],
  ['g','enter','1','2','3','minus'],
  ['f',null,'0','decimal','sigma','plus'],
];
// Row spacing inside the panel; bottom offsets anchor the final row to the base.
const portraitY = [5.2,21.2,36.5,49.8,63.1,76.4,89.7];
const landscapeY = [6.8,31.2,55.6,80];
const labelsF = {sst:'Σ',roll:'PRGM',swap:'',clx:'REG',enter:''};
export function keyPosition(key) {
  let r = 0, c = 0;
  portraitRows.forEach((row, ri) => { const ci = row.indexOf(key.id); if (ci >= 0) { r = ri; c = ci; } });
  return {
    '--dx':`${(key.col+1)*9.3}%`, '--db':`${key.id === 'enter' ? 0 : landscapeY.at(-1)-landscapeY[key.row]}%`,
    '--dw':'7.9%', '--dh':`${key.id === 'enter' ? 41.1 : 16.5}%`,
    '--mx':`${c*17.4}%`, '--mb':`${key.id === 'enter' ? 0 : portraitY.at(-1)-portraitY[r]}%`,
    '--d-offset':(key.id==='enter'?0:(landscapeY.at(-1)-landscapeY[key.row])/100),'--d-height':key.id==='enter'?.411:.165,'--d-spread':key.id==='enter'?0:(3-key.row)/3,
    '--m-offset':(key.id==='enter'?0:(portraitY.at(-1)-portraitY[r])/100),'--m-height':key.id==='enter'?.229:.096,'--m-spread':key.id==='enter'?0:(6-r)/6,
    '--mw':'14.9%', '--mh':`${key.id === 'enter' ? 22.9 : 9.6}%`,
    '--reference-x':(184 + key.col*172)/2048,
    '--reference-y':([232,416,600,770][key.row]-178)/696,
    '--reference-height':(key.id==='enter'?274:104)/696,
  };
}
export function Legend({value}) {
  const math = (v) => <span className="math">{v}</span>;
  switch(value) {
    case 'yˣ': return math(<>Y<sup>x</sup></>);
    case 'Δ%': return <><span className="greek">Δ</span>%</>;
    case 'Σ+': return <><span className="greek">Σ</span>+</>;
    case 'Σ−': return <><span className="greek">Σ</span>−</>;
    case '1/x': return <>1/{math('x')}</>;
    case 'eˣ': return math(<>e<sup>x</sup></>);
    case '√x': return math(<>√<span className="radicand">x</span></>);
    case 'x↔y': return math(<>x<span className="swap-sign">↔</span>y</>);
    case 'x≤y': return math(<>x<span className="swap-sign">≤</span>y</>);
    case 'CLx': return <>CL{math('x')}</>;
    case 'x=0': return <>{math('x')}=0</>;
    case 'x²': return math(<>x<sup>2</sup></>);
    case 'x̂,r': return math('x̂, r');
    case 'ŷ,r': return math('ŷ, r');
    case 'x̄w': return <>{math('x̄')}w</>;
    case 'x̄': return math('x̄');
    case 'LST x': return <>LST{math('x')}</>;
    case 'CF₀': return 'CFo';
    case 'CFⱼ': return 'CFj';
    case 'Nⱼ': return 'Nj';
    case 'R↓': return <>R<svg className="roll-arrow" viewBox="0 0 16 24" aria-hidden="true"><path d="M7 1h2v16l5-5 1.4 1.4L8 21l-7.4-7.6L2 12l5 5Z" fill="currentColor"/></svg></>;
    case '.': return '·';
    case '←': return <svg className="back-icon" viewBox="0 0 64 36" aria-hidden="true"><path d="M7 29C13-4 56-4 60 26M7 29 4 17M7 29 19 20"/></svg>;
    case 'UNDO': return <svg className="back-icon" viewBox="0 0 64 36" aria-hidden="true"><path className="back-arrow" d="M8 18 23 8v7h35v6H23v7Z"/></svg>;
    default:return value;
  }
}
export const FaceKeys = memo(function FaceKeys({activate, heldKeys, menu}) {
  const pointers=useRef(new Map());
  useEffect(()=>{const cancelOther=e=>{for(const [id,p]of pointers.current)if(id!==e.pointerId)p.cancelled=true};const cancel=()=>{pointers.current.clear();heldKeys.current.clear()};window.addEventListener('pointerdown',cancelOther,true);window.addEventListener('blur',cancel);window.addEventListener('pagehide',cancel);window.addEventListener('resize',cancel);const hidden=()=>{if(document.hidden)cancel()};document.addEventListener('visibilitychange',hidden);return()=>{cancel();window.removeEventListener('pointerdown',cancelOther,true);window.removeEventListener('blur',cancel);window.removeEventListener('pagehide',cancel);window.removeEventListener('resize',cancel);document.removeEventListener('visibilitychange',hidden)}},[heldKeys]);
  const cancelKey=e=>{pointers.current.delete(e.pointerId);heldKeys.current.clear()};
  const keys = [...KEY_DEFINITIONS.filter(key => key.id !== 'on'),{id:'menu',label:'MENU',f:'',g:'',row:3,col:0}];
  return <div className="keys" role="group" aria-label="Teclas da calculadora">
    {keys.map(key => {
      const f = key.printF === false ? '' : (labelsF[key.id] ?? key.f);
      return <button key={key.id} className={`key key-${key.id} ${key.tone || ''}`} style={keyPosition(key)}
        onPointerDown={event=>{if(event.button!==0||event.isPrimary===false)return;pointers.current.set(event.pointerId,{key:key.id,x:event.clientX,y:event.clientY,cancelled:false});heldKeys.current.add(key.id);try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}}}
        onPointerMove={event=>{const p=pointers.current.get(event.pointerId);if(p&&Math.hypot(event.clientX-p.x,event.clientY-p.y)>12)p.cancelled=true}}
        onPointerUp={event=>{const p=pointers.current.get(event.pointerId);cancelKey(event);if(!p||p.cancelled||p.key!==key.id||Math.hypot(event.clientX-p.x,event.clientY-p.y)>12)return;const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)return;key.id==='menu'?menu():activate(key.id)}}
        onPointerCancel={cancelKey} onLostPointerCapture={cancelKey}
        onClick={event=>{if(event.detail!==0)return;key.id==='menu'?menu():activate(key.id)}}
        aria-label={key.id === 'menu' ? 'MENU' : `${key.label}; f: ${key.f || '—'}; g: ${key.g || '—'}`}
        title={key.id === 'menu' ? 'Menu da calculadora' : `${key.label} · atalho ${key.shortcut}`}>
        {f && <span className="legend-f">{f}</span>}
        {key.id==='swap' && <span className="legend-f legend-f-portrait">FIN</span>}
        <span className="key-shell"><span className="key-cap">{key.id === 'menu' ? <><span className="menu-label">MENU</span><svg className="menu-icon" viewBox="0 0 40 40" aria-hidden="true"><path d="M3 8h34M3 20h34M3 32h34"/></svg></> : key.id === 'enter' ? <span className="enter-letters">{[...'ENTER'].map((letter,i)=><span key={i}>{letter}</span>)}</span> : <Legend value={key.label}/>}</span>
          {key.g && <span className="legend-g"><Legend value={key.g}/></span>}
        </span>
      </button>;
    })}
  </div>;
});
export function Brackets() {
  return <div className="brackets" aria-hidden="true">
    <div className="bracket bond"><span>BOND</span></div>
    <div className="bracket depreciation"><span>DEPRECIATION</span></div>
    <div className="bracket clear"><span className="clear-landscape">CLEAR FIN</span><span className="clear-portrait">CLEAR</span></div>
    <div className="bracket prefix"><span>PREFIX</span></div>
  </div>;
}

