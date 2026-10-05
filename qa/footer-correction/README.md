# Lower-brackets correction — release0.2.18 over0.2.17

Request: preserve10px brackets/text row, lower inscription to the bottom aligned with before/after, curve both outside and inside. User authorized publication after being told of possible Home-indicator overlap. Release0.2.18 preserves the tested bottom row for physical user review.

## Structure and result

The actual left/right `.maker-strip::before` / `::after` are10px-high grid rail boxes. In0.2.17 their backgrounds are transparent: visible metal is painted by the separate `.portrait-footer-frame`. That frame's `::before` paints the black inner surface, and its `::after` paints the central inscription cutout. This correction changes the visible geometry rather than pretending those transparent boxes alone draw the corners.

The rail boxes and maker row remain10CSSpx. Text row and horizontal metal band both bottom10px; at402×874 they occupy y854–864. With a34px safe-area reservation, text moved30px downward from0.2.17 y824–834. With reservation0, text was already at that row and did not move. Existing font, width, height, stroke and baseline offsets were preserved.

Outer corner32CSSpx / inner corner22CSSpx. Inner inset10px at sides and bottom makes centers concentric:10+22=32 on both axes, so the quarter-circle metal thickness is10px at every angle. Both radii fit their existing drawing boxes and do not shrink through CSS radius scaling. A short taper blends the existing5px vertical side rail into the10px corner stroke before the arc, eliminating a visible step. No increase to the10px maker before/after box heights; full decorative frame retains its existing45px height. A90-degree32px corner necessarily occupies32px vertically; it is impossible to fit that complete arc into a total10px-high painted bounding box without shrinking the radius. Here10px means the explicitly measured horizontal rail/text height and stroke thickness, not a claim that the whole corner is only10px tall.

Central cutout is now10px tall, aligned with the manufacturer rather than extending40px. Header/LCD/key geometry and landscape are unchanged. No pointer interception was added.

## Limitation shown, not silently reinterpreted

At viewport height874 and reserved bottom34px, the reserved region is y840–874. New inscription y854–864 lies entirely within it:10px of its row intersects the reservation, with its bottom24px below the reservation's top. The code deliberately does not lift it back up. This indicates potential Home-indicator/corner obstruction in a real installed iPhone PWA; no hardware pixels or actual indicator placement were tested. A physical readability guarantee is incompatible with forcing this exact lowest row when its safe area is34px. User explicitly approved publication after this limitation was disclosed.

## Evidence

-visual-results.json:10Chromium/WebKit cases,402×874/320×450/874×402/1280×720,0/34px reservation simulation before startup. All keys/LCD and header dimensions equal isolated exact0.2.17 served on5182. Maker font/width/height unchanged; pseudo boxes10; outer32/inner22/insets10; lower texture10. Four landscape full screenshots match0.2.17 byte-for-byte.
-rotation-results.json:2engines passed portrait→landscape→portrait, copy-status positions, restored22px inner radius/10px bottom label, menu and2ENTER3+=5.
-119engine/LCD/display/Sites tests passed; TypeScript and build passed. Core/clipboard logic unchanged.
-ink-results.json: identical visible manufacturer ink before/after. AtDPR3, threshold allRGB>100 gives29physical ink rows (~9.67CSSpx) in both engines, including the short viewport. The nominal calibrated row remains10CSSpx; no font change was made to chase an antialias threshold.
-*-before.png / *-after.png: full before/after screenshots. WebKit402safe34 pair inspected; final tapered after capture inspected. PNGs are ignored local QA artifacts.

Candidate runs on5180; baseline source0.2.17 on5182. Scripts accept PLAYWRIGHT_MODULE.34px is a simulation of the existing reservation variable, not an actual native env()/iPhone test. Publication to main/Pages/original Vercel is authorized; see release publication report for verified state.
