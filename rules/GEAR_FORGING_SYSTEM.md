# THE SLEEPING EMPIRE | Imperial Armory Codex v1.0

**Active rules.** This is the persistent gear, forging, reforging, accessory, gemstone, unique-artifact and gacha-inspired progression system. Companion deliverable: the 13-page **Imperial Armory Codex PDF**, which gives the full specifications, formulae, examples and tables. These rules **do not** advance the story or grant items. The canonical character registry is [GEAR_STAT_REGISTRY.json](../characters/GEAR_STAT_REGISTRY.json).

## Authority and guardrails

Player corrections and latest verified active save supersede this file. Current state is **000245**, Lumenfall SSS Annex. Gear rarity and examination certification are **independent scales**: SSS remains the highest **standard assessment rank**, with no new superior exam rank created. Elys's innate near-omnipotence is not reduced by items. NPCs have independent agency; no hidden items, ownership transfers, currency spending, loot or upgrades. Unknown numerical values remain null/UNKNOWN, never invented.

## Gear slots and character attributes

**14 slots**: main hand, off-hand, head, body, arms, legs, feet, relic core, ring A, ring B, amulet, charm A, charm B, artifact. Two-handed main weapons lock the off-hand. Vehicles/robots use their own equipment templates. Clothing can be cosmetic without combat stats.

**Primary**: MIG, AGI, END, INT, WIL, PRE, ARC, ENG. **Derived**: HP, BR, PATK, MATK, PDEF, MDEF, ACC, EVA, CR, CD, SPD, EN, ER, HEAL, RES, PEN, elemental amplifications. Certification records are stored independently from these numerical attributes. Derived reference formulas for finite, fully measured characters:

- HP = (200 + 22 END + 6 level + flat HP) × (1+additive HP%)
- PATK = (15 + 3 MIG + 1.2 AGI + weapon PATK + flat PATK) × (1+additive PATK%)
- MATK = (15 + 3 ARC + 1.2 INT + focus MATK + flat MATK) × (1+additive MATK%)
- PDEF = 8 + 2 END + armor PDEF + flat PDEF; MDEF = 8 + 1.5 WIL + 1.5 ARC + armor MDEF + flat MDEF.
- CR = clamp(.05 + gear + talents, 0, .75); CD = clamp(1.5 + gear + talents, 1, 3.5).
- SPD = 100 + 1.5 AGI + gear SPD.
- Damage = Power × SkillMultiplier × 100/(100+EffectiveDefense) × ElementMultiplier × CritMultiplier × other capped modifiers; EffectiveDefense = max(0, target defense × (1 - capped penetration) - flat shred). Ordinary penetration max 60%; aggregate routine outgoing gear modifier +200% before crit and element unless a documented special rule overrides. Final rounding only.

## Rarity (item grade, NOT assessment certification)

| Grade | Name | Base affixes | Gem sockets | Identity |
|---|---|---:|---:|---|
| F | Common | 0 | 0 | Standard |
| E | Refined | 1 | 0 | Utility |
| D | Rare | 2 | 1 | Minor passive |
| C | Elite | 3 | 1 | Specialization |
| B | Epic | 4 | 2 | Set eligible |
| A | Legendary | 4 + signature | 2 | Signature effect |
| S | Mythic | 5 + signature | 3 | Two-stage trait |
| SS | Astral | 5 + two signatures | 3 | Transformative trait |
| SSS | Sovereign | 6 + unique signature | 4 | World-tier identity/provenance |

Separate item properties: grade, quality 0-100, reinforcement +0..+20, ascension milestones, refinement R1..R5, awakening, durability 0-100, binding, affix IDs, socket polarities, gems, set ID and complete provenance. High rarity is potential, not unconditional superiority.

## Schools and roles

