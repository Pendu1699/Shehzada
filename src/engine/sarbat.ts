// The Sarbat Khalsa and its gurmatas.
//
// Twice a year, at Vaisakhi and Diwali, the misl leaders gathered at Amritsar before
// the Akal Takht. Resolutions (gurmatas) passed there bound every misl. After the
// Sarkar-i-Khalsa was established the assembly was sidelined; the player may choose
// to keep calling it, at some cost to their freedom of action, for a great deal of Piri.

import { FACTION_BY_ID } from '../data/factions';
import { REGION_BY_ID } from '../data/regions';
import { chronicle } from './chronicle';
import { changePiri } from './miripiri';
import { armiesOf, armyMen, factionName, isSikh, mislPeaceInForce, polityName } from './query';
import { chance } from './rng';
import type { FactionId, GameState, Gurmata } from './state';
import { newId } from './state';

export type GurmataKind = 'unite_vs' | 'misl_peace' | 'rebuild' | 'coin' | 'recognise' | 'langar_all';

export const GURMATA_INFO: Record<GurmataKind, { name: string; detail: string; duration: number }> = {
  unite_vs: { name: 'Unite the Dal Khalsa', detail: 'Every misl takes the field together against a common enemy. Misls become allies for a year.', duration: 2 },
  misl_peace: { name: 'Peace among the misls', detail: 'War between misls is forbidden for a year. Breaking it costs heavy Piri.', duration: 2 },
  rebuild: { name: 'Rebuild the Harmandir Sahib', detail: 'Every misl gives a share of its treasury to raise the Harmandir again.', duration: 1 },
  coin: { name: 'Strike coins in the Khalsa’s name', detail: 'The holder of Lahore strikes coins in the name of the Gurus.', duration: 1 },
  recognise: { name: 'Recognise a leader of the Dal Khalsa', detail: 'The Panth names one sardar to lead the combined army.', duration: 6 },
  langar_all: { name: 'Langar in every misl’s land', detail: 'Every misl keeps a langar in its chief town for a year.', duration: 2 },
};

export function gurmataTitle(s: GameState, kind: GurmataKind, target?: string): string {
  switch (kind) {
    case 'unite_vs':
      return `Unite the Dal Khalsa against ${polityName(s, target)}`;
    case 'recognise':
      return `Recognise ${s.factions[target ?? '']?.chief ? s.leaders[s.factions[target!].chief!]?.name : factionName(target)} as leader of the Dal Khalsa`;
    default:
      return GURMATA_INFO[kind].name;
  }
}

/** The Sikh polities that sit in the assembly this season. */
export function assembly(s: GameState): FactionId[] {
  return Object.values(s.factions)
    .filter((f) => f.alive && isSikh(f.id) && (!f.sarkar || (f.id === s.playerFaction && f.convenesSarbat)))
    .filter((f) => f.id !== 'phulkian' || s.playerFaction === 'phulkian')
    .map((f) => f.id);
}

export function sarbatConvenes(s: GameState): boolean {
  const p = s.factions[s.playerFaction];
  if (!isSikh(s.playerFaction)) return false;
  if (p.sarkar && !p.convenesSarbat) return false;
  return assembly(s).length >= 2;
}

function aiVote(s: GameState, f: FactionId, kind: GurmataKind, target?: string): boolean {
  const fs = s.factions[f];
  const pers = FACTION_BY_ID[f]?.personality ?? { aggression: 0.5, caution: 0.5, zeal: 0.5, greed: 0.5, honour: 0.5 };
  switch (kind) {
    case 'unite_vs':
      return !(target && (fs.relations[target] === 'alliance' || (fs.attitude[target] ?? 0) > 30)) && pers.zeal + pers.honour > 0.7;
    case 'misl_peace': {
      const winning = Object.entries(fs.relations).some(([g, r]) => r === 'war' && isSikh(g) && fs.miri > (s.factions[g]?.miri ?? 0) * 1.3);
      return !winning || pers.honour > 0.8;
    }
    case 'rebuild':
      return fs.treasury > 15 || pers.zeal > 0.6;
    case 'coin':
      return true;
    case 'recognise':
      return target === f || (fs.attitude[target ?? ''] ?? 0) > 5 || (s.factions[target ?? '']?.piri ?? 0) > 60;
    case 'langar_all':
      return fs.treasury > 20 || pers.zeal > 0.6;
  }
}

