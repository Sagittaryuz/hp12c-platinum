# Continuous portrait frame — 0.2.19 over 0.2.18

User physically reviewed0.2.18, requested44CSSpx outer lower radius and a smooth unified lateral/bottom contour, and explicitly authorized publication. Base main587f094 matched the previously verified production0.2.18. Latest JPEG could not download using the supported Library materialization helper, including one renewed attempt with an explicitly local destination. Its pixels were not inspected; conclusions come from code and rendered screenshots.

## Implementation

Previously a5px straight keyboard frame ended above an independent10px footer. Small black triangular transition pieces attempted to bridge that join. These independent parts are now removed from portrait painting. One `.portrait-footer-frame` extends from the existing top metal member to the bottom. It paints both complete10px vertical rails and the10px horizontal rails, with44px outer arcs. Its black inner surface has10px side/bottom insets and34px inner arcs. The centres coincide:10+34=44 on both axes. Both outlines are tangent to their respective straight segments; no clip polygons, triangles, overlap, gap or radius scaling at their meeting points. The approved top metal member remains1px. Landscape retains its original frame.

All key, LCD/inner face, model/emblem, keyboard panel and maker/lettering bounding rectangles match isolated exact0.2.18. Side metal is now10px throughout portrait, as required for the coherent10px contour; this changes its painted width from5px without moving controls. The inscription, pseudo rail boxes and bottom plastic remain10px, with the maker row10px above the viewport bottom. A44px full quarter arc occupies44px vertically;10px refers to metal thickness and text/band height.

## Evidence

- `visual-results.json`:34 cases Chromium/WebKit;30 portrait cases covering402×874 (0/34px bottom reservation),375×812,430×932 and320×450 at DPR1/2/3. Geometry preserved, both radii/insets verified, keys above arcs, old portrait frame disabled and transitions removed. Four landscape screenshots byte-identical to0.2.18.
- `pixel-results.json`:60 rendered corners. Both sides sampled at91 angles including both tangent endpoints, a continuous interior band at radii36–42px, outside checks, and seven radial thickness measurements per corner.44/34 boundaries and10px thickness pass within explicit pixel-rounding tolerances. Captures at multiple DPRs visually inspected, including both Chromium402 corners, WebKit402safe34 full view and WebKit320/430 corner crops.
- `rotation-results.json`:Chromium/WebKit portrait→landscape→portrait, restored34px inner arc,10px bottom row, copy feedback/menu/calculation.
-119 engine/display/LCD/Sites tests, TypeScript and build passed. Publication CI repeats these checks on the release commit.
- W3C primary specification consulted for quarter ellipse shaping/tangent geometry: https://www.w3.org/TR/css-backgrounds-3/#corner-shaping . Measurements establish this specific rendering; they do not claim all implementations or physical hardware behave identically.

Scripts use candidate5180, exact0.2.18 baseline5183 and PLAYWRIGHT_MODULE. PNGs are ignored local QA artifacts.34px reservation is simulated, not actual native env()/iPhone rendering. Native share sheet and installed iPhone PWA need physical confirmation; the previously accepted Home-indicator overlap risk at the lowest maker row remains. Source publication report records commit, deployment, CI and public asset verification.
