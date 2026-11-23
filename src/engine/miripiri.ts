// Miri and Piri: the two swords.
//
// Miri (temporal power) is computed each turn from land, revenue, armies and forts.
// Piri (the Panth's cohesion, legitimacy and moral standing) is a stored value that
// only moves when the polity makes costly choices: langar in famine, sparing a city,
// keeping rakhi, honouring gurmatas, tolerance — or their opposites.
//
// When Miri runs far ahead of Piri the polity grows brittle: generals waver, sardars
// scheme, and in battle a commander may hold back or betray. This is how the game
// models the collapse after 1839. When Piri runs far ahead of Miri the polity is
// righteous but weak.

import { FACTION_BY_ID } from '../data/factions';
import { bd, clamp, factionMen, regionsOf, type Breakdown } from './query';
import type { FactionId, GameState } from './state';

export function computeMiri(s: GameState, f: FactionId): Breakdown {
  const regions = regionsOf(s, f);
  const forts = regions.reduce((t, r) => t + s.regions[r].fort, 0);
  const men = factionMen(s, f);
  const fs = s.factions[f];
  const income = fs.lastIncome;
  // Saturating curve: early gains matter, an empire tops out near 100.
  const raw = regions.length * 2 + Math.max(0, income) / 10 + men / 1500 + forts * 0.6 + Math.min(40, fs.treasury / 100);
  const total = Math.round(100 * (1 - Math.exp(-raw / 60)));
  const scale = raw > 0 ? total / raw : 0;
  const parts = [
    { label: `Land (${regions.length} regions)`, value: regions.length * 2 * scale },
    { label: 'Revenue', value: (Math.max(0, income) / 10) * scale },
    { label: `Armies (${Math.round(men).toLocaleString()} men)`, value: (men / 1500) * scale },
    { label: 'Forts', value: forts * 0.6 * scale },
    { label: 'Treasury', value: Math.min(40, fs.treasury / 100) * scale },
  ].map((p) => ({ ...p, value: Math.round(p.value * 10) / 10 }));
  return { total, parts: bd(parts).parts };
}

export function updateMiri(s: GameState, f: FactionId): number {
  const m = computeMiri(s, f).total;
  if (s.factions[f]) s.factions[f].miri = m;
  return m;
}

/** Change a faction's Piri. Positive gains are scaled by the faction's piriGain bonus. */
export function changePiri(s: GameState, f: FactionId, delta: number, reason: string): number {
  const fs = s.factions[f];
  if (!fs) return 0;
  let d = delta;
  if (d > 0) d *= FACTION_BY_ID[f]?.mods.piriGain ?? 1;
  const before = fs.piri;
  fs.piri = clamp(fs.piri + d, 0, 100);
  const applied = fs.piri - before;
  if (f === s.playerFaction && Math.abs(applied) >= 0.05) {
    pushPiriNote(s, applied, reason);
  }
  return applied;
}

function pushPiriNote(s: GameState, delta: number, reason: string) {
  const existing = s.piriNotes.find((n) => n.reason === reason);
  if (existing) existing.delta += delta;
  else s.piriNotes.push({ delta, reason });
}

export interface Balance {
  miri: number;
  piri: number;
  gap: number;
  state: 'balanced' | 'brittle' | 'very_brittle' | 'weak';
  label: string;
  detail: string;
}

export function balanceOf(s: GameState, f: FactionId): Balance {
  const fs = s.factions[f];
  const miri = fs.miri;
  const piri = Math.round(fs.piri);
  const gap = miri - piri;
  if (gap > 35)
    return { miri, piri, gap, state: 'very_brittle', label: 'Very brittle', detail: 'Power has far outrun legitimacy. Sardars scheme, generals waver, and treachery in battle is likely.' };
  if (gap > 20) return { miri, piri, gap, state: 'brittle', label: 'Brittle', detail: 'Your power runs ahead of the Panth’s trust. Loyalty erodes each turn.' };
  if (gap < -30) return { miri, piri, gap, state: 'weak', label: 'Righteous but weak', detail: 'The Panth honours you, but you lack the strength to protect it.' };
  return { miri, piri, gap, state: 'balanced', label: 'The two swords in balance', detail: 'Miri and Piri grow together. Your sardars are steady.' };
}

/** Morale modifier from Piri (applies to Sikh armies). */
export function piriMoraleBonus(s: GameState, f: FactionId): number {
  const fs = s.factions[f];
  if (!fs || !FACTION_BY_ID[f]?.sikh) return 0;
  return (fs.piri - 50) / 5; // −10 .. +10 morale points
}
