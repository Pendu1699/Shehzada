// Puppets: houses that keep their own lands but answer to an overlord.
//
// The misl era was full of such arrangements — chiefs who paid nazrana and sent
// horse to a stronger neighbour, hill rajas who were "tributary" to Lahore, the
// Cis-Sutlej chiefs under the Company. A puppet is the overlord's ally, joins
// its wars and pays tribute at a rate the overlord sets. Heavier tribute and a
// strong puppet breed a desire for liberty; at 100 it rises.

import { FACTION_BY_ID } from '../data/factions';
import { chronicle } from './chronicle';
import { neighbors } from './map';
import { changePiri } from './miripiri';
import { atWar, clamp, isSikh, polityName, regionsOf } from './query';
import { chance } from './rng';
import type { FactionId, GameState } from './state';
import { transferRegion } from './conquest';

export type TributeLevel = 'light' | 'normal' | 'heavy';
export const TRIBUTE_RATE: Record<TributeLevel, number> = { light: 0.1, normal: 0.2, heavy: 0.35 };
export const ANNEX_AFTER = 10;

export interface Alert {
  turn: number;
  kind: 'war' | 'revolt' | 'unrest' | 'submission';
  faction?: FactionId;
  title: string;
  text: string;
}

export function alert(s: GameState, a: Omit<Alert, 'turn'>): void {
  s.alerts ??= [];
  s.alerts.push({ ...a, turn: s.turn });
  if (s.alerts.length > 60) s.alerts.splice(0, s.alerts.length - 60);
}

export const overlordOf = (s: GameState, f: FactionId) => s.factions[f]?.flags.overlord as FactionId | undefined;
export const vassalsOf = (s: GameState, f: FactionId) => Object.values(s.factions).filter((x) => x.alive && x.flags.overlord === f).map((x) => x.id);
export const tributeLevel = (s: GameState, f: FactionId): TributeLevel => (s.factions[f]?.flags.tribute_level as TributeLevel) ?? 'normal';
export const liberty = (s: GameState, f: FactionId) => Number(s.factions[f]?.flags.liberty ?? 0);

function borders(s: GameState, a: FactionId, b: FactionId): boolean {
  return regionsOf(s, a).some((r) => neighbors(r).some((e) => s.regions[e.to].owner === b));
}

/** The chance a house submits to the player as a puppet (0 if it is not possible at all). */
export function submissionChance(s: GameState, target: FactionId): number {
  const p = s.playerFaction;
  const me = s.factions[p];
  const them = s.factions[target];
  if (!them?.alive || target === p || overlordOf(s, target) || overlordOf(s, p) === target) return 0;
  if (FACTION_BY_ID[target]?.distant && !borders(s, p, target)) return 0;
  if (target === 'company' || them.sarkar) return 0;
  const war = atWar(s, p, target);
  if (!war && !borders(s, p, target)) return 0;
  const ratio = me.miri / Math.max(1, them.miri);
  if (ratio < (war ? 1.6 : 2.2)) return 0;
  const att = them.attitude[p] ?? 0;
  const honour = FACTION_BY_ID[target]?.personality.honour ?? 0.5;
  let c = 0.05 + (ratio - 2) * 0.16 + att / 300 - honour * 0.1;
  if (war) c += 0.15 + Math.min(0.25, Number(them.flags.lost_regions ?? 0) * 0.04);
  if (isSikh(target) && isSikh(p)) c += (me.piri - 50) / 200;
  return clamp(c * (FACTION_BY_ID[p]?.mods.diplomacy ?? 1), 0.02, 0.85);
}

/** Make `target` a puppet of `over`. */
export function makeVassal(s: GameState, over: FactionId, target: FactionId): void {
  const t = s.factions[target];
  const o = s.factions[over];
  t.flags.overlord = over;
  t.flags.tribute_level = 'normal';
  t.flags.liberty = 20;
  t.flags.vassal_since = s.turn;
  t.relations[over] = 'alliance';
  o.relations[target] = 'alliance';
  // A puppet's wars and friendships follow its overlord's.
  for (const g of Object.keys(t.relations)) if (g !== over && atWar(s, target, g) && !atWar(s, over, g)) {
    t.relations[g] = 'peace';
    if (s.factions[g]) s.factions[g].relations[target] = 'peace';
  }
  if (isSikh(over) && isSikh(target)) changePiri(s, over, -2, `Making the ${FACTION_BY_ID[target]?.name} a puppet`);
  chronicle(s, 'treaty', `${polityName(s, target)} submitted to ${polityName(s, over)} and became its tributary.`, { faction: over, weight: 4 });
}

