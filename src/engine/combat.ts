import { factionMods } from './reforms';
// Battles and sieges.
//
// Combat is auto-resolved over 3–5 rounds after the commander picks a stance.
// Historically motivated rules:
//  * Dhai Phat ("two and a half strikes"): the misl horse struck, wheeled away and
//    struck again, wearing down slow armies without risking a decisive defeat.
//  * Ambush needs cover: jungle, riverine bela, hills or mountains.
//  * Night raids on a returning invader's baggage train could free captives — as the
//    Khalsa did after Panipat in 1761 — which the Panth honoured greatly.
//  * Nihang jathas and armies under Josh do not rout.
//  * A commander with low loyalty in a brittle polity may hold back or betray in the
//    field. This is how Mudki, Ferozeshah and Sobraon can repeat — or be averted.

import { REGION_BY_ID } from '../data/regions';
import { UNIT_TYPES, type UnitType } from '../data/units';
import { battleLine } from '../narrative/dhadi';
import { balanceOf, piriMoraleBonus } from './miripiri';
import { armyMen, armySpeed, clamp, date, hasTrait, isCavalryArmy, isSikh } from './query';
import { rand, randRange } from './rng';
import type { Army, BattleReport, BattleRound, FactionId, GameState, RegionId, Stance } from './state';
import { newId } from './state';

export const STANCES: Record<Stance, { name: string; gurmukhi?: string; detail: string }> = {
  dhai_phat: {
    name: 'Dhai Phat',
    detail: 'Two and a half strikes: hit, wheel away, hit again, and vanish. Strong for horse against slow armies; avoids decisive defeat but cannot take ground.',
  },
  ambush: { name: 'Ambush', detail: 'Strike from cover in jungle, bela or hills. A crushing first blow; weak in open country.' },
  pitched: { name: 'Pitched Battle', detail: 'Stand and fight to decide the field. Victory takes ground; defeat can be ruinous.' },
  siege: { name: 'Siege', detail: 'Invest a fort and starve or batter it over several turns.' },
  hold: { name: 'Hold the Fort', detail: 'Defend from walls. Strong defence; you may be besieged.' },
  night_raid: { name: 'Night Raid', detail: 'Strike an enemy camp or baggage train by night. Can free captives and recover plunder.' },
};

const COVER = new Set(['jungle', 'bela', 'hills', 'mountain']);

export interface Side {
  faction: FactionId;
  armies: Army[];
  /** Implicit garrison (men of piyada-like levy) when defending a town. */
  garrison?: number;
  stance: Stance;
}

interface SideCalc {
  atk: number;
  def: number;
  men: number;
  morale: number;
  noRetreat: boolean;
  speed: number;
  mods: { label: string; value: string }[];
}

function unitAttack(s: GameState, a: Army, u: UnitType, region: RegionId, defending: boolean): number {
  let atk = u.attack;
  const mods = factionMods(s, a.owner) ?? {};
  const terr = REGION_BY_ID[region].terrain;
  const d = date(s);
  if (u.cls === 'cavalry') {
    atk *= mods.cavalryAttack ?? 1;
    if (hasTrait(s, a.leader, 'cavalry_master')) atk *= 1.2;
    if ((terr === 'hills' || terr === 'mountain' || terr === 'jungle') && !hasTrait(s, a.leader, 'mountain_warrior')) atk *= 0.7;
    if (d.monsoon) atk *= 0.85;
  }
  if (u.cls === 'artillery') {
    atk *= mods.artillery ?? 1;
    if (hasTrait(s, a.leader, 'artillerist')) atk *= 1.3;
  }
  if (u.id.startsWith('fauj') && hasTrait(s, a.leader, 'drillmaster')) atk *= 1.2;
  if (u.skirmisher && defending && COVER.has(terr)) atk *= 1.2;
  if (hasTrait(s, a.leader, 'reckless')) atk *= 1.1;
  if (a.josh && a.josh > 0) atk *= 1.25;
  return atk;
}