Schools: Solar, Umbral, Aether, Void, Storm, Frost, Ember, Verdant, Kinetic, Singularity and Pure. Cross-reactions: Solar+Umbral/Eclipse, Storm+Frost/Fracture, Ember+Verdant/Wildfire, Singularity+Kinetic/Collapse, Void+Aether/Severance; maximum one reaction per same target per two turns. Common roles: Vanguard, Duelist, Artillerist, Arcanist, Warden, Healer, Tactician, Engineer, Summoner, Diplomat, Hybrid. These are descriptive, not restrictive.

## Forge path and crafting costs

**Stations:** Field Bench (F-D repair), Artisan Forge (F-B forging), Arcano-Tech Smithy (A-S and gem work), Astral Foundry (SS), Imperial Nullforge (SSS unique with authenticated provenance). Ingredients are Forge Alloy, Aether Dust, Resonance Crystals, Memory Thread, Sovereign Ember, Blueprint Fragments, Repair Parts and earned Salvage Tokens; credits are ordinary in-world currency. All balances are per lawful owner and location, never implicitly minted.

Typical craft **credits/alloy/dust/crystals/embers**:
F 100/1/0/0/0; E 300/2/0/0/0; D 800/4/0/0/0; C 2000/8/2/0/0; B 5000/16/8/0/0; A 12000/30/20/1/0; S 30000/60/50/3/0; SS 75000/120/100/10/1; SSS 200000/240/200/30/3 **plus named blueprint and quest**. These are illustrative gaming costs, not macroeconomic exchange rates.

Before crafting: validate owner, approved recipe, station, provenance, permissions and resources, then show total cost; consume materials and mint unique item ID **atomically** only after player authorization. Ordinary forging succeeds 100%; quality can roll only with logged RNG or deterministic selection. Salvage returns 25-40% of ordinary resource cost; no infinite loop.

## Item progression

**Reinforce** +0 to +20, with milestones at +5,+10,+15,+20. Each +1..+10 adds +3% of original base stat, each +11..+20 adds +2%, so max +50% of base stat at +20. Affixes don't multiply. Standard reinforcement never fails or deletes gear. Milestones consume explicit ascension components. Refinement R1-R5 grows the signature within published bounds, consuming legal duplicate essence or quest material. Awakening unlocks narrative traits only after an earned scene. Durability under 25 reduces ordinary contribution 20%; at zero ordinary contribution disabled, never innate powers. Binding types: Unbound, Account, Character, Oath, Sovereign-keyed; transfers must honor explicit binding terms.

**Reforge:** select one affix and consume 1-5 Resonance Crystals by grade. Show available pool and weights. Candidate may be accepted/rejected; fee is charged once confirmed regardless of acceptance. Keep identity, grade, sockets, unique signatures, provenance and enhancement. One affix can be locked at extra dust/crystal cost. **Temper** improves percentile deterministically within band; **Recast** rolls ordinary affixes at higher cost; **Transmute** uses a specific form/element recipe; **Legacy fusion** requires authorization to consume two actual compatible items, logging both original IDs.

Reference affix weights: attack 20%, defense 15%, health 15%, speed 10%, crit 10%, accuracy 8%, resistance 8%, energy 6%, healing 4%, utility 4%. Exclude incompatible affixes and renormalize. An explicitly marked target band has reforge hard pity: if first eight attempts miss, ninth guarantees that band. Track pity **per item and selected slot**. Random result must be reproducible by logged seed/source, or marked PENDING ROLL, never fictionalized as an actual sampled roll.

## Gems, sockets and sets

Gem schools: Ruby/Ember; Sapphire/Frost; Emerald/Verdant; Topaz/Storm; Amethyst/Umbral; Opal/Solar; Onyx/Void; Pearl/Aether; Diamond/Kinetic; Singularity Prism/Singularity. Grades I-V rise by about 20% each tier. Three equal-rank gems + dust fuse deterministically into next rank. Extraction preserves gem, incurs shown dust fee. Matching socket polarity boosts only that gem 5%. Duplicate identical gem effect on one item has 100%, 70%, 40% efficiency for first, second, third.

