import { factionMods } from './reforms';
// Diplomacy: alliances, marriages, tribute and safe passage.
// Marriage alliances were central to misl politics (the Kanhaiya–Sukerchakia match
// through Sada Kaur is the famous example); the Kanhaiya misl is better at them.

import { FACTION_BY_ID } from '../data/factions';
import { chronicle } from './chronicle';
import { neighbors } from './map';
import { changePiri } from './miripiri';
import { atWar, clamp, isSikh, polityName, regionsOf } from './query';
import { chance } from './rng';
import type { FactionId, GameState } from './state';

export type DiploKind = 'alliance' | 'marriage' | 'tribute' | 'passage' | 'subsidy' | 'break_alliance';

export const DIPLO_INFO: Record<DiploKind, { name: string; detail: string; cost: number }> = {
  alliance: { name: 'Propose alliance', detail: 'Allies fight beside you and their armies are friends in your lands.', cost: 0 },
  marriage: { name: 'Marriage alliance', detail: 'A marriage between the houses. Costs a dowry and feasts; warms relations greatly, often to alliance.', cost: 30 },
  tribute: { name: 'Demand tribute', detail: 'A weaker neighbour may agree to pay you each season — or take offence.', cost: 0 },
  passage: { name: 'Ask safe passage', detail: 'Leave to march through their lands without war.', cost: 0 },
  subsidy: {
    name: 'Ask for silver',
    detail: 'Ask a richer friend for a subsidy, as the Company paid its allies and the Afghan kings paid theirs. Allies and those who like you give more readily; it cools their regard a little. Once every two years.',
    cost: 0,
  },
  break_alliance: { name: 'End the alliance', detail: 'Release both houses from their promises.', cost: 0 },
};

function borders(s: GameState, a: FactionId, b: FactionId): boolean {
  return regionsOf(s, a).some((r) => neighbors(r).some((e) => s.regions[e.to].owner === b));
}

export function diploChance(s: GameState, kind: DiploKind, target: FactionId): number {
  const p = s.playerFaction;
  const me = s.factions[p];
  const them = s.factions[target];
  if (!them?.alive || target === p) return 0;
  if (atWar(s, p, target) && kind !== 'tribute') return 0;
  const att = them.attitude[p] ?? 0;
  const dip = factionMods(s, p).diplomacy ?? 1;
  const kin = isSikh(p) && isSikh(target) ? 0.15 : 0;
  const ratio = me.miri / Math.max(1, them.miri);
  let c = 0;
  switch (kind) {
    case 'alliance':
      c = 0.15 + att / 150 + kin + (me.piri - 50) / 200;
      // A shared enemy draws houses together.
      if (Object.keys(me.relations).some((x) => me.relations[x] === 'war' && them.relations[x] === 'war')) c += 0.25;
      break;
    case 'marriage':
      // Marriage alliances joined Sikh houses with each other and with the hill rajas.
      if (!isSikh(target) && !['hill_states', 'kangra', 'jammu'].includes(target)) return 0;
      c = (0.35 + att / 200 + kin) * (factionMods(s, p).marriage ?? 1);
      break;
    case 'tribute':
      if (!borders(s, p, target) || ratio < 1.5) return 0;
      c = 0.1 + (ratio - 1.5) * 0.25 - (FACTION_BY_ID[target]?.personality.honour ?? 0.5) * 0.1;
      break;
    case 'passage':
      c = 0.3 + att / 120 + kin;
      break;
    case 'subsidy': {
      const last = Number(me.flags[`subsidy_${target}`] ?? -99);
      if (s.turn - last < 4 || them.treasury < 40 || them.treasury < me.treasury) return 0;
      c = 0.1 + att / 120 + kin + (me.relations[target] === 'alliance' ? 0.3 : 0);
      // A shared enemy opens the purse.
      if (Object.keys(me.relations).some((x) => me.relations[x] === 'war' && them.relations[x] === 'war')) c += 0.2;
      break;
    }
    case 'break_alliance':
      return s.factions[p].relations[target] === 'alliance' ? 1 : 0;
  }
  return clamp(c * dip, 0.02, 0.92);
}

/** What a subsidy from them would be. */
export function subsidyAmount(s: GameState, target: FactionId): number {
  const them = s.factions[target];
  const ally = s.factions[s.playerFaction].relations[target] === 'alliance';
  return Math.max(5, Math.min(120, Math.round(them.treasury * (ally ? 0.2 : 0.12))));
}

