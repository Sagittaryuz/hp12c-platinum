# Portrait header alignment — release0.2.17

User authorized publication together with the portrait footer curve32px/texture10px. Model left and emblem right align exactly to `.lcd-face` inner LCD edges, excluding the border and external rim. Widths, heights and vertical positions are unchanged. The approved landscape is deliberately preserved; its brands are beside the LCD, so horizontal-only alignment would obscure them. Previous literal landscape experiment is evidence only, not active code.

At402×874: model left25.109375px / logo right376.859375px exactly equal inner LCD edges. At320×450:20.1875px /299.78125px. Error0px in Chromium/WebKit. Alignment follows actual measured border rounding, ResizeObserver, resize, media-query orientation and visualViewport resize. Updates are scheduled after layout; existing copy status re-centers after alignment via a DOM event.

measurements.json:12geometry/rotation checks, comparing fresh pages with the isolated exact0.2.16 source on5181, candidate5180. All keys, LCD and approved landscape keep their geometry. Footer placement intentionally changes separately. interaction-results.json:30checks covering tap/hold/cancel/drag/multitouch/keyboard/pending-share/fallback/calculation/state. Typeface, text and display rendering are preserved.

No iPhone hardware or native sharing-sheet test. Footer and publication details are in qa/footer-curve/README.md and the publication report for0.2.17.
