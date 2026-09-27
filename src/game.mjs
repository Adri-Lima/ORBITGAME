import * as THREE from "../vendor/three.module.js";
import {
  createFlight,
  stepFlight,
  timeLabel,
  randomGenerator,
  activateAbility,
} from "./simulation.mjs";
import {
  SKINS,
  ABILITIES,
  TRAILS,
  CATALOGS,
  isUnlocked,
  loadProgress,
  saveProgress,
  recordFlight,
  recordLiveMilestone,
  challengeProgress,
  ENVIRONMENTS,
  METEORS,
  LEVEL_REWARDS,
  levelInfo,
  flightXP,
} from "./progress.mjs";
import { createCustomization } from "./customization.mjs";
import { createWorld } from "./world.mjs";
import { followRocket } from "./flight-view.mjs";
import { SHOP_ITEMS, purchaseReward } from "./progress.mjs";
import { contractsFor, flightBonuses } from "./flight-rewards.mjs";
import { createSoundtrack } from "./music.mjs";

const $ = (id) => document.getElementById(id);
const canvas = $("space"),
  root = $("game"),
  overlay = $("overlay"),
  start = $("start"),
  pause = $("pause");
const input = { up: false, down: false, left: false, right: false };
const keyMap = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};
let renderer,
  scene,
  camera,
  rocket,
  exhaust,
  engineLight,
  shieldBubble,
  laserEmitter,
  flight = createFlight(),
  mode = "loading",
  last = 0,
  visualTime = 0,
  cameraDistance = 13.5,
  toastUntil = 0;
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
let progress = loadProgress(storage),
  rocketMaterials = [],
  customization,
  world,
  previewing = null;
let musicSettings = { volume: 0.25, muted: false };
try {
  const saved = JSON.parse(storage?.getItem("orbit-01-audio") || "null");
  if (saved) {
    musicSettings = {
      volume: Number.isFinite(saved.volume)
        ? Math.max(0, Math.min(0.7, saved.volume))
        : 0.25,
      muted: saved.muted === true,
    };
  }
} catch {}
const music = createSoundtrack({ ...musicSettings, onState: refreshMusic });
const tabs = [...Object.keys(CATALOGS), "shop", "levels"];
const selectionKeys = {
  skin: "selected",
  ability: "selectedAbility",
  trail: "selectedTrail",
  environment: "selectedEnvironment",
  meteor: "selectedMeteor",
};
const meteors = new Map(),
  particles = [];
const coinMeshes = new Map(),
  coinGeometry = new THREE.CylinderGeometry(0.31, 0.31, 0.075, 20),
  coinRingGeometry = new THREE.TorusGeometry(0.32, 0.025, 5, 24);
coinGeometry.rotateX(Math.PI / 2);
const coinMaterials = [
  new THREE.MeshStandardMaterial({
    color: 0xffcf58,
    emissive: 0xe6a028,
    emissiveIntensity: 0.65,
    metalness: 0.68,
    roughness: 0.3,
  }),
  new THREE.MeshStandardMaterial({
    color: 0xcd8bff,
    emissive: 0xaa56ed,
    emissiveIntensity: 0.8,
    metalness: 0.5,
    roughness: 0.3,
  }),
];
const coinRingMaterial = new THREE.MeshBasicMaterial({ color: 0xffe3a3 });
const beamMeshes = new Map(),
  impactMeshes = new Map();
