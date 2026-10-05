# Copy confirmation in header — release 0.2.15 over 0.2.14

Success confirmation is centered horizontally in the actual gap between the complete `.model-name` rectangle and `.brand`, and vertically in their combined header bounds. In landscape the combined success/warning live region uses the lower safe-area case band, below LCD and all interactive controls. Fixed, intrinsically sized, non-interactive overlay: it does not change title/logo/LCD/key geometry. Compact headers reduce vertical padding while retaining 12px readable text. ResizeObserver and window/visualViewport events keep it centered after viewport/orientation changes. Existing status live region and four-second lifetime remain. Copy failures and sharing warnings retain their separate feedback; successful copy has no duplicate bottom toast.

Evidence:
- `visual-results.json`: Chromium/WebKit, 402×874, 320×450, 874×402, 1280×720, 667×375, live rotation; portrait center error under 0.1px; landscape bottom position and zero control/LCD overlap, no title/logo collision, accessible polite status, no success bottom toast, HP menu still clickable.
- `regression-results.json`: 30 browser checks passed, including six exact screenshot/geometry comparisons against unchanged 0.2.14, copy/hold/cancel/keyboard/manual fallback/menu/calculation/persistence.
- 119 existing unit checks passed; TypeScript and production build passed.
- PNG screenshots are local ignored QA artifacts. Portrait 402 and WebKit landscape 874 screenshots visually inspected.

Portrait confirmation remains entirely above the LCD. Landscape confirmation is in the lower case band. Repeated taps renew the four-second timeout; rotation repositions existing feedback both ways; sharing errors and copy failures were tested. Actual iPhone safe-area/PWA and native sharing sheet were not physically tested.

Run local candidate at port5180 and unchanged 0.2.14 at port5173. Scripts accept PLAYWRIGHT_MODULE (default playwright). Regression script also accepts CHROMIUM_EXECUTABLE. Publication to main/Pages and the original Vercel project was authorized at12:05UTC. No clipboard reads. Release version0.2.15.