function calcSide(s: GameState, side: Side, region: RegionId, defending: boolean, fortLevel: number): SideCalc {
  let atk = 0,
    def = 0,
    men = 0,
    moraleW = 0,
    noRetreatMen = 0;
  const mods: { label: string; value: string }[] = [];
  let speed = Infinity;
  for (const a of side.armies) {
    speed = Math.min(speed, armySpeed(a));
    for (const st of a.units) {
      if (st.men <= 0) continue;
      const u = UNIT_TYPES[st.type];
      const k = st.men / 100;
      const xp = 1 + st.xp * 0.3;
      atk += unitAttack(s, a, u, region, defending) * k * xp;
      let d = u.defense;
      if (u.id.startsWith('fauj') && hasTrait(s, a.leader, 'drillmaster')) d *= 1.2;
      if (hasTrait(s, a.leader, 'old_guard')) d *= 1.1;
      def += d * k * xp;
      men += st.men;
      moraleW += u.morale * st.men;
      if (u.noRetreat) noRetreatMen += st.men;
    }
  }
  if (side.garrison && side.garrison > 0) {
    const k = side.garrison / 100;
    atk += 1.5 * k;
    def += 2.5 * k;
    men += side.garrison;
    moraleW += 5 * side.garrison;
    speed = Math.min(speed, 2);
  }
  // Morale: average of armies' current morale, scaled by troop quality.
  const quality = men ? moraleW / men / 6 : 1;
  const cur = side.armies.length ? side.armies.reduce((t, a) => t + a.morale * armyMen(a), 0) / Math.max(1, side.armies.reduce((t, a) => t + armyMen(a), 0)) : 70;
  let morale = cur * (0.7 + 0.3 * quality);
  const fmod = factionMods(s, side.faction).morale ?? 1;
  morale *= fmod;
  const pm = piriMoraleBonus(s, side.faction);
  morale += pm;
  if (pm) mods.push({ label: 'Piri', value: `${pm > 0 ? '+' : ''}${pm.toFixed(0)} morale` });
  if (fmod !== 1) mods.push({ label: 'Misl spirit', value: `×${fmod}` });
  const leaderMods = side.armies.map((a) => a.leader).filter(Boolean) as string[];
  for (const l of leaderMods) {
    const L = s.leaders[l];
    if (!L) continue;
    atk *= 1 + (L.martial - 3) * 0.05;
    if (L.traits.includes('zealous')) morale += 8;
    if (L.traits.includes('beloved')) morale += 5;
    mods.push({ label: L.name, value: `martial ${L.martial}` });
  }
  const josh = side.armies.some((a) => (a.josh ?? 0) > 0);
  if (josh) {
    morale += 30;
    mods.push({ label: 'Josh', value: '+30 morale, +25% attack, no rout' });
  }
  if (defending && fortLevel > 0 && (side.stance === 'hold' || side.garrison)) {
    let fortMult = 1 + 0.3 * fortLevel;
    if (factionMods(s, side.faction).fortDefense) fortMult *= factionMods(s, side.faction).fortDefense!;
    if (side.armies.some((a) => hasTrait(s, a.leader, 'fort_builder'))) fortMult += 0.3;
    def *= fortMult;
    mods.push({ label: `Walls (fort ${fortLevel})`, value: `×${fortMult.toFixed(2)} defence` });
  }
  return { atk, def, men, morale: clamp(morale, 5, 130), noRetreat: josh || noRetreatMen > men * 0.5, speed: speed === Infinity ? 2 : speed, mods };
}

function applyLosses(side: Side, lost: number) {
  let total = side.armies.reduce((t, a) => t + armyMen(a), 0) + (side.garrison ?? 0);
  if (total <= 0) return;
  let remaining = Math.min(lost, total);
  if (side.garrison) {
    const g = Math.round((remaining * side.garrison) / total);
    side.garrison -= g;
    remaining -= g;
    total -= side.garrison + g;
  }
  for (const a of side.armies) {
    for (const st of a.units) {
      const exposure = UNIT_TYPES[st.type]?.cls === 'artillery' ? 0.6 : 1;
      const share = Math.min(st.men, Math.round(((remaining * st.men) / Math.max(1, total)) * exposure));
      st.men -= share;
    }
    a.units = a.units.filter((u) => u.men > 0);
  }
}

