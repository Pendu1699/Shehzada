// Alliance unions: named leagues of houses that stand together.
//
// The misls had their own: the Dal Khalsa itself, and the Budha and Taruna
// Dals; later alliances bound houses by marriage and treaty. A union here is a
// league the player founds and invites others into. Its members are allies of
// one another, answer when any member is attacked, may raise men in one
// another's lands, and may send one another silver to build armies.

import { FACTION_BY_ID } from '../data/factions';
import { chronicle } from './chronicle';
import { atWar, clamp, isSikh, polityName } from './query';
import { chance } from './rng';
import type { FactionId, GameState } from './state';
import { alert } from './vassals';

export interface Union {
  id: string;
  name: string;
  leader: FactionId;
  members: FactionId[];
  founded: number;
}

export const UNION_NAMES = ['Dal Khalsa League', 'Union of the Five Rivers', 'Covenant of the Akal Takht', 'League of the Doabs', 'Brotherhood of the Nishan', 'Majha–Malwa Union'];

export const unionOf = (s: GameState, f: FactionId): Union | undefined => (s.unions ?? []).find((u) => u.members.includes(f));

export function foundUnion(s: GameState, leader: FactionId, name: string): Union | null {
  if (unionOf(s, leader)) return null;
  s.unions ??= [];
  const u: Union = { id: `U${s.unions.length + 1}_${s.turn}`, name: name.trim().slice(0, 40) || UNION_NAMES[0], leader, members: [leader], founded: s.turn };
  s.unions.push(u);
  chronicle(s, 'treaty', `${polityName(s, leader).replace(/^t/, 'T')} founded the ${u.name}.`, { faction: leader, weight: 3 });
  return u;
}

/** Chance that `target` accepts an invitation into the player's union. */
export function joinChance(s: GameState, target: FactionId): number {
  const p = s.playerFaction;
  const u = unionOf(s, p);
  const t = s.factions[target];
  if (!u || !t?.alive || unionOf(s, target) || target === 'company' || atWar(s, p, target)) return 0;
  if (FACTION_BY_ID[target]?.distant) return 0;
  const me = s.factions[p];
  const att = t.attitude[p] ?? 0;
  let c = 0.04 + att / 160;
  if (isSikh(target) && isSikh(p)) c += 0.08 + (me.piri - 50) / 250;
  if (me.relations[target] === 'alliance') c += 0.12;
  // A common enemy is the strongest argument for a league.
  if (Object.keys(me.relations).some((x) => atWar(s, p, x) && atWar(s, target, x))) c += 0.12;
  // Houses follow a strong leader, and do not bow to a weak one.
  c += clamp((me.miri - t.miri) / 160, -0.35, 0.15);
  // A crowded league is less attractive.
  c -= Math.max(0, u.members.length - 3) * 0.06;
  return clamp(c * (FACTION_BY_ID[p]?.mods.diplomacy ?? 1), 0.02, 0.75);
}

export function joinUnion(s: GameState, u: Union, f: FactionId): void {
  if (u.members.includes(f)) return;
  u.members.push(f);
  for (const m of u.members) {
    if (m === f) continue;
    s.factions[m].relations[f] = 'alliance';
    s.factions[f].relations[m] = 'alliance';
    s.factions[m].attitude[f] = clamp((s.factions[m].attitude[f] ?? 0) + 10, -100, 100);
  }
  chronicle(s, 'treaty', `${polityName(s, f).replace(/^t/, 'T')} joined the ${u.name}.`, { faction: u.leader, weight: 3 });
}

export function leaveUnion(s: GameState, f: FactionId): void {
  const u = unionOf(s, f);
  if (!u) return;
  u.members = u.members.filter((m) => m !== f);
  for (const m of u.members) {
    if (s.factions[m].relations[f] === 'alliance') s.factions[m].relations[f] = 'peace';
    if (s.factions[f].relations[m] === 'alliance') s.factions[f].relations[m] = 'peace';
  }
  if (u.leader === f) u.leader = u.members[0];
  if (!u.members.length) s.unions = (s.unions ?? []).filter((x) => x !== u);
}

/** Send silver to a union member so it can raise men. */
export function sendAid(s: GameState, to: FactionId, amount: number): string | null {
  const p = s.playerFaction;
  const u = unionOf(s, p);
  if (!u || !u.members.includes(to) || to === p) return null;
  const me = s.factions[p];
  if (amount <= 0 || me.treasury < amount) return null;
  me.treasury -= amount;
  s.factions[to].treasury += amount;
  s.factions[to].flags.aid_for_army = Number(s.factions[to].flags.aid_for_army ?? 0) + amount;
  s.factions[to].attitude[p] = clamp((s.factions[to].attitude[p] ?? 0) + Math.min(15, amount / 4), -100, 100);
  return `${amount} thousand rupees sent to ${polityName(s, to)} to raise men.`;
}

/** Each turn: members answer when one of them is attacked; the dead and the hostile drop out. */
export function unionTurn(s: GameState): void {
  for (const u of [...(s.unions ?? [])]) {
    for (const m of [...u.members]) if (!s.factions[m]?.alive) leaveUnion(s, m);
    if (!s.unions?.includes(u)) continue;
    // Members at war with one another cannot stay in one league.
    if (u.id === 'dal_khalsa') continue; // handled in panth.ts: the misls quarrel and still ride together
    for (const a of u.members) for (const b of u.members) if (a !== b && atWar(s, a, b)) leaveUnion(s, b === u.leader ? a : b);
    // Call to arms: the enemies of one are the enemies of all.
    const enemies = new Set<FactionId>();
    for (const m of u.members) for (const [g, r] of Object.entries(s.factions[m].relations)) if (r === 'war' && s.factions[g]?.alive && !u.members.includes(g)) enemies.add(g);
    for (const e of enemies)
      for (const m of u.members) {
        if (atWar(s, m, e)) continue;
        // The player chooses its own wars; computer members answer the call.
        if (m === s.playerFaction) continue;
        if (!chance(s, 0.6)) continue;
        s.factions[m].relations[e] = 'war';
        s.factions[e].relations[m] = 'war';
        if (u.members.includes(s.playerFaction)) alert(s, { kind: 'war', faction: m, title: `${polityName(s, m).replace(/^t/, 'T')} answers the call`, text: `A member of the ${u.name} rides against ${polityName(s, e)}.` });
      }
  }
}