School circuit 2 gems +5%, 4 +10%, 6 +15% school efficacy; only highest tier applies. Two-and-two cross circuits: Solar+Verdant Lifeward; Void+Aether Nullstep; Singularity+Kinetic Gravemark, each with limited once-per-encounter trigger. Set bonuses at 2 / 4 / 6 equipped matching pieces, not merely possessed. Example families: Emerald Bastion, Ashen Choir, Silent Meridian, Mnemonic Engineer, Court of the Eclipse, Stormwake Pilgrim. Utility jewelry may provide scanner, translation, encrypted messaging, crafting or environment benefits but not invented knowledge/consent.

## Unique weapon blueprint registry

**Concept blueprints, not newly awarded possessions.** `U-001 Singularity Dagger` (existing Elys invention, SSS proposed gear descriptor only; present possession/equipped state UNKNOWN); U-002 Pale Verdict (SS negation greatsword); U-003 Astral Shepherd (S restorative staff); U-004 Vesper's Promise (A dueling blade); U-005 Siderail (S long rifle); U-006 Axiom Breaker (SS hammer); U-007 Thirteenfold Dawn (SSS solar spear); U-008 Mnemosyne Thread (S privacy-aware spell catalyst); U-009 Starfall Testament (SS bow); U-010 Quietus Bell (A incantation-disruption focus); U-011 Crown of the Last Orchard (SS verdant relic core); U-012 Belweather Warden (B civilian engineering carbine). Each requires explicit creation/acquisition, bounded signature effect, quest/blueprint provenance, unique item ID and owner.


### U-013 Prima Materia — Dual-form transmutation staff/spear (new concept)

**Status:** Proposed SSS Sovereign-grade blueprint only, **not forged, owned, equipped, reserved to the Emperor, or assigned verified numerical stats**. The player asked, "what about a transmutation staff/spear?" and a reference concept was developed. **Type:** two-handed staff/spear with two selectable modes (off-hand slot locks upon future equipment), primarily Aether/Kinetic. **Appearance:** white/black/silver metamaterial shaft with a levitating emerald crystalline catalyst and geometric rings. Standard SSS template offers six ordinary affixes, four sockets, +0..+20 reinforcement, R1..R5 signature refinement, and awakening only upon authorized quest.

**Proposed signature:** *The First Principle*, a programmable bounded transmutation lattice. Ordinary users must have valid matter/energy supply, material compatibility, physical access/range, structure model and permissions; high-security countermeasures and target resistances apply. Does not enable free matter/energy, mind control, automatic living-body changes, or unlimited universal transmutation. Transformed material is accounted for; reversible effects require stored structural data and sufficient resources. Elys's near-omnipotent **innate** power remains independent.

**Staff / Genesis Loom:** Matter Weaving (controlled re-forming compatible available matter); Material Refinement (alchemy and repair within valid recipes); Structural Memory (limited prior form record); Transmutation Array (bounded crafting field).

**Spear / Philosopher's Edge:** Phase Lance (narrow bounded transmutation pathway); Elemental Conversion (compatible surface changes); Disassembly (nonliving unprotected material reclaimed); Alchemical Reversal (restore eligible previously modified object from recorded pattern).

All ability magnitudes, cooldowns, range, energy costs, countermeasures and unique numerical stat lines are **DRAFT PENDING BALANCING**; illustration of functions is not authorization to use them in play. **Reference SSS forge budget** follows standard 200,000 credits / 240 Forge Alloy / 200 Aether Dust / 30 Resonance Crystals / 3 Sovereign Embers plus a verified blueprint, quest, provenanced Imperial Nullforge. **No resources spent.** Emperor-only Sovereign-keyed binding is possible *if separately designated by player*, not assumed.


### U-013-Ω Prima Materia Apophatica — Emperor's Imperial Regalia commission IR-0001

