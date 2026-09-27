export const STORAGE_KEY = "orbit-01-progress-v1";
import {
  reward,
  ENVIRONMENTS,
  METEORS,
  LEVEL_REWARDS,
  levelInfo,
  xpForLevel,
} from "./expedition.mjs";
import { flightBonuses, flightGrade } from "./flight-rewards.mjs";
export { ENVIRONMENTS, METEORS, LEVEL_REWARDS, levelInfo, xpForLevel };
export const SKINS = [
  reward("skin", 0, {
    id: "original",
    name: "Original",
    hull: "#dfd7be",
    accent: "#e87643",
    trim: "#b39861",
    glass: "#27bdd7",
    flame: "#35dcff",
    description: "Ivory ceramic and orange fins. Your starting point.",
  }),
  reward("skin", 1, {
    id: "aurora",
    name: "Aurora",
    hull: "#d2f5eb",
    accent: "#1bd6c4",
    trim: "#81cedc",
    glass: "#85eeff",
    flame: "#44ffbb",
    rules: [["flights15", 1]],
    description: "Mint enamel, clean lines, and a satin finish.",
  }),
  reward("skin", 1, {
    id: "cometa",
    name: "Comet",
    hull: "#e0d4c4",
    accent: "#c97c62",
    trim: "#aa8d77",
    glass: "#97cdd8",
    flame: "#f8ba82",
    rules: [
      ["flights15", 3],
      ["totalAvoided", 120],
    ],
    description: "Sand-colored ceramic and terracotta. A refined design.",
  }),
  reward("skin", 2, {
    id: "solar",
    name: "Solar",
    hull: "#fff2cc",
    accent: "#f4bd3f",
    trim: "#9c6e38",
    glass: "#fa9c40",
    flame: "#ffbb45",
    rules: [["flights30", 3]],
    description: "Golden solar panels and bronze engine bands.",
  }),
  reward("skin", 2, {
    id: "polar",
    name: "Polar",
    hull: "#dcebf7",
    accent: "#538aac",
    trim: "#c4d8e9",
    glass: "#9df4ff",
    flame: "#8cdfff",
    rules: [
      ["bestTime", 40],
      ["totalAvoided", 400],
    ],
    description: "Ice-blue porcelain and silver metal rings.",
  }),
  reward("skin", 3, {
    id: "nebulosa",
    name: "Nebula",
    hull: "#ced6ff",
    accent: "#7468f1",
    trim: "#bb8ee8",
    glass: "#faafe8",
    flame: "#bd76ff",
    rules: [["flights45", 5]],
    description: "Indigo panels, glowing filaments, and sculpted fins.",
  }),
  reward("skin", 3, {
    id: "supernova",
    name: "Supernova",
    hull: "#501f35",
    accent: "#e35a73",
    trim: "#ffbf94",
    glass: "#ffe3b5",
    flame: "#ff7467",
    rules: [
      ["bestTime", 60],
      ["totalAvoided", 1200],
    ],
    description: "Crimson armor with copper ribs and starlight.",
  }),
  reward("skin", 4, {
    id: "obsidiana",
    name: "Obsidian",
    hull: "#182b37",
    accent: "#3e606d",
    trim: "#a9dde3",
    glass: "#aefff5",
    flame: "#6cf4de",
    rules: [
      ["bestTime", 75],
      ["flights60", 3],
      ["totalAvoided", 1800],
    ],
    description: "Dark armor, platinum filigree, and a crystal crown.",
  }),
  reward("skin", 4, {
    id: "eclipse",
    name: "Eclipse",
    hull: "#342647",
    accent: "#b07cff",
    trim: "#e7b967",
    glass: "#e5acff",
    flame: "#f8c677",
    rules: [["bestTime", 90]],
    description:
      "Deep purple, raised gold details, and a unique glowing crown.",
  }),
];
export const ABILITIES = [
  reward("ability", 0, {
    id: "none",
    name: "No Ability",
    description: "Pure piloting. Equip one ability per flight.",
  }),
  reward("ability", 1, {
    id: "agility",
    name: "Enhanced Maneuvering",
    rules: [
      ["bestTime", 60],
      ["flights45", 6],
    ],
    description: "Move 12% faster horizontally and vertically. Passive.",
  }),
  reward("ability", 2, {
    id: "shield",
    name: "Impact Shield",
    rules: [
      ["bestTime", 75],
      ["totalAvoided", 1600],
    ],
    description: "Absorbs one impact. Recharges 60 s after a hit.",
  }),
  reward("ability", 3, {
    id: "laser",
    name: "Dual-Charge Laser",
    rules: [
      ["bestTime", 100],
      ["totalAvoided", 2500],
    ],
    description:
      "2 shots, each destroying one meteor. Recharges in 14 s after both shots are used.",
  }),
  reward("ability", 4, {
    id: "slow",
    name: "Time Field",
    rules: [
      ["bestTime", 120],
      ["flights90", 3],
    ],
    description: "Slows meteors by 52% for 10 s. Cooldown: 24 s.",
  }),
  reward("ability", 5, {
    id: "dash",
    name: "Vector Boost",
    rules: [
      ["bestTime", 180],
      ["flights90", 8],
      ["totalNearMiss", 60],
    ],
    description: "Move 80% faster for 1.2 s. Hold a direction. Cooldown: 14 s.",
  }),
  reward("ability", 3, {
    id: "pulse",
    name: "Shatter Pulse",
    rules: [
      ["bestTime", 90],
      ["totalAvoided", 2000],
    ],
    description:
      "Destroys up to 3 nearby meteors in your path. Cooldown: 30 s.",
  }),
  reward("ability", 3, {
    id: "repulsor",
    name: "Repulsor Wave",
    rules: [
      ["bestTime", 100],
      ["flights90", 2],
    ],
    description: "Pushes up to 8 nearby meteors aside. Cooldown: 26 s.",
  }),
  reward("ability", 3, {
    id: "focus",
    name: "Microfield",
    rules: [
      ["bestTime", 120],
      ["flights90", 5],
    ],
    description:
      "Shrinks your rocket for 4 s to fit through tight gaps. Cooldown: 28 s.",
  }),
  reward("ability", 4, {
    id: "nova",
    name: "Nova",
    rules: [
      ["bestTime", 150],
      ["flights90", 6],
      ["totalAvoided", 5000],
    ],
    description:
      "A legendary blast destroys all nearby meteors. Cooldown: 3 minutes.",
  }),
];
export const TRAILS = [
  reward("trail", 0, {
    id: "none",
    name: "No Trail",
    color: "#a0b1bc",
    style: "none",
    description: "Just the original flame of your rocket.",
  }),
  reward("trail", 1, {
    id: "ion",
    name: "Ion Pulse",
    color: "#61dcea",
    style: "dust",
    rules: [["flights15", 2]],
    secondary: "#d9ffff",
    description: "A bright blue core wrapped in a ribbon of plasma.",
  }),
  reward("trail", 1, {
    id: "stardust",
    name: "Stardust",
    color: "#a9ddd0",
    style: "dust",
    rules: [
      ["flights15", 4],
      ["totalTime", 120],
    ],
    secondary: "#e5ffd8",
    description: "Glowing dust over two ribbons that ripple as you maneuver.",
  }),
  reward("trail", 2, {
    id: "embers",
    name: "Solar Sparks",
    color: "#ffb56b",
    style: "sparks",
    rules: [
      ["bestTime", 35],
      ["totalAvoided", 500],
    ],
    secondary: "#fff1a3",
    description: "A continuous fiery tail with embers and golden filaments.",
  }),
  reward("trail", 2, {
    id: "crystal",
    name: "Frost Crystals",
    color: "#a3cfff",
    style: "crystal",
    rules: [
      ["flights45", 2],
      ["totalAvoided", 700],
    ],
    secondary: "#f5e6ff",
    description: "A crystal comet with icy ribbons and faceted glints.",
  }),
  reward("trail", 3, {
    id: "prism",
    name: "Prismatic Ribbon",
    color: "#bd8dff",
    style: "ribbon",
    rules: [
      ["flights60", 2],
      ["totalAvoided", 1100],
    ],
    secondary: "#7ee9ff",
    description: "Four prismatic veils and a glowing core trace every turn.",
  }),
  reward("trail", 4, {
    id: "royal",
    name: "Royal Orbit",
    color: "#efbf67",
    rules: [
      ["bestTime", 90],
      ["flights60", 4],
      ["totalAvoided", 2000],
    ],
    secondary: "#ca8cff",
    style: "celestial",
    description:
      "A purple and gold double helix, a crown of light, and orbital rings.",
  }),
];
export const SHOP_ITEMS = [
  reward("trail", 1, {
    id: "copper_dust",
    name: "Copper Dust",
    color: "#eab27e",
    secondary: "#fff2b8",
    style: "sparks",
    shopCost: 40,
    shopLevel: 1,
    description: "A warm copper trail with tiny golden embers.",
  }),
  reward("skin", 2, {
    id: "cobalto",
    name: "Cobalt",
    hull: "#153c78",
    accent: "#55abdc",
    trim: "#c6e7ff",
    glass: "#91f9ff",
    flame: "#61caff",
    design: "fins",
    shopCost: 180,
    shopLevel: 3,
    description: "Cobalt blue, sky-blue panels, and polished titanium rings.",
  }),
  reward("trail", 3, {
    id: "ruby_stream",
    name: "Ruby Stream",
    color: "#ff487c",
    secondary: "#ffc88b",
    style: "helix",
    shopCost: 260,
    shopLevel: 6,
    description: "A crimson double helix with amber filaments.",
  }),
  reward("skin", 3, {
    id: "zenit",
    name: "Zenith",
    hull: "#e5f0ed",
    accent: "#245f60",
    trim: "#e9cc86",
    glass: "#acf8d9",
    flame: "#70dfcd",
    design: "wings",
    shopCost: 420,
    shopLevel: 8,
    description: "White porcelain, emerald fins, and golden ribs.",
  }),
  reward("skin", 4, {
    id: "auriga",
    name: "Auriga",
    hull: "#152a46",
    accent: "#459dbc",
    trim: "#ffdc82",
    glass: "#fff4bd",
    flame: "#f8c36c",
    design: "crown",
    shopCost: 950,
    shopLevel: 15,
    description:
      "Midnight-blue armor, golden filigree, and a crown of sunlight.",
  }),
];
export const CATALOGS = {
  skin: SKINS,
  ability: ABILITIES,
  trail: TRAILS,
  environment: ENVIRONMENTS,
  meteor: METEORS,
};
for (const item of [...LEVEL_REWARDS, ...SHOP_ITEMS])
  CATALOGS[item.kind].push(item);
