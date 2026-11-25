// Reforms: the game's tech tree. Each reform is studied for some seasons at a
// cost in silver, needs the reforms before it and, for some, a year when the
// world had the idea at all. Their effects add to the house's modifiers
// (factionMods) or unlock new kinds of troops.
//
// Three branches, after what the Sikh states actually did:
//  Fauj   — the army: Dhai Phat drill to the Fauj-i-Ain and the Lahore foundry.
//  Daftar — the treasury: revenue clerks, canals, mints and roads.
//  Panth  — the faith and the people: langar endowments, Gurmukhi schools,
//           news-writers, the court of justice.

import { FACTION_BY_ID, type FactionModifiers } from '../data/factions';
import { chronicle } from './chronicle';
import { year } from './query';
import { chance } from './rng';
import type { FactionId, GameState } from './state';

export type Branch = 'fauj' | 'daftar' | 'panth';

export interface ReformDef {
  id: string;
  name: string;
  branch: Branch;
  /** Silver, in thousands, paid when study begins. */
  cost: number;
  /** Seasons of study. */
  turns: number;
  from?: number;
  requires?: string[];
  detail: string;
  mods?: FactionModifiers;
  /** Unit types this reform lets a house raise. */
  unlocks?: string[];
  /** Only the Sikh Empire may take it. */
  sarkar?: boolean;
}

export const BRANCH_NAME: Record<Branch, string> = { fauj: 'Fauj — the army', daftar: 'Daftar — the treasury', panth: 'Panth — the people' };

export const REFORMS: ReformDef[] = [
  // ── Fauj ──
  { id: 'dhai_phat_drill', name: 'Dhai Phat drill', branch: 'fauj', cost: 20, turns: 2, detail: 'Riders drilled to strike, wheel and strike again. Cavalry attack +10%.', mods: { cavalryAttack: 1.1 } },
  { id: 'zamburak_corps', name: 'Zamburak corps', branch: 'fauj', cost: 30, turns: 2, requires: ['dhai_phat_drill'], detail: 'Swivel guns mounted on camels, as the Afghans used them. Lets you raise zamburaks.', unlocks: ['zamburak'] },
  { id: 'topkhana', name: 'Topkhana', branch: 'fauj', cost: 50, turns: 3, from: 1765, requires: ['zamburak_corps'], detail: 'A park of field guns, cast or captured. Lets you raise heavy guns; artillery +10%.', unlocks: ['top'], mods: { artillery: 1.1 } },
  { id: 'fauj_ain', name: 'Fauj-i-Ain', branch: 'fauj', cost: 80, turns: 4, from: 1800, requires: ['topkhana'], detail: 'A standing army drilled in the European manner, paid monthly from the treasury. Lets you raise regular infantry; morale +5%.', unlocks: ['fauj_ain_inf'], mods: { morale: 1.05 } },
  { id: 'lahore_foundry', name: 'The Lahore foundry', branch: 'fauj', cost: 90, turns: 4, from: 1810, requires: ['topkhana'], detail: 'Guns cast at home, as good as the Company’s. Artillery +20%, sieges faster.', mods: { artillery: 1.2, siege: 1.2 } },
  { id: 'european_officers', name: 'European officers', branch: 'fauj', cost: 70, turns: 3, from: 1822, requires: ['fauj_ain'], detail: 'Veterans of Napoleon’s wars — Ventura, Allard, Avitabile — to drill the Fauj-i-Khas. Morale +10%.', mods: { morale: 1.1 } },
  // ── Daftar ──
  { id: 'revenue_daftar', name: 'Revenue daftar', branch: 'daftar', cost: 20, turns: 2, detail: 'Clerks who keep the accounts of every village. Land revenue +8%.', mods: { revenue: 1.08 } },
  { id: 'canal_works', name: 'Canal works', branch: 'daftar', cost: 35, turns: 3, requires: ['revenue_daftar'], detail: 'Repair the Hasli and the Shah Nahar and dig new cuts. Canals cost less and water more fields.' },
  { id: 'nanakshahi_mint', name: 'The Nanakshahi mint', branch: 'daftar', cost: 40, turns: 2, from: 1765, requires: ['revenue_daftar'], detail: 'Coin struck in the name of the Gurus, trusted in every mandi. Trade +10%.', mods: { trade: 1.1 } },
  { id: 'grand_road', name: 'Sarais and pakki sarak', branch: 'daftar', cost: 45, turns: 3, requires: ['nanakshahi_mint'], detail: 'Roads mended and sarais kept up along the Grand Trunk Road. Roads cost half; trade +5%.', mods: { trade: 1.05 } },
  { id: 'khalsa_treasury', name: 'The Toshakhana', branch: 'daftar', cost: 80, turns: 4, from: 1800, requires: ['canal_works', 'grand_road'], detail: 'A great treasury and a proper budget, under a minister of finance. Land revenue +12%.', mods: { revenue: 1.12 } },
  // ── Panth ──
  { id: 'langar_endowment', name: 'Langar endowments', branch: 'panth', cost: 20, turns: 2, detail: 'Villages granted to keep the langars burning. Langar costs −30%.' },
  { id: 'gurmukhi_schools', name: 'Gurmukhi schools', branch: 'panth', cost: 30, turns: 3, requires: ['langar_endowment'], detail: 'Teachers of Gurmukhi in every town. Piri gains +15%.', mods: { piriGain: 1.15 } },
  { id: 'akhbar_navis', name: 'Akhbar-navis', branch: 'panth', cost: 30, turns: 2, detail: 'News-writers at every court, as the Mughals kept them. Diplomacy +15%.', mods: { diplomacy: 1.15 } },
  { id: 'adalat', name: 'The adalat', branch: 'panth', cost: 50, turns: 3, from: 1780, requires: ['gurmukhi_schools'], detail: 'Courts of justice open to every faith. Stability rises in all your lands.' },
  { id: 'darbar_of_all_faiths', name: 'A darbar of all faiths', branch: 'panth', cost: 70, turns: 3, from: 1800, requires: ['adalat', 'akhbar_navis'], detail: 'Ministers of every faith, as Fakir Azizuddin and Dina Nath served the Sarkar. Diplomacy +10%, Piri gains +10%.', mods: { diplomacy: 1.1, piriGain: 1.1 } },
];

