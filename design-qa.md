# Conferência visual e funcional

Data: 30/09/2026. Versão do código: 0.2.1.

**final result: passed** — interface web e modelo com dimensões nominais, dentro do escopo descrito abaixo. Este resultado não certifica a réplica física 1:1 nem todas as sequências possíveis do hardware.

## Evidências

- Comparação conjunta da fotografia frontal fornecida e da captura do aplicativo. Conferidas disposição das 39 teclas, ENTER vertical, funções f/g, corpo preto, placa metálica e LCD. Ajustados posição/largura do LCD, cor da tecla ON e proporção da legenda ENTER.
- Modelo editável criado no Blender e exportado como glTF binário. Seis câmeras conferidas: frente, traseira, laterais, topo e base. Capturas em `qa/screenshots/`.
- Limites exportados: 129,020 × 79,020 × 15,015 mm, dentro da tolerância de 0,1 mm em relação às dimensões nominais. Relatório: `model/measurements.json`.
- Navegador: Edge no site real do GitHub Pages. Modelo, fontes e visor carregaram. Clique numa tecla 3D alterou X de 5 para 2. Entrada pelo teclado e pelos botões acessíveis utiliza o mesmo motor.
- Guia **Atalhos** pesquisável: busca NPV mostrou PV, f NPV, g CF₀ e respectivos atalhos V, F1 V e F2 V. Botões acessíveis expõem as 39 teclas e suas funções. Modais mantêm foco e permitem fechar por Escape.
- Layout conferido em desktop e 390 × 844 px. Largura do documento no teste compacto: 375 px, sem transbordamento horizontal. Modelo inteiro visível; visor/pilha aparecem abaixo dele.
- PWA: corrigido conflito entre entradas duplicadas de precache. No Edge, a página foi recarregada com a rede desativada por CDP e abriu com o modelo; botões acessíveis calcularam `2 ENTER 3 +` = 5. Rede restaurada ao fim do teste. Evidência: `published-offline.png`.
- Teclado do PC: financiamento de 250000, 300 períodos e 5,25% anual retornou PMT = −1498,12. Evidência: `financial-keyboard.png`.
- ALG: expressão nova `2 + 3 × 4 =` retornou 14, preservado após recarregar a página. Evidência: `alg-persistence.png`.
- 22 testes do motor passaram, cobrindo RPN, ALG, registradores, TVM, amortização, juros simples, fluxos/NPV/IRR, títulos, depreciação, estatística, calendário, matemática, erros, memória e programação. TypeScript sem erros. Quatro testes do empacotamento Sites também passaram.
- GitHub Pages publicou com Actions. Instalador NSIS gerado nos Releases; sem assinatura de código, conforme o plano.

## Correções realizadas na revisão

Resolvidos carregamento do LCD, orientação dos rótulos traseiros, exceção de carregamento 3D em StrictMode, enquadramento em telas estreitas, cache offline, prefixos em recuperação de fluxos, agrupamento de STO/RCL em uma linha de programa, códigos físicos do visor de programação e limpeza de entradas numéricas incompletas.

Nenhum bloqueio visual P0/P1/P2 permanece no escopo funcional e nominal descrito acima.

## Limites e critérios ainda não certificados

- A prancha fornecida apresenta medidas externas nominais e ilustrações. Não contém medidas individuais do LCD, moldura e teclas nem fotografias reais nítidas de todas as faces. Essas proporções foram inferidas; a validação física 1:1 permanece pendente das referências combinadas com o usuário.
- A traseira contém um guia próprio legível, pois as inscrições da prancha não permitem transcrição confiável. Acabamento, tipografia e detalhes de fabricação são aproximações.
- A suíte compara exemplos e invariantes, incluindo exemplos do manual. Não constitui certificação exaustiva de comportamento idêntico ao firmware HP em qualquer sequência.
- A inspeção visual foi feita no navegador. A verificação Windows registra instalação, versão instalada, inicialização e janela respondendo; os controles internos da janela nativa não foram inspecionados visualmente, pois controle de aplicativos nativos está indisponível nesta sessão.

## Windows

Instalação e atualização para 0.2.1 concluídas com código de saída zero. Versão 0.2.1 confirmada no registro de desinstalação; processo hp12c-platinum respondendo, com janela HP 12c Platinum e atalho no Menu Iniciar. Hash do arquivo baixado coincide com o digest do GitHub. Resultado completo em `qa/windows-verification.json`.

