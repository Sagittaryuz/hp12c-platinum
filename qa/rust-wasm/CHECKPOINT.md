# Checkpoint — 11/10/2026

Ambiente funcional: Linux x64, AMD EPYC 9V45, Node24.19, Chromium151.0.7922.173. Rust1.90 instalado localmente em /tmp. Não há iPhone físico. WebKit27.2 baixado, mas faltam bibliotecas Linux para iniciar.

Main remoto e checkout originais: `54663a0197a57903cebc994241eb51516d5e65f8`, release0.2.55. Sem alterações concorrentes encontradas. AGENTS.md lido integralmente; /workspace/.agents existe e está vazio, sem skills locais.

Baseline A rodou antes de qualquer mudança funcional: 15 contextos novos, 393×852/DPR3/touch emulado, service worker bloqueado, HTTP local sem compressão. Mediana/p95 em ms: abertura fria287.6/435.2; reload285.9/511.6; input-to-double-RAF32.4/33.0; processamento de eventos p950.3. DoubleRAF mede oportunidades de frame, não apresentação física. JS309040 bytes/CSS60640; gzip96570/12490. Motor Node10000 repetições por carga: dígito0.003896/0.004667, PMT0.004046/0.004396, IRR0.004898/0.009264. 160+24+4 testes existentes passaram.

Motor concentrado em packages/core/src/engine.ts. Candidato Rust contém transições computacionais completas: RPN/ALG, TVM, cashflows/IRR/NPV, estatística, calendário, títulos, depreciação, programa/erros/undo/memórias. DOM/React/gestos/histórico/persistência/Intl permanecem web. Fallback JavaScript completo para falha de carregamento, sem bloquear primeira renderização; depois do carregamento o caminho normal é Rust/Wasm. Dados e schema de armazenamento não são migrados/apagados.

164 testes com Rust instalado e164 no modo JS +3 testes nativos Rust passaram. Comparações independentes incluem12000 transições determinísticas além de fixtures. 11 testes de navegador passaram: input único, repeat, arraste sobre tecla, multitouch, blur, falhaWasm, PWAoffline, quatro viewports. Corrigidos decimal rounding, float roundtrip JSON e -0 na fronteira. Restaurados handlers de arraste da calculadora/memorial que não estavam conectados em0.2.55. Inert/cancelamento de preview agora inclui diagnóstico. Click com detail>0 já era descartado corretamente: não há evidência de duplicação normal touch/pointer/click no baseline.

Comparação final A/B/C instrumentada em cópias temporárias, com100 linhas de histórico e ordem alternada, está em execução para separar motor/eventos/layout/desenho/histórico/JSON/storage/animação. Dados preliminares não indicam ganho perceptível de input-to-frame; ABIJSON tem overhead e móduloWasm aumenta assets. Não há promessa de120Hz nem correção de defeito físico.

Produção permanece0.2.55 até finalizar validação. Sem serviços pagos/credenciais novas. Entrega prevista0.2.56 com SHA, CI, Pages e Vercel existentes verificados.
