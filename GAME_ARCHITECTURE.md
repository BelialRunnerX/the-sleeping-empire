# Sleeping Empire – Game Architecture v1

## 1. Project Vision

**Genre**: 2D Roguelite (browser-based)  
**Art Style**: 8-bit / Terraria-inspired (pixelated, charming, retro-modern)  
**Core Loop**: Explore → Loot → Gear Up → Repeat  
**Player Fantasy**: An ambitious wanderer with no fixed allegiance, driven by the pursuit of power in a vast, ancient empire.

**Key Pillars**:
- Deep, meaningful gear systems (Armor, Weapons, Psionics)
- Procedural exploration with both peaceful and hostile encounters
- Finite dungeons inside an infinite-feeling world
- Lore as flavorful inspiration rather than strict mechanics

---

## 2. World Structure

### 2.1 Overworld
- Large / infinite-feeling procedural map
- Multiple location types with different encounter probabilities
- Dungeon entrances scattered across the map

### 2.2 Dungeons
- Finite, procedural, room-based
- Higher risk / higher reward
- Clear entry and exit points

### 2.3 Scriptures
- Collectible lore fragments
- Can appear as loot or special rewards
- Provide world flavor and occasional mechanical hints

---

## 3. Core Systems

### 3.1 Character Stats
- Strength
- Reflexes
- Intelligence
- Willpower
- Presence

**Pseudo Code**:
```pseudo
function resolveEvent(stat, difficulty):
    if stat >= difficulty:
        return success
    else:
        return failure with consequence
```

### 3.2 Armor System
- Tiers: Common → Uncommon → Rare → Epic → Legendary
- Stats: Armor (flat + %), Health (flat + %), Movement Speed (%)
- Elemental Affinity (Void, Plasma, Neural, Dimensional, Kinetic)
- Rune slots (2–3 per piece)

**Pseudo Code**:
```pseudo
function calculateEffectiveArmor(armor, incomingElement):
    base = armor.baseArmor + armor.flatBonus
    percent = base * (1 + armor.percentBonus)
    
    if armor.element == incomingElement:
        percent *= 1.15  // resistance bonus
    
    return percent
```

### 3.3 Weapons System
- Tiers + Elemental Type
- Damage (flat + %)
- Fire Rate (attacks per turn)
- Effectiveness vs armor types (bonus damage against mismatched elements)

**Pseudo Code**:
```pseudo
function calculateWeaponDamage(weapon, targetArmor):
    damage = weapon.baseDamage * (1 + weapon.percentBonus)
    
    if weapon.element != targetArmor.element:
        damage *= 1.25
    
    return damage
```

### 3.4 Psionics System
- Same elemental types as weapons/armor
- Can be used offensively or defensively
- Should have synergies and counters with gear

---

## 4. Loot & Progression

- Fully randomized loot generation (no hand-crafted items)
- Every item has: Tier, Element, Stats, Possible Runes
- Runes provide meaningful modifiers (flat/percent bonuses, elemental resistance, special effects)

**Pseudo Code**:
```pseudo
function generateLoot():
    tier = randomTier()
    element = randomElement()
    type = random(Armor, Weapon)
    
    item = createItem(type, tier, element)
    item.runes = generateRunes(1–3)
    
    return item
```

---

## 5. Encounters

### 5.1 Encounter Types
- Hostile (Combat)
- Peaceful (Trade, Dialogue, Information)
- Exploration / Mystery
- Psionic / Dimensional events

### 5.2 Resolution Paths
Each encounter should support multiple approaches:
- Combat
- Social / Charisma
- Intelligence / Knowledge
- Psionics
- Gear-based solutions

**Pseudo Code**:
```pseudo
function resolveEncounter(encounter, character):
    if character.hasMatchingElement(encounter):
        return bonusOutcome
    
    if character.stats.intelligence >= encounter.difficulty:
        return smartSolution
    
    return defaultOutcome
```

---

## 6. Map & Movement

- 2D grid-based overworld
- Tap-to-move + keyboard support (mobile friendly)
- Fog of War + discovered tiles
- Pathfinding for fast travel
- Dungeon entrances that transition the player into a separate dungeon map

---

## 7. Technical Requirements (Browser Game)

- Must be fully playable in a modern browser
- No installation required
- Save/Load system (localStorage or file export)
- Responsive (works well on desktop and mobile)

---

## 8. Current Implementation Status (as of latest build)

| System              | Status          | Notes |
|---------------------|------------------|-------|
| Movement            | Implemented     | Keyboard + Tap-to-move |
| Basic UI            | Implemented     | Stats + Inventory display |
| Loot Generation     | Implemented     | Randomized armor/weapons |
| Encounters          | Implemented     | Hostile + Peaceful |
| Dungeon System      | Implemented     | Entry/Exit + procedural generation |
| Visuals             | Improved        | Modern retro style |
| Save System         | Not yet         | Planned |
| Deep Psionics       | Partial         | Elements exist, full system pending |
| Runes               | Basic           | Slots exist, effects limited |

---

## 9. Next Development Priorities (Recommended)

1. **Save/Load System** (critical for roguelite)
2. **Deeper Psionics System** (make it feel distinct from weapons)
3. **Improved Combat Resolution** (integrate armor/weapon elements properly)
4. **Scriptures / Lore Collection**
5. **More Dungeon Variety** (different themes/layouts)
6. **Balancing & Polish**

---

*This document should serve as the living architecture spec for the Sleeping Empire Roguelite.*