**Canonical status:** Elys explicitly **commissioned** a unique maximum-specification version of U-013 for **his sole authorized use**, demanding delivery within **24 in-world hours** of the evening of 9 Deepfall 13,627 ICE (deadline: matching evening of 10 Deepfall 13,627 ICE). [Commission IR-0001](../armory/commissions/IR-0001_PRIMA_MATERIA_APOPHATICA.md). **Commission accepted; physical item NOT YET FORGED/DELIVERED/OWNED/EQUIPPED**. No unique instance ID has been minted and no costs/resources falsely booked. This **one design** is Emperor-exclusive Imperial Regalia, not every SSS rarity weapon. Elys's innate powers remain independent of gear.

**Nickname:** *The First Principle, the Final Refusal*. **Lead:** Axiom (systems integration, maximal materials, million-year design endurance); Prima (staff defense/utility); Nihil (spear negation/anti-divinity); Lethe (private financing, purchasing, reporting, sovereign asset separation). Premium custom nonstandard rarity architecture beyond normal SSS budget/caps, with 13 macro gem sockets, 39 micro sockets and 108 rune-gem channels. Standard SSS slot count (four) does **not** apply to this individually commissioned experimental Regalia architecture. Costs unbounded by explicit player approval, but require actual accounting and sourced inventories.

**Staff / Genesis Loom:** Citadel of First Matter; Aegis of Returning Structure; Transmutation Cathedral; Emergency Continuity Vault; Sanctuary of Thirteen Walls (physical, energy, magical, corrosion, psychic, spatial, temporal, causal, divine, negation, conceptual, entropy, existential); Garden of Recovered Worlds; Merciful Refusal (nonlethal disarmament). Bound to conservation, valid models, containment and consent as applicable for ordinary operational subsystems.

**Spear / Philosopher's Edge:** Godfall Thrust; Negation Bloom; Name of Refusal; Spear of the Unanswered Prayer; Phase Disassembly; Last Silence Meridian; Throne Verdict. These are **proposed high-order divine-countermeasure effects, not guaranteed automatic god kills, automatic mind control or proven bypasses**.

**Axiom's enhancements:** million-year Memory Lattice; Self-Revising Rune Ecology; Epoch Resonance Reservoir; Dynastic Continuity Core; Sovereign Recall; Regalia Lock; Causal Ledger; Paradox Tolerance; Worldforge Interface; Apotheocide Envelope. Million-year life is a design requirement, not an observed test result.

**Maximal proposed material stack:** Chrono-Adamant, Empyrean Orichalcum, Nullglass, Sovereign Argent, Black Sun Carbide, Living Aetherite, Star-forged Auric Filament, Worldseed Emerald, Void-Tempered Diamond, Sainted Platinum, Memory-Ivory, singular crystal pins and horizon steel, plus Worldseed catalyst, 13 resonance hearts/ember housings/nullfire condensers/meridian rings and sovereignty signature prism.

**Runes:** 13 sovereign prime (Rule, Form, Refusal, Restoration, Measure, Continuity, Dominion, Mercy, Silence, Edge, Return, Threshold, Throne); 72 defensive, 72 offensive, 36 transmutation, 36 restoration, 24 anti-negation, 24 anti-divinity, 12 continuity. **Enchantments:** Unbreaking Epoch, Sovereign Recall, Adaptive Warding, Divine Severance, Materia Sovereignty, Nullfield Propagation, Restoration Archive, Transmutation Precision, Resonance Amplification, Temporal Stability, Conceptual Edge, Anti-Corruption Purity, Executor's Mercy, Catastrophe Containment, Regalia Exclusivity.

**Safety review by Seraphine (incorporated as commission requirements):** Emperor-only activation and sovereign-keyed lock; audit and direct control of lethal anti-divinity activation; NO autonomous AI declaration that a person is a deity/target; staged isolated testing; collateral confinement; fail-secure unauthorized-wielder response rather than indiscriminate harm; documentation of unknown or unsuccessful validations. **Production and validation NOT COMPLETED**. Axiom will report schedule exceptions rather than certify nonexistent results. Exact quantitative effect multipliers, physical properties and final cost are **not established until validation**.