const beamGeometry = new THREE.CylinderGeometry(0.038, 0.038, 3.1, 8);
beamGeometry.rotateX(Math.PI / 2);
const beamMaterial = new THREE.MeshBasicMaterial({
  color: 0xe5caff,
  transparent: true,
  opacity: 0.95,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const impactGeometry = new THREE.RingGeometry(0.12, 0.24, 24);
const rng = randomGenerator(90471);

function setMode(value) {
  mode = value;
  $("hazard-warning").hidden = true;
  $("ability-control").hidden = value !== "playing";
  $("flight-panel").hidden = value !== "playing";
  music.setDucked(value !== "playing");
  root.classList.toggle("playing", value === "playing");
  root.classList.toggle("crashed", value === "over");
  overlay.hidden = value === "playing";
  pause.hidden = value !== "playing";
  refreshHangar();
}
function clearInput() {
  for (const key in input) input[key] = false;
}
function announce(text) {
  $("announcement").textContent = text;
}
function persist() {
  const saved = saveProgress(storage, progress);
  $("storage-note").textContent = saved
    ? "Progress is saved in this browser."
    : "Progress is only kept for this session.";
}
const kindNames = {
  skin: "Skin",
  ability: "Ability",
  trail: "Trail",
  environment: "Environment",
  meteor: "Meteors",
};
function iconFor(item) {
  if (item.kind === "environment")
    return `<img class="landscape-thumb" src="./assets/${item.image}.png" alt="" loading="lazy">`;
  const symbol =
    item.kind === "ability"
      ? {
          none: "—",
          agility: "↗",
          shield: "◇",
          laser: "Ⅱ",
          slow: "◷",
          dash: "»",
          pulse: "◎",
          repulsor: "↔",
          focus: "⋈",
          nova: "✺",
        }[item.id]
      : item.kind === "meteor"
        ? "⬡"
        : item.kind === "trail"
          ? "≋"
          : "✦";
  return `<span class="cosmetic-token" style="--token:${item.trim || item.color || item.rarityColor};--token-secondary:${item.accent || item.secondary || item.rarityColor}" aria-hidden="true">${symbol}</span>`;
}
function rewardCard(item) {
  const unlocked = isUnlocked(item, progress),
    selected = item.id === progress[selectionKeys[item.kind]],
    interactive = mode === "ready" || mode === "over",
    tasks = challengeProgress(item, progress);
  return `<article style="--rarity:${item.rarityColor}" class="skin-card reward-card ${selected ? "selected" : ""} ${unlocked ? "" : "locked"}">${iconFor(item)}<span class="reward-heading"><span class="rarity">${item.rarity}</span><strong>${item.name}</strong><small>${selected ? "Equipped" : unlocked ? "Available" : "Locked"}</small></span><span class="power-description">${item.description}</span><span class="challenge-list">${tasks.map((task) => `<span class="challenge-line ${task.done ? "done" : ""}"><span aria-hidden="true">${task.done ? "✓" : "○"}</span>${task.text}</span>`).join("")}</span><span class="reward-actions"><button data-preview="${item.id}" ${interactive ? "" : "disabled"} aria-label="Preview ${item.name}">Preview</button><button data-reward="${item.id}" ${interactive && unlocked ? "" : "disabled"} aria-pressed="${selected}">${selected ? "Equipped" : "Equip"}</button></span></article>`;
}
function refreshLevels() {
  const info = levelInfo(progress);
  $("level-number").textContent = info.level;
  $("hud-level").textContent = info.level;
  $("levels-count").textContent = `${info.level}/50`;
  $("xp-fill").style.width = `${info.progress * 100}%`;
  $("xp-summary").textContent =
    info.level === 50
      ? "Expedition complete · max level"
      : `${info.remaining.toLocaleString("en-US")} XP to level ${info.level + 1}`;
  $("level-track").innerHTML = LEVEL_REWARDS.map((item) => {
    const owned = isUnlocked(item, progress),
      current = item.trackLevel === info.level + 1;
    return `<li id="level-${item.trackLevel}" class="level-node ${owned ? "earned" : ""} ${current ? "next" : ""}" style="--rarity:${item.rarityColor}"><span class="level-marker">${item.trackLevel}</span><span class="level-category">${kindNames[item.kind]} · ${item.rarity}</span>${iconFor(item)}<strong>${item.name}</strong><span class="level-state">${owned ? "Owned" : current ? "Your next reward" : "Level " + item.trackLevel}</span><button data-level-preview="${item.trackLevel}" ${mode === "playing" || mode === "paused" ? "disabled" : ""}>Preview reward</button></li>`;
  }).join("");
  const next = LEVEL_REWARDS[info.level];
  $("next-reward").textContent = next
    ? `Next: ${next.name} · ${kindNames[next.kind]}`
    : "Genesis unlocked. Your expedition is complete.";
}
function refreshHangar() {
  $("flight-count").textContent =
    `${progress.flights} ${progress.flights === 1 ? "flight" : "flights"}`;
  $("best-flight").textContent = timeLabel(progress.bestTime);
  for (const [kind, items] of Object.entries(CATALOGS)) {
    $("selected-" + kind).textContent = items.find(
      (s) => s.id === progress[selectionKeys[kind]],
    ).name;
    $(kind + "-count").textContent =
      `${items.filter((item) => isUnlocked(item, progress)).length}/${items.length}`;
    $(kind + "-list").innerHTML = items.map(rewardCard).join("");
  }
  $("total-avoided").textContent =
    progress.totalAvoided.toLocaleString("en-US");
  refreshLevels();
  refreshShop();
  refreshContracts();
  refreshLedger();
}
function refreshMusic(state = music.getState()) {
  $("music-toggle").textContent = state.muted ? "Music · off" : "Music · on";
  $("music-toggle").setAttribute("aria-pressed", String(!state.muted));
  $("music-volume").value = Math.round(state.volume * 100);
  $("music-status").textContent = !state.supported
    ? "Audio is unavailable in this browser"
    : state.started
      ? "Orbital Drift · ambient"
      : "Orbital Drift · starts in flight";
  try {
    storage?.setItem(
      "orbit-01-audio",
      JSON.stringify({ volume: state.volume, muted: state.muted }),
    );
  } catch {}
}
function toggleMusic() {
  const state = music.getState();
  music.setMuted(!state.muted);
  if (state.muted) void music.start();
}
$("music-toggle").addEventListener("click", toggleMusic);
$("music-volume").addEventListener("input", (event) => {
  music.setVolume(Number(event.target.value) / 100);
  if (!music.getState().muted) void music.start();
});
refreshMusic();
function refreshContracts() {
  const active = mode === "playing" || mode === "paused",
    stats = active ? flight : {},
    set = active ? flight.contractSet : progress.flights;
  $("contracts-title").textContent =
    mode === "paused" ? "Current objectives" : "Next flight objectives";
  $("contract-list").innerHTML = flightBonuses(stats, set)
    .objectives.map(
      (item) =>
        `<div class="contract ${item.done ? "done" : ""}"><span>${item.done ? "✓" : "○"} ${item.name}<small>${item.current}/${item.target} ${item.unit}</small></span><b>+${item.xp} XP</b></div>`,
    )
    .join("");
}
function refreshLedger() {
  $("best-combo").textContent = progress.bestCombo;
  $("recent-flights").innerHTML = progress.recentFlights.length
    ? progress.recentFlights
        .map(
          (run) =>
            `<li><b>${run.grade}</b><span>Flight ${run.number}<small>${timeLabel(run.time)} · ${run.avoided} dodged</small></span><span>+${run.xp} XP<small>◈ ${run.coins} · combo ${run.combo}</small></span></li>`,
        )
        .join("")
    : '<li class="empty-ledger">Your next flight starts this log.</li>';
}
function refreshShop() {
  $("wallet-coins").textContent = progress.coins;
  $("shop-count").textContent =
    SHOP_ITEMS.filter((item) => isUnlocked(item, progress)).length +
    "/" +
    SHOP_ITEMS.length;
  const level = levelInfo(progress).level,
    interactive = mode === "ready" || mode === "over";
  $("shop-list").innerHTML = SHOP_ITEMS.map((item) => {
    const owned = isUnlocked(item, progress),
      canBuy =
        interactive &&
        !owned &&
        level >= item.shopLevel &&
        progress.coins >= item.shopCost;
    return `<article class="skin-card reward-card ${owned ? "" : "locked"}" style="--rarity:${item.rarityColor}">${iconFor(item)}<span class="reward-heading"><span class="rarity">${item.rarity} · ${kindNames[item.kind]}</span><strong>${item.name}</strong><small>Shop exclusive</small></span><span class="power-description">${item.description}</span><span class="shop-price">◈ ${item.shopCost}<small>Level ${item.shopLevel}</small></span><span class="reward-actions"><button data-shop-preview="${item.id}" ${interactive ? "" : "disabled"}>Preview</button><button data-buy="${item.id}" ${canBuy ? "" : "disabled"}>${owned ? "Owned" : level < item.shopLevel ? "Level " + item.shopLevel : progress.coins < item.shopCost ? "Need " + (item.shopCost - progress.coins) + " more" : "Buy"}</button></span></article>`;
  }).join("");
}
$("open-shop").addEventListener("click", () => selectHangarTab("shop"));
$("shop-list").addEventListener("click", (event) => {
  const preview = event.target.closest("[data-shop-preview]");
  if (preview) {
    const item = SHOP_ITEMS.find(
      (item) => item.id === preview.dataset.shopPreview,
    );
    if (item) previewReward(item.kind, item.id);
    return;
  }
  const button = event.target.closest("[data-buy]");
  if (!button || !["ready", "over"].includes(mode)) return;
  const item = SHOP_ITEMS.find((item) => item.id === button.dataset.buy);
  if (!item) return;
  const result = purchaseReward(progress, item.kind, item.id);
  if (!result.purchased) {
    $("shop-message").textContent =
      result.reason === "funds"
        ? "You need more coins for this cosmetic."
        : result.reason === "level"
          ? "Reach the required level to buy this cosmetic."
          : "You already own this cosmetic.";
    return;
  }
  progress = result.progress;
  persist();
  refreshHangar();
  $("shop-message").textContent =
    item.name + " purchased. Equip it from its collection.";
  unlockToast(item.name + " added to your hangar");
});
function selectHangarTab(kind) {
  for (const key of tabs) {
    $("panel-" + key).hidden = key !== kind;
    $("tab-" + key).setAttribute("aria-selected", String(key === kind));
    $("tab-" + key).setAttribute("tabindex", key === kind ? "0" : "-1");
  }
  $("hangar").classList.toggle("expedition-open", kind === "levels");
  overlay.classList.toggle("expedition-open", kind === "levels");
}
function clearMeteors() {
  for (const mesh of meteors.values()) scene.remove(mesh);
  meteors.clear();
}
function applyWorld() {
  if (!world) return;
  const item = METEORS.find((t) => t.id === progress.selectedMeteor);
  if (world.meteorId !== item.id) {
    clearMeteors();
    world.setMeteor(item);
  }
  world
    .setEnvironment(
      ENVIRONMENTS.find((t) => t.id === progress.selectedEnvironment),
    )
    .catch(() =>
      announce("Could not load the environment. Try selecting it again."),
    );
}
function applyLoadout() {
  if (laserEmitter) laserEmitter.visible = progress.selectedAbility === "laser";
  customization?.setTrail(TRAILS.find((t) => t.id === progress.selectedTrail));
  applyWorld();
}
function closePreview() {
  if (!previewing) return;
  previewing = null;
  world?.clearPreview();
  if (rocket) rocket.visible = true;
  paintSkin(SKINS.find((s) => s.id === progress.selected));
  applyLoadout();
  $("preview-status").hidden = true;
}
function previewReward(kind, id) {
  if (mode !== "ready" && mode !== "over") return;
  const item = CATALOGS[kind].find((s) => s.id === id);
  if (!item) return;
  closePreview();
  previewing = item;
  $("preview-status").hidden = false;
  $("preview-name").textContent =
    `${item.name} · ${item.rarity} · ${isUnlocked(item, progress) ? "Available" : "Preview"}`;
  $("preview-description").textContent = item.description;
  if (kind === "skin") paintSkin(item);
  if (kind === "trail") customization?.setTrail(item);
  if (kind === "environment")
    world
      .setEnvironment(item)
      .catch(() => announce("Could not load this environment."));
  if (kind === "meteor") {
    clearMeteors();
    world.setMeteor(item);
    world.previewMeteor();
    rocket.visible = false;
  }
}
function equipReward(kind, id) {
  if (mode !== "ready" && mode !== "over") return;
  const item = CATALOGS[kind].find((s) => s.id === id);
  if (!item || !isUnlocked(item, progress)) return;
  closePreview();
  if (kind === "skin") {
    equipSkin(id);
    return;
  }
  progress[selectionKeys[kind]] = id;
  applyLoadout();
  persist();
  refreshHangar();
}
for (const kind of tabs) {
  $("tab-" + kind).addEventListener("click", () => selectHangarTab(kind));
  $("tab-" + kind).addEventListener("keydown", (event) => {
    const index = tabs.indexOf(kind);
    let next;
    if (event.code === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.code === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    else if (event.code === "Home") next = 0;
    else if (event.code === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectHangarTab(tabs[next]);
    $("tab-" + tabs[next]).focus();
  });
  if (kind !== "levels" && kind !== "shop")
    $(kind + "-list").addEventListener("click", (event) => {
      const preview = event.target.closest("[data-preview]");
      if (preview) {
        previewReward(kind, preview.dataset.preview);
        return;
      }
      const card = event.target.closest("[data-reward]");
      if (card) equipReward(kind, card.dataset.reward);
    });
}
$("close-preview").addEventListener("click", closePreview);
$("level-track").addEventListener("click", (event) => {
  const button = event.target.closest("[data-level-preview]");
  if (!button) return;
  const item = LEVEL_REWARDS[Number(button.dataset.levelPreview) - 1];
  if (item) {
    selectHangarTab(item.kind);
    previewReward(item.kind, item.id);
  }
});
$("level-chapters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-chapter]");
  if (button)
    $("level-" + button.dataset.chapter).scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
});
function equipSkin(id) {
  if (mode === "playing" || mode === "paused") return;
  const skin = SKINS.find((s) => s.id === id);
  if (!skin || !isUnlocked(skin, progress)) return;
  progress.selected = id;
  paintSkin(skin);
  applyLoadout();
  persist();
  refreshHangar();
}
function paintSkin(skin) {
  const id = skin.id;
  for (const mat of rocketMaterials) {
    mat.color.setRGB(...mat.userData.originalColor);
    mat.emissive.setRGB(...mat.userData.originalEmission);
    if (id === "original") continue;
    if (mat.name.includes("Cerámica")) mat.color.set(skin.hull);
    if (mat.name.includes("Esmalte")) mat.color.set(skin.accent);
    if (mat.name.includes("Champán")) mat.color.set(skin.trim);
    if (mat.name.includes("Cristal")) {
      mat.color.set(skin.glass);
      mat.emissive.set(skin.glass).multiplyScalar(0.12);
    }
    if (mat.name.includes("Luz")) {
      mat.color.set(skin.flame);
      mat.emissive.set(skin.flame).multiplyScalar(1.7);
    }
  }
  if (exhaust) {
    exhaust.children[0].material.color.set(skin.flame);
    exhaust.children[1].material.color
      .set(skin.flame)
      .lerp(new THREE.Color("white"), 0.7);
    engineLight.color.set(skin.flame);
  }
  customization?.applySkin(skin);
}
function unlockToast(text) {
  $("reward-toast").textContent = text;
  $("reward-toast").hidden = false;
  toastUntil = visualTime + 5;
  announce(text);
}

function begin() {
  if (mode === "loading" || !rocket) return;
  if (mode === "paused") {
    clearInput();
    setMode("playing");
    $("flight-status").textContent = "FLIGHT IN PROGRESS";
    announce("Game resumed");
    return;
  }
  closePreview();
  applyLoadout();
  selectHangarTab("skin");
  flight = createFlight(
    Math.floor(Math.random() * 1000000),
    progress.selectedAbility,
  );
  customization?.reset();
  flight.contractSet = progress.flights % 3;
  flight.bestBefore = progress.bestTime;
  void music.start();
  for (const mesh of coinMeshes.values()) scene.remove(mesh);
  coinMeshes.clear();
  $("flight-report").hidden = true;
  for (const mesh of meteors.values()) scene.remove(mesh);
  meteors.clear();
  for (const mesh of beamMeshes.values()) scene.remove(mesh);
  beamMeshes.clear();
  for (const mesh of impactMeshes.values()) {
    scene.remove(mesh);
    mesh.material.dispose();
  }
  impactMeshes.clear();
  for (const p of particles) {
    scene.remove(p);
    p.geometry.dispose();
    p.material.dispose();
  }
  particles.length = 0;
  clearInput();
  rocket.position.set(0, 0, 0);
  rocket.rotation.set(0, 0, 0);
  rocket.visible = true;
  $("result").hidden = true;
  $("unlock-notice").hidden = true;
  $("reward-toast").hidden = true;
  setMode("playing");
  $("flight-status").textContent = "FLIGHT IN PROGRESS";
  announce("Flight started. Use W A S D to dodge the meteors.");
}
function pauseFlight() {
  if (mode !== "playing") return;
  clearInput();
  setMode("paused");
  $("eyebrow").textContent = "FLIGHT PAUSED";
  $("screen-title").textContent = "Take a breather.";
  $("description").textContent = "Your rocket will be right here.";
  start.innerHTML = 'RESUME <span aria-hidden="true">↗</span>';
  $("hint").textContent = "Esc to resume";
  $("flight-status").textContent = "PAUSED";
  announce("Game paused");
}
function gameOver() {
  if (mode !== "playing" || flight.recorded) return;
  flight.recorded = true;
  const reward = recordFlight(
    progress,
    flight.time,
    flight.avoided,
    flight.nearMiss,
    flight,
  );
  progress = reward.progress;
  persist();
  refreshHangar();
  $("unlock-notice").hidden = reward.unlocked.length === 0;
  if (reward.unlocked.length)
    $("unlock-notice").textContent =
      `Unlocked: ${reward.unlocked.map((s) => s.name).join(", ")}. Available in your hangar.`;
  setMode("over");
  clearInput();
  if (reward.levelsGained)
    unlockToast(
      `Level ${levelInfo(progress).level} reached · New expedition rewards`,
    );
  $("eyebrow").textContent =
    flight.time > flight.bestBefore ? "NEW PERSONAL BEST" : "FLIGHT REPORT";
  $("screen-title").innerHTML = "Every flight<br>counts.";
  $("description").textContent =
    "Check your score, visit the shop and plan your next flight.";
  $("result").innerHTML =
    `<div>${timeLabel(flight.time)}<span>FLIGHT TIME</span></div><div>${flight.avoided}<span>DODGED</span></div><div>+${reward.xpEarned}<span>EXPERIENCE</span></div>`;
  $("result").hidden = false;
  const completed = reward.report.objectives.filter((item) => item.done).length;
  $("flight-report").innerHTML =
    `<b class="flight-grade">${reward.report.grade}</b><div><strong>◈ +${reward.report.coins} ${reward.report.coins === 1 ? "coin" : "coins"} · combo ${flight.maxCombo}</strong><span>${completed}/3 objectives · ${flight.nearMiss} ${flight.nearMiss === 1 ? "near miss" : "near misses"}</span><small>${levelInfo(progress).level === 50 ? "Maximum level reached" : `Base XP ${reward.report.baseXP} · bonus +${reward.report.bonusXP}`} · Coins have been added to your balance.</small></div>`;
  $("flight-report").hidden = false;
  start.innerHTML = 'FLY AGAIN <span aria-hidden="true">↗</span>';
  $("hint").textContent = "W A S D to move · Esc to pause · M for music";
  $("flight-status").textContent = "FLIGHT COMPLETE";
  announce(
    `Collision. You flew for ${Math.floor(flight.time)} ${Math.floor(flight.time) === 1 ? "second" : "seconds"}.`,
  );
  for (let i = 0; i < 45; i++) {
    const piece = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.06 + rng() * 0.1),
      new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0x65e8ff : 0xffa36b,
        transparent: true,
        opacity: 1,
      }),
    );
    piece.position.copy(rocket.position);
    piece.userData.velocity = new THREE.Vector3(
      (rng() - 0.5) * 9,
      (rng() - 0.5) * 9,
      (rng() - 0.5) * 9,
    );
    piece.userData.life = 1.5 + rng();
    scene.add(piece);
    particles.push(piece);
  }
}
function useAbility() {
  if (mode === "playing" && activateAbility(flight))
    announce(
      ABILITIES.find((a) => a.id === flight.ability).name + " activated",
    );
}
$("ability-control").addEventListener("click", useAbility);
function refreshAbility() {
  const button = $("ability-control"),
    ability = ABILITIES.find((s) => s.id === flight.ability);
  button.hidden = mode !== "playing" || flight.ability === "none";
  if (button.hidden) return;
  const active = !["none", "agility", "shield"].includes(flight.ability);
  $("ability-key").hidden = !active;
  button.disabled =
    !active ||
    flight.cooldown > 0 ||
    (flight.ability === "laser" && flight.laserDelay > 0);
  button.classList.toggle(
    "power-active",
    flight.abilityTime > 0 || flight.shieldFlash > 0 || flight.laserDelay > 0,
  );
  let label = ability.name;
  if (flight.ability === "shield")
    label = flight.shield
      ? "SHIELD · READY"
      : `SHIELD · ${Math.ceil(flight.shieldCooldown)} s`;
  if (flight.ability === "laser")
    label =
      flight.cooldown > 0
        ? `Reloading · ${Math.ceil(flight.cooldown)} s`
        : `LASER · ${flight.laserAmmo}/2`;
  if (!["none", "agility", "shield", "laser"].includes(flight.ability))
    label =
      flight.abilityTime > 0
        ? `${ability.name} · ${flight.abilityTime.toFixed(1)} s`
        : flight.cooldown > 0
          ? `${ability.name} · ${Math.ceil(flight.cooldown)} s`
          : ability.name;
  $("ability-label").textContent = label;
  button.setAttribute(
    "aria-label",
    active ? `${label}. Press Space to activate.` : label,
  );
}
start.addEventListener("click", () => {
  if (mode === "error") location.reload();
  else begin();
});
pause.addEventListener("click", pauseFlight);
addEventListener("keydown", (event) => {
  if (event.code === "KeyM" && !event.repeat) {
    event.preventDefault();
    toggleMusic();
    return;
  }
  if (event.code in keyMap) {
    if (mode === "playing") {
      event.preventDefault();
      input[keyMap[event.code]] = true;
    }
    return;
  }
  if (event.code === "Escape") {
    event.preventDefault();
    if (mode === "playing") pauseFlight();
    else if (mode === "paused") begin();
  }
  if (event.code === "Space" && mode === "playing") {
    event.preventDefault();
    if (!event.repeat) useAbility();
    return;
  }
  if (
    event.code === "Space" &&
    mode !== "playing" &&
    event.target === document.body
  ) {
    event.preventDefault();
    if (!start.disabled) begin();
  }
});
addEventListener("keyup", (event) => {
  if (event.code in keyMap) input[keyMap[event.code]] = false;
});
addEventListener("blur", () => {
  clearInput();
  pauseFlight();
});
document.addEventListener("visibilitychange", () => {
  void music.setHidden(document.hidden);
  if (document.hidden) {
    clearInput();
    pauseFlight();
  }
  last = 0;
});
document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (mode === "playing") {
      button.setPointerCapture(event.pointerId);
      input[button.dataset.move] = true;
    }
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(name, () => {
      input[button.dataset.move] = false;
    });
});

