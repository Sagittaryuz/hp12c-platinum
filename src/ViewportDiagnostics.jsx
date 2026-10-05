import React, {useEffect, useState} from 'react';
import {collectViewportDiagnostics} from './viewport-diagnostics.mjs';
export function ViewportDiagnostics({onClose}) {
  const [samples,setSamples]=useState(()=>[collectViewportDiagnostics('open')]);
  const [marked,setMarked]=useState(false);
  const [copyStatus,setCopyStatus]=useState('');
  const refresh=reason=>setSamples(current=>[...current.slice(-11),collectViewportDiagnostics(reason)]);
  useEffect(()=>{
    const handle=event=>refresh(event.type);
    for(const event of ['resize','orientationchange','pageshow'])window.addEventListener(event,handle);
    document.addEventListener('visibilitychange',handle);
    window.visualViewport?.addEventListener('resize',handle);
    return ()=>{
      for(const event of ['resize','orientationchange','pageshow'])window.removeEventListener(event,handle);
      document.removeEventListener('visibilitychange',handle);
      window.visualViewport?.removeEventListener('resize',handle);
      document.documentElement.classList.remove('viewport-marked');
    };
  },[]);
  const mark=()=>{
    document.documentElement.classList.toggle('viewport-marked',!marked);
    setMarked(!marked);refresh('markers');
  };
  const report=JSON.stringify({samples},null,2);
  const current=samples.at(-1);
  const copy=async()=>{
    try{await navigator.clipboard.writeText(report);setCopyStatus('Medidas copiadas.');}
    catch{setCopyStatus('Selecione o texto abaixo e copie manualmente.');}
  };
  return <>
    {marked&&<div className="viewport-marker-layer" aria-hidden="true"><div className="viewport-fixed-edge"/><div className="viewport-lvh-edge"/><div className="viewport-dvh-edge"/></div>}
    <section className="viewport-diagnostics" role="dialog" aria-modal="true" aria-label="Diagnóstico da tela">
      <h2>Diagnóstico da tela</h2>
      <p>Altura app: <strong>{current.rectangles.page?.height}</strong> · janela: <strong>{current.window.innerHeight}</strong> · tela: <strong>{current.screen.height}</strong> px</p>
      <p>dvh: {current.cssUnits.dvh} · lvh: {current.cssUnits.lvh} · área segura inferior: {current.safeArea.bottom} px</p>
      <p>Não altera programas ou configurações. As cores são temporárias; a altura da tela não garante área acessível ao app.</p>
      <button onClick={mark}>{marked?'Remover cores':'Marcar limites com cores'}</button>
      <p>Verde: fim do viewport fixo. Branco: 100lvh. Amarelo: 100dvh. Se a faixa continuar abaixo das linhas, envie o print e as medidas.</p>
      <button onClick={()=>refresh('manual')}>Atualizar medidas</button><button onClick={copy}>Copiar medidas</button>
      <p role="status">{copyStatus}</p>
      <textarea readOnly value={report} aria-label="Medidas da tela" onFocus={event=>event.target.select()}/>
      <button onClick={onClose}>Fechar diagnóstico</button>
    </section>
  </>;
}