// Catalogs are ordered independently; the expedition keeps its level sequence.
for (const items of Object.values(CATALOGS))
  items.sort((a, b) => a.level - b.level);
const eclipsePrerequisites = [
  "original",
  "aurora",
  "cometa",
  "solar",
  "polar",
  "nebulosa",
  "supernova",
  "obsidiana",
];
const lists = {
  skin: "unlocked",
  ability: "unlockedAbilities",
  trail: "unlockedTrails",
  environment: "unlockedEnvironments",
  meteor: "unlockedMeteors",
};
const selections = {
  skin: "selected",
  ability: "selectedAbility",
  trail: "selectedTrail",
  environment: "selectedEnvironment",
  meteor: "selectedMeteor",
};
const count = (n) =>
  Number.isFinite(n) ? Math.max(0, Math.min(10000000, Math.floor(n))) : 0;
const duration = (n) =>
  Number.isFinite(n) ? Math.max(0, Math.min(100000000, n)) : 0;
const earned = (item, p) =>
  item.shopCost
    ? (p[lists[item.kind]] || []).includes(item.id)
    : item.trackLevel
      ? levelInfo(p).level >= item.trackLevel
      : (p[lists[item.kind]] || []).includes(item.id) ||
        item.rules.every(([metric, target]) => (p[metric] || 0) >= target);