export function diplomacy(s: GameState, kind: DiploKind, target: FactionId): { ok: boolean; text: string } | null {
  const p = s.playerFaction;
  const me = s.factions[p];
  const them = s.factions[target];
  if (!them?.alive) return null;
  if (me.flags[`diplo_${target}_${s.turn}`]) return null;
  const cost = DIPLO_INFO[kind].cost;
  if (me.treasury < cost) return null;
  const pr = diploChance(s, kind, target);
  if (pr <= 0) return null;
  me.flags[`diplo_${target}_${s.turn}`] = true;
  me.treasury -= cost;
  const ok = chance(s, pr);
  const name = polityName(s, target);
  const setRel = (r: 'alliance' | 'peace') => {
    me.relations[target] = r;
    them.relations[p] = r;
  };
  switch (kind) {
    case 'alliance':
      if (ok) {
        setRel('alliance');
        them.attitude[p] = clamp((them.attitude[p] ?? 0) + 15, -100, 100);
        chronicle(s, 'treaty', `${polityName(s, p)} and ${name} swore an alliance.`, { faction: p, weight: 2 });
        return { ok, text: `${name} agreed to the alliance.` };
      }
      them.attitude[p] = clamp((them.attitude[p] ?? 0) - 3, -100, 100);
      return { ok, text: `${name} declined the alliance.` };
    case 'marriage':
      if (ok) {
        them.attitude[p] = clamp((them.attitude[p] ?? 0) + 40 * (factionMods(s, p).marriage ?? 1), -100, 100);
        me.attitude[target] = clamp((me.attitude[target] ?? 0) + 30, -100, 100);
        me.flags[`marriage_${target}`] = s.turn;
        if ((them.attitude[p] ?? 0) > 45) setRel('alliance');
        chronicle(s, 'treaty', `A marriage joined the houses of ${polityName(s, p)} and ${name}.`, { faction: p, weight: 3 });
        return { ok, text: `The marriage was agreed; the baraat rode with drums.` };
      }
      return { ok, text: `${name} found reasons to delay the match.` };
    case 'tribute':
      if (ok) {
        const amt = Math.max(3, Math.round(Math.abs(them.lastIncome) * 0.15));
        me.flags[`tribute_from_${target}`] = amt;
        them.flags[`tribute_to_${p}`] = amt;
        if (isSikh(p) && isSikh(target)) changePiri(s, p, -1, 'Exacting tribute from fellow Sikhs');
        return { ok, text: `${name} will pay ${amt} thousand rupees each season.` };
      }
      them.attitude[p] = clamp((them.attitude[p] ?? 0) - 20, -100, 100);
      return { ok, text: `${name} refused, and will not forget the demand.` };
    case 'passage':
      if (ok) {
        me.flags[`passage_${target}`] = true;
        return { ok, text: `${name} grants your armies passage.` };
      }
      return { ok, text: `${name} refused passage.` };
    case 'subsidy': {
      me.flags[`subsidy_${target}`] = s.turn;
      if (ok) {
        const amt = subsidyAmount(s, target);
        them.treasury -= amt;
        me.treasury += amt;
        them.attitude[p] = clamp((them.attitude[p] ?? 0) - 6, -100, 100);
        return { ok, text: `${name} sent ${amt} thousand rupees.` };
      }
      them.attitude[p] = clamp((them.attitude[p] ?? 0) - 3, -100, 100);
      return { ok, text: `${name} pleaded empty coffers.` };
    }
    case 'break_alliance':
      setRel('peace');
      them.attitude[p] = clamp((them.attitude[p] ?? 0) - 15, -100, 100);
      return { ok: true, text: `The alliance with ${name} is ended.` };
  }
}

/** Tribute ends when either side dies or war breaks out. */
export function tributeTurn(s: GameState): void {
  for (const f of Object.values(s.factions)) {
    for (const k of Object.keys(f.flags)) {
      if (!k.startsWith('tribute_to_')) continue;
      const g = k.slice(11);
      if (!s.factions[g]?.alive || !f.alive || atWar(s, f.id, g)) {
        delete f.flags[k];
        if (s.factions[g]) delete s.factions[g].flags[`tribute_from_${f.id}`];
      }
    }
  }
}
