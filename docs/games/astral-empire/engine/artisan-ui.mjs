import {
  STATIONS, stationDefinitions,
  PROCESS_RECIPES,
  MATERIAL_NAMES,
  nearStation,
  stationCapacity,
  stationSpeed,
  processCost,
  upgradeCost,
} from "./artisan.mjs";
const n = (v) => Math.round(Number(v) || 0).toLocaleString();
const costHtml = (s, cost) =>
  Object.entries(cost)
    .map(
      ([id, count]) =>
        `<span class="${s.resources[id] >= count ? "paid" : "missing"}">${MATERIAL_NAMES[id] || id} <b>${n(s.resources[id])}/${n(count)}</b></span>`,
    )
    .join("");
export function jobTime(job, now = Date.now()) {
  return now < job.start
    ? "Waiting · starts in " + Math.ceil((job.start - now) / 1000) + "s"
    : "Processing · " + Math.max(0, Math.ceil((job.end - now) / 1000)) + "s";
}
export function artisanPanel(s) {
  return `<div class="artisan-intro"><div><span class="kicker">DAWNWAKE ATELIER</span><h3>Give your materials a second life.</h3><p>Build workstations wherever you settle using the Build menu. Paid orders run in sequence, including while you are away. Collect finished goods at their workstation; only waiting orders can be cancelled.</p></div><div class="artisan-chain">Gather <span>→</span> Process <span>→</span> Craft <span>→</span> Equip</div></div><div class="resource-line">${Object.entries(
    s.resources,
  )
    .filter(([, v]) => v > 0)
    .map(([id, v]) => `<span>${MATERIAL_NAMES[id] || id} <b>${n(v)}</b></span>`)
    .join("")}</div><button class="gold-button" data-panel="build">BUILD A WORKSTATION</button><div class="station-grid">${stationDefinitions(s).map((def) => {
    const station = s.production.stations[def.id],
      near = nearStation(s, def.id),
      tier = station.tier,
      capacity = stationCapacity(tier);
    const affordable = (cost) =>
      Object.entries(cost).every(([id, count]) => s.resources[id] >= count);
    const upgrade = upgradeCost(tier);
    return `<article class="card station-card ${tier ? "built" : "blueprint"}" data-station-card="${def.id}"><div class="station-art" style="background-position:${def.cell * 50}% 50%" role="img" aria-label="${def.name}"></div><div class="row spread"><span class="tag">${tier ? "TIER " + tier + " · " + Math.round(stationSpeed(tier) * 100) + "% SPEED" : "CONSTRUCTION BLUEPRINT"}</span><span class="station-location">${near ? "IN REACH" : s.realm !== def.realm ? def.realm.toUpperCase() : Math.ceil(Math.hypot(s.position.x - def.x, s.position.z - def.z)) + "m AWAY"}</span></div><h3>${def.name}</h3><p>${def.desc}</p><button data-track-station="${def.id}">TRACK ON MAP ↗</button>${
      !tier
        ? `<div class="resource-line">${costHtml(s, def.cost)}</div><button class="gold-button" data-build-station="${def.id}" ${!near || !affordable(def.cost) ? "disabled" : ""}>CONSTRUCT WORKSTATION</button><p class="small">Travel to the blueprint to construct it.</p>`
        : `<div class="station-output"><b>${station.completed ? station.completed + " finished orders" : "Output tray empty"}</b><p>${
            Object.entries(station.output)
              .filter(([, count]) => count > 0)
              .map(([id, count]) => n(count) + " " + MATERIAL_NAMES[id])
              .join(" · ") ||
            "Finished goods and profession XP wait here until collected."
          }</p><button data-collect-station="${def.id}" ${!near || !station.completed ? "disabled" : ""}>COLLECT OUTPUT</button></div><div class="row spread"><b class="small">PRODUCTION QUEUE</b><span class="tag">${station.jobs.length}/${capacity}</span></div><div class="production-jobs">${station.jobs.map((job, index) => `<div class="production-job"><b>${PROCESS_RECIPES.find((r) => r.id === job.recipe).name}</b><small data-job-time="${job.id}">${jobTime(job)}</small><div class="quest-progress"><i data-job-progress="${job.id}" style="width:${Math.max(0, Math.min(100, ((Date.now() - job.start) / (job.end - job.start)) * 100))}%"></i></div>${index ? `<button data-cancel-station="${def.id}" data-cancel-job="${job.id}" ${!near ? "disabled" : ""}>CANCEL & REFUND INPUTS</button>` : ""}</div>`).join("") || '<p class="small muted">No orders queued.</p>'}</div><div class="processing-recipes">${PROCESS_RECIPES.filter(
            (r) => r.station === def.kind,
          )
            .map(
              (recipe) =>
                `<div class="processing-recipe"><div class="row spread"><b>${recipe.name}</b><span class="small">${Math.round((recipe.seconds / stationSpeed(tier)) * 10) / 10}s</span></div><div class="resource-line">${costHtml(s, processCost(recipe))}</div><small>${MATERIAL_NAMES[recipe.output.id]} ×${recipe.output.count} · ${recipe.profession} +${recipe.xp} XP on collection</small><div class="row"><button data-process="${recipe.id}" data-process-station="${def.id}" data-quantity="1" ${!near || tier < recipe.tier || station.jobs.length >= capacity || !affordable(processCost(recipe)) ? "disabled" : ""}>${tier < recipe.tier ? "REQUIRES TIER " + recipe.tier : "QUEUE ×1"}</button><button data-process="${recipe.id}" data-process-station="${def.id}" data-quantity="3" ${!near || tier < recipe.tier || station.jobs.length + 3 > capacity || !affordable(processCost(recipe, 3)) ? "disabled" : ""}>×3</button></div></div>`,
            )
            .join(
              "",
            )}</div>${tier < 3 ? `<div class="station-upgrade"><b>Upgrade to tier ${tier + 1}</b><p>Increase speed and queue capacity. The queue must be empty.</p><div class="resource-line"><span>${n(s.gold)}/${upgrade.gold} gold</span>${costHtml(s, upgrade.materials)}</div><button data-upgrade-station="${def.id}" ${!near || station.jobs.length || s.gold < upgrade.gold || !affordable(upgrade.materials) ? "disabled" : ""}>UPGRADE WORKSTATION</button></div>` : '<p class="small">Maximum tier · eight queue slots.</p>'}`
    }</article>`;
  }).join(
    "",
  )}</div><div class="card artisan-next"><h3>Turn refined stock into equipment</h3><p>Epic gear recipes in the Workshop consume processed materials. The aetherblade and distilled conduit require upgraded workstations. Hand-made basics remain available in Personal crafting; equipment requires a nearby matching station.</p><button data-panel="crafting">OPEN EQUIPMENT WORKSHOP →</button></div>`;
}
