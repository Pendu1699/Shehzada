import { aiVassals } from './vassals';
import { aiReforms } from './reforms';
// Faction AI. Each faction has a personality (aggression, caution, zeal, greed,
// honour) and era-aware goals:
//   Durrani  — come down in the cold season, plunder, go home before the heat.
//   Mughal   — hold the subahs, punish raiders, decline.
//   Company  — patient encroachment: build up, sign treaties, strike when the odds are sure.
//   Misls    — opportunistic expansion, kinship politics, rakhi, Dhai Phat against the strong.

import { FACTION_BY_ID } from '../data/factions';
import { PUNJAB_REGION_IDS, REGION_BY_ID } from '../data/regions';
import { UNIT_TYPES, canRaise } from '../data/units';
import { garrisonOf } from './combat';
import { recruitCost, recruitPool } from './economy';
import { idleLeaders } from './leaders';
import { neighbors, within } from './map';
import { findPath } from './movement';
import { armiesIn, armiesOf, armyMen, atWar, factionMen, isCavalryArmy, isSikh, mislPeaceInForce, regionsOf, year } from './query';
import { chance, rand, shuffle } from './rng';
import { offerRakhi, transferRegion } from './conquest';
import { chronicle } from './chronicle';
import { changePiri } from './miripiri';
import type { Army, FactionId, GameState, RegionId } from './state';
import { newId } from './state';

/** Rough fighting strength of an army (attack+defence weighted by men). */
export function armyPower(a: Army): number {
  let p = 0;
  for (const u of a.units) {
    const t = UNIT_TYPES[u.type];
    if (!t) continue;
    p += (u.men / 100) * (t.attack + t.defense) * (1 + u.xp * 0.3);
  }
  return p * (0.5 + a.morale / 200);
}

export function regionDefense(s: GameState, region: RegionId, attacker: FactionId): number {
  const st = s.regions[region];
  let p = 0;
  for (const a of armiesIn(s, region)) if (atWar(s, a.owner, attacker) || a.owner === st.owner) p += armyPower(a);
  if (st.owner && st.owner !== attacker) p += (garrisonOf(s, region) / 100) * 4 * (1 + 0.3 * st.fort);
  return p;
}

const PREFERRED_UNITS: Record<string, [string, number][]> = {
  sikh: [['ghorchare', 0.7], ['jezailchi', 0.2], ['nihang', 0.1]],
  bhangi: [['ghorchare', 0.6], ['jezailchi', 0.2], ['top', 0.1], ['zamburak', 0.1]],
  ramgarhia: [['ghorchare', 0.55], ['jezailchi', 0.35], ['zamburak', 0.1]],
  shaheedan: [['nihang', 0.5], ['ghorchare', 0.5]],
  phulkian: [['ghorchare', 0.5], ['piyada', 0.3], ['jezailchi', 0.2]],
  sarkar: [['fauj_ain_inf', 0.45], ['fauj_ain_cav', 0.15], ['ghorchara_khas', 0.15], ['topkhana', 0.1], ['be_qawaid', 0.15]],
  durrani: [['durrani_cav', 0.7], ['jezailchi', 0.3]],
  mughal: [['mughal_cav', 0.45], ['piyada', 0.45], ['top', 0.1]],
  maratha: [['maratha_cav', 0.8], ['piyada', 0.2]],
  company: [['sepoy', 0.55], ['british_regular', 0.15], ['company_cav', 0.2], ['horse_artillery', 0.1]],
  kangra: [['hill_levy', 1]],
  hill_states: [['hill_levy', 1]],
  jammu: [['hill_levy', 0.7], ['jezailchi', 0.3]],
  gurkha: [['gurkha', 1]],
  kasur: [['mughal_cav', 0.5], ['jezailchi', 0.5]],
  multan: [['mughal_cav', 0.4], ['jezailchi', 0.5], ['zamburak', 0.1]],
  peshawar: [['durrani_cav', 0.6], ['jezailchi', 0.4]],
  bahawalpur: [['mughal_cav', 0.5], ['jezailchi', 0.3], ['zamburak', 0.2]],
  malerkotla: [['mughal_cav', 0.5], ['jezailchi', 0.5]],
  rajputs: [['mughal_cav', 0.6], ['piyada', 0.3], ['top', 0.1]],
  jats: [['mughal_cav', 0.4], ['piyada', 0.4], ['top', 0.2]],
  rohillas: [['durrani_cav', 0.5], ['jezailchi', 0.5]],
  nawab_awadh: [['mughal_cav', 0.4], ['piyada', 0.4], ['top', 0.2]],
  nawab_bengal: [['mughal_cav', 0.4], ['piyada', 0.5], ['top', 0.1]],
  nizam: [['mughal_cav', 0.5], ['piyada', 0.4], ['top', 0.1]],
  khudadad: [['sepoy', 0.4], ['mughal_cav', 0.4], ['top', 0.2]],
  arcot: [['mughal_cav', 0.4], ['piyada', 0.6]],
  sindh_amirs: [['durrani_cav', 0.4], ['jezailchi', 0.6]],
  kalat: [['durrani_cav', 0.7], ['jezailchi', 0.3]],
  tibet: [['hill_levy', 1]],
  kandy: [['hill_levy', 1]],
};

