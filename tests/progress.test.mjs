import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeProgress,
  recordFlight,
  loadProgress,
  saveProgress,
  purchaseReward,
  isUnlocked,
  SHOP_ITEMS,
  levelInfo,
  xpForLevel,
} from "../src/progress.mjs";
import { contractsFor, flightBonuses } from "../src/flight-rewards.mjs";

test("corrupt or unavailable browser storage falls back to a usable profile", () => {
  const empty = normalizeProgress(null);
  assert.deepEqual(loadProgress({ getItem: () => "{broken" }), empty);
  assert.deepEqual(loadProgress(null), empty);
  assert.equal(
    saveProgress(
      {
        setItem() {
          throw new Error("Storage blocked");
        },
      },
      empty,
    ),
    false,
  );
});

test("legacy recordFlight calls preserve XP behavior", () => {
  const result = recordFlight(normalizeProgress(null), 30, 50, 3);
  assert.equal(result.xpEarned, 142);
  assert.equal(result.progress.flights, 1);
  assert.equal(result.progress.coins, 0);
});

test("completed objectives and combos respect the 50% bonus cap", () => {
  const result = recordFlight(normalizeProgress(null), 30, 50, 3, {
    maxCombo: 3,
    coinsCollected: 4,
    contractSet: 0,
  });
  assert.equal(result.xpEarned, 213);
  assert.equal(result.report.bonusXP, 71);
  assert.equal(result.progress.coins, 4);
  assert.equal(result.progress.totalCoins, 4);
  const short = flightBonuses({
    time: 14,
    avoided: 999,
    nearMiss: 99,
    maxCombo: 99,
  });
  assert.equal(short.bonusXP, 0);
});

test("shop purchases deduct the wallet once and preserve lifetime coins", () => {
  const before = normalizeProgress({
    version: 5,
    xp: xpForLevel(3),
    coins: 200,
    totalCoins: 200,
  });
  const result = purchaseReward(before, "skin", "cobalto");
  assert.equal(result.purchased, true);
  assert.equal(before.coins, 200);
  assert.equal(result.progress.coins, 20);
  assert.equal(result.progress.totalCoins, 200);
  assert.ok(
    isUnlocked(
      SHOP_ITEMS.find((item) => item.id === "cobalto"),
      result.progress,
    ),
  );
  const duplicate = purchaseReward(result.progress, "skin", "cobalto");
  assert.equal(duplicate.reason, "owned");
  assert.equal(duplicate.progress.coins, 20);
});

test("shop refuses unknown items, insufficient funds and level-locked rewards", () => {
  const empty = normalizeProgress(null);
  assert.equal(purchaseReward(empty, "skin", "missing").reason, "unknown");
  assert.equal(purchaseReward(empty, "trail", "copper_dust").reason, "funds");
  assert.equal(
    purchaseReward({ ...empty, coins: 9999 }, "skin", "cobalto").reason,
    "level",
  );
});

test("saved selections and purchased rewards survive a storage round trip", () => {
  let serialized;
  const storage = {
    setItem(_key, value) {
      serialized = value;
    },
    getItem() {
      return serialized;
    },
  };
  const bought = purchaseReward(
    normalizeProgress({ version: 5, coins: 40 }),
    "trail",
    "copper_dust",
  );
  const profile = { ...bought.progress, selectedTrail: "copper_dust" };
  assert.equal(saveProgress(storage, profile), true);
  assert.equal(loadProgress(storage).selectedTrail, "copper_dust");
  assert.equal(loadProgress(storage).coins, 0);
});

test("level 50 clamps XP while flight history remains limited to five runs", () => {
  let profile = normalizeProgress({ version: 5, xp: xpForLevel(50) });
  for (let i = 0; i < 7; i++) {
    const run = recordFlight(profile, 30, 50, 3);
    assert.equal(run.xpEarned, 0);
    profile = run.progress;
  }
  assert.equal(levelInfo(profile).level, 50);
  assert.equal(profile.recentFlights.length, 5);
  assert.equal(profile.recentFlights[0].number, 7);
});

test("invalid numeric values cannot grant currency or an impossible combo", () => {
  const clean = normalizeProgress({ coins: NaN, totalCoins: -2, xp: Infinity });
  assert.equal(clean.coins, 0);
  assert.equal(clean.xp, 0);
  const run = recordFlight(clean, 20, 0, 2, {
    coinsCollected: 10000,
    maxCombo: 999,
  });
  assert.equal(run.progress.coins, 120);
  assert.equal(run.progress.bestCombo, 2);
});

test("flight objectives rotate through the three sets", () => {
  assert.deepEqual(contractsFor(0), contractsFor(3));
  assert.notDeepEqual(contractsFor(0), contractsFor(1));
});
