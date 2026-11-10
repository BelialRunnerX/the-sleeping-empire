import { FIBRE_PLANTS } from "./ecology.mjs";
import {
  canAffordNursery,
  cropReadyAt,
  cropStage,
  CROP_STAGES,
  nearNursery,
  NURSERY,
  NURSERY_TIERS,
} from "./nursery.mjs";

export function nurseryPanel(state) {
  const { tier, plots } = state.nursery;
  const here = nearNursery(state),
    now = Date.now();
  const next = NURSERY_TIERS[tier + 1];
  const travel = here
    ? ""
    : state.realm === "bastion"
      ? `<button data-world-station="${NURSERY.id}">TRAVEL TO HYDROPONICS →</button>`
      : '<button data-panel="realms">OPEN WAYGATES →</button>';
  return `<article class="card"><h3>${NURSERY.name}</h3>
    <p>Gather wild Loomflax and Downbloom to collect seeds. Plant them in hydroponic beds and harvest the mature fibres for field cord.</p>
    <p>${tier ? `Tier ${tier} · ${plots.length} beds · ${NURSERY_TIERS[tier].interval / 1000}s per growth stage` : "Construction blueprint"}
    · Growth continues while you explore or log out.</p>
    <div class="resource-line">${Object.values(FIBRE_PLANTS)
      .map(
        (plant) =>
          `<span>${plant.name} seed × ${state.resources[plant.seed]}</span>`,
      )
      .join("")}</div>
    ${travel}
    ${
      next
        ? `<p>${Object.entries(next.cost)
            .map(([id, count]) => `${state.resources[id]}/${count} ${id}`)
            .join(" · ")}</p>
      <button class="gold-button" data-build-nursery ${here && canAffordNursery(state, next.cost) ? "" : "disabled"}>
      ${tier ? "INSTALL NUTRIENT ARRAY · 4 BEDS" : "BUILD HYDROPONICS · 2 BEDS"}</button>`
        : ""
    }
    </article>
    <div class="grid-2">${plots
      .map(
        (crop, index) => `<article class="card">
      <span class="kicker">BED ${index + 1}</span>
      <h3>${crop ? FIBRE_PLANTS[crop.species].name : "Open bed"}</h3>
      ${
        crop
          ? `<p data-crop-status="${index}">${cropStatus(crop, now)}</p>
        <progress value="${cropStage(crop, now)}" max="${CROP_STAGES - 1}" data-crop-growth="${index}" aria-label="Bed ${index + 1} growth"></progress>
        <div><button data-harvest-crop="${index}" ${here && now >= cropReadyAt(crop) ? "" : "disabled"}>HARVEST</button></div>`
          : Object.entries(FIBRE_PLANTS)
              .map(
                ([id, plant]) =>
                  `<button data-plant-crop="${id}" data-bed="${index}" ${here && state.resources[plant.seed] > 0 ? "" : "disabled"}>PLANT ${plant.name.toUpperCase()}</button>`,
              )
              .join(" ")
      }
      </article>`,
      )
      .join("")}</div>`;
}

function cropStatus(crop, now) {
  const seconds = Math.ceil((cropReadyAt(crop) - now) / 1000);
  return seconds <= 0
    ? "Mature · ready to harvest"
    : `Growth stage ${cropStage(crop, now) + 1}/${CROP_STAGES} · ${Math.floor(seconds / 60)}m ${seconds % 60}s remaining`;
}

export function updateNurseryPanel(container, state) {
  const now = Date.now(),
    here = nearNursery(state);
  for (const label of container.querySelectorAll("[data-crop-status]")) {
    const index = label.dataset.cropStatus,
      crop = state.nursery.plots[index];
    if (!crop) continue;
    label.textContent = cropStatus(crop, now);
    container.querySelector(`[data-crop-growth="${index}"]`).value = cropStage(
      crop,
      now,
    );
    container.querySelector(`[data-harvest-crop="${index}"]`).disabled =
      !here || now < cropReadyAt(crop);
  }
}
