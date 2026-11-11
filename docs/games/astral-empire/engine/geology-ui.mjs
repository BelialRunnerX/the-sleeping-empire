import * as T from "../vendor/three.module.js";
import { CORE_FIELD_RECIPE, CORE_DRILL, DRILL_COST, coreDeposits, nearCoreDrill, RAW_COBALT, COBALT_INGOT } from "./geology-field.mjs";
export function geologyPanel(state) {
  const here = nearCoreDrill(state), deposits = coreDeposits(state), next = deposits[0];
  return `<article class="card"><h3>Dawnwake core drill</h3><p>A temporary surface-access adapter for finite underground deposits. This is remote core extraction, not a walkable cave or a completed terrain port.</p>
    <p>${state.geology.fieldRecipe === CORE_FIELD_RECIPE ? 'Seeded broad richness and finer cobalt fields now gate source-eligible ore. This is the Bastion assay recipe, not surveyed-planet travel.' : state.geology.fieldRecipe == null ? 'Legacy source-only deposits are preserved. Adopting seeded richness can reduce remaining ore, but never resets mined cells.' : 'Saved field recipe is unavailable in this build. Extraction is disabled; your identity and depletion are preserved.'}</p>
    ${state.geology.fieldRecipe == null ? `<button data-adopt-core-fields ${here ? '' : 'disabled'}>ADOPT SEEDED RICHNESS (ONE WAY)</button>` : ''}
    <p>Source-derived 16 × 16m borefield ${state.geology.field}, 1. Deepslate below Y0; stone above. Neighboring fields are surveyed by directional boreheads.</p>
    ${!here && state.realm !== "bastion" ? `<button data-panel="realms">OPEN WAYGATES</button>` : !here ? `<button data-world-station="${CORE_DRILL.id}">TRAVEL TO CORE DRILL</button>` : ""}
    ${!state.geology.built ? `<p>${Object.entries(DRILL_COST).map(([k,v])=>`${state.resources[k]}/${v} ${k}`).join(" · ")}</p><button data-build-core ${here && Object.entries(DRILL_COST).every(([k,v])=>state.resources[k]>=v) ? "" : "disabled"}>BUILD CORE DRILL</button>` : `<p>${deposits.length} finite ore cells remaining in this borefield.</p><p>${next ? `Next: ${next.block} at (${next.x}, ${next.y}, ${next.z})` : "Field depleted. Survey another field."}</p><button data-extract-core ${here && next && Date.now() >= state.geology.nextAt ? "" : "disabled"}>EXTRACT CORE</button><p>2.5s between extractions. Mining mastery, yield equipment, Artisan and Luck affect recovered material.</p><button data-core-field="-1" ${here ? "" : "disabled"}>PREVIOUS FIELD</button> <button data-core-field="1" ${here ? "" : "disabled"}>NEXT FIELD</button>`}
    <div class="resource-line"><span>Canonical raw cobalt: ${state.resources[RAW_COBALT]}</span><span>Canonical cobalt ingots: ${state.resources[COBALT_INGOT]}</span></div>
    <p>Refine raw cobalt in the built Foundry, then forge the Cobalt assay lens in the Workshop. Legacy cobalt and billets remain separate.</p><button data-panel="artisan">OPEN ATELIER</button> <button data-panel="crafting">OPEN WORKSHOP</button></article>`;
}
export function updateGeologyPanel(container, state) {
  const button = container.querySelector("[data-extract-core]");
  if (button) button.disabled = !nearCoreDrill(state) || !coreDeposits(state).length || Date.now() < state.geology.nextAt;
}
export function createCoreDrillView(scene, art, height) {
  // Original browser rig. The geological module itself supplies no art.
  const group = new T.Group();
  group.position.set(CORE_DRILL.x, height(CORE_DRILL.x, CORE_DRILL.z), CORE_DRILL.z);
  scene.add(group);
  art.shape(group, "panel", 0x344c5d, 0, .2, 0, 1.8, .4, 1.8);
  art.shape(group, "tube", 0xadc7cc, 0, 1.3, 0, .18, 2.6, .18);
  art.shape(group, "panel", 0x789ba5, 0, 2.1, 0, 1.1, .5, .7);
  art.shape(group, "box", 0x8ce4cf, 0, 1.3, .5, .7, .45, .08);
  return { ...CORE_DRILL, mesh: group };
}
