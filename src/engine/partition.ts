// 1947: the end of the Raj, and the years after.
//
// When the Long Struggle reaches 1947 the player may ride on. The British hand
// power to two dominions, India and Pakistan, along the line Radcliffe drew
// through the Punjab; the princely states accede; and what the player holds is
// settled at the negotiating table:
//   • with land in hand — a sovereign Sikh state (named by the player), its
//     borders set by how strong the movement is; or an autonomous Sikh state
//     within the Indian Union;
//   • with no land — the movement goes on, as the Punjabi Suba movement, for a
//     Punjabi-speaking state within India (historically won in 1966).

import { OUTSIDE_RAJ as OUTSIDE, TO_PAKISTAN } from '../data/borders';
import { PUNJAB_REGION_IDS, REGION_BY_ID } from '../data/regions';
import { chronicle } from './chronicle';
import { transferRegion } from './conquest';
import { neighbors } from './map';
import { armiesIn, armyMen, clamp, regionsOf } from './query';
import type { FactionId, FactionState, GameState, RegionId } from './state';
import { newId } from './state';
import { avgSupport } from './struggle';
import { alert, makeVassal } from './vassals';

/** The Sikh princely states, which a strong Sikh state might draw in. */
const SIKH_PRINCES: FactionId[] = ['phulkian', 'kapurthala', 'ahluwalia'];

export const isTransferred = (s: GameState) => !!s.flags?.transferred;
/** Who governs the Punjab against the movement: the British, then India. */
export const rulerOf = (s: GameState): FactionId => (isTransferred(s) ? 'india' : 'company');

/** Make sure a faction exists in the state (older saves lack the newer ones). */
export function ensureFaction(s: GameState, id: FactionId): FactionState {
  if (!s.factions[id]) {
    s.factions[id] = {
      id,
      alive: false,
      treasury: 0,
      piri: 50,
      legend: 0,
      miri: 0,
      relations: {},
      attitude: {},
      sarkar: false,
      flags: {},
      foothold: 0,
      convenesSarbat: true,
      brittle: 0,
      lastIncome: 0,
    };
  }
  const f = s.factions[id];
  for (const g of Object.keys(s.factions)) {
    if (g === id) continue;
    f.relations[g] ??= 'peace';
    f.attitude[g] ??= 0;
    s.factions[g].relations[id] ??= 'peace';
    s.factions[g].attitude[id] ??= 0;
  }
  return f;
}

/** The British leave. Their lands, armies and the princely states pass to India and Pakistan. */
export function transferOfPower(s: GameState): void {
  if (isTransferred(s)) return;
  s.flags = { ...(s.flags ?? {}), transferred: true, transferred_turn: s.turn };
  const p = s.playerFaction;
  const india = ensureFaction(s, 'india');
  const pak = ensureFaction(s, 'pakistan');
  for (const d of [india, pak]) {
    d.alive = true;
    d.treasury = 400;
    d.piri = 50;
  }
  const sideOf = (r: RegionId): FactionId | null => (OUTSIDE.has(r) ? null : TO_PAKISTAN.has(r) ? 'pakistan' : 'india');
  // The Crown's own lands, and the unclaimed tribal and forest country inside British India.
  for (const r of Object.values(s.regions)) {
    if (r.owner === null && sideOf(r.id)) {
      r.owner = sideOf(r.id);
      continue;
    }
    if (r.owner !== 'company') continue;
    const to = sideOf(r.id);
    if (r.id === 'ceylon' || !to) {
      r.owner = null;
      continue;
    }
    r.owner = to;
    r.siege = undefined;
  }
  // The princely states accede (the Sikh princes may yet be drawn to a Sikh state: see settle()).
  for (const f of Object.values(s.factions)) {
    if (!f.alive || f.id === p || f.id === 'india' || f.id === 'pakistan' || f.id === 'company') continue;
    const lands = regionsOf(s, f.id);
    if (!lands.length) continue;
    if (lands.every((r) => OUTSIDE.has(r))) continue;
    for (const r of lands) {
      const to = sideOf(r);
      if (to) s.regions[r].owner = to;
    }
    for (const a of Object.values(s.armies)) if (a.owner === f.id) delete s.armies[a.id];
    f.alive = false;
    f.flags.acceded_to = sideOf(lands[0]) ?? 'india';
  }
  // The army of the Raj is divided between the dominions.
  for (const a of Object.values(s.armies)) {
    if (a.owner !== 'company') continue;
    const to = sideOf(a.region);
    if (!to || s.regions[a.region].owner === p) delete s.armies[a.id];
    else a.owner = to;
  }
  const company = s.factions.company;
  if (company) {
    company.alive = false;
    for (const f of Object.values(s.factions)) if (f.relations.company === 'war') f.relations.company = 'peace';
  }
  for (const L of Object.values(s.leaders)) if (L.faction === 'company') L.active = false;
  // The two dominions, born quarrelling over Kashmir.
  india.relations.pakistan = 'peace';
  pak.relations.india = 'peace';
  india.attitude.pakistan = -40;
  pak.attitude.india = -40;
  for (const d of [india, pak]) {
    d.relations[p] = 'peace';
    s.factions[p].relations[d.id] = 'peace';
  }
  chronicle(s, 'event', 'At midnight on the 14th of August 1947 the British Raj ended. The Punjab was cut in two along the Radcliffe line, and India and Pakistan were born.', { weight: 9 });
}

/* ── The settlement ─────────────────────────────────────────────────────── */

