# HP12C Platinum 0.2.56 — Rust/Wasm e input

Baseline original: commit `54663a0197a57903cebc994241eb51516d5e65f8`, 0.2.55. Main remoto foi conferido antes de alterar e antes de publicar. AGENTS.md lido; diretório /workspace/.agents vazio. Nenhum dado de usuário apagado, schema/storage keys/backup preservados.

## Baseline antes de alterações funcionais

Chromium151.0.7922.173, Linux x64, AMD EPYC9V45, Node24.19. 393×852 CSS/DPR3, touch emulado. 15 contextos novos e reload em cada contexto; SW bloqueado; HTTP loopback sem compressão. Tempos em ms, mediana/p95:

| Medida | JavaScript original |
| --- | --- |
| Abertura fria até layout e fontes | 287.6 / 435.2 |
| Reload no mesmo contexto | 285.9 / 511.6 |
| Input até duas oportunidades RAF | 32.4 / 33.0 |
| Processamento de eventos (p95) | 0.3 |
| Digit / PMT / IRR Node, 10000 amostras | 0.003896 / 0.004046 / 0.004898 (medianas) |

Abertura inclui navegador/driver/fonts/layout; não é LCP nem prontidão do Rust. DoubleRAF é proxy de oportunidade de pintura, não latência de apresentação física. O arquivo original contém também tempos RPC do Playwright: incluem overhead do driver e não devem ser interpretados como latência interna.

## Comparação controlada A/B/C

10 repetições por braço, ordem alternada, mesma carga de 100 linhas/notas de histórico, mesmos toques/digitação/PMT, mesmo navegador/viewport/hardware. Instrumentação somente em cópias temporárias; fonte A reconstruída do commit original. B = todas as correções de interface com motor JS; C = mesmas correções, motor Rust ativo confirmado pelo navegador. Não comparar diretamente abertura desta tabela com baseline sem a fixture de histórico.

| Medida, ms mediana / p95 | A: original JS | B: JS + correções | C: Rust + mesmas correções |
| --- | --- | --- | --- |
| Abertura fria | 446.4 / 738.5 | 280.1 / 356.6 | 281.1 / 328.3 |
| Reload | 271.6 / 479.2 | 187.4 / 321.2 | 182.1 / 503.1 |
| Input até doubleRAF | 32.2 / 32.9 | 32.2 / 32.8 | 32.3 / 33.5 |
| Motor + fronteira de estado | 0.1 / 0.3 | 0.1 / 0.3 | 0.2 / 0.5 |
| LCD completo | 0.3 / 0.5 | 0.3 / 0.5 | 0.3 / 0.5 |
| Uma passagem de layout | 28.4 / 47.7 | 22.1 / 32.4 | 22.6 / 29.8 |
| Formatação | 0 / 0.1 | 0 / 0.1 | 0 / 0.1 |
| Redutor de histórico, excluindo motor/formatação | 0 / 0.1 | 0 / 0.1 | 0 / 0.1 |
| JSON de persistência | 0 / 0.1 | 0 / 0.1 | 0 / 0.1 |
| localStorage.setItem | 0 / 0.2 | 0 / 0.1 | 0 / 0.1 |
| Event Timing processamento | 0.3 / 1.5 | 0.3 / 1.7 | 0.3 / 2.0 |
| Event Timing atraso de input | 15.8 / 19.0 | 16.2 / 19.1 | 16.2 / 19.4 |
| Abertura painel, RPC incluindo animação | 473.9 / 487.8 | 463.6 / 475.4 | 405.1 / 476.2 |

350 chamadas de motor por braço, 360 desenhos de LCD, 320 proxies RAF. Resolução de relógio observada~0.1ms: zeros não significam trabalho gratuito. Event Timing é arredondado/filtrado pelo navegador (mínimo16ms); mede todos os eventos de ação inclusive abertura do painel. RAF~16.7ms neste Chromium headless, não iPhone120Hz. Animação declarada260ms foi mantida; medição RPC inclui agendamento e driver, não é uma alteração de duração.

Correção de layout reduziu passagens efetivas de30 para10 na carga: font-loading de fontes exclusivas da Memória não refaz mais o teclado. Não houve mudança no algoritmo geométrico. Variação de abertura/p95 ainda é grande, sobretudo no braço A; os dados são locais e não demonstram um ganho universal nem velocidade física do iPhone. B/C têm abertura fria mediana praticamente igual (+1ms Rust); não há melhora perceptível no input-to-frame. A comparação anterior à deduplicação de fontes foi retida para auditoria.

Microbenchmark Node (1000 warmups +10000 chamadas, mesmos inputs) confirma o custo da ponte JSON: dígito JS0.003946ms/Rust0.016374ms; PMT0.004066/0.018038; IRR0.005018/0.018338; programa0.015153/0.017797. Rust inclui UTF8/JSON/clonagem/retorno; isto não é tempo isolado aritmético Rust nem medida de experiência.

Assets finais de produção: JS311.97kB (gzip97.80), CSS60.64kB (gzip12.49), Wasm434.290kB (gzip168.65). Original JS309.04kB (gzip96.57), CSS idêntico. Carregamento Wasm é assíncrono e não bloqueia primeiro render/input: JS permanece funcional até a ativação. Rede lenta pode prolongar esse período e há custo adicional de download/precache. Não se promete ausência de custo em todo aparelho/rede.

## Fronteira e recursos reais