export function isUnlocked(item, p) {
  return (
    earned(item, p) &&
    (item.kind !== "skin" ||
      item.id !== "eclipse" ||
      eclipsePrerequisites.every((id) =>
        earned(
          SKINS.find((s) => s.id === id),
          p,
        ),
      ))
  );
}
export function normalizeProgress(value) {
  const p = {
    version: 5,
    xp: Math.min(xpForLevel(50), count(value?.xp)),
    totalNearMiss: count(value?.totalNearMiss),
    flights: count(value?.flights),
    flights15: count(value?.flights15),
    flights30: count(value?.flights30),
    flights45: count(value?.flights45),
    flights60: count(value?.flights60),
    flights90: count(value?.flights90),
    totalAvoided: count(value?.totalAvoided),
    bestAvoided: count(value?.bestAvoided),
    totalTime: duration(value?.totalTime),
    bestTime: duration(value?.bestTime),
    unlocked: ["original"],
    unlockedAbilities: ["none"],
    unlockedTrails: ["none"],
    unlockedEnvironments: ["cosmos"],
    unlockedMeteors: ["rock"],
    selectedEnvironment: "cosmos",
    selectedMeteor: "rock",
    selected: "original",
    selectedAbility: "none",
    selectedTrail: "none",
  };
  p.coins = count(value?.coins);
  p.totalCoins = Math.max(p.coins, count(value?.totalCoins));
  p.bestCombo = count(value?.bestCombo);
  p.recentFlights = Array.isArray(value?.recentFlights)
    ? value.recentFlights
        .slice(0, 5)
        .filter((run) => run && typeof run === "object")
        .map((run) => ({
          number: count(run.number),
          time: duration(run.time),
          avoided: count(run.avoided),
          nearMiss: count(run.nearMiss),
          combo: Math.min(count(run.combo), count(run.nearMiss)),
          xp: count(run.xp),
          coins: count(run.coins),
          grade: ["S", "A", "B", "C", "D"].includes(run.grade)
            ? run.grade
            : "D",
        }))
    : [];
  // Keep earned cosmetics. Newly separate abilities require their own challenges.
  if (value && ![2, 3, 4, 5].includes(value.version)) {
    if (p.flights >= 3) p.unlocked.push("aurora");
    if (p.flights >= 10) p.unlocked.push("solar");
    if (p.bestTime >= 45) p.unlocked.push("eclipse");
  }
  if ([2, 3, 4, 5].includes(value?.version) && Array.isArray(value.unlocked))
    p.unlocked.push(
      ...value.unlocked.filter((id) => SKINS.some((s) => s.id === id)),
    );
  if (value?.version === 2) {
    if (count(value.flights20) >= 3) p.unlocked.push("aurora");
    if (count(value.flights40) >= 5) p.unlocked.push("solar");
    if (p.bestTime >= 60) p.unlocked.push("eclipse");
  }
  for (const [kind, items] of Object.entries(CATALOGS)) {
    const list = lists[kind];
    if (
      kind !== "skin" &&
      [4, 5].includes(value?.version) &&
      Array.isArray(value[list])
    )
      p[list].push(
        ...value[list].filter((id) => items.some((item) => item.id === id)),
      );
    p[list] = [
      ...new Set([
        ...p[list],
        ...items.filter((item) => earned(item, p)).map((item) => item.id),
      ]),
    ];
  }
  for (const [kind, items] of Object.entries(CATALOGS)) {
    const key = selections[kind],
      chosen = items.find((item) => item.id === value?.[key]);
    if (chosen && isUnlocked(chosen, p)) p[key] = chosen.id;
  }
  return p;
}
export function loadProgress(storage) {
  try {
    return normalizeProgress(
      JSON.parse(storage.getItem(STORAGE_KEY) || "null"),
    );
  } catch {
    return normalizeProgress(null);
  }
}
export function saveProgress(storage, progress) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
    return true;
  } catch {
    return false;
  }
}
const allRewards = Object.values(CATALOGS).flat();
function outcome(before, after) {
  return {
    progress: after,
    unlocked: allRewards.filter(
      (item) => !isUnlocked(item, before) && isUnlocked(item, after),
    ),
  };
}
export function flightXP(time, avoided = 0, nearMiss = 0) {
  const seconds = duration(time);
  return seconds < 15
    ? 0
    : Math.floor(2 * seconds + 0.75 * count(avoided) + 15 * count(nearMiss));
}
export function recordFlight(
  progress,
  time,
  avoided = 0,
  nearMiss = 0,
  details,
) {
  progress = normalizeProgress(progress);
  const seconds = duration(time),
    dodged = count(avoided),
    updates = {};
  for (const threshold of [15, 30, 45, 60, 90])
    updates["flights" + threshold] =
      count(progress["flights" + threshold]) + (seconds >= threshold ? 1 : 0);
  const stats = {
    time: seconds,
    avoided: dodged,
    nearMiss: count(nearMiss),
    maxCombo: Math.min(count(nearMiss), count(details?.maxCombo)),
  };
  const bonuses = details
    ? flightBonuses(stats, details.contractSet)
    : { objectives: [], bonusXP: 0, comboXP: 0, objectiveXP: 0, maxCombo: 0 };
  const baseXP = flightXP(seconds, dodged, nearMiss),
    gain = baseXP + bonuses.bonusXP;
  const coins = Math.min(
    count(details?.coinsCollected),
    Math.floor(seconds * 6),
  );
  const next = normalizeProgress({
    ...progress,
    ...updates,
    xp: progress.xp + gain,
    coins: progress.coins + coins,
    totalCoins: progress.totalCoins + coins,
    bestCombo: Math.max(progress.bestCombo, stats.maxCombo),
    totalNearMiss: progress.totalNearMiss + count(nearMiss),
    flights: progress.flights + 1,
    totalTime: progress.totalTime + seconds,
    bestTime: Math.max(progress.bestTime, seconds),
    totalAvoided: progress.totalAvoided + dodged,
    bestAvoided: Math.max(progress.bestAvoided, dodged),
  });
  const xpEarned = next.xp - progress.xp,
    grade = flightGrade(seconds, nearMiss, stats.maxCombo);
  next.recentFlights = [
    {
      number: next.flights,
      time: seconds,
      avoided: dodged,
      nearMiss: stats.nearMiss,
      combo: stats.maxCombo,
      xp: xpEarned,
      coins,
      grade,
    },
    ...progress.recentFlights,
  ].slice(0, 5);
  return {
    ...outcome(progress, next),
    xpEarned,
    levelsGained: levelInfo(next).level - levelInfo(progress).level,
    report: {
      ...bonuses,
      baseXP,
      awardedXP: xpEarned,
      coins,
      grade,
      newBest: seconds > progress.bestTime,
    },
  };
}
export function purchaseReward(progress, kind, id) {
  const p = normalizeProgress(progress),
    item = SHOP_ITEMS.find((item) => item.kind === kind && item.id === id);
  if (!item) return { progress: p, purchased: false, reason: "unknown" };
  if (isUnlocked(item, p))
    return { progress: p, purchased: false, reason: "owned" };
  if (levelInfo(p).level < item.shopLevel)
    return { progress: p, purchased: false, reason: "level" };
  if (p.coins < item.shopCost)
    return { progress: p, purchased: false, reason: "funds" };
  p.coins -= item.shopCost;
  p[lists[kind]].push(item.id);
  return { progress: normalizeProgress(p), purchased: true, item };
}
const timeMilestones = [
  ...new Set(
    allRewards.flatMap((item) =>
      item.rules
        .filter(([metric]) => metric === "bestTime")
        .map(([, target]) => target),
    ),
  ),
].sort((a, b) => a - b);
export function recordLiveMilestone(progress, time) {
  const reached = timeMilestones.filter(
    (target) => target > progress.bestTime && target <= time,
  );
  if (!reached.length) return null;
  return outcome(
    progress,
    normalizeProgress({ ...progress, bestTime: Math.max(...reached) }),
  );
}
const metricLabels = {
  bestTime: "s in one flight",
  totalAvoided: "meteors dodged",
  bestAvoided: "dodged in one flight",
  totalTime: "s of total flight time",
  totalNearMiss: "near misses",
};
export function challengeProgress(item, progress) {
  const lines = [];
  if (item.shopCost)
    return isUnlocked(item, progress)
      ? [{ done: true, text: "Purchased in the shop" }]
      : [
          {
            done: levelInfo(progress).level >= item.shopLevel,
            text: `Shop · level ${item.shopLevel} · ${item.shopCost} coins`,
          },
        ];
  if (item.trackLevel)
    return [
      {
        done: isUnlocked(item, progress),
        text: `Exclusive level ${item.trackLevel} reward`,
      },
    ];
  if (item.kind === "skin" && item.id === "eclipse") {
    const others = eclipsePrerequisites.map((id) =>
        SKINS.find((s) => s.id === id),
      ),
      ready = others.filter((s) => isUnlocked(s, progress)).length;
    lines.push({
      done: ready === others.length,
      text: `${ready}/${others.length} skins unlocked`,
    });
  }
  if (
    (progress[lists[item.kind]] || []).includes(item.id) &&
    item.rules.length
  ) {
    lines.push({ done: true, text: "Challenge complete" });
    return lines;
  }
  for (const [metric, target] of item.rules) {
    const current = Math.min(target, Math.floor(progress[metric] || 0)),
      label = metric.startsWith("flights")
        ? `flights lasting at least ${metric.slice(7)} s`
        : metricLabels[metric];
    lines.push({
      done: current >= target,
      text: `${current}/${target} ${label}`,
    });
  }
  if (!lines.length)
    lines.push({ done: true, text: "Available from the start" });
  return lines;
}
export function skinProgress(item, progress) {
  return challengeProgress(item, progress)
    .map((line) => line.text)
    .join(" · ");
}
