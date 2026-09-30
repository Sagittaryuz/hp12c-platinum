# HP 12c Platinum para Windows e Web

Aplicativo independente em português do Brasil, com motor TypeScript local, modelo 3D original criado no Blender e guia pesquisável de teclas e atalhos.

- [Abrir calculadora](https://sagittaryuz.github.io/hp12c-platinum/)
- [Baixar instalador Windows](https://github.com/Sagittaryuz/hp12c-platinum/releases/latest)

## Uso

Clique nas teclas do modelo, use o teclado do PC ou abra **Teclado** para os controles acessíveis. **Atalhos** mostra as 39 teclas físicas, funções primárias e funções `f`/`g`, incluindo o comando do computador para cada operação. `F1` ativa `f`; `F2` ativa `g`; `Enter` ou espaço aciona ENTER; `Backspace` apaga um dígito; `Delete` limpa X; `?` abre o guia. Ao selecionar uma função no guia, a tecla correspondente é destacada e acionada.

Em RPN, digite `2`, ENTER, `3`, `+` para obter 5. Nos registros financeiros, digite um valor e pressione n/i/PV/PMT/FV para armazenar; pressione o registro desconhecido sem nova entrada para calcular. Fluxos usam `g PV` (CF₀), `g PMT` (CFⱼ) e `g FV` (Nⱼ). As datas usam M.DY ou D.MY, conforme a configuração do aparelho.

O app web pode ser instalado pelo menu de aplicativos do Edge. Depois que aparecer **OFFLINE PRONTO**, os recursos já estão armazenados para uso sem rede. A versão Tauri para Windows contém os arquivos localmente e dispensa conexão desde o primeiro uso. O instalador inicial não tem assinatura de código.

## Arquitetura

- `packages/core/src/engine.ts`: pacote TypeScript independente com estado serializável e funções puras, sem interface ou rede. `pressKey(state, id)` é compartilhado por modelo, teclado e controles acessíveis.
- `packages/core/src/keys.ts`: catálogo único das teclas, funções e atalhos.
- `src/calculator/CalculatorModel.jsx`: Three.js/glTF, raycasting, animação das teclas e textura dinâmica do LCD.
- `model/hp12c-platinum.blend`: fonte editável do modelo. `public/models/hp12c-platinum.glb`: modelo distribuído no app, com nomes e metadados das teclas.
- `src-tauri`: pacote Windows com conteúdo local. Sem backend, telemetria ou conta de usuário.
- Memória, programas e preferências são mantidos em `localStorage` no dispositivo. Web e desktop têm memórias separadas.

O motor inclui RPN/ALG, precedência e parênteses em ALG, porcentagens, TVM e períodos fracionários, amortização, juros simples, CF₀/CFⱼ/Nⱼ, NPV/IRR, títulos semestrais real/real, SL/SOYD/DB, estatísticas e regressão, calendário, funções matemáticas, registradores, programação e memória contínua. A suíte confere exemplos e invariantes; esta implementação independente ainda não equivale a uma certificação de todas as sequências possíveis do hardware.

## Modelo e referências

As seis vistas fornecidas fixam dimensões externas **nominais** de 129 × 79 × 15 mm. O arquivo exportado mede aproximadamente 129,020 × 79,020 × 15,015 mm; o relatório está em `model/measurements.json`. As proporções da tela, moldura e teclas foram inferidas visualmente. A traseira inclui um guia próprio legível no lugar das inscrições ilegíveis da prancha. A réplica física 1:1 completa exige fotos reais nítidas e medidas individuais desses componentes; não é afirmada nesta versão.

O [manual oficial HP](https://h10032.www1.hp.com/ctg/Manual/bpia5184.pdf) é a especificação funcional de referência; o PDF e o firmware da HP não estão incluídos. O carregamento usa o [fluxo glTF do Three.js](https://threejs.org/manual/en/load-gltf.html).

## Desenvolvimento e verificação

Node 24 ou mais recente:

```sh
npm ci
npm run dev
npm run test:engine
npx tsc --noEmit
npm run build
```

No Windows com Rust e os requisitos oficiais do Tauri instalados:

```sh
npx tauri dev
npx tauri build --bundles nsis
```

Para regenerar o modelo: exporte o catálogo com Node, gere as texturas com `scripts/create-model-textures.py` (Pillow e fontes Arial), depois execute Blender com `scripts/build-model.py -- CAMINHO_DO_PROJETO`. O script usa metros e verifica os limites da malha em milímetros.

Atualizações de `main` publicam GitHub Pages. Tags `v*` geram o instalador NSIS em GitHub Releases. O relatório visual é mantido em `design-qa.md`.

## Direitos

Projeto público sem concessão de licença aberta para o trabalho original. Consulte `COPYRIGHT.md`. As dependências mantêm suas licenças em `public/legal/third-party-notices.txt`. Projeto independente, sem vínculo com a HP.
