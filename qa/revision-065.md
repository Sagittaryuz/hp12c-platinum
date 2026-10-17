# Revisão 0.2.65 — retomada, offline e Memória

O áudio anterior mantinha um único AudioContext, inclusive depois de interrupções ou fechamento. O controlador agora recupera o contexto suspenso na interação, recria contextos fechados e libera o áudio ao ocultar/congelar a página. Cada toque gera um sinal de 40 ms; eventos antigos são descartados, sem fila tardia ou áudio silencioso. Som desligado, bloqueio de autoplay, volume e política do sistema continuam sob controle do aparelho.

A vibração usa somente `navigator.vibrate(12)` quando disponível. Uma rejeição inicial pode ser repetida uma vez no término imediato do toque, sem fila. A especificação exige ativação e página visível, e permite que hardware ou políticas ignorem a solicitação. WebKit não oferece o mesmo suporte do Chromium; instalar como PWA não cria essa API. Não há simulação de vibração, novas permissões ou execução permanente em segundo plano.

O gesto de abertura começa somente no LCD. O logotipo HP conserva o atalho de toque. A Memória tem os vinte registradores R0–R.9 fixos, histórico com rolagem independente e topo preto. Um arrasto vertical curto para cima na área fixa fecha o painel; um toque normal abre o editor. Formulários e histórico não transferem o gesto ao painel. A edição usa campo de 16 px, com ajuste à área visível do teclado, e o zoom por pinça permanece permitido.

O service worker começa a instalação sem atraso ocioso e pré-carrega HTML, código, Wasm, fontes, texturas e ícones usados. Referências fotográficas sem uso ficam fora do cache. A navegação offline tem fallback para o shell, inclusive em caminho aninhado. Os caminhos de produção respeitam a raiz do site ou o prefixo já estabelecido do Pages; o build desktop conserva caminhos relativos. Uma atualização espera o fechamento das janelas antigas, sem reload forçado ou limpeza dos dados do usuário. O estado também é gravado no evento `freeze` quando fornecido pelo navegador.

A sombra de contato acompanha os arcos e o bracket inferior existentes, com o recorte do fabricante protegido. Mantidos o metal contínuo, as coordenadas, a travessa central de 5 px e o token compartilhado #BE1B04.

## Verificação

- Motor JavaScript: 210 testes; Rust/Wasm: 210 testes; display: 24; entrega: 4; regressão Chromium: 13. Tipos e build aprovados.
- Comparação antes/depois em 14 combinações Chromium/WebKit e tamanhos de tela: nenhuma alteração de coordenadas; nenhum pixel alterado na região protegida do fabricante.
- QA de interação inclui 320×450, 320×568, 393×852, 852×393 e 768×1024, histórico com 100 linhas, edição de R.9, preservação de pilha/programa/notas, RPN/ALG/STO e gestos. A retomada de AudioContext real foi verificada no Chromium; o WebKit headless deste Windows não expõe AudioContext. Os estados interrompido/suspenso/fechado também têm testes unitários.
- Instalação real do cache, reload e navegação sem rede, e troca de 0.2.64 para 0.2.65 sem rede após a ativação, preservando registradores, histórico, notas e preferências.

As capturas e os relatórios locais estão em `../qa-revision-065` no workspace da revisão. Testes headless e toques CDP não substituem um iPhone físico. Som audível, vibração física, teclado virtual e barra do sistema precisam de conferência no aparelho. O sistema pode suspender o processo e remover armazenamento sob pressão; offline depende da instalação completa do cache e da conservação dos dados locais. Não foi solicitado armazenamento persistente nem alterada qualquer permissão.

## Fontes primárias

- [Web Audio 1.1 — estados e retomada](https://webaudio.github.io/web-audio-api/)
- [Chrome — Web Audio e autoplay](https://developer.chrome.com/blog/web-audio-autoplay/)
- [W3C — Vibration API](https://www.w3.org/TR/vibration/)
- [Posição do WebKit sobre vibração](https://github.com/WebKit/standards-positions/issues/267)
- [WebKit — armazenamento, quotas e remoção](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [Workbox — precaching](https://developer.chrome.com/docs/workbox/precaching-with-workbox/)
