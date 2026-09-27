const finite = (n) => (Number.isFinite(n) ? Math.max(0, n) : 0);
export const CONTRACT_SETS = [
  [
    {
      id: "steady",
      name: "Warm Up the Engines",
      metric: "time",
      target: 20,
      xp: 20,
      unit: "s of flight",
    },
    {
      id: "clear",
      name: "Clear Route",
      metric: "avoided",
      target: 50,
      xp: 25,
      unit: "meteors dodged",
    },
    {
      id: "cool",
      name: "Cool Under Pressure",
      metric: "nearMiss",
      target: 3,
      xp: 40,
      unit: "near misses",
    },
  ],
  [
    {
      id: "cruise",
      name: "Cruising Speed",
      metric: "time",
      target: 35,
      xp: 30,
      unit: "s of flight",
    },
    {
      id: "weave",
      name: "Between the Rocks",
      metric: "avoided",
      target: 100,
      xp: 35,
      unit: "meteors dodged",
    },
    {
      id: "chain",
      name: "Steady Hands",
      metric: "maxCombo",
      target: 3,
      xp: 50,
      unit: "near misses in one streak",
    },
  ],
  [
    {
      id: "frontier",
      name: "Cross the Frontier",
      metric: "time",
      target: 50,
      xp: 40,
      unit: "s of flight",
    },
    {
      id: "pilot",
      name: "Precision Pilot",
      metric: "avoided",
      target: 150,
      xp: 45,
      unit: "meteors dodged",
    },
    {
      id: "edge",
      name: "Live on the Edge",
      metric: "nearMiss",
      target: 5,
      xp: 60,
      unit: "near misses",
    },
  ],
];
export function contractsFor(index = 0) {
  return CONTRACT_SETS[Math.floor(finite(index)) % CONTRACT_SETS.length];
}
export function flightBonuses(stats = {}, index = 0) {
  const time = finite(stats.time),
    nearMiss = Math.floor(finite(stats.nearMiss)),
    maxCombo = Math.min(nearMiss, Math.floor(finite(stats.maxCombo)));
  const safe = {
    time,
    avoided: Math.floor(finite(stats.avoided)),
    nearMiss,
    maxCombo,
  };
  const objectives = contractsFor(index).map((item) => ({
    ...item,
    current: Math.min(item.target, Math.floor(safe[item.metric])),
    done: safe[item.metric] >= item.target,
  }));
  const baseXP =
    time < 15 ? 0 : Math.floor(time * 2 + safe.avoided * 0.75 + nearMiss * 15);
  const comboXP = time < 15 ? 0 : Math.min(60, Math.max(0, maxCombo - 1) * 5);
  const objectiveXP =
    time < 15
      ? 0
      : objectives
          .filter((item) => item.done)
          .reduce((sum, item) => sum + item.xp, 0);
  const bonusXP = Math.min(Math.floor(baseXP * 0.5), comboXP + objectiveXP);
  return { objectives, comboXP, objectiveXP, bonusXP, maxCombo };
}
export function flightGrade(time = 0, nearMiss = 0, maxCombo = 0) {
  const score =
    finite(time) +
    Math.min(45, finite(nearMiss) * 3) +
    Math.min(20, finite(maxCombo) * 2);
  return score >= 140
    ? "S"
    : score >= 90
      ? "A"
      : score >= 50
        ? "B"
        : score >= 20
          ? "C"
          : "D";
}
