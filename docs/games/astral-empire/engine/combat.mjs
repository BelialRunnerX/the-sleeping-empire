import { HEROES, ENEMY_TYPES } from "./content.mjs";
import { numeric } from "./native.mjs";
import {
  clamp,
  stats,
  skillStats,
  addXP,
  makeItem,
  hash,
} from "./progression.mjs";

// A cast snapshots offensive stats. Targets' mitigation is evaluated on impact.
export function hitBreakdown(
  skill,
  st,
  target = {},
  element = "Astral",
  critical = false,
  factor = 1,
) {
  const physicalShare = skill.physical ?? 0.8;
  const increased =
    st.damage +
    (skill.tags.includes("spell") ? st.spellDamage : st.attackDamage);
  const more =
    skill.damage *
    factor *
    (skill.execute && target.hp / target.max < 0.35 ? 1.45 : 1) *
    (st.keystones.includes("fracture") && !critical ? 0.9 : 1);
  const armor = (target.armor || 0) * (target.expose > 0 ? 0.65 : 1);
  const resistance =
    (target.resistances?.[element] ?? target.resistance ?? 0) +
    (target.element === element ? 0.2 : 0);
  const physical = numeric.resolve_damage(
    st.power * skill.power * physicalShare,
    increased,
    more,
    armor,
    st.penetration,
    critical ? 1 : 0,
    st.critMultiplier,
  );
  const elemental = numeric.element_damage(
    st.power *
      skill.power *
      (1 - physicalShare) *
      (1 + increased + st.elementalDamage) *
      more *
      (critical ? st.critMultiplier : 1),
    resistance,
    st.elementalPenetration,
  );
  const taken = target.shock > 0 ? 1.15 : 1;
  return {
    physical: physical * taken,
    elemental: elemental * taken,
    total: (physical + elemental) * taken,
    element,
    resistance: clamp(resistance - st.elementalPenetration, -0.5, 0.75),
  };
}

export const REACTIONS = {
  "Flame|Tide": { name: "STEAM BREAK", effect: "weaken", bonus: 0.25 },
  "Flame|Gale": { name: "WILDFIRE", effect: "burn", bonus: 0.2 },
  "Tide|Volt": { name: "SUPERCONDUCT", effect: "expose", bonus: 0.2 },
  "Solar|Void": { name: "ECLIPSE", effect: "expose", bonus: 0.3 },
  "Astral|Void": { name: "STARFALL", effect: "mana", bonus: 0.15 },
  "Astral|Solar": { name: "ZENITH", effect: "heal", bonus: 0.15 },
};
export function reactionFor(a, b) {
  return !a || a === b
    ? null
    : REACTIONS[[a, b].sort().join("|")] || {
        name: "RESONANCE",
        effect: "none",
        bonus: 0.15,
      };
}

