// The Durrani invasions. Ahmad Shah came down into India again and again in the
// cold season, and his grandson Zaman Shah three times in the 1790s. Each invasion
// spawns a great army at the frontier on a Diwali turn; it campaigns through the
// winter and withdraws home before the heat.

import { chronicle } from './chronicle';
import { date } from './query';
import type { GameState } from './state';
import { newId } from './state';

export interface InvasionDef {
  year: number;
  leader: string;
  cav: number;
  foot: number;
  guns?: number;
  /** Turns spent in the field before withdrawing. */
  stay: number;
  note: string;
}

/** Dates follow the conventional numbering of Ahmad Shah's invasions (see HISTORY.md). */
export const INVASIONS: InvasionDef[] = [
  { year: 1748, leader: 'ahmad_shah', cav: 14000, foot: 5000, stay: 1, note: 'Ahmad Shah’s second invasion: the Mughals cede him the revenues of four mahals of the Punjab.' },
  { year: 1751, leader: 'ahmad_shah', cav: 20000, foot: 6000, stay: 2, note: 'The third invasion: Mir Mannu submits and governs Lahore for the Durrani king.' },
  { year: 1756, leader: 'ahmad_shah', cav: 26000, foot: 8000, guns: 300, stay: 2, note: 'The fourth invasion: Delhi and Mathura sacked; Timur Shah left at Lahore.' },
  { year: 1759, leader: 'ahmad_shah', cav: 30000, foot: 10000, guns: 400, stay: 3, note: 'The fifth invasion, which ends at Panipat.' },
  { year: 1761, leader: 'ahmad_shah', cav: 28000, foot: 8000, guns: 300, stay: 2, note: 'The sixth invasion: the Vadda Ghallughara.' },
  { year: 1764, leader: 'ahmad_shah', cav: 18000, foot: 4000, stay: 1, note: 'The seventh invasion.' },
  { year: 1766, leader: 'ahmad_shah', cav: 15000, foot: 4000, stay: 1, note: 'The eighth invasion, the last to reach deep into the Punjab.' },
  { year: 1795, leader: 'zaman_shah', cav: 15000, foot: 5000, stay: 1, note: 'Zaman Shah comes down as far as Hasan Abdal.' },
  { year: 1796, leader: 'zaman_shah', cav: 20000, foot: 8000, guns: 200, stay: 1, note: 'Zaman Shah occupies Lahore in January 1797.' },
  { year: 1798, leader: 'zaman_shah', cav: 20000, foot: 8000, guns: 200, stay: 1, note: 'Zaman Shah’s last invasion; Lahore again occupied, then abandoned.' },
];

export function spawnInvasions(s: GameState): string[] {
  const d = date(s);
  if (d.festival !== 'diwali') return [];
  const inv = INVASIONS.find((i) => i.year === d.year);
  if (!inv) return [];
  const key = `invasion_${inv.year}`;
  if (s.firedEvents[key] !== undefined) return [];
  s.firedEvents[key] = s.turn;
  const durrani = s.factions.durrani;
  if (!durrani) return [];
  durrani.alive = true;
  // Gather where the Durrani hold the frontier; otherwise through the Khyber.
  const start = ['peshawar', 'attock', 'jamrud'].find((r) => s.regions[r].owner === 'durrani') ?? 'jamrud';
  const id = newId(s, 'A');
  const leader = s.leaders[inv.leader]?.alive && s.leaders[inv.leader].active !== false ? inv.leader : undefined;
  if (leader) {
    s.leaders[leader].active = true;
    s.leaders[leader].faction = 'durrani';
  }
  const units = [
    { type: 'durrani_cav', men: inv.cav, xp: 0.5 },
    { type: 'jezailchi', men: inv.foot, xp: 0.4 },
  ];
  if (inv.guns) units.push({ type: 'zamburak', men: inv.guns, xp: 0.4 });
  s.armies[id] = {
    id,
    owner: 'durrani',
    region: start,
    units,
    leader,
    path: [],
    stance: 'pitched',
    morale: 90,
    supply: 100,
    policy: 'sack',
    withdrawTurn: s.turn + inv.stay,
    home: start,
    baggage: { plunder: 0, captives: 0 },
    name: leader === 'zaman_shah' ? 'Army of Zaman Shah' : 'Army of Ahmad Shah',
  };
  if (leader) s.leaders[leader].armyId = id;
  durrani.treasury += 150;
  // The invader is at war with the Khalsa and with whoever holds Lahore.
  for (const f of Object.values(s.factions)) {
    if (!f.alive || f.id === 'durrani') continue;
    const sikh = ['ahluwalia', 'bhangi', 'ramgarhia', 'kanhaiya', 'sukerchakia', 'nakai', 'dallewalia', 'nishanwalia', 'faizullapuria', 'karorasinghia', 'shaheedan'].includes(f.id);
    const holdsLahore = s.regions.lahore.owner === f.id;
    if (sikh || holdsLahore || f.id === 'maratha') {
      f.relations.durrani = 'war';
      durrani.relations[f.id] = 'war';
    }
  }
  chronicle(s, 'event', inv.note, { faction: 'durrani', weight: 5 });
  return [`From the passes beyond Attock comes word: the Durrani king is coming down with ${(inv.cav + inv.foot).toLocaleString()} men.`];
}