function unitMix(s: GameState, f: FactionId): [string, number][] {
  if (s.factions[f].sarkar && year(s) >= 1803) return PREFERRED_UNITS.sarkar;
  return PREFERRED_UNITS[f] ?? (isSikh(f) ? PREFERRED_UNITS.sikh : [['piyada', 1]]);
}

function aiRecruit(s: GameState, f: FactionId) {
  const fs = s.factions[f];
  const income = Math.max(5, fs.lastIncome + 1);
  const men = factionMen(s, f);
  const personality = FACTION_BY_ID[f]?.personality;
  // Budget: keep a reserve, spend a share of the rest.
  const reserve = 10 + income * 0.5;
  let budget = Math.max(0, fs.treasury - reserve) * (0.4 + (personality?.aggression ?? 0.5) * 0.4);
  // Don't build armies the treasury can't feed.
  if (f !== 'company' && men > 0 && fs.lastIncome < 0) budget = 0;
  if (budget < 3) return;
  const regions = shuffle(s, regionsOf(s, f).filter((r) => s.regions[r].control >= 40));
  const mix = unitMix(s, f);
  const y = year(s);
  for (const r of regions.slice(0, 3)) {
    if (budget < 3) break;
    let pool = recruitPool(s, r, f).total;
    if (pool < 100) continue;
    for (const [type, share] of mix) {
      const u = UNIT_TYPES[type];
      if (!u || !canRaise(u, f, isSikh(f), fs.sarkar, y, fs.flags)) continue;
      let n = Math.floor((pool * share) / 100) * 100;
      const unitCost = recruitCost(s, f, type, 100);
      n = Math.min(n, Math.floor((budget * share * 1.5) / unitCost) * 100);
      if (n < 100) continue;
      const cost = recruitCost(s, f, type, n);
      fs.treasury -= cost;
      budget -= cost;
      pool -= n;
      addRecruits(s, f, r, type, n);
    }
  }
}

export function addRecruits(s: GameState, f: FactionId, region: RegionId, type: string, men: number): Army {
  let army = armiesIn(s, region).find((a) => a.owner === f);
  if (!army) {
    const id = newId(s, 'A');
    army = { id, owner: f, region, units: [], path: [], stance: 'pitched', morale: 70, supply: 100, policy: defaultPolicy(f) };
    s.armies[id] = army;
  }
  const st = army.units.find((u) => u.type === type);
  if (st) {
    st.xp = (st.xp * st.men) / (st.men + men);
    st.men += men;
  } else army.units.push({ type, men, xp: 0 });
  return army;
}

export function defaultPolicy(f: FactionId): Army['policy'] {
  const p = FACTION_BY_ID[f]?.personality;
  if (!p) return 'nazrana';
  if (f === 'durrani') return 'sack';
  if (isSikh(f) && p.zeal >= 0.7) return 'spare';
  return 'nazrana';
}

function assignLeaders(s: GameState, f: FactionId) {
  const idle = idleLeaders(s, f).filter((l) => l.martial >= 2 && !l.female);
  const armies = armiesOf(s, f)
    .filter((a) => !a.leader)
    .sort((a, b) => armyMen(b) - armyMen(a));
  for (const a of armies) {
    const L = idle.shift();
    if (!L) break;
    a.leader = L.id;
    L.armyId = a.id;
  }
}