function propose(s: GameState, kind: GurmataKind, proposer: FactionId, target?: string): Gurmata {
  const g: Gurmata = {
    id: newId(s, 'G'),
    kind,
    title: gurmataTitle(s, kind, target),
    proposer,
    target,
    until: s.turn + GURMATA_INFO[kind].duration,
    votesFor: [],
    votesAgainst: [],
  };
  for (const f of assembly(s)) {
    if (f === s.playerFaction) continue;
    let yes = aiVote(s, f, kind, target);
    // The proposer's standing sways the assembly.
    if (!yes && proposer !== s.playerFaction && chance(s, 0.15)) yes = true;
    if (!yes && proposer === s.playerFaction) {
      const pull = ((FACTION_BY_ID[proposer]?.mods.diplomacy ?? 1) - 1) + (s.factions[proposer].piri - 50) / 200 + ((s.factions[f].attitude[proposer] ?? 0) / 200);
      if (chance(s, Math.max(0, pull))) yes = true;
    }
    (yes ? g.votesFor : g.votesAgainst).push(f);
  }
  s.gurmatas.push(g);
  return g;
}

/** At the start of each turn: retire expired gurmatas and table new ones. */
export function runSarbatKhalsa(s: GameState): void {
  s.gurmatas = s.gurmatas.filter((g) => g.passed === true && g.until >= s.turn);
  if (!sarbatConvenes(s)) return;
  const members = assembly(s);
  const leaderMisl = members.filter((f) => f !== s.playerFaction).sort((a, b) => (FACTION_BY_ID[b].personality.zeal + s.factions[b].piri / 100) - (FACTION_BY_ID[a].personality.zeal + s.factions[a].piri / 100))[0];
  if (!leaderMisl) return;
  const active = (k: GurmataKind, t?: string) => s.gurmatas.some((g) => g.kind === k && (!t || g.target === t));
  // An invader in the land between the rivers.
  const core = new Set(['bari', 'rachna', 'bist_jalandhar', 'malwa', 'chaj']);
  const invaders = new Map<FactionId, number>();
  for (const a of Object.values(s.armies)) {
    if (isSikh(a.owner) || !core.has(REGION_BY_ID[a.region].doab)) continue;
    if (!members.some((m) => s.factions[m].relations[a.owner] === 'war')) continue;
    invaders.set(a.owner, (invaders.get(a.owner) ?? 0) + armyMen(a));
  }
  const worst = [...invaders.entries()].sort((a, b) => b[1] - a[1])[0];
  if (worst && worst[1] > 6000 && !active('unite_vs', worst[0])) propose(s, 'unite_vs', leaderMisl, worst[0]);
  const feuds = members.some((a) => members.some((b) => a !== b && s.factions[a].relations[b] === 'war'));
  if (feuds && !mislPeaceInForce(s) && !active('misl_peace')) propose(s, 'misl_peace', leaderMisl);
  if (s.josh.rebuild && !active('rebuild')) propose(s, 'rebuild', leaderMisl);
  const lahore = s.regions.lahore.owner;
  if (lahore && isSikh(lahore) && !s.factions[lahore].flags.khalsa_coin && !active('coin')) propose(s, 'coin', leaderMisl, lahore);
  if (s.turn % 12 === 3 && !active('recognise')) {
    const best = members.sort((a, b) => s.factions[b].piri + s.factions[b].miri - (s.factions[a].piri + s.factions[a].miri))[0];
    if (best) propose(s, 'recognise', leaderMisl, best);
  }
  if (s.turn % 9 === 5 && !active('langar_all')) propose(s, 'langar_all', leaderMisl);
}

/** The player's vote (or proposal, if `kind` is given). */
export function castVote(s: GameState, id: string, yes: boolean, kind?: string, target?: string): boolean {
  const p = s.playerFaction;
  if (kind) {
    if (!sarbatConvenes(s)) return false;
    if (s.factions[p].flags[`proposed_${s.turn}`]) return false;
    const k = kind as GurmataKind;
    if (!GURMATA_INFO[k]) return false;
    if ((k === 'unite_vs' || k === 'recognise') && !target) return false;
    s.factions[p].flags[`proposed_${s.turn}`] = true;
    const g = propose(s, k, p, target);
    g.votesFor.push(p);
    if (s.phase === 'orders') s.phase = 'sarbat';
    return true;
  }
  const g = s.gurmatas.find((x) => x.id === id && x.passed === undefined);
  if (!g) return false;
  g.votesFor = g.votesFor.filter((f) => f !== p);
  g.votesAgainst = g.votesAgainst.filter((f) => f !== p);
  (yes ? g.votesFor : g.votesAgainst).push(p);
  return true;
}

