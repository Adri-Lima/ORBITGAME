import test from "node:test";
import assert from "node:assert/strict";
import {
  createFlight,
  stepFlight,
  activateAbility,
  sweptHullDistance,
  BOUNDS,
} from "../src/simulation.mjs";

test("identical seeds and inputs produce identical flight states", () => {
  const a = createFlight(42),
    b = createFlight(42);
  for (let i = 0; i < 120; i++) {
    const input = { right: i < 60, up: i >= 60 };
    stepFlight(a, 1 / 60, input);
    stepFlight(b, 1 / 60, input);
  }
  const snapshot = (state) => JSON.parse(JSON.stringify(state));
  assert.deepEqual(snapshot(a), snapshot(b));
});

test("movement remains inside the flight corridor", () => {
  const flight = createFlight(1);
  flight.invulnerable = 100;
  for (let i = 0; i < 300; i++)
    stepFlight(flight, 1 / 60, { right: true, up: true });
  assert.equal(flight.x, BOUNDS.x);
  assert.equal(flight.y, BOUNDS.y);
});

test("swept collision detects a meteor crossing the entire hull in one frame", () => {
  assert.equal(
    sweptHullDistance({ x: 0, y: 0, previousZ: -5, z: 5 }, 0, 0, 0, 0),
    0,
  );
  assert.ok(
    sweptHullDistance({ x: 10, y: 0, previousZ: -5, z: 5 }, 0, 0, 0, 0) > 9,
  );
});

test("long frames are capped and crashed flights stop advancing", () => {
  const flight = createFlight();
  stepFlight(flight, 0);
  assert.equal(flight.time, 0);
  stepFlight(flight, 1);
  assert.equal(flight.time, 0.05);
  flight.crashed = true;
  stepFlight(flight, 0.05);
  assert.equal(flight.time, 0.05);
});

test("laser charges enforce the shot delay and depleted-ammo cooldown", () => {
  const flight = createFlight(1, "laser");
  assert.equal(activateAbility(flight), true);
  assert.equal(activateAbility(flight), false);
  for (let i = 0; i < 6; i++) stepFlight(flight, 0.05);
  assert.equal(activateAbility(flight), true);
  assert.equal(flight.laserAmmo, 0);
  assert.equal(flight.cooldown, 14);
  assert.equal(activateAbility(flight), false);
});

test("a shield absorbs one collision and starts its recharge", () => {
  const flight = createFlight(1, "shield");
  flight.asteroids = [{ id: 1, x: 0, y: 0, z: -2, radius: 1 }];
  stepFlight(flight, 0.05);
  assert.equal(flight.crashed, false);
  assert.equal(flight.shield, 0);
  assert.equal(flight.shieldCooldown, 60);
  assert.ok(flight.invulnerable > 0);
});

test("coins crossing the ship are collected exactly once", () => {
  const flight = createFlight(1);
  flight.asteroids = [];
  flight.coins = [{ id: 1, x: 0, y: 0, z: -2, value: 5 }];
  stepFlight(flight, 0.05);
  assert.equal(flight.coinsCollected, 5);
  stepFlight(flight, 0.05);
  assert.equal(flight.coinsCollected, 5);
});
