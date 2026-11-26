import type { Ask, Venture } from '../data/abroad';
import { struggleAct, type Power, type StruggleAct } from './struggle';
import { foundUnion, joinChance, joinUnion, leaveUnion, sendAid, unionOf } from './unions';
import { annex, makeVassal, overlordOf, release, submissionChance } from './vassals';
import { beginReform, factionMods, hasReform } from './reforms';
import { canRideOn } from './endings';
import { canUnify, proclaimEmpire } from './unify';
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
import type { FactionId, Army, GameState, Stance } from './state';
import { newId } from './state';
import { endTurn } from './turn';
import { breaksUnity, castVote, finishSarbat } from './sarbat';
import { courtAction, type CourtAction } from './court';
import { diplomacy, type DiploKind } from './diplomacy';
import { resolveEventChoice } from './events';

export type Action =
  | { type: 'move'; armyId: string; to: string }
  | { type: 'cancelMove'; armyId: string }
  | { type: 'setStance'; armyId: string; stance: Stance }
  | { type: 'setPolicy'; armyId: string; policy: Army['policy'] }
  | { type: 'setTask'; armyId: string; task: Army['task'] | null }
  | { type: 'recruit'; region: string; unit: string; men: number }
  | { type: 'split'; armyId: string; fraction?: number }
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
  | { type: 'proclaimEmpire' }
  | { type: 'rideOn' }
  | { type: 'struggle'; act: StruggleAct; region?: string; power?: Power; ask?: Ask; venture?: Venture }
  | { type: 'foundUnion'; name: string }
  | { type: 'inviteUnion'; target: string }
  | { type: 'leaveUnion' }
  | { type: 'sendAid'; target: string; amount: number }
  | { type: 'demandSubmission'; target: string }
  | { type: 'setVassalTribute'; target: string; level: 'light' | 'normal' | 'heavy' }
  | { type: 'releaseVassal'; target: string }
  | { type: 'annexVassal'; target: string }
  | { type: 'setTax'; region: string; tax: 'light' | 'normal' | 'heavy' }
  | { type: 'growTown'; region: string }
  | { type: 'beginReform'; id: string }
  | { type: 'eventChoice'; pendingId: string; choice: number }
  | { type: 'finishSarbat' }
  | { type: 'court'; act: CourtAction; target?: string }
  | { type: 'setConvenes'; on: boolean }
  | { type: 'diplo'; kind: DiploKind; target: string }
  | { type: 'endTurn' };

export type BuildingKind = 'gurdwara' | 'temple' | 'mosque' | 'sarai' | 'canal' | 'school' | 'bagh' | 'road' | 'mandi';

export const BUILDINGS: Record<BuildingKind, { name: string; cost: number; detail: string }> = {
  gurdwara: { name: 'Gurdwara', cost: 30, detail: 'Raise or restore a gurdwara. Piri and stability where Sikhs live.' },
  temple: { name: 'Mandir', cost: 25, detail: 'Patronise a Hindu temple. Stability and Piri through tolerance.' },
  mosque: { name: 'Masjid', cost: 25, detail: 'Repair a mosque or grant land to a khanqah. Stability and Piri through tolerance.' },
  sarai: { name: 'Sarai', cost: 20, detail: 'A rest-house for travellers: +15% trade.' },
  canal: { name: 'Canal', cost: 45, detail: 'Dig or repair a canal: +10% harvest, protection in famine.' },
  school: { name: 'Pathshala and maktab', cost: 25, detail: 'Schools for all communities: stability and administration.' },
  bagh: { name: 'Bagh', cost: 35, detail: 'A great garden, like the Hazuri Bagh at Lahore: prestige and Legend.' },
  road: { name: 'Pakki sarak', cost: 30, detail: 'A metalled road through the district: +10% trade, and armies march in faster.' },
  mandi: { name: 'Mandi', cost: 35, detail: 'A grain and cloth market with its own ganj: +20% trade.' },
};

