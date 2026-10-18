# Revisão 0.2.66 — rebaixo contínuo nos brackets e fabricante

Base remota e local conferida antes da edição: `a6e4d29e255809ab9025c6b25a90abe189266e29`, versão 0.2.65, árvore limpa. A autorização atual abrange implementação, commit, push e publicação no main e nos destinos Pages/Vercel existentes.

A sombra de contato passa gradualmente do trilho vertical para os arcos e os dois brackets horizontais. A camada decorativa deixa de excluir o centro inferior e acompanha o mesmo contorno, incluindo o contato sob HEWLETT PACKARD. A inscrição e o ponto recebem uma sombra curta, estática, coerente com esse plano. O recorte da superfície metálica, os raios e as dimensões permanecem intactos; não há novo elemento, filtro global, mudança de textura, cor-base ou lógica. O token funcional continua exatamente #BE1B04.

## Verificação local

- Chromium headless com Playwright e `/usr/bin/chromium`, em Linux. Browser plugin ausente. Capturas reais em 320×450, 320×568, 393×852 (DPR 3), 402×874, 768×1024, 852×393 e desktop 1280×800.
- Comparação antes/depois: nenhuma alteração nas coordenadas de LCD, título, HP, molduras, placa, fabricante, teclas e legendas. Pixels do cabeçalho/LCD e do interior de todas as teclas idênticos. Fundo metálico, texto prata e token funcional idênticos nos estilos computados. Telas carregadas, 42 teclas presentes, sem sobreposição de erro ou erros de aplicação no console.
- 210 testes JS, 210 testes Wasm, 24 testes de visor/transferência e 4 de entrega passaram. TypeScript e builds raiz/Pages passaram. O motor não foi alterado; compilação/testes nativos Rust ficam também no CI existente.
- Os 13 testes de navegador existentes passaram: toque executado uma vez, teclado, cancelamento/multitoque, arrasto LCD, Memória, edição, histórico/notas/programa/preferências, fallback JS, offline e responsividade.
- Smoke adicional mobile/desktop: ALG 2+3=5, retorno a RPN, STO 9=5, versão dinâmica 0.2.66 na Memória e retorno da rotação sem mudança na moldura.
- Atualização real do service worker de 0.2.65 para 0.2.66: a nova versão aguardou a janela antiga fechar, sem navegação forçada. Todo o localStorage da aplicação permaneceu idêntico após ativação, incluindo pilha, vinte registradores, programa, histórico com nota e preferências. Reload, navegação aninhada e RCL funcionaram sem rede. O novo CSS/JS tem hashes próprios; os 49 recursos do precache foram mantidos. Nenhuma alteração no ciclo de atualização ou no armazenamento.

Capturas e relatórios detalhados ficam fora do repositório, em `/workspace/qa-revision-066`, incluindo `before.json`, `after.json`, `release.json`, `pixel-comparison.json`, `hp-interaction.json`, `smoke.json` e `offline-update.json`. Registros anteriores foram preservados.

## Limites

WebKit foi baixado, mas não iniciou neste ambiente por ausência de `libgtk-4.so.1`, `libgraphene-1.0.so.0`, `libharfbuzz-icu.so.0`, `libmanette-0.2.so.0`, `libhyphen.so.0` e `libGLESv2.so.2`. Não foram alterados pacotes ou permissões do sistema. Os testes mobile e de toque são emulados no Chromium, sem alegação de iPhone físico, Safari instalado, áudio/vibração física ou interface nativa do iOS. Não houve empacotamento iOS.
