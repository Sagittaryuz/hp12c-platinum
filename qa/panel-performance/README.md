# Local panel performance study

Base: 0.2.36, c268fbc. Isolated branch: perf/local-panel-frame-budget. Subsequent explicit publication authorization covers release0.2.37 from tested eb38c39, excluding the unavailable new wallpaper; release/version commit changes metadata only.

The panels already use compositor-eligible transform WAAPI animation and imperative gesture writes, without React updates per frame. The avoidable cost found was reading computed transform and clientHeight after filter writes in every animation frame. The memory preview additionally read computed height on every pointer event.

The change derives geometry from WAAPI's eased getComputedTiming().progress, captures height per settle, and tracks preview height numerically. Interruptions still read current visual geometry once, so transfer to a new gesture remains continuous. Duration260ms, cancellation160ms, easing(.2,.7,.2,1), and symmetric blur reaching zero at95% are unchanged. Preview still animates height: replacing that with transform would change wallpaper/title anchoring and was intentionally left for a separately measured experiment. Filter raster/compositing cost remains; no blanket will-change layers, no heavy dependency.

## Comparable evidence

Same local Vite server, Windows Edge headless, same script, six opening/closing sequences per panel, 100 history rows. Baseline before restoring candidate source: baseline.json. Candidate source: candidate.json. Final black Memória top: candidate-final.json. These count actual API reads, not inferred saved milliseconds.

| Viewport | Computed style baseline/candidate | Height baseline/candidate | Median frame baseline/candidate | p95 baseline/candidate |
|---|---|---|---|---|
|402x874|656 /84 (87.2% fewer)|650 /156 (76.0% fewer)|7 /7ms|55.5 /76.2ms|
|1280x800|790 /84 (89.4% fewer)|784 /156 (80.1% fewer)|7 /7ms|48.6 /48.7ms|

Final run p95 was41.7/48.6ms. Variability and headless scheduling mean there is **no demonstrated frame-time improvement or achieved120Hz**. The8.33ms budget was not consistently met. rAF callback intervals are not physical presentation timestamps. WebKit26.6 Windows results are separate, not comparable to Edge or physical Safari; much slower clock under this environment (webkit.json).

Edge and WebKit assertions: both viewport sizes, opening/closing, both panel directions, short drag return, reversal, pointer cancellation,110px release, repeated gestures, reduced motion,100rows and exact LCD/key/footer rectangles after return; no page errors. Mouse coordinates and keyboard are trusted browser input; cancellation is dispatched. No physical touch/iPhone/PWA refresh proof. Screenshots were inspected locally; old wallpaper and legible text remain, Memória DOM top black. Native OS status bar color not guaranteed.

geometry.json independently compares derived blur with actual computed transform in both directions, opening/closing:50samples, maximum error0.000466px, endpoints zero. pull-baseline.json and pull-candidate.json preserve the initially discovered failure after a Memória close/menu open-close cycle in original c268fbc and the first candidate. Follow-up fix: the window capture blur listener was cancelling pointerdown when a previously focused child button lost focus. It now cancels only actual window blur. pull-fixed.json verifies initial and subsequent opening both succeed; unit tests cover element focus blur in both directions and still require real window blur to cancel.

cycles.json:18complete Memória→calculator→HP menu→calculator cycles passed across402x874 and1280x800; mouse and native Chromium CDP touch, plus WebKit mouse. Every configuration starts pulls on plate, key7 and LCD; both directions, short snap-back, reversal and cancellation;100rows and exact persisted financial-state JSON preserved. No page errors. Touch cancellation uses native CDP touchCancel; mouse cancellation is dispatched. WebKit native touch driver is unavailable, so no WebKit physical-touch claim.

Complete checks after follow-up:148Vitest,25display,4Sites tests; TypeScript and production build pass. Original offline precache asset retained; real offline reopen not exercised in this run.

## New wallpaper blocker

Resolved libfile_9708740d7218819199cb6778409df87f, image(20261006-192720).png,1952424bytes. prepare_materialize called twice with explicit local destinations: both returned signed transfer and workspace_path:null, no local bytes. Current Library skill requires library_file_transfer.py and metadata preservation; no python/python3/py executable is exposed here. Did not bypass helper or download raw URL, inspect pixels, copy a substitute, or change the original photo. New PNG replacement and its visual/offline validation remain pending until a supported local transfer is available.

Narrow Downloads check: no original filename match and no PNG last modified on2026-10-06. No broad private-file scan or image contents read. User can save the original PNG locally in C:\Users\mrpir\Documents\Codex\2026-10-06\task-6\incoming; then inspect those actual pixels and use exact bytes as authorized repo asset.

## Research and next measurement

- [MDN rAF](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame): callbacks generally follow display rate, use timestamps and pause in background.
- [MDN computed timing](https://developer.mozilla.org/en-US/docs/Web/API/AnimationEffect/getComputedTiming): progress reflects easing; used to preserve actual geometry.
- [MDN animation performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance): transform animations can run outside main thread; filter/layout work is separate.
- [Apple ProMotion](https://developer.apple.com/documentation/QuartzCore/optimizing-iphone-and-ipad-apps-to-support-promotion-displays): variable rates, no forced specific rate, power/thermal limits. Native APIs are not web APIs.
- [WebKit tracking issue173434](https://bugs.webkit.org/show_bug.cgi?id=173434): historical web refresh restrictions; comments are evidence of limitations, not a guarantee for the user's iPhone/Safari/PWA version. No flags changed.
- [Vercel branch control](https://vercel.com/docs/project-configuration/git-configuration): exact branch deploymentEnabled:false prevents automatic preview from authorized branch push; Pages workflow runs main only.

Next: transfer actual image, add precache exact asset, inspect DOM top/photo/contrast. Then profile production build on actual120Hz hardware/Safari and installed PWA, compare rAF distribution and browser paint/compositing traces while both drawers and100rows are exercised. Only then decide whether filter raster cost or preview height dominates enough to justify further changes.

Run measure.mjs with PLAYWRIGHT_MODULE/BROWSER_PATH to override the local temporary tool paths; TEST_ENGINE=webkit selects WebKit. Test tooling remains outside app dependencies. The initial study was local-only; subsequent0.2.37 publication authorization supersedes that restriction for this batch.
