# Release0.2.21 — equal40px radii and downward row distribution over0.2.20

Implemented locally and explicitly authorized for publication as0.2.21. Base before publication is `7a7456ea0a9a62fcd7422c656ca25cc4ba9ee97f` (production0.2.20); release package version0.2.21.

## Interpretation and geometry

The20px request is implemented as a20px increase in the occupied height of the seven portrait rows, anchored at the first row. It is not a rigid20px displacement of every key followed by a second expansion. The six intervals receive equal20/6 =3.333333CSSpx gains. Row displacements are0,3.333,6.667,10,13.333,16.667,20px. This uses the newly available lower room once and does not compress the top or change normal key dimensions/fonts. Ordinary legends move with their own keys. BOND, DEPRECIATION and CLEAR text/arms move together to the new gap midpoint; PREFIX follows ENTER.

The new outer and inner radii are both40CSSpx, explicitly requested by the user. Straight metal rails remain10px. Arc centres are offset10px horizontally/vertically; corner thickness intentionally varies (approximately14.14px on the45-degree diagonal). Each arc remains tangent to its own adjoining straight segments in the single frame; no triangular transition or independent joint is restored. Continuous frame, its exact contact with the textured crossbar, clipped legacy plate, maker position and10px band are preserved. Header/LCD/silver-panel/panel/crossbar/maker bounding boxes match isolated exact0.2.20; landscape is byte-identical.

The downward extension is bounded by the lowest of native safe-bottom minus2px, maker top minus10px, and start of the40px lower arcs. All36 tested portrait cases can use the full20px. The code reduces the extension when those limits leave less room; it does not shrink keys to force20px.

## ENTER spans both final rows

Normal key sizes are unchanged. Following the clarification, ENTER retains its width and typography, moves16.666667px with the sixth row, and grows by the new3.333333px interval. Its bottom follows the seventh row20px downward. Both endpoints align with their rows within DOM rounding (maximum measured0.015625CSSpx). PREFIX follows the same top displacement. The earlier fixed-height/centred ENTER option is superseded; no unresolved ENTER choice remains.

## Before/after — WebKit402×874, DPR3, bottom reservation0

| Measure |0.2.20|Local candidate|
|---|---:|---:|
|Outer / inner radii|44 /34|40 /40|
|First row top|187.515625|187.515625|
|Last row top|744.375|764.375|
|Normal key height|53.65625|53.65625|
|Last row bottom|798.03125|818.03125|
|Average row pitch|92.809896|96.143229|
|Average clear gap between normal keys|39.153646|42.486979|
|Gap to maker top854|55.96875|35.96875|
|ENTER top|651.5625|668.234375|
|ENTER height|146.46875|149.8125|

DOM rounds CSS coordinates to1/64px, so measured per-interval gains vary by approximately0.016px around3.333333. Every interval is asserted within0.035px. For simulated34px reservation at402×874, last row bottom818.046875 remains21.953125px above the reservation's top840 and35.953125px above the inscription top. At320×450, bottom398.390625 leaves31.609375px to maker and1.609375px above arc start; at320×340 these margins are30.71875px and0.71875px. Both short renders were visually inspected; key rectangles remain above the arcs.

## Validation

-119 engine/display/LCD/Sites tests, TypeScript, build and diff check passed.
-`visual-results.json`:40 Chromium/WebKit cases.36 portraits (402×874 with0/34px simulated safe bottom,375×812,430×932,320×450 and320×340) at DPR1/2/3. Every key width/horizontal position and normal key height/legend font preserved; ENTER grows only by the interval gain and its row endpoints are checked; each of six intervals, row displacement, group arms/text alignment and lower bounds verified. Four landscape captures byte-identical to exact0.2.20.
-`pixel-results.json`:72 lower corners,91 sampled angles each, tangent joins and40/30px radial edges with10px metal thickness within explicit rasterization tolerance.
-`enter-results.json`:four additional Chromium/WebKit normal/short cases verify ENTER width, added-gap height, both endpoint errors and all key/legend fonts against the exact baseline.
-`rotation-results.json`:both engines restore the complete initial key rectangles and20px spread after portrait→landscape→portrait; frame contact,40px inner radius, maker position, copy feedback, menu and2ENTER3+=5 pass.
-`feedback-results.json`:real tap copy in both engines, hold copy/share mocked once, silent cancellation and next-tap feedback. Chromium hold uses trusted input; WebKit hold uses simulated pointers. No clipboard read.
-Chromium402 full portrait and both WebKit402safe34 corners, WebKit320×450 full view and WebKit320×340 corner were inspected. PNGs are ignored local artifacts; screenshot names include width and height to keep short-viewport evidence distinct.

Scripts use source candidate5185 (HMR), exact0.2.20 baseline5186; fresh candidate5188 verifies correct0.2.21 metadata and interactions. Geometry scripts accept PLAYWRIGHT_MODULE; visual.mjs also accepts QA_CASES and QA_OUTPUT for targeted recapture. All40 cases were rerun after the equal40px inner/outer radius correction. Earlier fixed-height results and the initial radius-only run are superseded by the final combined regression.

Physical iPhone/native share sheet were not tested here. Simulated safe bottom is not native env() proof. No engine, persistence, offline/update or share logic changed. Publication explicitly authorized by “Pode fazer e publicar”, with the correction that both radii must be40px. See the publication report for verified commit/CI/deployment/assets. ENTER follows both rows.

Radius normalization reference consulted: https://www.w3.org/TR/css-backgrounds-3/#corner-overlap . Tests require outer/inner widths >=80px and heights >=40px (top radii0), then independently measure each rendered circle at91 angles in Chromium/WebKit.
