# Calculadora HP 12c Platinum — acabamento da Foto 1

Aplicação React/Vite, com motor TypeScript compartilhado. Interface própria em controles HTML/CSS; texturas SVG leves, sem sobreposição de botões transparentes sobre uma fotografia completa.

## Executar
Requisitos: Node.js 22 ou superior e npm.
```
npm ci
npm run dev -- --host 127.0.0.1
```
## Validar e compilar
```
npm run test:engine
npm run test:sites
npx tsc --noEmit
npm run build
```
A compilação estática fica em `dist/client`. `vercel.json` configura a hospedagem.

## Uso
Clique no logotipo HP para abrir o menu: tela cheia, ligar/desligar, graus/radianos e restauração do programa de taxas. SIN, COS e TAN operam sobre X e preservam os outros níveis da pilha. O padrão é DEG (graus). TAN em 90° e seus equivalentes apresenta Error 0; CLx limpa o erro. Atalhos: F7 SIN, F8 COS, F9 TAN.
O visor usa vírgula e inicia com sete casas decimais. Durante a digitação, mostra exatamente a entrada, sem completar zeros. ENTER ou uma operação conclui a entrada e aplica o formato. `f` + um dígito de 0 a 9 escolhe as casas decimais; `f` + ponto seleciona notação científica. A escolha é preservada nas reaberturas. Como na HP 12c, o formato padrão respeita o limite de dez algarismos do visor: para números inteiros maiores, a quantidade de casas visíveis pode diminuir. FIX não muda a precisão interna; RND (`f` + PMT) arredonda explicitamente o número.
Os atalhos de formatação e entrada foram conferidos no manual oficial HP: https://h10032.www1.hp.com/ctg/Manual/bpia5184.pdf (pp. 21 e 87–89).
Programa inicial de taxas equivalentes: taxa → i; período de origem → n; período de destino → R/S. O programa salvo pelo usuário é preservado nas reaberturas. Use o menu para restaurar o programa inicial explicitamente.
No iPhone, Compartilhar → Adicionar à Tela de Início permite abrir como aplicativo. Tela cheia física no iPhone ainda não foi verificada.

## Design
A Foto 1 define o corpo e o teclado: moldura prata escovada, laterais de plástico preto texturizado, LCD oliva, painel preto fosco, teclas cinza com legendas vermelhas e azuis, f laranja, g azul, faixa HEWLETT • PACKARD inferior. O retrato tem seis colunas; o horizontal adapta a ordem original para onze colunas com as novas teclas. Nenhuma tecla 15 foi acrescentada.
Atualização de 01/10/2026: a calculadora ocupa todo o viewport disponível, acompanhando redimensionamentos e rotação. O metal alcança o topo; as bordas de plástico permanecem somente nas laterais e embaixo, com a mesma espessura reduzida. O painel central tem aro metálico fino. As teclas foram ampliadas e SIN/COS/TAN usam a mesma construção e fonte das demais. R↓ tem seta vetorial, sem emoji. O visor começa à esquerda. O cabeçalho não usa blur nem translucidez, e a configuração da barra do iOS passou a `default`.
As cores base correspondem aos valores RGB indicados; sombras e texturas alteram naturalmente os pixels renderizados. Trata-se de uma reconstrução responsiva, não de medição física calibrada ou equivalência de firmware HP. A apresentação da barra do sistema e o fullscreen em iPhone físico ainda precisam ser conferidos no aparelho.

## Publicação
Produção existente: https://hp12c-platinum-one.vercel.app/
O pacote de fontes não inclui tokens, arquivos .env, node_modules ou a vinculação privada .vercel. Faça login na sua conta Vercel para publicar outro projeto.

## Ajuste de posição e moldura — 01/10/2026
O visor foi elevado (no retrato, de 7,4% para 6,3% da altura), e o início do painel passou de 19,5% para 22,5%, deslocando o teclado para baixo. A moldura rugosa passou de 1,2% para 2,5% da largura, limitada entre 6 e 18 px, igualmente nas laterais e na base. A inscrição Hewlett Packard foi reduzida e permanece junto à base. O topo continua exclusivamente metálico.
Verificação desta atualização: build de produção e quatro testes de entrega aprovados. Conferência visual em 320×568, 393×852 e 852×393, com 41 teclas e nenhuma tecla ou legenda fora da tela. O motor de cálculo não sofreu alterações nesta atualização.

Teclado ancorado na base: a última fileira mantém 3–5 px de respiro acima da faixa inferior, com as demais fileiras distribuídas para cima. ENTER termina na mesma linha. Conferido em 320×568, 393×852 e 852×393, sem teclas fora da tela; build e quatro testes de entrega aprovados.

Correção da faixa inferior no iPhone: o corpo usa 100dvh, sem redução pela visualViewport. A área segura inferior não aumenta a faixa Hewlett Packard; o teclado se estende até a pequena faixa e a moldura da base. Verificação física no iPhone permanece pendente.

## Ajuste local em revisão — 01/10/2026
O visor usa dez posições SVG com pontuação acoplada e indicadores fixos. A altura usa inset nativo, sem 100dvh explícito nem compensação fixa. Áreas seguras preservam as teclas. Veja LOCAL-CHANGE.md para evidência, testes, screenshots e limites. A implementação permanece local, sem deploy; a validação no iPhone físico está pendente.

## Toque e visor — 01/10/2026
Fluxo B/viewport cover preservado. Toque/pen aciona no pointerdown e não duplica no click; mouse e teclado mantêm acionamento normal. Arraste por toque do corpo bloqueado; menu e diagnóstico continuam roláveis. Visor Canvas com buffer DPR redimensionado e redesenho antes do paint, preservando lcdCells/indicadores/motor e saída acessível. ENTER usa letras empilhadas, evitando métricas verticais defeituosas no WebKit.
Em retrato alto: visor/logotipos +10px, base do painel/Hewlett -10px, primeira fileira -40px; vãos aumentam5px mantendo tamanho das teclas. Em telas baixas a ampliação é proporcional; paisagem com ampliação proporcional à altura (cerca de12px distribuídos em402px, até30px em telas altas), primeira fileira sobe de forma proporcional para evitar colisão com visor/legendas. Áreas seguras mantidas. Testado em Edge e WebKit26.5 isolados, não Safari27.2 beta físico.92 testes motor/visor/entrega, TS/build e QA multiviewport/touch/DPR. Atualização publicada somente após verificação pública.

## Barra do sistema e backup — 01/10/2026
Mantido apple-mobile-web-app-status-bar-style default e incluído elemento DOM real fixed top0/height1px/background-color #c6c6c6 para a cor da barra. Técnica baseada no relato https://www.reddit.com/r/PWA/comments/1w5mqj1/ios_27_beta_blurs_the_top_edge_of_installed_pwas/; não prova remoção do desfoque em aparelho físico. Sem pseudo-elemento, transparência, prefers-color-scheme ou deslocamento extra da raiz. Meta de uma instalação antiga não pode ser lida/atualizada peloDOM. Se blur persistir, salvar backup antes de remover/re-adicionar ícone.
Menu HP: Salvar backup gera JSON local completo das chaves HP; Restaurar backup valida arquivo e restaura programas, registradores, formato e marcadores de migração. Nenhuma transmissão. Importação inválida preserva estado; falha de storage reverte chaves anteriores. Testes Node e UI roundtrip Edge/WebKit passaram; instalação no Safari beta físico pendente.
