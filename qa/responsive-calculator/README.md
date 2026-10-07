# HP12C 0.2.39 — validação local

Escopo autorizado em 07/10: prévia imediata de tecla com confirmação na soltura, Copiar por bloco CLx (texto completo e notas, sem PNG/menu), superfície Memória #090909 igual ao cabeçalho HP, menu essencial, formato persistente e vinte registradores editáveis. Publicação nas duas URLs existentes autorizada pelo pedido posterior “modifique… Publique”; este pedido substitui a restrição local e a solicitação de wallpaper anterior. Motor financeiro/RPN inalterados; programas, dados existentes e credenciais preservados. Novas linhas guardam o separador usado; linhas antigas continuam compatíveis.

A prévia usa o mesmo reducer puro e é descartada em arrasto >8px, saída da tecla mesmo <8px, cancelamento, perda de captura/foco, mudança real de viewport e multitoque. Dados, histórico, registradores e feedback só se confirmam uma vez na soltura válida. Atalhos e ativação acessível continuam imediatos. Testes incluem STO pendente cancelado e valores internos completos.

O LCD mantém desenho síncrono, cache de geometria com ResizeObserver e assinatura de desenho; confirmar uma prévia igual não redesenha. História e preferências persistem independentemente, com debounce de150ms e flush ao sair. Agrupamento do histórico somente com Memória aberta. Registro do service worker adiado para idle, fonte crítica pré-carregada; foto antiga permanece como asset legado mas sai da tela e do precache. Animação WAAPI260ms/curva compartilhada, sem blur solicitado e sem callback JS por quadro, respeita movimento reduzido. Sem loop para forçar120Hz.

Validação:159 Vitest+25display+4Sites=188 testes; TypeScript do projeto e defaults; build produção. functional.json: Chromium/Edge154 e WebKit26.6,402×874/1280×800, cancelamentos reais/multitoque Chromium, bloco completo+nota, rejeição da cópia sem falso sucesso,20memórias e cashflows/precisão, formato preservado após recarga, zero solicitações da foto/erros JS. geometry.json: posições/tamanhos idênticos a185391d/0.2.38 (tolerância0,05CSS px) em320×450,402×874,1280×800 nos dois navegadores. cycles.json: abertura/fechamento ambas abas, mouse/touch Chromium, curto/reversão/cancelamento/repetição,100linhas, movimento normal/reduzido. release-results.json: recursos/versionamento e recarga offline sem mudança de dados.

Medição comparável em performance.json: baseline imutável185391d/0.2.38 em5200, candidato build em5199; perfis novos, SW bloqueado em ambos, ordem alternada,8repetições×0/100linhas×2versões×2engines. React commit com visor alterado é proxy de resposta JavaScript/DOM, não apresentação física/FPS. Pressão mantida150ms em ambos, digitação11ativacões rápidas com resultado interno12345679. performance-initial.json precede agrupamento final das leituras horizontais; arquivo final contém reavaliação. A espera antiga até soltar é parte da medida; prévia melhora percepção sem antecipar persistência.

JS produção309,92KB (gzip96,73), contra324,48KB (gzip101,31); precache741,85KiB/39arquivos contra811,92KiB/40. IRR difícil continua podendo exceder8,33ms devido ao motor; não modificado. Não há garantia120Hz, teste de ProMotion ou iPhone físico. localStorage persiste por origem enquanto dados do navegador forem mantidos; limpar dados remove escolhas. Vercel e Pages têm armazenamento independente.

Reprodução: Node24/npm ci/build; instalar Playwright fora do repo e ajustar PLAYWRIGHT_MODULE/BROWSER_PATH (scripts legados já usam caminho local; functional/performance/geometry podem ser adaptados). Servir baseline5200 e candidato5199. Rodar performance sozinho, depois functional/cycles/geometry/release. Clipboard de functional é stub somente no perfil QA; interface de cópia real testada por API/resultado confirmado. WebKit automatizado em Windows, touch nativo via CDP somente Chromium. PNG de evidência local ignorado no git.

Referências primárias pesquisadas: [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), [MDN timing WAAPI](https://developer.mozilla.org/en-US/docs/Web/API/AnimationEffect/getComputedTiming), [MDN compositor/performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance), [Apple ProMotion](https://developer.apple.com/documentation/QuartzCore/optimizing-iphone-and-ipad-apps-to-support-promotion-displays), [WebKit173434](https://bugs.webkit.org/show_bug.cgi?id=173434). Taxa varia com navegador, energia, temperatura e hardware; API nativa Apple não concede controle à página.

Medição final (ms, medianas; startup = navigationStart→primeiro commit):

|Navegador|Linhas|Versão|Startup|Pressão→visor|Tecla rápida mediana/p95|
|---|---:|---|---:|---:|---:|
|chromium|0|0.2.38|201.6|166.8|1.0/1.9|
|chromium|100|0.2.38|193.0|165.7|1.0/1.4|
|chromium|0|0.2.39|188.6|3.6|1.1/1.4|
|chromium|100|0.2.39|180.8|3.7|1.0/1.8|
|webkit|0|0.2.38|238.0|176.0|2.0/3.0|
|webkit|100|0.2.38|225.0|170.0|2.0/3.0|
|webkit|0|0.2.39|225.0|5.0|1.0/2.0|
|webkit|100|0.2.39|223.0|5.0|1.0/2.0|

Ganho inicial modesto/variável: Chromium medianas−6%, WebKit0linhas−5,5%/100linhas−0,9%; p95 Chromium100linhas229→267ms (pior), portanto sem promessa de startup consistentemente mais rápido. Visor à pressão3,6–3,7ms Chromium/5ms WebKit contra espera165,7–176ms com hold150ms; esta mudança elimina espera da soltura, não acelera o motor. WebKit prévia p959ms com100linhas ultrapassa8,33ms; não demonstra120fps. Digitação p95≤2ms, leituras do LCD11→0, uma escrita de estado e uma de histórico por burst em ambas versões.