function mergeArmies(s: GameState, f: FactionId) {
  const byRegion = new Map<string, Army[]>();
  for (const a of armiesOf(s, f)) {
    if (a.path.length) continue;
    const list = byRegion.get(a.region) ?? [];
    list.push(a);
    byRegion.set(a.region, list);
  }
  for (const list of byRegion.values()) {
    if (list.length < 2) continue;
    list.sort((a, b) => armyMen(b) - armyMen(a));
    const main = list[0];
    for (const other of list.slice(1)) {
      if (other.withdrawTurn !== undefined || main.withdrawTurn !== undefined) continue;
      for (const u of other.units) {
        const st = main.units.find((x) => x.type === u.type);
        if (st) st.men += u.men;
        else main.units.push({ ...u });
      }
      if (!main.leader && other.leader) {
        main.leader = other.leader;
        s.leaders[other.leader].armyId = main.id;
      } else if (other.leader) s.leaders[other.leader].armyId = undefined;
      delete s.armies[other.id];
    }
  }
}

/** Value of taking a region for this faction. */
function regionValue(s: GameState, f: FactionId, r: RegionId): number {
  const def = REGION_BY_ID[r];
  let v = def.population * def.fertility * 0.05 + def.trade * 3;
  if (isSikh(f) && def.sites.some((x) => x.sikhSacred)) v *= 1.6;
  if (r === 'lahore' || r === 'amritsar') v *= 1.5;
  if (s.regions[r].desecrated.length && isSikh(f)) v *= 3;
  return v;
}

function aiArmies(s: GameState, f: FactionId) {
  let pers = FACTION_BY_ID[f]?.personality ?? { aggression: 0.5, caution: 0.5, zeal: 0.5, greed: 0.5, honour: 0.5 };
  // Once the Company has decided on war it prosecutes it without hesitation.
  if (f === 'company' && Object.values(s.factions).some((x) => x.alive && atWar(s, x.id, 'company'))) pers = { ...pers, caution: 0.2, aggression: 0.9 };
  const myRegions = new Set(regionsOf(s, f));
  const armies = armiesOf(s, f).sort((a, b) => armyMen(b) - armyMen(a));
  const claimed = new Set<string>();
  for (const a of armies) {
    if (a.withdrawTurn !== undefined) {
      if (s.turn >= a.withdrawTurn && a.home) {
        a.path = findPath(s, a, a.home, { ignorePeace: true }) ?? [];
        a.task = undefined;
        continue;
      }
    }
    if (a.path.length) continue;
    const power = armyPower(a);
    // Small detachments rejoin the main army instead of wandering into battle alone.
    const main = armies[0];
    if (power < 40 && !a.withdrawTurn && main && main.id !== a.id && armyPower(main) > power * 2) {
      const threatened = armiesIn(s, a.region).some((x) => atWar(s, x.owner, f));
      if (!threatened && main.region !== a.region) {
        const path = findPath(s, a, main.region);
        if (path && path.length <= 4) {
          a.path = path;
          continue;
        }
      }
      if (power < 12) continue;
    }
    // Threats to own land nearby.
    let best: { target: RegionId; score: number; stance: Army['stance']; task?: Army['task'] } | null = null;
    const reach = within(a.region, a.withdrawTurn !== undefined ? 3 : 2);
    for (const r of reach) {
      if (claimed.has(r)) continue;
      const st = s.regions[r];
      const enemyArmies = armiesIn(s, r).filter((x) => atWar(s, x.owner, f));
      const enemyPower = enemyArmies.reduce((t, x) => t + armyPower(x), 0);
      const dist = r === a.region ? 0 : neighbors(a.region).some((e) => e.to === r) ? 1 : 2;
      // Defend own region from an invader.
      if (myRegions.has(r) && enemyPower > 0) {
        const ratio = power / enemyPower;
        if (ratio > 0.8 + pers.caution * 0.4) {
          const score = 40 * ratio - dist * 5;
          if (!best || score > best.score) best = { target: r, score, stance: 'pitched' };
        } else if (isCavalryArmy(a) && isSikh(f)) {
          const score = 20 - dist * 4;
          if (!best || score > best.score) best = { target: r, score, stance: 'dhai_phat' };
        }
        continue;
      }
      // Beyond the Punjab, frontiers follow the historical timeline
      // (engine/history.ts): computer-run powers only fight there against you.
      if (!PUNJAB_REGION_IDS.has(r) && st.owner !== s.playerFaction && !enemyArmies.some((x) => x.owner === s.playerFaction)) continue;
      // The distant powers only defend, or answer you.
      if (FACTION_BY_ID[f]?.distant && st.owner !== s.playerFaction && !enemyArmies.some((x) => x.owner === s.playerFaction)) continue;
      // Subjugate land held by no great power.
      if (!st.owner && enemyArmies.length === 0 && f !== 'durrani' && a.withdrawTurn === undefined) {
        const def = (garrisonOf(s, r) / 100) * 4;
        const ratio = power / Math.max(1, def);
        if (ratio > 2) {
          const score = (regionValue(s, f, r) / 12) * (0.4 + pers.aggression) - dist * 6;
          if (!best || score > best.score) best = { target: r, score, stance: 'pitched', task: 'capture' };
        }
      }
      // Attack hostile land.
      if (st.owner && atWar(s, f, st.owner)) {
        const def = regionDefense(s, r, f);
        const ratio = power / Math.max(1, def);
        const need = 1.2 + pers.caution * 0.8;
        if (ratio >= need) {
          let score = (regionValue(s, f, r) / 10) * (0.5 + pers.aggression) * Math.min(3, ratio) - dist * 6;
          if (f === 'durrani' && a.withdrawTurn !== undefined) score += pers.greed * 20;
          const siegeUnits = a.units.some((u) => (UNIT_TYPES[u.type]?.siege ?? 0) >= 4);
          const stance: Army['stance'] = st.fort >= 3 && ratio < 3 && siegeUnits ? 'siege' : 'pitched';
          if (!best || score > best.score) best = { target: r, score, stance };
        } else if (isSikh(f) && isCavalryArmy(a) && enemyArmies.length && enemyPower > power && chance(s, 0.3 + pers.aggression * 0.3)) {
          // Harass the strong with Dhai Phat.
          const slow = enemyArmies.some((x) => x.units.some((u) => (UNIT_TYPES[u.type]?.speed ?? 3) <= 2));
          const score = (slow ? 18 : 8) - dist * 4;
          if (!best || score > best.score) best = { target: r, score, stance: enemyArmies.some((x) => x.baggage && x.baggage.captives > 0) ? 'night_raid' : 'dhai_phat' };
        } else if (isSikh(f) && ratio > 0.5 && pers.greed > 0.4 && enemyArmies.length === 0) {
          const score = 6 * pers.greed - dist * 3;
          if (!best || score > best.score) best = { target: r, score, stance: 'pitched', task: 'raid' };
        }
      }
    }
    if (best && best.score > 2) {
      claimed.add(best.target);
      if (best.target === a.region) {
        a.stance = best.stance;
        a.task = best.task;
      } else {
        const p = findPath(s, a, best.target);
        if (p) {
          a.path = p;
          a.stance = best.stance;
          a.task = best.task;
        }
      }
    } else if (!myRegions.has(a.region) && s.regions[a.region].owner && !atWar(s, f, s.regions[a.region].owner)) {
      // Stranded in someone else's land: go home.
      const home = [...myRegions][0];
      if (home) a.path = findPath(s, a, home) ?? [];
    }
  }
}

