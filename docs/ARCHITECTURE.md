# Architecture

## Runtime

`index.html` loads `src/game.mjs` as a native ES module. Three.js r180 is bundled locally, so gameplay does not require a package registry or CDN. The rocket is reconstructed from `assets/rocket.json`; space backgrounds load on demand.

`game.mjs` coordinates the interface, Three.js scene, keyboard and pointer input, and the modes `loading`, `ready`, `playing`, `paused`, `over`, and `error`. It delegates mechanics to the simulation and progress modules.

## Simulation and rendering

`simulation.mjs` has no DOM or Three.js dependency. A flight contains position, speed, obstacles, coins, ability timers, and a seeded random generator. `stepFlight` mutates that state for an elapsed interval. The same seed and sequence of inputs and time steps produce repeatable results.

The rendering loop uses `requestAnimationFrame`. Elapsed time is capped at 50 ms to limit large jumps after stalls; this is a variable-step simulation, so very slow devices can advance game time more slowly than real time.

Collisions use the distance between an object's swept motion and a capsule representing the rocket. This checks motion across a frame, reducing the chance of fast obstacles passing through the ship without a hit. Cosmetic changes do not change meteor collision sizes.

`world.mjs`, `customization.mjs`, `trails.mjs`, and `flight-view.mjs` handle scenery, materials, particles, camera following, and keeping the flight corridor visually clear.

## Progress and economy

`progress.mjs` normalizes saved data before use, resolves unlock conditions, and records flight results. The storage schema is version 5, under `orbit-01-progress-v1`. Stable reward IDs are preserved from earlier versions, including some Spanish identifiers. Material names in the rocket mesh are also internal selectors. Display names and player-facing text are English.

A completed flight awards base XP from survival time, avoided meteors, and near misses. Flights shorter than 15 seconds award no XP. `flight-rewards.mjs` adds objective and combo bonuses, capped at 50% of base XP. Level 50 caps total XP.

Collected coins enter the wallet when a flight ends. Purchases check item identity, ownership, level, and balance; they spend wallet coins without reducing lifetime earnings. `game.mjs` prevents the same flight from being finalized twice.

Progress and audio preferences use `localStorage`. If storage access fails, gameplay continues with in-memory progress for the session. Local saves are user-editable and are not intended as a trusted leaderboard.

## Audio

`music.mjs` synthesizes Orbital Drift through oscillators, envelopes, stereo panning, filtering, and delay. The soundtrack starts after an explicit interaction, reduces volume outside active play, and suspends when the document is hidden. It does not fetch audio recordings.

## Tradeoffs and possible next steps

- Static hosting keeps setup simple; accounts, cloud saves, and leaderboards are outside the current scope.
- Bundled backgrounds prioritize visual variety but account for most of the repository size. Compressed image variants would reduce downloads and texture memory.
- Keyboard and on-screen controls share the same input state. Broader testing on physical phones and different GPUs would help tune touch ergonomics and rendering cost.
- The main game module still owns several responsibilities. Separating hangar rendering and input into dedicated modules would be a useful future refactor.
- The tests focus on mechanics and persistence. Browser automation and audio-specific tests could extend coverage.
