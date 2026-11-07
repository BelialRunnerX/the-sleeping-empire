import {
  HEROES,
  SKILLS,
  SUPPORTS,
  PASSIVES,
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
  craft,
  alterItem,
  claimQuest,
  summon,
  Simulation,
  clamp,
} from "./simulation.mjs";
import { loadNative, numeric } from "./native.mjs";
import { Profiles } from "./profiles.mjs";
import { WorldView, ground } from "./world.mjs";
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
let state = freshState(),
  sim = new Simulation(state),
  view,
  playing = false,
  panel = null,
  gathering = null,
  lastFrame = 0,
  lastHud = 0,
  lastSave = 0,
  dragging = false,
  lastPointer = { x: 0, y: 0 },
  noticeId = 0,
  holdingAttack = false,
  muted = false,
  audio;
const tabs = [
  ["inventory", "Equipment"],
  ["skills", "Skill links"],
  ["passives", "Constellation"],
  ["lifeskills", "Lifeskills"],
  ["crafting", "Workshop"],
  ["heroes", "Heroes"],
  ["journal", "Journal"],
  ["realms", "Waygates"],
  ["settings", "Settings"],
];
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
  view = new WorldView($("world"), state, sim);
}
function landing() {
  playing = false;
  panel = null;
  keys.clear();
  $("panels").hidden = true;
  $("hud").hidden = true;
  $("landing").hidden = false;
  $("landing").innerHTML =
    `<section class="landing-copy"><div class="landing-ornament">✧ &nbsp; THE SLEEPING EMPIRE</div><h1>Aetherbound<em>ASTRAL EMPIRE</em></h1><div class="landing-rule"></div><p>Beyond the veil, a world is waking.<br>Forge your own path through steel, starlight, and the quiet art of living.</p><div class="profile-list">${profiles
      .list()
      .map(
        (p) =>
          `<button data-profile="${escape(p.name)}">${escape(p.name)}</button>`,
      )
      .join(
        "",
      )}</div><form id="login-form"><div class="auth-fields"><label>COMMANDER NAME<input id="profile-name" maxlength="24" autocomplete="username" placeholder="Your name" required></label><label>LOCAL PIN<input id="profile-pin" type="password" minlength="4" maxlength="12" autocomplete="current-password" placeholder="4–12 characters" required></label></div><div class="auth-actions"><button class="gold-button" type="submit">CONTINUE →</button><button type="button" data-action="create">NEW ADVENTURE</button></div><div class="auth-error" id="auth-error" role="alert"></div></form><p class="local-note">Single-player frontier · Local profiles and automatic saves.<br>Export your progress to carry it to another browser.</p></section><div class="realm-badge"><span>CHAPTER I · THE EMERALD FRONTIER</span><b>A world waiting to be lived in.</b></div><footer class="landing-footer"><a href="../../">← Living Codex</a><a href="classic.html">Classic gacha RPG</a><span>V3 · Aetherbound</span></footer>`;
}
function enter(create) {
  try {
    const name = $("profile-name").value,
      pin = $("profile-pin").value;
    state = profiles.login(name, pin, create);
    playing = true;
    buildView();
    $("landing").hidden = true;
    $("hud").hidden = false;
    panel = null;
    renderBar();
    updateHUD();
    notify(
      "Welcome to Dawnwake. The workshop is west; the Hollowborn lurk north.",
    );
    sound(660);
    save();
  } catch (error) {
    $("auth-error").textContent = error.message;
  }
}
function renderBar() {
  $("skillbar").innerHTML =
    SKILLS.map(
      (s) =>
        `<button class="skill" data-skill="${s.id}" title="${escape(s.name)} · ${s.cost} mana"><span>${s.icon}</span><small>${s.key}</small><i class="cooldown" id="cd-${s.id}"></i><b class="cooldown-text" id="ct-${s.id}"></b></button>`,
    ).join("") +
    `<button class="skill potion" data-action="potion" title="Restorative draught [F]"><span>♧</span><small id="potion-count">F · ${state.resources.potions}</small><i class="cooldown" id="cd-potion"></i><b class="cooldown-text" id="ct-potion"></b></button>`;
}
function updateHUD() {
  const p = sim.player,
    st = stats(state),
    hero = HEROES.find((h) => h.id === state.hero);
  $("hero-name").textContent = hero.name;
  $("hero-glyph").textContent = hero.name[0];
  $("class-name").textContent = hero.role.toUpperCase();
  $("level").textContent = "LV. " + state.level;
  $("life-fill").style.width = clamp((p.hp / st.life) * 100, 0, 100) + "%";
  $("life-text").textContent = fmt(p.hp) + " / " + fmt(st.life);
  $("mana-fill").style.width = (p.mana / st.mana) * 100 + "%";
  $("stamina-fill").style.width = p.stamina + "%";
  $("xp-fill").style.width = (state.xp / (state.level * 100)) * 100 + "%";
  $("potion-count").textContent = "F · " + state.resources.potions;
  $("realm-name").textContent = REALMS.find((r) => r.id === state.realm).name;
  $("coordinates").textContent = Math.round(p.x) + " , " + Math.round(p.z);
  $("zone-label").textContent =
    Math.hypot(p.x, p.z) < 14
      ? "Dawnwake Sanctuary"
      : p.z < -35
        ? "The Hollow Crown"
        : "Whispering Expanse";
  for (const skill of SKILLS) {
    const left = sim.cooldowns[skill.id] || 0,
      full = skillStats(state, skill.id).cooldown;
    $("cd-" + skill.id).style.height = (left / full) * 100 + "%";
    $("ct-" + skill.id).textContent = left > 0 ? left.toFixed(1) : "";
  }
  $("cd-potion").style.height = (sim.potionCD / 12) * 100 + "%";
  $("ct-potion").textContent = sim.potionCD > 0 ? Math.ceil(sim.potionCD) : "";
  const target = sim.locked?.hp > 0 ? sim.locked : sim.nearest(16);
  $("target-hud").hidden = !target;
  if (target) {
    $("target-name").textContent = target.boss
      ? "THE SLEEPING WARDEN"
      : "Hollowborn · Lv. " + target.level;
    $("target-life").style.width =
      clamp((target.hp / target.max) * 100, 0, 100) + "%";
    $("target-intent").textContent =
      target.phase === "windup"
        ? "CHARGED STRIKE · EVADE"
        : target.phase === "recover"
          ? "EXPOSED · STRIKE NOW"
          : sim.locked === target
            ? "TARGET LOCKED"
            : "Q · LOCK TARGET";
  }
  const objective = QUESTS.find((q) => !state.claimed.includes(q.id));
  if (objective) {
    const progress =
      objective.stat === "passives"
        ? state.passives.length
        : state.statistics[objective.stat];
    $("objective-title").textContent = objective.name;
    $("objective-text").textContent =
      objective.description +
      " " +
      Math.min(progress, objective.goal) +
      " / " +
      objective.goal;
  } else {
    $("objective-title").textContent = "Beyond the horizon";
    $("objective-text").textContent =
      "Improve your build, master professions, and open new waygates.";
  }
  const node = view.nearestNode();
  $("interaction").hidden = !!panel || !node;
  if (node) {
    const job = PROFESSIONS.find((p) => p.node === node.kind);
    $("interact-name").textContent =
      node.kind === "ore"
        ? "Cobalt outcrop"
        : node.kind === "tree"
          ? "Lumenwood tree"
          : node.kind === "herb"
            ? "Starleaf cluster"
            : "Moonfin shallows";
    $("interact-detail").textContent = gathering
      ? "Gathering… stay still"
      : job.name + " · Mastery " + professionLevel(state, job.id);
  }
  $("gather-progress").style.width = gathering
    ? (1 - gathering.left / gathering.total) * 100 + "%"
    : "0%";
  drawMap();
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
  c.translate(90, 90);
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
    ["CRITICAL CHANCE", Math.round(s.crit * 100) + "%"],
    ["CRITICAL MULTIPLIER", Math.round(s.critMultiplier * 100) + "%"],
    ["PENETRATION", Math.round(s.penetration * 100) + "%"],
    ["PASSIVES", state.passives.length + " / " + (state.level + 3)],
  ]
    .map(
      ([key, v]) =>
        `<div class="stat-box"><small>${key}</small><b>${v}</b></div>`,
    )
    .join("")}</div>`;
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
        return `<article class="card ${equipped ? "selected" : ""}"><div class="row spread"><span class="tag ${i.rarity}">${i.rarity.toUpperCase()} ${i.slot.toUpperCase()}</span><span class="small muted">ILVL ${i.level}</span></div><h3 class="${i.rarity}" style="margin-top:12px">${escape(i.name)} ${i.quality ? "+" + i.quality : ""}</h3><p>${Math.round(i.base * (1 + i.quality * 0.04))} base ${i.slot === "weapon" ? "hit power" : i.slot === "armor" ? "armor" : "mana"}</p>${i.affixes.map((a) => `<div class="affix">+${a.value < 1 ? Math.round(a.value * 100) + "%" : Math.round(a.value)} ${escape(a.stat)}</div>`).join("")}<div class="item-actions"><button data-item="${i.id}" data-item-action="equip" ${equipped ? "disabled" : ""}>${equipped ? "EQUIPPED" : "EQUIP"}</button><button data-item="${i.id}" data-item-action="temper" ${state.resources.cobalt < 2 || state.gold < 50 || i.quality >= 20 ? "disabled" : ""}>TEMPER · 2 cobalt + 50g</button><button data-item="${i.id}" data-item-action="reroll" ${!state.resources.essence ? "disabled" : ""}>RESHAPE · 1 essence</button><button data-item="${i.id}" data-item-action="salvage" ${equipped ? "disabled" : ""}>SALVAGE</button></div></article>`;
      })
      .join("")}</div>`
  );
}
function skills() {
  return `<p class="small muted">Link up to two different supports to each skill. Matching tags determine compatibility. Mana, cooldowns, area, and damage update immediately.</p><div class="grid-2">${SKILLS.map(
    (skill) => {
      const modified = skillStats(state, skill.id);
      return `<article class="card"><div class="row spread"><h3>${skill.icon} ${skill.name}</h3><span class="tag">${skill.key}</span></div><p>${skill.description}</p><div class="row">${skill.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div><p>${Math.round(modified.cost)} mana · ${modified.cooldown.toFixed(2)}s cooldown · ${Math.round(modified.power * modified.damage * 100)}% power · ${modified.radius.toFixed(1)}m radius</p>${
        skill.id !== "strike"
          ? `<div class="support-row">${[0, 1]
              .map(
                (i) =>
                  `<label>SUPPORT SOCKET ${i + 1}<select data-link-skill="${skill.id}" data-link-index="${i}">${SUPPORTS.filter(
                    (s) =>
                      !s.tags || s.tags.some((t) => skill.tags.includes(t)),
                  )
                    .map(
                      (s) =>
                        `<option value="${s.id}" ${(state.links[skill.id]?.[i] || "none") === s.id ? "selected" : ""}>${s.name}</option>`,
                    )
                    .join("")}</select></label>`,
              )
              .join(
                "",
              )}</div><div class="support-notes">${modified.supports.map((name) => SUPPORTS.find((s) => s.name === name)?.desc).join("<br>") || "No support linked."}</div>`
          : '<p class="support-notes">Weapon combo cannot be linked. Its third hit staggers enemies and deals 55% more damage.</p>'
      }</article>`;
    },
  ).join("")}</div>`;
}
function constellation() {
  return `<div class="row spread"><p class="small muted">Follow connected paths from the center. Click a node to allocate; click an allocated leaf to refund it freely.</p><span class="tag">${state.level + 3 - state.passives.length} POINTS AVAILABLE</span></div><div class="talent-view"><svg viewBox="-360 -350 720 700" role="img" aria-label="Passive constellation">${PASSIVES.filter(
    (p) => p.parent,
  )
    .map((p) => {
      const parent = PASSIVES.find((v) => v.id === p.parent),
        active = state.passives.includes(p.id);
      return `<line x1="${parent.x}" y1="${parent.y}" x2="${p.x}" y2="${p.y}" stroke="${active ? "#d4bd8e" : "#687583"}" opacity="${active ? 1 : 0.4}"/>`;
    })
    .join("")}${PASSIVES.map((p) => {
    const allocated = p.id === "origin" || state.passives.includes(p.id),
      available = p.parent === "origin" || state.passives.includes(p.parent);
    return `<g class="talent-node ${allocated ? "allocated" : available ? "available" : ""}" data-passive="${p.id}" role="button" tabindex="0" aria-label="${escape(p.name + ": " + p.desc)}"><title>${escape(p.name + " — " + p.desc)}</title><circle cx="${p.x}" cy="${p.y}" r="${p.id === "origin" ? 24 : p.notable ? 15 : 9}"/><text x="${p.x}" y="${p.y + (p.notable ? 30 : 22)}" text-anchor="middle">${escape(p.name)}</text><text x="${p.x}" y="${p.y + 3}" text-anchor="middle">${p.id === "origin" ? "✧" : p.stat === "keystone" ? "✺" : allocated ? "◆" : ""}</text></g>`;
  }).join(
    "",
  )}</svg></div><div class="talent-info" id="talent-info"><b>Six paths. One constellation.</b><span>30 allocatable nodes and 6 capstone tradeoffs. Hover or focus a node for its effect.</span></div>`;
}
function lifeskills() {
  return `<div class="grid-3">${PROFESSIONS.map((p) => {
    const level = professionLevel(state, p.id),
      xp = state.professions[p.id];
    return `<article class="card"><div class="icon">${p.icon}</div><div class="row spread"><h3>${p.name}</h3><span class="tag">MASTERY ${level}</span></div><p>${p.desc}</p><div class="quest-progress"><i style="width:${clamp(((xp - 30 * (level - 1) ** 2) / (30 * level ** 2 - 30 * (level - 1) ** 2)) * 100, 0, 100)}%"></i></div><p>${fmt(xp)} lifetime XP · ${p.node ? "Each 3 mastery levels adds one resource per gather." : "Crafting grants profession experience."}</p></article>`;
  }).join(
    "",
  )}</div><div class="row" style="margin-top:16px"><button class="gold-button" data-panel="crafting">OPEN WORKSHOP →</button><span class="small muted">Resources recover after 3 minutes. Progress saves through logout.</span></div>`;
}
function workshop() {
  return `<div class="resource-line">${Object.entries(state.resources)
    .map(([key, n]) => `<span>${key} <b>${n}</b></span>`)
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
  )}</div><div class="card" style="margin-top:12px"><h3>Field provisions</h3><p>Food grants +60 maximum life and +35% recovery for 15 minutes. Draughts recover 45% maximum life with a 12-second cooldown.</p><button data-action="eat" ${state.resources.meal < 1 ? "disabled" : ""}>EAT MOONFIN FEAST (${state.resources.meal})</button></div>`;
}
function heroes() {
  return `<div class="row spread"><p class="small muted">${state.heroes.length}/12 heroes · ${state.crystals} crystals · ${state.tickets} summon tickets · 5★ pity ${state.pity}/40</p><button class="gold-button" data-action="summon" ${state.tickets < 1 && state.crystals < 160 ? "disabled" : ""}>SUMMON · ${state.tickets ? "1 TICKET" : "160 CRYSTALS"}</button></div><p class="small muted">Switch heroes in the sanctuary or out of combat. Their signature trait changes your build. Duplicate summons grant two transmutation essences.</p><div class="grid-3">${HEROES.map(
    (h) => {
      const owned = state.heroes.includes(h.id),
        active = state.hero === h.id;
      return `<article class="card ${active ? "selected" : ""}"><div class="row spread"><span class="icon" style="color:${h.color}">✧</span><span class="tag">${h.element.toUpperCase()}</span></div><h3>${h.name}</h3><p>${h.title} · ${h.role}</p><p>${h.perk}</p><button data-hero="${h.id}" ${!owned || active ? "disabled" : ""}>${active ? "ACTIVE HERO" : owned ? "TAKE THE FIELD" : "NOT RECRUITED"}</button></article>`;
    },
  ).join("")}</div>`;
}
function journal() {
  return `<div class="grid-2">${QUESTS.map((q) => {
    const value =
        q.stat === "passives"
          ? state.passives.length
          : state.statistics[q.stat],
      claimed = state.claimed.includes(q.id);
    return `<article class="card"><h3>${q.name}</h3><p>${q.description}</p><div class="quest-progress"><i style="width:${Math.min(value / q.goal, 1) * 100}%"></i></div><div class="row spread"><span class="small">${Math.min(value, q.goal)} / ${q.goal}</span><span class="tag">${q.gold} GOLD · ${q.crystals} CRYSTALS</span></div><button data-quest="${q.id}" ${value < q.goal || claimed ? "disabled" : ""}>${claimed ? "CLAIMED" : "CLAIM REWARD"}</button></article>`;
  }).join(
    "",
  )}</div><p class="small muted">Follow the pale path north to find the Sleeping Warden. Its large charged strike can be evaded; attack while it recovers.</p>`;
}
function realms() {
  return `<p class="small muted">Waygates open as your account level rises. Each destination has its own terrain palette, resources, and enemy progression.</p><div class="grid-2">${REALMS.map((r) => `<article class="card ${state.realm === r.id ? "selected" : ""}"><h3>${r.name}</h3><p>${r.gravity} g source world · ${r.tier === 0 ? "Frontier sanctuary" : "Requires level " + r.tier * 10}</p><button data-realm="${r.id}" ${state.level < r.tier * 10 || r.id === state.realm ? "disabled" : ""}>${r.id === state.realm ? "CURRENT REALM" : state.level < r.tier * 10 ? "WAYGATE LOCKED" : "TRAVEL"}</button></article>`).join("")}</div>`;
}
function settings() {
  return `<div class="grid-2"><article class="card"><h3>${escape(profiles.active?.name)}’s chronicle</h3><p>Automatic saves every five seconds and after progression changes. Your previous save is retained as a local recovery copy.</p><button data-action="export">EXPORT SAVE</button> <button data-action="import">IMPORT BACKUP</button><input id="save-file" type="file" accept="application/json,.json" hidden><p class="small">Profile login and saves are stored on this device. Cloud accounts and multiplayer servers are not connected.</p></article><article class="card"><h3>Field settings</h3><p>Simulation: ${numeric.backend}<br>Right mouse drag: camera orbit<br>Mouse wheel: camera distance<br>Shift: evade · Space: jump<br>I: gear · K: skills · P: passives · L: lifeskills<br>C: crafting · H: heroes · J: journal · Esc: close</p><button data-action="mute">${muted ? "ENABLE" : "MUTE"} SOUND</button> <button data-action="logout">SAVE & LOG OUT</button><p><a href="classic.html">Open Classic gacha RPG →</a></p></article></div>`;
}
function openPanel(id) {
  if (!playing) return;
  gathering = null;
  holdingAttack = false;
  keys.clear();
  panel = id;
  $("panels").hidden = false;
  const title = tabs.find((t) => t[0] === id)?.[1] || "Chronicle";
  $("panels").innerHTML =
    `<section class="panel-window" role="dialog" aria-modal="true" aria-label="${title}"><header class="panel-top"><div><span class="kicker">THE AETHERBOUND CHRONICLE</span><h2>${title}</h2></div><button class="panel-close" data-action="close" aria-label="Close panel">×</button></header><nav class="panel-tabs">${tabs.map(([key, name]) => `<button data-panel="${key}" class="${panel === key ? "active" : ""}">${name}</button>`).join("")}</nav><div class="panel-body">${({ inventory, skills, passives: constellation, lifeskills, crafting: workshop, heroes, journal, realms, settings }[id] || inventory)()}</div></section>`;
  $("panels").querySelector(".panel-close").focus();
}
function closePanel() {
  panel = null;
  $("panels").hidden = true;
  keys.clear();
}
function combatSafe() {
  return !sim.enemies.some(
    (e) =>
      e.hp > 0 &&
      e.phase !== "idle" &&
      Math.hypot(e.x - sim.player.x, e.z - sim.player.z) < 18,
  );
}
function attack(id) {
  if (!playing || panel) return;
  if (sim.attack(id)) {
    gathering = null;
    sound(id === "strike" ? 230 : 520);
  } else if (sim.player.mana < (skillStats(state, id)?.cost || 0))
    notify("Not enough mana.");
}
function startGather() {
  if (!playing || panel) return;
  const node = view.nearestNode();
  if (!node) return;
  if (!combatSafe()) {
    notify("Clear nearby hostiles before gathering.");
    return;
  }
  const total = node.kind === "fish" ? 3 : 1.5;
  gathering = { node, left: total, total, x: sim.player.x, z: sim.player.z };
  sound(300);
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
document.addEventListener("click", (e) => {
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
  if (!playing) return;
  if (action === "dodge") {
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
          ? "Refund the outer nodes first."
          : "Connect to this node and earn more passive points.",
      );
      return;
    }
    save();
    openPanel("passives");
    sound(700);
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
  if (n.dataset.item) {
    const ok = alterItem(state, n.dataset.item, n.dataset.itemAction);
    notify(ok ? "Equipment updated." : "That equipment change is unavailable.");
    if (ok) {
      save();
      openPanel("inventory");
    }
    return;
  }
  if (n.dataset.hero) {
    if (!combatSafe()) {
      notify("Leave combat before changing heroes.");
      return;
    }
    if (state.heroes.includes(n.dataset.hero)) {
      state.hero = n.dataset.hero;
      view.setHero();
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
    case "summon": {
      const h = summon(state);
      if (h) {
        notify(
          h.rarity +
            "★ " +
            h.name +
            (h.duplicate ? " · Duplicate → 2 essences" : " joins your roster"),
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
    case "logout":
      save();
      profiles.logout();
      landing();
      break;
  }
});
document.addEventListener("change", async (e) => {
  const n = e.target;
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
document.addEventListener("pointerover", (e) => {
  const n = e.target.closest("[data-passive]");
  if (n && $("talent-info")) {
    const p = PASSIVES.find((p) => p.id === n.dataset.passive);
    $("talent-info").textContent = p.name + " · " + p.desc;
  }
});
document.addEventListener("keydown", (e) => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === "Escape") {
    closePanel();
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
    h: "heroes",
    j: "journal",
    o: "settings",
  };
  if (shortcuts[k]) {
    if (panel === shortcuts[k]) closePanel();
    else openPanel(shortcuts[k]);
    return;
  }
  if (panel) return;
  if (
    [
      " ",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "shift",
      "tab",
    ].includes(k)
  )
    e.preventDefault();
  keys.add(k);
  if (e.repeat) return;
  if (k === "shift") sim.dodge(...Object.values(movement()).slice(0, 2));
  if (k === " " && sim.player.y === 0) sim.player.velocityY = 8;
  if (k === "q") sim.locked = sim.locked ? null : sim.nearest(30);
  if (k === "e") startGather();
  if (k === "f") {
    sim.heal();
    save();
  }
  const skill = { 1: "lance", 2: "nova", 3: "dash", 4: "burst" }[k];
  if (skill) attack(skill);
});
document.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
addEventListener("blur", () => {
  keys.clear();
  holdingAttack = false;
  dragging = false;
});
$("world").addEventListener("contextmenu", (e) => e.preventDefault());
$("world").addEventListener("pointerdown", (e) => {
  if (e.button === 2) {
    dragging = true;
    lastPointer = { x: e.clientX, y: e.clientY };
    $("world").setPointerCapture(e.pointerId);
  } else if (e.button === 0 && playing && !panel) {
    holdingAttack = true;
    attack("strike");
  }
});
addEventListener("pointerup", () => {
  dragging = false;
  holdingAttack = false;
});
addEventListener("pointermove", (e) => {
  if (dragging) {
    view.yaw -= (e.clientX - lastPointer.x) * 0.006;
    view.pitch = clamp(
      view.pitch + (e.clientY - lastPointer.y) * 0.004,
      -0.1,
      1,
    );
    lastPointer = { x: e.clientX, y: e.clientY };
  }
});
$("world").addEventListener(
  "wheel",
  (e) => {
    view.distance = clamp(view.distance + e.deltaY * 0.008, 5, 20);
    e.preventDefault();
  },
  { passive: false },
);
for (const b of $("touch-pad").querySelectorAll("[data-move]")) {
  const key = { up: "w", down: "s", left: "a", right: "d" }[b.dataset.move];
  b.addEventListener("pointerdown", (e) => {
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
function floating(event) {
  const point = view.project(
    event.x,
    ground(event.x, event.z, state.realm) + 2.5,
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
    if (event.type === "damage" || event.type === "reaction") floating(event);
    if (event.type === "hurt") {
      gathering = null;
      document.getElementById("hit-flash")?.remove();
      const flash = document.createElement("div");
      flash.id = "hit-flash";
      document.body.append(flash);
      setTimeout(() => flash.remove(), 450);
      sound(100);
    }
    if (event.type === "loot") notify(event.text);
    if (event.type === "kill") {
      if (event.levels)
        notify(
          "Level " + state.level + " · A new constellation point is available.",
        );
      save();
    }
    if (event.type === "death") {
      notify("The sanctuary restores you. 40 gold was lost.");
      save();
    }
  }
}
function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000 || 0.016, 0.25);
  lastFrame = now;
  if (view) {
    const input = playing && !panel ? movement() : { x: 0, z: 0 };
    if (playing && !panel) {
      // Advance bounded substeps so low rendering rates do not slow game time.
      let remaining = dt;
      while (remaining > 0) {
        const step = Math.min(remaining, 0.05);
        const previous = { x: sim.player.x, z: sim.player.z };
        sim.tick(step, input);
        const p = sim.player;
        if (
          (Math.abs(p.x - 13) < 3.2 && Math.abs(p.z + 5) < 3.2) ||
          (Math.abs(p.x + 13) < 3.2 && Math.abs(p.z + 4) < 3.2)
        ) {
          p.x = previous.x;
          p.z = previous.z;
        }
        state.position = { x: p.x, z: p.z };
        if (holdingAttack) attack("strike");
        if (gathering) {
          if (Math.hypot(p.x - gathering.x, p.z - gathering.z) > 0.2)
            gathering = null;
          else {
            gathering.left -= step;
            if (gathering.left <= 0) {
              const result = gather(state, gathering.node);
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
      if (now - lastSave > 5000) save();
    }
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
    holdingAttack = false;
    save();
  }
});
async function boot() {
  await loadNative();
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
