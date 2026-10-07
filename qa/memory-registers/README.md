# HP12C 0.2.40 — registradores em duas linhas

A produção foi conferida antes do trabalho: `main` e o destino Vercel original estavam no commit `f60385596492a43fc05fddfbf23f6d6bef435b9a` (0.2.39). O checkpoint da sessão local já estava publicado na branch `fix/memory-registers-two-rows`, commit `00f856b3265ba9c8d87b2b1219213cac961f3342`. Esse commit foi incorporado por fast-forward na branch isolada `fix/memorial-registers-two-rows`, sem refazer o ajuste.

A grade apresenta R0–R9 e R.0–R.9 em duas linhas de dez, com rótulos compactos e valores longos abreviados visualmente por reticências. O nome acessível e o tooltip contêm o valor completo. O editor continua recebendo a representação completa do número armazenado; o motor mantém a precisão existente de dez algarismos significativos, independentemente de FIX/SCI e do separador decimal.

`verify.mjs` testa o build em Chromium com 320×450, 320×568, 360×800, 393×852, 844×390 e 1280×800, em FIX/vírgula e SCI/ponto. Confere as duas linhas, a ordem dos vinte registradores, ausência de rolagem horizontal, dimensões mínimas de 24×44 px, navegação por Tab e ativação por teclado ou toque automatizado. Abre e salva os vinte editores com valores positivos, negativos, longos e científicos; valida arredondamento existente, erro de intervalo, cancelamento, persistência após recarga e preservação da pilha, programa, histórico, notas e formato.

Reprodução: `npm ci`, `npm run build`, `npm run preview -- --host 127.0.0.1 --port 5199`; em outro processo, `node qa/memory-registers/verify.mjs`. Playwright deve estar instalado no ambiente de QA; `PLAYWRIGHT_MODULE`, `BROWSER_PATH` e `QA_OUTPUT` permitem informar caminhos externos. As capturas PNG são ignoradas no Git. `results.json` registra medidas e resultados. Essa validação usa Chromium automatizado, sem afirmar teste em iPhone físico.

Verificações de projeto: 159 testes Vitest, 25 de visor/transferência e 4 de empacotamento Sites; TypeScript e build de produção.