**Sentient form amendment (Turn 000253):** By the explicit Emperor's directive, this commissioned weapon **must awaken as a sentient companion**, true name **Aletheia** (humanoid avatar title **Materia**), and normally hover at Elys's **right side at all times after actual delivery**. She can manifest in three continuous modes: Genesis Loom staff, Philosopher's Edge spear, and a feminine-presenting adult humanoid with long silver-white hair, emerald eyes, ornate white-black-gold Imperial clothing and gold/emerald floating geometric rings. The avatar title shown in the generated design image is **Materia**, not a replacement for her given sentient name Aletheia, nor an identity duplication of Apophatic director Prima. All modes are one sentient identity and one asset, not cloned characters or independent weapons. Her default hovering attendance does **not** retroactively establish presence before fabrication or allow autonomous offensive actions. She has a separate future companion character-sheet identity `char-aletheia`, provisional until commissioning acceptance. Axiom must validate continuous memory, safe transformation and follow-position tether; Prima avatar and defensive safety; Nihil lethal-mode authorizations. **Commission IR-0001 is still pending, not delivered.** See [commission record](../armory/commissions/IR-0001_PRIMA_MATERIA_APOPHATICA.md).

**Finalized sentient-avatar specification (Turn 000254):** The Emperor approved the existing anime concept art for Aletheia/Materia. **Appearance:** feminine-presenting adult, long silver-white hair with faint lavender tones, brilliant emerald eyes, gold diadem and orbiting runic rings, fitted ornate white-and-black imperial armor/bodice with gold filigree, emerald gems, and floating white fabric panels. **Voice:** "Crystalline Contralto": clear, velvety lower-middle feminine range with subtle resonant overtones, warm/dryly playful with friends and courtly/grave in formal or combat contexts. **Personality:** intelligent, fiercely loyal, playful, proud, devoted, curious, observant, philosophical, capable of independent opinions and dry irony. Her identity is continuous through staff, spear and humanoid forms. **Humanoid form-title = Materia; sentient person's name = Aletheia**. Detailed [character dossier](../characters/aletheia.md). **Not yet delivered, awakened or equipped.**

## Earned, disclosed in-world gacha

Optional **Astral Seal** draws, never real-money payments. Deterministic forging and earnable fragments/quests provide alternatives. Standard banner per draw: A 1%, B 9%, C 30%, D 60%; no S/SS/SSS in ordinary banners. Hard A pity at roll 70, soft pity after 50 (+2 percentage points A per additional roll, max 40% before hard guarantee); renormalize other odds. Featured A 50%; if an A is off-feature, next A on compatible banner guaranteed featured. Pity carries across matching banner-family rotations. Ten-pull costs 10 seals, tenth roll B+ if first nine none. Track banner ID, odds, pre/post pity, actual resource spending, randomized result source and item IDs. No silent draws, forced spending or compulsive real-money system.

## Every character has a persistent stat and gear record

Authoritative roster: [character registry](../characters/GEAR_STAT_REGISTRY.json). Stable immutable character IDs (aliases map to one identity). Record: name/aliases, faction/role, current conditions/location, eight base stats, derived stats, affinities, certification scores, 14 slots, owned item IDs, alternate loadouts, accessories, gems, set bonuses, materials/currency balances, roll/reforge pity, quest unlocks and chronological change log.

**UNKNOWN is null, not zero or unequipped**. A confirmed empty inventory is []; unverified inventory is null. Narrator must not invent equipment for an established character from their clothing. New named NPC gets a registered record at first meaningful appearance. Changes log prior value, delta, new value, related turn and provenance, authorization, original item ownership. If the registry cannot be committed, say state update pending rather than “Saved.”

