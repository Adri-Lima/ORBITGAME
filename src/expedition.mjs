export const RARITIES = [
  ["Common", "#9babb7"],
  ["Uncommon", "#65cf87"],
  ["Rare", "#5ea9fb"],
  ["Epic", "#be83ff"],
  ["Legendary", "#f6b34f"],
  ["Mythic", "#ff86b3"],
];
export const reward = (kind, level, details) => ({
  kind,
  level,
  rarity: RARITIES[level][0],
  rarityColor: RARITIES[level][1],
  rules: [],
  ...details,
});
export const ENVIRONMENTS = [
  reward("environment", 0, {
    id: "cosmos",
    name: "Original Cosmos",
    image: "cosmos",
    color: "#659cbc",
    feature: "quiet",
    description: "The planetary system where your journey began.",
  }),
  reward("environment", 2, {
    id: "glacial",
    name: "Glacial Rings",
    image: "glacial",
    color: "#88dcff",
    feature: "rings",
    rules: [["bestTime", 30]],
    description: "An icy giant and its crystal rings.",
  }),
  reward("environment", 3, {
    id: "rift",
    name: "Stellar Rift",
    image: "rift",
    color: "#ff7248",
    feature: "rift",
    rules: [
      ["bestTime", 60],
      ["totalAvoided", 700],
    ],
    description: "Two suns and a fractured world on the brink of collapse.",
  }),
  reward("environment", 4, {
    id: "horizon",
    name: "Event Horizon",
    image: "event-horizon",
    color: "#e9b775",
    feature: "lens",
    rules: [
      ["bestTime", 90],
      ["flights60", 3],
    ],
    description: "A black hole surrounded by golden light and violet dust.",
  }),
];
export const METEORS = [
  reward("meteor", 0, {
    id: "rock",
    name: "Space Rock",
    color: "#77726b",
    accent: "#b8a28b",
    form: "rock",
    description: "A rugged rock, just as you found it.",
  }),
  reward("meteor", 1, {
    id: "iron",
    name: "Meteoric Iron",
    color: "#70818c",
    accent: "#b8d1da",
    form: "metal",
    rules: [["totalAvoided", 100]],
    description: "A metallic surface with nickel edges.",
  }),
  reward("meteor", 2, {
    id: "frost",
    name: "Arctic Crystal",
    color: "#68a6cd",
    accent: "#c0fbff",
    form: "crystal",
    rules: [["totalAvoided", 400]],
    description: "Frozen geodes with a glowing blue core.",
  }),
  reward("meteor", 3, {
    id: "lava",
    name: "Volcanic Heart",
    color: "#4a2627",
    accent: "#ff7239",
    form: "magma",
    rules: [
      ["bestTime", 50],
      ["totalAvoided", 700],
    ],
    description: "Glowing cracks and veins of magma beneath the crust.",
  }),
  reward("meteor", 4, {
    id: "alien",
    name: "Alien Relic",
    color: "#303057",
    accent: "#bca1ff",
    form: "relic",
    rules: [
      ["bestTime", 80],
      ["totalAvoided", 1200],
    ],
    description: "Ancient fragments with rings and an otherworldly core.",
  }),
];
const skinRows = [
  ["vigia", "Sentinel", "#b2c2c7", "#5f7e88", "#9caeae", "plain"],
  ["cobre", "Copper Wanderer", "#c9aa89", "#865947", "#dba979", "bands"],
  ["boreal", "Boreal", "#c8e1ef", "#4c8297", "#b8f0ec", "fins"],
  ["corsario", "Corsair", "#283747", "#a8604a", "#e4bd8b", "blades"],
  ["serafin", "Seraph", "#e6e8df", "#7994b8", "#d7c28e", "wings"],
  ["sierpe", "Jade Serpent", "#163e3b", "#54a08c", "#b5d58b", "serpent"],
  ["monarca", "Monarch", "#453359", "#927bd7", "#dfbb82", "crown"],
  ["arcangel", "Archangel", "#e6e8f3", "#7d95cc", "#f4d28e", "wings"],
  ["leviatan", "Leviathan", "#162735", "#496f8d", "#9fe4e8", "blades"],
  ["fenix", "Astral Phoenix", "#382544", "#c178b6", "#ffe1a3", "phoenix"],
];
const trailRows = [
  ["bruma", "Celestial Mist", "#82cddc", "#d0f4ff", "ribbon"],
  ["magnetica", "Magnetic Current", "#73c4a1", "#e3ffa6", "helix"],
  ["cometaria", "Comet Tail", "#73b1ff", "#e0ffff", "comet"],
  ["aurora_ribbon", "Aurora Veils", "#71e7a3", "#b686ff", "curtain"],
  ["plasma", "Dual-Phase Plasma", "#ff935f", "#f2d3ff", "helix"],
  ["meteor_rain", "Diamond Rain", "#9abbff", "#fff5d2", "crystal"],
  ["solar_crown", "Solar Crown", "#ffb153", "#fff2b0", "corona"],
  ["phoenix_tail", "Phoenix Wings", "#ff8e64", "#d686ff", "phoenix"],
  ["singular_tail", "Singularity Trail", "#b895ff", "#fde4a2", "vortex"],
  ["celestial_tail", "Celestial Procession", "#ffd883", "#dc8fff", "celestial"],
];
const meteorRows = [
  ["pizarra", "Lunar Slate", "#566776", "#b8ccd6", "rock"],
  ["malaquita", "Malachite", "#285e4e", "#90dfba", "metal"],
  ["geoda", "Celestial Geode", "#48597d", "#b8dbff", "crystal"],
  ["pirita", "Orbital Pyrite", "#84703d", "#f3d97c", "metal"],
  ["magma_blue", "Blue Magma", "#233847", "#70dcff", "magma"],
  ["vacuo", "Void Fragment", "#28233e", "#aa85ff", "void"],
  ["maquina", "Ancient Gear", "#574932", "#f5cc80", "relic"],
  ["seraph_stone", "Seraph Heart", "#60728c", "#d7f4ff", "crystal"],
  ["singular_stone", "Singularity Core", "#251f39", "#c396ff", "void"],
  ["quasar", "Quasar Seed", "#563b6c", "#fff2bd", "quasar"],
];
const environmentRows = [
  ["quiet_moon", "Silent Moon", "quiet_moon", "#6995ab", "moons"],
  ["jade_route", "Jade Route", "jade_route", "#7bcfbb", "rings"],
  ["polar_gate", "Polar Gate", "polar_gate", "#9be5ff", "gate"],
  ["binary", "Binary Horizon", "binary", "#edb877", "binary"],
  ["cathedral", "Ice Cathedral", "cathedral", "#b6d0ff", "spires"],
  ["fracture", "Orion Fracture", "fracture", "#ff835f", "shards"],
  ["spiral", "Violet Spiral", "spiral", "#b9a0ff", "spiral"],
  ["throne", "Void Throne", "throne", "#f1d495", "gate"],
  ["maelstrom", "Gravity Storm", "maelstrom", "#cb8dff", "storm"],
  ["end_time", "End of Time", "end_time", "#fde0af", "orbits"],
];
const specials = {
  5: ["meteor", "amber", "Stellar Amber", "#805936", "#efc17a", "crystal"],
  10: ["environment", "ocean", "Ocean of Stars", "ocean", "#9ad6db", "moons"],
  15: ["meteor", "rose", "Rose Quartz", "#855d83", "#ffd0ed", "crystal"],
  20: [
    "environment",
    "ember_sea",
    "Ember Sea",
    "ember_sea",
    "#ffa26c",
    "embers",
  ],
  25: ["meteor", "ancient", "Ancient Monolith", "#514264", "#d9baff", "relic"],
  30: [
    "environment",
    "labyrinth",
    "Astral Labyrinth",
    "labyrinth",
    "#b5bcff",
    "gate",
  ],
  35: ["meteor", "orbit_core", "Orbital Core", "#58487c", "#f0d4ff", "orbit"],
  40: [
    "environment",
    "twin_void",
    "Twin Abyss",
    "twin_void",
    "#dfafff",
    "binary",
  ],
  45: ["meteor", "serpent_core", "Dragon Egg", "#483858", "#ffc984", "quasar"],
  50: ["environment", "genesis", "Genesis", "genesis", "#ffe4a2", "genesis"],
};
const rank = (n) =>
  n <= 5 ? 0 : n <= 10 ? 1 : n <= 20 ? 2 : n <= 35 ? 3 : n <= 45 ? 4 : 5;
