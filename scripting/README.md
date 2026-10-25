# HP12C Platinum no Scripting — 0.2.67

Variante local do mesmo frontend React/CSS/Canvas e motor JavaScript da web. Não é um link Vercel, nem firmware HP ou interface iOS reescrita. A web continua com PWA e seleção Rust/WASM/fallback. Nenhuma promessa de maior velocidade.

## Importar no iPhone

[Abrir importação no Scripting](https://www.scripting.fun/import_scripts/?urls=%5B%22https%3A%2F%2Fsagittaryuz.github.io%2Fhp12c-platinum%2Fdownloads%2Fhp12c-platinum-scripting-0.2.67.zip%22%5D). O link oficial encaminha o ZIP do GitHub Pages original para o app; a importação nativa ainda precisa ser conferida no aparelho.

Baixe o [ZIP local 0.2.67](https://sagittaryuz.github.io/hp12c-platinum/downloads/hp12c-platinum-scripting-0.2.67.zip) e confira [SHA256SUMS](https://sagittaryuz.github.io/hp12c-platinum/downloads/SHA256SUMS.txt) . No Scripting, use a importação de script por arquivo ZIP/URL. O ZIP tem `index.tsx`, `metadata.json` e `web/` na raiz. Se sua versão não oferecer importação ZIP, extraia no app Arquivos e copie o conteúdo para uma nova pasta de script do Scripting, mantendo `web/` ao lado de `index.tsx`. Execute `index.tsx`. Depois da importação, todos os recursos e cálculos são locais, sem servidor ou rede.

Use apenas uma instância (atalhos podem usar `scripting://run_single/HP12C%20Platinum`). A ponte bloqueia navegação remota. A vibração discreta usa `HapticFeedback.lightImpact()` no acionamento confirmado da tecla; MENU também. Gire para paisagem para acessar a tecla MENU do layout aprovado. Abra MENU → Configurações → Vibração para desligar; a preferência é salva. Arrastos cancelados e clicks de compatibilidade não repetem o feedback.

## Dados e backup

Safari/PWA e Scripting têm dados separados. Na web original, MENU → Configurações → Salvar backup; conserve esse JSON. No Scripting, use Restaurar backup e escolha o arquivo pelo seletor nativo. O original permanece intacto. Exportar no Scripting usa Arquivos e o mesmo formato JSON v1. Cancele o seletor para não alterar nada. Não apague o script original durante atualizações: exporte antes, atualize na mesma pasta e confira os dados.

A variante lê o snapshot nativo antes de montar React; falhas de leitura impedem que um estado vazio sobrescreva dados. Escritas são serializadas e confirmadas por revisão; a cópia anterior fica em `hp12c-scripting-previous-v1`, a atual em `hp12c-scripting-v1`, no Storage privado do Scripting. Instâncias desatualizadas são rejeitadas. Restauração grava todas as entradas em uma única transação antes de alterar a tela. Falha de salvamento mantém o snapshot em memória para nova tentativa e apresenta aviso: mantenha a sessão aberta e exporte backup. O Storage retorna confirmação síncrona, mas a persistência física é assíncrona segundo a documentação; encerramento forçado imediato pelo iOS não oferece garantia absoluta. Confira fechar/reabrir e mantenha backups externos. Não há limpeza do Storage global.

## Compilar e conferir

`npm run build:scripting` produz `dist/scripting/hp12c-platinum-scripting-0.2.67.zip`, sem tocar em `dist/client`. Usa as dependências existentes; não requer Mac. JS é empacotado como script clássico inline; CSS/fontes são locais/embutidos para evitar CORS de módulos/fontes em file://. Service worker é desativado somente nesta variante. Não depende de WASM local.

`npm run test:scripting`, `npm run test:engine`, `npm run test:display`, `npm run test:sites`, `npx tsc --noEmit`. Evidências e limites: [qa/scripting/README.md](../qa/scripting/README.md).

## Contratos oficiais consultados

- https://scriptingapp.github.io/guide/Device%20Capabilities/WebViewController — loadFile, addScriptMessageHandler com resposta Promise e present fullscreen.
- https://scriptingapp.github.io/guide/Device%20Capabilities/HapticFeedback — lightImpact.
- https://scriptingapp.github.io/guide/Utilities/Storage — get/set, domínio privado e persistência física assíncrona.
- https://scriptingapp.github.io/guide/Device%20Capabilities/DocumentPicker — pickFiles/exportFiles sem bookmark persistente.
- https://scriptingapp.github.io/guide/Script/Script — directory e importação por ZIP/URL.

É obrigatório validar no iPhone/Scripting real: importação ZIP, fullscreen/safe areas, rotação/notch/Home, retorno do app, seletor Arquivos, vibração e desligamento persistente, encerramento pelo iOS e reabertura. A emulação Chromium verifica o frontend e uma ponte simulada, não essas APIs nativas.
