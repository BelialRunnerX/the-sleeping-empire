import catalogue from "./materials/material-catalogue.mjs";
import { createMaterialRegistry, isCanonicalId } from "./materials/material-registry.mjs";
import { oreManifest } from "./geology-source/ore-manifest.mjs";
import { generateColumn, restoreDepletion, mineDeposit } from "./geology-source/geology.mjs";

export const materials = createMaterialRegistry(catalogue);
export const RAW_COBALT = "elysiumores:raw_cobalt", COBALT_INGOT = "elysiumores:cobalt_ingot";
export const CORE_DRILL = { id: "dawnwake-core-drill", type: "geology", name: "Dawnwake core drill", x: -1, z: 22, radius: 1, height: 2.5 };
export const DRILL_COST = { stone: 3, cobalt: 2, timber: 2 };
const fieldCache = new Map();

// Explicit temporary browser strata/biome adapter, not the overworld generator.
export function sampleCoreStrata(x, y, z) {
  return { block: y <= 0 ? "minecraft:deepslate" : "minecraft:stone",
    tags: [y <= 0 ? "minecraft:deepslate_ore_replaceables" : "minecraft:stone_ore_replaceables"],
    biome: "minecraft:plains", biomeTags: ["minecraft:is_overworld"], airExposed: false };
}
export function normalizeGeology(raw, seed) {
  const state = restoreDepletion(raw, { seed, realm: "bastion" });
  return { ...state, built: raw?.built === true,
    field: Number.isSafeInteger(raw?.field) && Math.abs(raw.field) < 1e6 ? raw.field : 0,
    nextAt: Number.isSafeInteger(raw?.nextAt) && raw.nextAt >= 0 ? Math.min(raw.nextAt, Date.now() + 2500) : 0 };
}
export function preserveCanonicalResources(resources, input) {
  const candidates = Object.fromEntries(Object.entries(input || {}).filter(([id]) => isCanonicalId(id)));
  const { known, unknown } = materials.normalizeInventory(candidates);
  Object.assign(resources, known, unknown); // Unknown valid IDs survive, never become generic money/ore.
}
export function coreDeposits(state) {
  const field = state.geology.field, key = state.seed + ":" + field;
  if (!fieldCache.has(key)) {
    if (fieldCache.size >= 32) fieldCache.delete(fieldCache.keys().next().value);
    const families = new Set(materials.get(RAW_COBALT) && materials.get(COBALT_INGOT) ? ["cobalt"] : []);
    fieldCache.set(key, generateColumn(oreManifest, { x: field, z: 1 }, {
      seed: state.seed, realm: "bastion", availableFamilies: families, sample: sampleCoreStrata,
    }).sort((a, b) => b.y - a.y || a.id.localeCompare(b.id)));
  }
  const depleted = new Set(state.geology.mined);
  return fieldCache.get(key).filter(d => !depleted.has(d.id));
}
export const nearCoreDrill = state => state.realm === "bastion" && Math.hypot(state.position.x - CORE_DRILL.x, state.position.z - CORE_DRILL.z) <= 4;
export function buildCoreDrill(state) {
  if (!nearCoreDrill(state) || state.geology.built || !Object.entries(DRILL_COST).every(([k, v]) => state.resources[k] >= v)) return false;
  for (const [k, v] of Object.entries(DRILL_COST)) state.resources[k] -= v;
  state.geology.built = true;
  return true;
}
export function extractCore(state, amount, now = Date.now()) {
  if (!nearCoreDrill(state) || !state.geology.built || now < state.geology.nextAt || !Number.isSafeInteger(amount) || amount <= 0) return null;
  const deposit = coreDeposits(state)[0];
  if (!deposit || !Number.isSafeInteger((state.resources[RAW_COBALT] || 0) + amount)) return null;
  if (!mineDeposit(state.geology, deposit)) return null;
  state.resources[RAW_COBALT] = (state.resources[RAW_COBALT] || 0) + amount;
  state.geology.nextAt = now + 2500;
  return deposit;
}
export function shiftCoreField(state, direction) {
  if (!nearCoreDrill(state) || !state.geology.built || ![-1, 1].includes(direction) || Math.abs(state.geology.field + direction) >= 1e6) return false;
  state.geology.field += direction;
  return true;
}