const environmentDescriptions = {
  quiet_moon: "A dim moon amid blue dust and a silent sky.",
  jade_route: "A river of green dust winds through the void.",
  polar_gate: "Aurora curtains form an arch across deep space.",
  binary: "Two stars bathe their clouds in blue and red winds.",
  cathedral: "Columns of frozen gas rise like a cathedral of light.",
  fracture: "A red and gold rift cuts through the clouds of Orion.",
  spiral: "The arms of a violet galaxy unfold along your route.",
  throne: "A vast void beneath a canopy of clouds and silver filaments.",
  maelstrom: "A storm of electric nebulae swirls with blue and magenta light.",
  end_time: "The sky shatters into arcs of light and echoes of stars.",
  ocean: "Turquoise currents and glowing dust sweep through an ocean of stars.",
  ember_sea: "Waves of crimson clouds carry embers through space.",
  labyrinth: "Paths of light and constellations trace an impossible maze.",
  twin_void: "Two black holes intertwine their disks of gold and violet light.",
  genesis:
    "The birth of the cosmos: golden filaments and clouds of pink and cobalt stars.",
};
export const LEVEL_REWARDS = [];
for (let n = 1; n <= 50; n++) {
  const index = Math.floor((n - 1) / 5),
    slot = n % 5,
    tier = rank(n);
  let item;
  if (slot === 1) {
    const [id, name, hull, accent, trim, design] = skinRows[index];
    item = reward("skin", tier, {
      id,
      name,
      hull,
      accent,
      trim,
      glass: trim,
      flame: accent,
      design,
      description:
        tier >= 4
          ? "A prestige edition with sculpted details, crowns, and its own glow."
          : tier >= 3
            ? "Expedition armor with a unique silhouette and filaments."
            : "An exclusive finish from the expedition track.",
    });
  }
  if (slot === 2) {
    const [id, name, color, secondary, style] = trailRows[index];
    item = reward("trail", tier, {
      id,
      name,
      color,
      secondary,
      style,
      description:
        "Flowing ribbons, glow, and particles create a distinctive flight signature.",
    });
  }
  if (slot === 3) {
    const [id, name, color, accent, form] = meteorRows[index];
    item = reward("meteor", tier, {
      id,
      name,
      color,
      accent,
      form,
      description:
        "An exclusive expedition fragment with a unique appearance and unchanged collision behavior.",
    });
  }
  if (slot === 4) {
    const [id, name, image, color, feature] = environmentRows[index];
    item = reward("environment", tier, {
      id,
      name,
      image,
      color,
      feature,
      description:
        "An exclusive sector with its own celestial bodies and phenomena.",
    });
  }
  if (slot === 0) {
    const [kind, id, name, a, b, c] = specials[n];
    item =
      kind === "meteor"
        ? reward(kind, tier, {
            id,
            name,
            color: a,
            accent: b,
            form: c,
            description: "A special relic from the expedition track.",
          })
        : reward(kind, tier, {
            id,
            name,
            image: a,
            color: b,
            feature: c,
            description:
              n === 50
                ? "The final destination: crowns of light, suspended worlds, and a canopy of stars."
                : "A special expedition destination with a horizon of its own.",
          });
  }
  if (item.kind === "environment")
    item.description = environmentDescriptions[item.id];
  item.trackLevel = n;
  LEVEL_REWARDS.push(item);
}
export const xpForLevel = (n) => {
  const x = Math.max(0, Math.min(49, n - 1));
  return 120 * x + 20 * x * x;
};
export function levelInfo(p) {
  const xp = Math.max(0, p.xp || 0);
  let level = 1;
  while (level < 50 && xp >= xpForLevel(level + 1)) level++;
  const start = xpForLevel(level),
    end = level === 50 ? start : xpForLevel(level + 1);
  return {
    level,
    xp,
    progress: level === 50 ? 1 : (xp - start) / (end - start),
    remaining: Math.max(0, end - xp),
    within: xp - start,
    needed: end - start,
  };
}
