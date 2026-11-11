# Versioned data fields: playable assay slice

## References and scope

Consulted the existing universe survey and hierarchical resource-potentials contracts, the source-pinned geology adapter/ore manifest, and the regional-world `field-program.mjs`/`SETTLEMENT-DESIGN.md` research prototype. The latter cites source PDF p466 settlement tiers, p1092 ecological memory and p1070 history/identity. Those are constraints for future ecology/cities, not implemented features here.

This change moves the reusable field interpreter into the playable browser engine and connects one real subsystem: finite cobalt core extraction. It does **not** claim that surveyed planets are landable, that Bastion is a surveyed planet, or that universe-to-surface placement, cities, history, flora and NPCs all use this interpreter yet.

## Contract

`compileFieldProgram(seed, scope, definitions)` snapshots validated definitions. Up to 64 fields, 8 weighted noise layers per field, power-independent integer scales 1..1,048,576, optional acyclic multiplicative dependency. Samples use exact integer cell coordinates (BigInt or bounded decimal strings; unsafe Number rejected), with finite normalized offsets. No material-list indexing or mutable random stream. Separate JSON-encoded seed/scope/tag domains avoid delimiter ambiguity. Canonical recipe descriptor includes definitions and version; adding another independent field leaves prior values unchanged.

`sampleFieldCandidates` queries up to 8 cubed cells, threshold-gated, optionally local-max-owned against a one-cell halo. Adjacent query partitions agree. Results are occurrence potential and coordinates, not spawned entities, assigned inventory or permanent IDs. A caller must persist seed + scope + recipe + stable spatial identity before placing mutable entities. Caches are local to a query; the gameplay assay caches at most 32 seeds and 32 columns.

## Actual gameplay

New saves use `bastion-assay-fields-v1`. Broad richness (128/16m) modulates finer cobalt (48/4m); a fixed 0.16 gate filters the source-qualified host/biome/depth cobalt deposits. The manifest still determines eligibility. No new quantities or arbitrary materials are minted. Extraction, mastery yields, refining and crafting remain the existing real gameplay path.

Existing saves keep their source-only assay. An explicit one-way button in the nearby core panel adopts seeded richness, warns that remaining deposits may decrease, and preserves every mined ID. Unknown future recipe strings survive reload and disable extraction rather than rerolling. New recipe changes must use a new ID and explicit adoption/migration. Survey resource inheritance is still a separate read-only path, not falsely wired to this local Bastion assay.

## Native/EnTT reality

The production browser uses JS state and a small numeric WASM ABI, not EnTT. Inspected the native EnTT experiment: actual `entt::registry` source exists, but its Zig WASI compiler crashed even on a trivial module and produced no verified runnable EnTT integration. An official Emscripten/LLVM-WASI toolchain, pinned dependency, import audit and parity/snapshot tests are needed before moving ownership. Stable saved IDs must remain separate from transient EnTT handles. This interpreter is intentionally dependency-light and suitable for a later parity-tested native port; it does not relabel JavaScript as EnTT.

## Verification

New tests cover deterministic exact distant cells, continuous negative boundaries, bounded values, immutable definitions, field-order independence, dependency rejection, adjacent-region candidate ownership, and migration/depletion/future-recipe behavior. Existing extraction/refining/equipment regression tests remain green. No browser or publication claim is implied by node tests.
