// Leaders: ageing, death, succession, historical arrivals and generated sardars.

import { FACTION_BY_ID } from '../data/factions';
import { GIVEN_NAMES, GIVEN_NAMES_F, LEADERS, LEADER_BY_ID, VILLAGE_NAMES, type TraitId } from '../data/leaders';
import { chronicle } from './chronicle';
import { onRulerDeath } from './court';
import { clamp, date, isSikh, polityName, year } from './query';
import { pick, randInt } from './rng';
import type { FactionId, GameState, Leader } from './state';
import { newId } from './state';

const EVENT_MANAGED = new Set(['nau_nihal_singh', 'sher_singh', 'dhian_singh']);

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
  if (f && f.chief === id) {
    onRulerDeath(s, L.faction);
    if (f.chief === id) succeed(s, L.faction);
  }
}

/** Lines of succession for each house, in historical order. */
const SUCCESSION: Record<string, string[]> = {
  sukerchakia: ['charat_singh', 'maha_singh', 'ranjit_singh', 'kharak_singh', 'nau_nihal_singh', 'sher_singh', 'duleep_singh'],
  ahluwalia: ['jassa_ahluwalia', 'bhag_singh_ahluwalia', 'fateh_singh_ahluwalia'],
  faizullapuria: ['kapur_singh', 'khushal_singh', 'budh_singh_singhpuria'],
  bhangi: ['hari_singh_bhangi', 'jhanda_singh_bhangi', 'gujjar_singh', 'lehna_singh_bhangi'],
  ramgarhia: ['jassa_ramgarhia', 'jodh_singh_ramgarhia'],
  kanhaiya: ['jai_singh_kanhaiya', 'sada_kaur'],
  nakai: ['hira_singh_nakai', 'ran_singh_nakai'],
  dallewalia: ['gulab_singh_dallewalia', 'tara_singh_ghaiba'],
  nishanwalia: ['dasaundha_singh', 'sangat_singh_nishanwalia'],
  karorasinghia: ['karora_singh', 'baghel_singh'],
  shaheedan: ['baba_deep_singh', 'karam_singh_shaheed'],
  phulkian: ['ala_singh', 'amar_singh_patiala', 'sahib_singh_patiala'],
  durrani: ['ahmad_shah', 'timur_shah', 'zaman_shah', 'shah_shuja', 'dost_mohammad'],
  kangra: ['ghamand_chand', 'sansar_chand'],
  jammu: ['ranjit_dev', 'gulab_singh_dogra'],
};

/** Choose a new chief: the line of succession first, then the most capable sardar
 * of the house (ministers who joined the Sarkar's service do not inherit). */
export function succeed(s: GameState, faction: FactionId): void {
  const f = s.factions[faction];
  const line = (SUCCESSION[faction] ?? []).filter((id) => s.leaders[id]?.alive && s.leaders[id].faction === faction);
  let next = line.map((id) => s.leaders[id])[0];
  if (!next) {
    const cands = Object.values(s.leaders).filter((l) => l.alive && l.active && l.faction === faction && !LEADER_BY_ID[l.id]?.joins && !l.female);
    cands.sort((a, b) => b.martial + b.admin + b.diplomacy - (a.martial + a.admin + a.diplomacy));
    next = cands[0] ?? generateLeader(s, faction);
  }
  next.active = true;
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
    // Deaths that history ties to the succession crisis are decided by events, so a
    // well-prepared player can avert them.
    if (due && EVENT_MANAGED.has(L.id) && d.year < L.died + 25) continue;
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
