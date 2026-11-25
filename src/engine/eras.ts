// The four ages of the century, and the passage from one to the next.
//
// A game started in 1748 runs on through 1765, 1799 and 1839 without a break:
// the four scenarios are also the four ages of one story. When an age turns,
// the turn's report opens with an era page — what changed, who now holds the
// great cities, and what the coming age will bring if history holds — and the
// age's very name follows the player's own story.

import { FACTION_BY_ID } from '../data/factions';
import { polityName, regionsOf, year } from './query';
import type { GameState } from './state';

export interface EraDef {
  id: string;
  from: number;
}

export const ERAS: EraDef[] = [
  { id: 'ghallughara', from: 1748 },
  { id: 'misl_raj', from: 1765 },
  { id: 'sarkar', from: 1799 },
  { id: 'twilight', from: 1839 },
  { id: 'beyond', from: 1849 },
];

export interface EraPage {
  id: string;
  title: string;
  years: string;
  lines: string[];
  ahead: string;
}

export function eraOf(y: number): EraDef {
  let e = ERAS[0];
  for (const x of ERAS) if (y >= x.from) e = x;
  return e;
}

const sarkarOf = (s: GameState) => Object.values(s.factions).find((f) => f.sarkar && f.alive)?.id;
const houseName = (f: string) => FACTION_BY_ID[f]?.name ?? f;

/** The age's name, as the player's own century has shaped it. */
export function eraTitle(s: GameState, id = eraOf(year(s)).id): string {
  const sk = sarkarOf(s);
  const p = s.playerFaction;
  switch (id) {
    case 'ghallughara':
      return 'The Age of Ghallugharas';
    case 'misl_raj':
      if (sk) return `The Sarkar of the ${houseName(sk)}`;
      return 'The Misl Raj';
    case 'sarkar':
      if (s.factions[p]?.flags.confederacy && !sk) return 'The Confederate Khalsa';
      if (sk && sk !== 'sukerchakia') return `The ${houseName(sk)} Sarkar`;
      return 'The Lion of Lahore';
    case 'twilight':
      if (!sk) return 'The Red Ink';
      if (s.factions[sk].miri > (s.factions.company?.miri ?? 0) * 1.2) return 'The Two Empires';
      return 'Twilight of the Sarkar';
    case 'beyond':
      if (sk && sk === p) return 'The Khalsa Raj Endures';
      return 'The Unwritten Years';
  }
  return '';
}

function holder(s: GameState, r: string): string {
  const o = s.regions[r]?.owner;
  return o ? polityName(s, o) : 'its own chiefs';
}

const AHEAD: Record<string, string> = {
  misl_raj:
    'If history holds: the Afghan kings will come down once or twice more and then stop coming. The misls will divide the Punjab among themselves, and quarrel over it. In the east the Company has just been granted Bengal.',
  sarkar:
    'If history holds: a young Sukerchakia will take Lahore and make one state of the Punjab, from the Sutlej to the Khyber. The Company will reach the Sutlej in 1809 and stop there, for a time.',
  beyond:
    'History has nothing more to say: from here no one knows. The Company, the Afghans and every court of Hindustan will act as their rulers choose — and so will you.',
  twilight:
    'If history holds: the Maharaja will die, his heirs will die after him, and the army will rule the court. The Company waits across the Sutlej with its regiments counted.',
};

/** Called each turn: returns the era page if an age has just begun. */
export function eraTransition(s: GameState): EraPage | null {
  const y = year(s);
  const era = eraOf(y);
  const key = `era_${era.id}`;
  const p = s.playerFaction;
  const fs = s.factions[p];
  if (s.firedEvents[key] !== undefined) return null;
  s.firedEvents[key] = s.turn;
  // The age a game starts in is not announced: the scenario already did that.
  if (era.from <= s.startYear) {
    fs.flags.era_start_regions = regionsOf(s, p).length;
    return null;
  }
  const before = Number(fs.flags.era_start_regions ?? 0);
  const now = regionsOf(s, p).length;
  fs.flags.era_start_regions = now;
  const sk = sarkarOf(s);
  const lines: string[] = [];
  lines.push(
    fs.alive
      ? `${polityName(s, p).replace(/^t/, 'T')} held ${before} ${before === 1 ? 'land' : 'lands'} when the last age began, and holds ${now} now. Miri ${fs.miri}, Piri ${Math.round(fs.piri)}.`
      : `The banner of ${polityName(s, p)} has fallen.`,
  );
  lines.push(sk ? `${polityName(s, sk).replace(/^t/, 'T')} rules at Lahore${sk === p ? ' — your house.' : '.'}` : `No one rules the Punjab alone. Lahore is held by ${holder(s, 'lahore')}.`);
  if (fs.flags.early_sarkar && sk === p) lines.push('Your Sarkar came a generation before history’s, and the century has bent around it.');
  if (fs.flags.confederacy) lines.push('The misls hold to the union sworn before the Akal Takht: no king, one Khalsa.');
  lines.push(`Delhi is held by ${holder(s, 'delhi')}; Kabul by ${holder(s, 'kabul')}; Multan by ${holder(s, 'multan')}.`);
  const company = regionsOf(s, 'company').length;
  if (company) lines.push(`The East India Company holds ${company} lands of the subcontinent.`);
  return { id: era.id, title: eraTitle(s, era.id), years: `${era.from} – ${ERAS[ERAS.indexOf(era) + 1]?.from ?? 1849}`, lines, ahead: AHEAD[era.id] ?? '' };
}
