// Leaders: ageing, death, succession, historical arrivals and generated sardars.

import { FACTION_BY_ID } from '../data/factions';
import { GIVEN_NAMES, GIVEN_NAMES_F, LEADERS, LEADER_BY_ID, VILLAGE_NAMES, type TraitId } from '../data/leaders';
import { chronicle } from './chronicle';
import { clamp, date, isSikh, polityName, year } from './query';
import { pick, randInt } from './rng';
import type { FactionId, GameState, Leader } from './state';
import { newId } from './state';

const GEN_TRAITS: TraitId[] = ['cavalry_master', 'guerrilla', 'cautious', 'reckless', 'just', 'ambitious', 'zealous', 'administrator', 'old_guard', 'fort_builder', 'artillerist', 'merciful'];

export function generateLeader(s: GameState, faction: FactionId, opts: { female?: boolean } = {}): Leader {
  const y = year(s);
  const sikh = isSikh(faction);
  const female = !!opts.female;
  let name: string;
  if (sikh) {
    name = female ? `${pick(s, GIVEN_NAMES_F)} Kaur` : `${pick(s, GIVEN_NAMES)} Singh ${pick(s, VILLAGE_NAMES)}`;
  } else {
    const pool: Record<string, string[]> = {
      durrani: ['Sardar Abdul Samad Khan', 'Sardar Murtaza Khan', 'Sardar Noor-ud-Din Bamezai', 'Sardar Buland Khan Saddozai', 'Sardar Qasim Khan', 'Sardar Jahandad Khan'],
      mughal: ['Faujdar Qasim Khan', 'Nawab Khwaja Mirza', 'Mir Momin Khan', 'Faujdar Aziz Khan', 'Diwan Lakhpat Rai', 'Kaura Mal'],
      company: ['Colonel Wheeler', 'Major Broadfoot', 'Brigadier Cureton', 'General Littler', 'Colonel Mackeson', 'Major Edwardes'],
      maratha: ['Sardar Sabaji Scindia', 'Sardar Tukoji Holkar', 'Sardar Antaji Mankeshwar', 'Sardar Bapuji Trimbak'],
      kangra: ['Mian Fateh Chand', 'Mian Ishwari Sen', 'Wazir Ram Chand'],
      hill_states: ['Raja Raj Singh', 'Mian Bijay Sen', 'Wazir Ruhlu'],
      jammu: ['Mian Mota', 'Wazir Zorawar', 'Mian Udham Singh'],
      gurkha: ['Kaji Nain Singh Thapa', 'Bhakti Thapa', 'Ranjor Singh Thapa'],
    };
    name = pick(s, pool[faction] ?? ['Khan Bahadur', 'Sardar Fateh Khan', 'Nawab Sultan Khan', 'Diwan Kirpa Ram']);
  }
  const t1 = pick(s, GEN_TRAITS);
  let t2 = pick(s, GEN_TRAITS);
  if (t2 === t1) t2 = 'old_guard';
  const born = y - randInt(s, 20, 42);
  const L: Leader = {
    id: newId(s, 'L'),
    name,
    faction,
    born,
    died: born + randInt(s, 50, 78),
    alive: true,
    traits: [t1, t2],
    martial: randInt(s, 2, 4),
    admin: randInt(s, 2, 4),
    diplomacy: randInt(s, 1, 4),
    loyalty: randInt(s, 55, 85),
    female,
    historical: false,
    victories: 0,
    active: true,
  };
  s.leaders[L.id] = L;
  return L;
}

export function killLeader(s: GameState, id: string, cause: string): void {
  const L = s.leaders[id];
  if (!L || !L.alive) return;
  L.alive = false;
  L.active = false;
  if (L.armyId && s.armies[L.armyId]) s.armies[L.armyId].leader = undefined;
  L.armyId = undefined;
  if (L.jagir && s.regions[L.jagir]) s.regions[L.jagir].jagir = undefined;
  const f = s.factions[L.faction];
  const weight = L.historical ? (f && f.chief === id ? 8 : 5) : 2;
  chronicle(s, 'death', `${L.name} ${cause}.`, { faction: L.faction, leader: id, weight });
  if (L.traits.includes('beloved') && f) f.legend += 3;
  if (f && f.chief === id) succeed(s, L.faction);
}

