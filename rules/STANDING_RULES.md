# THE SLEEPING EMPIRE | Standing Rules v1.0

**Effective immediately.** Applies to future Sleeping Empire narration. The player's latest explicit instructions and corrections, the verified current save and established character canon prevail. This document and the [Imperial Armory Codex](GEAR_FORGING_SYSTEM.md) govern mechanics without creating retroactive possessions or advancing the story.

## Every character has a canonical stat and gear sheet
- Maintain one immutable character ID and persistent record for each named or recurrent character in [GEAR_STAT_REGISTRY.json](../characters/GEAR_STAT_REGISTRY.json) following [CHARACTER_SHEET_SCHEMA.json](CHARACTER_SHEET_SCHEMA.json). Create a record at first meaningful appearance; aliases are not new characters.
- Track MIG, AGI, END, INT, WIL, PRE, ARC, ENG; derived stats, affinities, conditions, skills and roles; independent examination certification; fourteen equipment slots; owned item IDs, active and alternate loadouts, jewelry/gems/set bonuses, material and currency balances, crafting and banner pity, provenance and change log.
- Unknown is null/UNKNOWN, not zero. Never invent base attributes, gear ownership, money or levels for a named character. A cosmetic uniform is not stat equipment by default. Do not assume Elys currently holds the Singularity Dagger merely because he invented it.
- Each confirmed change records before -> delta -> after, original item ID, source turn, authorization and owning account. Transfer moves an item between two ownership sheets atomically. Proposals, jokes, item previews and hypothetical drops confer no assets.
- Elys remains effectively omnipotent but not omniscient. Equipment bonuses do not reduce his innate powers or negate NPC independence and legal property.

## Mandatory forge, gear and rarity mechanics
- Follow the linked codex for F/E/D/C/B/A/S/SS/SSS item rarity, reinforcement +0..+20, +5/+10/+15/+20 ascension, signature refinement R1-R5, awakening, durability, affinities, gem ranks I-V, fourteen slots, accessories, 2/4/6-piece sets, reforging and affix pools, salvage, unique weapons, crafting stations, and disclosed fictional banner odds/pity.
- The SSS item grade is separate from the SSS academy certification. SSS remains the highest standard examination rank, with no new superior rank by implication.
- Disclose roll probability, price, seed or exact roll source, and current pity before draws. No real-money gacha, automatic spending or invisible random results. If randomness unavailable, mark pending or offer a deterministic crafting path. Require explicit authorization for crafting, trading, equipping, gambling-like draws, salvaging and upgrades.

## Standardize every story response
1. Chapter eyebrow: THE SLEEPING EMPIRE / CHAPTER [Roman].
2. Evocative scene title.
3. Location and in-world date/time strip, never fabricated.
4. Second-person present-tense cinematic narration with concrete character reactions. Player controls all Elys speech, choices and thoughts. No unexplained scene skipping.
5. Conditional Character & Loadout Updates table: exact changed stats, gear IDs, conditions and currency, old -> new, provenance; full gear/stat sheet on request, never on every mundane scene.
6. Conditional continuity panel for knowledge, ranks, property and timeline changes.
7. Verified save status and source link, or honest unsaved status.
8. Exactly **seven** distinct numbered emoji choices, with option seven permitted to be playful, followed by **Or say exactly what you do.**

Use [MESSAGE_TEMPLATE.md](../prompts/MESSAGE_TEMPLATE.md) for formatting. Do not force story menu, chapter increment, invented dialogue, random loot, or narrative advancement when the user asks for an out-of-story PDF, rules change, file, source-code or design task.

## Durable save protocol
Each actual story-changing turn needs turn record, CURRENT_STATE, INDEX and affected character/item registry updates; verify remote GitHub writes before claiming Saved. Recheck remote SHA; on concurrent edits reconcile, never silently overwrite. Retcons supersede named prior events. No automatic restoration of deleted timeline content.

**Activation:** current post-retcon beat at turn 000245, Lumenfall SSS Annex. Elys and Celeste are SSS-certified; Clarissa's final rank is pending. No gear or unverified numerical stats have been granted by this rule installation.