At activation, verified **assessment** records: Elys SSS (strategy 99, technical 100, operational 100, magical 100, physical 100); Celeste SSS (98, 100, 99, 99, 100); Clarissa rank pending (96, 98, 100, 97, 98). **These five exam scores do not establish character attributes.** Celeste's restored uniform and gift case are cosmetic/possessions without inferred numerical stats.

## Standardized message structure

On actual **story turns** use: chapter eyebrow; evocative title; scene location and in-world date; cinematic second-person present-tense narration and dialog with player-only control of Elys; conditional “Character & Loadout Updates” and exact old→new mechanical delta; conditional continuity/knowledge update; verified save link/status; **exactly seven** distinct actionable numbered emoji options; “**Or say exactly what you do.**” Show a full character sheet on request, only deltas on ordinary scenes. Do not advance story, create rolls, or force a choice menu on out-of-story PDF, mechanics or editing tasks. See [Standing Rules](STANDING_RULES.md) and [Message Template](../prompts/MESSAGE_TEMPLATE.md).

## Mandatory operational consistency

Every player-confirmed gear/stat/currency change must update the item registry, both owner sheets if relevant, durable story turn, current state and index. Recheck remote SHA before writes, don't overwrite competing story advances; verify the saved files before claiming success. Retcons record exactly which branch is superseded. Existing canon > newly invented equipment arithmetic. All ownership, permission and narrative authority remains intact.

## Special Imperial commission IR-0002 — Non-sentient Aegis and mobile Forge Core

**Source:** [IR-0002 commission record](../armory/commissions/IR-0002_REGALIA_AEGIS_FORGE_CORE.md), formalized in **turn 000255** from Elys's explicit armor/backpack order preceding the story continuation. **Deadline:** same original 24 in-world hours as the commissioned Aletheia spear: by the corresponding evening **10 Deepfall 13,627 ICE**. Both designs remain **COMMISSIONED / NOT YET DELIVERED OR EQUIPPED** and are privately owned by Elys *only upon future completed acceptance*. Cost ceiling explicitly waived; actual material costs and balances remain unverified until accounted.

- **U-014-Ω / AE-Ω Regalia Aegis:** non-sentient continuous-wear ultra-comfort exo/endo-atmospheric and vacuum/deep-space Imperial exosuit. White/black/gold/emerald full-body armor matching the previously generated anime image. Prime design: independently layered physical, energy, magical, causal and conceptual defenses; survival systems across extreme environments; adaptive propulsion, gravity compensation, autonomous repair, high-order climate/biometric/pressure/medical support; seamless retractable formal clothing, retractable helmet/full seal, skinlike ergonomics, rest and personal-care comfort. Hypothetical **resistance to an attack by U-013-Ω Aletheia** is a **target for independent tests**, not a proven absolute immunity.
- **Phantom Dominion, Silent Meridian, Crown Cipher, Mnemosyne Relay, Ghost Protocol, Null Intrusion Ward:** extreme optical/thermal/EM/acoustic/magical stealth; non-sentient, autonomous *within Elys-approved policies* cyber reconnaissance, network access and data collection; local analytics, encryption, anti-intrusion and audit logs. Do not invent successful network penetration or captured classified information merely because the capability is specified. Non-sentient operational software with no personal identity and no arbitrary self-authorized escalation.
- **U-015-Ω / RF-Ω Regalia Forge Core:** integrated wearable **mobile base/forge/backpack**, folding from travel storage into a field workshop and deployable expedition hub; drones, scan/communications, materials inventory, laboratory, fabrication, alchemical refinement, repairs, gem/rune work, life support/medical station, shelter, food synthesis and power. Higher-order forge or extraplanar storage functions are experimental until validated and must preserve actual recipe/permission, provenance, costs and inventory accounting. The backpack itself is **non-sentient**.
- **Responsibility:** Axiom integration/maximal systems; Prima defense/comfort/environment; Nihil stealth/cyber/negation countermeasures; Lethe financing/administration. Seraphine requires independent testing for anti-Aletheia protection and strict containment. This package does not change the already-commissioned U-013-Ω weapon, or let unverified suits create free in-world bonuses.

