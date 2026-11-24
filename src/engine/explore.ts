// The player's knowledge of the map. The Painted Punjab begins as a pencil
// underdrawing; colour washes spread as the player's riders see the land.

import { REGIONS } from '../data/regions';
import { neighbors } from './map';
import type { GameState } from './state';

/** Places every Sikh of the age knew by report, even unseen. */
const KNOWN_BY_REPUTE = ['amritsar', 'lahore', 'anandpur', 'damdama', 'sirhind', 'delhi'];

export function refreshExploration(s: GameState): void {
  const p = s.playerFaction;
  const mark = (id: string, v: 0 | 1 | 2) => {
    if ((s.explored[id] ?? 0) < v) s.explored[id] = v;
  };
  for (const id of KNOWN_BY_REPUTE) mark(id, 1);
  // Every land of the subcontinent was known by report — who held it, roughly
  // where it lay — so the whole map shows its colours from the start. Riding
  // through a region (level 2) is still what brings its detail to life.
  for (const r of REGIONS) mark(r.id, 1);
  for (const r of Object.values(s.regions)) {
    if (r.owner === p) {
      mark(r.id, 2);
      for (const e of neighbors(r.id)) mark(e.to, 1);
    } else if (r.rakhi === p) {
      mark(r.id, 2);
    }
  }
  for (const a of Object.values(s.armies)) {
    if (a.owner !== p) continue;
    mark(a.region, 2);
    for (const e of neighbors(a.region)) mark(e.to, 1);
  }
  for (const r of Object.keys(s.regions)) if (s.explored[r] === undefined) s.explored[r] = 0;
}
