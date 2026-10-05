# Display copy and share — 0.2.14

Base: exact production0.2.13 source snapshot restored in preceding commit. Its original build timestamp2026-10-05T02:44:10.107Z reproduced eight production files byte for byte (HTML, JS, CSS, manifest, SW, Workbox, texture, WOFF2). Source hashes matched the deployment file IDs where visible. Git history and other tracked files were retained.

Tap copies exactly the displayed text. Hold500ms or longer, then release, copies and requests native share. Release is deliberate: touch pointerup supplies iOS transient activation. Clipboard write starts before share, with no await in between. Cancel/drag/leave/multitouch/lost capture/blur/pagehide/hidden page abort the gesture. Pointer-generated click is suppressed; accessible click and Enter/Space copy, Shift+Enter/Space share. Keyboard actions on the visor do not execute calculator shortcuts.

Share cancellation does not report failure. Copy and share outcomes remain independent. Missing clipboard uses synchronous legacy copy with focus/selection restoration. Failed automatic copy opens a selectable, accessible manual-copy dialog; no clipboard read, permissions query, telemetry or external destination is added. Feedback is temporary and outside LCD geometry. Menus/diagnostics disable visor transfer. The renderer, font, glyphs, math and cache lifecycle retain their prior implementation.

## Validation

`npm run test:engine`, `npm run test:display`, `npm run build`, `npm run test:sites`, `npx tsc --noEmit`.

119 tests:91engine/panels,21transfer,3LCD,4Sites. Chromium and WebKit browser suite:30checks including six exact full-page pixel/geometry comparisons against the0.2.13 baseline at402x874,874x402 and1280x720DPR3, trusted tap, simulated pointer hold/cancellations, keyboard, manual fallback, menus and state/calculate/reload. Share is mocked in this suite; a native OS sheet is not asserted by automation.

Platform suite separately verifies actual clipboard writes from trusted taps, without reading clipboard. Chromium CDP touch hold verifies fresh activation and one copy/share call (APIs instrumented). Production service worker reload/state/transfer tested offline: Chromium native offline; WebKit server rejects real connections rather than Web Inspector navigation blocking. See JSON results.

Playwright/WebKit26.6 was installed for QA outside the app. Missing Debian libraries were downloaded and extracted only into `/tmp`; no system package installation or app dependency was added. A bundled browser wrapper needed links to those local libraries; the host validation checker falsely reported missingGLES despite the available runtime library, so runtime launching was validated directly.

To reproduce browser tests, start the candidate dev server at5173 and exact0.2.13 baseline at5174. Install Playwright in a separate tooling directory, set `PLAYWRIGHT_MODULE` to its absolute index.mjs path and `CHROMIUM_EXECUTABLE` if needed. Run `node qa/display-transfer/browser.mjs`. Build candidate then run `node qa/display-transfer/platform.mjs` (uses its own local5177server). Set browser-library paths according to the environment. Browser PNGs are generated locally and ignored by Git.

## iPhone acceptance / publication

Linux WebKit is not installed Safari/PWA on a physical iPhone. Before claiming hardware validation: confirm tap copy by pasting in another app; hold/release opens the native sheet and also leaves the value copied; cancel the sheet; drag and add a second finger; verify repeated holds and backgrounding; repeat offline with calculator program/FIX/settings intact. Clipboard and share API availability/permissions remain browser/OS-controlled.

No manual Vercel deployment was performed. The repository's existing main-push workflow publishes GitHub Pages, so updating main requires approval for that automatic publication. Source changes are prepared in two commits to preserve the exact0.2.13 recovery separately from0.2.14 transfer. Before push, recheck remote main and integrate any concurrent commits; never force push. A new verification workflow runs build/tests for branches without publishing.

Primary references checked during implementation:
- https://webkit.org/blog/13862/the-user-activation-api/
- https://w3c.github.io/web-share/
- https://w3c.github.io/clipboard-apis/