export function voteWeight(s: GameState, f: FactionId): number {
  return 10 + s.factions[f].miri + (f === s.playerFaction && FACTION_BY_ID[f]?.id === 'ahluwalia' ? 10 : 0);
}

export function tally(s: GameState, g: Gurmata): { yes: number; no: number } {
  const yes = g.votesFor.reduce((t, f) => t + voteWeight(s, f), 0);
  const no = g.votesAgainst.reduce((t, f) => t + voteWeight(s, f), 0);
  return { yes, no };
}

/** Disperse the assembly: count the votes and apply what passed. */
export function finishSarbat(s: GameState): string[] {
  const out: string[] = [];
  const p = s.playerFaction;
  for (const g of s.gurmatas) {
    if (g.passed !== undefined) continue;
    if (!g.votesFor.includes(p) && !g.votesAgainst.includes(p) && assembly(s).includes(p)) g.votesFor.push(p); // the player assents by default
    const t = tally(s, g);
    g.passed = t.yes > t.no;
    if (!g.passed) {
      out.push(`The gurmata “${g.title}” was not agreed.`);
      continue;
    }
    out.push(`Gurmata passed before the Akal Takht: ${g.title}.`);
    chronicle(s, 'gurmata', `The Sarbat Khalsa resolved: ${g.title}.`, { faction: g.proposer === p ? p : undefined, weight: g.kind === 'rebuild' || g.kind === 'unite_vs' ? 4 : 2 });
    applyGurmata(s, g);
    if (g.votesFor.includes(p)) changePiri(s, p, 0.5, 'Standing with the Sarbat Khalsa');
  }
  if (s.factions[p].sarkar && s.factions[p].convenesSarbat) changePiri(s, p, 1, 'The Maharaja still calls the Sarbat Khalsa');
  s.phase = 'orders';
  return out;
}

function applyGurmata(s: GameState, g: Gurmata) {
  const members = assembly(s);
  switch (g.kind as GurmataKind) {
    case 'unite_vs': {
      const t = g.target!;
      for (const f of members) {
        if (!s.factions[t]) continue;
        s.factions[f].relations[t] = 'war';
        s.factions[t].relations[f] = 'war';
        for (const h of members) if (h !== f && s.factions[f].relations[h] !== 'war') s.factions[f].relations[h] = 'alliance';
        for (const a of armiesOf(s, f)) a.morale = Math.min(100, a.morale + 10);
        s.factions[f].flags.dal_united = g.until;
      }
      break;
    }
    case 'misl_peace':
      for (const f of members)
        for (const h of members)
          if (f !== h && s.factions[f].relations[h] === 'war') {
            s.factions[f].relations[h] = 'peace';
            s.factions[h].relations[f] = 'peace';
          }
      break;
    case 'rebuild':
      if (s.josh.rebuild)
        for (const f of members) {
          const give = Math.max(0, Math.round(s.factions[f].treasury * 0.1));
          if (!give) continue;
          s.factions[f].treasury -= give;
          s.josh.rebuild.progress += give;
          s.josh.rebuild.contributors[f] = (s.josh.rebuild.contributors[f] ?? 0) + give;
        }
      break;
    case 'coin': {
      const owner = s.regions.lahore.owner;
      if (owner && isSikh(owner)) {
        s.factions[owner].flags.khalsa_coin = true;
        s.factions[owner].legend += 3;
      }
      for (const f of members) changePiri(s, f, 0.5, 'The Khalsa coin');
      break;
    }
    case 'recognise': {
      const t = g.target!;
      if (!s.factions[t]) break;
      s.factions[t].legend += 4;
      changePiri(s, t, 2, 'Recognised as leader of the Dal Khalsa');
      for (const f of members) if (f !== t) s.factions[f].attitude[t] = Math.min(100, (s.factions[f].attitude[t] ?? 0) + 10);
      s.factions[t].flags.dal_leader = g.until;
      break;
    }
    case 'langar_all':
      for (const f of members) {
        const seat = Object.values(s.regions).filter((r) => r.owner === f).sort((a, b) => REGION_BY_ID[b.id].population - REGION_BY_ID[a.id].population)[0];
        if (seat) seat.langar = true;
      }
      break;
  }
}

/** Has the player broken a gurmata in force by making peace with the common enemy? */
export function breaksUnity(s: GameState, target: FactionId): boolean {
  return s.gurmatas.some((g) => g.passed && g.kind === 'unite_vs' && g.target === target && g.until >= s.turn);
}
