# Ajuste local — visor e área disponível

Base: fontes cujo build reproduziu os 23 arquivos estáticos da produção em 01/10/2026. Os hashes JS/CSS públicos foram reconferidos antes da edição e permaneceram iguais à base. A cópia original não foi modificada. Esta implementação fica na cópia isolada do pacote.

## Alterações

- `.page` usa posicionamento fixo com `inset: 0` e altura automática, preenchendo seu viewport nativo. A antiga restrição explícita de `100dvh` foi removida. Não há soma de 62px, leitura de `screen.height` ou expansão para área fora do DOM. Resize e rotação acompanham o bloco fixo e as unidades de container existentes.
- Áreas seguras inferiores mantêm a última fileira acima do indicador Home; em paisagem as áreas laterais protegem as teclas do notch. A superfície da calculadora continua cobrindo o viewport. Isso reserva a área segura real informada pelo navegador, sem compensação fixa de altura.
- Visor ~4,8:1 com dez posições SVG, sete segmentos altos/inclinados/chanfrados e separações pequenas. Pontos e vírgulas ficam associados ao algarismo. Sinal e undo reais ficam na coluna esquerda. A linha inferior fixa contém RPN, ALG, ( ), f, g, BEGIN, D.MY, C, PRGM; posições não mudam ao apagar indicadores.
- Bateria permanece ausente: o webapp não dispõe de uma leitura válida de bateria do iPhone. Nada foi inventado. Texto de erro, programa e formatos excepcionais permanecem legíveis sem truncamento; o output acessível mantém integralmente a string do motor.
- Nenhuma alteração no motor, teclas, migrações, programas, registradores ou configurações. Sete casas padrão continuam sendo o padrão existente, e não dez casas decimais.

A referência visual foi fornecida por especificação da investigação; não houve nova inspeção da imagem de referência neste executor. A inspeção visual feita aqui foi dos screenshots locais gerados.

## Validação

85 testes de motor; 3 testes de organização do visor; 4 testes de entrega Sites; TypeScript sem erros; build Vite/PWA e entrega Sites aprovados. QA automatizada e visual em 320×568, 393×852, 402×874, 430×932, 568×320, 852×393, 874×402, 932×430 e 1280×720: 41 teclas dentro da tela, dez posições do visor, nenhum encontro do LCD com teclas. Verificados entrada com vírgula/zeros, sinal, FIX, shift, posições fixas, persistência após reload, ALG, erro e aparelho desligado. Eventos pageshow/visibilitychange e redimensionamentos não alteraram a área preenchida. Áreas seguras simuladas: retrato topo62/base34; paisagem esquerda62/direita62/base21. Resultados detalhados e screenshots estão na pasta qa do pacote.

Navegador: Microsoft Edge/Chromium headless em contexto isolado, sem usar o navegador ou os dados do usuário. Não houve teste instalado em iOS, Safari/WebKit real, retorno do aplicativo no sistema operacional ou teste em iPhone físico. Os eventos de retorno e áreas seguras foram simulados. O posicionamento fixo remove uma restrição do aplicativo, mas o benefício no bug da versão beta depende de o WebKit expor um viewport maior que o `dvh` incorreto. Se todo o viewport continuar restrito pelo sistema, CSS/JS não libera a área excluída. Validação física permanece necessária.

## Revisar localmente

Node 22+, `npm ci`, `npm run build`, `npm run preview -- --host 127.0.0.1`. Teste adicional: `node --test tests/lcd-layout.test.mjs`. Os testes UI externos usados nesta sessão ficam em qa/qa-local.cjs (ajuste o caminho do Playwright para seu ambiente). `npm run test:engine`, `npm run test:sites`, `npx tsc --noEmit` continuam disponíveis.

Nenhum deploy ou push foi feito. Este pacote está preparado para revisão e aprovação de publicação.

Validação adicional: janela Edge `--app` em perfil isolado confirmou `display-mode: standalone` verdadeiro, com 402×874, 874×402, 393×852 e retorno a 402×874; a superfície preencheu todas as dimensões após resize e eventos pageshow/visibilitychange. É um teste real de modo standalone no Chromium, não de instalação no iOS. A simulação de dvh incorreto substituiu 100dvh por 812px no CSS antigo em viewport nativo874; a base ficou812, enquanto o CSS novo preencheu874. Não é medição do iPhone.

01/10/2026 — faixas do fabricante alinhadas verticalmente ao centro do texto e ponto prata #c6c6c6. Recorte intrínseco e geometria LCD/teclas preservados. QA8 combinações Edge/WebKit com áreas seguras sintéticas, TS/build e7 testes visor/entrega passaram. Comparação da sessão Edge do usuário encontrou1206x2622 configurados como viewport CSS, em vez de402x874 com DPR3. Fontes e limites em pwa-maker-alignment-qa/RESULTADO.md. Produção preparada dpl_BTr7gyGLS7qwS7p1vbX9apwWeZYg.