function makeRocket(data) {
  const holder = new THREE.Group(),
    model = new THREE.Group();
  holder.add(model);
  const materials = data.materials.map((m) => {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(...m.baseColor.slice(0, 3)),
      metalness: Math.min(m.metallic, 0.6),
      roughness: Math.max(0.2, m.roughness),
      emissive: new THREE.Color(...m.emissive),
    });
    material.name = m.name;
    material.userData.originalColor = m.baseColor.slice(0, 3);
    material.userData.originalEmission = m.emissive;
    material.userData.originalMetalness = material.metalness;
    material.userData.originalRoughness = material.roughness;
    return material;
  });
  rocketMaterials = materials;
  for (const mesh of data.meshes) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(mesh.positions, 3),
    );
    geo.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(mesh.normals, 3),
    );
    geo.setIndex(mesh.indices);
    geo.computeBoundingSphere();
    const object = new THREE.Mesh(geo, materials[mesh.material]);
    object.name = mesh.name;
    model.add(object);
  }
  // The actual Blender model flies nose first, with its porthole on the upper side.
  model.rotation.set(Math.PI, 0, (-25 * Math.PI) / 180);
  model.scale.setScalar(0.46);
  exhaust = new THREE.Group();
  exhaust.position.set(0, 0, 1.37);
  const outer = new THREE.Mesh(
    new THREE.ConeGeometry(0.21, 1.25, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x1ed2f4,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  outer.rotation.x = Math.PI / 2;
  outer.position.z = 0.55;
  exhaust.add(outer);
  const inner = new THREE.Mesh(
    new THREE.ConeGeometry(0.095, 0.88, 20),
    new THREE.MeshBasicMaterial({
      color: 0xc1f9ff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  inner.rotation.x = Math.PI / 2;
  inner.position.z = 0.33;
  exhaust.add(inner);
  holder.add(exhaust);
  shieldBubble = new THREE.Mesh(
    new THREE.SphereGeometry(1, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0x77dfff,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  shieldBubble.scale.set(1.03, 0.85, 1.94);
  shieldBubble.visible = false;
  holder.add(shieldBubble);
  laserEmitter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.065, 0.15, 12),
    new THREE.MeshStandardMaterial({
      color: 0xa896d2,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x9966bb,
      emissiveIntensity: 0.5,
    }),
  );
  laserEmitter.rotation.x = Math.PI / 2;
  laserEmitter.position.z = -1.75;
  laserEmitter.visible = false;
  holder.add(laserEmitter);
  engineLight = new THREE.PointLight(0x26c8ff, 6, 6, 2);
  engineLight.position.set(0, 0, 1.8);
  holder.add(engineLight);
  scene.add(holder);
  customization = createCustomization(scene, holder, materials, camera);
  return holder;
}
function resize() {
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 1 ? 64 : 54;
  cameraDistance = Math.max(13.5, 11 / camera.aspect);
  camera.updateProjectionMatrix();
  world?.resize();
}
function updateMeteors(dt) {
  const live = new Set(flight.asteroids.map((a) => a.id));
  for (const [id, mesh] of meteors) {
    if (!live.has(id)) {
      scene.remove(mesh);
      meteors.delete(id);
    }
  }
  for (const a of flight.asteroids) {
    let mesh = meteors.get(a.id);
    if (!mesh) {
      mesh = world.makeMeteor(a);
      mesh.rotation.set(rng() * 6, rng() * 6, rng() * 6);
      scene.add(mesh);
      meteors.set(a.id, mesh);
    }
    mesh.position.set(a.x, a.y, a.z);
    mesh.rotation.x += dt * a.spin * 0.4;
    mesh.rotation.y += dt * 0.23;
  }
}
function updateCoins(dt) {
  const ids = new Set(flight.coins.map((coin) => coin.id));
  for (const [id, mesh] of coinMeshes) {
    if (!ids.has(id)) {
      scene.remove(mesh);
      coinMeshes.delete(id);
    }
  }
  for (const coin of flight.coins) {
    let mesh = coinMeshes.get(coin.id);
    if (!mesh) {
      mesh = new THREE.Group();
      mesh.add(
        new THREE.Mesh(coinGeometry, coinMaterials[coin.value === 5 ? 1 : 0]),
      );
      mesh.add(new THREE.Mesh(coinRingGeometry, coinRingMaterial));
      mesh.scale.setScalar(coin.value === 5 ? 1.2 : 1);
      scene.add(mesh);
      coinMeshes.set(coin.id, mesh);
    }
    mesh.position.set(coin.x, coin.y, coin.z);
    mesh.quaternion.copy(camera.quaternion);
    mesh.rotateZ(0.15 * Math.sin(visualTime + coin.id));
    mesh.visible = mode === "playing" || mode === "paused";
  }
}
function refreshFlightFeatures() {
  $("run-coins").textContent = flight.coinsCollected;
  $("flight-panel").classList.toggle("coin-flash", flight.coinFlash > 0);
  $("combo-meter").hidden = flight.combo === 0;
  $("combo-count").textContent = "COMBO ×" + flight.combo;
  $("combo-fill").style.width = (flight.comboTime / 8) * 100 + "%";
  $("encounter-panel").hidden = !flight.encounter;
  if (flight.encounter) {
    $("encounter-name").textContent = flight.encounter.name;
    $("encounter-name").style.color = flight.encounter.color;
    $("encounter-hint").textContent = flight.encounter.hint;
  }
}
function updateLaserVisuals() {
  const ids = new Set(flight.projectiles.map((p) => p.id));
  for (const [id, mesh] of beamMeshes) {
    if (!ids.has(id)) {
      scene.remove(mesh);
      beamMeshes.delete(id);
    }
  }
  for (const p of flight.projectiles) {
    let beam = beamMeshes.get(p.id);
    if (!beam) {
      beam = new THREE.Mesh(beamGeometry, beamMaterial);
      scene.add(beam);
      beamMeshes.set(p.id, beam);
    }
    beam.position.set(p.x, p.y, p.z + 1.55);
  }
  const hits = new Set(flight.laserHits.map((hit) => hit.id));
  for (const [id, mesh] of impactMeshes) {
    if (!hits.has(id)) {
      scene.remove(mesh);
      mesh.material.dispose();
      impactMeshes.delete(id);
    }
  }
  for (const hit of flight.laserHits) {
    let mesh = impactMeshes.get(hit.id);
    if (!mesh) {
      mesh = new THREE.Mesh(
        impactGeometry,
        new THREE.MeshBasicMaterial({
          color: 0xf0d3ff,
          transparent: true,
          opacity: 1,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      scene.add(mesh);
      impactMeshes.set(hit.id, mesh);
    }
    const age = flight.time - hit.time;
    mesh.position.set(hit.x, hit.y, hit.z);
    mesh.quaternion.copy(camera.quaternion);
    mesh.scale.setScalar(1 + age * 12);
    mesh.material.opacity = Math.max(0, 1 - age / 0.45);
  }
}
let shockwaves = [],
  powerCloud;
function makePowerVisuals() {
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.028, 6, 100),
      new THREE.MeshBasicMaterial({
        color: 0xffcf85,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    ring.visible = false;
    ring.userData.index = i;
    scene.add(ring);
    shockwaves.push(ring);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(2048 * 3), 3),
  );
  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(2048 * 3), 3),
  );
  geometry.setDrawRange(0, 0);
  powerCloud = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.24,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  powerCloud.frustumCulled = false;
  scene.add(powerCloud);
}
function updatePowerVisuals() {
  if (!powerCloud) return;
  const visible = mode === "playing" || mode === "paused",
    nova = flight.ability === "nova",
    duration = nova ? 1.5 : 0.8;
  for (const ring of shockwaves) {
    const i = ring.userData.index;
    ring.visible = visible && flight.powerFlash > 0;
    ring.position.set(flight.x, flight.y, -7 - i * 2);
    const phase = 1 - flight.powerFlash / duration;
    ring.scale.setScalar(1 + phase * (nova ? 50 : 16) * (1 - i * 0.13));
    ring.rotation.set(i * 0.65, i * 0.38, flight.time * 0.3);
    ring.material.color.set(nova ? "#ffcf85" : "#88dfff");
    ring.material.opacity = (flight.powerFlash / duration) * 0.65;
  }
  const pos = powerCloud.geometry.attributes.position,
    colors = powerCloud.geometry.attributes.color;
  let count = 0;
  if (visible)
    for (const effect of flight.powerEffects) {
      const age = flight.time - effect.time;
      if (age < 0 || age > 1.3) continue;
      for (let i = 0; i < 18 && count < 2048; i++) {
        const angle = i * 2.399 + effect.id,
          r = ((0.3 + age * 7) * ((i % 3) + 1)) / 3,
          z = (i / 9 - 1) * r,
          c = new THREE.Color(
            i % 3 === 0 ? "#fff2ce" : nova ? "#ffae64" : "#8acfff",
          ).multiplyScalar(1 - age / 1.3);
        pos.setXYZ(
          count,
          effect.x + Math.cos(angle) * r,
          effect.y + Math.sin(angle) * r,
          effect.z + z,
        );
        colors.setXYZ(count, c.r, c.g, c.b);
        count++;
      }
    }
  pos.needsUpdate = true;
  colors.needsUpdate = true;
  powerCloud.geometry.setDrawRange(0, count);
  root.classList.toggle(
    "nova-active",
    visible && nova && flight.powerFlash > 0,
  );
}
function animate(stamp) {
  requestAnimationFrame(animate);
  const dt = last ? Math.min((stamp - last) / 1000, 0.05) : 0;
  last = stamp;
  if (mode !== "paused") visualTime += dt;
  if (mode === "playing") {
    stepFlight(flight, dt, input);
    const milestone = recordLiveMilestone(progress, flight.time);
    if (milestone) {
      progress = milestone.progress;
      persist();
      refreshHangar();
      if (milestone.unlocked.length)
        unlockToast(
          "Unlocked: " + milestone.unlocked.map((item) => item.name).join(", "),
        );
    }
    const bonus = flightBonuses(flight, flight.contractSet).bonusXP;
    $("run-xp").textContent =
      flight.time < 15
        ? "XP AFTER 15 s"
        : `FLIGHT · +${flightXP(flight.time, flight.avoided, flight.nearMiss) + bonus} XP`;
    $("flight-status").textContent =
      flight.pressure > 0.75
        ? "DANGER ZONE · KEEP MOVING"
        : flight.waveAlert > 0
          ? "INCOMING WAVE"
          : "FLIGHT IN PROGRESS";
    $("hazard-warning").hidden =
      flight.pressure <= 0.75 && flight.waveAlert <= 0;
    $("hazard-warning").textContent =
      flight.pressure > 0.75
        ? "DANGER ZONE · CHANGE POSITION"
        : "INCOMING WAVE · FIND A GAP";
    if (flight.crashed) gameOver();
  }
  refreshAbility();
  refreshFlightFeatures();
  if (toastUntil && visualTime > toastUntil) {
    $("reward-toast").hidden = true;
    toastUntil = 0;
  }
  if (rocket) {
    if (mode === "ready" || (mode === "over" && previewing)) {
      // Show the same flight view on the start screen, shifted clear of its title.
      rocket.position.set(
        camera.aspect < 1 ? 1.8 : 0.5,
        1.1 + Math.sin(visualTime * 0.7) * 0.12,
        0,
      );
      rocket.rotation.set(0.08, Math.sin(visualTime * 0.24) * 0.12, -0.08);
    } else if (mode !== "paused") {
      rocket.position.set(flight.x, flight.y, 0);
      rocket.rotation.z = THREE.MathUtils.lerp(
        rocket.rotation.z,
        -flight.vx * 0.035,
        1 - Math.exp(-9 * dt),
      );
      rocket.rotation.x = THREE.MathUtils.lerp(
        rocket.rotation.x,
        flight.vy * 0.025,
        1 - Math.exp(-9 * dt),
      );
      rocket.rotation.y = THREE.MathUtils.lerp(
        rocket.rotation.y,
        -flight.vx * 0.012,
        1 - Math.exp(-9 * dt),
      );
    }
    rocket.scale.setScalar(
      flight.ability === "focus" &&
        flight.abilityTime > 0 &&
        (mode === "playing" || mode === "paused")
        ? 0.7
        : 1,
    );
    shieldBubble.visible =
      mode === "playing" && (flight.shield > 0 || flight.shieldFlash > 0);
    shieldBubble.material.opacity =
      flight.shieldFlash > 0 ? 0.12 + flight.shieldFlash * 0.55 : 0.1;
    root.classList.toggle(
      "time-slow",
      mode === "playing" && flight.ability === "slow" && flight.abilityTime > 0,
    );
    exhaust.visible = mode !== "over";
    exhaust.scale.set(
      1,
      1,
      (flight.ability === "dash" && flight.abilityTime > 0 ? 1.9 : 0.9) +
        Math.sin(visualTime * 46) * 0.09 +
        rng() * 0.08,
    );
    if (mode === "ready" || previewing) {
      camera.position.set(0, 3.9 * (cameraDistance / 13.5), cameraDistance);
      camera.lookAt(0, 0.2, -16);
      camera.updateMatrixWorld(true);
    } else followRocket(camera, rocket.position, cameraDistance);
  }
  customization?.update(
    dt,
    visualTime,
    mode === "over" && previewing ? "ready" : mode,
  );
  world?.update(mode === "paused" ? 0 : dt);
  updatePowerVisuals();
  updateMeteors(mode === "paused" ? 0 : dt);
  updateCoins(mode === "paused" ? 0 : dt);
  updateLaserVisuals();
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.userData.life -= dt;
    p.position.addScaledVector(p.userData.velocity, dt);
    p.material.opacity = Math.max(0, p.userData.life / 2);
    p.rotation.x += dt;
    if (p.userData.life <= 0) {
      scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
      particles.splice(i, 1);
    }
  }
  $("timer").textContent = timeLabel(flight.time);
  $("distance").textContent = Math.floor(flight.distance).toLocaleString(
    "en-US",
  );
  $("speed").textContent = Math.round(
    flight.speed *
      3.6 *
      (flight.ability === "slow" && flight.abilityTime > 0 ? 0.48 : 1),
  );
  renderer.render(scene, camera);
}
async function init() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06121b);
    scene.fog = new THREE.FogExp2(0x09212b, 0.005);
    camera = new THREE.PerspectiveCamera(54, 1, 0.1, 400);
    camera.position.set(0, 3.9, 13.5);
    camera.lookAt(0, 0, -16);
    scene.add(new THREE.HemisphereLight(0xc9eaff, 0x365465, 2.5));
    const key = new THREE.DirectionalLight(0xffe6ce, 3.5);
    key.position.set(-8, 13, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x4bc5e8, 3.6);
    rim.position.set(5, 2, -15);
    scene.add(rim);
    world = createWorld(scene, camera);
    world.setMeteor(
      METEORS.find((item) => item.id === progress.selectedMeteor),
    );
    makePowerVisuals();
    resize();
    addEventListener("resize", resize);
    requestAnimationFrame(animate);
    await world.setEnvironment(
      ENVIRONMENTS.find((item) => item.id === progress.selectedEnvironment),
    );
    const response = await fetch("./assets/rocket.json");
    if (!response.ok) throw new Error("Could not load the rocket");
    const asset = await response.json();
    if (!asset.meshes?.length) throw new Error("The rocket model is empty");
    rocket = makeRocket(asset);
    equipSkin(progress.selected);
    setMode("ready");
    start.disabled = false;
    start.innerHTML = 'START FLIGHT <span aria-hidden="true">↗</span>';
    if (matchMedia("(pointer:coarse)").matches)
      $("hint").textContent = "Use the touch arrows to move the rocket.";
    announce("Rocket ready. Press Start flight to play.");
  } catch (error) {
    setMode("error");
    $("eyebrow").textContent = "UNABLE TO START";
    $("screen-title").textContent = "The flight will have to wait.";
    $("description").textContent =
      "Check your connection and make sure 3D graphics are enabled in your browser.";
    start.disabled = false;
    start.textContent = "RETRY";
    $("hint").textContent = "Reload the game to try again.";
    console.error(error);
  }
}
init();
