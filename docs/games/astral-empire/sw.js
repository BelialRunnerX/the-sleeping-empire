/* Scope-local offline shell. HTML pages use network-first to receive updates. */
const CACHE = "astral-empire-aetherbound-v3-33";
const FILES = [
  "./engine/pistol-model.mjs",
  "./assets/items/aethercoil-pistol.glb",
  "./engine/firearms.mjs",
  "./engine/voxel-trees/voxel-trees-v2.mjs",
  "./engine/voxel-trees/voxel-trees-detailed-core.mjs",
  "./engine/water-traversal.mjs",
  "./engine/terrain-water-view.mjs",
  "./engine/terrain-water-worker.mjs",
  "./engine/terrain-water-mesh.mjs",
  "./engine/world-scale.mjs",
  "./engine/terrain-horizon.mjs",
  "./engine/mountain-hydrology.mjs",
  "./engine/continental-terrain.mjs",
  "./engine/terrain-generation.mjs",
  "./engine/voxel-trees/tree-ecology.mjs",
  "./engine/voxel-trees/tree-gameplay.mjs",
  "./engine/voxel-trees/tree-interaction.mjs",
  "./engine/voxel-trees/tree-mesh.mjs",
  "./engine/voxel-trees/tree-placement.mjs",
  "./engine/voxel-trees/tree-renderer.mjs",
  "./engine/voxel-trees/tree-worker.mjs",
  "./engine/voxel-trees/voxel-trees.mjs",
  "mobile-gui.css",
  "engine/mobile-gui.mjs",
  "./",
  "./index.html",
  "./main-menu.css",
  "./hud-theme.css",
  "./engine/hud-panels.mjs",
  "./assets/solarpunk-menu.png",
  "./engine/main-menu.mjs",
  "./classic.html",
  "./aetherbound.css",
  "./mobile-controls.css",
  "./engine/mobile-controls.mjs",
  "./manifest.webmanifest",
  "./icon.svg",
  "./engine/app.mjs",
  "./engine/combat-assist.mjs",
  "./engine/content.mjs",
  "./engine/simulation.mjs",
  "./engine/progression.mjs",
  "./engine/combat.mjs",
  "./engine/profiles.mjs",
  "./engine/native.mjs",
  "./engine/world.mjs",
  "./engine/art.mjs",
  "./engine/world-surfaces.mjs",
  "./engine/frontier.mjs",
  "./engine/chunks.mjs",
  "./engine/geodes.mjs",
  "./engine/arsenal.mjs",
  "./engine/surfaces.mjs",
  "./engine/avatar-rig.mjs",
  "./engine/controller.mjs",
  "./engine/ecology.mjs",
  "./engine/field-art.mjs",
  "./engine/geology-field.mjs",
  "./engine/geology-ui.mjs",
  "./engine/materials/material-registry.mjs",
  "./engine/materials/material-catalogue.mjs",
  "./engine/geology-source/geology.mjs",
  "./engine/geology-source/ore-manifest.mjs",
  "./engine/native-density.mjs",
  "./engine/terrain-adaptive.mjs",
  "./engine/terrain-collision.mjs",
  "./engine/terrain-field.mjs",
  "./engine/terrain-interval.mjs",
  "./engine/terrain-ledger.mjs",
  "./engine/terrain-mesh.mjs",
  "./engine/terrain-profiles.mjs",
  "./engine/terrain-tools.mjs",
  "./engine/terrain-clip.mjs",
  "./engine/terrain-seams.mjs",
  "./engine/terrain-publication.mjs",
  "./engine/terrain-patch.mjs",
  "./engine/terrain-view.mjs",
  "./engine/terrain-bands.mjs",
  "./engine/terrain-volume.mjs",
  "./engine/terrain-worker.mjs",
  "./engine/nursery.mjs",
  "./engine/microvoxels.mjs",
  "./engine/microvoxel-view.mjs",
  "./engine/nursery-ui.mjs",
  "./engine/nursery-view.mjs",
  "./assets/field/grass.glb",
  "./assets/field/boulder.glb",
  "./assets/field/fibre-plant.glb",
  "./assets/field/fenstag.glb",
  "./assets/field/brackhide.glb",
  "./assets/field/shearjaw.glb",
  "./assets/surfaces/ground-color.webp",
  "./assets/surfaces/ground-normal.webp",
  "./assets/surfaces/slate-color.webp",
  "./assets/surfaces/slate-normal.webp",
  "./assets/surfaces/rock-color.webp",
  "./assets/surfaces/rock-normal.webp",
  "./assets/surfaces/alloy-color.webp",
  "./assets/surfaces/alloy-normal.webp",
  "./assets/surfaces/cloth-normal.webp",
  "./assets/characters/kael.glb",
  "./assets/characters/mira.glb",
  "./vendor/GLTFLoader.js",
  "./vendor/BufferGeometryUtils.js",
  "./vendor/SkeletonUtils.js",
  "./vendor/meshopt_decoder.module.js",
  "./engine/navigation.mjs",
  "./engine/camera.mjs",
  "./engine/codex.mjs",
  "./engine/constellation.mjs",
  "./engine/constellation-ui.mjs",
  "./engine/artisan.mjs",
  "./engine/artisan-ui.mjs",
  "./engine/workstations.mjs",
  "./assets/heroes-anime.webp",
  "./assets/aetherbound-keyart.webp",
  "./native/simulation.wasm",
  "./vendor/three.module.js",
  "./vendor/three.core.js",
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("astral-empire-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin ||
    !request.url.startsWith(self.registration.scope)
  )
    return;
  const documentRequest =
    request.mode === "navigate" || request.destination === "document";
  if (
    documentRequest ||
    request.destination === "script" ||
    request.destination === "style" ||
    new URL(request.url).pathname.endsWith(".wasm")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then(
              (result) =>
                result ||
                (documentRequest
                  ? caches.match("./index.html")
                  : Response.error()),
            ),
        ),
    );
    return;
  }
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }),
    ),
  );
});