export class Simulation {
  constructor(state) {
    this.state = state;
    const st = stats(state);
    this.player = {
      ...state.position,
      y: 0,
      facing: Math.PI,
      hp: clamp(Number(state.life) || st.life, 1, st.life),
      mana: clamp(Number(state.mana) || 0, 0, st.mana),
      stamina: 100,
      invulnerable: 0,
      dodge: 0,
      velocityY: 0,
    };
    this.enemies = [];
    this.projectiles = [];
    this.pendingCasts = [];
    this.cooldowns = {};
    this.events = [];
    this.combo = 0;
    this.comboTimer = 0;
    this.clock = 0;
    this.effectId = 0;
    this.potionCD = 0;
    this.lastHit = null;
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  spawn(id, x, z, boss = false, archetype = "stalker") {
    const kind = boss ? "warden" : archetype,
      profile = ENEMY_TYPES[kind] || ENEMY_TYPES.stalker;
    const hp = profile.life * (1 + this.state.deepest * 0.4);
    const e = {
      id,
      x,
      z,
      homeX: x,
      homeZ: z,
      hp,
      max: hp,
      armor: profile.armor,
      resistance: profile.resistance,
      element: profile.element,
      archetype: kind,
      training: kind === "training",
      name: profile.name,
      level: this.state.level,
      boss,
      phase: "idle",
      timer: 0,
      cooldown: 1,
      stagger: 0,
      aura: null,
      burn: 0,
      burnTime: 0,
      chill: 0,
      shock: 0,
      expose: 0,
      weaken: 0,
      attackCount: 0,
      enraged: false,
      respawnAt: this.state.defeated[id] || 0,
    };
    if (e.respawnAt > Date.now()) e.hp = 0;
    this.enemies.push(e);
    return e;
  }
  nearest(range = 22, origin = this.player, excluded = new Set()) {
    let found = null,
      best = range;
    for (const e of this.enemies)
      if (e.hp > 0 && !excluded.has(e.id)) {
        const d = Math.hypot(e.x - origin.x, e.z - origin.z);
        if (d < best) {
          found = e;
          best = d;
        }
      }
    return found;
  }
  attack(id) {
    const skill = skillStats(this.state, id),
      p = this.player;
    if (!skill || this.cooldowns[id] > 0 || p.mana < skill.cost || p.hp <= 0)
      return false;
    p.mana -= skill.cost;
    this.cooldowns[id] = skill.cooldown;
    const locked =
      this.locked?.hp > 0 &&
      Math.hypot(this.locked.x - p.x, this.locked.z - p.z) <=
        (skill.range || skill.radius)
        ? this.locked
        : null;
    const target = locked || this.nearest(skill.range || skill.radius);
    if (target) p.facing = Math.atan2(target.x - p.x, target.z - p.z);
    if (id === "strike") {
      this.combo = this.comboTimer > 0 ? (this.combo + 1) % 3 : 0;
      this.comboTimer = 1.8;
    }
    if (id === "dash") {
      const travel = target
        ? clamp(Math.hypot(target.x - p.x, target.z - p.z) - 1.6, 0, 7)
        : 7;
      p.x = clamp(p.x + Math.sin(p.facing) * travel, -140, 140);
      p.z = clamp(p.z + Math.cos(p.facing) * travel, -140, 140);
      p.invulnerable = 0.5;
    }
    const cast = {
      skill: { ...skill, tags: [...skill.tags] },
      st: stats(this.state),
      element:
        skill.element || HEROES.find((h) => h.id === this.state.hero).element,
      x: p.x,
      z: p.z,
      facing: p.facing,
      combo: this.combo,
      targetId: target?.id,
    };
    this.resolveCast(cast);
    if (skill.echo)
      this.pendingCasts.push({ ...cast, delay: 0.35, factor: 0.6, echo: true });
    return true;
  }
  resolveCast(cast) {
    const { skill } = cast,
      factor = cast.factor ?? 1;
    this.emit("skill", {
      id: skill.id,
      weapon: skill.weapon,
      x: cast.x,
      z: cast.z,
      facing: cast.facing,
      radius: skill.radius,
      echo: !!cast.echo,
      projectile: skill.tags.includes("projectile"),
      element: cast.element,
    });
    if (skill.tags.includes("projectile")) {
      const fan =
        skill.id === "strike" && skill.weapon === "bow" && cast.combo === 2
          ? [-0.15, 0, 0.15]
          : [0];
      for (const angle of fan)
        this.launch(
          {
            ...cast,
            factor:
              factor *
              (fan.length === 3 ? 0.65 : 1) *
              (skill.id === "strike" &&
              skill.weapon === "staff" &&
              cast.combo === 2
                ? 1.5
                : 1),
          },
          cast.facing + angle,
        );
      return;
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const dx = e.x - cast.x,
        dz = e.z - cast.z,
        d = Math.hypot(dx, dz);
      if (
        skill.id === "strike" &&
        (d > skill.range ||
          (d > 0.1 &&
            (dx * Math.sin(cast.facing) + dz * Math.cos(cast.facing)) / d <
              0.45))
      )
        continue;
      if (skill.id !== "strike" && skill.range > 0 && e.id !== cast.targetId)
        continue;
      if (skill.range === 0 && d > skill.radius) continue;
      this.hitEnemy(
        e,
        cast,
        factor * (skill.id === "strike" && cast.combo === 2 ? 1.55 : 1),
      );
    }
  }
  launch(cast, facing, options = {}) {
    if (this.projectiles.length >= 128) return;
    const skill = cast.skill;
    this.projectiles.push({
      id: ++this.effectId,
      x: cast.x,
      z: cast.z,
      dx: Math.sin(facing),
      dz: Math.cos(facing),
      speed: skill.projectileSpeed || 24,
      remaining: skill.range || 20,
      radius: skill.id === "lance" ? 0.45 : skill.radius,
      pierce: skill.pierce || 0,
      chain:
        (skill.chain || 0) +
        (skill.weapon === "staff" && cast.combo === 2 ? 1 : 0),
      hit: new Set(),
      cast,
      factor: cast.factor ?? 1,
      faction: "player",
      ...options,
    });
  }
  hitEnemy(e, cast, factor = 1) {
    if (e.hp <= 0) return;
    const { skill, st, element } = cast,
      critical = Math.random() < st.crit;
    const breakdown = hitBreakdown(skill, st, e, element, critical, factor),
      reaction = reactionFor(e.aura, element);
    let amount = breakdown.total;
    if (reaction) {
      amount *= 1 + reaction.bonus;
      this.emit("reaction", { text: reaction.name, x: e.x, z: e.z });
      if (reaction.effect === "weaken") e.weaken = 4;
      if (reaction.effect === "expose") e.expose = 4;
      if (reaction.effect === "burn") {
        e.burnTime = 4;
        e.burn = Math.max(e.burn, amount * 0.25);
      }
      if (reaction.effect === "mana")
        this.player.mana = Math.min(
          stats(this.state).mana,
          this.player.mana + 12,
        );
      if (reaction.effect === "heal")
        this.player.hp = Math.min(
          stats(this.state).life,
          this.player.hp + stats(this.state).life * 0.04,
        );
    }
    e.aura = element;
    if (element === "Tide") e.chill = 3;
    if (element === "Volt") e.shock = 3;
    if (element === "Void") e.expose = 3;
    if (skill.burn) {
      e.burnTime = 4;
      e.burn = Math.max(e.burn, amount * 0.225);
    }
    e.hp -= amount;
    e.stagger =
      skill.id === "strike" && skill.weapon === "blade" && cast.combo === 2
        ? 0.8
        : 0.1;
    this.player.hp = Math.min(
      stats(this.state).life,
      this.player.hp +
        Math.min(amount, Math.max(0, e.hp + amount)) * skill.leech,
    );
    if (e.phase === "idle") e.phase = "chase";
    this.lastHit = {
      ...breakdown,
      source: skill.name,
      echo: !!cast.echo,
      factor,
      total: amount,
      target: e.name,
      critical,
      reaction: reaction?.name || null,
    };
    this.emit("damage", {
      amount: Math.round(amount),
      critical,
      x: e.x,
      z: e.z,
      element,
    });
    if (e.hp <= 0) this.kill(e);
  }
  tickProjectiles(dt) {
    const p = this.player;
    for (const shot of this.projectiles) {
      if (shot.remaining <= 0) continue;
      const distance = Math.min(shot.remaining, shot.speed * dt),
        ax = shot.x,
        az = shot.z,
        bx = ax + shot.dx * distance,
        bz = az + shot.dz * distance;
      if (shot.faction === "enemy") {
        const t = numeric.segment_hit(
          ax,
          az,
          bx,
          bz,
          p.x,
          p.z,
          0.55 + shot.radius,
        );
        if (t >= 0 && p.y < 1.4) {
          if (p.invulnerable <= 0) this.hurtPlayer(shot.damage, shot.element);
          shot.remaining = 0;
        }
      } else {
        const hits = this.enemies
          .filter((e) => e.hp > 0 && !shot.hit.has(e.id))
          .map((e) => ({
            e,
            t: numeric.segment_hit(
              ax,
              az,
              bx,
              bz,
              e.x,
              e.z,
              (e.boss ? 1.1 : 0.55) + shot.radius,
            ),
          }))
          .filter((h) => h.t >= 0)
          .sort((a, b) => a.t - b.t);
        for (const { e, t } of hits) {
          if (e.hp <= 0) continue;
          shot.hit.add(e.id);
          this.hitEnemy(e, shot.cast, shot.factor);
          if (shot.pierce > 0) {
            shot.pierce--;
            continue;
          }
          const next = shot.chain > 0 ? this.nearest(8, e, shot.hit) : null;
          if (next) {
            shot.chain--;
            shot.factor *= 0.7;
            shot.x = ax + (bx - ax) * t;
            shot.z = az + (bz - az) * t;
            const d = Math.hypot(next.x - shot.x, next.z - shot.z);
            shot.dx = (next.x - shot.x) / d;
            shot.dz = (next.z - shot.z) / d;
            shot.remaining = 12;
            shot.chained = true;
            break;
          }
          shot.remaining = 0;
          break;
        }
      }
      if (shot.chained) {
        shot.chained = false;
        continue;
      }
      shot.x = bx;
      shot.z = bz;
      shot.remaining -= distance;
    }
    this.projectiles = this.projectiles.filter((s) => s.remaining > 0);
  }
  hurtPlayer(base, element = "Physical", weaken = 1) {
    const st = stats(this.state),
      amount =
        element === "Physical"
          ? numeric.resolve_damage(base * weaken, 0, 1, st.armor, 0, 0, 1)
          : numeric.element_damage(base * weaken, st.resistance, 0);
    this.player.hp -= amount;
    this.emit("hurt", { amount: Math.round(amount), element });
  }
  enemyProjectile(e, facing) {
    this.launch(
      {
        skill: {
          id: "hostile",
          range: 26,
          radius: 0.3,
          projectileSpeed: e.boss ? 10 : 14,
        },
        x: e.x,
        z: e.z,
        factor: 1,
      },
      facing,
      {
        faction: "enemy",
        damage: (e.boss ? 40 : 24) * (e.weaken > 0 ? 0.7 : 1),
        element: e.archetype === "archer" ? "Physical" : e.element,
      },
    );
  }
  kill(e) {
    if (e.training) {
      e.hp = e.max;
      e.phase = "idle";
      return;
    }
    if (e.rewarded) return;
    e.rewarded = true;
    e.hp = 0;
    e.respawnAt = Date.now() + (e.boss ? 600000 : 90000);
    this.state.defeated[e.id] = e.respawnAt;
    this.state.statistics.kills++;
    if (e.boss) this.state.statistics.bosses++;
    this.state.gold += e.boss ? 250 : 20;
    this.state.crystals += e.boss ? 120 : 8;
    const levels = addXP(this.state, e.boss ? 180 : 35);
    if (e.boss || Math.random() < 0.3) {
      const i = makeItem(
        Date.now() + hash(this.state.seed, this.state.statistics.kills, 4),
        this.state.level,
        ["weapon", "armor", "charm"][this.state.statistics.kills % 3],
        e.boss ? "epic" : "rare",
      );
      if (this.state.items.length < 200) this.state.items.push(i);
      this.emit("loot", { text: i.rarity.toUpperCase() + " · " + i.name });
    }
    this.emit("kill", { boss: e.boss, levels });
  }
  dodge(dx = 0, dz = 0) {
    if (this.player.stamina < 30 || this.player.dodge > 0) return false;
    const p = this.player;
    p.stamina -= 30;
    p.dodge = 0.28;
    p.invulnerable = 0.42;
    if (dx || dz) p.facing = Math.atan2(dx, dz);
    this.emit("dodge");
    return true;
  }
  heal() {
    if (this.state.resources.potions <= 0 || this.potionCD > 0) return false;
    this.state.resources.potions--;
    this.player.hp = Math.min(
      stats(this.state).life,
      this.player.hp + stats(this.state).life * 0.45,
    );
    this.potionCD = 12;
    this.emit("heal");
    return true;
  }
  tick(dt, input = {}) {
    dt = clamp(dt, 0, 0.05);
    this.clock += dt;
    const p = this.player,
      st = stats(this.state);
    for (const k of Object.keys(this.cooldowns))
      this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    this.comboTimer -= dt;
    this.potionCD = Math.max(0, this.potionCD - dt);
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.stamina = Math.min(100, p.stamina + 19 * dt);
    p.mana = Math.min(st.mana, p.mana + 8 * (1 + st.recovery) * dt);
    p.hp = Math.min(
      st.life,
      p.hp +
        st.life *
          (st.keystones.includes("wellspring") ? 0.02 : 0.002) *
          (1 + st.recovery) *
          dt,
    );
    let dx = input.x || 0,
      dz = input.z || 0,
      len = Math.hypot(dx, dz);
    if (len > 1) {
      dx /= len;
      dz /= len;
    }
    const speed = 6.2 * (1 + st.speed);
    if (p.dodge > 0) {
      dx = Math.sin(p.facing) * 3.2;
      dz = Math.cos(p.facing) * 3.2;
      p.dodge -= dt;
    } else if (len) p.facing = Math.atan2(dx, dz);
    p.x = clamp(p.x + dx * speed * dt, -140, 140);
    p.z = clamp(p.z + dz * speed * dt, -140, 140);
    if (p.y > 0 || p.velocityY > 0) {
      p.velocityY -= 20 * dt;
      p.y = Math.max(0, p.y + p.velocityY * dt);
    }
    const ready = [];
    this.pendingCasts = this.pendingCasts.filter((c) => {
      c.delay -= dt;
      if (c.delay <= 0) {
        ready.push(c);
        return false;
      }
      return true;
    });
    for (const c of ready) this.resolveCast(c);
    this.tickProjectiles(dt);
    for (const e of this.enemies) {
      if (e.hp <= 0) {
        if (e.respawnAt <= Date.now()) {
          e.hp = e.max;
          e.rewarded = false;
          e.x = e.homeX;
          e.z = e.homeZ;
          e.phase = "idle";
          e.enraged = false;
          for (const k of [
            "burn",
            "burnTime",
            "chill",
            "shock",
            "expose",
            "weaken",
          ])
            e[k] = 0;
          e.aura = null;
        }
        continue;
      }
      e.stagger = Math.max(0, e.stagger - dt);
      e.cooldown -= dt;
      for (const k of ["chill", "shock", "expose", "weaken"])
        e[k] = Math.max(0, e[k] - dt);
      if (e.burnTime > 0) {
        const elapsed = Math.min(dt, e.burnTime);
        e.burnTime -= elapsed;
        e.hp -= e.burn * elapsed;
        if (e.hp <= 0) {
          this.kill(e);
          continue;
        }
      } else e.burn = 0;
      if (e.boss && !e.enraged && e.hp < e.max * 0.5) {
        e.enraged = true;
        this.emit("enrage", {
          text: "THE WARDEN AWAKENS · EVADE THE STAR STORM",
        });
      }
      if (e.training) continue;
      const profile = ENEMY_TYPES[e.archetype],
        d = Math.hypot(e.x - p.x, e.z - p.z),
        home = Math.hypot(e.x - e.homeX, e.z - e.homeZ),
        slow = e.chill > 0 ? 0.75 : 1;
      if (e.phase === "windup") {
        e.timer -= dt * slow;
        if (e.timer <= 0) {
          if (e.move === "arrow")
            this.enemyProjectile(e, Math.atan2(e.aimX - e.x, e.aimZ - e.z));
          else if (e.move === "storm")
            for (let i = 0; i < 10; i++)
              this.enemyProjectile(e, (i / 10) * Math.PI * 2);
          else {
            const radius = e.move === "eruption" ? 3.5 : e.boss ? 6 : 3.3,
              tx = e.move === "eruption" ? e.aimX : e.x,
              tz = e.move === "eruption" ? e.aimZ : e.z;
            if (
              Math.hypot(p.x - tx, p.z - tz) < radius &&
              p.invulnerable <= 0 &&
              p.y < 1.4
            )
              this.hurtPlayer(
                e.boss ? 75 : e.move === "eruption" ? 34 : 24,
                e.move === "eruption" ? "Flame" : "Physical",
                e.weaken > 0 ? 0.7 : 1,
              );
          }
          e.phase = "recover";
          e.timer = e.boss ? 1.1 : 0.7;
        }
        continue;
      }
      if (e.phase === "recover") {
        e.timer -= dt;
        if (e.timer <= 0) e.phase = "chase";
        continue;
      }
      if (home > 28 || d > 30) {
        e.phase = "idle";
        const back = Math.hypot(e.homeX - e.x, e.homeZ - e.z);
        if (back > 0.1) {
          e.x += ((e.homeX - e.x) / back) * dt * 4;
          e.z += ((e.homeZ - e.z) / back) * dt * 4;
        }
        continue;
      }
      if (d < (e.boss ? 18 : 14)) e.phase = "chase";
      if (e.phase === "chase" && e.stagger <= 0) {
        if (d < profile.range && e.cooldown <= 0) {
          e.attackCount++;
          e.move =
            e.boss && e.enraged && e.attackCount % 2 === 0
              ? "storm"
              : profile.move;
          e.aimX = p.x;
          e.aimZ = p.z;
          e.phase = "windup";
          e.timer = e.move === "eruption" ? 1.25 : e.boss ? 1.4 : 0.8;
          e.windupDuration = e.timer;
          e.cooldown = e.boss ? 2.8 : e.archetype === "oracle" ? 3.8 : 2;
          this.emit("windup", { enemy: e });
        } else if (d > (profile.range > 8 ? 10 : 2)) {
          e.x += ((p.x - e.x) / d) * dt * profile.speed * slow;
          e.z += ((p.z - e.z) / d) * dt * profile.speed * slow;
        }
      }
    }
    if (p.hp <= 0) {
      p.hp = st.life;
      p.mana = st.mana;
      p.x = 0;
      p.z = 6;
      this.state.gold = Math.max(0, this.state.gold - 40);
      this.projectiles = [];
      this.pendingCasts = [];
      this.emit("death");
      for (const e of this.enemies) e.phase = "idle";
    }
    this.state.position = { x: p.x, z: p.z };
    this.state.life = p.hp;
    this.state.mana = p.mana;
  }
}
