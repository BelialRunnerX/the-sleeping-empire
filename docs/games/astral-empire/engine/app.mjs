import { mainMenuMarkup, menuSettingsMarkup } from "./main-menu.mjs";
import { updateCombatAssist } from "./combat-assist.mjs";
import {
  HEROES,
  SKILLS,
  SUPPORTS,
  PROFESSIONS,
  RECIPES,
  QUESTS,
  REALMS,
  AFFIXES,
} from "./content.mjs";
import {
  freshState,
  migrateState,
  stats,
  skillStats,
  allocate,
  refund,
  professionLevel,
  gather,
  harvestCrop,
  gatherYield,
  craft,
  alterItem,
  claimQuest,
  questStatus,
  summon,
  Simulation,
  hitBreakdown,
  recruitScout,
  clamp,
  addXP,
} from "./simulation.mjs";
import { loadNative, numeric } from "./native.mjs";
import { Profiles } from "./profiles.mjs";
import { WorldView } from "./world.mjs";
import { readVisualSettings } from "./art.mjs";
import { CAMERA_KEY } from "./camera.mjs";
import { discover, useFeature } from "./frontier.mjs";
import { routeTo } from "./navigation.mjs";
import { loadSurfaces } from "./surfaces.mjs";
import { loadAvatarRigs, loadCustomFemale } from "./avatar-rig.mjs";
import { ControllerInput, ControllerBuildHold, controllerActions, controllerMenuDirection, targetInView } from "./controller.mjs";
import { loadFieldArt } from "./field-art.mjs";
import { buildCoreDrill, extractCore, shiftCoreField } from "./geology-field.mjs";
import { geologyPanel, updateGeologyPanel } from "./geology-ui.mjs";
import { terrainPanel, useTerrainTool } from "./terrain-tools.mjs";
import { findTerrainSpawn } from "./terrain-collision.mjs";
import { buildNursery, cropReadyAt, plantCrop } from "./nursery.mjs";
import { nurseryPanel, updateNurseryPanel } from "./nursery-ui.mjs";
import {
  GEODE_MATERIALS,
  GEODE_STAGES,
  geodeStage,
} from "./geodes.mjs";
import {
  WEAPON_FORMS,
  ARMOR_FORMS,
  ITEM_FRAMES,
  ASCENSION_PATHS,
  ascensionTier,
  ascensionCost,
  equipmentPower,
  equippedForm,
} from "./arsenal.mjs";
import {
  ATTRIBUTES,
  RACES,
  CLASSES,
  originFor,
  classFor,
  attributeTotals,
  attributeBudget,
  passiveBudget,
  assignAttribute,
} from "./codex.mjs";
import { constellationPanel, mountConstellation } from "./constellation-ui.mjs";
import {
  STATIONS,
  MATERIAL_NAMES,
  settleProduction,
  buildStation,
  upgradeStation,
  enqueueProcessing,
  cancelProcessing,
  collectProduction,
} from "./artisan.mjs";
import { artisanPanel, jobTime } from "./artisan-ui.mjs";
const $ = (id) => document.getElementById(id),
  escape = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const fmt = (n) => Math.round(n).toLocaleString(),
  profiles = new Profiles(localStorage),
  keys = new Set();
const visuals = readVisualSettings(
  localStorage,
  innerWidth < 700,
  matchMedia("(prefers-reduced-motion: reduce)").matches,
);
let terrainTool = "off";
let state = freshState(),
  sim = new Simulation(state),
  view,
  playing = false,
  atMainMenu = false,
  panel = null,
  gathering = null,
  lastFrame = 0,
  lastHud = 0,
  lastSave = 0,
  lastProduction = 0,
  trackedStation = null,
  travel = null,
  combatClick = false,
  freeLook = false,
  lastDiscovery = 0,
  declarationRequired = false,
  noticeId = 0,
  holdingAttack = false,
  touchPrimaryHeld = false,
  muted = false,
  audio;
const controller=new ControllerInput();
let activePad=null, padNavAt=0, padLabel="";
const tabs = [
  ["nursery", "Hydroponics"],
  ["geology", "Core drilling"],
  ["terrain", "Terrain tools"],
  ["inventory", "Equipment"],
  ["skills", "Skill links"],
  ["passives", "Constellation"],
  ["lifeskills", "Lifeskills"],
  ["crafting", "Workshop"],
  ["artisan", "Atelier"],
  ["heroes", "Appearances"],
  ["codex", "Codex"],
  ["journal", "Journal"],
  ["frontier", "Survey"],
  ["realms", "Waygates"],
  ["settings", "Settings"],
];
const menuGroups = [
  ["Character", ["codex", "inventory", "skills", "passives", "heroes"]],
  ["Fieldwork", ["frontier", "terrain", "journal", "realms"]],
  ["Industry", ["lifeskills", "crafting", "artisan", "nursery", "geology"]],
  ["Game", ["settings"]],
];
function menuNavigation(active) {
  return `<nav class="panel-tabs" aria-label="Game menus">${menuGroups
    .map(
      ([name, ids]) =>
        `<div class="menu-group"><span>${name}</span>${ids
          .map(
            (id) =>
              `<button data-panel="${id}" ${id === active ? 'class="active" aria-current="page"' : ""}>${tabs.find((tab) => tab[0] === id)[1]}</button>`,
          )
          .join("")}</div>`,
    )
    .join("")}</nav>`;
}
function notify(message) {
  const node = document.createElement("div");
  node.className = "notification";
  node.textContent = message;
  $("notifications").append(node);
  setTimeout(() => node.remove(), 5000);
  while ($("notifications").children.length > 4)
    $("notifications").firstChild.remove();
}
function sound(frequency = 440) {
  if (muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * 0.5,
      audio.currentTime + 0.12,
    );
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);
    oscillator.type = "triangle";
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.18);
  } catch {}
}
function save() {
  if (!playing) return;
  try {
    settleProduction(state);
    const time = Date.now();
    for (const id of Object.keys(state.depleted))
      if (state.depleted[id] <= time) delete state.depleted[id];
    for (const id of Object.keys(state.defeated))
      if (state.defeated[id] <= time) delete state.defeated[id];
    profiles.save(state);
    $("save-state").textContent = "Saved";
    lastSave = performance.now();
  } catch {
    $("save-state").textContent = "Save failed";
    notify(
      "Browser storage is full or unavailable. Export your save from Settings.",
    );
  }
}
function buildView() {
  if (view) view.dispose();
  sim = new Simulation(state);
  let camera;
  try {
    camera = JSON.parse(localStorage.getItem(CAMERA_KEY));
  } catch {}
  view = new WorldView($("world"), state, sim, visuals, camera);
  state.position = { x: sim.player.x, z: sim.player.z };
  travel = null;
  gathering = null;
  lastDiscovery = 0;
  if (playing) renderBar();
  if(state.avatarBody==="female"){const expected=view;loadCustomFemale().then(()=>{if(view===expected&&state.avatarBody==="female")view.setHero();}).catch(e=>notify("Female model unavailable; existing appearance shown. "+e.message));}
}
function landing() {
  atMainMenu = false;
  $("landing").classList.remove("main-menu");
  playing = false;
  declarationRequired = false;
  cancelTravel();
  document.body.classList.remove("scenic-view");
  panel = null;
  keys.clear();
  $("panels").hidden = true;
  $("hud").hidden = true;
  $("landing").hidden = false;
  $("landing").innerHTML =
    `<section class="landing-copy">${profiles.active ? '<button data-action="menu-back">← Back to main menu</button>' : ""}<div class="landing-ornament">✧ &nbsp; THE SLEEPING EMPIRE</div><h1>Elysium<em>ASTRAL EMPIRE</em></h1><div class="landing-rule"></div><p>Beyond the veil, a world is waking.<br>Forge your own path through steel, starlight, and the quiet art of living.</p><div class="profile-list">${profiles
      .list()
      .map(
        (p) =>
          `<button data-profile="${escape(p.name)}">${escape(p.name)}</button>`,
      )
      .join(
        "",
      )}</div><form id="login-form"><div class="auth-fields"><label>COMMANDER NAME<input id="profile-name" maxlength="24" autocomplete="username" placeholder="Your name" required></label><label>LOCAL PIN<input id="profile-pin" type="password" minlength="4" maxlength="12" autocomplete="current-password" placeholder="4–12 characters" required></label></div><div class="auth-actions"><button class="gold-button" type="submit">CONTINUE →</button><button type="button" data-action="create">NEW ADVENTURE</button></div><div class="auth-error" id="auth-error" role="alert"></div></form><p class="local-note">Single-player frontier · Local profiles and automatic saves.<br>Export your progress to carry it to another browser.</p></section><div class="realm-badge"><span>CHAPTER I · THE EMERALD FRONTIER</span><b>A world waiting to be lived in.</b></div><footer class="landing-footer"><a href="../../">← Living Codex</a><a href="classic.html">Classic gacha RPG</a><span>V3.18.0 · Editable Frontier</span></footer>`;
}
function enter(create) {
  try {
    const name = $("profile-name").value,
      pin = $("profile-pin").value;
    state = profiles.login(name, pin, create);
    mainMenu();
  } catch (error) {
    $("auth-error").textContent = error.message;
  }
}
function mainMenu(settingsPage = false) {
  if (!profiles.active) return landing();
  if (playing) save();
  playing = false;
  atMainMenu = true;
  declarationRequired = false;
  cancelTravel();
  gathering = null;
  holdingAttack = false;
  touchPrimaryHeld = false;
  keys.clear();
  panel = null;
  document.body.classList.remove("scenic-view");
  $("panels").hidden = true;
  $("hud").hidden = true;
  $("landing").hidden = false;
  $("landing").classList.add("main-menu");
  $("landing").innerHTML = settingsPage
    ? menuSettingsMarkup(visuals, assist, muted)
    : mainMenuMarkup(profiles.active, state);
  $("landing").querySelector("button")?.focus();
}
function launchWorld() {
  if (!atMainMenu || !profiles.active) return;
  try {
    buildView();
    playing = true;
    atMainMenu = false;
    $("landing").hidden = true;
    $("hud").hidden = false;
    panel = null;
    declarationRequired = !state.race || !state.calling;
    renderBar();
    updateHUD();
    if (declarationRequired) openPanel("codex");
    sound(660);
    save();
  } catch (error) {
    playing = false;
    atMainMenu = true;
    $("landing").hidden = false;
    $("hud").hidden = true;
    notify("Could not enter the world: " + error.message);
  }
}