function aiDiplomacy(s: GameState, f: FactionId) {
  const fs = s.factions[f];
  const pers = FACTION_BY_ID[f]?.personality;
  if (!pers) return;
  const y = year(s);
  for (const g of Object.keys(fs.relations)) {
    const gs = s.factions[g];
    if (!gs?.alive || g === f) continue;
    const rel = fs.relations[g];
    // AI–AI peace when wars drag on.
    if (rel === 'war' && g !== s.playerFaction && f < g) {
      const bothSikh = isSikh(f) && isSikh(g);
      const p = bothSikh ? 0.12 : (f === 'durrani' || g === 'durrani') ? 0.0 : 0.04;
      if (chance(s, p * (0.5 + pers.honour))) {
        fs.relations[g] = 'peace';
        gs.relations[f] = 'peace';
      }
    }
    if (rel === 'truce' && chance(s, 0.25)) {
      fs.relations[g] = 'peace';
      gs.relations[f] = 'peace';
    }
  }
  // Expansion: after the Afghan tide recedes, misls turn on weaker neighbours —
  // fellow misls (at a Piri cost) and the small non-Sikh powers around them.
  const ambitious = isSikh(f) && (y >= 1790 ? 1.6 : 1) * (FACTION_BY_ID[f]?.mods.growth ?? 1);
  if (isSikh(f) && y >= 1765 && !s.josh.active) {
    const borders = new Set<string>();
    for (const r of regionsOf(s, f)) for (const e of neighbors(r)) if (PUNJAB_REGION_IDS.has(e.to)) borders.add(s.regions[e.to].owner ?? '');
    for (const g of borders) {
      if (!g || g === f || !s.factions[g]?.alive) continue;
      if (fs.relations[g] !== 'peace') continue;
      if (s.factions[g].flags.company_protection || g === 'company') continue;
      const sikhTarget = isSikh(g);
      if (sikhTarget && (mislPeaceInForce(s) || fs.sarkar === false && s.factions[g].sarkar)) continue;
      const ratio = fs.miri / Math.max(1, s.factions[g].miri);
      const attitude = fs.attitude[g] ?? 0;
      const base = sikhTarget ? 0.05 : 0.09;
      const p = pers.aggression * base * Math.min(2.5, ratio) * Number(ambitious) * (1 - pers.honour * (sikhTarget ? 0.5 : 0.2)) * (attitude < 0 ? 1.5 : attitude > 40 ? 0.3 : 1);
      if (ratio > (sikhTarget ? 1.15 : 1.4) && chance(s, p)) {
        fs.relations[g] = 'war';
        s.factions[g].relations[f] = 'war';
        fs.attitude[g] = (fs.attitude[g] ?? 0) - 30;
        s.factions[g].attitude[f] = (s.factions[g].attitude[f] ?? 0) - 40;
        if (sikhTarget) changePiri(s, f, -3, 'War on fellow Sikhs');
        break;
      }
    }
  }
}

