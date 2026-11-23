// Player actions. applyAction() is the only way the UI changes game state.
// It clones, applies, and returns either the new state or an error message.

import { FACTION_BY_ID } from '../data/factions';
import { REGION_BY_ID } from '../data/regions';
import { UNIT_TYPES, canRaise } from '../data/units';
import { addRecruits } from './ai';
import { chronicle } from './chronicle';
import { offerRakhi, rakhiChance } from './conquest';
import { recruitCost, recruitPool } from './economy';
import { contributeRebuild, takeVow } from './josh';
import { changePiri, updateMiri } from './miripiri';
import { findPath } from './movement';
import { armiesIn, armyMen, atWar, isSikh, mislPeaceInForce, polityName, year } from './query';
import { chance } from './rng';
import type { Army, GameState, Stance } from './state';
import { newId } from './state';
import { endTurn } from './turn';
import { breaksUnity, castVote, finishSarbat } from './sarbat';
import { courtAction, type CourtAction } from './court';
import { resolveEventChoice } from './events';

export type Action =
  | { type: 'move'; armyId: string; to: string }
  | { type: 'cancelMove'; armyId: string }
  | { type: 'setStance'; armyId: string; stance: Stance }
  | { type: 'setPolicy'; armyId: string; policy: Army['policy'] }
  | { type: 'setTask'; armyId: string; task: Army['task'] | null }
  | { type: 'recruit'; region: string; unit: string; men: number }
  | { type: 'split'; armyId: string }
  | { type: 'merge'; armyId: string; intoId: string }
  | { type: 'assignLeader'; armyId: string; leaderId: string | null }
  | { type: 'toggleLangar'; region: string }
  | { type: 'grantJagir'; region: string; leaderId: string }
  | { type: 'revokeJagir'; region: string }
  | { type: 'buildFort'; region: string }
  | { type: 'build'; region: string; kind: BuildingKind }
  | { type: 'declareWar'; target: string }
  | { type: 'proposePeace'; target: string }
  | { type: 'offerRakhi'; region: string }
  | { type: 'takeVow' }
  | { type: 'contributeRebuild'; amount: number }
  | { type: 'vote'; gurmataId: string; yes: boolean }
  | { type: 'propose'; kind: string; target?: string }
  | { type: 'eventChoice'; pendingId: string; choice: number }
  | { type: 'finishSarbat' }
  | { type: 'court'; act: CourtAction; target?: string }
  | { type: 'setConvenes'; on: boolean }
  | { type: 'endTurn' };

export type BuildingKind = 'gurdwara' | 'temple' | 'mosque' | 'sarai' | 'canal' | 'school' | 'bagh';

export const BUILDINGS: Record<BuildingKind, { name: string; cost: number; detail: string }> = {
  gurdwara: { name: 'Gurdwara', cost: 30, detail: 'Raise or restore a gurdwara. Piri and stability where Sikhs live.' },
  temple: { name: 'Mandir', cost: 25, detail: 'Patronise a Hindu temple. Stability and Piri through tolerance.' },
  mosque: { name: 'Masjid', cost: 25, detail: 'Repair a mosque or grant land to a khanqah. Stability and Piri through tolerance.' },
  sarai: { name: 'Sarai', cost: 20, detail: 'A rest-house for travellers: +15% trade.' },
  canal: { name: 'Canal', cost: 45, detail: 'Dig or repair a canal: +10% harvest, protection in famine.' },
  school: { name: 'Pathshala and maktab', cost: 25, detail: 'Schools for all communities: stability and administration.' },
  bagh: { name: 'Bagh', cost: 35, detail: 'A great garden, like the Hazuri Bagh at Lahore: prestige and Legend.' },
};

export function fortCost(s: GameState, region: string): number {
  const lvl = s.regions[region].fort;
  return Math.round(18 * (lvl + 1) * (FACTION_BY_ID[s.playerFaction]?.mods.fortCost ?? 1));
}

export interface Result {
  state: GameState;
  error?: string;
  info?: string;
}