function renderBar() {
  $("skillbar").innerHTML =
    SKILLS.map((base) => skillStats(state, base.id))
      .map(
        (s) =>
          `<button class="skill" data-skill="${s.id}" title="${escape(s.name)} · ${s.cost} mana"><span>${s.icon}</span><small>${s.key}</small><i class="cooldown" id="cd-${s.id}"></i><b class="cooldown-text" id="ct-${s.id}"></b></button>`,
      )
      .join("") +
    `<button class="skill potion" data-action="potion" title="Trauma injector [F]"><span>♧</span><small id="potion-count">F · ${state.resources.potions}</small><i class="cooldown" id="cd-potion"></i><b class="cooldown-text" id="ct-potion"></b></button>`;
}
function updateHUD() {
  const p = sim.player,
    st = stats(state),
    hero = HEROES.find((h) => h.id === state.hero);
  $("hero-name").textContent = hero.name;
  const heroIndex = HEROES.indexOf(hero);
  $("hero-glyph").textContent = "";
  $("hero-glyph").classList.add("anime-portrait");
  $("hero-glyph").style.backgroundPosition =
    `${(heroIndex % 3) * 50}% ${Math.floor(heroIndex / 3) * (100 / 3)}%`;
  $("hero-glyph").setAttribute("aria-label", hero.name + " portrait");
  $("class-name").textContent = classFor(state).name.toUpperCase();
  $("level").textContent = "LV. " + state.level;
  $("life-fill").style.width = clamp((p.hp / st.life) * 100, 0, 100) + "%";
  $("life-text").textContent = fmt(p.hp) + " / " + fmt(st.life);
  $("mana-fill").style.width = (p.mana / st.mana) * 100 + "%";
  $("stamina-fill").style.width = p.stamina + "%";
  $("xp-fill").style.width = (state.xp / (state.level * 100)) * 100 + "%";
  $("potion-count").textContent = "F · " + state.resources.potions;
  $("realm-name").textContent = REALMS.find((r) => r.id === state.realm).name;
  $("coordinates").textContent = Math.round(p.x) + " , " + Math.round(p.z);
  $("zone-label").textContent = sim.layout.biome(p.x, p.z);
  $("mana-text").textContent =
    fmt(p.mana) +
    " / " +
    fmt(st.mana) +
    (state.shieldUntil > Date.now() ? " · SHIELDED" : "");
  for (const skill of SKILLS) {
    const left = sim.cooldowns[skill.id] || 0,
      full = skillStats(state, skill.id).cooldown;
    $("cd-" + skill.id).style.height = (left / full) * 100 + "%";
    $("ct-" + skill.id).textContent = left > 0 ? left.toFixed(1) : "";
  }
  $("cd-potion").style.height = (sim.potionCD / 12) * 100 + "%";
  $("ct-potion").textContent = sim.potionCD > 0 ? Math.ceil(sim.potionCD) : "";
  const nearestTarget = sim.nearest(16);
  const target =
    sim.locked?.hp > 0
      ? sim.locked
      : nearestTarget &&
          (nearestTarget.hp < nearestTarget.max ||
            (!nearestTarget.training && nearestTarget.phase !== "idle"))
        ? nearestTarget
        : null;
  $("target-hud").hidden = !target;
  if (target) {
    $("target-name").textContent =
      target.name +
      (target.enraged ? " · AWAKENED" : "") +
      " · Lv. " +
      target.level;
    $("target-life").style.width =
      clamp((target.hp / target.max) * 100, 0, 100) + "%";
    const intent = {
      arrow: "PINNING SHOT · SIDESTEP",
      eruption: "ERUPTION · LEAVE THE CIRCLE",
      storm: "STAR STORM · EVADE THE BOLTS",
      claw: "SHADOW CLAW · EVADE",
      cleave: "CHARGED CLEAVE · EVADE",
    };
    const ailments = [
      target.burnTime > 0 ? "BURNING" : "",
      target.chill > 0 ? "CHILLED" : "",
      target.shock > 0 ? "SHOCKED" : "",
      target.expose > 0 ? "EXPOSED" : "",
      target.weaken > 0 ? "WEAKENED" : "",
    ].filter(Boolean);
    $("target-intent").textContent =
      (target.phase === "windup"
        ? intent[target.move]
        : target.phase === "recover"
          ? "RECOVERING · STRIKE NOW"
          : sim.locked === target
            ? "TARGET LOCKED"
            : "Q · LOCK TARGET") +
      (ailments.length ? " / " + ailments.join(" · ") : "");
  }
  const objective = QUESTS.find((q) => { const status = questStatus(state, q); return status.unlocked && !status.claimed; });
  if (objective) {
    const progress = questStatus(state, objective).value;
    $("objective-title").textContent = objective.name;
    $("objective-text").textContent =
      objective.description +
      " " +
      Math.min(progress, objective.goal) +
      " / " +
      objective.goal + (questStatus(state, objective).ready ? " · Open Journal to claim supplies." : "");
  } else {
    $("objective-title").textContent = "Beyond the horizon";
    $("objective-text").textContent =
      "Improve your build, master professions, and open new waygates.";
  }
  const nearby = nearestInteraction();
  $("interaction").hidden = !!panel || !nearby;
  if (nearby?.type === "terrain") {
    $("interact-name").textContent = nearby.name;
    $("interact-detail").textContent = "Aim camera at ground · E / Interact";
  } else if (nearby?.type === "geology") {
    $("interact-name").textContent = "Dawnwake core drill";
    $("interact-detail").textContent = "Finite source-derived cobalt deposits";
  } else if (nearby?.type === "microvoxel") {
    $("interact-name").textContent = nearby.name;
    $("interact-detail").textContent = "E / Interact: carve one 6.25 cm cell";
  } else if (nearby?.type === "nursery") {
    $("interact-name").textContent = nearby.name;
    const ready = state.nursery.plots.filter((crop) => crop && cropReadyAt(crop) <= Date.now()).length;
    $("interact-detail").textContent = state.nursery.tier
      ? state.nursery.plots.length + " beds · " + ready + " ready"
      : "Construction blueprint · E to inspect";
  } else if (nearby?.type === "station") {
    const station = nearby;
    $("interact-name").textContent = station.name;
    const production = state.production.stations[station.id];
    $("interact-detail").textContent = production.tier
      ? "Tier " +
        production.tier +
        " · " +
        production.jobs.length +
        " queued · " +
        production.completed +
        " ready"
      : "Construction blueprint · E to open Atelier";
  } else if (nearby?.type === "feature") {
    $("interact-name").textContent = nearby.name;
    $("interact-detail").textContent = featureStatus(nearby);
  } else if (nearby) {
    const node = nearby;
    const job = PROFESSIONS.find(
      (p) => p.node === (node.kind === "rock" ? "ore" : node.kind),
    );
    $("interact-name").textContent =
      node.kind === "geode"
        ? GEODE_MATERIALS[node.material].name + " geode"
        : node.name || resourceName(node.kind);
    $("interact-detail").textContent = gathering
      ? "Gathering… stay still"
      : node.kind === "geode"
        ? GEODE_STAGES[geodeStage(state.depleted[node.id])] +
          " · " +
          GEODE_MATERIALS[node.material].purpose
        : job.name + " · Mastery " + professionLevel(state, job.id);
  }
  $("gather-progress").style.width = gathering
    ? (1 - gathering.left / gathering.total) * 100 + "%"
    : "0%";
  drawMap();
  updateStationLabels();
  updateFrontierLabels();
  $("travel-status").textContent = travel
    ? "Heading to " +
      (travel.target.name ||
        (travel.target.type === "node"
          ? resourceName(travel.target.kind)
          : "waypoint"))
    : "";
  $("artisan-ready").textContent =
    Object.values(state.production.stations).reduce(
      (total, s) => total + s.completed,
      0,
    ) || "";
}
function resourceName(kind) {
  return {
    ore: "Cobalt outcrop",
    tree: "Lumenwood tree",
    herb: "Starleaf cluster",
    fish: "Moonfin shallows",
    rock: "Mineral boulder",
    geode: "Crystal cluster",
    wreck: "Drone wreck",
  }[kind];
}
function featureStatus(f) {
  const changed = state.exploration.changed.includes(f.id);
  return f.kind === "beacon"
    ? changed
      ? "Synchronized · Return to base"
      : "Synchronize for telemetry"
    : f.kind === "rubble"
      ? changed
        ? "Cleared"
        : "Clear for minerals"
      : changed
        ? "Opened"
        : "Open for supplies";
}
function updateFrontierLabels() {
  const root = $("frontier-labels");
  for (const f of view.features) {
    let label = root.querySelector(`[data-world-feature="${f.id}"]`);
    const distance = Math.hypot(sim.player.x - f.x, sim.player.z - f.z);
    const point = view.project(
      f.x,
      view.height(f.x, f.z) + f.height + 0.22,
      f.z,
    );
    const changed = state.exploration.changed.includes(f.id);
    if (
      panel ||
      !point.visible ||
      distance > 16 ||
      (changed && f.kind !== "beacon")
    ) {
      label?.remove();
      continue;
    }
    if (!label) {
      label = document.createElement("button");
      label.className = "frontier-label";
      label.dataset.worldFeature = f.id;
      label.textContent =
        (f.kind === "cache" ? "◇ " : f.kind === "beacon" ? "✧ " : "⬡ ") +
        f.name;
      root.append(label);
    }
    label.style.left = point.x + "px";
    label.style.top = point.y + "px";
    label.title = featureStatus(f);
  }
}
function updateStationLabels() {
  $("station-labels").innerHTML = view.workstations.entries
    .map(({ def }) => {
      const station = state.production.stations[def.id],
        distance = Math.hypot(sim.player.x - def.x, sim.player.z - def.z);
      if (
        distance > 24 ||
        (distance > 7 && trackedStation !== def.id && !station.completed)
      )
        return "";
      const point = view.project(def.x, 3.0, def.z);
      if (
        !point.visible ||
        point.x < 0 ||
        point.x > innerWidth ||
        point.y < 0 ||
        point.y > innerHeight
      )
        return "";
      return `<button class="station-label ${station.completed ? "ready" : ""}" data-world-station="${def.id}" style="left:${point.x}px;top:${point.y}px"><b>${def.icon} ${def.name}</b><small>${station.completed ? station.completed + " ORDERS READY" : station.tier ? "TIER " + station.tier : "BLUEPRINT"} · ${Math.round(distance)}m</small></button>`;
    })
    .join("");
}
function drawMap() {
  const c = $("minimap").getContext("2d"),
    p = sim.player;
  c.clearRect(0, 0, 180, 180);
  c.save();
  c.beginPath();
  c.arc(90, 90, 86, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = "#233e45dd";
  c.fillRect(0, 0, 180, 180);
  c.strokeStyle = "#94b0a51a";
  for (let i = 0; i < 180; i += 20) {
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i, 180);
    c.moveTo(0, i);
    c.lineTo(180, i);
    c.stroke();
  }
  const at = (x, z) => [90 + (x - p.x) * 2, 90 + (z - p.z) * 2];
  const [gx, gz] = at(0, 0);
  c.fillStyle = "#d8c29c2a";
  c.beginPath();
  c.arc(gx, gz, 20, 0, Math.PI * 2);
  c.fill();
  if (travel?.points.length) {
    c.strokeStyle = "#f8d491";
    c.setLineDash([3, 4]);
    c.beginPath();
    c.moveTo(90, 90);
    for (const point of travel.points) c.lineTo(...at(point.x, point.z));
    c.stroke();
    c.setLineDash([]);
  }
  for (const f of view.features)
    if (state.exploration.discovered.includes(f.id)) {
      const [x, y] = at(f.x, f.z);
      const changed = state.exploration.changed.includes(f.id);
      c.fillStyle = changed
        ? "#8b9394"
        : f.kind === "cache"
          ? "#ffd18e"
          : f.kind === "beacon"
            ? "#dbb9ff"
            : "#93d9ed";
      c.beginPath();
      c.moveTo(x, y - 4);
      c.lineTo(x + 4, y);
      c.lineTo(x, y + 4);
      c.lineTo(x - 4, y);
      c.fill();
    }
  c.fillStyle = "#d5c4fa";
  for (const n of view.nodes)
    if (!state.depleted[n.id] || state.depleted[n.id] < Date.now()) {
      const [x, y] = at(n.x, n.z);
      c.fillRect(x - 1, y - 1, 2, 2);
    }
  for (const e of sim.enemies)
    if (e.hp > 0) {
      const [x, y] = at(e.x, e.z);
      c.fillStyle = e.boss ? "#e6bf82" : "#ce9195";
      c.beginPath();
      c.arc(x, y, e.boss ? 4 : 2, 0, Math.PI * 2);
      c.fill();
    }
  if (state.realm === "bastion")
    for (const def of STATIONS) {
      const [x, y] = at(def.x, def.z),
        station = state.production.stations[def.id];
      c.fillStyle = station.completed
        ? "#ffe0a2"
        : station.tier
          ? "#9bd0bb"
          : "#7c929c";
      c.fillRect(x - 2, y - 2, 4, 4);
      if (trackedStation === def.id) {
        c.strokeStyle = "#ffe0a2";
        c.beginPath();
        c.arc(x, y, 6, 0, Math.PI * 2);
        c.stroke();
      }
    }
  c.translate(90, 90);
  c.save();
  c.rotate(-view.yaw);
  c.fillStyle = "#c4e9ff33";
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-14, -22);
  c.lineTo(14, -22);
  c.closePath();
  c.fill();
  c.restore();
  c.rotate(-p.facing);
  c.fillStyle = "#fff3d5";
  c.beginPath();
  c.moveTo(0, 6);
  c.lineTo(-4, -4);
  c.lineTo(4, -4);
  c.fill();
  c.restore();
  c.fillStyle = "#e8dfc2";
  c.font = "9px sans-serif";
  c.textAlign = "center";
  c.fillText("N", 90, 14);
}
function statBoxes() {
  const s = stats(state);
  return `<div class="stat-grid">${[
    ["LIFE", fmt(s.life)],
    ["MANA", fmt(s.mana)],
    ["HIT POWER", fmt(s.power * (1 + s.damage))],
    ["ARMOR", fmt(s.armor)],
    ["ATTACK INCREASE", Math.round((s.damage + s.attackDamage) * 100) + "%"],
    ["SPELL INCREASE", Math.round((s.damage + s.spellDamage) * 100) + "%"],
    ["ELEMENTAL INCREASE", Math.round(s.elementalDamage * 100) + "%"],
    ["ELEMENTAL RESISTANCE", Math.round(s.resistance * 100) + "%"],
    ["DAMAGE REFLECTION", (s.reflection * 100).toFixed(1) + "%"],
    ["LUCK · EXTRA MATERIAL", (s.luckChance * 100).toFixed(1) + "%"],
    ["FIBRE FORTUNE", s.fortune + " · fibre + cultivated seeds"],
    ["CRITICAL CHANCE", Math.round(s.crit * 100) + "%"],
    ["CRITICAL MULTIPLIER", Math.round(s.critMultiplier * 100) + "%"],
    ["PENETRATION", Math.round(s.penetration * 100) + "%"],
    ["PASSIVES", state.passives.length + " / " + passiveBudget(state)],
  ]
    .map(
      ([key, v]) =>
        `<div class="stat-box"><small>${key}</small><b>${v}</b></div>`,
    )
    .join("")}</div>`;
}
function itemUpgradeControls(item) {
  const cost = ascensionCost(item),
    tier = ascensionTier(item),
    frame = ITEM_FRAMES[item.frame];
  const form = WEAPON_FORMS[item.form] || ARMOR_FORMS[item.form];
  const possible =
    cost &&
    item.quality >= cost.temper &&
    state.gold >= cost.gold &&
    Object.entries(cost.resources).every(
      ([key, n]) => state.resources[key] >= n,
    );
  const branches = item.ascensionPath
    ? [item.ascensionPath]
    : Object.keys(ASCENSION_PATHS);
  return `<div class="item-provenance"><small>${form?.name || "Standard base"} · ASCENSION ${tier}/3${tier ? " · " + ASCENSION_PATHS[item.ascensionPath].name : ""}</small>
  ${frame ? `<div class="affix">${frame.label} · ${frame.description}</div>` : ""}
  ${form?.description ? `<div class="affix">${form.description}</div>` : ""}
  ${
    cost
      ? `<p class="small">Next tier · Temper +${cost.temper} · ${cost.gold} gold · ${Object.entries(
          cost.resources,
        )
          .map(([key, n]) => n + " " + MATERIAL_NAMES[key])
          .join(", ")}</p>
    <div class="item-actions">${branches.map((path) => `<button data-item="${item.id}" data-item-action="ascend-${path}" title="${ASCENSION_PATHS[path].description}" ${possible ? "" : "disabled"}>ASCEND · ${ASCENSION_PATHS[path].name}</button>`).join("")}</div>`
      : "<p class='small'>Ascension complete</p>"
  }</div>`;
}
function inventory() {
  return (
    statBoxes() +
    `<div class="row spread"><span class="small muted">${state.items.length}/200 equipment · ${fmt(state.gold)} gold</span><span class="tag">ARMOR MITIGATES SMALL HITS MORE STRONGLY</span></div><div class="resource-line">${Object.entries(
      state.resources,
    )
      .map(([key, n]) => `<span>${escape(key)} <b>${n}</b></span>`)
      .join("")}</div><div class="grid-3">${state.items
      .map((i) => {
        const equipped = state.equipped[i.slot] === i.id;
        return `<article class="card ${equipped ? "selected" : ""}"><div class="row spread"><span class="tag ${i.rarity}">${i.rarity.toUpperCase()} ${i.slot.toUpperCase()}</span><span class="small muted">ILVL ${i.level}</span></div><h3 class="${i.rarity}" style="margin-top:12px">${escape(i.name)} ${i.quality ? "+" + i.quality : ""}</h3><p>${Math.round(equipmentPower(i))} base ${i.slot === "weapon" ? "hit power" : i.slot === "armor" ? "armor" : i.slot === "offhand" ? "shield strength" : "mana"}</p>${itemUpgradeControls(i)}${i.affixes.map((a) => `<div class="affix">+${a.value < 1 ? Math.round(a.value * 100) + "%" : Math.round(a.value)} ${escape(a.stat.replace(/([A-Z])/g, " $1").toLowerCase())}</div>`).join("")}<div class="item-actions"><button data-item="${i.id}" data-item-action="equip" ${equipped ? "disabled" : ""}>${equipped ? "EQUIPPED" : "EQUIP"}</button><button data-item="${i.id}" data-item-action="temper" ${state.resources.cobalt < 2 || state.gold < 50 || i.quality >= 20 ? "disabled" : ""}>TEMPER · 2 cobalt + 50g</button><button data-item="${i.id}" data-item-action="reroll" ${!state.resources.essence ? "disabled" : ""}>RESHAPE · 1 essence</button><button data-item="${i.id}" data-item-action="salvage" ${equipped ? "disabled" : ""}>SALVAGE</button></div></article>`;
      })
      .join("")}</div>`
  );
}
function skills() {
  const st = stats(state),
    hero = classFor(state);
  const last = sim.lastHit;
  return `<p class="small muted">Weapon discipline: ${WEAPON_FORMS[equippedForm(state)]?.name || skillStats(state, "strike").weapon.toUpperCase()}. Weapon form sets your basic attack. Class sets the element and innate bonuses. Link two different compatible supports to active skills.</p>
  <div class="card small" id="damage-inspector"><b>Combat breakdown</b><p>Physical hits meet armor. Elemental hits meet resistance, capped at 75%. An enemy resists its own element by an extra 20%. Skill previews below use a target with 30 armor and 20% resistance; critical hits, ailments, echoes and reactions are shown separately.</p>${last ? `<p>Last ${escape(last.source)}${last.echo ? " echo" : " hit"} on ${escape(last.target)}: ${fmt(last.physical)} physical + ${fmt(last.elemental)} ${escape(last.element)} before reaction · ${fmt(last.total)} final damage${last.critical ? " · CRITICAL" : ""}${last.reaction ? " · " + escape(last.reaction) : ""}</p>` : "<p>Strike a foe to inspect your last actual hit.</p>"}</div>
  <div class="grid-2" style="margin-top:12px">${SKILLS.map((base) => {
    const skill = skillStats(state, base.id),
      element = skill.element || hero.element,
      preview = hitBreakdown(
        skill,
        st,
        { armor: 30, resistance: 0.2 },
        element,
      );
    return `<article class="card"><div class="row spread"><h3>${skill.icon} ${skill.name}</h3><span class="tag">${skill.key}</span></div><p>${skill.description}</p><div class="row">${skill.tags.map((t) => `<span class="tag">${t}</span>`).join("")}<span class="tag">${element}</span></div><p>${Math.round(skill.cost)} mana · ${skill.cooldown.toFixed(2)}s cooldown · ${skill.range || skill.radius}m reach</p><p class="affix">${fmt(preview.physical)} physical + ${fmt(preview.elemental)} elemental · ~${fmt(preview.total)} combined first-hit preview</p>${
      skill.id !== "strike"
        ? `<div class="support-row">${[0, 1]
            .map(
              (i) =>
                `<label>SUPPORT SOCKET ${i + 1}<select data-link-skill="${skill.id}" data-link-index="${i}">${SUPPORTS.filter(
                  (s) => !s.tags || s.tags.some((t) => skill.tags.includes(t)),
                )
                  .map(
                    (s) =>
                      `<option value="${s.id}" ${(state.links[skill.id]?.[i] || "none") === s.id ? "selected" : ""}>${s.name}</option>`,
                  )
                  .join("")}</select></label>`,
            )
            .join(
              "",
            )}</div><div class="support-notes">${skill.supports.map((name) => SUPPORTS.find((s) => s.name === name)?.desc).join("<br>") || "No support linked."}</div>`
        : '<p class="support-notes">The weapon combo is innate. Equip another weapon form to change it. Your class supplies the default discipline.</p>'
    }</article>`;
  }).join("")}</div>`;
}
function constellation() {
  return constellationPanel(state);
}
function lifeskills() {
  return `<div class="card"><h3>Field material guide</h3><p>Loomflax and Downbloom grow near Dawnwake and in wild sectors. Gather their fibres and seeds, then grow more in the Dawnwake nursery.</p><div class="grid-2">${Object.entries(
    GEODE_MATERIALS,
  )
    .map(
      ([id, m]) =>
        `<p><b>${m.name} · ${state.resources[id]}</b><br>${m.region} · ${m.purpose}</p>`,
    )
    .join(
      "",
    )}</div><p>Small, medium and large buds mature into harvestable clusters. Growth continues while away.</p></div><div class="grid-3">${PROFESSIONS.map(
    (p) => {
      const level = professionLevel(state, p.id),
        xp = state.professions[p.id];
      return `<article class="card"><div class="icon">${p.icon}</div><div class="row spread"><h3>${p.name}</h3><span class="tag">MASTERY ${level}</span></div><p>${p.desc}</p><div class="quest-progress"><i style="width:${clamp(((xp - 30 * (level - 1) ** 2) / (30 * level ** 2 - 30 * (level - 1) ** 2)) * 100, 0, 100)}%"></i></div><p>${fmt(xp)} lifetime XP · ${p.node ? "Each 3 mastery levels adds one resource per gather." : p.id === "surveying" ? "Discoveries and relay sync grant experience." : "Crafting grants profession experience."}</p></article>`;
    },
  ).join(
    "",
  )}</div><div class="row" style="margin-top:16px"><button class="gold-button" data-panel="crafting">OPEN WORKSHOP →</button><span class="small muted">Resources recover after 3 minutes. Progress saves through logout.</span></div>`;
}
function workshop() {
  return `<div class="card atelier-link"><h3>From raw materials to masterworks</h3><p>Build workstations, queue processing and collect refined materials in the sanctuary Atelier.</p><button data-panel="artisan">OPEN ATELIER · B →</button></div><div class="resource-line">${Object.entries(
    state.resources,
  )
    .map(([key, n]) => `<span>${MATERIAL_NAMES[key] || key} <b>${n}</b></span>`)
    .join("")}</div><div class="grid-3">${RECIPES.map(
    (r) =>
      `<article class="card"><span class="tag">${r.profession.toUpperCase()} · MASTERY ${professionLevel(state, r.profession)}</span><h3 style="margin-top:12px">${r.name}</h3><p>${r.desc}</p><div class="resource-line">${Object.entries(
        r.cost,
      )
        .map(([k, n]) => `<span>${k} ${state.resources[k]}/${n}</span>`)
        .join(
          "",
        )}</div><button data-craft="${r.id}" ${!Object.entries(r.cost).every(([k, n]) => state.resources[k] >= n) ? "disabled" : ""}>CRAFT</button></article>`,
  ).join(
    "",
  )}</div><div class="card" style="margin-top:12px"><h3>Field supplies</h3><p>Rations grant +60 life and +35% recovery for 15 minutes. Trauma injectors recover 45% life with a 12-second cooldown.</p><button data-action="eat" ${state.resources.meal < 1 ? "disabled" : ""}>USE MOONFIN RATION (${state.resources.meal})</button> <button data-action="shield" ${state.resources.capacitor < 1 ? "disabled" : ""}>DEPLOY CAPACITOR (${state.resources.capacitor})</button></div>`;
}
function heroes() {
  return `<div class="row spread"><p class="small muted">${state.heroes.length}/12 appearances · ${state.crystals} crystals · ${state.tickets} tickets · 5★ pity ${state.pity}/40 · ${state.cosmeticShards} cosmetic shards</p><button class="gold-button" data-action="summon" ${state.tickets < 1 && state.crystals < 160 ? "disabled" : ""}>DRAW APPEARANCE · ${state.tickets ? "1 TICKET" : "160 CRYSTALS"}</button></div>
 ${!state.heroes.includes("sora") ? '<div class="card"><h3>Free scout outfit</h3><p>Claim the Sora appearance at base.</p><button data-action="training">CLAIM SORA · FREE</button></div>' : ""}
 <p class="small muted">Appearances change your model and portrait. Your Codex race, class, gear and constellation determine combat and lifeskill stats. Duplicates give cosmetic shards; spend 8 on an appearance of your choice.</p>
 <div class="grid-3">${HEROES.map((h) => {
   const owned = state.heroes.includes(h.id),
     active = state.hero === h.id;
   return `<article class="card hero-card ${active ? "selected" : ""}"><div class="hero-illustration" role="img" aria-label="${h.name} anime portrait" style="background-position:${(HEROES.indexOf(h) % 3) * 50}% ${Math.floor(HEROES.indexOf(h) / 3) * (100 / 3)}%"></div><div class="hero-card-copy"><h3>${h.name}</h3><p>${h.title}</p>${owned ? `<button data-hero="${h.id}" ${active ? "disabled" : ""}>${active ? "EQUIPPED" : "EQUIP APPEARANCE"}</button>` : `<button data-unlock-style="${h.id}" ${state.cosmeticShards < 8 ? "disabled" : ""}>UNLOCK · 8 SHARDS</button>`}</div></article>`;
 }).join("")}</div>`;
}
function codex() {
  const r = originFor(state),
    c = classFor(state),
    totals = attributeTotals(state),
    remaining = attributeBudget(state);
  const options = (rows, selected) =>
    rows
      .map(
        (o) =>
          `<option value="${o.id}" ${selected === o.id ? "selected" : ""}>${o.name}</option>`,
      )
      .join("");
  const atBase = Math.hypot(sim.player.x, sim.player.z) < 14 && combatSafe();
  return `<article class="card"><div class="row spread"><h3>Imperial Codex</h3><span class="tag">FIELD RANK ${state.level}</span></div>
  <p>Choose your race and class at base. Your appearance is independent. Each level after 1 grants 3 constellation points and 10 assignable attribute points.</p>
  <div class="grid-2"><label>RACE<select id="codex-race" ${!atBase ? "disabled" : ""}>${options(RACES, r.id)}</select></label><label>CLASS<select id="codex-class" ${!atBase ? "disabled" : ""}>${options(CLASSES, c.id)}</select></label></div>
  <label>BODY<select id="codex-body"><option value="male" ${state.avatarBody!=="female"?"selected":""}>Male (existing model)</option><option value="female" ${state.avatarBody==="female"?"selected":""}>Female (custom prototype)</option></select></label><p class="small">Appearance only. Female is a downloadable work-in-progress model; race, class and stats are unchanged.</p>
  <p id="codex-preview" class="affix"></p><button class="gold-button" data-action="declare" ${!atBase && !declarationRequired ? "disabled" : ""}>${state.race && state.calling ? "UPDATE FIELD LOADOUT" : "DECLARE CHARACTER"}</button>
  ${!atBase ? '<p class="small">Return to the sanctuary to change your loadout.</p>' : ""}</article>
  <article class="card"><div class="row spread"><h3>Attributes</h3><span class="tag">${remaining} POINTS AVAILABLE</span></div><p>Totals include race base stats, free race and class starter bonuses, automatic growth, and manual assignments.</p>
  <div class="attribute-grid">${ATTRIBUTES.map(([id, effect]) => `<div class="attribute-row"><div><b>${id[0].toUpperCase() + id.slice(1)} ${totals[id]}</b><small>${effect} · ${state.attributes[id]} assigned</small></div><button data-attribute="${id}" data-amount="1" ${remaining < 1 ? "disabled" : ""} aria-label="Add one ${id}">+1</button><button data-attribute="${id}" data-amount="5" ${remaining < 5 ? "disabled" : ""} aria-label="Add five ${id}">+5</button></div>`).join("")}</div></article>`;
}
function previewCodex() {
  const r = RACES.find((v) => v.id === $("codex-race")?.value);
  const c = CLASSES.find((v) => v.id === $("codex-class")?.value);
  if (!r || !c) return;
  const growth = (o) =>
    Object.entries(o.growth)
      .map(([k, n]) => "+" + n + " " + k)
      .join(", ");
  $("codex-preview").textContent =
    r.trait +
    " · " +
    growth(r) +
    " per level. " +
    c.trait +
    " · " +
    growth(c) +
    " per level. " +
    { blade: "Plasma blade", bow: "Rail bow", staff: "Psi projector" }[
      c.weapon
    ] +
    " · " +
    c.element;
}
function journal() {
  return `<p class="small muted">Dawnwake expedition · 13 steps. Earlier actions count before a step unlocks. Claim each cache to open the next step. Rewards are once per profile.</p><div class="grid-2">${QUESTS.map((q, index) => {
    const { value, claimed, unlocked, ready } = questStatus(state, q);
    const supplies = Object.entries(q.resources || {}).map(([key, count]) => `${count} ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`).join(" · ");
    return `<article class="card"><span class="tag">STEP ${index + 1} / ${QUESTS.length} · ${claimed ? "CLAIMED" : ready ? "READY" : unlocked ? "ACTIVE" : "LOCKED"}</span><h3>${q.name}</h3><p>${q.description}</p><p class="small">${q.hint || ""}</p><div class="quest-progress"><i style="width:${Math.min(value / q.goal, 1) * 100}%"></i></div><p>${Math.min(value, q.goal)} / ${q.goal}</p><p class="small">${q.gold} gold · ${q.crystals} cosmetic crystals · ${q.xp || 0} XP<br>${supplies}</p>${!unlocked && !claimed ? `<p class="small muted">Claim “${QUESTS.find(v => v.id === q.needs[0])?.name}” first.</p>` : ""}<button data-quest="${q.id}" ${!ready ? "disabled" : ""}>${claimed ? "CLAIMED" : ready ? "CLAIM SUPPLY CACHE" : unlocked ? "IN PROGRESS" : "LOCKED"}</button></article>`;
  }).join("")}</div>`;
}
function realms() {
  return `<p class="small muted">Waygates open as your account level rises. Each destination has its own terrain palette, resources, and enemy progression.</p><div class="grid-2">${REALMS.map((r) => `<article class="card ${state.realm === r.id ? "selected" : ""}"><h3>${r.name}</h3><p>${r.gravity} g source world · ${r.tier === 0 ? "Frontier sanctuary" : "Requires level " + r.tier * 10}</p><button data-realm="${r.id}" ${state.level < r.tier * 10 || r.id === state.realm ? "disabled" : ""}>${r.id === state.realm ? "CURRENT REALM" : state.level < r.tier * 10 ? "WAYGATE LOCKED" : "TRAVEL"}</button></article>`).join("")}</div>`;
}
function survey() {
  const found = view.features.filter((f) =>
    state.exploration.discovered.includes(f.id),
  );
  const p = sim.player;
  found.sort(
    (a, b) =>
      Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z),
  );
  return `<article class="card"><h3>${view.realm.name} · Field survey</h3><p>${found.length} of ${view.features.length} nearby sites charted. Explore to chart caches, mineral rubble and relays. The map remembers the sites you find.</p></article>
  <div class="grid-2">${found
    .map(
      (
        f,
      ) => `<article class="card"><h3>${f.name}</h3><p>${featureStatus(f)} · ${Math.round(Math.hypot(f.x - p.x, f.z - p.z))}m · ${Math.round(f.x)}, ${Math.round(f.z)}</p>
    <button data-world-feature="${f.id}" ${state.exploration.changed.includes(f.id) && f.kind !== "beacon" ? "disabled" : ""}>TRAVEL TO SITE</button></article>`,
    )
    .join("")}</div>`;
}
function settings() {
  return `<div class="grid-2"><article class="card"><h3>${escape(profiles.active?.name)}’s chronicle</h3><p>Automatic saves every five seconds and after progression changes. Your previous save is retained as a local recovery copy.</p><button data-action="export">EXPORT SAVE</button> <button data-action="import">IMPORT BACKUP</button><input id="save-file" type="file" accept="application/json,.json" hidden><p class="small">Profile login and saves are stored on this device. Cloud accounts and multiplayer servers are not connected.</p></article><article class="card"><h3>Field settings</h3><p><button data-assist="autoTarget">AUTO TARGET (Q): ${assist.autoTarget ? "ON" : "OFF"}</button> <button data-assist="autoFire">AUTO FIRE (T): ${assist.autoFire ? "ON" : "OFF"}</button></p><p>Keyboard/controller auto target selects a nearby foe. R3 toggles auto target like Q and initially picks a visible foe ahead of the camera. Auto fire uses your normal primary range and cooldown. Touch: tap a foe to lock; tap empty ground to move.</p><div class="graphics-settings"><label for="graphics-quality">VISUAL QUALITY</label><select id="graphics-quality"><option value="low" ${visuals.quality === "low" ? "selected" : ""}>Performance · no shadows</option><option value="balanced" ${visuals.quality === "balanced" ? "selected" : ""}>Balanced · soft shadows</option><option value="high" ${visuals.quality === "high" ? "selected" : ""}>High fidelity · dense foliage</option></select><label class="check-setting"><input id="reduced-motion" type="checkbox" ${visuals.reducedMotion ? "checked" : ""}> Reduce ambient motion & effects</label><p class="small">F8 hides the interface for scenic viewing. Press again to restore it. Camera and combat remain active.</p></div><p>Simulation: ${numeric.backend}<br>Right drag or Left Ctrl: orbit · Middle drag: pan · Wheel: zoom · R: reset<br>Click terrain or objects to travel · Touch joystick moves · M: field survey<br>Shift: evade · G: hold shield · Space: jump<br>I: gear · K: skills · P: passives · L: lifeskills<br>C: crafting · H: appearances · U: Codex · J: journal · Esc: close</p><h3>Controller</h3><p>Standard Xbox layout: left stick moves; right stick rotates left/right and zooms up/down. RT basic attack; X interact; A jump; R3 auto target (Q); Start menus. D-pad: Up ability 1, Right ability 2, Down ability 3, Left ability 4. Tap B crouch, Y weapon switch and LB+RB F5 are reserved and inactive until implemented. Hold B for build placement (not yet available in this build). In menus, D-pad or left stick navigates, A selects, B/Start closes.</p><button data-action="mute">${muted ? "ENABLE" : "MUTE"} SOUND</button> <button data-action="main-menu">SAVE & MAIN MENU</button> <button data-action="logout">SAVE & LOG OUT</button><p><a href="classic.html">Open Classic gacha RPG →</a></p></article></div>`;
}
function openPanel(id) {
  if (!playing) return;
  if (declarationRequired) id = "codex";
  setFreeLook(false);
  cancelTravel();
  gathering = null;
  holdingAttack = false;
  touchPrimaryHeld = false;
  keys.clear();
  panel = id;
  $("panels").hidden = false;
  const title = tabs.find((t) => t[0] === id)?.[1] || "Chronicle";
  $("panels").innerHTML =
    `<section class="panel-window" role="dialog" aria-modal="true" aria-label="${title}"><header class="panel-top"><div><span class="kicker">${menuGroups.find(([, ids]) => ids.includes(id))?.[0] || "Elysium"}</span><h2>${title}</h2></div>${declarationRequired ? "" : '<button class="panel-close" data-action="close" aria-label="Close panel">×</button>'}</header><div class="menu-layout">${declarationRequired ? "" : menuNavigation(id)}<div class="panel-body">${({ inventory, skills, passives: constellation, lifeskills, crafting: workshop, artisan: () => artisanPanel(state), nursery: () => nurseryPanel(state), geology: () => geologyPanel(state), terrain: () => terrainPanel(state), heroes, codex, journal, realms, frontier: survey, settings }[id] || inventory)()}</div></div></section>`;
  if (id === "passives") mountConstellation($("panels"));
  if (id === "codex") previewCodex();
  ($("panels").querySelector(".panel-close") || $("codex-race"))?.focus();
}
function closePanel() {
  if (declarationRequired) return;
  if ($("panels").contains(document.activeElement))
    document.activeElement.blur();
  panel = null;
  $("panels").hidden = true;
  keys.clear();
}
function combatSafe() {
  return !sim.enemies.some(
    (e) =>
      e.hp > 0 &&
      !e.training &&
      e.phase !== "idle" &&
      sim.combatVisible(e,sim.player) &&
      Math.hypot(e.x - sim.player.x, e.z - sim.player.z) < 18,
  );
}
function attack(id) {
  if (!playing || panel) return;
  cancelTravel();
  if (sim.attack(id)) {
    gathering = null;
    sound(id === "strike" ? 230 : 520);
  } else if (sim.player.mana < (skillStats(state, id)?.cost || 0))
    notify("Not enough mana.");
}
function nearestInteraction() {
  const p = sim.player;
  if (terrainTool !== "off") return {type:"terrain",name:"Terrain " + terrainTool,x:p.x,z:p.z};
  let best = null,
    nearest = Infinity;
  for (const target of view.interactables()) {
    const distance = Math.hypot(target.x - p.x, target.z - p.z);
    if (
      distance <= (target.type === "feature" ? 3.4 : 4) &&
      distance < nearest
    ) {
      best = target;
      nearest = distance;
    }
  }
  return best;
}
function startGather(target = nearestInteraction()) {
  if (!playing || panel || !target) return;
  cancelTravel();
  const p = sim.player;
  if (
    Math.hypot(target.x - p.x, target.z - p.z) >
    (target.type === "feature" ? 3.4 : 4)
  )
    return;
  if (!combatSafe()) {
    notify("Clear nearby hostiles before interacting.");
    return;
  }
  if (target.type === "terrain") {
    if (!view.voxelTerrain?.covered(p.x,p.z)) return notify("Move beyond160m and wait for the frontier ground to load.");
    const e=view.camera.matrixWorld.elements;
    const candidate=sim.terrainVolume.fork(),candidateState={...state,terrain:candidate.store,resources:{...state.resources}};
    const result=useTerrainTool(candidateState,candidate,p,terrainTool,[-e[8],-e[9],-e[10]]);
    if(!result.ok){notify(result.message);return;}
    const started=performance.now(),patch=view.voxelTerrain.preparePatch(candidate,result.block);
    if(!patch){notify("Nearby terrain is still preparing. No resources changed.");return;}
    sim.terrainVolume.commitFrom(candidate);state.resources.stone=candidateState.resources.stone;
    view.voxelTerrain.commitPatch(patch);view.voxelTerrain.sync(p);
    canvas.dataset.terrainPatchMs=(performance.now()-started).toFixed(1);
    notify(result.message);save();return;
  }
  if (target.type === "station") {
    openPanel("artisan");
    return;
  }
  if (target.type === "geology") { openPanel("geology"); return; }
  if (target.type === "nursery") {
    openPanel("nursery");
    return;
  }
  if (target.type === "microvoxel") {
    const result = view.microvoxels.mine(p);
    notify(result.message);
    if (result.ok) save();
    return;
  }
  if (target.type === "feature") {
    const result = useFeature(state, target, p);
    if (result.xp) {
      addXP(state, result.xp);
      sim.refreshObstacles();
    }
    if (result.returnHome) {
      p.x = 0;
      p.z = 6;
      p.y = p.velocityY = 0;
      view.rig.recenter();
      state.position = { x: p.x, z: p.z };
    }
    notify(result.message);
    save();
    sound(630);
    return;
  }
  const node = target;
  if (state.depleted[node.id] > Date.now())
    return notify(
      node.kind === "geode"
        ? GEODE_STAGES[geodeStage(state.depleted[node.id])] +
            " · Matures in " +
            Math.ceil((state.depleted[node.id] - Date.now()) / 1000) +
            "s"
        : "This resource is recovering.",
    );
  const total = node.kind === "fish" ? 3 : node.kind === "geode" ? 2.4 : 1.5;
  gathering = { node, left: total, total, x: sim.player.x, z: sim.player.z };
  sound(300);
}
function cancelTravel() {
  travel = null;
  view?.markDestination(null);
}
function beginTravel(target) {
  if (!playing || panel || !target) return;
  gathering = null;
  cancelTravel();
  const reach = target.type ? (target.type === "feature" ? 3.15 : 3.7) : 0;
  const points = routeTo(sim.player, target, sim.blockers, reach);
  if (!points) return notify("No clear route to that spot.");
  if (!points.length) return startGather(target);
  travel = { target, points, stuck: 0 };
  view.markDestination(points.at(-1));
}
function routeInput(dt) {
  const p = sim.player;
  while (travel?.points.length) {
    const point = travel.points[0];
    const x = point.x - p.x,
      z = point.z - p.z,
      d = Math.hypot(x, z);
    if (d > 0.16) {
      const scale = Math.min(1 / d, 1 / (dt * 8));
      return { x: x * scale, z: z * scale };
    }
    travel.points.shift();
  }
  if (travel) {
    const target = travel.target;
    cancelTravel();
    if (target.type) startGather(target);
  }
  return { x: 0, z: 0 };
}
function exportSave() {
  save();
  const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "aetherbound-" + profiles.active.id + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.addEventListener("submit", (e) => {
  if (e.target.id === "login-form") {
    e.preventDefault();
    enter(false);
  }
});
document.addEventListener("click", async (e) => {
  const n = e.target.closest("button,[data-passive],#interaction");
  if (!n) return;
  if (n.dataset.profile) {
    $("profile-name").value = n.dataset.profile;
    $("profile-pin").focus();
    return;
  }
  const action = n.dataset.action;
  if (action === "create") {
    enter(true);
    return;
  }
  if (action === "menu-back") { mainMenu(); return; }
  if (atMainMenu) {
    if (action === "menu-enter") launchWorld();
    if (action === "menu-settings") mainMenu(true);
    if (action === "menu-new") { landing(); $("profile-name").focus(); }
    if (action === "menu-signout") { profiles.logout(); landing(); $("profile-name").focus(); }
    if (action === "menu-mute") { muted = !muted; mainMenu(true); }
    if (n.dataset.assist) { toggleAssist(n.dataset.assist); mainMenu(true); }
    return;
  }
  if (!playing) return;
  if(n.dataset.assist){toggleAssist(n.dataset.assist);openPanel("settings");return;}
  if (n.dataset.camera) {
    cameraControl(n.dataset.camera);
    return;
  }
  if (n.dataset.worldFeature || n.dataset.worldStation) {
    const id = n.dataset.worldFeature || n.dataset.worldStation;
    const target = view.interactables().find((x) => x.id === id);
    if (panel === "frontier" || panel === "nursery" || panel === "geology") closePanel();
    beginTravel(target);
    return;
  }
  if (action === "dodge") {
    cancelTravel();
    sim.dodge();
    return;
  }
  if (action === "jump") {
    if (sim.player.y === 0) sim.player.velocityY = 8;
    return;
  }
  if (n.dataset.panel) {
    openPanel(n.dataset.panel);
    return;
  }
  if (n.dataset.terrainMode) {
    terrainTool=n.dataset.terrainMode;closePanel();notify(terrainTool === "off" ? "Terrain tools put away." : "Terrain tool equipped. Aim camera and use Interact.");return;
  }
  if (n.hasAttribute("data-terrain-deploy")) {
    if(!combatSafe())return;
    const p=sim.player;p.x=170;p.z=10;p.y=0;p.velocityY=0;sim.syncChunks();
    p.terrainY=findTerrainSpawn(sim.terrainVolume,p.x,p.z,sim.layout.height(p.x,p.z));
    state.position={x:p.x,z:p.z,y:p.terrainY};closePanel();view.rig.recenter();save();return;
  }
  if (n.hasAttribute("data-build-core") || n.hasAttribute("data-extract-core") || n.dataset.coreField) {
    if (panel !== "geology" || !combatSafe()) return;
    let ok = false;
    if (n.hasAttribute("data-build-core")) ok = buildCoreDrill(state);
    else if (n.dataset.coreField) ok = shiftCoreField(state, Number(n.dataset.coreField));
    else {
      const amount = gatherYield(state, "mining", false).total;
      ok = !!extractCore(state, amount);
      if (ok) { state.professions.mining += 20; state.statistics.gathers++; addXP(state, 15); notify("+" + amount + " canonical raw cobalt"); }
    }
    if (ok) { save(); openPanel("geology"); sound(520); }
    return;
  }
  if (n.hasAttribute("data-build-nursery") || n.dataset.plantCrop || n.hasAttribute("data-harvest-crop")) {
    if (panel !== "nursery" || !combatSafe()) return;
    let result;
    if (n.hasAttribute("data-build-nursery")) {
      const ok = buildNursery(state);
      if (ok) sim.refreshObstacles();
      result = { ok, message: ok ? "Hydroponic beds ready." : "Visit the nursery with the required materials." };
    } else if (n.dataset.plantCrop) {
      const ok = plantCrop(state, Number(n.dataset.bed), n.dataset.plantCrop);
      result = { ok, message: ok ? "Seed planted." : "A free bed and a seed are required." };
    } else result = harvestCrop(state, Number(n.dataset.harvestCrop));
    notify(result.message);
    if (result.ok) {
      save();
      openPanel("nursery");
      sound(520);
    }
    return;
  }
  if (n.dataset.skill) {
    attack(n.dataset.skill);
    return;
  }
  if (n.id === "interaction") {
    startGather();
    return;
  }
  if (n.dataset.passive) {
    const id = n.dataset.passive,
      allocated = state.passives.includes(id),
      ok = allocated ? refund(state, id) : allocate(state, id);
    if (!ok) {
      notify(
        allocated
          ? "Refunding that node would disconnect part of your build."
          : "Connect this node, check its doctrine, and make sure you have a point.",
      );
      return;
    }
    save();
    openPanel("passives");
    sound(700);
    return;
  }
  if (n.dataset.attribute) {
    if (assignAttribute(state, n.dataset.attribute, Number(n.dataset.amount))) {
      save();
      openPanel("codex");
    }
    return;
  }
  if (n.dataset.unlockStyle) {
    if (
      state.cosmeticShards >= 8 &&
      HEROES.some((h) => h.id === n.dataset.unlockStyle) &&
      !state.heroes.includes(n.dataset.unlockStyle)
    ) {
      state.cosmeticShards -= 8;
      state.heroes.push(n.dataset.unlockStyle);
      save();
      openPanel("heroes");
    }
    return;
  }
  if (n.dataset.craft) {
    const result = craft(state, n.dataset.craft);
    notify(result.message);
    if (result.ok) {
      save();
      openPanel("crafting");
      sound(500);
    }
    return;
  }
  if (n.dataset.trackStation) {
    trackedStation = n.dataset.trackStation;
    closePanel();
    notify(
      "Tracking " +
        STATIONS.find((d) => d.id === trackedStation).name +
        ". Follow the gold marker on your map.",
    );
    return;
  }
  if (
    n.dataset.buildStation ||
    n.dataset.upgradeStation ||
    n.dataset.process ||
    n.dataset.collectStation ||
    n.dataset.cancelStation
  ) {
    if (!combatSafe()) {
      notify("Leave combat before using a workstation.");
      return;
    }
    const result = n.dataset.buildStation
      ? buildStation(state, n.dataset.buildStation)
      : n.dataset.upgradeStation
        ? upgradeStation(state, n.dataset.upgradeStation)
        : n.dataset.process
          ? enqueueProcessing(
              state,
              n.dataset.process,
              Number(n.dataset.quantity),
            )
          : n.dataset.collectStation
            ? collectProduction(state, n.dataset.collectStation)
            : cancelProcessing(
                state,
                n.dataset.cancelStation,
                Number(n.dataset.cancelJob),
              );
    notify(result.message);
    save();
    openPanel("artisan");
    if (result.ok) sound(620);
    return;
  }
  if (n.dataset.item) {
    const ok = alterItem(state, n.dataset.item, n.dataset.itemAction);
    notify(
      ok
        ? "Equipment updated."
        : "Check the required temper, gold and materials.",
    );
    if (ok) {
      if (n.dataset.itemAction === "equip") {
        view.setHero();
        renderBar();
      }
      save();
      openPanel("inventory");
    }
    return;
  }
  if (n.dataset.hero) {
    if (!combatSafe()) {
      notify("Leave combat before changing appearances.");
      return;
    }
    if (state.heroes.includes(n.dataset.hero)) {
      state.hero = n.dataset.hero;
      view.setHero();
      renderBar();
      save();
      openPanel("heroes");
    }
    return;
  }
  if (n.dataset.quest) {
    if (claimQuest(state, n.dataset.quest)) {
      notify("Contract rewards claimed.");
      save();
      openPanel("journal");
    }
    return;
  }
  if (n.dataset.realm) {
    const realm = REALMS.find((r) => r.id === n.dataset.realm);
    if (realm && state.level >= realm.tier * 10 && combatSafe()) {
      state.realm = realm.id;
      state.deepest = Math.max(state.deepest, realm.tier);
      state.position = { x: 0, z: 6 };
      buildView();
      closePanel();
      save();
      notify("Waygate arrival: " + realm.name);
    } else notify("This route is unavailable while fighting.");
    return;
  }
  switch (action) {
    case "declare": {
      if (
        !declarationRequired &&
        (Math.hypot(sim.player.x, sim.player.z) >= 14 || !combatSafe())
      )
        return;
      const race = $("codex-race").value,
        calling = $("codex-class").value;
      if (
        !RACES.some((v) => v.id === race) ||
        !CLASSES.some((v) => v.id === calling)
      )
        return;
      const body=$("codex-body").value,profile=profiles.active,expected=view;
      if(body==="female"){n.disabled=true;try{await loadCustomFemale();}catch(error){notify("Female model could not load: "+error.message);n.disabled=false;return;}n.disabled=false;if(view!==expected||profiles.active!==profile||panel!=="codex")return;}
      state.avatarBody=body==="female"?"female":"male";
      state.race = race;
      state.calling = calling;
      declarationRequired = false;
      view.setHero();
      renderBar();
      save();
      closePanel();
      notify(
        originFor(state).name +
          " · " +
          classFor(state).name +
          " loadout active",
      );
      break;
    }
    case "close":
      closePanel();
      break;
    case "potion":
      if (sim.heal()) sound(650);
      save();
      break;
    case "eat":
      if (state.resources.meal > 0) {
        state.resources.meal--;
        state.foodUntil = Date.now() + 900000;
        notify("Moonfin feast: life and recovery improved for 15 minutes.");
        save();
        openPanel("crafting");
      }
      break;
    case "shield":
      if (state.resources.capacitor > 0) {
        state.resources.capacitor--;
        state.shieldUntil = Date.now() + 600000;
        save();
        notify("Shield capacitor online · 10 minutes");
        openPanel("crafting");
      }
      break;
    case "training": {
      if (Math.hypot(sim.player.x, sim.player.z) >= 14) {
        notify("Visit the sanctuary to claim this appearance.");
        break;
      }
      if (recruitScout(state)) {
        save();
        openPanel("heroes");
        notify("Sora appearance unlocked.");
      }
      break;
    }
    case "summon": {
      const h = summon(state);
      if (h) {
        notify(
          h.rarity +
            "★ " +
            h.name +
            (h.duplicate
              ? " · Duplicate → 2 cosmetic shards"
              : " appearance unlocked"),
        );
        save();
        openPanel("heroes");
        sound(880);
      }
      break;
    }
    case "export":
      exportSave();
      break;
    case "import":
      $("save-file").click();
      break;
    case "mute":
      muted = !muted;
      openPanel("settings");
      break;
    case "main-menu":
      mainMenu();
      break;
    case "logout":
      save();
      profiles.logout();
      landing();
      break;
  }
});
document.addEventListener("change", async (e) => {
  const n = e.target;
  if (n.id === "codex-race" || n.id === "codex-class") previewCodex();
  if (n.id === "graphics-quality" || n.id === "reduced-motion") {
    visuals.quality = $("graphics-quality").value;
    visuals.reducedMotion = $("reduced-motion").checked;
    try {
      localStorage.setItem("astral_empire_visuals_v1", JSON.stringify(visuals));
    } catch {}
    view?.applyVisualSettings(visuals);
  }
  if (n.dataset.linkSkill) {
    const skill = n.dataset.linkSkill,
      index = Number(n.dataset.linkIndex);
    state.links[skill] ??= ["none", "none"];
    state.links[skill][index] = n.value;
    if (n.value !== "none" && state.links[skill][1 - index] === n.value)
      state.links[skill][1 - index] = "none";
    save();
    openPanel("skills");
  }
  if (n.id === "save-file" && n.files[0]) {
    try {
      const parsed = JSON.parse(await n.files[0].text());
      if (![1, 2, 3].includes(parsed.version))
        throw Error("Unsupported save version");
      state = migrateState(parsed);
      buildView();
      save();
      closePanel();
      notify("Backup restored.");
    } catch (error) {
      notify("Import failed: " + error.message);
    }
  }
});
document.addEventListener("keydown", (e) => {
  if (atMainMenu) {
    if (e.key === "Escape") { mainMenu(); return; }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && e.target.tagName !== "SELECT") {
      e.preventDefault();
      const buttons = [...$("landing").querySelectorAll("button, select, input")];
      const direction = e.key === "ArrowDown" ? 1 : -1;
      buttons[(buttons.indexOf(document.activeElement) + direction + buttons.length) % buttons.length]?.focus();
    }
    return;
  }
  if (e.code === "ControlLeft" && playing && !panel && !e.repeat) {
    setFreeLook(!freeLook);
    return;
  }
  if (e.key === "Escape") {
    setFreeLook(false);
    if (panel) closePanel();
    else cancelTravel();
    return;
  }
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.ctrlKey || e.metaKey) return;
  if (e.key === "F8" && playing) {
    e.preventDefault();
    document.body.classList.toggle("scenic-view");
    return;
  }
  if (!playing) return;
  const k = e.key.toLowerCase();
  const shortcuts = {
    i: "inventory",
    k: "skills",
    p: "passives",
    l: "lifeskills",
    c: "crafting",
    b: "artisan",
    h: "heroes",
    u: "codex",
    j: "journal",
    m: "frontier",
    o: "settings",
  };
  if (shortcuts[k]) {
    if (panel === shortcuts[k]) closePanel();
    else openPanel(shortcuts[k]);
    return;
  }
  if (panel) return;
  if (
    [" ", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(
      k,
    )
  )
    e.preventDefault();
  keys.add(k);
  if (e.repeat) return;
  if (
    [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "shift",
    ].includes(k)
  )
    cancelTravel();
  if (k === "shift") sim.dodge(...Object.values(movement()).slice(0, 2));
  if (k === "r") cameraControl("center");
  if (k === "z") cameraControl("left");
  if (k === "x") cameraControl("right");
  if (k === " " && sim.player.y === 0) sim.player.velocityY = 8;
  if (k === "q") { if(document.documentElement.dataset.controls === "touch") sim.locked=sim.locked?null:sim.nearest(30); else toggleAssist("autoTarget"); }
  if (k === "t") toggleAssist("autoFire");
  if (k === "e") startGather();
  if (k === "f") {
    sim.heal();
    save();
  }
  const skill = { 1: "lance", 2: "nova", 3: "dash", 4: "burst" }[k];
  if (skill) attack(skill);
});
document.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
const canvas = $("world"),
  pointers = new Map();
