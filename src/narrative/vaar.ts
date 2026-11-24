// The player's Vaar: a ballad of their century, generated from what actually
// happened (the chronicle and the final state). Original prose in a vaar cadence.

import { FACTION_BY_ID } from '../data/factions';
import { REGION_BY_ID } from '../data/regions';
import { date, polityName, regionsOf } from '../engine/query';
import type { GameState } from '../engine/state';
import { hpick, riverNear } from './dhadi';

export interface Vaar {
  title: string;
  subtitle: string;
  stanzas: string[];
  tallies: { label: string; value: string }[];
  closing: string;
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function composeVaar(s: GameState): Vaar {
  const p = s.playerFaction;
  const f = FACTION_BY_ID[p];
  const polity = polityName(s, p);
  const end = date(s);
  const kind = s.ending?.kind ?? 'annexation';
  const stanzas: string[] = [];

  stanzas.push(
    `Sit close, and let the dhadd speak. This is the vaar of ${polity}, from the ${s.startFestival === 'vaisakhi' ? 'Vaisakhi' : 'Diwali'} of ${s.startYear} to the ${end.festival === 'vaisakhi' ? 'Vaisakhi' : 'Diwali'} of ${end.year}. Hear it as it happened; the dhadi adds nothing and leaves out only what the river carried away.`,
  );

  // The great deeds, in order.
  const mine = s.chronicle.filter((c) => c.faction === p || (!c.faction && c.weight >= 6) || ['desecration', 'josh', 'rebuilding'].includes(c.kind));
  const chosen = [...mine].sort((a, b) => b.weight - a.weight).slice(0, 12).sort((a, b) => a.turn - b.turn);
  for (const c of chosen) {
    const refrain = c.region ? hpick([` And the ${riverNear(c.region)} remembers.`, ` The dust of ${REGION_BY_ID[c.region].name} remembers.`, ''], c.text) : '';
    stanzas.push(`In ${c.year}: ${cap(c.text.replace(/\.$/, ''))}.${refrain}`);
  }

  // Tallies from the record.
  const battles = s.battles.filter((b) => b.attacker === p || b.defender === p);
  const won = battles.filter((b) => (b.winner === 'attacker' && b.attacker === p) || (b.winner === 'defender' && b.defender === p)).length;
  const lost = battles.filter((b) => (b.winner === 'attacker' && b.defender === p) || (b.winner === 'defender' && b.attacker === p)).length;
  const count = (k: string) => s.chronicle.filter((c) => c.kind === k && (c.faction === p || !c.faction)).length;
  const spared = count('spared');
  const sacked = count('sacked');
  const rakhiKept = count('rakhi_kept');
  const rakhiBroken = count('rakhi_broken');
  const freed = s.chronicle.filter((c) => c.kind === 'captives' && c.faction === p).length;
  const buildings = Object.values(s.regions).filter((r) => r.owner === p).reduce((t, r) => t + r.buildings.length, 0);
  const fallen = Object.values(s.leaders).filter((l) => !l.alive && l.faction === p && l.historical).map((l) => l.name);

  const tallies = [
    { label: 'Battles won', value: String(won) },
    { label: 'Battles lost', value: String(lost) },
    { label: 'Cities spared', value: String(spared) },
    { label: 'Cities sacked', value: String(sacked) },
    { label: 'Rakhi kept · broken', value: `${rakhiKept} · ${rakhiBroken}` },
    { label: 'Houses of worship raised', value: String(buildings) },
    { label: 'Lands held at the end', value: String(regionsOf(s, p).length) },
    { label: 'Miri · Piri', value: `${s.factions[p].miri} · ${Math.round(s.factions[p].piri)}` },
  ];

  if (spared > sacked) stanzas.push(`${spared} cities opened their gates to ${polity} and were not plundered; their children told their children of it.`);
  else if (sacked > 0) stanzas.push(`${sacked} cities were given to the sword and the torch. The dhadi sings it, because a vaar that hides its shame is not a vaar.`);
  if (rakhiBroken > rakhiKept && rakhiBroken > 0) stanzas.push('Villages paid rakhi and were not always defended. They remember that too.');
  else if (rakhiKept > 0) stanzas.push('When the raiders came for the villages under its rakhi, the riders came too.');
  if (freed > 0) stanzas.push('Captives were taken from the baggage trains of kings, and walked home.');
  if (fallen.length) stanzas.push(`Remember the names: ${fallen.slice(0, 8).join(', ')}.`);

  // The roads history did not take.
  const fl = s.factions[p].flags;
  if (fl.early_sarkar) stanzas.push(`The Sarkar-i-Khalsa came not from the Sukerchakias but from ${polity}, a generation before its time; and the century bent around it.`);
  if (fl.confederacy) stanzas.push('No king was ever made. The misls swore a union before the Akal Takht and kept it, a brotherhood of equals that ruled as one Khalsa.');
  if (s.leaders.ranjit_singh && s.leaders.ranjit_singh.faction === p && p !== 'sukerchakia') stanzas.push('Ranjit Singh, who in another telling made himself Maharaja, rode instead as a general of your house.');

  const koh = s.factions[p].flags.koh_i_noor;
  if (koh === true) stanzas.push('The Koh-i-Noor, the Mountain of Light, lies yet in the Toshakhana at Lahore.');
  if (koh === 'taken') stanzas.push('The Koh-i-Noor was carried across the black water to a foreign queen. A diamond is only a stone; still, the people grieved to see it go.');

  const endings: Record<string, string> = {
    sovereign: `And when the year eighteen forty-nine came, ${polity} was still standing — strong in arms and trusted by the Panth, the two swords in one hand. The red ink stopped at the river. Raj karega Khalsa: the people said it, and for once the century agreed.`,
    protected: `When the storm came, ${polity} bent and was not broken. It lives on as a protected state under the Company’s flag — smaller, safer, and quieter than the dhadis would wish.`,
    annexation: `And in the spring of eighteen forty-nine the red ink reached Lahore. The Punjab was annexed. But the dhadi has seen kingdoms fall before, and the Panth outlive them.`,
    ghallughara: `The banner of ${polity} fell in the dark years. Its riders scattered; its name passed to other misls. Weep, then remember: the Khalsa was never one misl, and it endured.`,
  };
  const closing = 'Here the dhadd falls silent, and the sarangi plays on a little alone.';
  return {
    title: `The Vaar of ${f.kind === 'misl' && !s.factions[p].sarkar ? `the ${f.name} misl` : polity.replace(/^the /, 'the ')}`,
    subtitle: `${s.startYear} – ${end.year}`,
    stanzas: [...stanzas, endings[kind]],
    tallies,
    closing,
  };
}
