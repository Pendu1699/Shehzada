// Colours of the Sikh Empire's flag, shared by the interface and the map.

import { FACTION_BY_ID } from '../data/factions';

/** The saffron of the Sikh Empire's flag. */
export const EMPIRE_FIELD = '#DC4A0E';

/** The edge colour of a house's empire flag: its own field, or its band if that is too close to saffron. */
export function empireEdge(faction: string): string {
  if (EMPIRE_VARIANT[faction]) return EMPIRE_VARIANT[faction].edge;
  const b = FACTION_BY_ID[faction]?.banner;
  if (!b) return '#B83A2B';
  const saffronish = /^#(E8870E|F08A1C|E6C23B|EBA22E|C9A13B|E59A3A)$/i.test(b.field);
  return saffronish ? (b.band === '#F2E6C9' ? '#B83A2B' : b.band) : b.field;
}


/** Each house's own version of the empire flag: edge colour and the emblem in the hoist. */
export const EMPIRE_VARIANT: Record<string, { edge: string; emblem: string }> = {
  ahluwalia: { edge: '#7A1E1A', emblem: 'sun' },
  bhangi: { edge: '#1F3A68', emblem: 'gun' },
  ramgarhia: { edge: '#1B1712', emblem: 'fort' },
  kanhaiya: { edge: '#B83A2B', emblem: 'lotus' },
  sukerchakia: { edge: '#1E7A1E', emblem: 'lion' },
  nakai: { edge: '#7A3B69', emblem: 'horse' },
  dallewalia: { edge: '#2F6F73', emblem: 'spear' },
  nishanwalia: { edge: '#1F3A68', emblem: 'lion' },
  faizullapuria: { edge: '#3D6B4F', emblem: 'sun' },
  karorasinghia: { edge: '#8C6A1E', emblem: 'star' },
  shaheedan: { edge: '#22307A', emblem: 'mountain' },
  phulkian: { edge: '#6B8F3A', emblem: 'wheat' },
};
