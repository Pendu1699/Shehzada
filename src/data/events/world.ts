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
];
