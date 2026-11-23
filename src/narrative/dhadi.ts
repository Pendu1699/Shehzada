// The Dhadi's voice.
//
// A dhadi sings vaars — heroic ballads — to the beat of the small dhadd drum and the
// sarangi. Everything here is original English prose written in that cadence: short
// strong clauses, repetition, images of horse, river and dust. It never quotes or
// imitates Gurbani, and never puts words in the mouths of the Gurus.

import { FACTION_BY_ID } from '../data/factions';
import { REGION_BY_ID } from '../data/regions';
import type { Side } from '../engine/combat';
import { date, factionName, leaderName } from '../engine/query';
import type { BattleReport, GameState } from '../engine/state';

/** Deterministic choice that does not consume the game RNG. */
export function hpick<T>(arr: readonly T[], ...keys: (string | number)[]): T {
  let h = 2166136261;
  for (const k of keys) {
    const str = String(k);
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return arr[(h >>> 0) % arr.length];
}

const RIVER_OF_REGION: Record<string, string> = {
  lahore: 'Ravi', amritsar: 'Beas', kasur: 'Sutlej', ferozepur: 'Sutlej', ludhiana: 'Sutlej', multan: 'Chenab', wazirabad: 'Chenab',
  gujrat: 'Chenab', ramnagar: 'Chenab', jhang: 'Chenab', attock: 'Indus', dera_ismail_khan: 'Indus', dhanni: 'Jhelum', khewra: 'Jhelum',
  kapurthala: 'Beas', hoshiarpur: 'Beas', anandpur: 'Sutlej', batala: 'Ravi', sialkot: 'Chenab', peshawar: 'Kabul', delhi: 'Yamuna',
  panipat: 'Yamuna', saharanpur: 'Yamuna', jalandhar: 'Sutlej', sheikhupura: 'Ravi', chunian: 'Ravi', dipalpur: 'Sutlej',
};

export function riverNear(region: string): string {
  return RIVER_OF_REGION[region] ?? hpick(['Ravi', 'Chenab', 'Sutlej', 'Beas', 'Jhelum'], region);
}

function sideName(s: GameState, side: Side): string {
  const L = side.armies.find((a) => a.leader)?.leader;
  if (L) return leaderName(s, L);
  const f = FACTION_BY_ID[side.faction];
  if (!f) return 'the enemy';
  return f.sikh ? `the ${f.name} jatha` : `the host of the ${f.name}`;
}

/** One line of song between the rounds of a battle. */
export function battleLine(s: GameState, round: number, aLoss: number, dLoss: number, A: Side, D: Side, region: string): string {
  const a = sideName(s, A);
  const d = sideName(s, D);
  const place = REGION_BY_ID[region].name;
  const river = riverNear(region);
  const key = [s.turn, region, round];
  if (round === 0) {
    if (A.stance === 'dhai_phat')
      return hpick(
        [
          `Out of the dust came ${a}, struck once like lightning, and wheeled away before the enemy could turn.`,
          `Two and a half blows, the old way: ${a} rode in, cut, and was gone, and the dust hung over ${place}.`,
          `The horse of ${a} came like a hot wind off the bar, and the ranks of ${d} broke their order to meet it.`,
        ],
        ...key,
      );
    if (A.stance === 'ambush')
      return hpick(
        [
          `From the tall grass by the ${river} rose ${a}, and the first volley fell like hail on ${d}.`,
          `Silent in the reeds they waited; then the nagara spoke once and ${a} fell upon ${d}.`,
        ],
        ...key,
      );
    if (A.stance === 'night_raid')
      return hpick(
        [
          `No moon over ${place}. Torches only in the enemy camp. ${a} came out of the dark among the tents and the tethered horses.`,
          `In the third watch of the night ${a} cut the picket ropes and the camp of ${d} woke to the war-cry.`,
        ],
        ...key,
      );
    return hpick(
      [
        `The nagaras thundered at ${place}. ${a} and ${d} met on the open ground, banner against banner.`,
        `Dust rose over the ${river} like a storm off the bar as ${a} came on against ${d}.`,
        `Steel rang at ${place}. The war-cry went up, and ${a} rode at ${d} with lances lowered.`,
        `The sun stood high over ${place} when the two hosts closed; the earth shook under the hooves.`,
      ],
      ...key,
    );
  }
  if (aLoss > dLoss * 1.5)
    return hpick(
      [
        `But ${d} stood firm, and the ranks of ${a} were thinned like wheat before the sickle.`,
        `Hard was the reply of ${d}; many of ${a}’s riders did not ride again.`,
        `The guns of ${d} spoke, and the smoke lay heavy over the fallen of ${a}.`,
      ],
      ...key,
    );
  if (dLoss > aLoss * 1.5)
    return hpick(
      [
        `Again ${a} struck, and the line of ${d} bent like a bow and began to give.`,
        `Sword on shield, again and again: ${d} fell back step by step toward the ${river}.`,
        `The kesri banners pressed forward, and ${d} could not hold the ground.`,
      ],
      ...key,
    );
  return hpick(
    [
      `Neither host would yield. Blow for blow they traded, and the dust hid friend from foe.`,
      `The field of ${place} drank deep; still neither side gave ground.`,
      `Back and forth the struggle swayed, like the ${river} in flood against its banks.`,
    ],
    ...key,
  );
}

export function battleVerdict(s: GameState, b: BattleReport): string {
  const winnerF = b.winner === 'attacker' ? b.attacker : b.winner === 'defender' ? b.defender : null;
  const place = REGION_BY_ID[b.region].name;
  const player = s.playerFaction;
  if (!winnerF) return `At ${place} no one held the field. The horse scattered, and would ride again.`;
  const loserF = winnerF === b.attacker ? b.defender : b.attacker;
  if (winnerF === player)
    return hpick(
      [
        `Victory at ${place}! Let the dhadd beat and the sarangi sing: the field belongs to ${factionName(player)}.`,
        `${place} is won. The wounded are carried to the langar, the fallen are honoured, and the Khalsa rides on.`,
        `So ended the day at ${place}: ${factionName(loserF)} broken, ${factionName(player)} standing.`,
      ],
      b.id,
    );
  if (loserF === player)
    return hpick(
      [
        `A hard day at ${place}. The jathas fell back, but a Singh who lives to ride again is not defeated.`,
        `${place} was lost. Count the fallen, bind the wounds; the Panth has known darker nights than this.`,
      ],
      b.id,
    );
  return `At ${place}, ${factionName(winnerF)} prevailed over ${factionName(loserF)}.`;
}

/** The opening verse of a new game. */
export function generateSummaryOpening(s: GameState): string[] {
  const d = date(s);
  const f = FACTION_BY_ID[s.playerFaction];
  const lines: string[] = [];
  if (s.scenarioId === 's1748') {
    lines.push('Listen! I sing of the year seventeen hundred and forty-eight, of Vaisakhi at Amritsar, when the scattered jathas came together before the Akal Takht.');
    lines.push('Hunted they were, with a price on every head; in the Lakhi jungle and the river thickets they kept their horses saddled and their faith whole.');
    lines.push(`Now the Sarbat Khalsa has spoken: the jathas are one Dal Khalsa, and among them rides the ${f.name} misl. Hear what it will do.`);
  } else if (s.scenarioId === 's1767') {
    lines.push('Listen! The Afghan king has come and gone eight times, and the land between the rivers is ours to hold.');
    lines.push('Coins are struck in the name of the Guru’s Khalsa; misl banners fly over Lahore and Sirhind.');
    lines.push(`But brothers eye brothers across the rivers. Where will the ${f.name} misl ride?`);
  } else if (s.scenarioId === 's1799') {
    lines.push('Listen! The century turns. Zaman Shah has gone home, and Lahore waits behind its walls for a master.');
    lines.push('Three sardars quarrel in the fort; the merchants and the qazis and the pandits look north to Gujranwala.');
    lines.push(`Ride now, ${f.name}, for whoever holds Lahore holds the Punjab.`);
  } else {
    lines.push('Listen, and do not weep yet. The Lion of the Punjab has gone to his rest, and the empire he built stands from the Khyber to the Sutlej.');
    lines.push('But the court is a nest of whispers, the army counts its arrears, and red ink spreads along the far bank of the Sutlej.');
    lines.push('What was built in forty years can fall in ten. Hold it together, if you can.');
  }
  lines.push(`— ${d.label}`);
  return lines;
}

export function seasonLine(s: GameState): string {
  const d = date(s);
  if (d.festival === 'vaisakhi')
    return hpick(
      [
        `Vaisakhi ${d.year}. The wheat is cut and threshed; the Khalsa gathers at Amritsar and the sarovar shines like beaten gold.`,
        `Vaisakhi ${d.year}. Golden fields, drums at every village gate, and the rivers already rising with the snowmelt.`,
        `Vaisakhi ${d.year}. The harvest is in. Before the monsoon closes the fords, the sardars meet beneath the Akal Takht.`,
      ],
      d.year,
    );
  return hpick(
    [
      `Diwali ${d.year}. Lamps on every rooftop of Amritsar, their light doubled in the water. The cold season comes, and with it the campaigning.`,
      `Diwali ${d.year}. The kharif is gathered, the rivers fall back into their beds, and from the passes in the west comes news of horsemen.`,
      `Diwali ${d.year}. A thousand diyas flicker on the sarovar. The Sarbat Khalsa gathers, and the roads are dry for war.`,
    ],
    d.year,
  );
}