export function release(s: GameState, target: FactionId): void {
  const t = s.factions[target];
  const over = overlordOf(s, target);
  delete t.flags.overlord;
  delete t.flags.liberty;
  delete t.flags.vassal_since;
  delete t.flags.tribute_level;
  if (over) {
    t.attitude[over] = clamp((t.attitude[over] ?? 0) + 20, -100, 100);
    t.relations[over] = 'peace';
    if (s.factions[over]) s.factions[over].relations[target] = 'peace';
  }
}

export const canAnnex = (s: GameState, target: FactionId) =>
  overlordOf(s, target) === s.playerFaction && s.turn - Number(s.factions[target].flags.vassal_since ?? s.turn) >= ANNEX_AFTER && liberty(s, target) < 35;

export function annexCost(s: GameState, target: FactionId): number {
  return Math.round(30 + regionsOf(s, target).length * 15);
}

/** Take a loyal puppet's lands into your own realm. */
export function annex(s: GameState, target: FactionId): string | null {
  const p = s.playerFaction;
  if (!canAnnex(s, target)) return null;
  const cost = annexCost(s, target);
  if (s.factions[p].treasury < cost) return null;
  s.factions[p].treasury -= cost;
  for (const r of regionsOf(s, target)) transferRegion(s, r, p, 55);
  for (const a of Object.values(s.armies)) if (a.owner === target) a.owner = p;
  for (const l of Object.values(s.leaders)) if (l.faction === target && l.alive) l.faction = p;
  s.factions[target].alive = false;
  if (isSikh(target)) changePiri(s, p, -1, `Absorbing the ${FACTION_BY_ID[target]?.name}`);
  chronicle(s, 'conquest', `The ${FACTION_BY_ID[target]?.name} lands were joined to ${polityName(s, p)}.`, { faction: p, weight: 5 });
  return `The lands of ${polityName(s, target)} are now yours.`;
}

/** Each turn: tribute flows, wars are shared, liberty desire moves; puppets may revolt. */
export function vassalTurn(s: GameState): void {
  for (const t of Object.values(s.factions)) {
    const over = t.flags.overlord as FactionId | undefined;
    if (!over) continue;
    const o = s.factions[over];
    if (!t.alive || !o?.alive) {
      release(s, t.id);
      continue;
    }
    // (Tribute itself is reckoned in each house's income: economy.ts.)
    const rate = TRIBUTE_RATE[tributeLevel(s, t.id)];
    // Shared wars: the puppet's levies ride with its overlord.
    for (const g of Object.keys(o.relations)) {
      if (g === t.id || !s.factions[g]?.alive) continue;
      if (o.relations[g] === 'war' && t.relations[g] !== 'war') {
        t.relations[g] = 'war';
        s.factions[g].relations[t.id] = 'war';
      }
    }
    t.relations[over] = 'alliance';
    o.relations[t.id] = 'alliance';
    // Liberty desire.
    const ratio = t.miri / Math.max(1, o.miri);
    let d = rate * 40 - 5 + ratio * 8 - (t.attitude[over] ?? 0) / 30;
    if (isSikh(t.id) && isSikh(over)) d -= (o.piri - 50) / 15;
    if (over === s.playerFaction && s.factions[over].piri < 35) d += 2;
    const before = liberty(s, t.id);
    const now = clamp(before + d, 0, 100);
    t.flags.liberty = Math.round(now);
    if (over === s.playerFaction && before < 75 && now >= 75)
      alert(s, { kind: 'unrest', faction: t.id, title: `${polityName(s, t.id)} grows restless`, text: `Liberty desire is at ${Math.round(now)}. Lower its tribute, or it will rise against you.` });
    if (now >= 100 && ratio > 0.25 && chance(s, 0.6)) {
      release(s, t.id);
      t.relations[over] = 'war';
      o.relations[t.id] = 'war';
      t.attitude[over] = -50;
      chronicle(s, 'event', `${polityName(s, t.id)} threw off the overlordship of ${polityName(s, over)}.`, { faction: over, weight: 4 });
      if (over === s.playerFaction) alert(s, { kind: 'revolt', faction: t.id, title: `${polityName(s, t.id)} has risen!`, text: 'Your puppet has stopped paying tribute and declared war on you.' });
    }
  }
}

/** The computer's great houses take puppets too. */
export function aiVassals(s: GameState, f: FactionId): void {
  const fs = s.factions[f];
  if (!fs?.alive || f === s.playerFaction || FACTION_BY_ID[f]?.distant || overlordOf(s, f)) return;
  if (!chance(s, 0.05)) return;
  for (const g of Object.keys(fs.relations)) {
    const gs = s.factions[g];
    if (!gs?.alive || g === s.playerFaction || overlordOf(s, g) || gs.sarkar || g === 'company') continue;
    if (fs.relations[g] !== 'war' || fs.miri < gs.miri * 2.5) continue;
    if (chance(s, 0.3)) {
      makeVassal(s, f, g);
      return;
    }
  }
}
