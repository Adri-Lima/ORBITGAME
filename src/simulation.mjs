export const BOUNDS = { x: 7.5, y: 4.8 };
export function randomGenerator(seed = 3197) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
const clamp = (n, limit) => Math.max(-limit, Math.min(limit, n));
export function createFlight(seed = 3197, ability = "none") {
  const state = {
    projectiles: [],
    laserHits: [],
    nextShotId: 1,
    laserAmmo: ability === "laser" ? 2 : 0,
    laserDelay: 0,
    destroyed: 0,
    ability,
    abilityTime: 0,
    cooldown: 0,
    shield: ability === "shield" ? 1 : 0,
    shieldCooldown: 0,
    powerFlash: 0,
    powerEffects: [],
    nearMiss: 0,
    nearMissFlash: 0,
    combo: 0,
    comboTime: 0,
    maxCombo: 0,
    contractSet: 0,
    waveCount: 0,
    encounter: null,
    invulnerable: 0,
    shieldFlash: 0,
    time: 0,
    distance: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 48,
    asteroids: [],
    nextId: 1,
    spawnIn: 0.15,
    waveIn: 4.5,
    waveAlert: 0,
    zoneX: 0,
    zoneY: 0,
    zoneAge: 0,
    pressure: 0,
    hunterIn: 1.15,
    crashed: false,
    avoided: 0,
    random: randomGenerator(seed),
  };
  for (let i = 0; i < 28; i++)
    addAsteroid(state, {
      z: -115 - i * 4,
      x: (i % 2 ? 1 : -1) * (2.5 + state.random() * 5),
      y: (state.random() - 0.5) * 9.6,
    });
  Object.assign(state, {
    coins: [],
    nextCoinId: 1,
    coinSpawnIn: 1.2,
    coinsCollected: 0,
    coinFlash: 0,
  });
  return state;
}
export function spawnCoins(s) {
  const z = -Math.max(115, s.speed * 2.6);
  let x = 0,
    y = 0,
    best = -Infinity;
  // Coins offer optional detours. Choose a clear spawn point, never a hidden rock.
  for (let i = 0; i < 10; i++) {
    const cx = (s.random() - 0.5) * 12,
      cy = (s.random() - 0.5) * 7;
    const clearance = Math.min(
      ...s.asteroids.flatMap((a) =>
        [0, 1, 2].map(
          (j) =>
            Math.hypot(a.x - cx - (j - 1) * 0.32, a.y - cy, a.z - z + j * 3.5) -
            a.radius,
        ),
      ),
    );
    if (clearance > best) {
      best = clearance;
      x = cx;
      y = cy;
    }
  }
  if (best < 1.5) {
    s.coinSpawnIn = 0.6;
    return;
  }
  for (let i = 0; i < 3; i++) {
    const id = s.nextCoinId++;
    s.coins.push({
      id,
      x: x + (i - 1) * 0.32,
      y,
      z: z - i * 3.5,
      value: id % 17 === 0 ? 5 : 1,
    });
  }
  s.coinSpawnIn = 2.8 + s.random() * 0.8;
}
export function addAsteroid(s, override = {}) {
  const targeted = s.random() < 0.55;
  const a = {
    id: s.nextId++,
    x: targeted
      ? clamp(s.x + (s.random() - 0.5) * 7.2, BOUNDS.x)
      : (s.random() - 0.5) * 15,
    y: targeted
      ? clamp(s.y + (s.random() - 0.5) * 6.2, BOUNDS.y)
      : (s.random() - 0.5) * 9.6,
    z: -Math.max(115, s.speed * 2.3),
    radius: 0.57 + s.random() * 0.82,
    spin: s.random() * 2 - 1,
    variant: Math.floor(s.random() * 4),
    kind: "field",
    ...override,
  };
  s.asteroids.push(a);
  return a;
}
function launchWave(s) {
  s.waveCount++;
  if (s.waveCount % 3 === 0) {
    launchEncounter(s);
    return;
  }
  // A visible front with an open passage. Arrival stays >3 seconds away.
  const gapX = (s.random() - 0.5) * 10,
    gapY = (s.random() - 0.5) * 5.8;
  const depth = -Math.max(162, s.speed * 3.25);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 6; col++) {
      const x = -7.5 + col * 3,
        y = -4.8 + row * 3.2;
      if (Math.hypot(x - gapX, y - gapY) < 3.05) continue;
      addAsteroid(s, {
        x,
        y,
        z: depth - (row % 2) * 4,
        radius: 0.94 + s.random() * 0.13,
        kind: "wave",
      });
    }
  s.waveIn = Math.max(3.1, 5.2 - s.time * 0.022);
  s.waveAlert = 3.7;
}
export const ENCOUNTERS = [
  {
    id: "channel",
    name: "Rock Corridor",
    hint: "Find the vertical passage",
    color: "#78e0d0",
  },
  {
    id: "belt",
    name: "Split Belt",
    hint: "Find the horizontal passage",
    color: "#f8c184",
  },
  {
    id: "diagonal",
    name: "Diagonal Fracture",
    hint: "The gap runs diagonally across the wave",
    color: "#c6a0ff",
  },
];
export function launchEncounter(s) {
  const kind =
    ENCOUNTERS[
      (Math.max(1, Math.floor(s.waveCount / 3)) - 1) % ENCOUNTERS.length
    ];
  const gapX = (s.random() - 0.5) * 5,
    gapY = (s.random() - 0.5) * 2;
  const depth = -(s.speed * 3.4 + 6),
    ids = [];
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 7; col++) {
      const x = -7.5 + col * 2.5,
        y = -4.8 + row * 2.4;
      const gap =
        kind.id === "channel"
          ? Math.abs(x - gapX)
          : kind.id === "belt"
            ? Math.abs(y - gapY)
            : Math.abs(x - gapX - y * 0.65) / Math.hypot(1, 0.65);
      if (gap < 2.15) continue;
      ids.push(
        addAsteroid(s, {
          x,
          y,
          z: depth - (row % 2) * 3,
          radius: 0.83 + s.random() * 0.12,
          kind: "encounter",
        }).id,
      );
    }
  s.encounter = { ...kind, ids, gapX, gapY, time: 0 };
  s.waveIn = Math.max(3.4, 5.2 - s.time * 0.022);
  s.waveAlert = 4;
}
function pressureShots(s) {
  // Fixed trajectories, never homing: leaving the area is a valid dodge.
  const z = -Math.max(88, s.speed * 1.85);
  addAsteroid(s, { x: s.x, y: s.y, z, radius: 0.83, kind: "pressure" });
  addAsteroid(s, {
    x: clamp(s.x + (s.x > 0 ? -1.6 : 1.6), BOUNDS.x),
    y: s.y,
    z: z - 8,
    radius: 0.72,
    kind: "pressure",
  });
  addAsteroid(s, {
    x: s.x,
    y: clamp(s.y + (s.y > 0 ? -1.6 : 1.6), BOUNDS.y),
    z: z - 16,
    radius: 0.72,
    kind: "pressure",
  });
  s.hunterIn = 0.72;
}
export function activateAbility(s) {
  if (s.crashed || s.cooldown > 0) return false;
  if (s.ability === "laser") {
    if (s.laserAmmo <= 0 || s.laserDelay > 0) return false;
    s.projectiles.push({ id: s.nextShotId++, x: s.x, y: s.y, z: -2 });
    s.laserAmmo--;
    s.laserDelay = 0.25;
    if (s.laserAmmo === 0) s.cooldown = 14;
    return true;
  }
  if (s.ability === "slow") {
    s.abilityTime = 10;
    s.cooldown = 24;
    return true;
  }
  if (s.ability === "dash") {
    s.abilityTime = 1.2;
    s.cooldown = 14;
    return true;
  }
  if (s.ability === "focus") {
    s.abilityTime = 4;
    s.cooldown = 28;
    return true;
  }
  if (["pulse", "repulsor", "nova"].includes(s.ability)) {
    const reach =
      s.ability === "nova" ? 75 : s.ability === "repulsor" ? 50 : 32;
    const targets = s.asteroids
      .filter(
        (a) =>
          !a.destroyed &&
          (s.ability === "nova" || a.z <= 8) &&
          Math.hypot(a.x - s.x, a.y - s.y, a.z) < reach &&
          (s.ability !== "pulse" || Math.hypot(a.x - s.x, a.y - s.y) < 5),
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - s.x, a.y - s.y, a.z) -
          Math.hypot(b.x - s.x, b.y - s.y, b.z),
      );
    const limit =
      s.ability === "nova" ? targets.length : s.ability === "repulsor" ? 8 : 3;
    for (const a of targets.slice(0, limit)) {
      if (s.ability === "repulsor") {
        let dx = a.x - s.x,
          dy = a.y - s.y;
        const length = Math.hypot(dx, dy);
        if (length < 0.1) {
          dx = s.x > 0 ? -1 : 1;
          dy = 0.3;
        }
        const divisor = Math.hypot(dx, dy);
        a.deflectX = (dx / divisor) * 4;
        a.deflectY = (dy / divisor) * 4;
        a.deflectTime = 1.1;
      } else {
        a.destroyed = true;
        s.destroyed++;
        s.powerEffects.push({ id: a.id, x: a.x, y: a.y, z: a.z, time: s.time });
      }
    }
    s.asteroids = s.asteroids.filter((a) => !a.destroyed);
    s.powerFlash = s.ability === "nova" ? 1.5 : 0.8;
    s.cooldown =
      s.ability === "nova" ? 180 : s.ability === "repulsor" ? 26 : 30;
    return true;
  }
  return false;
}
// Distance of a relative motion segment to the ship's axial capsule.
export function sweptHullDistance(a, fromX, fromY, toX, toY, half = 1.4) {
  const x0 = (a.previousX ?? a.x) - fromX,
    y0 = (a.previousY ?? a.y) - fromY,
    z0 = a.previousZ ?? a.z;
  const dx = a.x - toX - x0,
    dy = a.y - toY - y0,
    dz = a.z - z0;
  const cuts = [0, 1];
  if (dz) {
    for (const z of [-half, half]) {
      const t = (z - z0) / dz;
      if (t > 0 && t < 1) cuts.push(t);
    }
  }
  cuts.sort((a, b) => a - b);
  let best = Infinity;
  for (let i = 0; i < cuts.length - 1; i++) {
    const lo = cuts[i],
      hi = cuts[i + 1],
      middle = z0 + (dz * (lo + hi)) / 2,
      side = middle > half ? 1 : middle < -half ? -1 : 0;
    const vz = side ? dz : 0,
      pz = side ? z0 - side * half : 0,
      den = dx * dx + dy * dy + vz * vz;
    const t = den
      ? Math.max(lo, Math.min(hi, -(x0 * dx + y0 * dy + pz * vz) / den))
      : lo;
    best = Math.min(
      best,
      (x0 + dx * t) ** 2 + (y0 + dy * t) ** 2 + (pz + vz * t) ** 2,
    );
  }
  return Math.sqrt(best);
}
export function stepFlight(s, dt, input = {}) {
  if (s.crashed || dt <= 0) return;
  dt = Math.min(dt, 0.05);
  const worldDt = dt * (s.ability === "slow" && s.abilityTime > 0 ? 0.48 : 1);
  const previousCooldown = s.cooldown;
  const fromX = s.x,
    fromY = s.y;
  s.abilityTime = Math.max(0, s.abilityTime - dt);
  s.cooldown = Math.max(0, s.cooldown - dt);
  s.invulnerable = Math.max(0, s.invulnerable - dt);
  s.shieldFlash = Math.max(0, s.shieldFlash - dt);
  s.powerFlash = Math.max(0, s.powerFlash - dt);
  s.nearMissFlash = Math.max(0, s.nearMissFlash - dt);
  s.powerEffects = s.powerEffects.filter(
    (effect) => s.time - effect.time < 1.3,
  );
  s.comboTime = Math.max(0, s.comboTime - dt);
  if (!s.comboTime) s.combo = 0;
  s.coinFlash = Math.max(0, s.coinFlash - dt);
  s.coinSpawnIn -= worldDt;
  if (s.coinSpawnIn <= 0) spawnCoins(s);
  if (s.encounter) {
    s.encounter.time += worldDt;
    if (
      s.encounter.time > 1 &&
      !s.asteroids.some((a) => s.encounter.ids.includes(a.id) && !a.destroyed)
    )
      s.encounter = null;
  }
  if (s.ability === "shield" && s.shield === 0) {
    s.shieldCooldown = Math.max(0, s.shieldCooldown - dt);
    if (s.shieldCooldown === 0) {
      s.shield = 1;
      s.shieldFlash = 0.6;
    }
  }
  s.laserDelay = Math.max(0, s.laserDelay - dt);
  if (
    s.ability === "laser" &&
    s.laserAmmo === 0 &&
    previousCooldown > 0 &&
    s.cooldown === 0
  )
    s.laserAmmo = 2;
  s.laserHits = s.laserHits.filter((hit) => s.time - hit.time < 0.45);
  let ix = Number(!!input.right) - Number(!!input.left),
    iy = Number(!!input.up) - Number(!!input.down);
  const magnitude = Math.hypot(ix, iy);
  if (magnitude > 1) {
    ix /= magnitude;
    iy /= magnitude;
  }
  const mix = 1 - Math.exp(-12 * dt),
    agility =
      s.ability === "agility"
        ? 1.12
        : s.ability === "dash" && s.abilityTime > 0
          ? 1.8
          : 1;
  s.vx += (ix * 9.2 * agility - s.vx) * mix;
  s.vy += (iy * 8.2 * agility - s.vy) * mix;
  s.x = clamp(s.x + s.vx * dt, BOUNDS.x);
  s.y = clamp(s.y + s.vy * dt, BOUNDS.y);
  s.time += dt;
  s.speed = 48 + Math.min(42, s.time * 0.48);
  s.distance += s.speed * worldDt;
  s.spawnIn -= worldDt;
  s.waveIn -= worldDt;
  s.waveAlert = Math.max(0, s.waveAlert - worldDt);
  if (Math.hypot(s.x - s.zoneX, s.y - s.zoneY) > 2.1) {
    s.zoneX = s.x;
    s.zoneY = s.y;
    s.zoneAge = 0;
    s.hunterIn = 1.15;
  } else {
    s.zoneAge += dt;
    s.hunterIn -= dt;
  }
  s.pressure = Math.min(1, s.zoneAge / 1.15);
  if (s.hunterIn <= 0 && s.zoneAge >= 1.1) pressureShots(s);
  if (s.spawnIn <= 0) {
    addAsteroid(s);
    s.spawnIn = Math.max(0.105, 0.165 - s.time * 0.001);
  }
  if (s.waveIn <= 0) launchWave(s);
  for (const a of s.asteroids) {
    a.previousZ = a.z;
    a.previousX = a.x;
    a.previousY = a.y;
    a.z += s.speed * worldDt;
    if (a.deflectTime > 0) {
      const move = Math.min(dt, a.deflectTime);
      a.x += a.deflectX * move;
      a.y += a.deflectY * move;
      a.deflectTime -= move;
    }
  }
  for (const shot of s.projectiles) {
    const previousZ = shot.z;
    shot.z -= 185 * dt;
    let target = null,
      firstTime = 2;
    for (const asteroid of s.asteroids) {
      if (asteroid.destroyed) continue;
      const radius = asteroid.radius * 0.86 + 0.13;
      const radial = (asteroid.x - shot.x) ** 2 + (asteroid.y - shot.y) ** 2;
      if (radial > radius * radius) continue;
      const reach = Math.sqrt(radius * radius - radial);
      const before = asteroid.previousZ - previousZ,
        after = asteroid.z - shot.z;
      let t = 2;
      if (before >= -reach && before <= reach) t = 0;
      else if (before < -reach && after >= -reach)
        t = (-reach - before) / (after - before);
      if (t >= 0 && t <= 1 && t < firstTime) {
        firstTime = t;
        target = asteroid;
      }
    }
    if (target) {
      target.destroyed = true;
      shot.dead = true;
      s.destroyed++;
      s.laserHits.push({
        id: shot.id,
        x: target.x,
        y: target.y,
        z: target.z,
        time: s.time,
      });
    }
  }
  s.projectiles = s.projectiles.filter((shot) => !shot.dead && shot.z > -170);
  for (const a of s.asteroids) {
    if (a.destroyed) continue;
    const small = s.ability === "focus" && s.abilityTime > 0 ? 0.7 : 1;
    const hitRadius = a.radius * 0.86 + 0.53 * small,
      distance = sweptHullDistance(a, fromX, fromY, s.x, s.y, 1.4 * small);
    if (distance < hitRadius) {
      if (s.invulnerable > 0) continue;
      if (s.shield > 0) {
        s.shield = 0;
        s.shieldCooldown = 60;
        s.invulnerable = 1.1;
        s.shieldFlash = 0.7;
        s.combo = 0;
        s.comboTime = 0;
        a.destroyed = true;
        continue;
      }
      s.crashed = true;
      s.hit = { x: a.x, y: a.y, z: a.z };
      break;
    }
    if (!a.nearChecked && a.previousZ <= 1.4 && a.z > 1.4) {
      a.nearChecked = true;
      if (s.invulnerable === 0 && distance < hitRadius + 0.6) {
        s.nearMiss++;
        s.nearMissFlash = 1;
        s.combo++;
        s.maxCombo = Math.max(s.maxCombo, s.combo);
        s.comboTime = 8;
      }
    }
  }
  s.asteroids = s.asteroids.filter((a) => {
    if (a.destroyed) return false;
    if (a.z > 20) {
      s.avoided++;
      return false;
    }
    return true;
  });
  for (const coin of s.coins) {
    coin.previousZ = coin.z;
    coin.z += s.speed * worldDt;
    if (
      !s.crashed &&
      sweptHullDistance(coin, fromX, fromY, s.x, s.y, 0.95) < 0.82
    ) {
      coin.collected = true;
      s.coinsCollected += coin.value;
      s.coinFlash = 0.7;
    }
  }
  s.coins = s.coins.filter((coin) => !coin.collected && coin.z < 20);
}
export function timeLabel(seconds) {
  return (
    String(Math.floor(seconds / 60)).padStart(2, "0") +
    ":" +
    String(Math.floor(seconds % 60)).padStart(2, "0")
  );
}
