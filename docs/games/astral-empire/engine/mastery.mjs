/** Browser progression tuning. See ../PROGRESSION.md for source boundaries. */
import { PROFESSIONS, SKILLS } from "./content.mjs";
export const MASTERY_LEVELS = Object.freeze([3, 6, 10]);
export const MAX_SKILL_RANK = 5;
// Distinct careers complement, rather than replace, gear and the Ledger Web.
export const PROFESSION_REWARDS = Object.freeze({
  crystallography: { stat: "mana", amount: 6, label: "+6 maximum mana" },
  mining: { stat: "armor", amount: 4, label: "+4 armor" },
  forestry: { stat: "power", amount: 1, label: "+1 attack power" },
  herbalism: { stat: "life", amount: 12, label: "+12 maximum life" },
  fishing: { stat: "recovery", amount: .02, label: "+2% recovery" },
  smithing: { stat: "armorRate", amount: .02, label: "+2% armor effectiveness" },
  alchemy: { stat: "resistance", amount: .01, label: "+1% resistance" },
  cooking: { stat: "life", amount: 12, label: "+12 maximum life" },
  salvage: { stat: "penetration", amount: .01, label: "+1% armor penetration" },
  surveying: { stat: "speed", amount: .01, label: "+1% movement speed" },
  fabrication: { stat: "haste", amount: .01, label: "+1% haste" },
});
const boundedXP = (value) => Number.isFinite(value) ? Math.max(0, Math.min(1e8, value)) : 0;
export function professionProgress(state, id) {
  const xp = boundedXP(state.professions?.[id]);
  const level = 1 + Math.floor(Math.sqrt(xp / 30));
  const floor = 30 * (level - 1) ** 2, next = 30 * level ** 2;
  const milestones = MASTERY_LEVELS.map(level => ({ level, xp: 30 * (level - 1) ** 2, unlocked: xp >= 30 * (level - 1) ** 2 }));
  return { xp, level, remaining: Math.ceil(next - xp), fraction: (xp - floor) / (next - floor), milestones, earned: milestones.filter(m => m.unlocked).length, reward: PROFESSION_REWARDS[id] || null };
}
export function applyProfessionMastery(stats, state) {
  for (const profession of PROFESSIONS) {
    const { earned, reward } = professionProgress(state, profession.id);
    if (reward) stats[reward.stat] = (stats[reward.stat] || 0) + earned * reward.amount;
  }
  return stats;
}
const trainable = id => SKILLS.some(skill => skill.id === id && id !== "strike");
export function normalizeSkillTraining(input, level = 1) {
  const result = {};
  level = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  const unlocked = Math.max(0, Math.min(MAX_SKILL_RANK, 1 + Math.floor((level - 2) / 3)));
  for (const skill of SKILLS.filter(s => s.id !== "strike")) {
    const n = input?.[skill.id];
    result[skill.id] = Number.isFinite(n) ? Math.max(0, Math.min(unlocked, Math.floor(n))) : 0;
  }
  return result;
}
export function skillTraining(state, id) {
  const valid = trainable(id);
  const rank = valid ? normalizeSkillTraining(state.skillTraining, state.level)[id] : 0;
  const nextRank = rank + 1, requiredLevel = 2 + rank * 3, gold = 100 * nextRank ** 2;
  const maxed = rank >= MAX_SKILL_RANK;
  const reason = !valid ? "Basic attacks progress through your weapon." : maxed ? "Fully trained." : (state.level || 1) < requiredLevel ? `Requires character level ${requiredLevel}.` : !Number.isFinite(state.gold) || state.gold < gold ? `Requires ${gold} gold.` : "Ready to train.";
  return { valid, rank, nextRank, requiredLevel, gold, maxed, reason, canTrain: valid && !maxed && (state.level || 1) >= requiredLevel && Number.isFinite(state.gold) && state.gold >= gold, damage: 1 + rank * .04, cooldown: 1 - rank * .02 };
}
export function trainSkill(state, id) {
  const training = skillTraining(state, id);
  if (!training.canTrain) return { ok: false, message: training.reason };
  state.skillTraining = normalizeSkillTraining(state.skillTraining, state.level);
  state.skillTraining[id] = training.nextRank;
  state.gold -= training.gold;
  return { ok: true, message: `${SKILLS.find(s => s.id === id).name}: training rank ${training.nextRank}/${MAX_SKILL_RANK}.` };
}
