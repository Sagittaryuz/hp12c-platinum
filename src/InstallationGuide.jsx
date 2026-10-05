import {useEffect,useRef,useState} from 'react';
import {HpIcon} from './HpIcon';
const duration=11800;
export function InstallationGuide({onClose}){
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [elapsed,setElapsed]=useState(0),[playing,setPlaying]=useState(!reduced),[run,setRun]=useState(0);
 const close=useRef(null);
 useEffect(()=>{close.current?.focus();const q=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>{setReduced(q.matches);if(q.matches)setPlaying(false)};q.addEventListener('change',change);return()=>q.removeEventListener('change',change)},[]);
 useEffect(()=>{if(!playing||reduced)return;const timer=setInterval(()=>setElapsed(old=>Math.min(duration,old+100)),100);return()=>clearInterval(timer)},[playing,reduced,run]);
 useEffect(()=>{if(elapsed===duration)setPlaying(false)},[elapsed]);
 const phase=elapsed<1300?'initial':elapsed<3500?'menu':elapsed<7400?'sheet':elapsed<9300?'confirm':elapsed<10300?'success':'done';
 const step=elapsed<3500?0:elapsed<9300?1:2;
 const replay=()=>{setElapsed(0);setRun(r=>r+1);setPlaying(true)};
 const keyDown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose()}if(e.key==='Tab'){const buttons=[...e.currentTarget.querySelectorAll('button')].filter(b=>!b.disabled);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}e.stopPropagation()}};
 return <div className="hp-install-shade" onClick={onClose}><section className="hp-install-card" role="dialog" aria-modal="true" aria-labelledby="install-title" onKeyDown={keyDown} onClick={e=>e.stopPropagation()}>
  <button ref={close} className="hp-install-close" aria-label="Fechar instruções de instalação" onClick={onClose}><HpIcon name="x"/></button>
  <h2 id="install-title" className="hp-sr-only">Como instalar no iPhone</h2>
  <div className={`install-demo phase-${phase} ${playing?'playing':'paused'}`} aria-hidden="true" key={run}>
   <div className="install-phone">
    <div className="demo-camera"/>
    <div className="demo-address">HP 12c Platinum</div>
    <div className="demo-app"><img src={`${import.meta.env.BASE_URL}icons/hp12c-platinum-v2-192.png`} alt=""/><strong>HP 12c Platinum</strong></div>
    <div className="demo-toolbar"><HpIcon name="chevron-left"/><span className="demo-share"><HpIcon name="share"/></span><HpIcon name="book-open"/></div>
    <div className="demo-safari-menu"><span>Menu do Safari</span><span className="demo-menu-share"><HpIcon name="share"/> Compartilhar</span></div>
    <div className="demo-share-sheet"><span className="demo-grip"/><strong>HP 12c Platinum</strong><div className="demo-app-row"><HpIcon name="share"/><HpIcon name="book-open"/><HpIcon name="download"/></div><span>Copiar</span><span>Adicionar aos Favoritos</span><span className="demo-add-home"><HpIcon name="square-plus"/> Adicionar à Tela de Início</span></div>
    <div className="demo-confirm"><strong>Adicionar à Tela de Início</strong><img src={`${import.meta.env.BASE_URL}icons/hp12c-platinum-v2-192.png`} alt=""/><span>HP 12c Platinum</span><span className="demo-add-button">Adicionar</span></div>
   </div>
   <div className="demo-success"><HpIcon name="circle-check"/><span>Confirme no Safari</span></div>
   <span className="demo-caption">Ilustração dos passos</span>
  </div>
  <ol className="install-steps">
   {[['share','Compartilhar','No Safari, abra o menu e toque em Compartilhar.'],['square-plus','Adicionar à Tela de Início','Role as ações e escolha Adicionar à Tela de Início.'],['circle-check','Confirmar adição','Mantenha Abrir como app web ativo e toque em Adicionar.']].map(([icon,title,text],i)=><li key={title} className={step===i?'current':''}><HpIcon name={icon}/><div><strong>{title}</strong><p>{text}</p></div></li>)}
  </ol>
  <p className="install-disclaimer">Esta demonstração não instala o app nem confirma uma instalação. Abra o novo ícone na Tela de Início.</p>
  <div className="install-controls"><button onClick={replay} disabled={reduced}><HpIcon name="rotate-ccw"/>Repetir</button><button onClick={()=>setPlaying(p=>!p)} disabled={reduced||elapsed===duration}><HpIcon name={playing?'pause':'play'}/>{playing?'Pausar':'Continuar'}</button></div>
  {reduced&&<p className="install-disclaimer">Animação pausada pela preferência de movimento reduzido.</p>}
 </section></div>;
}
