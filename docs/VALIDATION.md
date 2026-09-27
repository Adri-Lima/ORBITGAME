# Validation

Verified on September 26, 2026, with Node.js 24.15.0 and headless Google Chrome on macOS.

## Automated checks

- `npm run check`: passed for 10 game modules, 90 unique HTML IDs, relative imports, and referenced game assets.
- `npm test`: all 16 regression tests passed.
- All 20 original assets and the three vendored library/license files are unchanged byte for byte.

## Browser checks

- The desktop start screen and local assets loaded successfully.
- All seven hangar tabs displayed English content.
- A locked environment could be previewed and the preview closed.
- Flight launch, keyboard input, pause, and resume worked.
- A collision produced an English flight report; the completed flight persisted after reload.
- A cosmetic purchase deducted coins once, could be equipped, and remained equipped after reload.
- At a simulated 390 × 844 touch viewport, the page had no horizontal overflow and the game launched with visible touch controls.
- No page errors or failed HTTP responses occurred in the browser checks.

`preview.png` is a screenshot of the tested English game, not a mockup.

## Limits of this verification

These checks used local HTTP hosting. A live GitHub Pages deployment has not been performed. The mobile check used browser emulation, not a physical device. Headless Chrome muted audio, so audible music output was not independently verified. Cross-browser and long-session performance testing remain future work.