`rust-core/src/lib.rs` implementa todas as ações calculacionais/transições do antigo engine.ts: pilha RPN/ALG, entrada/expoente, 20 registradores, TVM/odd periods/BEGIN, amortização/juros, cashflows/NPV/IRR, regressão/estatística, bonds, depreciação, calendário, trigonometria, limites/arredondamento, programas/GTO/pausa/erros e undo. Edição numérica de memórias também vai para Rust. O caminho normal depois da carga é Rust para qualquer tecla/ação; não há callbacks de cálculo JS no módulo.

React/DOM, mapa de teclas, Intl/visor, validação de texto de formulários, composição do memorial/notas, configurações/reset/backup e localStorage continuam na camada web. `engine.ts` permanece como referência de regressão e fallback integral de carga/compatibilidade/ABI; não é o motor normal depois da ativação. O ABI troca estado JSON puro, preserva campos adicionais, -0 e precisão de double com serde_json float_roundtrip. Não há migração destrutiva de storage ou substituição de estado vivo quando Wasm ativa.

Wasm tem URL com hash do Vite, precache Workbox/offline, instantiateStreaming com fallback ArrayBuffer para MIME incompatível, self-test antes de ativar e fallback JS para erro HTTP/compilação/ABI. Erros calculacionais são estado normal; somente erro de transporte/trap desativa Wasm. Pureza permite recuperar a partir do estado original sem duplicar histórico.

## Input e ghost touch

Baseline já evitava duplicação pointer/touch/click: execução confirmada em pointerup, click com detail>0 descartado, accessible click detail0 aceito. Nenhuma duplicação normal foi constatada nos testes.

Corrigidos auto-repeat do teclado, cancelamento de preview ao abrir overlay e inert também no diagnóstico. Mantidos12px de cancelamento, verificação de limite da tecla e saída/blur/pagehide/resize/multitouch. Os handlers de arraste da calculadora e da Memória estavam desconectados no original; foram reconectados ao rastreador existente, sem capturar formulários/botões ou interromper scroll interno iniciado fora do topo. Abrir por arraste sobre tecla não confirma cálculo. Programas com lacunas agora dão Error4, em ambos os motores, em vez de TypeError inesperado.

Isto corrige comportamento de software; não comprova nem corrige defeito físico de touchscreen. Não se deve bloquear indiscriminadamente eventos legítimos por debounce temporal, pois pode perder digitação rápida.

## Validação e reprodução

- `npm ci` (cache no ambiente /tmp para respeitar permissões).
- `npm run build:wasm`: Rust1.90.0/wasm32-unknown-unknown, dependências fixas e Cargo.lock; binário conferido em dois diretórios diferentes com SHA256 idêntico.
- `cargo test --manifest-path rust-core/Cargo.toml --locked`:3 testes nativos.
- `npm run test:wasm` e `npm run test:engine`:165 testes cada; comparação independente12000 transições +fixtures, rounding/extremos/memória/cashflows/datas/undo/programas/display e recuperação de trap.
- `npx tsc --noEmit`, `npm run test:display` (24), `npm run build`, `npm run test:sites` (4).
- `HP12C_CHROMIUM=/usr/bin/chromium npm run test:browser` ou Chromium instalado pelo Playwright:13 verificações reais do browser; CDP touch é input confiável do navegador em viewport emulado, não toque físico. Blur é simulado. Inclui reload offline/serviceworker, carga Wasm bloqueada, memória editável com pilha/programa/notas/configuração preservados, gestos/reduced-motion/ciclos, quatro viewports320/393/paisagem/desktop.
- Original e primeiras variantes tinham screenshots finais idênticas byte-a-byte: SHA256 `3fe441f7f4deac5f3a8afb20671a3f0fc860f4efb0bf35b92927d94516bd48cf`. Capturas de cálculo/Memória e geometria final foram inspecionadas.
- CI reconstrói Wasm e exige diff zero do artefato, roda testes Rust/JS/TypeScript/build/entrega/browser. Binário committed permite build normal Node-only nos hosts existentes sem novo serviço/credenciais.

Não há iPhone físico, Safari iOS/PWA físico, diagnóstico de hardware nem120Hz garantidos. WebKit27.2 foi baixado, mas faltam GTK4/graphene/harfbuzz-icu/manette/hyphen/GLES no Linux; não foi executado. Paridade demonstra compatibilidade com a implementação JS e exemplos já testados, não equivalência integral ao firmware HP.

Dados brutos e scripts: `A-original-js.json`, `A-engine-node.json`, `ABC-instrumented.json`, `ABC-before-font-dedupe.json`, `engine-node-comparison.json`, `browser-interactions.json`. O laboratório reproduz A por `git archive54663a0`, B/C por cópias do source final, alias Vite para o core da cópia, instrumenta com `lab-instrument.py`, build B com `VITE_HP12C_ENGINE=javascript` e build C padrão; `lab-benchmark.mjs` usa portas4175–4177. Scripts temporários assumem `/tmp/hp-lab-{A,B,C}` e dependência Playwright. Baseline browser-benchmark assume preview4173.

Documentação das dependências e plataforma consultada: [Rust wasm32-unknown-unknown](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html), [instantiateStreaming/MIME](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/instantiateStreaming_static), [num-bigint0.4.6](https://docs.rs/num-bigint/0.4.6/num_bigint/).

O primeiro CI da migração encontrou divergência binária por caminhos absolutos do Cargo registry. O build passou a fixar Rust+1.90.0 e usar --remap-path-prefix para fonte e CARGO_HOME, preservando os cálculos. A comparação de desempenho usou o binário anterior de434474 bytes; a normalização altera strings de diagnóstico/tamanho para434290 bytes, sem alteração de algoritmo. O check de hash/diff zero permanece obrigatório no CI.
