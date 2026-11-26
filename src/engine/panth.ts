// The institutions of the Panth: the Dal Khalsa and the Akal Takht.
//
// The Dal Khalsa (1748) joined the misls' jathas into one army in two dals —
// the Budha Dal of the veterans and the Taruna Dal of the young. The misls
// quarrelled and fought among themselves, yet rode together against the Afghan
// and the Mughal for half a century. It passed into history as Ranjit Singh
// built his own army from 1799. In the game it is a standing union of the
// misls that answers any non-Sikh attack on a member, and survives quarrels.
//
// The Jathedar of the Akal Takht. While the Khalsa holds Amritsar the Takht
// is kept by a jathedar of the Panth's own choosing, in the eighteenth and
// early nineteenth centuries leaders of the Budha Dal and the Akali-Nihangs.
// When Amritsar is held by a power outside the Panth — or, after annexation,
// by the British, who appointed a sarbrah (government manager) from 1859 —
// the Takht is in the hands of a placeman, whom the Panth likened to the
// corrupt masands dismissed by Guru Gobind Singh Ji. That costs every Sikh
// house Piri, and Sikh lands their calm.

import { MISL_IDS } from '../data/factions';
import { chronicle } from './chronicle';
import { changePiri } from './miripiri';
import { atWar, isSikh, polityName, year } from './query';
import { chance } from './rng';
import type { FactionId, GameState } from './state';
import type { Union } from './unions';
import { alert } from './vassals';

export const DAL_KHALSA_ID = 'dal_khalsa';
export const DAL_KHALSA_ENDS = 1799;

export const isDalKhalsa = (u?: Union) => u?.id === DAL_KHALSA_ID;

/** Raise the Dal Khalsa at the start of a misl-era game. */
export function raiseDalKhalsa(s: GameState): void {
  if (year(s) >= DAL_KHALSA_ENDS) return;
  const members = MISL_IDS.filter((m) => m !== 'phulkian' && s.factions[m]?.alive && !s.factions[m].sarkar);
  if (members.length < 2) return;
  s.unions ??= [];
  if (s.unions.some((u) => u.id === DAL_KHALSA_ID)) return;
  const leader = members.includes('ahluwalia') ? 'ahluwalia' : members[0];
  s.unions.push({ id: DAL_KHALSA_ID, name: 'Dal Khalsa', leader, members, founded: s.turn });
}

/** Each turn: the Dal Khalsa rides against non-Sikh attackers, and passes away in its time. */
export function dalKhalsaTurn(s: GameState): void {
  const u = s.unions?.find((x) => x.id === DAL_KHALSA_ID);
  if (!u) return;
  const sarkar = Object.values(s.factions).some((f) => f.sarkar && f.alive);
  if (year(s) >= DAL_KHALSA_ENDS || sarkar) {
    s.unions = s.unions!.filter((x) => x !== u);
    const text = sarkar
      ? 'The Dal Khalsa passed into the army of the Sikh Empire. Its jathas rode on under one banner.'
      : 'Half a century after it was raised at Amritsar, the Dal Khalsa passed into history. The misls now rode for themselves.';
    chronicle(s, 'event', text, { weight: 6 });
    if (u.members.includes(s.playerFaction)) alert(s, { kind: 'unrest', title: 'The Dal Khalsa is no more', text });
    return;
  }
  u.members = u.members.filter((m) => s.factions[m]?.alive && !s.factions[m].sarkar);
  // The call to arms: only against those outside the Panth.
  const enemies = new Set<FactionId>();
  for (const m of u.members) for (const [g, r] of Object.entries(s.factions[m].relations)) if (r === 'war' && s.factions[g]?.alive && !isSikh(g)) enemies.add(g);
  for (const e of enemies)
    for (const m of u.members) {
      if (m === s.playerFaction || atWar(s, m, e) || !chance(s, 0.7)) continue;
      s.factions[m].relations[e] = 'war';
      s.factions[e].relations[m] = 'war';
    }
}

/* ── The Jathedar ─────────────────────────────────────────────────────── */

export interface Jathedar {
  id: string;
  name: string;
  /** 'akali': a jathedar of the Panth (a Nihang); 'sarbrah': a placeman of the power holding Amritsar. */
  kind: 'akali' | 'sarbrah';
  since: number;
  note: string;
}