export const REFORM_BY_ID: Record<string, ReformDef> = Object.fromEntries(REFORMS.map((r) => [r.id, r]));

export const hasReform = (s: GameState, f: FactionId, id: string) => !!s.factions[f]?.flags[`reform_${id}`];

/** A house's modifiers: its own nature, plus the reforms it has made. */
export function factionMods(s: GameState, f: FactionId | null | undefined): FactionModifiers {
  const base = (f && FACTION_BY_ID[f]?.mods) || {};
  if (!f || !s.factions[f]) return base;
  const out: FactionModifiers = { ...base };
  for (const r of REFORMS) {
    if (!r.mods || !hasReform(s, f, r.id)) continue;
    for (const [k, v] of Object.entries(r.mods) as [keyof FactionModifiers, number][]) out[k] = (out[k] ?? 1) * v;
  }
  return out;
}

export type ReformState = 'done' | 'studying' | 'available' | 'locked';

export function reformState(s: GameState, f: FactionId, r: ReformDef): { state: ReformState; why?: string } {
  if (hasReform(s, f, r.id)) return { state: 'done' };
  if (s.factions[f].flags.studying === r.id) return { state: 'studying' };
  const missing = (r.requires ?? []).filter((x) => !hasReform(s, f, x));
  if (missing.length) return { state: 'locked', why: `Needs ${missing.map((x) => REFORM_BY_ID[x].name).join(' and ')}` };
  if (r.from && year(s) < r.from) return { state: 'locked', why: `Not before ${r.from}` };
  if (r.sarkar && !s.factions[f].sarkar) return { state: 'locked', why: 'Only the Sikh Empire' };
  return { state: 'available' };
}

/** Begin studying a reform. */
export function beginReform(s: GameState, f: FactionId, id: string): string | null {
  const r = REFORM_BY_ID[id];
  const fs = s.factions[f];
  if (!r || !fs) return null;
  if (fs.flags.studying) return null;
  if (reformState(s, f, r).state !== 'available') return null;
  if (fs.treasury < r.cost) return null;
  fs.treasury -= r.cost;
  fs.flags.studying = r.id;
  fs.flags.study_left = r.turns;
  return `Work began on ${r.name}.`;
}

/** Each turn: study advances; a finished reform takes effect. */
export function reformsTurn(s: GameState): string[] {
  const out: string[] = [];
  for (const fs of Object.values(s.factions)) {
    if (!fs.alive || !fs.flags.studying) continue;
    // Schools speed the work a little.
    const schools = Object.values(s.regions).some((r) => r.owner === fs.id && r.buildings.includes('school'));
    const left = Number(fs.flags.study_left ?? 1) - (schools && chance(s, 0.25) ? 2 : 1);
    if (left > 0) {
      fs.flags.study_left = left;
      continue;
    }
    const r = REFORM_BY_ID[String(fs.flags.studying)];
    delete fs.flags.studying;
    delete fs.flags.study_left;
    if (!r) continue;
    fs.flags[`reform_${r.id}`] = true;
    for (const u of r.unlocks ?? []) fs.flags[`unlock_${u}`] = true;
    if (fs.id === s.playerFaction) {
      out.push(`Reform complete: ${r.name}. ${r.detail}`);
      chronicle(s, 'event', `${r.name} was established.`, { faction: fs.id, weight: 3 });
    }
  }
  return out;
}

/** The computer's houses take up reforms as their treasuries allow. */
export function aiReforms(s: GameState, f: FactionId): void {
  const fs = s.factions[f];
  if (!fs?.alive || fs.flags.studying || f === s.playerFaction) return;
  if (!FACTION_BY_ID[f] || FACTION_BY_ID[f].distant) return;
  const options = REFORMS.filter((r) => reformState(s, f, r).state === 'available' && fs.treasury > r.cost * 2.5);
  if (!options.length) return;
  beginReform(s, f, options[0].id);
}
