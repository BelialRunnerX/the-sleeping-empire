// Astral Empire browser game smoke tests. Run: node docs/games/astral-empire/tests/smoke.mjs
// Uses the built-in Node.js runtime. No dependencies, server, or browser required.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const directory = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(directory, "../classic.html"), "utf8");
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, "Expected an inline game script");
const gameJS = match[1];
const checks = [];

function test(name, check) {
  check();
  checks.push(name);
  console.log("✓ " + name);
}
function boot(initial) {
  const nodes = {
    app: { innerHTML: "" },
    overlay: { innerHTML: "" },
    "toast-root": { innerHTML: "" },
  };
  const listeners = {};
  const storage = new Map();
  if (initial) storage.set("astral_empire_v1", JSON.stringify(initial));
  const document = {
    getElementById(id) {
      return nodes[id] ?? null;
    },
    addEventListener(event, fn) {
      listeners[event] = fn;
    },
    querySelector() {
      return null;
    },
  };
  const window = { addEventListener() {}, scrollTo() {} };
  const localStorage = {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
  };
  const sandbox = {
    document,
    window,
    localStorage,
    navigator: {},
    console,
    setInterval() {
      return 0;
    },
    setTimeout() {
      return 0;
    },
    clearTimeout() {},
  };
  vm.runInNewContext(gameJS, sandbox, {
    timeout: 5000,
    filename: "index.html:inline-script",
  });
  function action(action, options = {}) {
    const node = {
      dataset: { action, ...options },
      classList: {
        contains() {
          return false;
        },
      },
      closest() {
        return this;
      },
    };
    listeners.click({ target: node, preventDefault() {} });
  }
  return {
    action,
    get html() {
      return nodes.app.innerHTML;
    },
    get overlay() {
      return nodes.overlay.innerHTML;
    },
    get state() {
      const key = [...storage.keys()].find((k) =>
        k.startsWith("astral_empire_profile_"),
      );
      return key ? JSON.parse(storage.get(key)) : null;
    },
    get storage() {
      return storage;
    },
  };
}

const game = boot();
test("Renders local profile login", () =>
  assert.match(game.html, /Log in to continue/));
game.action("create-profile", { name: "Test Commander", pin: "2468" });
test("Creates a persistent version 2 profile", () => {
  assert.equal(game.state.version, 2);
  assert.match(game.html, /OPEN FRONTIER RPG/);
});
game.action("daily");
test("Daily claim saves progress", () => assert.ok(game.state.dailyClaimed));
game.action("page", { id: "roster" });
test("Roster and awakening UI", () =>
  assert.match(game.html, /Astral Awakening/));
game.action("page", { id: "forge" });
const before = game.state.items.length;
game.action("craft");
test("Craft adds a relic", () =>
  assert.equal(game.state.items.length, before + 1));
game.action("page", { id: "battle" });
test("Battle includes Trial and element guide", () => {
  assert.match(game.html, /DAILY ASTRAL TRIAL/);
  assert.match(game.html, /Elemental Warfare/);
});
game.action("start-battle", { mode: "rift" });
test("New encounter shows enemy intent", () =>
  assert.match(game.html, /SHADOW CLAW/));
game.action("battle-move", { move: "skill" });
game.action("battle-select", { index: "1" });
game.action("battle-move", { move: "attack" });
test("Element collision triggers Steam Break", () =>
  assert.match(game.html, /STEAM BREAK/));
game.action("page", { id: "summon" });
game.action("summon", { count: "10" });
test("Summons display results", () =>
  assert.match(game.overlay, /summon results|legendary star/i));
game.action("close-modal");
game.action("page", { id: "world" });
test("Procedural frontier renders and movement saves", () => {
  assert.match(game.html, /Elysium Space Route/i);
  const beforeSteps = game.state.sandbox.steps;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    game.action("move-world", { dx: String(dx), dy: String(dy) });
    if (game.state.sandbox.steps > beforeSteps) break;
  }
  assert.equal(game.state.sandbox.steps, beforeSteps + 1);
});
game.action("page", { id: "expeditions" });
test("Dispatch and achievements remain available", () => {
  assert.match(game.html, /Nebula Reconnaissance/);
  assert.match(game.html, /Astral Conqueror/);
});

const frontierSave = structuredClone(game.state);
frontierSave.sandbox.planet = "emerald_bastion";
frontierSave.sandbox.positions.emerald_bastion = { x: 0, y: 0 };
frontierSave.sandbox.changes = { "emerald_bastion:0,0": "cobalt" };
frontierSave.sandbox.resources = {
  stone: 8,
  wood: 4,
  fiber: 3,
  cobalt: 8,
  null_amethyst: 0,
  ember_slag: 0,
  ice_crystal: 0,
};
const frontier = boot(frontierSave);
frontier.action("create-profile", { name: "Frontier", pin: "9876" });
frontier.action("page", { id: "world" });
const cobaltBefore = frontier.state.sandbox.resources.cobalt;
frontier.action("harvest-world");
test("Harvesting mutates terrain and inventory persistently", () => {
  assert.ok(frontier.state.sandbox.resources.cobalt > cobaltBefore);
  assert.equal(
    frontier.state.sandbox.changes["emerald_bastion:0,0"],
    "depleted",
  );
});
frontier.action("craft-world", { id: "starsteel_pick" });
test("Frontier crafting consumes resources and saves tools", () =>
  assert.equal(frontier.state.sandbox.crafted.starsteel_pick, true));
frontier.action("logout-profile");
test("Logout returns to the login screen", () =>
  assert.match(frontier.html, /Log in to continue/));
frontier.action("login-profile", { name: "Frontier", pin: "9876" });
test("Local login restores the same world changes", () =>
  assert.equal(
    frontier.state.sandbox.changes["emerald_bastion:0,0"],
    "depleted",
  ));

const previous = game.state;
delete previous.trialDate;
delete previous.trialWins;
delete previous.heroes.kael.awakened;
previous.heroes.kael.duplicates = 20;
previous.heroes.kael.level = 60;
previous.heroes.lumi.level = 60;
previous.heroes.mira.level = 60;
previous.gold = 100000;
const veteran = boot(previous);
veteran.action("create-profile", { name: "Veteran", pin: "1357" });
veteran.action("daily");
veteran.action("page", { id: "roster" });
veteran.action("select-hero", { id: "kael" });
veteran.action("awaken-hero", { id: "kael" });
test("Existing saves migrate and awaken correctly", () =>
  assert.equal(veteran.state.heroes.kael.awakened, 1));
veteran.action("page", { id: "battle" });
veteran.action("start-battle", { mode: "trial" });
test("Daily boss can launch", () => assert.match(veteran.html, /TRIAL BOSS/));
for (let i = 0; i < 55 && veteran.html.includes('data-move="attack"'); i++) {
  veteran.action("battle-select", { index: String(i % 3) });
  veteran.action("battle-move", { move: i % 3 === 0 ? "skill" : "attack" });
}
test("Trial victory awards gems and records completion", () => {
  assert.ok(veteran.state.trialDate);
  assert.ok(veteran.state.trialWins >= 1);
  assert.ok(veteran.state.gems >= 2);
});
veteran.action("next-battle");
veteran.action("retreat");
veteran.action("confirm-retreat");
veteran.action("page", { id: "battle" });
test("Daily boss locks after victory", () =>
  assert.match(veteran.html, /data-mode="trial" disabled/));
console.log("All " + checks.length + " Astral Empire smoke tests passed.");
