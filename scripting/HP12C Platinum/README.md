# HP12C Platinum no Scripting — 0.2.68

Variante local do mesmo frontend React/CSS/Canvas e motor JavaScript da web. Não é um link Vercel, nem firmware HP ou interface iOS reescrita. A web continua com PWA e seleção Rust/WASM/fallback. Nenhuma promessa de maior velocidade.

## Importar no iPhone

A tentativa 0.2.67 foi rejeitada no iPhone com “Arquivo de script não suportado.” Essa versão não tinha o `script.json` obrigatório: usava `metadata.json`. Também foi oferecida como ZIP genérico, enquanto os arquivos oficiais inspecionados usam `.scripting`. A correção 0.2.68 usa `.scripting` (contêiner ZIP), `script.json` e `index.tsx` na raiz. A estrutura foi conferida com documentação/projetos oficiais; **a nova importação ainda não foi executada no iPhone deste ambiente**.

- [Abrir importação do arquivo .scripting](https://www.scripting.fun/import_scripts/?urls=%5B%22https%3A%2F%2Fsagittaryuz.github.io%2Fhp12c-platinum%2Fdownloads%2Fhp12c-platinum-scripting-0.2.68.scripting%22%5D) ou copie diretamente [a URL do arquivo](https://sagittaryuz.github.io/hp12c-platinum/downloads/hp12c-platinum-scripting-0.2.68.scripting) em Importar Scripts Remotos.
- Alternativa documentada oficialmente: [abrir importação do diretório GitHub](https://www.scripting.fun/import_scripts/?urls=%5B%22https%3A%2F%2Fgithub.com%2FSagittaryuz%2Fhp12c-platinum%2Ftree%2Fmain%2Fscripting%2FHP12C%2520Platinum%22%5D) ou copie [este diretório completo](https://github.com/Sagittaryuz/hp12c-platinum/tree/main/scripting/HP12C%20Platinum) em Importar Scripts Remotos. Use especificamente `scripting/HP12C Platinum`, que contém o projeto compilado e todos os recursos; a pasta superior `scripting/` contém fontes de desenvolvimento e não é o projeto importável.
- [SHA256SUMS](https://sagittaryuz.github.io/hp12c-platinum/downloads/SHA256SUMS.txt) verifica a integridade do arquivo, sem provar a importação no aparelho.

O arquivo contém `script.json`, `index.tsx` e `web/` na raiz, sem pasta externa adicional. O diretório GitHub usa a mesma disposição. Não renomeie o ZIP antigo: faltava também o descritor correto. Após importar, execute HP12C Platinum; os cálculos e recursos são locais e não dependem da web. Se você instalou uma versão manualmente, exporte backup antes de atualizar e preserve o nome/pasta do script e seus dados; não apague o original.

Use apenas uma instância (atalhos podem usar `scripting://run_single/HP12C%20Platinum`). A ponte bloqueia navegação remota. A vibração discreta usa `HapticFeedback.lightImpact()` no acionamento confirmado da tecla; MENU também. Gire para paisagem para acessar a tecla MENU do layout aprovado. Abra MENU → Configurações → Vibração para desligar; a preferência é salva. Arrastos cancelados e clicks de compatibilidade não repetem o feedback.

## Dados e backup

Safari/PWA e Scripting têm dados separados. Na web original, MENU → Configurações → Salvar backup; conserve esse JSON. No Scripting, use Restaurar backup e escolha o arquivo pelo seletor nativo. O original permanece intacto. Exportar no Scripting usa Arquivos e o mesmo formato JSON v1. Cancele o seletor para não alterar nada. Não apague o script original durante atualizações: exporte antes, atualize na mesma pasta e confira os dados.

A variante lê o snapshot nativo antes de montar React; falhas de leitura impedem que um estado vazio sobrescreva dados. Escritas são serializadas e confirmadas por revisão; a cópia anterior fica em `hp12c-scripting-previous-v1`, a atual em `hp12c-scripting-v1`, no Storage privado do Scripting. Instâncias desatualizadas são rejeitadas. Restauração grava todas as entradas em uma única transação antes de alterar a tela. Falha de salvamento mantém o snapshot em memória para nova tentativa e apresenta aviso: mantenha a sessão aberta e exporte backup. O Storage retorna confirmação síncrona, mas a persistência física é assíncrona segundo a documentação; encerramento forçado imediato pelo iOS não oferece garantia absoluta. Confira fechar/reabrir e mantenha backups externos. Não há limpeza do Storage global.

## Compilar e conferir

`npm run build:scripting` produz `dist/scripting/hp12c-platinum-scripting-0.2.68.scripting`, sem tocar em `dist/client`. Usa as dependências existentes; não requer Mac. JS é empacotado como script clássico inline; CSS/fontes são locais/embutidos para evitar CORS de módulos/fontes em file://. Service worker é desativado somente nesta variante. Não depende de WASM local.

`npm run test:scripting`, `npm run test:engine`, `npm run test:display`, `npm run test:sites`, `npx tsc --noEmit`. Evidências e limites: [qa/scripting/README.md](https://github.com/Sagittaryuz/hp12c-platinum/blob/main/qa/scripting/README.md).

Use `npm run build:scripting -- --sync-project` para atualizar também o diretório importável versionado. `npm run test:scripting-package` verifica as regras de empacotamento e os casos inválidos da 0.2.67. [Investigação e limites da correção](https://github.com/Sagittaryuz/hp12c-platinum/blob/main/qa/scripting/import-fix.md).

## Contratos oficiais consultados

- https://scriptingapp.github.io/guide/Device%20Capabilities/WebViewController — loadFile, addScriptMessageHandler com resposta Promise e present fullscreen.
- https://scriptingapp.github.io/guide/Device%20Capabilities/HapticFeedback — lightImpact.
- https://scriptingapp.github.io/guide/Utilities/Storage — get/set, domínio privado e persistência física assíncrona.
- https://scriptingapp.github.io/guide/Device%20Capabilities/DocumentPicker — pickFiles/exportFiles sem bookmark persistente.
- https://scriptingapp.github.io/guide/Script/Script — directory e geração de URLs. Para o formato de distribuição, prevalecem os projetos oficiais abaixo.
- https://github.com/ScriptingApp/scripting-app-development/blob/main/references/project-and-lifecycle.md — script.json obrigatório com name/icon/color/version.
- https://github.com/ScriptingApp/scripts/blob/main/README.md — importação de diretório GitHub completo.
- https://github.com/ScriptingApp/Community-Scripts/blob/main/test.scripting — contêiner ZIP, extensão .scripting e arquivos na raiz.

É obrigatório validar no iPhone/Scripting real: importação .scripting, fullscreen/safe areas, rotação/notch/Home, retorno do app, seletor Arquivos, vibração e desligamento persistente, encerramento pelo iOS e reabertura. A emulação Chromium verifica o frontend e uma ponte simulada, não essas APIs nativas.
