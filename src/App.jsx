import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowCounterClockwise, CaretDown, Check, Command, GithubLogo, Keyboard, MagnifyingGlass,
  SlidersHorizontal, Sparkle, X,
} from "@phosphor-icons/react";
import { CalculatorModel } from "./calculator/CalculatorModel.jsx";
import { INITIAL_STATE, formatDisplay, pressAction, pressKey, restoreState, KEY_DEFINITIONS } from "@sagittaryuz/hp12c-core";

const descriptions = {
  n: "Períodos do cálculo financeiro", i: "Taxa de juros por período", pv: "Valor presente", pmt: "Pagamento periódico", fv: "Valor futuro",
  amortize: "Amortização: juros e principal acumulados", interest: "Juros acumulados", npv: "Valor presente líquido", irr: "Taxa interna de retorno",
  begin: "Pagamentos no início do período", end: "Pagamentos no fim do período", sigmaPlus: "Adiciona um par x/y às estatísticas",
  sigmaMinus: "Remove o último par das estatísticas", meanX: "Média de x", meanY: "Média de y", stddev: "Desvio padrão de x",
  sumX: "Número de observações", sumX2: "Desvio padrão amostral de x", sumY: "Desvio padrão amostral de y",
  pct: "Porcentagem do valor base", pctT: "Percentual de x em relação a y", deltaPct: "Variação percentual entre x e y",
  reciprocal: "Inverso de x", pow: "Potência y elevado a x", program: "Programa: grava sequência de teclas", runStop: "Executa ou pausa o programa",
  roll: "Desloca a pilha RPN", swap: "Troca x e y", clx: "Apaga o visor x", eex: "Expoente de dez", chs: "Troca o sinal",
  modeRpn: "Seleciona entrada RPN", finance: "Funções financeiras", registers: "Registradores de memória", prefix: "Indicador de prefixo",
  clearFin: "Limpa registros financeiros", clearReg: "Limpa registradores e estatística", date: "Soma dias a uma data MM.DDYYYY",
  simple: "Juros simples", bond: "Cálculos de títulos", depr: "Depreciação linear", prime: "Teste de primalidade simplificado",
  "12x": "Multiplica o valor por 12", "12div": "Divide o valor por 12", memory: "Estado dos registradores locais",
  round: "Arredonda o valor interno conforme o visor",
  cf0: "Guarda o investimento inicial; reinicia os fluxos",
  cfj: "Adiciona um fluxo e incrementa n", nj: "Número de repetições do último fluxo (1–99)",
  bondPrice: "Preço de título com cupons semestrais, base real/real", bondYield: "Rendimento até o vencimento de título",
  deprSL: "Depreciação linear no ano informado", deprSOYD: "Depreciação pela soma dos dígitos dos anos", deprDB: "Depreciação por saldo decrescente",
  mean: "Médias de x e y retornadas em X e Y", weightedMean: "Média ponderada: X é o peso e Y é o item",
  estimateX: "Estima x a partir de y; correlação em Y", estimateY: "Estima y a partir de x; correlação em Y",
  sqrt: "Raiz quadrada de X", exp: "Exponencial natural e elevado a X", ln: "Logaritmo natural de X",
  square: "Quadrado de X", frac: "Parte fracionária de X", intg: "Parte inteira de X", factorial: "Fatorial de X inteiro, de 0 a 69",
  mdy: "Datas em mês.diaano", dmy: "Datas em dia.mêsano", date: "Data em Y mais os dias em X; exibe dia da semana",
  days: "Dias entre Y e X; base real em X e 30/360 em Y", modeAlg: "Modo algébrico com precedência e parênteses",
  clearStats: "Limpa R1–R6 e a pilha estatística", clearProgram: "Reinicia o programa; no modo P/R apaga instruções",
  testLe: "No programa, pula a próxima linha se X for maior que Y", testZero: "No programa, pula a próxima linha se X não for zero",
  step: "Executa a próxima linha do programa", backStep: "Volta uma linha no programa", goto: "GTO seguido de três dígitos; . e três dígitos posicionam a linha",
  pause: "Pausa o programa por um segundo", undo: "Restaura o estado anterior", backspace: "Apaga o último dígito; fora da entrada limpa X",
  parenOpen: "Abre parêntese em ALG", parenClose: "Fecha parêntese em ALG", equals: "Conclui a expressão em ALG",
  scientific: "Mostra notação científica", on: "Liga ou desliga; a memória é preservada", off: "Desliga mantendo a memória",
  store: "Guarda em 0–9, .0–.9 ou registro financeiro", recall: "Recupera 0–9, .0–.9 ou registro financeiro",
  enter: "Duplica X na pilha RPN; conclui expressão em ALG", decimal: "Separador decimal da entrada",
};
for(let i=0;i<=9;i++){descriptions[String(i)]='Entrada de dígito';descriptions[`fixed${i}`]=`Exibe ${i} casas decimais; preserva a precisão interna`;}
Object.assign(descriptions,{interest:'Juros simples: bases 360 (X) e 365 (Z)',amortize:'Juros em X, principal em Y; atualiza PV e n','12x':'Multiplica X por 12 e guarda n','12div':'Divide X por 12 e guarda i',memory:'Capacidade de programa e registradores',prefix:'Cancela prefixos e mostra a mantissa de X',stddev:'Desvios padrão amostrais em X e Y',sigmaMinus:'Subtrai o par X/Y das estatísticas'});