/** What a building costs this house (reforms make some cheaper). */
export function buildingCost(s: GameState, f: FactionId, kind: BuildingKind): number {
  let c = BUILDINGS[kind].cost;
  if (kind === 'canal' && hasReform(s, f, 'canal_works')) c *= 0.6;
  if (kind === 'road' && hasReform(s, f, 'grand_road')) c *= 0.5;
  return Math.round(c);
}

export const TOWN_NAMES = ['Village', 'Qasba', 'Town', 'City', 'Great city'];
/** What it costs to grow a region's town to the next level. */
export const townCost = (s: GameState, region: string) => 40 * ((s.regions[region].town ?? 0) + 1) ** 1.4;

export function fortCost(s: GameState, region: string): number {
  const lvl = s.regions[region].fort;
  return Math.round(18 * (lvl + 1) * (factionMods(s, s.playerFaction).fortCost ?? 1));
}

export interface Result {
  state: GameState;
  error?: string;
  info?: string;
}

export function applyAction(prev: GameState, action: Action): Result {
  if (action.type === 'rideOn') {
    if (prev.phase !== 'ended' || !canRideOn(prev)) return { state: prev, error: 'There is no road onward from here.' };
    const s = structuredClone(prev);
    s.phase = 'orders';
    s.beyond = true;
    chronicle(s, 'event', 'The century closed, and the story did not. The riders went on into years no dhadi had sung.', { faction: s.playerFaction, weight: 4 });
    return { state: s };
  }
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
      // In a union partner's land you may raise men too, at a higher price.
      const partner = !!st.owner && st.owner !== p && !!unionOf(s, p)?.members.includes(st.owner);
      if (st.owner !== p && !partner) return err('You can only raise men in your own lands, or a union partner’s.');
      if (st.control < 40) return err('Your hold on this region is too weak to raise men here.');
      const u = UNIT_TYPES[action.unit];
      if (!u || !canRaise(u, p, isSikh(p), fs.sarkar, year(s), fs.flags)) return err('You cannot raise that kind of troops.');
      const used = Number(fs.flags[`recruited_${action.region}_${s.turn}`] ?? 0);
      const pool = recruitPool(s, action.region, p).total - used;
      const men = Math.floor(action.men / 100) * 100;
      if (men <= 0) return err('Raise at least a hundred men.');
      if (men > pool) return err(`Only ${Math.max(0, pool)} men will answer the call here this season.`);
      const cost = Math.round(recruitCost(s, p, action.unit, men) * (partner ? 1.25 : 1) * 10) / 10;
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
      // Detach a share of every unit (half by default), in hundreds.
      const f = Math.max(0.1, Math.min(0.9, action.fraction ?? 0.5));
      const units = a.units.map((u) => {
        const half = Math.floor((u.men * f) / 100) * 100;
        u.men -= half;
        return { ...u, men: half };
      });
      a.units = a.units.filter((u) => u.men > 0);
      if (!units.some((u) => u.men > 0)) return err('Too few men to divide.');
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
      const bc = buildingCost(s, p, action.kind);
      if (fs.treasury < bc) return err(`That costs ${bc} thousand rupees.`);
      fs.treasury -= bc;
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
    case 'struggle': {
      const r = struggleAct(s, action.act, action.region, action.power, action.ask, action.venture);
      return r ? { state: s, info: r } : err('That cannot be done now.');
    }
    case 'foundUnion': {
      const u = foundUnion(s, p, action.name);
      return u ? { state: s, info: `The ${u.name} is founded. Invite others to join it.` } : err('You already belong to a union.');
    }
    case 'inviteUnion': {
      const u = unionOf(s, p);
      if (!u) return err('Found a union first.');
      if (fs.flags[`diplo_${action.target}_${s.turn}`]) return err('Your envoys have already been there this season.');
      const pr = joinChance(s, action.target);
      if (pr <= 0) return err('They will not hear of it.');
      fs.flags[`diplo_${action.target}_${s.turn}`] = true;
      if (chance(s, pr)) {
        joinUnion(s, u, action.target);
        return { state: s, info: `${polityName(s, action.target)} joins the ${u.name}.` };
      }
      return { state: s, info: `${polityName(s, action.target)} declined to join the ${u.name}.` };
    }
    case 'leaveUnion': {
      if (!unionOf(s, p)) return err('You are in no union.');
      if (unionOf(s, p)?.id === 'dal_khalsa') changePiri(s, p, -5, 'Leaving the Dal Khalsa');
      leaveUnion(s, p);
      return { state: s, info: 'You have left the union.' };
    }
    case 'sendAid': {
      const r = sendAid(s, action.target, action.amount);
      return r ? { state: s, info: r } : err('You cannot send that.');
    }
    case 'demandSubmission': {
      const t = action.target;
      if (fs.flags[`diplo_${t}_${s.turn}`]) return err('Your envoys have already been there this season.');
      const pr = submissionChance(s, t);
      if (pr <= 0) return err('They are not weak enough to bow to you.');
      fs.flags[`diplo_${t}_${s.turn}`] = true;
      if (chance(s, pr)) {
        if (atWar(s, p, t)) {
          s.factions[t].relations[p] = 'peace';
          fs.relations[t] = 'peace';
        }
        makeVassal(s, p, t);
        return { state: s, info: `${polityName(s, t)} has submitted. It will pay you tribute and ride with you.` };
      }
      s.factions[t].attitude[p] = Math.max(-100, (s.factions[t].attitude[p] ?? 0) - 15);
      return { state: s, info: `${polityName(s, t)} refused to bow.` };
    }
    case 'setVassalTribute': {
      if (overlordOf(s, action.target) !== p) return err('They are not your tributary.');
      s.factions[action.target].flags.tribute_level = action.level;
      return { state: s };
    }
    case 'releaseVassal': {
      if (overlordOf(s, action.target) !== p) return err('They are not your tributary.');
      release(s, action.target);
      return { state: s, info: `${polityName(s, action.target)} is free again, and grateful.` };
    }
    case 'annexVassal': {
      const r = annex(s, action.target);
      return r ? { state: s, info: r } : err('You cannot annex them yet.');
    }
    case 'setTax': {
      const st = s.regions[action.region];
      if (st.owner !== p) return err('You can only tax your own lands.');
      st.tax = action.tax;
      return { state: s };
    }
    case 'growTown': {
      const st = s.regions[action.region];
      if (st.owner !== p) return err('You can only build up your own lands.');
      const lvl = st.town ?? 0;
      if (lvl >= 4) return err('This is already a great city.');
      if (st.control < 50 + lvl * 10) return err(`Your hold here is too weak (control ${50 + lvl * 10} needed).`);
      const c = Math.round(townCost(s, action.region));
      if (fs.treasury < c) return err(`That costs ${c} thousand rupees.`);
      fs.treasury -= c;
      st.town = lvl + 1;
      const def = REGION_BY_ID[action.region];
      chronicle(s, 'event', `${def.name} grew into a ${TOWN_NAMES[lvl + 1].toLowerCase()} under ${polityName(s, p)}.`, { faction: p, region: action.region, weight: lvl + 1 >= 3 ? 3 : 1 });
      if (lvl + 1 >= 3) fs.legend += 1;
      return { state: s };
    }
    case 'beginReform': {
      const r = beginReform(s, p, action.id);
      return r ? { state: s, info: r } : err('That reform cannot be begun now.');
    }
    case 'proclaimEmpire': {
      if (!canUnify(s, p, 'proclamation')) return err('You cannot yet unify the Punjab: see what is still needed.');
      return { state: s, info: proclaimEmpire(s, p, 'proclamation') };
    }
    case 'propose':
      return castVote(s, '', true, action.kind, action.target) ? { state: s } : err('That gurmata cannot be proposed now.');
    case 'finishSarbat': {
      const out = finishSarbat(s);
      return { state: s, info: out.join(' ') || undefined };
    }
    case 'diplo': {
      const r = diplomacy(s, action.kind, action.target);
      return r ? { state: s, info: r.text } : err('Your envoys cannot be sent on that errand now.');
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
