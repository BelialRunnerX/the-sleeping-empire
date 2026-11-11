# Careers and skill training

This slice complements the existing shared passive web, support sockets, equipment forms,
temper/reforge and ascension. It does not replace them or claim a complete mod conversion.

## Source and scope
Reviewed `Elysium-mono/docs/SPEC_SKILLTREE.md` and `docs/SKILLTREE.md`: careers cover
fighting, extraction, building, crafting, travel and the wider world. The existing browser
constellation remains the passive-point system. The thresholds and numbers below are
**browser-authored tuning**, not values copied from the mod or Sixth Edition specification.

## Life careers
All eleven existing professions now activate three modest permanent stat rewards at mastery
3, 6 and 10 (120, 750 and 2430 lifetime profession XP). The rewards are defined in
`engine/mastery.mjs`. Mining adds armor; metallurgy increases armor effectiveness; other
careers improve life, mana, power, recovery, resistance, penetration, speed or haste.
Existing gathering-yield and crafting-quality rules are unchanged. Rewards derive from
existing XP, so old saves receive earned bonuses automatically without a migration grant
or repeated claims. Armor multipliers apply after gear and career flat armor.

The Life Skills screen shows XP to the next level, each milestone and active bonus count.

## Player skill training
Each non-basic active skill has five purchased ranks. Rank requirements are character
levels 2, 5, 8, 11 and 14; gold costs are 100, 400, 900, 1600 and 2500.
Each rank grants +4% skill damage and 2% shorter cooldown (maximum +20% and -10%).
The actual combat skill and preview both use these bonuses before support modifiers and
haste. Basic attacks still improve through weapon gear, not this additional training track.
Training is available on Skills, has no random outcome, and consumes gold only on success.

Save version stays 3. Missing training starts at zero; known skills alone survive loading,
with integer ranks bounded by character level and the five-rank cap. No inventory IDs,
equipment slots, profession XP or passive allocations are rewritten by this feature.

## Validation
`node --test tests/mastery.test.mjs` covers milestone boundaries, career/armor composition,
atomic purchases, level/currency gates, actual skill effects, caps, malformed values and
save round-trips. Browser validation exercises both panels and persistent training.

Future work: full equipment slot coverage, explicit skill trees per life profession, and
richer activity progression still need separate implementation. This is not that entire system.
