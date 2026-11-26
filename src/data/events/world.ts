// The wider world, 1748–1849: what the dhadi hears from beyond the Punjab.
// Most are told, not chosen — the Punjab learns of them as news — but some
// reach the player: famine relief, an envoy, a warning. Dates follow the
// standard accounts (see HISTORY.md, "The wider subcontinent").

import { regionsOf, polityName, isSikh } from '../../engine/query';
import type { GameState } from '../../engine/state';
import { alive, fx, owns, P } from './fx';
import type { EventDef } from './types';

const rich = (n: number) => (s: GameState) => s.factions[P(s)].treasury >= n;

export const WORLD: EventDef[] = [
  {
    id: 'plassey_1757',
    title: 'Plassey',
    kind: 'historical',
    from: { year: 1757 },
    to: { year: 1758 },
    weight: 4,
    mood: 'ominous',
    when: (s) => !owns(s, P(s), 'murshidabad'),
    text: () =>
      'News comes up the Grand Trunk Road from Bengal: in a mango grove at Plassey, a Company officer named Clive has beaten the Nawab Siraj-ud-Daula — or rather bought his generals, who stood aside. A trading company now makes and unmakes the nawabs of the richest province in Hindustan.',
  },
  {
    id: 'buxar_1764',
    title: 'Buxar',
    kind: 'historical',
    from: { year: 1764, festival: 'diwali' },
    to: { year: 1765 },
    weight: 4,
    mood: 'ominous',
    text: () =>
      'At Buxar on the Ganga the Company’s sepoys break the armies of the Nawab of Awadh, the Nawab of Bengal and the emperor himself. Next year the emperor will sign Bengal’s revenues over to them at Allahabad.',
  },
  {
    id: 'bengal_famine_1770',
    title: 'The great famine of Bengal',
    kind: 'historical',
    from: { year: 1770 },
    to: { year: 1770, festival: 'diwali' },
    weight: 5,
    mood: 'solemn',
    text: () =>
      'The rains failed in Bengal, and the Company’s collectors did not. Merchants on the road speak of villages empty from Murshidabad to Purnea — a third of the people of Bengal, they say, are dead.',
    playerOnly: (s) => isSikh(P(s)),
    choices: [
      {
        label: 'Send grain down the river with the merchants (₹40k)',
        detail: 'Little enough against such a famine, but the langar knows no frontier. Piri rises.',
        available: rich(40),
        effect: (s) => {
          fx.money(s, P(s), -40);
          fx.piri(s, P(s), 4, 'Grain for Bengal in the famine');
          fx.legend(s, P(s), 2);
          return 'Boats of grain went down the Yamuna and the Ganga under the Nishan Sahib. Some of it reached the hungry.';
        },
      },
      { label: 'Bengal is far away', detail: 'Nothing is lost but the chance.', effect: () => 'The news was heard, and the sangat prayed for the dead of Bengal.' },
    ],
    aiChoice: 1,
  },
  {
    id: 'chalisa_1783',
    title: 'The Chalisa famine',
    gurmukhi: 'ਚਾਲੀਸਾ ਕਾਲ',
    kind: 'historical',
    from: { year: 1783 },
    to: { year: 1784 },
    weight: 6,
    mood: 'solemn',
    text: () =>
      'The monsoon of the year 1840 of the Vikrami era failed, and the next. Across the Punjab and Hindustan the wells go dry; they will call it the Chalisa, the famine of the Forty. People eat the bark of trees.',
    effect: (s) => {
      for (const r of Object.keys(s.regions)) if (!s.regions[r].buildings.includes('canal')) fx.devastate(s, r, 0.12);
    },
    playerOnly: (s) => isSikh(P(s)),
    choices: [
      {
        label: 'Open a langar in every region you hold (₹60k)',
        detail: 'Every hungry person fed, whatever their faith. Piri and stability rise greatly.',
        available: rich(60),
        effect: (s) => {
          fx.money(s, P(s), -60);
          for (const r of regionsOf(s, P(s))) {
            s.regions[r].langar = true;
            fx.stability(s, r, 15);
          }
          fx.piri(s, P(s), 8, 'The langars of the Chalisa famine');
          fx.legend(s, P(s), 4);
          return 'The langar fires burned day and night. People walked from the hills and from across the Yamuna to eat.';
        },
      },
      {
        label: 'Remit the revenue and pray for rain',
        detail: 'A season’s income forgone; stability holds.',
        effect: (s) => {
          for (const r of regionsOf(s, P(s))) fx.stability(s, r, 6);
          fx.money(s, P(s), -Math.round(s.factions[P(s)].lastIncome));
          return 'No collector went out that year.';
        },
      },
      { label: 'The treasury must keep the army', detail: 'The people remember.', effect: (s) => (fx.piri(s, P(s), -4, 'Kept the treasury shut in the Chalisa famine'), 'The granaries stayed shut. The people remembered.') },
    ],
    aiChoice: 1,
  },
  {
    id: 'hyder_dies_1782',
    title: 'The death of Hyder Ali',
    kind: 'historical',
    from: { year: 1782, festival: 'diwali' },
    to: { year: 1783 },
    weight: 2,
    mood: 'neutral',
    text: () => 'Far in the south, Hyder Ali of Mysore has died in his camp, in the middle of a war with the Company. His son Tipu takes up the sword.',
  },
  {
    id: 'assaye_1803',
    title: 'Assaye and Laswari',
    kind: 'historical',
    from: { year: 1803, festival: 'diwali' },
    to: { year: 1804 },
    weight: 4,
    mood: 'ominous',
    when: (s) => alive(s, 'maratha'),
    text: () =>
      'In the Deccan, at Assaye, a younger Wellesley breaks Scindia’s French-drilled battalions; at Laswari, Lake does the same in the north. The Maratha power that once watered its horses at Attock is finished as a rival to the Company.',
  },
  {
    id: 'holkar_1805',
    title: 'Holkar at the Beas',
    kind: 'historical',
    from: { year: 1805, festival: 'diwali' },
    to: { year: 1806 },
    weight: 5,
    mood: 'neutral',
    when: (s) => isSikh(P(s)),
    text: () =>
      'Jaswant Rao Holkar, the last Maratha still fighting the Company, has ridden into the Punjab with Lake’s army behind him, asking the Sikh sardars for help. The Company’s envoy follows, asking them to refuse.',
    playerOnly: (s) => isSikh(P(s)) && regionsOf(s, P(s)).length >= 4,
    choices: [
      {
        label: 'Make peace between them, and keep the war out of the Punjab',
        detail: 'As history went: a treaty at Lahore, both armies leave. Piri and diplomacy rise.',
        effect: (s) => {
          fx.piri(s, P(s), 2, 'Keeping the war out of the Punjab');
          fx.attitude(s, 'company', P(s), 10);
          return 'Holkar went home by treaty, and Lake after him. The Punjab had kept its fields.';
        },
      },
      {
        label: 'Ride with Holkar against the Company',
        detail: 'War with the Company, a generation early. Legend, and great danger.',
        effect: (s) => {
          fx.relation(s, P(s), 'company', 'war');
          fx.legend(s, P(s), 8);
          return `The horse of ${polityName(s, P(s))} rode out beside the Marathas. The Company would not forget it.`;
        },
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'gorkha_war_1814',
    title: 'The Gorkha war',
    kind: 'historical',
    from: { year: 1814, festival: 'diwali' },
    to: { year: 1815 },
    weight: 3,
    mood: 'neutral',
    text: () =>
      'The Company has gone to war with Nepal. Ochterlony fights his way up the hills; at Nalapani a few hundred Gorkhas hold a fort against thousands for a month. Amar Singh Thapa, who once besieged Kangra, surrenders at Malaun.',
  },
  {
    id: 'kabul_retreat_1842',
    title: 'The retreat from Kabul',
    kind: 'historical',
    from: { year: 1842 },
    to: { year: 1842, festival: 'diwali' },
    weight: 6,
    mood: 'ominous',
    when: (s) => alive(s, 'company') && !owns(s, P(s), 'kabul'),
    text: () =>
      'In the January snow the Company’s army in Kabul tries to march home. Of some sixteen thousand soldiers and followers who left the city, one surgeon on a wounded pony reaches Jalalabad. The red ink has found a place it cannot hold. In the Lahore darbar, men say: so the Company can be beaten.',
    effect: (s) => {
      if (s.factions.company) s.factions.company.legend -= 10;
      for (const f of Object.values(s.factions)) if (f.alive && isSikh(f.id)) fx.legend(s, f.id, 2);
    },
  },
  // ── The Punjab: more moments of the century ──
  {
    id: 'zamzama_1764',
    title: 'The great gun Zamzama',
    kind: 'historical',
    from: { year: 1764, festival: 'diwali' },
    to: { year: 1766 },
    weight: 5,
    mood: 'heroic',
    when: (s) => alive(s, 'bhangi'),
    text: () =>
      'The Bhangi sardars have taken the great bronze gun Zamzama — cast at Lahore for Ahmad Shah — from the Afghans. They call it the Bhangian wali top, and men come from far off just to see it.',
    effect: (s) => {
      fx.legend(s, 'bhangi', 4);
      s.factions.bhangi.flags.zamzama = true;
    },
  },
  {
    id: 'akal_takht_1774',
    title: 'The Akal Takht raised again',
    kind: 'historical',
    from: { year: 1774 },
    to: { year: 1775 },
    weight: 6,
    mood: 'festive',
    when: (s) => !s.josh.active,
    text: () =>
      'Ahmad Shah blew up the Akal Takht in 1762. Now, with the Afghan tide gone out, the sardars raise it again as a hall facing the Harmandir. The Sarbat Khalsa will gather before it as before.',
    playerOnly: (s) => isSikh(P(s)) && !s.factions[P(s)].sarkar,
    choices: [
      {
        label: 'Give generously to the building (₹25k)',
        detail: 'Piri and legend rise; the assembly remembers who gave.',
        available: rich(25),
        effect: (s) => {
          fx.money(s, P(s), -25);
          fx.piri(s, P(s), 4, 'Raising the Akal Takht again');
          fx.legend(s, P(s), 3);
          for (const f of Object.values(s.factions)) if (f.alive && isSikh(f.id) && f.id !== P(s)) fx.attitude(s, f.id, P(s), 8);
          return 'Your name was read out at the Akal Takht among those who built it.';
        },
      },
      { label: 'Send what you can spare', detail: 'A small gift.', effect: (s) => (fx.money(s, P(s), -5), fx.piri(s, P(s), 1, 'A gift to the Akal Takht'), 'Your gift was received with thanks.') },
    ],
    aiChoice: 1,
  },
  {
    id: 'zaman_guns_1799',
    title: 'Zaman Shah’s guns in the Jhelum',
    kind: 'historical',
    from: { year: 1799 },
    to: { year: 1799, festival: 'diwali' },
    weight: 6,
    mood: 'neutral',
    when: (s) => !owns(s, 'durrani', 'lahore'),
    text: () =>
      'Retreating to Kabul with the Jhelum in flood, Zaman Shah has lost a dozen guns in the river. A message comes from his camp: whoever fishes them out and sends them after him will have his favour.',
    playerOnly: (s) => isSikh(P(s)) && s.factions[P(s)].relations.durrani !== 'war',
    choices: [
      {
        label: 'Raise the guns and send them to Kabul',
        detail: 'As Ranjit Singh did: Durrani goodwill, and a royal recognition of your hold on Lahore if you have it. The Panth may frown.',
        effect: (s) => {
          fx.attitude(s, 'durrani', P(s), 40);
          fx.relation(s, P(s), 'durrani', 'peace');
          fx.legend(s, P(s), 3);
          fx.piri(s, P(s), -1, 'Doing a favour for the Afghan king');
          return 'Eight guns were dragged out of the Jhelum and sent up the road to Kabul.';
        },
      },
      {
        label: 'Keep the guns',
        detail: 'Artillery for your own army; the Afghan king will not forget.',
        effect: (s) => {
          fx.attitude(s, 'durrani', P(s), -30);
          s.factions[P(s)].flags.zaman_guns = true;
          fx.recruit(s, P(s), Object.values(s.regions).find((r) => r.owner === P(s))?.id ?? 'lahore', 'top', 200);
          return 'The guns were hauled out of the river and turned round to face the passes.';
        },
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'gilding_1830',
    title: 'Gold for the Harmandir',
    kind: 'historical',
    from: { year: 1803 },
    to: { year: 1835 },
    weight: 7,
    mood: 'festive',
    when: (s) => s.factions[P(s)].sarkar === true && owns(s, P(s), 'amritsar'),
    text: () =>
      'Craftsmen from Lahore and Delhi offer to cover the upper storeys of the Harmandir Sahib in gilded copper, as was done in the years of the Sarkar. It will cost a fortune.',
    playerOnly: () => true,
    choices: [
      {
        label: 'Gild the Harmandir (₹120k)',
        detail: 'Great Piri and legend; the Golden Temple shines for centuries.',
        available: rich(120),
        effect: (s) => {
          fx.money(s, P(s), -120);
          fx.piri(s, P(s), 8, 'Gilding the Harmandir Sahib');
          fx.legend(s, P(s), 8);
          s.factions[P(s)].flags.gilded = true;
          return 'Sheet by sheet the gilded copper went up. Pilgrims began to call it the Golden Temple.';
        },
      },
      { label: 'Not now', detail: 'The army needs the money.', effect: () => 'The craftsmen went home. Perhaps another year.' },
    ],
    aiChoice: 1,
  },
  {
    id: 'ropar_1831',
    title: 'The meeting at Ropar',
    kind: 'historical',
    from: { year: 1831 },
    to: { year: 1832 },
    weight: 5,
    mood: 'neutral',
    when: (s) => alive(s, 'company') && !!Object.values(s.factions).find((f) => f.sarkar && f.alive),
    text: () =>
      'On the banks of the Sutlej at Ropar, the Maharaja of the Sikh Empire and Lord William Bentinck meet amid tents, elephants and reviews of troops. Each side counts the other’s guns.',
    effect: (s) => {
      const sk = Object.values(s.factions).find((f) => f.sarkar && f.alive)!.id;
      fx.attitude(s, 'company', sk, 10);
      fx.legend(s, sk, 2);
    },
  },
  {
    id: 'tankhah',
    title: 'Summoned to the Akal Takht',
    gurmukhi: 'ਤਨਖਾਹ',
    kind: 'generic',
    chance: 0.35,
    cooldown: 12,
    weight: 6,
    mood: 'solemn',
    when: (s) => isSikh(P(s)) && s.jathedar?.kind === 'akali' && s.factions[P(s)].piri < 38 && !s.mode?.startsWith('struggle'),
    text: (s) =>
      `${s.jathedar!.name}, Jathedar of the Akal Takht, has summoned you to answer before the Takht for your conduct. Akali Phula Singh once had the Maharaja himself stand there and accept his tankhah. The whole Panth is watching.`,
    playerOnly: () => true,
    choices: [
      {
        label: 'Stand before the Takht and accept the tankhah',
        detail: 'Pay a fine to the langar (₹20k) and do sewa. The Panth’s trust returns.',
        effect: (s) => {
          fx.money(s, P(s), -20);
          fx.piri(s, P(s), 9, 'Accepting the tankhah of the Akal Takht');
          fx.legend(s, P(s), 2);
          return 'You stood barefoot before the Takht, and the Jathedar pronounced the tankhah. The sangat saw that no one is above the Panth.';
        },
      },
      {
        label: 'Ignore the summons',
        detail: 'The Nihangs will not forget; Piri falls sharply.',
        effect: (s) => {
          fx.piri(s, P(s), -10, 'Ignoring the summons of the Akal Takht');
          if (s.factions.shaheedan) fx.attitude(s, 'shaheedan', P(s), -40);
          return 'You did not go. In every dera of the Nihangs your name was spoken with contempt.';
        },
      },
    ],
    aiChoice: 0,
  },
];