export function applyAction(prev: GameState, action: Action): Result {
  if (action.type === 'endTurn') {
    if (prev.phase === 'ended') return { state: prev, error: 'The game has ended.' };
    return { state: endTurn(prev) };
  }
  const s = structuredClone(prev);
  const p = s.playerFaction;
  const fs = s.factions[p];
  const err = (e: string): Result => ({ state: prev, error: e });
  const ownArmy = (id: string) => {
    const a = s.armies[id];
    return a && a.owner === p ? a : undefined;
  };

  switch (action.type) {
    case 'move': {
      const a = ownArmy(action.armyId);
      if (!a) return err('No such army.');
      if (a.region === action.to) {
        a.path = [];
        return { state: s };
      }
      const target = s.regions[action.to];
      if (target.owner && target.owner !== p && !atWar(s, p, target.owner)) {
        const path = findPath(s, a, action.to);
        if (!path) return err(`${REGION_BY_ID[action.to].name} belongs to ${polityName(s, target.owner)}, with whom you are at peace. Declare war first, or find another road.`);
        a.path = path;
        return { state: s };
      }
      const path = findPath(s, a, action.to);
      if (!path) return err('There is no road your army may take there.');
      a.path = path;
      if (!target.owner && a.task !== 'raid') a.task = undefined;
      return { state: s };
    }
    case 'cancelMove': {
      const a = ownArmy(action.armyId);
      if (!a) return err('No such army.');
      a.path = [];
      return { state: s };
    }
    case 'setStance': {
      const a = ownArmy(action.armyId);
      if (!a) return err('No such army.');
      a.stance = action.stance;
      return { state: s };
    }
    case 'setPolicy': {
      const a = ownArmy(action.armyId);
      if (!a) return err('No such army.');
      a.policy = action.policy;
      return { state: s };
    }
    case 'setTask': {
      const a = ownArmy(action.armyId);
      if (!a) return err('No such army.');
      a.task = action.task ?? undefined;
      return { state: s };
    }
    case 'recruit': {
      const st = s.regions[action.region];
      if (st.owner !== p) return err('You can only raise men in your own lands.');
      if (st.control < 40) return err('Your hold on this region is too weak to raise men here.');
      const u = UNIT_TYPES[action.unit];
      if (!u || !canRaise(u, p, isSikh(p), fs.sarkar, year(s), fs.flags)) return err('You cannot raise that kind of troops.');
      const used = Number(fs.flags[`recruited_${action.region}_${s.turn}`] ?? 0);
      const pool = recruitPool(s, action.region, p).total - used;
      const men = Math.floor(action.men / 100) * 100;
      if (men <= 0) return err('Raise at least a hundred men.');
      if (men > pool) return err(`Only ${Math.max(0, pool)} men will answer the call here this season.`);
      const cost = recruitCost(s, p, action.unit, men);
      if (cost > fs.treasury) return err(`That would cost ${cost} thousand rupees; the treasury holds ${Math.floor(fs.treasury)}.`);
      fs.treasury -= cost;
      fs.flags[`recruited_${action.region}_${s.turn}`] = used + men;
      addRecruits(s, p, action.region, action.unit, men);
      updateMiri(s, p);
      return { state: s, info: `${men} ${u.name} raised at ${REGION_BY_ID[action.region].name}.` };
    }
    case 'split': {
      const a = ownArmy(action.armyId);
      if (!a) return err('No such army.');
      if (armyMen(a) < 200) return err('Too few men to divide.');
      const id = newId(s, 'A');
      const units = a.units.map((u) => {
        const half = Math.floor(u.men / 200) * 100;
        u.men -= half;
        return { ...u, men: half };
      });
      a.units = a.units.filter((u) => u.men > 0);
      s.armies[id] = { id, owner: p, region: a.region, units: units.filter((u) => u.men > 0), path: [], stance: a.stance, morale: a.morale, supply: a.supply, policy: a.policy, josh: a.josh };
      return { state: s };
    }
    case 'merge': {
      const a = ownArmy(action.armyId);
      const b = ownArmy(action.intoId);
      if (!a || !b || a.region !== b.region || a.id === b.id) return err('Armies must stand in the same region to join.');
      for (const u of a.units) {
        const st = b.units.find((x) => x.type === u.type);
        if (st) {
          st.xp = (st.xp * st.men + u.xp * u.men) / (st.men + u.men);
          st.men += u.men;
        } else b.units.push({ ...u });
      }
      b.morale = Math.round((b.morale + a.morale) / 2);
      if (!b.leader && a.leader) {
        b.leader = a.leader;
        s.leaders[a.leader].armyId = b.id;
      } else if (a.leader) s.leaders[a.leader].armyId = undefined;
      delete s.armies[a.id];
      return { state: s };
    }
    case 'assignLeader': {
      const a = ownArmy(action.armyId);
      if (!a) return err('No such army.');
      if (a.leader) s.leaders[a.leader].armyId = undefined;
      a.leader = undefined;
      if (action.leaderId) {
        const L = s.leaders[action.leaderId];
        if (!L || !L.alive || L.faction !== p) return err('That sardar is not in your service.');
        if (L.armyId && s.armies[L.armyId]) s.armies[L.armyId].leader = undefined;
        L.armyId = a.id;
        a.leader = L.id;
      }
      return { state: s };
    }
    case 'toggleLangar': {
      const st = s.regions[action.region];
      if (st.owner !== p) return err('You can only keep langar in your own lands.');
      st.langar = !st.langar;
      return { state: s };
    }
    case 'grantJagir': {
      const st = s.regions[action.region];
      const L = s.leaders[action.leaderId];
      if (st.owner !== p) return err('You can only grant your own lands.');
      if (!L || L.faction !== p || !L.alive) return err('That sardar is not in your service.');
      if (st.jagir) return err('This land is already held in jagir.');
      if (L.jagir) s.regions[L.jagir].jagir = undefined;
      st.jagir = L.id;
      L.jagir = action.region;
      L.loyalty = Math.min(100, L.loyalty + 15);
      return { state: s, info: `${L.name} now holds ${REGION_BY_ID[action.region].name} in jagir.` };
    }
    case 'revokeJagir': {
      const st = s.regions[action.region];
      if (st.owner !== p || !st.jagir) return err('No jagir to revoke here.');
      const L = s.leaders[st.jagir];
      if (L) {
        L.loyalty = Math.max(0, L.loyalty - 30);
        L.jagir = undefined;
      }
      st.jagir = undefined;
      if (isSikh(p)) changePiri(s, p, -1, 'Revoking a jagir');
      return { state: s };
    }
    case 'buildFort': {
      const st = s.regions[action.region];
      if (st.owner !== p) return err('You can only build in your own lands.');
      if (st.fort >= 5) return err('The fort cannot be made stronger.');
      const c = fortCost(s, action.region);
      if (fs.treasury < c) return err(`A stronger fort costs ${c} thousand rupees.`);
      fs.treasury -= c;
      st.fort += 1;
      return { state: s, info: `The walls of ${REGION_BY_ID[action.region].name} rise higher.` };
    }
    case 'build': {
      const st = s.regions[action.region];
      const b = BUILDINGS[action.kind];
      if (st.owner !== p) return err('You can only build in your own lands.');
      if (st.buildings.includes(action.kind)) return err(`There is already a ${b.name.toLowerCase()} under your patronage here.`);
      if (fs.treasury < b.cost) return err(`That costs ${b.cost} thousand rupees.`);
      fs.treasury -= b.cost;
      st.buildings.push(action.kind);
      const def = REGION_BY_ID[action.region];
      // Tolerance: patronage of every faith raises Piri, as it did for the Sarkar.
      if (action.kind === 'gurdwara') changePiri(s, p, 1 + def.faith.sikh / 40, `Raising a gurdwara at ${def.name}`);
      if (action.kind === 'temple') changePiri(s, p, 0.6 + def.faith.hindu / 60, `Patronage of a mandir at ${def.name}`);
      if (action.kind === 'mosque') changePiri(s, p, 0.6 + def.faith.muslim / 60, `Patronage of a masjid at ${def.name}`);
      if (action.kind === 'school') changePiri(s, p, 0.8, `Schools for all at ${def.name}`);
      if (action.kind === 'bagh') fs.legend += 2;
      if (action.kind === 'canal') changePiri(s, p, 0.5, `A canal for the farmers of ${def.name}`);
      chronicle(s, 'event', `${polityName(s, p)} built a ${b.name.toLowerCase()} at ${def.name}.`, { faction: p, region: action.region, weight: action.kind === 'gurdwara' || action.kind === 'mosque' || action.kind === 'temple' ? 2 : 1 });
      return { state: s, info: `${b.name} founded at ${def.name}.` };
    }
    case 'declareWar': {
      const t = action.target;
      if (!s.factions[t]?.alive || t === p) return err('No such power.');
      if (atWar(s, p, t)) return err('You are already at war.');
      fs.relations[t] = 'war';
      s.factions[t].relations[p] = 'war';
      s.factions[t].attitude[p] = (s.factions[t].attitude[p] ?? 0) - 40;
      if (isSikh(p) && isSikh(t)) {
        changePiri(s, p, s.josh.active ? -8 : -4, `War on ${polityName(s, t)}, fellow Sikhs`);
        if (mislPeaceInForce(s)) changePiri(s, p, -10, 'Breaking the gurmata against war between misls');
      }
      chronicle(s, 'event', `${polityName(s, p)} declared war on ${polityName(s, t)}.`, { faction: p, weight: 2 });
      return { state: s };
    }
    case 'proposePeace': {
      const t = action.target;
      if (!atWar(s, p, t)) return err('You are not at war with them.');
      if (t === 'durrani' && armiesIn(s, 'lahore').some((a) => a.owner === 'durrani')) return err('The Durrani king does not treat while his army is in the field.');
      const them = s.factions[t];
      const ratio = fs.miri / Math.max(1, them.miri);
      const pers = FACTION_BY_ID[t]?.personality;
      let pAccept = 0.25 + (ratio - 1) * 0.3 + (pers?.honour ?? 0.5) * 0.2 + ((them.attitude[p] ?? 0) / 200);
      if (isSikh(t) && isSikh(p)) pAccept += 0.25;
      pAccept = Math.max(0.05, Math.min(0.95, pAccept));
      if (chance(s, pAccept)) {
        if (breaksUnity(s, t)) changePiri(s, p, -6, 'Breaking the gurmata of unity');
        fs.relations[t] = 'peace';
        them.relations[p] = 'peace';
        chronicle(s, 'treaty', `${polityName(s, p)} made peace with ${polityName(s, t)}.`, { faction: p, weight: 2 });
        if (isSikh(t) && isSikh(p)) changePiri(s, p, 1.5, 'Making peace among the misls');
        return { state: s, info: `${polityName(s, t)} accepted peace.` };
      }
      them.attitude[p] = (them.attitude[p] ?? 0) - 5;
      return { state: s, info: `${polityName(s, t)} refused your envoys.` };
    }
    case 'offerRakhi': {
      const used = fs.flags[`rakhi_offer_${s.turn}`];
      if (used) return err('Your envoys have already gone out this season.');
      const pr = rakhiChance(s, p, action.region);
      if (pr <= 0) return err('Your riders are not near enough to offer protection there.');
      fs.flags[`rakhi_offer_${s.turn}`] = true;
      const ok = offerRakhi(s, p, action.region);
      return { state: s, info: ok ? `${REGION_BY_ID[action.region].name} accepts your rakhi.` : `The headmen of ${REGION_BY_ID[action.region].name} would not yet commit to your protection.` };
    }
    case 'takeVow':
      if (!takeVow(s)) return err('There is no vow to take now.');
      return { state: s };
    case 'contributeRebuild':
      if (!contributeRebuild(s, p, action.amount)) return err('Nothing to contribute to, or not enough in the treasury.');
      return { state: s };
    case 'vote':
      return castVote(s, action.gurmataId, action.yes) ? { state: s } : err('That vote cannot be cast.');
    case 'propose':
      return castVote(s, '', true, action.kind, action.target) ? { state: s } : err('That gurmata cannot be proposed now.');
    case 'finishSarbat': {
      const out = finishSarbat(s);
      return { state: s, info: out.join(' ') || undefined };
    }
    case 'court': {
      const r = courtAction(s, action.act, action.target);
      return r ? { state: s, info: r } : err('That cannot be done at court this season.');
    }
    case 'setConvenes': {
      if (!fs.sarkar) return err('Only the Sarkar decides whether to call the Sarbat Khalsa.');
      if (fs.convenesSarbat === action.on) return { state: s };
      fs.convenesSarbat = action.on;
      changePiri(s, p, action.on ? 3 : -4, action.on ? 'Calling the Sarbat Khalsa again' : 'Letting the Sarbat Khalsa lapse');
      return { state: s };
    }
    case 'eventChoice': {
      const r = resolveEventChoice(s, action.pendingId, action.choice);
      return r ? { state: s, info: r } : err('That choice is not available.');
    }
  }
  return err('Unknown action.');
}
