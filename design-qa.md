# QA — tela inteira, entrada e atalhos HP 12c

final result: passed

## Escopo e fonte
A imagem colada 1 mostra a versão anterior com blur superior, bordas grandes, emoji em R↓ e área vazia abaixo do corpo. As instruções textuais de 01/10/2026 definem as mudanças desejadas e prevalecem sobre a reprodução literal dessa captura. Comparação lado a lado: `comparacao-tela-inteira.png`, com o antes à esquerda e a versão ajustada à direita, no mesmo tamanho 393×852 e com X=0. A quantidade de casas mudou de doze para sete conforme o pedido atual; relógio/bateria são elementos do iOS e não são imitados pela interface.

## Verificação visual e de layout
- Corpo ocupa toda a área disponível, sem margem externa e sem recorte por proporção fixa. O tamanho acompanha o viewport visual ao redimensionar/rotacionar.
- Não há faixa de plástico superior: metal até o topo. Plástico somente nas laterais/embaixo, espessura igual (4,7 px em 393 px de largura), menor que na versão anterior. Aro cinza fino em volta do painel do teclado.
- Cabeçalho com filter:none e backdrop-filter:none. Configuração iOS alterada de black-translucent para default; tema de abertura metálico.
- Teclas regulares ampliadas: aproximadamente 57×63 px em 393×852; cerca de 21% mais largas e 22% mais altas que na versão anterior. ENTER continua vertical e ocupa duas linhas.
- SIN/COS/TAN e 7 têm exatamente o mesmo tamanho, fonte, altura da face principal e construção do acabamento. R↓ contém uma seta SVG branca, sem caractere emoji.
- LCD alinhado à esquerda, com tamanho dos algarismos ajustado para acomodar a entrada completa.

Tamanhos locais testados: 393×852, 375×812, 320×568, 852×393 e 2048×942. Em todos, o retângulo da calculadora coincide com o viewport, 41 teclas ficam dentro da tela, nenhuma face de tecla tem texto cortado e não há rolagem.

## Comportamento
85 testes do motor aprovados. Incluem todos os dez atalhos f + 0–9, entrada crua, ENTER, SCI, persistência do FIX/SCI escolhido, migração do padrão anterior sem alterar programas/registradores, CHS e apagar preservando os dígitos/zeros de entrada, RND/LAST X, STO/RCL, R↓, g n/g i, BEG/END, datas, ALG/RPN, trigonometria e os exemplos financeiros já existentes.

Observado no navegador: entrada 1 → 12,30, ENTER → 12,3000000, f + 2 → 12,30, reabertura → 12,30. Teclado físico com vírgula → 1,2; f + ponto → 1,200000 00. Console sem erros.

Referência oficial para f/g, término de entrada e formato: https://h10032.www1.hp.com/ctg/Manual/bpia5184.pdf (pp. 21 e 87–89). O formato não altera a precisão interna; RND altera explicitamente o valor. FIX segue o limite HP de dez algarismos totais e a seleção persiste. Não se afirma equivalência integral de firmware.

## Limites
O preenchimento, o topo sem filtro e as interações foram verificados em navegador. O efeito visual da barra do sistema e a tela cheia física no iPhone não foram observados em um aparelho; o iOS controla essa barra. As configurações de status bar/PWA e safe areas foram ajustadas, mas essa parte precisa ser conferida no dispositivo.

## Publicação e verificação final
Deployment dpl_C2kgoAztiYE5BkS9irgfE2vfQRtP, Vercel READY, alias https://hp12c-platinum-one.vercel.app/. Build concluído, quatro testes de hospedagem aprovados e TypeScript sem erros: total de 89 testes aprovados.
No navegador de produção, após atualizar o cache antigo do aplicativo, foram confirmados: migração para sete casas; entrada 12,3 sem completar zeros; ENTER 12,3000000; f + 2 12,30; reabertura 12,30. O programa de taxas foi preservado e gerou 0,9488793 para taxa 12%, período de origem 12, destino 1. No layout 393×852, a calculadora coincide com a tela, 41 teclas estão disponíveis, nenhuma face tem texto cortado, SIN e 7 têm o mesmo estilo de fonte, o filtro do cabeçalho é none e o aro do teclado é RGB 198/198/198. Capturas finais de produção: tela-inteira-mobile.jpg e tela-inteira-horizontal.jpg. Console sem erros.

## Ajuste de posição e moldura — 01/10/2026
O visor foi elevado (no retrato, de 7,4% para 6,3% da altura), e o início do painel passou de 19,5% para 22,5%, deslocando o teclado para baixo. A moldura rugosa passou de 1,2% para 2,5% da largura, limitada entre 6 e 18 px, igualmente nas laterais e na base. A inscrição Hewlett Packard foi reduzida e permanece junto à base. O topo continua exclusivamente metálico.
Verificação desta atualização: build de produção e quatro testes de entrega aprovados. Conferência visual em 320×568, 393×852 e 852×393, com 41 teclas e nenhuma tecla ou legenda fora da tela. O motor de cálculo não sofreu alterações nesta atualização.
