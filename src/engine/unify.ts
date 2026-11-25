// Unifying the Punjab: proclaiming the Sikh Empire (the Sarkar-i-Khalsa).
//
// Two roads, both hard:
//  * Proclamation — you take the title yourself. You must hold Lahore and
//    Amritsar and much of the Punjab, be strong (Miri) and trusted (Piri) with
//    the two in balance. The other misls keep their lands and their pride.
//  * The Sarbat Khalsa — you ask the assembly before the Akal Takht to name you.
//    It asks still more of your Piri and needs two-thirds of the assembly's
//    weight. The misls that vote for you join the empire, lands and armies.

import { FACTION_BY_ID } from '../data/factions';
import { chronicle } from './chronicle';
import { changePiri } from './miripiri';
import { isSikh, regionsOf } from './query';
import type { FactionId, GameState } from './state';

export interface Requirement {
  label: string;
  ok: boolean;
  detail: string;
}

export const UNIFY_LANDS = 15;
export const UNIFY_MIRI = 65;
export const UNIFY_PIRI = 60;
export const GURMATA_MIRI = 55;
export const GURMATA_PIRI = 72;

const sarkarOf = (s: GameState) => Object.values(s.factions).find((f) => f.sarkar && f.alive)?.id;

/** What it takes to unify the Punjab, and how far this house has come. */
export function unifyRequirements(s: GameState, f: FactionId, via: 'proclamation' | 'gurmata'): Requirement[] {
  const fs = s.factions[f];
  const lands = regionsOf(s, f).length;
  const miriNeed = via === 'gurmata' ? GURMATA_MIRI : UNIFY_MIRI;
  const piriNeed = via === 'gurmata' ? GURMATA_PIRI : UNIFY_PIRI;
  const sk = sarkarOf(s);
  const reqs: Requirement[] = [
    { label: 'No one else rules the Punjab', ok: !sk || sk === f, detail: sk && sk !== f ? `${FACTION_BY_ID[sk]?.name} already holds the title.` : 'The throne of Lahore is empty.' },
    { label: 'Hold Lahore', ok: s.regions.lahore.owner === f, detail: 'The capital of the Punjab.' },
    { label: 'Hold Amritsar', ok: s.regions.amritsar.owner === f, detail: 'The heart of the Panth.' },
    { label: `Hold ${via === 'gurmata' ? UNIFY_LANDS - 3 : UNIFY_LANDS} lands`, ok: lands >= (via === 'gurmata' ? UNIFY_LANDS - 3 : UNIFY_LANDS), detail: `You hold ${lands}.` },
    { label: `Miri ${miriNeed} or more`, ok: fs.miri >= miriNeed, detail: `Yours is ${fs.miri}.` },
    { label: `Piri ${piriNeed} or more`, ok: fs.piri >= piriNeed, detail: `Yours is ${Math.round(fs.piri)}.` },
    { label: 'Miri and Piri in balance', ok: Math.abs(fs.miri - fs.piri) <= 20, detail: 'Neither sword more than 20 ahead of the other.' },
  ];
  if (via === 'gurmata') reqs.push({ label: 'The Sarbat Khalsa is sitting', ok: !fs.sarkar && reqs[0].ok, detail: 'Propose it at Vaisakhi or Diwali, before the Akal Takht.' });
  return reqs;
}

export const canUnify = (s: GameState, f: FactionId, via: 'proclamation' | 'gurmata') => isSikh(f) && !s.factions[f].sarkar && unifyRequirements(s, f, via).every((r) => r.ok);

/** Found the Sikh Empire. `joiners` are misls that enter it of their own will. */
export function proclaimEmpire(s: GameState, f: FactionId, via: 'proclamation' | 'gurmata' | 'history', joiners: FactionId[] = []): string {
  const fs = s.factions[f];
  fs.sarkar = true;
  fs.flags.empire_via = via;
  fs.flags.empire_turn = s.turn;
  s.firedEvents.sarkar_turn = s.turn;
  fs.legend += via === 'gurmata' ? 14 : 10;
  if (via === 'gurmata') changePiri(s, f, 6, 'Named by the Sarbat Khalsa to rule the Punjab');
  if (via === 'proclamation') changePiri(s, f, -2, 'Taking the crown of the Punjab by your own hand');
  for (const g of joiners) {
    const gs = s.factions[g];
    if (!gs?.alive || g === f) continue;
    for (const r of Object.values(s.regions)) if (r.owner === g) r.owner = f;
    for (const a of Object.values(s.armies)) if (a.owner === g) a.owner = f;
    for (const l of Object.values(s.leaders)) if (l.faction === g && l.alive) l.faction = f;
    fs.treasury += Math.round(gs.treasury * 0.6);
    gs.alive = false;
    chronicle(s, 'treaty', `The ${FACTION_BY_ID[g]?.name} misl joined the Sikh Empire of its own will.`, { faction: f, weight: 5 });
  }
  // The misls that stayed out watch the new throne warily.
  for (const g of Object.keys(s.factions)) if (g !== f && isSikh(g) && s.factions[g].alive) s.factions[g].attitude[f] = (s.factions[g].attitude[f] ?? 0) - (via === 'proclamation' ? 25 : 10);
  const text =
    via === 'gurmata'
      ? `Before the Akal Takht the Sarbat Khalsa named the ${FACTION_BY_ID[f]?.name} house to rule the Punjab. ${joiners.length ? `${joiners.length} ${joiners.length === 1 ? 'misl' : 'misls'} joined the new empire of their own will.` : ''} Coin was struck in the name of the Gurus: the Sikh Empire was born.`
      : `At Lahore the ${FACTION_BY_ID[f]?.name} house proclaimed the Sikh Empire. Coin was struck in the name of the Gurus. The other misls kept their lands — and their counsel.`;
  chronicle(s, 'event', text, { faction: f, weight: 10, region: 'lahore' });
  return text;
}