/** Choose a new chief. Historical successors first, then the most capable sardar. */
export function succeed(s: GameState, faction: FactionId): void {
  const f = s.factions[faction];
  const cands = Object.values(s.leaders).filter((l) => l.alive && l.active && l.faction === faction);
  const order = LEADERS.map((l) => l.id);
  cands.sort((a, b) => {
    const ah = a.historical ? order.indexOf(a.id) : 9999;
    const bh = b.historical ? order.indexOf(b.id) : 9999;
    if (ah !== bh) return ah - bh;
    return b.martial + b.admin + b.diplomacy - (a.martial + a.admin + a.diplomacy);
  });
  const next = cands[0] ?? generateLeader(s, faction);
  f.chief = next.id;
  if (faction === s.playerFaction || f.sarkar) chronicle(s, 'succession', `${next.name} now leads ${polityName(s, faction)}.`, { faction, leader: next.id, weight: 4 });
}

/** Yearly: historical deaths, arrivals, generated deaths. Runs at the start of each turn. */
export function leaderTurn(s: GameState): string[] {
  const notes: string[] = [];
  const d = date(s);
  for (const L of Object.values(s.leaders)) {
    if (!L.alive) continue;
    // Historical figures die in their historical year (Diwali turn of that year unless
    // fate says battle, in which case the battle events handle it).
    const due = L.died < d.year || (L.died === d.year && d.festival === 'diwali');
    if (due) {
      const def = LEADER_BY_ID[L.id];
      const fate = def?.fate ?? 'age';
      const cause =
        fate === 'battle'
          ? 'fell in battle, sword in hand'
          : fate === 'assassinated'
            ? 'was struck down by assassins'
            : fate === 'accident'
              ? 'died by a cruel accident'
              : fate === 'illness'
                ? 'died after an illness'
                : 'died full of years';
      // History can be bent for battle deaths: a leader not in the field may survive a few more years.
      if (fate === 'battle' && !L.armyId && L.historical && d.year - L.died < 6) {
        continue;
      }
      killLeader(s, L.id, cause);
      if (L.faction === s.playerFaction) notes.push(`${L.name} ${cause}.`);
    }
  }
  // Arrivals.
  for (const def of LEADERS) {
    const L = s.leaders[def.id];
    if (!L || L.active || !L.alive) continue;
    const from = def.from ?? def.born + 16;
    if (d.year < from) continue;
    let target = def.faction;
    if (def.joins === 'sarkar') {
      target = strongestSikh(s) ?? def.faction;
    } else if (!s.factions[target]?.alive) {
      target = strongestSikh(s) ?? target;
    }
    L.faction = target;
    L.active = true;
    if (target === s.playerFaction) notes.push(`${L.name} has come to serve ${polityName(s, target)}.`);
  }
  // Loyalty drift.
  for (const L of Object.values(s.leaders)) {
    if (!L.alive || !L.active) continue;
    const f = s.factions[L.faction];
    if (!f) continue;
    const base = LEADER_BY_ID[L.id]?.loyalty ?? 70;
    let drift = 0;
    const gap = f.miri - f.piri;
    if (gap > 35) drift -= 3;
    else if (gap > 20) drift -= 1.5;
    else if (L.loyalty < base) drift += 1;
    if (L.traits.includes('ambitious') && f.piri < 45) drift -= 1;
    if (L.jagir) drift += 0.5;
    if (f.treasury < 0) drift -= 3;
    if (FACTION_BY_ID[L.faction]?.id === 'faizullapuria') drift += 0.5;
    L.loyalty = clamp(L.loyalty + drift, 0, 100);
  }
  return notes;
}

export function strongestSikh(s: GameState): FactionId | undefined {
  let best: FactionId | undefined;
  let bm = -1;
  for (const f of Object.values(s.factions)) {
    if (!f.alive || !isSikh(f.id)) continue;
    const score = f.miri + (f.sarkar ? 100 : 0);
    if (score > bm) ((bm = score), (best = f.id));
  }
  return best;
}

export function idleLeaders(s: GameState, f: FactionId): Leader[] {
  return Object.values(s.leaders).filter((l) => l.alive && l.active && l.faction === f && !l.armyId);
}

export function ageOf(s: GameState, l: Leader): number {
  return year(s) - l.born;
}
