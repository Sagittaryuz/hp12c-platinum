# Portrait lower curve32px / textured base10px —0.2.17

User approved testing32px and explicitly authorized publication with portrait-only header alignment. The earlier JPEG failed both supported materialization attempts and was never viewed. Design is from the code and the approved proposal, not a claimed reproduction of that photo or measured iPhone corner radius.

Implementation: a decorative absolute `.portrait-footer-frame` extends the silver drawing below the original keyboard plate, with bottom-left/right radius32CSSpx and its bottom10px above the viewport. Existing5px side rails,10px bottom metal nominal band and intrinsic HEWLETT PACKARD cutout are retained. The lower bridge is replaced visually in portrait. Its geometry is independent of useJoinedFrame/key positioning; no key-layout algorithm was changed. Portrait header alignment uses measured LCD inner edges; landscape remains unchanged.

The manufacturer retains its calibrated typeface/width/height/stroke. Its lower offset is max(10px, existing portrait safe-area reservation +6px). With a34px content reservation it sits40px above the bottom; the metal/cutout extends beneath it so the actual textured bottom remains10px. Decorative drawing does not intercept pointers. No automatic physical corner-radius detection, and no OS Home-indicator behavior claim.

Validation:
-119engine/LCD/display/Sites checks, TypeScript/build passed.
-visual-results.json:10checks across Chromium/WebKit, portrait402×874/320×450 and landscape874×402/1280×720, with0/34px safe-area simulation. All key/LCD geometry matches isolated exact0.2.16; typeface/width/height match;32px radius/10px texture/protected inscription/zero key overlap verified. Four landscape raster screenshots match0.2.16 byte for byte.
-The34px simulation sets the existing --portrait-safe-bottom variable before app startup. It exercises the content reservation, not an actual iPhone native env value or OS indicator.
-Header:12geometry/rotation checks; interactions:30browserchecks for copy/hold/cancel/drag/multitouch/keyboard/pending-share/fallback/calculation/state. Silent-share0.2.16 behavior preserved.
-Platform: real clipboard writes with no read in Chromium/WebKit; trusted Chromium CDP hold preserves activation and invokes copy/share once; cached offline reload/state/copy in Chromium and WebKit local server rejecting connections.
-Chromium portrait safe0 and WebKit portrait safe34 captures were visually inspected. PNGs are ignored local QA artifacts.

Candidate server5180, unchanged0.2.16 server5181. Scripts accept PLAYWRIGHT_MODULE. Actual iPhone/PWA/native sharing sheet were not physically tested;32px is a trial to assess on device.
