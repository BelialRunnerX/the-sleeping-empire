import { CONSTELLATION } from "./content.mjs";
import { canAllocate } from "./progression.mjs";
import { passiveBudget } from "./codex.mjs";

const viewport = { x: 0, y: 0, zoom: 1 };
const bound = (n, min, max) => Math.min(max, Math.max(min, n));
export function constellationPanel(state) {
  const { nodes, edges, byId, titles } = CONSTELLATION;
  const selected = new Set(["origin", ...state.passives]);
  const c = (n) =>
    n.id === "origin"
      ? "origin"
      : n.type ||
        (n.stat === "keystone" ? "doctrine" : n.notable ? "notable" : "major");
  const radii = {
    origin: 22,
    major: 11,
    minor: 9,
    road: 10,
    notable: 18,
    doctrine: 19,
  };
  return `<div class="constellation-top"><div><p class="small muted">Wheel to zoom at the pointer · Drag to pan · Click to allocate or refund</p><span class="tag">${passiveBudget(state) - state.passives.length} POINTS AVAILABLE</span> <span class="small muted">${nodes.length - 1} nodes · 24 circuits</span></div>
  <div class="row"><button data-tree-zoom="out" aria-label="Zoom constellation out">−</button><button data-tree-zoom="in" aria-label="Zoom constellation in">+</button><button data-tree-zoom="fit">FIT</button></div></div>
  <div class="talent-view"><svg aria-label="Passive constellation" viewBox="-910 -910 1820 1820">
  <defs><pattern id="star-pattern" width="51" height="73" patternUnits="userSpaceOnUse"><circle cx="12" cy="29" r="1.1" fill="#aac8e1" opacity=".35"/><circle cx="39" cy="67" r=".75" fill="#cfb8fb" opacity=".4"/></pattern><radialGradient id="web-glow"><stop stop-color="#395476"/><stop offset="1" stop-color="#121e32"/></radialGradient></defs>
  <rect x="-4000" y="-4000" width="8000" height="8000" fill="url(#web-glow)"/><rect x="-4000" y="-4000" width="8000" height="8000" fill="url(#star-pattern)"/>
  ${[130, 245, 442, 682, 824].map((r) => `<circle r="${r}" fill="none" stroke="#a4a7df28" stroke-dasharray="3 8"/>`).join("")}
  ${titles.map((t) => `<text class="sector-title" x="${t.x}" y="${t.y}" text-anchor="middle">${t.name.toUpperCase()}</text>`).join("")}
  ${edges
    .map(([a, b]) => {
      const p = byId.get(a),
        q = byId.get(b),
        active = selected.has(a) && selected.has(b);
      return `<line class="talent-edge${active ? " lit" : ""}" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`;
    })
    .join("")}${nodes
    .map((n) => {
      const kind = c(n),
        active = selected.has(n.id);
      const available = !active && canAllocate(state, n.id);
      const name = n.name.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      return `<g class="talent-node ${kind} ${active ? "allocated" : available ? "available" : ""}" data-passive="${n.id}"
      role="button" tabindex="0" aria-pressed="${active}" aria-label="${name}">
      <circle cx="${n.x}" cy="${n.y}" r="${radii[kind]}"/>
      ${["origin", "doctrine", "notable"].includes(kind) || active ? `<text x="${n.x}" y="${n.y + 4}" text-anchor="middle">${kind === "origin" ? "✧" : kind === "doctrine" ? "✺" : "◆"}</text>` : ""}
      ${["doctrine", "notable"].includes(kind) ? `<text class="circuit-label" x="${n.x}" y="${n.y + 34}" text-anchor="middle">${name}</text>` : ""}
      </g>`;
    })
    .join(
      "",
    )}</svg></div><div class="talent-info" id="talent-info">Choose a node to inspect its effects. Refunding is free if the remaining build stays connected.</div>`;
}

export function mountConstellation(root) {
  const svg = root.querySelector(".talent-view svg");
  if (!svg) return;
  const size = () => {
    const rect = svg.getBoundingClientRect(),
      scale =
        1820 / Math.max(1, Math.min(rect.width, rect.height)) / viewport.zoom;
    return {
      width: rect.width * scale,
      height: rect.height * scale,
      scale,
      rect,
    };
  };
  const draw = () => {
    const { width, height } = size();
    if (width && height)
      svg.setAttribute(
        "viewBox",
        `${viewport.x - width / 2} ${viewport.y - height / 2} ${width} ${height}`,
      );
    svg.classList.toggle("detail", viewport.zoom > 1.65);
  };
  function zoom(factor, cx, cy) {
    const old = size();
    const x = cx === undefined ? 0 : cx - old.rect.left - old.rect.width / 2;
    const y = cy === undefined ? 0 : cy - old.rect.top - old.rect.height / 2;
    viewport.zoom = bound(viewport.zoom * factor, 0.78, 7);
    const scale = size().scale;
    viewport.x = bound(viewport.x + x * (old.scale - scale), -990, 990);
    viewport.y = bound(viewport.y + y * (old.scale - scale), -990, 990);
    draw();
  }
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom(
        Math.exp(
          -bound(e.deltaY * (e.deltaMode === 1 ? 14 : 1), -400, 400) * 0.0028,
        ),
        e.clientX,
        e.clientY,
      );
    },
    { passive: false },
  );
  root.querySelectorAll("[data-tree-zoom]").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.treeZoom === "fit") {
        Object.assign(viewport, { x: 0, y: 0, zoom: 1 });
        draw();
      } else zoom(b.dataset.treeZoom === "in" ? 1.34 : 0.75);
    }),
  );
  let drag,
    suppress = false;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    suppress = false;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  });
  svg.addEventListener("pointermove", (e) => {
    if (drag?.id !== e.pointerId) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) svg.setPointerCapture(e.pointerId);
    drag.moved = suppress = true;
    drag.x = e.clientX;
    drag.y = e.clientY;
    const { scale } = size();
    viewport.x = bound(viewport.x - dx * scale, -990, 990);
    viewport.y = bound(viewport.y - dy * scale, -990, 990);
    draw();
  });
  for (const type of [
    "pointerup",
    "pointercancel",
    "lostpointercapture",
    "pointerleave",
  ])
    svg.addEventListener(type, () => {
      drag = null;
    });
  svg.addEventListener(
    "click",
    (e) => {
      if (suppress) {
        suppress = false;
        e.stopPropagation();
      }
    },
    true,
  );
  const inspect = (e) => {
    const n = CONSTELLATION.byId.get(
      e.target.closest("[data-passive]")?.dataset.passive,
    );
    if (n)
      root.querySelector("#talent-info").textContent =
        n.name +
        " · " +
        n.desc +
        (n.opposed
          ? " · Exclusive with " + CONSTELLATION.byId.get(n.opposed).name
          : "");
  };
  svg.addEventListener("pointerover", inspect);
  svg.addEventListener("focusin", inspect);
  svg.addEventListener("keydown", (e) => {
    const n = e.target.closest("[data-passive]");
    if (n && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      n.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  const observer = new ResizeObserver(() => {
    if (svg.isConnected) draw();
    else observer.disconnect();
  });
  observer.observe(svg);
  draw();
}