export interface BattleOptions {
  region: RegionId;
  attacker: Side;
  defender: Side;
  fortLevel: number;
  assault?: boolean;
}

/** Resolve a battle. Mutates armies (losses, morale) and returns a report. */
export function resolveBattle(s: GameState, o: BattleOptions): BattleReport {
  const { region, attacker: A, defender: D } = o;
  const terr = REGION_BY_ID[region].terrain;
  const notes: string[] = [];
  const a = calcSide(s, A, region, false, 0);
  const d = calcSide(s, D, region, true, o.fortLevel);
  const modifiers = [...a.mods.map((m) => ({ label: `Attacker · ${m.label}`, value: m.value })), ...D.armies.length || D.garrison ? d.mods.map((m) => ({ label: `Defender · ${m.label}`, value: m.value })) : []];
  const aMen0 = a.men,
    dMen0 = d.men;
  let aMorale = a.morale,
    dMorale = d.morale;
  let aAtk = a.atk,
    dAtk = d.atk;

  // Stance effects.
  let rounds = 5;
  let aMult: number[] = [1, 1, 1, 1, 1];
  let dMult: number[] = [1, 1, 1, 1, 1];
  let aLossMult = 1,
    dLossMult = 1;
  let decisive = true;
  const aCav = A.armies.length > 0 && A.armies.every(isCavalryArmy);
  const dCav = D.armies.length > 0 && D.armies.every(isCavalryArmy);
  const guerrilla = (side: Side) => side.armies.some((x) => hasTrait(s, x.leader, 'guerrilla'));

  if (A.stance === 'dhai_phat') {
    const speedEdge = clamp((a.speed - d.speed) * 0.15, 0, 0.45);
    const g = guerrilla(A) ? 0.25 : 0;
    if (aCav) {
      aMult = [1.4 + speedEdge + g, 1.2 + speedEdge + g, 0.6, 0, 0];
      dMult = [0.6, 0.5, 0.3, 0, 0];
      aLossMult = 0.6;
      rounds = 3;
      decisive = false;
      modifiers.push({ label: 'Dhai Phat', value: `hit-and-run, +${Math.round((speedEdge + g) * 100)}% from speed and skill` });
    } else {
      notes.push('Dhai Phat needs an army of horse; the foot could not keep pace.');
      aMult = aMult.map(() => 0.85);
    }
  } else if (A.stance === 'ambush') {
    if (COVER.has(terr)) {
      const g = guerrilla(A) ? 0.4 : 0;
      aMult = [2.0 + g, 1.1, 1, 1, 1];
      dMorale -= 15;
      modifiers.push({ label: 'Ambush from cover', value: `×${(2 + g).toFixed(1)} first strike, −15 enemy morale` });
    } else {
      aMult = aMult.map(() => 0.85);
      notes.push(`There was no cover for an ambush in the open ${terr}.`);
      modifiers.push({ label: 'Ambush without cover', value: '×0.85' });
    }
  } else if (A.stance === 'night_raid') {
    aMult = [1.5, 0.8, 0, 0, 0];
    dMult = [0.5, 0.7, 0, 0, 0];
    rounds = 2;
    decisive = false;
    aLossMult = 0.7;
    modifiers.push({ label: 'Night raid', value: 'surprise, then withdraw' });
  } else if (o.assault) {
    aMult = aMult.map(() => 0.8);
    modifiers.push({ label: 'Storming the walls', value: '×0.8 attack' });
  }
  if (D.stance === 'dhai_phat' && dCav && !o.fortLevel) {
    dLossMult = 0.6;
    decisive = false;
    modifiers.push({ label: 'Defender skirmishes (Dhai Phat)', value: 'fewer losses, gives ground' });
  }
  if (D.stance === 'ambush' && COVER.has(terr)) {
    dMult[0] = 1.6;
    modifiers.push({ label: 'Defenders ambush from cover', value: '×1.6 first strike' });
  }
  if (hasTrait(s, A.armies[0]?.leader, 'cautious')) aLossMult *= 0.85;
  if (hasTrait(s, D.armies[0]?.leader, 'cautious')) dLossMult *= 0.85;

  // Treachery / holding back by disloyal commanders in a brittle polity.
  let betrayal: string | undefined;
  const checkTreachery = (side: Side, which: 'A' | 'D') => {
    // Local garrisons of unowned lands belong to no house.
    if (!s.factions[side.faction]) return;
    const bal = balanceOf(s, side.faction);
    const crisis = !!s.factions[side.faction]?.flags.court_crisis;
    if (bal.state !== 'brittle' && bal.state !== 'very_brittle' && !crisis) return;
    for (const army of side.armies) {
      const L = army.leader ? s.leaders[army.leader] : undefined;
      if (!L || L.loyalty >= 40) continue;
      const p = ((40 - L.loyalty) / 100) * (bal.state === 'very_brittle' || crisis ? 1.6 : 1) * (L.traits.includes('schemer') ? 1.6 : 1);
      if (rand(s) < p) {
        const share = armyMen(army) / Math.max(1, which === 'A' ? a.men : d.men);
        if (which === 'A') {
          aAtk *= 1 - share;
          aMorale -= 20;
        } else {
          dAtk *= 1 - share;
          dMorale -= 20;
        }
        betrayal = `${L.name} held back his troops and left the field to its fate.`;
        if (L.female) betrayal = `${L.name} held back her troops and left the field to its fate.`;
        notes.push(betrayal);
        return;
      }
    }
  };
  checkTreachery(A, 'A');
  checkTreachery(D, 'D');

  const log: BattleRound[] = [];
  let aMen = a.men,
    dMen = d.men;
  let winner: BattleReport['winner'] = 'none';
  const K = 4;
  for (let r = 0; r < rounds; r++) {
    if (aMult[r] === 0 && dMult[r] === 0) break;
    const aAvgDef = d.def / Math.max(1, dMen0 / 100);
    const dAvgDef = a.def / Math.max(1, aMen0 / 100);
    const aMoraleF = 0.5 + aMorale / 200;
    const dMoraleF = 0.5 + dMorale / 200;
    const aShare = aMen / Math.max(1, aMen0);
    const dShare = dMen / Math.max(1, dMen0);
    const dLoss = Math.round(K * aAtk * aShare * aMult[r] * aMoraleF * randRange(s, 0.85, 1.15) * (1 / (1 + aAvgDef / 3)) * dLossMult);
    const aLoss = Math.round(K * dAtk * dShare * dMult[r] * dMoraleF * randRange(s, 0.85, 1.15) * (1 / (1 + dAvgDef / 3)) * aLossMult);
    const dl = Math.min(dMen, dLoss);
    const al = Math.min(aMen, aLoss);
    dMen -= dl;
    aMen -= al;
    aMorale -= (al / Math.max(1, aMen0)) * 100 * 1.6 - (dl > al ? 3 : 0);
    dMorale -= (dl / Math.max(1, dMen0)) * 100 * 1.6 - (al > dl ? 3 : 0);
    aMorale = clamp(aMorale, 0, 130);
    dMorale = clamp(dMorale, 0, 130);
    log.push({ aLoss: al, dLoss: dl, aMorale: Math.round(aMorale), dMorale: Math.round(dMorale), line: battleLine(s, r, al, dl, A, D, region) });
    const aRout = (aMorale < 25 && !a.noRetreat) || aMen <= 0;
    const dRout = (dMorale < 25 && !d.noRetreat) || dMen <= 0;
    if (aRout || dRout) {
      winner = aRout && dRout ? (aMorale >= dMorale ? 'attacker' : 'defender') : aRout ? 'defender' : 'attacker';
      // The routed side loses more in the pursuit, unless they were horse who scatter well.
      if (winner === 'attacker') {
        const pursuit = Math.round(dMen * (dCav ? 0.08 : 0.18));
        dMen -= pursuit;
      } else {
        const pursuit = Math.round(aMen * (aCav ? 0.08 : 0.18));
        aMen -= pursuit;
      }
      break;
    }
  }
  if (winner === 'none' && decisive) {
    const aScore = aMorale * (aMen / Math.max(1, aMen0));
    const dScore = dMorale * (dMen / Math.max(1, dMen0)) * (o.fortLevel ? 1.15 : 1);
    winner = aScore > dScore ? 'attacker' : 'defender';
  }
  if (!decisive && winner === 'none') {
    notes.push('Neither side held the field; the horse rode off into the dust.');
  }

  const aLosses = aMen0 - aMen;
  const dLosses = dMen0 - dMen;
  applyLosses(A, aLosses);
  applyLosses(D, dLosses);
  for (const x of A.armies) {
    x.morale = clamp(Math.round(aMorale), 5, 100);
    for (const u of x.units) u.xp = clamp(u.xp + 0.05, 0, 1);
  }
  for (const x of D.armies) {
    x.morale = clamp(Math.round(dMorale), 5, 100);
    for (const u of x.units) u.xp = clamp(u.xp + 0.05, 0, 1);
  }

  // Night raids on a baggage train free captives and recover plunder.
  let captivesFreed: number | undefined;
  if (A.stance === 'night_raid') {
    for (const x of D.armies) {
      if (!x.baggage) continue;
      const frac = clamp(dLosses / Math.max(1, dMen0) * 4, 0.15, 0.9);
      const freed = Math.round(x.baggage.captives * frac);
      const loot = Math.round(x.baggage.plunder * frac * 10) / 10;
      x.baggage.captives -= freed;
      x.baggage.plunder -= loot;
      captivesFreed = (captivesFreed ?? 0) + freed;
      s.factions[A.faction].treasury += loot;
      if (freed) notes.push(`${freed.toLocaleString()} captives were freed from the baggage train and set on the road home.`);
    }
  }

  const report: BattleReport = {
    id: newId(s, 'B'),
    turn: s.turn,
    region,
    attacker: A.faction,
    defender: D.faction,
    attackerLeader: A.armies.find((x) => x.leader)?.leader,
    defenderLeader: D.armies.find((x) => x.leader)?.leader,
    stance: A.stance,
    defStance: D.stance,
    aMen: aMen0,
    dMen: dMen0,
    rounds: log,
    winner,
    aLosses,
    dLosses,
    notes,
    modifiers,
    betrayal,
    captivesFreed,
  };
  return report;
}