/** The traditional succession of the eighteenth and early nineteenth century (dates as commonly given). */
const AKALI_JATHEDARS: { id: string; name: string; from: number; to: number; note: string }[] = [
  { id: 'kapur_singh', name: 'Nawab Kapur Singh', from: 1733, to: 1753, note: 'Organiser of the Budha and Taruna Dals.' },
  { id: 'jassa_ahluwalia', name: 'Jassa Singh Ahluwalia', from: 1753, to: 1783, note: 'Sultan-ul-Qaum, leader of the Dal Khalsa.' },
  { id: 'naina_singh', name: 'Akali Naina Singh', from: 1783, to: 1800, note: 'Leader of the Budha Dal; teacher of Akali Phula Singh.' },
  { id: 'phula_singh', name: 'Akali Phula Singh', from: 1800, to: 1823, note: 'Who once had the Maharaja himself answer for his conduct before the Takht.' },
  { id: 'hanuman_singh_akali', name: 'Akali Hanuman Singh', from: 1823, to: 1846, note: 'Leader of the Nihangs after Akali Phula Singh.' },
];

const SARBRAH_NAMES = ['Sardar Mangal Singh', 'Sardar Jodh Singh', 'Sardar Man Singh', 'Sardar Arur Singh', 'Rai Bahadur Hukam Singh'];
const AKALI_NAMES = ['Akali Sadhu Singh', 'Akali Teja Singh', 'Akali Dhian Singh', 'Akali Kartar Singh', 'Akali Udham Singh'];

function keeperOfAmritsar(s: GameState): 'panth' | 'other' {
  const o = s.regions.amritsar?.owner;
  if (s.flags?.gurdwaras_freed) return 'panth';
  // A sarbrah is a placeman of a ruler who keeps the shrine to manage it: the
  // Phulkian house or the British. Mughal and Afghan governors desecrated
  // Amritsar but put no manager over the Takht; the Panth's jathedar led on
  // from the jungle.
  return o === 'company' || o === 'phulkian' ? 'other' : 'panth';
}

/** Each turn: who keeps the Takht, and what that means for the Panth. */
export function jathedarTurn(s: GameState): void {
  const y = year(s);
  const want = keeperOfAmritsar(s) === 'panth' ? 'akali' : 'sarbrah';
  const cur = s.jathedar;
  const hist = AKALI_JATHEDARS.find((j) => y >= j.from && y < j.to && s.leaders[j.id]?.alive !== false);
  const histEnded = !!cur && cur.kind === 'akali' && AKALI_JATHEDARS.some((j) => j.id === cur.id) && cur.id !== hist?.id;
  const histStarts = !!cur && cur.kind === 'akali' && !!hist && cur.id !== hist.id;
  if (!cur || cur.kind !== want || histEnded || histStarts) {
    let next: Jathedar;
    if (want === 'akali') {
      next = hist
        ? { id: hist.id, name: hist.name, kind: 'akali', since: s.turn, note: hist.note }
        : { id: `akali_${s.turn}`, name: AKALI_NAMES[s.turn % AKALI_NAMES.length], kind: 'akali', since: s.turn, note: 'A Nihang chosen by the Panth to keep the Takht.' };
    } else {
      const who = s.regions.amritsar?.owner;
      next = {
        id: `sarbrah_${s.turn}`,
        name: SARBRAH_NAMES[s.turn % SARBRAH_NAMES.length],
        kind: 'sarbrah',
        since: s.turn,
        note: `Placed over the Takht by ${polityName(s, who)}. The Panth calls such men masands.`,
      };
    }
    const changed = !cur || cur.kind !== next.kind;
    s.jathedar = next;
    if (changed && cur) {
      const text =
        next.kind === 'akali'
          ? `${next.name} took his seat as Jathedar of the Akal Takht. The Takht was the Panth’s again.`
          : `${next.name} was placed over the Akal Takht as sarbrah. The Panth grieved: a masand sat where the Khalsa’s jathedars had sat.`;
      chronicle(s, 'event', text, { weight: 5, region: 'amritsar' });
      if (isSikh(s.playerFaction)) alert(s, { kind: next.kind === 'akali' ? 'submission' : 'unrest', title: next.kind === 'akali' ? 'A Jathedar at the Akal Takht' : 'A masand at the Akal Takht', text });
    }
  }
  // A placeman at the Takht wears away every Sikh house's standing.
  if (s.jathedar?.kind === 'sarbrah')
    for (const f of Object.values(s.factions)) if (f.alive && isSikh(f.id) && !f.flags.in_struggle_passive) changePiri(s, f.id, -0.4, 'A masand at the Akal Takht');
}

/** Stability modifier for a region from the state of the Takht. */
export function takhtStability(s: GameState, _region: string, sikhShare: number): number {
  if (s.jathedar?.kind !== 'sarbrah') return 0;
  return -Math.round(sikhShare / 10);
}
