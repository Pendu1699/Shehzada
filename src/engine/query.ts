// Read-only helpers over GameState.

import { FACTION_BY_ID } from '../data/factions';
import { REGION_BY_ID } from '../data/regions';
import { UNIT_TYPES } from '../data/units';
import { dateOf, type DateInfo } from './calendar';
import type { Army, FactionId, GameState, Relation } from './state';

export interface Part {
  label: string;
  value: number;
}
export interface Breakdown {
  total: number;
  parts: Part[];
}

export const bd = (parts: Part[]): Breakdown => ({ total: parts.reduce((s, p) => s + p.value, 0), parts });

export function date(s: GameState): DateInfo {
  return dateOf(s.startYear, s.startFestival, s.turn);
}

export function year(s: GameState): number {
  return date(s).year;
}

export function fdef(id: FactionId) {
  return FACTION_BY_ID[id];
}

export function isSikh(id: FactionId | null | undefined): boolean {
  return !!id && !!FACTION_BY_ID[id]?.sikh;
}

export function relation(s: GameState, a: FactionId, b: FactionId): Relation {
  if (a === b) return 'alliance';
  return s.factions[a]?.relations[b] ?? 'peace';
}

export function atWar(s: GameState, a: FactionId | null, b: FactionId | null): boolean {
  if (!a || !b || a === b) return false;
  return relation(s, a, b) === 'war';
}

export function friendly(s: GameState, a: FactionId | null, b: FactionId | null): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const r = relation(s, a, b);
  return r === 'alliance' || r === 'vassal' || r === 'overlord';
}

export function regionsOf(s: GameState, f: FactionId): string[] {
  return Object.values(s.regions)
    .filter((r) => r.owner === f)
    .map((r) => r.id);
}

export function armiesOf(s: GameState, f: FactionId): Army[] {
  return Object.values(s.armies).filter((a) => a.owner === f);
}

export function armiesIn(s: GameState, region: string): Army[] {
  return Object.values(s.armies).filter((a) => a.region === region);
}

export function armyMen(a: Army): number {
  return a.units.reduce((t, u) => t + u.men, 0);
}

export function factionMen(s: GameState, f: FactionId): number {
  return armiesOf(s, f).reduce((t, a) => t + armyMen(a), 0);
}

/** Movement points per turn: the slowest unit sets the pace. */
export function armySpeed(a: Army): number {
  let sp = Infinity;
  for (const u of a.units) if (u.men > 0) sp = Math.min(sp, UNIT_TYPES[u.type]?.speed ?? 2);
  return sp === Infinity ? 0 : sp;
}

export function isCavalryArmy(a: Army): boolean {
  const men = armyMen(a);
  if (!men) return false;
  const cav = a.units.filter((u) => UNIT_TYPES[u.type]?.cls === 'cavalry').reduce((t, u) => t + u.men, 0);
  return cav / men >= 0.6;
}

export function rdef(id: string) {
  return REGION_BY_ID[id];
}

export function leaderName(s: GameState, id?: string): string {
  return (id && s.leaders[id]?.name) || 'an unnamed sardar';
}

export function factionName(id: FactionId | null | undefined): string {
  if (!id) return 'local chiefs';
  return FACTION_BY_ID[id]?.name ?? id;
}

/** Display name: misls are "the X misl", the Sarkar gets its title. */
export function polityName(s: GameState, id: FactionId | null | undefined): string {
  if (!id) return 'the local chiefs';
  const named = s.factions[id]?.flags.state_name;
  if (typeof named === 'string') return named;
  if (s.factions[id]?.sarkar) return 'the Sikh Empire';
  if (id === 'khalsa_panth') return 'the Khalsa Panth';
  const d = FACTION_BY_ID[id];
  if (!d) return id;
  return d.kind === 'misl' ? `the ${d.name} misl` : `the ${d.name}`;
}

export function aliveFactions(s: GameState): FactionId[] {
  return Object.values(s.factions)
    .filter((f) => f.alive)
    .map((f) => f.id);
}

export function hasTrait(s: GameState, leaderId: string | undefined, trait: string): boolean {
  if (!leaderId) return false;
  return !!s.leaders[leaderId]?.traits.includes(trait as never);
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Gurmata in force that forbids war between misls. */
export function mislPeaceInForce(s: GameState): boolean {
  return s.gurmatas.some((g) => g.passed && g.kind === 'misl_peace' && g.until >= s.turn);
}
