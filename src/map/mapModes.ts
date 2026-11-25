// Map views: other ways to colour the map besides the painting.

import { TERRAIN_WASH } from '../art/palette';
import { FACTION_BY_ID } from '../data/factions';
import { REGION_BY_ID } from '../data/regions';
import { regionGross } from '../engine/economy';
import { atWar } from '../engine/query';
import type { GameState } from '../engine/state';
import { unionOf } from '../engine/unions';
import { overlordOf } from '../engine/vassals';

export type MapMode = 'painted' | 'countries' | 'alliances' | 'terrain' | 'faith' | 'wealth';

export const MAP_MODES: { id: MapMode; name: string; detail: string }[] = [
  { id: 'painted', name: 'Painted', detail: 'The watercolour map: what your riders have seen, and who holds it.' },
  { id: 'countries', name: 'Countries', detail: 'Every land in its owner’s colour.' },
  { id: 'alliances', name: 'Alliances', detail: 'You, your union, allies and puppets — and your enemies.' },
  { id: 'terrain', name: 'Terrain', detail: 'Plains, river belas, jungle, hills, the bar, desert and mountains.' },
  { id: 'faith', name: 'Faith', detail: 'The faith most of the people follow.' },
  { id: 'wealth', name: 'Wealth', detail: 'How much land revenue and trade each region yields.' },
];

export const ALLIANCE_KEY = {
  you: '#C9A13B',
  union: '#3E8A4A',
  ally: '#7FB15E',
  puppet: '#A7C98A',
  war: '#B83A2B',
  other: '#BDB4A0',
  none: '#E2D9C2',
};

export const FAITH_KEY = { sikh: '#E8870E', hindu: '#C2577A', muslim: '#3E7B4F', other: '#7A6A9A' };

export const TERRAIN_KEY = TERRAIN_WASH;

const WEALTH_STOPS = ['#F4EBD3', '#E9C873', '#D9892E', '#B4441E', '#6E1A12'];

function lerp(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function wealthColor(v: number): string {
  const t = Math.max(0, Math.min(0.999, v)) * (WEALTH_STOPS.length - 1);
  const i = Math.floor(t);
  return lerp(WEALTH_STOPS[i], WEALTH_STOPS[i + 1], t - i);
}
export const WEALTH_STOPS_KEY = WEALTH_STOPS;

/** The colour a region takes in a map view (null: leave unpainted). */
export function modeColor(s: GameState, mode: MapMode, id: string, ownerColor: (f: string) => string, maxWealth: number): string | null {
  const st = s.regions[id];
  const def = REGION_BY_ID[id];
  const p = s.playerFaction;
  switch (mode) {
    case 'countries':
      return st.owner ? ownerColor(st.owner) : ALLIANCE_KEY.none;
    case 'alliances': {
      const o = st.owner;
      if (!o) return ALLIANCE_KEY.none;
      if (o === p) return ALLIANCE_KEY.you;
      if (atWar(s, p, o)) return ALLIANCE_KEY.war;
      if (overlordOf(s, o) === p) return ALLIANCE_KEY.puppet;
      if (unionOf(s, p)?.members.includes(o)) return ALLIANCE_KEY.union;
      if (s.factions[p]?.relations[o] === 'alliance') return ALLIANCE_KEY.ally;
      return ALLIANCE_KEY.other;
    }
    case 'terrain':
      return TERRAIN_WASH[def.terrain];
    case 'faith': {
      const f = { sikh: def.faith.sikh, hindu: def.faith.hindu, muslim: def.faith.muslim, other: def.faith.other ?? 0 };
      const top = (Object.entries(f) as [keyof typeof FAITH_KEY, number][]).sort((a, b) => b[1] - a[1])[0];
      return lerp('#F2E6C9', FAITH_KEY[top[0]], 0.35 + (top[1] / 100) * 0.65);
    }
    case 'wealth': {
      const g = regionGross(s, id);
      return wealthColor((g.land + g.trade) / Math.max(1, maxWealth));
    }
    default:
      return null;
  }
}

/** Short name of the owner for legends (e.g. in the Countries view). */
export const ownerName = (id: string) => FACTION_BY_ID[id]?.name ?? id;