/** How hard the player can bargain: land, Amritsar and Lahore, men under arms, the world's ear, the people. */
export function bargainingPower(s: GameState): number {
  const p = s.playerFaction;
  const held = regionsOf(s, p);
  const men = Object.values(s.armies)
    .filter((a) => a.owner === p)
    .reduce((t, a) => t + armyMen(a), 0);
  return Math.round(
    held.length * 10 + (held.includes('amritsar') ? 20 : 0) + (held.includes('lahore') ? 20 : 0) + Math.min(30, men / 500) + (s.struggle?.voice ?? 0) / 2 + avgSupport(s) / 4,
  );
}

/** Lands next to the player's with many Sikhs, which a settlement could add. */
export function sikhNeighbours(s: GameState): RegionId[] {
  const p = s.playerFaction;
  const held = new Set(regionsOf(s, p));
  const out = new Set<RegionId>();
  for (const r of held)
    for (const e of neighbors(r)) {
      const def = REGION_BY_ID[e.to];
      if (!def || held.has(e.to) || !PUNJAB_REGION_IDS.has(e.to)) continue;
      if (def.faith.sikh >= 30) out.add(e.to);
    }
  return [...out];
}

/** The lands a sovereign settlement would give, by bargaining power. */
export function settlementLands(s: GameState, kind: 'sovereign' | 'autonomous'): { add: RegionId[]; princes: boolean } {
  const power = bargainingPower(s);
  if (kind === 'autonomous') return { add: sikhNeighbours(s), princes: false };
  if (power >= 60) return { add: sikhNeighbours(s), princes: power >= 90 };
  return { add: [], princes: false };
}

/** Settle the player's state after the transfer of power. */
export function settle(s: GameState, kind: 'sovereign' | 'autonomous', name: string): string {
  const p = s.playerFaction;
  const fs = s.factions[p];
  const { add, princes } = settlementLands(s, kind);
  for (const r of add) transferRegion(s, r, p, 60);
  // A strong state draws in the Sikh princes, as Patiala was courted in 1946–47.
  if (princes)
    for (const f of SIKH_PRINCES) {
      if (s.factions[f]?.flags.acceded_to !== 'india') continue;
      for (const r of PRINCELY_LANDS[f]) if (s.regions[r]?.owner === 'india') transferRegion(s, r, p, 60);
    }
  // British garrisons left inside the new borders march out.
  for (const r of regionsOf(s, p)) for (const a of armiesIn(s, r)) if (a.owner === 'india' || a.owner === 'pakistan') delete s.armies[a.id];
  fs.flags.state_name = name;
  fs.alive = true;
  if (kind === 'sovereign') {
    fs.sarkar = true;
    fs.flags.khalsa_state = true;
    for (const d of ['india', 'pakistan']) {
      fs.relations[d] = 'peace';
      s.factions[d].relations[p] = 'peace';
      s.factions[d].attitude[p] = d === 'india' ? -20 : -10;
    }
  } else {
    fs.flags.azad_punjab = true;
    makeVassal(s, 'india', p);
    fs.flags.tribute_level = 'light';
    fs.flags.liberty = 0;
  }
  // From here the game is a state's game again, not a movement's.
  s.mode = undefined;
  s.struggle = undefined;
  s.beyond = true;
  chronicle(
    s,
    'event',
    kind === 'sovereign'
      ? `${name} was proclaimed at Amritsar: a free Sikh state, with ${regionsOf(s, p).length} lands, among the new nations of 1947.`
      : `${name} joined the Indian Union as a self-governing Sikh state, with ${regionsOf(s, p).length} lands.`,
    { faction: p, weight: 10 },
  );
  alert(s, { kind: 'submission', title: kind === 'sovereign' ? `${name} is free` : `${name}, within India`, text: kind === 'sovereign' ? 'The game goes on: build the new state, keep the peace with India and Pakistan, and look after the refugees.' : 'The game goes on as a self-governing state within India. If you grow strong enough, you may yet go further.' });
  return kind === 'sovereign' ? `${name} is proclaimed, with ${regionsOf(s, p).length} lands.` : `${name} joins the Indian Union with ${regionsOf(s, p).length} lands.`;
}

/** The princely Sikh states' lands, as they were in 1947. */
const PRINCELY_LANDS: Record<string, RegionId[]> = {
  phulkian: ['patiala', 'nabha', 'jind', 'faridkot'],
  kapurthala: ['kapurthala'],
  ahluwalia: ['kapurthala'],
};

/** The movement without land goes on, for a Punjabi-speaking state within India. */
export function beginSuba(s: GameState): void {
  s.flags = { ...(s.flags ?? {}), suba: true };
  const st = s.struggle;
  if (!st) return;
  st.suba = st.suba ?? 0;
  st.heat = clamp(st.heat - 20, 0, 100);
  st.raid = undefined;
  st.arms = 0;
  chronicle(s, 'event', 'The movement went on in free India: for a Punjabi Suba, a state of the Punjabi language.', { faction: s.playerFaction, weight: 6 });
}

/** Called by "ride on" at the end of the Long Struggle. */
export function rideOnFrom1947(s: GameState): void {
  transferOfPower(s);
  const p = s.playerFaction;
  if (regionsOf(s, p).length) {
    s.pendingEvents.push({ id: newId(s, 'E'), eventId: 'st_settlement', ctx: {} });
    s.firedEvents.st_settlement = s.turn;
  } else beginSuba(s);
}