const ASSIST_KEY="astral_empire_combat_assist_v1";
let assist={autoTarget:true,autoFire:true}, inputFocused=true, controllerTargetSuppressed=false;
try {const stored=JSON.parse(localStorage.getItem(ASSIST_KEY));for(const key of ['autoTarget','autoFire'])if(typeof stored?.[key]==='boolean')assist[key]=stored[key];}catch{}
function toggleAssist(key){assist[key]=!assist[key];if(key==='autoTarget')controllerTargetSuppressed=false;if(key==='autoTarget')sim.locked=assist[key]?targetInView(sim,view?.yaw||0):null;try{localStorage.setItem(ASSIST_KEY,JSON.stringify(assist));}catch{}notify(`${key==='autoTarget'?'Auto target (Q)':'Auto fire (T)'}: ${assist[key]?'ON':'OFF'}`);}
addEventListener('focus',()=>{inputFocused=true;});
const activeTouchPointers=new Set();
// Capture UI and canvas contacts together so a second finger, including a
// joystick finger, cannot turn a camera/controls gesture into a travel tap.
document.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;if(activeTouchPointers.size)for(const p of pointers.values())p.moved=true;activeTouchPointers.add(e.pointerId);},true);
for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>activeTouchPointers.delete(e.pointerId),true);
let cameraSave;
let capturedLook = false;
function saveCamera() {
  clearTimeout(cameraSave);
  const goal = { ...view.rig.goal };
  cameraSave = setTimeout(() => {
    try {
      localStorage.setItem(CAMERA_KEY, JSON.stringify(goal));
    } catch {}
  }, 180);
}
document.addEventListener('aether-touch-primary',e=>{
  touchPrimaryHeld=!!e.detail.held && playing && !panel && !document.querySelector('#control-options')?.open;
  if(touchPrimaryHeld)attack('strike');
});
document.addEventListener('aether-touch-camera',e=>{
  if(!view||!playing||panel)return;
  const {x,y,dt}=e.detail;
  if(x)view.rig.orbit(x*dt*2.45,0);
  if(y)view.rig.zoom(Math.exp(y*dt*1.4));
});
function cameraControl(action) {
  if (!view || !playing || panel) return;
  if (action === "center") view.rig.recenter(true);
  if (action === "left") view.rig.orbit(-Math.PI / 4, 0);
  if (action === "right") view.rig.orbit(Math.PI / 4, 0);
  if (action === "near") view.rig.zoom(0.82);
  if (action === "far") view.rig.zoom(1.22);
  if (action === "look") setFreeLook(!freeLook);
  if (action === "mode") {
    combatClick = !combatClick;
    const toggle = $("pointer-mode");
    toggle.textContent = combatClick ? "⚔ Attack" : "◇ Explore";
    toggle.setAttribute("aria-pressed", String(combatClick));
    canvas.classList.toggle("attack-mode", combatClick);
  }
  saveCamera();
}
function setFreeLook(enabled) {
  if (freeLook === enabled) return;
  freeLook = enabled;
  $("free-look").setAttribute("aria-pressed", String(enabled));
  if (enabled) {
    // When pointer lock is unavailable (some embeds), canvas movement still
    // supplies relative deltas until the pointer leaves the game.
    try {
      canvas.requestPointerLock?.()?.catch?.(() => {});
    } catch {}
  } else {
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    if (view) saveCamera();
  }
}
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === canvas) {
    capturedLook = true;
    if (!freeLook) document.exitPointerLock();
  } else if (capturedLook) {
    capturedLook = false;
    setFreeLook(false);
  }
});
canvas.addEventListener("mousemove", (e) => {
  if (!freeLook || !playing || panel || pointers.size) return;
  view.rig.orbit(-e.movementX * 0.006, e.movementY * 0.004);
});
addEventListener("blur", () => {
  inputFocused=false;
  activeTouchPointers.clear();
  setFreeLook(false);
  keys.clear();
  pointers.clear();
  holdingAttack = false;
  touchPrimaryHeld = false;
  cancelTravel();
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => {
  if (!view || !playing || panel) return;
  const mode =
    e.pointerType === "touch"
      ? "touch"
      : e.button === 1 || (e.button === 2 && e.shiftKey)
        ? "pan"
        : e.button === 2
          ? "orbit"
          : e.button === 0
            ? combatClick || e.altKey
              ? "attack"
              : "tap"
            : null;
  if (!mode) return;
  pointers.set(e.pointerId, {
    startedAt: e.timeStamp,
    x: e.clientX,
    y: e.clientY,
    sx: e.clientX,
    sy: e.clientY,
    mode,
    moved: mode === "touch" && activeTouchPointers.size > 1,
  });
  canvas.setPointerCapture(e.pointerId);
  if (mode === "attack") {
    holdingAttack = true;
    attack("strike");
  }
  if (mode === "pan") e.preventDefault();
});
canvas.addEventListener("pointermove", (e) => {
  const p = pointers.get(e.pointerId);
  if (!p || !view || panel) return;
  const x = e.clientX,
    y = e.clientY;
  const dx = x - p.x,
    dy = y - p.y;
  const other =
    p.mode === "touch" &&
    [...pointers.values()].find((q) => q !== p && q.mode === "touch");
  if (other) {
    const previous = Math.hypot(p.x - other.x, p.y - other.y);
    const current = Math.hypot(x - other.x, y - other.y);
    if (previous > 8 && current > 8) {
      view.rig.zoom(previous / current);
      const a =
        Math.atan2(y - other.y, x - other.x) -
        Math.atan2(p.y - other.y, p.x - other.x);
      view.rig.orbit(Math.atan2(Math.sin(a), Math.cos(a)), 0);
    }
    p.moved = other.moved = true;
  } else {
    p.moved ||= Math.hypot(x - p.sx, y - p.sy) > 7;
    if (p.mode === "pan") {
      const scale = view.rig.distance / 470;
      view.rig.translate(-dx * scale, dy * scale);
    }
    if (p.mode === "orbit" || (p.mode === "touch" && p.moved))
      view.rig.orbit(-dx * 0.006, dy * 0.004);
  }
  p.x = x;
  p.y = y;
});
function endPointer(e) {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  pointers.delete(e.pointerId);
  if (p.mode === "attack") holdingAttack = false;
  if (!view || !playing || panel) return;
  if (
    e.type === "pointerup" &&
    !p.moved &&
    e.timeStamp - p.startedAt <= 500 &&
    (p.mode === "tap" || p.mode === "touch")
  ) {
    const enemy=view.pickEnemy(e.clientX,e.clientY);
    if(enemy){cancelTravel();sim.locked=enemy;notify("Target locked");}
    else {
      const target=view.pick(e.clientX,e.clientY);
      if(target?.type)startGather(target);
      else beginTravel(target);
    }
  }
  if (p.mode === "orbit" || p.mode === "touch") saveCamera();
}
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  canvas.addEventListener(type, endPointer);
canvas.addEventListener(
  "wheel",
  (e) => {
    if (!view || !playing || panel) return;
    view.rig.zoom(
      Math.exp(
        clamp(e.deltaY * (e.deltaMode === 1 ? 15 : 1), -800, 800) * 0.0015,
      ),
    );
    saveCamera();
    e.preventDefault();
  },
  { passive: false },
);
for (const b of $("touch-pad").querySelectorAll("[data-move]")) {
  const key = { up: "w", down: "s", left: "a", right: "d" }[b.dataset.move];
  b.addEventListener("pointerdown", (e) => {
    cancelTravel();
    keys.add(key);
    b.setPointerCapture(e.pointerId);
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    b.addEventListener(event, () => keys.delete(key));
}
function movement() {
  const forward =
      (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0),
    right =
      (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
      (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
    yaw = view?.yaw || 0;
  return {
    x: right * Math.cos(yaw) - forward * Math.sin(yaw),
    z: -forward * Math.cos(yaw) - right * Math.sin(yaw),
  };
}
function gamepadMenu(pad, now) {
  if (pad.pressed.has(1) || pad.pressed.has(9)) return closePanel();
  if (pad.pressed.has(0)) {
    if ($("panels").contains(document.activeElement)) document.activeElement.click();
    return;
  }
  if(now<padNavAt) return;
  const direction=controllerMenuDirection(pad);
  const previous=direction<0, next=direction>0;
  if(!previous&&!next) return;
  const focusable=[...$("panels").querySelectorAll("button:not(:disabled),select:not(:disabled),input:not(:disabled),[tabindex='0']")]
    .filter(o=>o.getClientRects().length && !o.hidden);
  const index=focusable.indexOf(document.activeElement);
  if (!focusable.length) return;
  const nextIndex = index < 0 ? (previous ? focusable.length - 1 : 0)
    : (index + (previous ? -1 : 1) + focusable.length) % focusable.length;
  focusable[nextIndex].focus();
  padNavAt=now+150;
}
const controllerBuildHold=new ControllerBuildHold();
function updateController(now, dt) {
  let connected;
  try { connected=navigator.getGamepads?.(); } catch {}
  const pad=controller.read(connected);
  activePad=document.hasFocus() && !document.hidden ? pad : null;
  const buildRequested=controllerBuildHold.update(activePad,now,!!activePad&&playing&&!panel&&!atMainMenu&&!pad.pressed.has(9));
  if(buildRequested) {
    // Construction integration can preventDefault after opening its real menu.
    const event=new CustomEvent('aetherbound-build-toggle',{cancelable:true});
    if(window.dispatchEvent(event))notify('Build placement is not available in this build yet.');
    return;
  }
  const label=pad?.id || "";
  if(label!==padLabel) {
    padLabel=label;
    $("controller-status").hidden=!label;
    $("controller-status").title=label;
    if(playing && label) notify("Controller connected: X interact, RT attack, Start menus");
  }
  if (activePad && atMainMenu) {
    if (pad.pressed.has(1)) { mainMenu(); return; }
    if (pad.pressed.has(0)) { if ($("landing").contains(document.activeElement)) document.activeElement.click(); return; }
    if (now >= padNavAt) {
      const direction = controllerMenuDirection(pad);
      if (direction) {
        const buttons = [...$("landing").querySelectorAll("button,select,input")];
        buttons[(buttons.indexOf(document.activeElement) + direction + buttons.length) % buttons.length]?.focus();
        padNavAt = now + 180;
      }
    }
    return;
  }
  if(!activePad || !playing) return;
  if(panel) { gamepadMenu(pad,now); return; }
  const actions=controllerActions(pad);
  if(actions.includes('menu')) return openPanel('inventory');
  if (pad.look.x || pad.look.y) {
    const step = Math.min(dt, .05);
    view.rig.orbit(pad.look.x*2.45*step,0);
    view.rig.zoom(Math.exp(pad.look.y*1.45*step));
    saveCamera();
  }
  for(const action of actions) {
    if(action==='interact') startGather();
    else if(action==='jump') { if(sim.player.y===0) sim.player.velocityY=8; }
    else if(action==='autoTarget') toggleAssist('autoTarget');
    else attack(action);
  }
  // B crouch, Y weapon switch and LB+RB F5 are intentionally inactive
  // until their underlying gameplay features exist.

}
function controllerMovement() {
  if(!activePad) return {x:0,z:0};
  const right=activePad.move.x, forward=-activePad.move.y, yaw=view.yaw;
  return {x:right*Math.cos(yaw)-forward*Math.sin(yaw),z:-forward*Math.cos(yaw)-right*Math.sin(yaw)};
}
function floating(event) {
  const point = view.project(
    event.x,
    view.height(event.x, event.z) + 2.5,
    event.z,
  );
  if (!point.visible) return;
  const node = document.createElement("div");
  node.className =
    "floating " +
    (event.critical ? "crit" : "") +
    (event.type === "reaction" ? " reaction" : "");
  node.textContent = event.text || event.amount;
  node.style.left = point.x + "px";
  node.style.top = point.y + "px";
  $("world-labels").append(node);
  setTimeout(() => node.remove(), 1100);
}
function handleEvents() {
  for (const event of sim.events.splice(0)) {
    if (event.type === "skill") view.skillFX(event);
    if (event.type === "damage" || event.type === "reaction") {
      floating(event);
      view.impactFX(event);
    }
    if (event.type === "reflection" || event.type === "guard") floating(event);
    if (event.type === "hurt") {
      gathering = null;
      cancelTravel();
      document.getElementById("hit-flash")?.remove();
      const flash = document.createElement("div");
      flash.id = "hit-flash";
      document.body.append(flash);
      setTimeout(() => flash.remove(), 450);
      sound(100);
    }
    if (event.type === "loot" || event.type === "enrage") notify(event.text);
    if (event.type === "kill") {
      if (event.levels)
        notify(
          "Level " + state.level + " · A new constellation point is available.",
        );
      save();
    }
    if (event.type === "death") {
      cancelTravel();
      view.rig.recenter();
      notify("The sanctuary restores you. 40 gold was lost.");
      save();
    }
  }
}
function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000 || 0.016, 0.25);
  lastFrame = now;
  if (view || atMainMenu) updateController(now,dt);
  if (view) {
    if (playing && now - lastProduction > 1000) {
      const finished = settleProduction(state);
      if (finished) {
        save();
        if (panel === "artisan") openPanel("artisan");
      }
      if (panel === "geology") updateGeologyPanel($("panels"), state);
      if (panel === "nursery") updateNurseryPanel($("panels"), state);
      if (panel === "artisan")
        for (const station of Object.values(state.production.stations))
          for (const job of station.jobs) {
            const time = document.querySelector(`[data-job-time="${job.id}"]`),
              progress = document.querySelector(
                `[data-job-progress="${job.id}"]`,
              );
            if (time) time.textContent = jobTime(job);
            if (progress)
              progress.style.width =
                clamp(
                  ((Date.now() - job.start) / (job.end - job.start)) * 100,
                  0,
                  100,
                ) + "%";
          }
      lastProduction = now;
    }
    const manual = playing && !panel ? movement() : { x: 0, z: 0 };
    if(playing && !panel && !(manual.x || manual.z)) Object.assign(manual,controllerMovement());
    if((manual.x||manual.z) && travel) cancelTravel();
    let input = manual;
    if (playing && !panel) {
      // Advance bounded substeps so low rendering rates do not slow game time.
      let remaining = dt;
      while (remaining > 0) {
        const step = Math.min(remaining, 0.05);
        const p = sim.player;
        const px = p.x,
          pz = p.z;
        input = travel && !(manual.x || manual.z) ? routeInput(step) : manual;
        if (panel) break;
        sim.tick(step, { ...input, guard: keys.has("g") });
        if (travel) {
          travel.stuck =
            Math.hypot(p.x - px, p.z - pz) < 0.001 ? travel.stuck + step : 0;
          if (travel.stuck > 0.65) {
            cancelTravel();
            notify("Route blocked. Choose another spot.");
          }
        }
        state.position = { x: p.x, z: p.z };
        if (holdingAttack || touchPrimaryHeld || activePad?.held.has(7)) attack("strike");
        const primary=skillStats(state,"strike");
        if(updateCombatAssist(sim,{autoTarget:assist.autoTarget && (activePad ? !controllerTargetSuppressed : document.documentElement.dataset.controls!=="touch"),selectTarget:()=>targetInView(sim,view.yaw),autoFire:assist.autoFire,range:primary.range||primary.radius,enabled:inputFocused&&!document.hidden&&!panel&&!gathering})){sound(230);}
        canvas.dataset.autoTarget=String(assist.autoTarget);canvas.dataset.autoFire=String(assist.autoFire);canvas.dataset.lockedTarget=sim.locked?.id||"";
        if (gathering) {
          if (Math.hypot(p.x - gathering.x, p.z - gathering.z) > 0.2)
            gathering = null;
          else {
            gathering.left -= step;
            if (gathering.left <= 0) {
              const result = gather(state, gathering.node);
              if (result.ok && gathering.node.radius) sim.refreshObstacles();
              notify(result.message);
              gathering = null;
              save();
              sound(740);
            }
          }
        }
        handleEvents();
        remaining -= step;
      }
      if (now - lastDiscovery > 400) {
        lastDiscovery = now;
        const before = sim.blockers.length;
        sim.refreshObstacles();
        if (sim.blockers.length !== before && travel)
          beginTravel(travel.target);
        const found = discover(state, view.features, sim.player);
        if (found.length) {
          state.professions.surveying += found.length * 12;
          notify("Surveyed · " + found.map((f) => f.name).join(", "));
          save();
        }
      }
      if (now - lastSave > 5000) save();
    }
    view.gathering = gathering?.node.kind;
    view.update(dt, input, now / 1000);
    if (playing && now - lastHud > 100) {
      updateHUD();
      lastHud = now;
    }
  }
  requestAnimationFrame(frame);
}
addEventListener("pagehide", save);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    keys.clear();
    cancelTravel();
    holdingAttack = false;
  touchPrimaryHeld = false;
    save();
  }
});
async function boot() {
  await Promise.all([loadNative(), loadSurfaces(), loadAvatarRigs(), loadFieldArt()]);
  try {
    buildView();
    landing();
    $("loading").hidden = true;
    requestAnimationFrame(frame);
  } catch (error) {
    $("loading").innerHTML =
      "<b>3D rendering is unavailable</b><span>" +
      escape(error.message) +
      '</span><a href="classic.html">Play the Classic RPG instead →</a>';
    console.error(error);
  }
}
boot();
if ("serviceWorker" in navigator && location.protocol.startsWith("http"))
  navigator.serviceWorker.register("./sw.js").catch(console.warn);
