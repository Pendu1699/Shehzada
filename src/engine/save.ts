// Saving and loading. A save is the GameState as JSON (it already contains the RNG
// state, so loading resumes the identical random stream).

import { FACTIONS } from '../data/factions';
import { ensureFaction } from './partition';
import { SAVE_VERSION, type GameState } from './state';

export const SAVE_PREFIX = 'rkk.save.';

export function serialize(s: GameState): string {
  return JSON.stringify(s);
}

export function deserialize(json: string): GameState {
  const s = JSON.parse(json) as GameState;
  if (!s || typeof s !== 'object' || !s.regions || !s.factions) throw new Error('This is not a Shehzada save.');
  return migrate(s);
}

/** Upgrade older saves in place. */
export function migrate(s: GameState): GameState {
  if (!s.version) s.version = 1;
  if (!s.piriNotes) s.piriNotes = [];
  for (const a of Object.values(s.armies)) if (!a.policy) a.policy = 'spare';
  // Houses added to the game since the save was made (the Khalsa Panth, India, Pakistan…).
  for (const f of FACTIONS) if (!s.factions[f.id]) ensureFaction(s, f.id);
  // The Long Struggle once had Kapurthala ruled by "the Ahluwalia misl": it is Kapurthala State now.
  if (s.mode === 'struggle' && s.regions.kapurthala?.owner === 'ahluwalia') {
    const k = s.factions.kapurthala;
    const a = s.factions.ahluwalia;
    s.regions.kapurthala.owner = 'kapurthala';
    k.alive = true;
    k.treasury = a.treasury;
    k.flags = { ...a.flags };
    for (const [g, rel] of Object.entries(a.relations)) {
      k.relations[g] = rel;
      if (s.factions[g]) s.factions[g].relations.kapurthala = rel;
    }
    for (const arm of Object.values(s.armies)) if (arm.owner === 'ahluwalia') arm.owner = 'kapurthala';
    a.alive = false;
  }
  if (s.version > SAVE_VERSION) throw new Error('This save comes from a newer version of the game.');
  s.version = SAVE_VERSION;
  return s;
}

export interface SaveSlot {
  key: string;
  name: string;
  label: string;
  savedAt: number;
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

function storage(): Store | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function saveToSlot(s: GameState, name: string, label: string): void {
  const st = storage();
  if (!st) throw new Error('Browser storage is unavailable.');
  st.setItem(SAVE_PREFIX + name, serialize(s));
  st.setItem(SAVE_PREFIX + name + '.meta', JSON.stringify({ name, label, savedAt: Date.now() }));
}

export function loadFromSlot(name: string): GameState | null {
  const st = storage();
  const raw = st?.getItem(SAVE_PREFIX + name);
  return raw ? deserialize(raw) : null;
}

export function listSlots(): SaveSlot[] {
  const st = storage();
  if (!st) return [];
  const out: SaveSlot[] = [];
  for (let i = 0; i < st.length; i++) {
    const k = st.key(i);
    if (!k || !k.startsWith(SAVE_PREFIX) || !k.endsWith('.meta')) continue;
    try {
      const m = JSON.parse(st.getItem(k)!);
      out.push({ key: k, name: m.name, label: m.label, savedAt: m.savedAt });
    } catch {
      /* ignore broken meta */
    }
  }
  return out.sort((a, b) => b.savedAt - a.savedAt);
}

export function deleteSlot(name: string): void {
  const st = storage();
  st?.removeItem(SAVE_PREFIX + name);
  st?.removeItem(SAVE_PREFIX + name + '.meta');
}
