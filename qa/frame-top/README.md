# Local frame-top correction over production0.2.19

Local correction completed and subsequently authorized for publication as0.2.20. Base main/origin `7115fe12ccb209002e07821f7f2af6a08deef63f`, version0.2.19. Release changes only metadata/documentation beyond the tested correction.

## Cause and correction

The approved keyboard expansion moves the textured middle crossbar and keyboard panel upward by up to20CSSpx, with a clamp based on LCD clearance. The new continuous portrait frame used an earlier `--joined-top -25px` coordinate and missed that expansion. The upper `.silver-panel` still painted down to `--joined-top`; its exposed tail between the real crossbar and delayed frame appeared as the thinner silver rectangle/line crossing the first red legends. The old `.keyboard-frame` was already hidden in portrait; no duplicate pseudo outline or border was found there.

The layout hook now measures the actual crossbar after all existing expansion/clamping and supplies its top/bottom as decorative CSS variables. The continuous frame begins at that measured bottom. The legacy upper silver-panel paint is clipped at the measured crossbar top, without changing its box or children. The old portrait keyboard-frame remains disabled. Its black layout panel and keyboard measurements are retained; they no longer expose a silver tail. Landscape removes the decorative variables and preserves its existing styles.

At402×874 the new frame starts at155.640625CSSpx, exactly the crossbar bottom; it previously started at175.640625. Tested cases remove20px of the delayed segment. The code follows the actual bounded expansion instead of hardcoding20px, so the contact remains exact if a compact viewport permits less. Outer44 / inner34 / side and lower thickness10px,1px top metal member,10px bottom plastic and maker row are retained. All key, LCD, header, keyboard-panel, crossbar, silver-panel layout box and maker/lettering rectangles equal isolated exact0.2.19. No calculator state, engine, offline/update or clipboard logic changed.

## Evidence

-119 engine/display/LCD/Sites tests, TypeScript, build and diff check passed.
-`visual-results.json`:34 Chromium/WebKit cases;30 portraits covering402×874 with0/34px simulated bottom reservation,375×812,430×932 and320×450 at DPR1/2/3. Frame top equals actual crossbar bottom. Four landscape screenshots byte-identical to0.2.19.
-`top-pixel-results.json`:30 cases verify both top sides change directly from textured plastic to the single metal frame, dark interior below it, and the prior horizontal line in actual baseline pixels becomes dark in candidate pixels. The old exposed tail is absent.
-`pixel-results.json`:60 lower corners remain continuous over91 angles, with44/34px edges and10px thickness within rasterization tolerance.
-`rotation-results.json`:both engines restore exact crossbar/frame contact after portrait→landscape→portrait, retain copy feedback/menu and2ENTER3+=5.
-`feedback-results.json`:real tap copy passes in both engines; hold copy/share mocked once, cancellation silent, next tap restores feedback. Chromium hold uses trusted input; WebKit hold uses simulated pointers. No clipboard read.
-Top captures viewed in Chromium402DPR2, WebKit402safe34DPR3 and WebKit320DPR1; both lower corners viewed in WebKit402safe34DPR3. New top has no second silver line at the red legends. PNGs are ignored local evidence.

Geometry tests used candidate5180 (source changes via HMR), baseline exact0.2.19 on5184. A fresh candidate server5185 was opened for version0.2.19/menu/interaction verification because the older long-lived dev server retained its initial0.2.14 build metadata. Production build correctly uses0.2.19. No test claim relies on the stale dev metadata.

## Reference and limits

New JPEG libfile_6714c302fdf08191b7470806699664b2 failed both supported materialization attempts in this executor; its pixels were not seen here. Parent's independent reader inspected706×1536 pixels and described the textured crossbar around y355–371, thin rectangle y373–408 and line at the red legends. This description guided inspection; those photo coordinates were not treated as CSS measurements. Local before/after renderings establish the defect and correction.

Physical installed iPhone PWA and native share sheet have not been tested by this executor. Prior accepted Home-indicator risk at the bottom maker row is unchanged. Implementation is ready for review; publication explicitly authorized by the user: “Pode publicar”.
