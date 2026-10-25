# Importação remota 0.2.68: correção fundamentada

## Evidência e causa

Marcos tentou no iPhone o arquivo publicado `https://sagittaryuz.github.io/hp12c-platinum/downloads/hp12c-platinum-scripting-0.2.67.zip`; a captura inspecionada pelo pai (Library `libfile_008b03681d88819192567a0933d550e1`) mostra “Arquivo de script não suportado.” Este executor recebeu esse relato confiável, sem reinspecionar os pixels. HTTP 200, SHA256, ZIP íntegro e ponte simulada **não** validaram a importação; a entrega anterior extrapolou esses critérios ao indicar o ZIP para o importador remoto.

Inspeção do artefato original: `index.tsx`, `metadata.json` e `web/` na raiz; faltava `script.json`. Não havia pasta externa extra: a raiz não era o defeito observado na estrutura. A documentação de Script expõe metadata em runtime, mas não torna `metadata.json` um descritor de projeto válido.

Evidências primárias consultadas:

- [ScriptingApp/scripting-app-development, project-and-lifecycle](https://github.com/ScriptingApp/scripting-app-development/blob/2991c41f42be9e50d3080c5af34315e68ebb3d86/references/project-and-lifecycle.md): projeto exige `script.json` e `index.tsx`; descritor exige `name`, `icon`, `color`, `version`.
- [Template oficial script.json](https://github.com/ScriptingApp/scripting-app-development/blob/2991c41f42be9e50d3080c5af34315e68ebb3d86/templates/script.json): campos e tipos conferidos.
- [Community-Scripts/test.scripting](https://github.com/ScriptingApp/Community-Scripts/blob/f9509c530b730d8be36639db5b7825cadb431898/test.scripting): baixado sem executar; é ZIP, entradas `index.tsx` e `script.json` diretamente na raiz, sem envelope externo. Este é um exemplo distribuído pela comunidade oficial; não foi importado fisicamente neste ambiente.
- [ScriptingApp/scripts README](https://github.com/ScriptingApp/scripts/blob/main/README.md): documenta importação de diretório GitHub e aponta projetos oficiais prontos com `script.json`/`index.tsx`.

O defeito estrutural confirmado é a ausência do descritor obrigatório `script.json`. A extensão `.zip` também divergia da distribuição canônica `.scripting` dos exemplos inspecionados; adotamos esse formato para remover a ambiguidade. A página genérica de Script mostra inclusive uma URL .zip em um exemplo antigo, por isso não é correto concluir que o importador rejeita todo ZIP apenas pela extensão. Sem o código do importador ou acesso ao iPhone, não isolamos qual verificação produziu a mensagem exata. Corrigimos o descritor e adotamos a distribuição canônica sem mudar APIs nativas, cálculos, CSS, haptics ou Storage.

## Mudanças

Build gera `hp12c-platinum-scripting-0.2.68.scripting`, ZIP com `script.json`/`index.tsx`/`web/` na raiz, mantendo o nome HP12C Platinum. O Pages publica esse arquivo e seu SHA256SUMS. Não basta renomear o ZIP antigo.

`npm run build:scripting -- --sync-project` gera também `scripting/HP12C Platinum`, diretório autossuficiente versionado no mesmo repositório para a alternativa de importação GitHub. O `index.tsx` é compilado e não depende dos arquivos de desenvolvimento fora dessa pasta. Nenhum dado do usuário é incluído. Atualizações devem preservar o script existente e ser precedidas de backup.

## Validação e limites

O validador `scripts/validate-scripting-package.py` exige a extensão canônica escolhida pelo publicador e confere integridade ZIP, raiz, descritor/campos, paths seguros e dependências do entrypoint. Aceitou o exemplo oficial e rejeitou o ZIP original e a versão apenas renomeada para .scripting (sem script.json). Seis testes de regressão cobrem também pasta externa indevida, campos ausentes e import de fonte fora do projeto. Isso é conformidade de contrato, não uma reprodução do parser proprietário do Scripting.

A validação física da nova importação permanece **não executada**: não há iPhone/Scripting conectado. Passo pendente: colar a URL .scripting ou a URL do diretório GitHub no importador remoto e verificar importação, abertura e depois vibração/persistência no aparelho. Não instalar CLI/SDK nem ampliar permissões para substituir essa evidência. Bloqueios anteriores de file://, certificado Chromium e upload Releases não foram retentados.

O relatório 0.2.67 e seus testes de lógica/visual continuam históricos. O erro de importação nativa agora está confirmado para aquela entrega; sua integridade ZIP não significa que era importável.

Resultados cloud desta correção: 6 testes de contrato, 217 testes JS, 217 com WASM, 24 visor e 4 Sites passaram; TypeScript e builds passaram. Os 11 cenários da variante com ponte simulada passaram sem erros; zero pixels diferentes nas cinco dimensões contra a base aprovada. Dados em import-contract-results.json, import-browser-results.json e import-visual-results.json. Não houve nova alteração em src/, packages/ ou rust-core/.
