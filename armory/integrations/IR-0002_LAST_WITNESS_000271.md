# IR-0002 / INTEGRATION-000271 — Regalia Aegis × The Last Witness

**Date:** 10 Deepfall, 13,627 ICE, night  
**Location:** Opened builders' vault, Sepulcher Between Stars  
**Authority:** Emperor Elys's explicit player instruction "**Integrate the relic into my armor**"  
**Narrative source:** [Turn 000271](../../saves/turns/000271.md)

## Installed configuration

- **Armor:** `ITM-000002 Regalia Aegis`, owned/worn by Elys, remains multi-slot equipped head/body/arms/legs/feet, **durability 100/100**; all sealed life-support, mobility, defenses, stealth/cyber and automated **environmental material-based self-repair** remain operational.
- **Relic:** `ITM-000004 The Last Witness`, uniquely owned by Elys, **physically moved out of `ITM-000003` backpack protected storage** and seated in removable insulated sternum mounting cradle. **`relic_core` equipment slot is NOW `ITM-000004`; `equipped: true`.** Still a distinct non-sentient relic; no forging destruction, copy or change of its item ID/provenance.
- **Forge Core:** `ITM-000003`, worn in artifact/backpack slot 100/100, integrated mount made from **actual surrounding mineral debris** and forge's own processing. Exact masses/energy unknown, not zero, and no fictitious inventory debit.
- **Aletheia:** `ITM-000001`, sentient **Genesis Loom staff** hovering Elys's RIGHT, assists with safe alignment. Not mechanically main_hand-equipped.

## Bus architecture and activation

Mount: sovereign-keyed independent protection cradle under central white-gold armor chest plates; the twelve-point relic remains protected and visible through black crystal window. Armor has reinforced mechanically removable mount. Separate witness-authentication logic and evidence lineage prevent the attached suit's ordinary software from silently rewriting the Witness's evidence; **two independently checkable sets of history**.

1. `ANCHOR_OF_IDENTITY`: **ACTIVE** for Elys and attached armor continuity (bounded mnemonic/identity/ontological record protection, not all-purpose immunity, no resurrection).
2. `TESTAMENT_SEAL`: **ENABLED**, authenticated provenance and anti-tamper chronological record chain, bounded capacity; original testimony may still be mistaken.
3. `SEPULCHER_WAYMARK`: **SYNCHRONIZED**, manual/requested main-route reference; no instant travel.
4. `CUSTODIANS_ACCORD`: **AUTHENTICATED**, request protocol to cooperative Heart; the Heart retains right of refusal.
5. `REPAIR_CONTINUITY_CROSSCHECK`: armor's pre-existing material-fed regeneration can now check reconstructed plates, structural metadata and control-identity references against independent Witness continuity; may detect unauthorized alterations, **does not create more mass, grant immortality or guarantee flawless repair**.

## Calibration

- Physical mounting/pressure sealing integrity and all prior armor subsystems: **PASS**; 100/100 armor.
- Normal authorized identity anchoring and status monitoring: **PASS**.
- *Artificial test record* tamper: witness detects conflict and Aegis rejects simulated corrupt copy: **PASS**.
- Simulated armor reconstruction through continuity-history check: **PASS**, **no real damage applied**.
- Strong external ontological attacks, real erased souls, unrestricted divinity killing, maximum energy costs, actual numerical defensive boosts: **NOT TESTED**. Keep such numeric values UNKNOWN.

## Ledger invariants

The Last Witness remains ONE artifact with unique `ITM-000004` ID, now equipped. Forge Core storage list must **NOT** still include it. Armor `linked_relic_core_item_id` must equal `ITM-000004`, Elys `equipped.relic_core` must equal `ITM-000004`, item `equipped` must be true, location physically under Aegis sternum. This installation should have ONE `TX-000271-ITM-000004` transaction, no new item mint and no money movement. Earlier Sepulcher payout `GUILD-PAYOUT-SSS004-000268` should still exist exactly once.

Relic source: [Last Witness dossier](../relics/ITM-000004_THE_LAST_WITNESS.md); initial armor source [IR-0002](../commissions/IR-0002_REGALIA_AEGIS_FORGE_CORE.md).