/** Garrison of a town with no field army: walls plus militia. */
export function garrisonOf(s: GameState, region: RegionId): number {
  const st = s.regions[region];
  if (!st.owner) return Math.round(REGION_BY_ID[region].population * 1.5);
  return Math.round(st.fort * 250 + REGION_BY_ID[region].population * 2);
}

/** Progress a siege by one turn. Returns progress gained. */
export function siegeProgress(s: GameState, besiegers: Army[], region: RegionId): { gain: number; parts: { label: string; value: number }[] } {
  const st = s.regions[region];
  const fort = Math.max(1, st.fort);
  let siegePts = 0;
  let men = 0;
  for (const a of besiegers) {
    const mods = factionMods(s, a.owner) ?? {};
    for (const u of a.units) {
      let sp = (UNIT_TYPES[u.type]?.siege ?? 0) * (u.men / 100);
      if (UNIT_TYPES[u.type]?.cls === 'artillery' && hasTrait(s, a.leader, 'artillerist')) sp *= 1.3;
      sp *= mods.siege ?? 1;
      siegePts += sp;
      men += u.men;
    }
    if (hasTrait(s, a.leader, 'fort_builder')) siegePts *= 1.25;
  }
  const defMult = st.owner ? factionMods(s, st.owner).fortDefense ?? 1 : 1;
  const battering = (siegePts / (Math.pow(fort, 1.5) * 12 * defMult)) * 100;
  const garrison = garrisonOf(s, region);
  const blockade = (14 * clamp(men / Math.max(1, garrison * 2), 0, 1.5)) / Math.sqrt(fort);
  const famine = date(s).monsoon ? 0 : 3; // stores run low in the cold season
  const parts = [
    { label: 'Guns and battering', value: Math.round(battering) },
    { label: 'Blockade and hunger', value: Math.round(blockade) },
    { label: 'Season', value: famine },
  ];
  const gain = clamp(Math.round(battering + blockade + famine + randRange(s, -3, 3)), 1, 100);
  return { gain, parts };
}

export function isHostileToShrines(f: FactionId): boolean {
  return !isSikh(f);
}