function shortcutLabel(shift, shortcut) {
  const shown = shortcut === "Space" ? "Espaço" : shortcut === "ArrowRight" ? "→" : shortcut === "ArrowDown" ? "↓" : shortcut;
  return shift ? `${shift === "f" ? "F1" : "F2"}  ${shown}` : shown;
}

function readSaved() {
  try { return restoreState(JSON.parse(localStorage.getItem("hp12c-state") || "null")); }
  catch { return restoreState(INITIAL_STATE); }
}

export function App() {
  const [state, setState] = useState(readSaved);
  const [selectedKey, setSelectedKey] = useState("0");
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState('front');
  const [offlineReady, setOfflineReady] = useState(false);
  const dialogRef=useRef(null);
  useEffect(() => { if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.VITE_DESKTOP_BUILD !== '1') navigator.serviceWorker.ready.then(() => setOfflineReady(true)); }, []);
  useEffect(() => { if (state.paused && state.program.length && state.displayLabel !== 'PROGRAMA PAUSADO') { const timer=setTimeout(() => setState(s => pressAction(s, 'runStop')), 1000); return () => clearTimeout(timer); } }, [state.paused, state.program.length, state.displayLabel]);

  useEffect(() => { localStorage.setItem("hp12c-state", JSON.stringify(state)); }, [state]);
  useEffect(()=>{if(!shortcutOpen&&!keypadOpen)return;const prior=document.activeElement;const dialog=dialogRef.current;const nodes=()=>[...dialog.querySelectorAll('button,input,select,a[href]')].filter(n=>!n.disabled);const first=dialog.querySelector('input')||nodes()[0];first?.focus();const trap=event=>{if(event.key!=='Tab')return;const list=nodes(),first=list[0],last=list.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}};dialog.addEventListener('keydown',trap);return()=>{dialog.removeEventListener('keydown',trap);prior?.focus();};},[shortcutOpen,keypadOpen]);

  const activate = (id) => {
    setSelectedKey(id);
    setState((current) => pressKey(current, id));
  };

  const activateFunction = (id, shift) => {
    setSelectedKey(id);
    setState((current) => {
      const prefixed = shift ? pressKey(current, shift) : current;
      return pressKey(prefixed, id);
    });
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if(event.key==='Escape'&&(shortcutOpen||keypadOpen)){event.preventDefault();setShortcutOpen(false);setKeypadOpen(false);return;}
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))) return;
      if(event.key==='?'||((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k')){event.preventDefault();setShortcutOpen(true);return;}
      if(event.ctrlKey||event.metaKey||event.altKey)return;
      if(event.key==='Tab'&&(shortcutOpen||keypadOpen))return;
      if(event.target?.tagName==='BUTTON'&&['Enter',' '].includes(event.key))return;
      if(event.key==='Backspace'){event.preventDefault();setState(s=>pressAction(s,'backspace'));setSelectedKey('divide');return;}
      if(event.key==='='){event.preventDefault();setState(s=>pressAction(s,'equals'));setSelectedKey('enter');return;}
      const shortcut = event.code === "Space" ? "Enter" : event.key.length === 1 ? event.key.toUpperCase() : event.key;
      const key = KEY_DEFINITIONS.find((definition) => definition.shortcut.toUpperCase() === shortcut.toUpperCase());
      if (!key) return;
      event.preventDefault();
      activate(key.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcutOpen, keypadOpen]);

  const functionRows = useMemo(() => {
    const rows = KEY_DEFINITIONS.filter((key) => key.tone !== "shift-f" && key.tone !== "shift-g");
    const needle = query.trim().toLowerCase();
    return rows.filter((key) => {
      const entries = [
        { shift: null, name: key.label, action: key.action },
        { shift: "f", name: key.f, action: key.fAction },
        { shift: "g", name: key.g, action: key.gAction },
      ];
      const available = entries.filter((entry) => entry.name && entry.action && (filter === "all" || entry.shift === filter));
      return available.some((entry) => `${key.id} ${key.label} ${key.f} ${key.g} ${entry.name} ${descriptions[entry.action] || ""} ${key.shortcut}`.toLowerCase().includes(needle));
    });
  }, [filter, query]);

  const copyShortcuts = async () => {
    const table = KEY_DEFINITIONS.map((key) => `${key.label}\t${key.f || "—"}\t${key.g || "—"}\t${key.shortcut}`).join("\n");
    try { await navigator.clipboard.writeText(`Tecla\tf\tg\tAtalho\n${table}`); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  };

  const display = formatDisplay(state);
  const showOverlay = shortcutOpen || keypadOpen;

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand-lockup" href="#inicio" aria-label="HP 12c Platinum — início">
        <span className="brand-mark">12<span>c</span></span>
        <span className="brand-copy"><strong>PLATINUM</strong><small>CALCULADORA FINANCEIRA</small></span>
      </a>
      <nav className="top-nav" aria-label="Navegação principal">
        <span className="nav-item nav-active">Calculadora</span>
        <button className="nav-item" onClick={() => setShortcutOpen(true)}>Funções</button>
        <a className="nav-item" href="https://github.com/Sagittaryuz/hp12c-platinum/releases/latest" target="_blank" rel="noreferrer">Baixar Windows</a>
      </nav>
      <div className="top-actions">
        <button className="header-button" onClick={() => setKeypadOpen(true)}><Keyboard size={17} weight="bold" /> <span>Teclado</span></button>
        <button className="header-button shortcut-launch" onClick={() => setShortcutOpen(true)}><Command size={16} weight="bold" /> <span>Atalhos</span><kbd>?</kbd></button>
      </div>
    </header>

    <section className="intro-strip" id="inicio">
      <div><span className="eyebrow"><span className="status-dot" /> MOTOR DE CÁLCULO LOCAL</span>
        <h1>HP 12c Platinum</h1>
        <p>Calculadora financeira · RPN e ALG · memória contínua local.</p>
      </div>
      <div className="intro-meta"><span className="version-chip"><span className="live-dot" /> {offlineReady ? 'OFFLINE PRONTO' : 'MOTOR LOCAL'}</span><small>Suas contas permanecem neste dispositivo.</small></div>
    </section>

    <section className="workspace" aria-label="Calculadora HP 12c Platinum">
      <div className="model-column">
        <div className="model-toolbar">
          <div className="model-caption"><span className="caption-icon"><Sparkle size={15} weight="fill" /></span><span><strong>MODELO INTERATIVO</strong><small>Arraste para girar · role para aproximar</small></span></div>
          <div className="mode-switch" role="group" aria-label="Modo de cálculo">
            <button className={state.mode === "RPN" ? "selected" : ""} onClick={() => setState((s) => pressAction(s, "modeRpn"))}>RPN</button>
            <button className={state.mode === "ALG" ? "selected" : ""} onClick={() => setState((s) => pressAction(s, "modeAlg"))}>ALG</button>
          </div>
        </div>
        <div className="device-stage">
          <div className="stage-grid" />
          <div className="view-chip"><span className="live-dot" /><select aria-label="Vista do modelo 3D" value={view} onChange={event=>setView(event.target.value)}>{[['front','Frente'],['back','Traseira'],['left','Lado esquerdo'],['right','Lado direito'],['top','Topo'],['bottom','Base']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
          <div className="model-size"><span>129 × 79 × 15 mm</span><small>dimensões nominais</small></div>
          <CalculatorModel display={display} status={`${state.mode}${state.tvm.begin?' · BEG':''} · ${state.displayLabel}`} selectedId={selectedKey} onPress={activate} view={view} />
          <button className="touch-hint" onClick={() => setKeypadOpen(true)}><Keyboard size={14} /> Clique em uma tecla para calcular</button>
        </div>
        <div className="model-footnote"><span className="footnote-mark">i</span><span>Modelo baseado nas seis vistas e dimensões nominais enviadas. Os detalhes das teclas seguem o manual oficial.</span></div>
      </div>

      <aside className="status-panel" aria-label="Estado da calculadora">
        <div className="panel-head"><div><span className="eyebrow">VISOR E PILHA</span><h2>Em execução</h2></div><span className="online-indicator"><i /> LOCAL</span></div>
        <div className="readout-card">
          <div className="readout-heading"><span>REGISTRO X</span><span className={state.error ? "display-error" : ""}>{state.error || state.displayLabel}</span></div>
          <strong>{display}</strong>
          <small>{state.mode} <span>·</span> {state.dateFormat==='MDY'?'M.DY':'D.MY'} {state.tvm.begin?' · BEG':''}</small>
        </div>
        <div className="stack-heading"><span>PILHA RPN</span><span>ÚLTIMO X <b>{state.lastX.toFixed(2)}</b></span></div>
        <div className="stack-list" aria-live="polite">
          <div><span>T</span><b>{state.t.toFixed(2)}</b></div>
          <div><span>Z</span><b>{state.z.toFixed(2)}</b></div>
          <div><span>Y</span><b>{state.y.toFixed(2)}</b></div>
          <div className="stack-x"><span>X</span><b>{state.x.toFixed(2)}</b></div>
        </div>
        <div className="panel-divider" />
        <div className="finance-head"><span>REGISTROS FINANCEIROS</span><button aria-label="Limpar registros financeiros" onClick={() => setState((s) => pressAction(s, "clearFin"))}><ArrowCounterClockwise size={15} /></button></div>
        <div className="finance-grid">
          {[["n", state.tvm.n], ["i", state.tvm.i], ["PV", state.tvm.pv], ["PMT", state.tvm.pmt], ["FV", state.tvm.fv]].map(([label, value]) => <div key={label}><span>{label}</span><b>{Number(value).toFixed(2)}</b></div>)}
        </div>
        <div className="panel-actions">
          <button className="action-secondary" onClick={() => setState((s) => pressAction(s, `fixed${(s.decimals+1)%10}`))}><SlidersHorizontal size={15} /> Casas: {state.decimals}</button>
          <button className="action-secondary" onClick={() => setState((s) => pressAction(s, "clx"))}>Limpar X <kbd>⌫</kbd></button>
        </div>
        <div className="panel-hint"><span className="hint-icon"><Check size={12} weight="bold" /></span><span>Motor e memória executam localmente. Nenhuma conta é enviada.</span></div>
        <details className="memory-detail"><summary>Programa <span>{state.program.length}/400 · linha {String(state.pc).padStart(3,'0')}</span></summary><div className="panel-actions"><button className="action-secondary" onClick={()=>activateFunction('rs','f')}>{state.programMode?'Sair de P/R':'Gravar P/R'}</button><button className="action-secondary" onClick={()=>activate('rs')}>R/S</button><button className="action-secondary" onClick={()=>activate('sst')}>SST</button></div><ol>{state.program.map((instruction,index)=><li key={index}>{String(index+1).padStart(3,'0')} · {instruction}</li>)}</ol></details>
        <details className="memory-detail"><summary>Fluxos de caixa <span>{state.cashflows.length-1}/80</span></summary><ol>{state.cashflows.map((value,index)=><li key={index}>CF{index} · {value.toFixed(2)} × {state.cashflowCounts[index]}</li>)}</ol></details>
      </aside>
    </section>

    <footer className="page-footer"><span>PROJETO INDEPENDENTE · SEM VÍNCULO COM A HP</span><a href="https://github.com/Sagittaryuz/hp12c-platinum" target="_blank" rel="noreferrer"><GithubLogo size={16} weight="fill" /> Código no GitHub <CaretDown size={13} className="external-mark" /></a></footer>

    {showOverlay && <div className="overlay-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShortcutOpen(false); setKeypadOpen(false); } }}>
      <section ref={dialogRef} className={`dialog ${shortcutOpen ? "shortcuts-dialog" : "keypad-dialog"}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <header className="dialog-header"><div><span className="eyebrow">GUIA RÁPIDO</span><h2 id="dialog-title">{shortcutOpen ? "Teclas e atalhos" : "Teclado acessível"}</h2></div><button className="close-dialog" aria-label="Fechar" onClick={() => { setShortcutOpen(false); setKeypadOpen(false); }}><X size={18} /></button></header>
        {shortcutOpen ? <>
          <p className="dialog-description">Consulte as funções impressas e use o teclado do computador. Toque numa função para destacá-la e acioná-la.</p>
          <div className="shortcut-search"><MagnifyingGlass size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tecla ou função…" autoFocus /><kbd>⌘ K</kbd></div>
          <div className="filter-tabs" role="tablist" aria-label="Filtrar funções">
            {[ ["all", "Todas"], [null, "Tecla"], ["f", "f · laranja"], ["g", "g · azul"] ].map(([value, label]) => <button key={String(value)} role="tab" aria-selected={filter === value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}
            <button className="copy-shortcuts" onClick={copyShortcuts}>{copied ? <Check size={14} /> : <Command size={14} />}{copied ? "Copiado" : "Copiar"}</button>
          </div>
          <div className="shortcut-list">
            {functionRows.map((key) => {
              const entries = [
                { shift: null, name: key.label, action: key.action }, { shift: "f", name: key.f, action: key.fAction }, { shift: "g", name: key.g, action: key.gAction },
              ].filter((entry) => entry.name && entry.action && (filter === "all" || entry.shift === filter));
              return <article className={`shortcut-row ${selectedKey === key.id ? "is-highlighted" : ""}`} key={key.id}>
                <div className="shortcut-key"><strong>{key.label}</strong><span>{key.id.toUpperCase()}</span></div>
                <div className="shortcut-functions">{entries.map((entry) => <button key={`${key.id}-${entry.shift || "base"}`} className={`function-choice ${entry.shift || "base"}`} onClick={() => activateFunction(key.id, entry.shift)} title={descriptions[entry.action] || entry.name}>
                  {entry.shift && <span className="function-prefix">{entry.shift}</span>}<span className="function-title">{entry.name} <kbd>{shortcutLabel(entry.shift,key.shortcut)}</kbd></span><small>{descriptions[entry.action] || "Função da tecla"}</small>
                </button>)}</div>
                <div className="shortcut-keycap"><kbd>{shortcutLabel(null, key.shortcut)}</kbd><small>atalho</small></div>
              </article>;
            })}
            {functionRows.length === 0 && <div className="empty-search">Nenhuma tecla corresponde a “{query}”.</div>}
          </div>
          <div className="dialog-footer"><span><b>F1</b> ativa f · <b>F2</b> ativa g · depois pressione o atalho da tecla</span><span>39 teclas físicas</span></div>
        </> : <>
          <p className="dialog-description">Cada botão envia o mesmo comando do modelo 3D e do teclado físico.</p>
          <div className="accessible-keypad" role="group" aria-label="Teclas físicas da calculadora">
            {KEY_DEFINITIONS.map((key) => <button key={key.id} style={{ gridColumn: `${key.col + 1}`, gridRow: key.id==='enter'?'3 / span 2':`${key.row + 1}` }} className={`accessible-key ${key.tone || ""} ${selectedKey === key.id ? "selected" : ""}`} onClick={() => activate(key.id)} aria-label={`${key.label}; f: ${key.f || "sem função"}; g: ${key.g || "sem função"}; atalho ${shortcutLabel(null, key.shortcut)}`}>
              {key.f && <small className="mini-f">{key.f}</small>}<strong>{key.label}</strong>{key.g && <small className="mini-g">{key.g}</small>}
            </button>)}
          </div>
          <div className="dialog-footer"><span><b>F1</b> / <b>F2</b> prefixos · <kbd>Espaço</kbd> Enter</span><span>Atalhos indicados em cada tecla</span></div>
        </>}
      </section>
    </div>}
  </main>;
}
