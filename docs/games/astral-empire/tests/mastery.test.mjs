import { test } from "node:test";
import assert from "node:assert/strict";
import { freshState, migrateState, stats, skillStats, makeItem } from "../engine/progression.mjs";
import { PROFESSIONS, SKILLS } from "../engine/content.mjs";
import { professionProgress, applyProfessionMastery, PROFESSION_REWARDS, normalizeSkillTraining, trainSkill, skillTraining } from "../engine/mastery.mjs";
const skill = SKILLS.find(s => s.id !== "strike").id;
test("every profession has a bounded career and exact milestone boundaries", () => {
  const s = freshState();
  assert.deepEqual(Object.keys(PROFESSION_REWARDS).sort(), PROFESSIONS.map(p=>p.id).sort());
  for (const [xp, earned] of [[0,0],[119,0],[120,1],[749,1],[750,2],[2429,2],[2430,3],[1e8,3]]) {
    s.professions.mining=xp;
    const p=professionProgress(s,"mining");
    assert.equal(p.earned,earned);assert.ok(p.fraction>=0&&p.fraction<1);assert.ok(p.remaining>0);
  }
  s.professions.mining=Infinity;assert.equal(professionProgress(s,"mining").level,1);
});
test("career bonuses stack with armor, capped at three rewards; fresh stats unchanged",()=>{
  const s=freshState(), baseline=stats(s,0);assert.equal(applyProfessionMastery({armor:10},s).armor,10);
  s.professions.mining=2430;const mined=stats(s,0);assert.equal(mined.armor,baseline.armor+12);
  s.professions.smithing=2430;assert.ok(Math.abs(stats(s,0).armor-mined.armor*1.06)<1e-9);
  s.professions.mining=1e8;assert.equal(stats(s,0).armor,mined.armor*1.06);
  const armor=makeItem(789,4,"armor","magic");armor.affixes=[];s.items.push(armor);s.equipped.armor=armor.id;
  assert.ok(stats(s,0).armor>12);assert.equal(s.items.find(i=>i.id===armor.id).base,armor.base);
});
test("training level and gold gates are atomic, strike and unknown skills never train",()=>{
  const s=freshState(), before=JSON.stringify(s);assert.equal(trainSkill(s,skill).ok,false);assert.equal(JSON.stringify(s),before);
  s.level=2;s.gold=99;assert.equal(trainSkill(s,skill).ok,false);assert.equal(s.gold,99);
  s.gold=100;assert.equal(trainSkill(s,skill).ok,true);assert.equal(s.gold,0);assert.equal(s.skillTraining[skill],1);
  s.gold=9999;assert.equal(trainSkill(s,skill).ok,false);assert.equal(s.gold,9999);
  for(const id of ["strike","bogus","__proto__"]) assert.equal(trainSkill(s,id).ok,false);
});
test("training modifies actual skill damage/cooldown and leaves weapon strike alone",()=>{
  const s=freshState();s.level=20;s.gold=1e6;
  const before=skillStats(s,skill), strike=skillStats(s,"strike");
  for(let i=0;i<5;i++)assert.equal(trainSkill(s,skill).ok,true);
  const after=skillStats(s,skill);assert.equal(after.trainingRank,5);
  assert.ok(Math.abs(after.damage/before.damage-1.2)<1e-9);
  assert.ok(Math.abs(after.cooldown/before.cooldown-.9)<1e-9);
  assert.deepEqual(skillStats(s,"strike"),strike);
  const gold=s.gold;assert.equal(trainSkill(s,skill).ok,false);assert.equal(s.gold,gold);
});
test("legacy saves default safely; training survives JSON reload without double bonuses",()=>{
  const s=freshState();delete s.skillTraining;const legacy=migrateState(s);assert.equal(skillTraining(legacy,skill).rank,0);
  s.level=20;s.gold=9999;trainSkill(s,skill);s.professions.mining=2430;
  const round=migrateState(JSON.parse(JSON.stringify(s)));assert.equal(round.skillTraining[skill],1);
  assert.deepEqual(stats(round,0),stats(s,0));assert.deepEqual(migrateState(round).skillTraining,round.skillTraining);
  assert.equal(normalizeSkillTraining({[skill]:999,unknown:5},20)[skill],5);
  assert.equal(normalizeSkillTraining({[skill]:NaN},20)[skill],0);
  assert.equal(normalizeSkillTraining({[skill]:5},NaN)[skill],0);
  assert.equal(normalizeSkillTraining({[skill]:5},2)[skill],1);
  assert.equal(Object.hasOwn(normalizeSkillTraining({unknown:5},20),'unknown'),false);
});