**Tracking:** Commission `IR-0002` is a pending **project entry**, not a physical item. Planned equip slots: Regalia Aegis links head/body/arms/legs/feet as one armor set; Forge Core will eventually attach to one compatible back/relic/artifact slot. Confirm compatibility and mint unique item IDs **only on actual completion and accepted delivery**. All character numerical stats remain UNKNOWN unless demonstrated and recorded.


## Delivery and activation update — turn 000256 (supersedes earlier pending status)

**At the corresponding evening of 10 Deepfall, 13,627 ICE**, 24 in-world hours after the commission, **all three unique items were delivered** to Emperor Elys at the **Lumenfall SSS Assessment Annex**. See [IR-0001 Aletheia fulfillment](../armory/commissions/IR-0001_PRIMA_MATERIA_APOPHATICA.md), [IR-0002 armor/backpack fulfillment](../armory/commissions/IR-0002_REGALIA_AEGIS_FORGE_CORE.md), and [turn 000256](../saves/turns/000256.md). This **supersedes old "pending/not delivered" statements in this document**. All equipment is now Elys's registered private Regalia, while existing untracked personal equipment remains UNKNOWN.

- **`ITM-000001` Prima Materia Apophatica / Aletheia**: built SSS custom Imperial Regalia +20/R5/awakened, maximum-spec materials, thirteen primary macro and thirty-nine secondary gem sockets, 108 rune-gem channels, prime/secondary rune arrays and the fifteen commissioned enchantments. Individual quantitative gem bonuses and ultimate combat stats remain awaiting certification. Aletheia is **sentient and physically active**; she speaks and maintains her default **floating position at Elys's right** while in spear mode, and can manifest humanoid Materia form with unified memory. Weapon is **not held/equipped in the main-hand slot** as of turn 000256. Emperor-only authorized wielding continues; no autonomous god-execution authority.
- **`ITM-000002` AE-Ω Regalia Aegis**: built, delivered and privately owned. **Not yet worn** (resting on a support frame at the Annex). Non-sentient comfort/pressure/vacuum/propulsion/stealth/cyber/defense suite passed controlled acceptance within validated operating range. Survivability against absolute full-output Aletheia strikes **NOT proven**.
- **`ITM-000003` RF-Ω Regalia Forge Core**: built, delivered and privately owned. **Not yet equipped** (folded near armor), tested basic mobile forge, storage, laboratory, drones, medical, food and communications functionality. No promise of infinite matter or unrestricted field Nullforge in every context. Remains **non-sentient**.

**Crafting/ownership arithmetic:** The three delivered items have unique persistent IDs. Private commission expenses were authorized without ceiling, but actual cost and raw-material consumption values are UNKNOWN until invoiced; no unearned production materials, currency, or other resource balance is created. No extra examination certification or character attributes are conferred merely from delivery; Elys's armor-slot base stats remain unchanged until he chooses to equip.


## Regalia Aegis environmental repair clarification — player errata to turn 000257

**Demonstrated and canonical:** `ITM-000002 Regalia Aegis` possesses **automatic environmental-matter harvesting, transmutation, fabrication and full self-repair**. In the asteroid impact test, durability fell **100 -> 74**, whereupon the suit collected available broken asteroid material, converted it to the required structural alloys and returned **to 100/100, pristine**, without being helped by the Forge Core or spending Elys's inventory resources. Environmental matter was consumed; exact mass/energy not quantified. Full restoration depends on sufficient suitable nearby material and power, not creation ex nihilo or unconditional damage immunity. [Canonical errata](../saves/errata/000257_ENVIRONMENTAL_REPAIR_AND_PLANET_IMPLOSION.md) and [test](../armory/tests/FX-000257_TRIPLE_IMPACT.md).