/** The Company's patient encroachment: subsidiary alliances and lapse, one district at a time. */
export function companyTurn(s: GameState): void {
  const c = s.factions.company;
  if (!c?.alive || year(s) < 1805 || s.turn % 5 !== 2) return;
  const owned = new Set(regionsOf(s, 'company'));
  const cands: string[] = [];
  for (const r of owned)
    for (const e of neighbors(r)) {
      const st = s.regions[e.to];
      if (owned.has(e.to) || st.owner === s.playerFaction) continue;
      // Beyond the Punjab the Company advances by the historical timeline.
      if (!PUNJAB_REGION_IDS.has(e.to)) continue;
      // The Sutlej line holds unless there is war.
      if (e.river === 'sutlej' && !Object.values(s.factions).some((f) => f.alive && atWar(s, f.id, 'company'))) continue;
      const o = st.owner;
      const weakNonSikh = !o || ['hill_states', 'gurkha', 'maratha', 'mughal', 'bahawalpur', 'malerkotla', 'kangra'].includes(o);
      const protectedSikh = !!o && !!s.factions[o]?.flags.company_protection && year(s) >= 1830;
      if ((weakNonSikh || protectedSikh) && !armiesIn(s, e.to).some((a) => a.owner !== 'company')) cands.push(e.to);
    }
  if (!cands.length) return;
  const r = cands[Math.floor(rand(s) * cands.length)];
  transferRegion(s, r, 'company', 55);
  chronicle(s, 'treaty', `By treaty, lapse or subsidiary alliance, ${REGION_BY_ID[r].name} passed under the East India Company.`, { region: r, weight: 3 });
}

function aiRakhi(s: GameState, f: FactionId) {
  if (!isSikh(f) || s.factions[f].sarkar) return;
  const cands = new Set<string>();
  for (const a of armiesOf(s, f)) for (const e of neighbors(a.region)) cands.add(e.to);
  const list = [...cands].filter((r) => {
    const o = s.regions[r].owner;
    return o !== f && !s.regions[r].rakhi && (!o || !isSikh(o));
  });
  if (!list.length) return;
  if (rand(s) < 0.35) offerRakhi(s, f, list[Math.floor(rand(s) * list.length)]);
}

/** Run all AI factions for this turn's orders. */
export function runAI(s: GameState): void {
  const order = shuffle(
    s,
    Object.values(s.factions)
      .filter((f) => f.alive && f.id !== s.playerFaction)
      .map((f) => f.id),
  );
  for (const f of order) runAIFor(s, f);
}

export function runAIFor(s: GameState, f: FactionId): void {
  aiDiplomacy(s, f);
  aiReforms(s, f);
  aiVassals(s, f);
  assignLeaders(s, f);
  aiRecruit(s, f);
  mergeArmies(s, f);
  aiArmies(s, f);
  aiRakhi(s, f);
  for (const a of armiesOf(s, f)) if (!a.policy) a.policy = defaultPolicy(f);
}

