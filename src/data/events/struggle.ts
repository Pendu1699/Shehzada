// The Long Struggle, 1849–1947: the history that runs beside the player's
// movement. Dates follow the standard accounts (see HISTORY.md, "The Long
// Struggle"). Violence is reported as history; the game rewards organisation,
// courage under repression and friends abroad, never attacks on civilians.

import { PUNJAB_REGION_IDS, REGION_BY_ID } from '../regions';
import { clamp } from '../../engine/query';
import { chance } from '../../engine/rng';
import type { GameState } from '../../engine/state';
import type { Power } from '../../engine/struggle';
import { fx, P } from './fx';
import type { EventDef } from './types';

const on = (s: GameState) => s.mode === 'struggle' && !!s.struggle;
const sup = (s: GameState, regions: string[] | 'all' | 'sikh', d: number) => {
  const st = s.struggle!;
  const list = regions === 'all' ? [...PUNJAB_REGION_IDS] : regions === 'sikh' ? [...PUNJAB_REGION_IDS].filter((r) => REGION_BY_ID[r].faith.sikh >= 25) : regions;
  for (const r of list) if (st.support[r] !== undefined) st.support[r] = clamp(st.support[r] + d, 0, 100);
};
const heat = (s: GameState, d: number): void => {
  s.struggle!.heat = clamp(s.struggle!.heat + d, 0, 100);
};
const infl = (s: GameState, p: Power, d: number): void => {
  s.struggle!.influence[p] = clamp(s.struggle!.influence[p] + d, 0, 100);
};
const MALWA = ['ludhiana', 'malerkotla', 'sirhind', 'faridkot', 'kot_kapura', 'damdama'];
const MAJHA = ['amritsar', 'lahore', 'batala', 'gujranwala', 'sialkot'];

export const STRUGGLE: EventDef[] = [
  {
    id: 'st_duleep_taken',
    title: 'The boy-Maharaja is taken away',
    kind: 'historical',
    from: { year: 1849 },
    to: { year: 1850 },
    weight: 6,
    mood: 'solemn',
    when: on,
    text: () =>
      'Duleep Singh, eleven years old, has been taken from Lahore to Fatehgarh in the care of a Scottish doctor. The Koh-i-Noor has been sent to the Queen. His mother, Maharani Jind Kaur, is a prisoner in the fort of Chunar.',
    effect: (s) => sup(s, 'sikh', 3),
  },
  {
    id: 'st_jind_kaur_escape',
    title: 'The Maharani escapes',
    kind: 'historical',
    from: { year: 1849, festival: 'diwali' },
    to: { year: 1850, festival: 'diwali' },
    weight: 6,
    mood: 'heroic',
    when: on,
    text: () => 'Maharani Jind Kaur has escaped the fort of Chunar disguised as a servant and reached Kathmandu, where the Rana grants her refuge. She writes to the sardars of the Punjab.',
    playerOnly: () => true,
    choices: [
      { label: 'Send her silver and messengers (₹15k)', detail: 'Support in Majha; Kabul and Paris hear of it. Heat rises.', available: (s) => s.factions[P(s)].treasury >= 15, effect: (s) => (fx.money(s, P(s), -15), sup(s, MAJHA, 6), infl(s, 'afghanistan', 6), infl(s, 'france', 4), heat(s, 8), 'Letters went to Kathmandu sewn into a jacket.') },
      { label: 'Keep your distance for now', detail: 'The police watch everyone who writes to her.', effect: () => 'No letter went.' },
    ],
    aiChoice: 1,
  },
  {
    id: 'st_maharaj_singh',
    title: 'Bhai Maharaj Singh',
    kind: 'historical',
    from: { year: 1849 },
    to: { year: 1850 },
    weight: 6,
    mood: 'solemn',
    when: on,
    text: () =>
      'Bhai Maharaj Singh, the saint-soldier who would not accept the annexation, has been betrayed and arrested near Jalandhar. The British will exile him to Singapore, where he will die in a prison cell in 1856.',
    effect: (s) => (sup(s, ['jalandhar', 'hoshiarpur', 'kapurthala'], 6), heat(s, 4)),
  },
  {
    id: 'st_1857',
    title: 'The great rising of 1857',
    kind: 'historical',
    from: { year: 1857 },
    to: { year: 1857, festival: 'diwali' },
    weight: 9,
    mood: 'ominous',
    when: on,
    text: () =>
      'At Meerut the sepoys have risen; Delhi has fallen to them and the old emperor Bahadur Shah has been proclaimed. The British in the Punjab are few and afraid. Many Sikhs remember that these same Purbia sepoys conquered the Punjab for the Company eight years ago. What will the Panth do?',
    playerOnly: () => true,
    choices: [
      {
        label: 'Stand aside, and let the British owe the Panth',
        detail: 'As most of the Punjab did. The British relax their grip (heat −25) and court the Sikhs for their army.',
        effect: (s) => (heat(s, -25), sup(s, 'all', -3), 'The Punjab stayed quiet, and the British took note who had stayed quiet.'),
      },
      {
        label: 'Rise with the rebels',
        detail: 'A great gamble while the British are stretched. Support and foreign interest leap; the British will never forget.',
        effect: (s) => {
          sup(s, 'sikh', 12);
          heat(s, 40);
          infl(s, 'russia', 10);
          infl(s, 'france', 6);
          for (const r of Object.keys(s.struggle!.support)) if (s.struggle!.support[r] >= 60) s.struggle!.cells[r] = Math.min(3, s.struggle!.cells[r] + 1);
          return 'The call went out from village to village. Every rising you begin this year is likelier to succeed.';
        },
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'st_crown_rule',
    title: 'The Queen’s proclamation',
    kind: 'historical',
    from: { year: 1858, festival: 'diwali' },
    to: { year: 1859 },
    weight: 5,
    mood: 'neutral',
    when: on,
    text: () => 'The East India Company is abolished. India passes to the Crown, and the Queen promises not to meddle in the religions of her subjects. A British-appointed sarbrah now manages the Darbar Sahib and the Akal Takht.',
    effect: (s) => heat(s, -10),
  },
  {
    id: 'st_kukas',
    title: 'The Kukas at Malerkotla',
    kind: 'historical',
    from: { year: 1872 },
    to: { year: 1872, festival: 'diwali' },
    weight: 8,
    mood: 'solemn',
    when: on,
    text: () =>
      'The Kukas — the Namdhari followers of Baba Ram Singh, who preached the boycott of British goods, courts and schools — have clashed at Malerkotla. Without trial, sixty-six of them have been blown away from the mouths of cannon. Baba Ram Singh is exiled to Rangoon.',
    effect: (s) => (sup(s, MALWA, 10), sup(s, 'sikh', 3), heat(s, 10)),
  },
  {
    id: 'st_singh_sabha',
    title: 'The Singh Sabha',
    kind: 'historical',
    from: { year: 1873 },
    to: { year: 1874 },
    weight: 7,
    mood: 'festive',
    when: on,
    text: () =>
      'At Amritsar the first Singh Sabha has been founded, to revive Sikh learning, publish in Gurmukhi and open schools. Others follow at Lahore and in every district. The Panth is finding its voice again — in print.',
    effect: (s) => {
      sup(s, 'sikh', 5);
      fx.piri(s, P(s), 4, 'The Singh Sabha');
      s.struggle!.cells.amritsar = Math.min(3, s.struggle!.cells.amritsar + 1);
    },
  },
  {
    id: 'st_duleep_returns',
    title: 'The Maharaja comes home',
    kind: 'historical',
    from: { year: 1886 },
    to: { year: 1886, festival: 'diwali' },
    weight: 9,
    mood: 'heroic',
    when: on,
    text: () =>
      'Maharaja Duleep Singh, forty-seven, has renounced his English life, taken amrit again at Aden — where the British stopped his ship — and declared himself the rightful sovereign of the Punjab. From Paris he writes to the Tsar, to the Irish Fenians and to the sardars of the Punjab.',
    playerOnly: () => true,
    choices: [
      {
        label: 'Declare for the Maharaja',
        detail: 'Paris, St Petersburg and the Fenians take notice (influence +18 each); support rises; heat leaps.',
        effect: (s) => (infl(s, 'france', 18), infl(s, 'russia', 18), infl(s, 'ireland', 12), sup(s, 'sikh', 8), heat(s, 25), s.factions[P(s)].flags.duleep_cause = true, 'The Maharaja’s letters were read aloud in the gurdwaras by night.'),
      },
      {
        label: 'Send quiet word and silver (₹25k)',
        detail: 'Less heat, smaller gains.',
        available: (s) => s.factions[P(s)].treasury >= 25,
        effect: (s) => (fx.money(s, P(s), -25), infl(s, 'france', 10), infl(s, 'russia', 8), heat(s, 8), 'A courier took a draft on a Paris bank.'),
      },
    ],
    aiChoice: 1,
  },
  {
    id: 'st_duleep_moscow',
    title: 'Duleep Singh in Moscow',
    kind: 'historical',
    from: { year: 1887 },
    to: { year: 1887, festival: 'diwali' },
    weight: 6,
    mood: 'neutral',
    when: on,
    text: () => 'With the help of the Irish journalist Patrick Casey and the Russian editor Katkov, Duleep Singh has reached Moscow and asks the Tsar to march on India. The Tsar’s ministers are polite and do nothing.',
    effect: (s) => {
      if (s.factions[P(s)].flags.duleep_cause) infl(s, 'russia', 10);
    },
  },
  {
    id: 'st_duleep_dies',
    title: 'The last Maharaja dies in Paris',
    kind: 'historical',
    from: { year: 1893, festival: 'diwali' },
    to: { year: 1894 },
    weight: 7,
    mood: 'solemn',
    when: on,
    text: () => 'Maharaja Duleep Singh has died alone in a Paris hotel. The British bury him at Elveden, in England, not at Lahore.',
    effect: (s) => (sup(s, 'sikh', 4), infl(s, 'france', -10)),
  },
  {
    id: 'st_pagri_sambhal',
    title: 'Pagri sambhal jatta',
    kind: 'historical',
    from: { year: 1907 },
    to: { year: 1907, festival: 'diwali' },
    weight: 7,
    mood: 'heroic',
    when: on,
    text: () =>
      'New laws on the canal colonies and higher water rates have set the farmers of the Punjab alight. At Lyallpur they sing "Pagri sambhal jatta" — keep your turban, farmer, they are taking it. Sardar Ajit Singh and Lala Lajpat Rai are deported to Mandalay; the laws are withdrawn.',
    playerOnly: () => true,
    choices: [
      { label: 'Join the agitation', detail: 'Support +10 across the Punjab; heat +15.', effect: (s) => (sup(s, 'all', 10), heat(s, 15), 'Your organisers marched with the farmers.') },
      { label: 'Leave it to the farmers', detail: 'A smaller gain.', effect: (s) => (sup(s, 'all', 3), 'The farmers won without you.') },
    ],
    aiChoice: 1,
  },
  {
    id: 'st_ghadar',
    title: 'Ghadar: the paper from San Francisco',
    kind: 'historical',
    from: { year: 1913 },
    to: { year: 1914 },
    weight: 9,
    mood: 'heroic',
    when: on,
    text: () =>
      'In San Francisco, Punjabi farmers and mill-hands of the Pacific coast — Sohan Singh Bhakna, Har Dayal, the young Kartar Singh Sarabha — have founded the Ghadar Party and a paper, Ghadar, in Urdu and Gurmukhi. It reaches the Punjab hidden in luggage and is read aloud in the villages.',
    effect: (s) => {
      infl(s, 'america', 30);
      infl(s, 'germany', 8);
      s.struggle!.press = true;
      sup(s, 'sikh', 4);
    },
  },
  {
    id: 'st_komagata_maru',
    title: 'The Komagata Maru',
    kind: 'historical',
    from: { year: 1914 },
    to: { year: 1914, festival: 'diwali' },
    weight: 8,
    mood: 'solemn',
    when: on,
    text: () =>
      'The Komagata Maru, chartered by Baba Gurdit Singh to carry 376 Punjabi passengers to Canada, was kept two months in Vancouver harbour and turned away. At Budge Budge near Calcutta the police opened fire on the returning passengers; about twenty died.',
    effect: (s) => (sup(s, 'all', 6), infl(s, 'america', 10), heat(s, 5)),
  },
  {
    id: 'st_ghadar_rising',
    title: 'The Ghadar rising',
    kind: 'historical',
    from: { year: 1915 },
    to: { year: 1915 },
    weight: 9,
    mood: 'ominous',
    when: on,
    text: () =>
      'Thousands of Ghadarites have come home from America and the Far East. A rising is set for 21 February, with sepoys of the Lahore, Ferozepur and Meerut garrisons. But the police have an informer among the planners.',
    playerOnly: () => true,
    choices: [
      {
        label: 'Bring the date forward, and trust your cells',
        detail: 'Succeeds if your cells are many and your informers few: then risings this year are far likelier. Otherwise the plot is broken.',
        effect: (s) => {
          const st = s.struggle!;
          const inf = Object.values(st.informers).reduce((t, v) => t + v, 0);
          const cells = Object.values(st.cells).reduce((t, v) => t + v, 0);
          if (chance(s, clamp(0.2 + cells / 60 - inf * 0.12, 0.05, 0.8))) {
            for (const r of ['lahore', 'ferozepur', 'amritsar']) st.support[r] = clamp(st.support[r] + 25, 0, 100);
            for (const r of ['lahore', 'ferozepur', 'amritsar']) st.cells[r] = Math.max(2, st.cells[r]);
            return 'The informer was too late. In the cantonments the sepoys wait for your signal.';
          }
          heat(s, 35);
          st.arrests += 3;
          sup(s, 'sikh', 6);
          return 'The informer betrayed the plan. In the Lahore Conspiracy Case, Kartar Singh Sarabha — nineteen years old — and many others were hanged.';
        },
      },
      {
        label: 'Call it off, and save the men',
        detail: 'No rising; fewer arrests.',
        effect: (s) => (heat(s, 10), 'The signal was never given. The Ghadarites went home to their villages, watched.'),
      },
    ],
    aiChoice: 1,
  },
  {
    id: 'st_jallianwala',
    title: 'Jallianwala Bagh',
    kind: 'historical',
    from: { year: 1919 },
    to: { year: 1919 },
    weight: 10,
    mood: 'solemn',
    when: on,
    text: () =>
      'Vaisakhi, 13 April 1919. In the Jallianwala Bagh at Amritsar, a walled garden with one narrow entrance, thousands had gathered — many of them pilgrims come for the festival. General Dyer’s troops fired without warning until their ammunition was spent. Hundreds were killed; the official count is 379, others say more than a thousand.',
    effect: (s) => (sup(s, 'all', 18), heat(s, 10), infl(s, 'america', 8), infl(s, 'ireland', 8)),
  },
  {
    id: 'st_sgpc',
    title: 'The Gurdwara Reform Movement',
    kind: 'historical',
    from: { year: 1920, festival: 'diwali' },
    to: { year: 1921 },
    weight: 8,
    mood: 'heroic',
    when: on,
    text: () =>
      'The Shiromani Gurdwara Parbandhak Committee and the Akali Dal have been founded to free the gurdwaras from the mahants and government managers. Their weapon is the morcha: jathas that court arrest without lifting a hand. A morcha at Amritsar will free the Akal Takht.',
    effect: (s) => {
      sup(s, 'sikh', 6);
      s.struggle!.organisers += 1;
    },
  },
  {
    id: 'st_nankana',
    title: 'Nankana Sahib',
    kind: 'historical',
    from: { year: 1921 },
    to: { year: 1921 },
    weight: 8,
    mood: 'solemn',
    when: on,
    text: () => 'At Nankana Sahib, the birthplace of Guru Nanak Dev Ji, the mahant’s hired men have killed some 130 unarmed Akalis who came to take over the gurdwara. The Panth is in mourning; the government gives the gurdwara to the Akalis.',
    effect: (s) => {
      sup(s, 'sikh', 8);
      s.struggle!.gurdwaraReform = clamp(s.struggle!.gurdwaraReform + 20, 0, 100);
    },
  },
  {
    id: 'st_gurdwara_act',
    title: 'The Sikh Gurdwaras Act',
    kind: 'historical',
    from: { year: 1925 },
    to: { year: 1925, festival: 'diwali' },
    weight: 8,
    mood: 'festive',
    when: (s) => on(s) && !s.flags?.gurdwaras_freed && s.struggle!.gurdwaraReform >= 40,
    text: () => 'After Guru ka Bagh and Jaito, the government yields. The Sikh Gurdwaras Act passes the historic gurdwaras, the Darbar Sahib and the Akal Takht to the Panth’s own elected committee.',
    effect: (s) => {
      s.struggle!.gurdwaraReform = 100;
    },
  },
  {
    id: 'st_bhagat_singh',
    title: 'Bhagat Singh',
    kind: 'historical',
    from: { year: 1931 },
    to: { year: 1931 },
    weight: 8,
    mood: 'solemn',
    when: on,
    text: () => 'In Lahore jail, Bhagat Singh, Sukhdev and Rajguru have been hanged — a day earlier than announced, their bodies burned in secret by the Sutlej. Bhagat Singh was twenty-three. His writings from prison are passed from hand to hand.',
    effect: (s) => (sup(s, 'all', 8), heat(s, 6)),
  },
  {
    id: 'st_ina',
    title: 'The Indian National Army',
    kind: 'historical',
    from: { year: 1942 },
    to: { year: 1943 },
    weight: 7,
    mood: 'neutral',
    when: on,
    text: () => 'In Malaya, Captain Mohan Singh has raised an Indian National Army from prisoners of war taken by the Japanese — many of them Sikh soldiers. Later Subhas Chandra Bose will lead it toward Burma.',
    playerOnly: () => true,
    choices: [
      { label: 'Send word of support', detail: 'Japanese influence +20; heat +15.', effect: (s) => (infl(s, 'japan', 20), heat(s, 15), 'A message went by the long road through Kabul.') },
      { label: 'Keep to your own road', detail: 'Nothing gained, nothing risked.', effect: () => 'You kept your own counsel.' },
    ],
    aiChoice: 1,
  },
  {
    id: 'st_1946',
    title: 'The year before',
    kind: 'historical',
    from: { year: 1946 },
    to: { year: 1946, festival: 'diwali' },
    weight: 8,
    mood: 'ominous',
    when: on,
    text: () =>
      'The British are leaving. The Muslim League demands Pakistan, the Congress a united India; the line, everyone fears, will run through the middle of the Punjab — through Lahore, through the canal colonies, through the Sikh heartland. The Panth must make its voice heard now.',
    playerOnly: () => true,
    choices: [
      { label: 'Demand a Punjab of its own, with the Sikhs as its keepers', detail: 'Support +10; foreign influence counts heavily at the end.', effect: (s) => (sup(s, 'sikh', 10), heat(s, 10), 'The demand went to the Cabinet Mission.') },
      { label: 'Work for a united Punjab with every community', detail: 'Support +5 everywhere.', effect: (s) => (sup(s, 'all', 5), 'You worked with men of every faith for one Punjab.') },
    ],
    aiChoice: 1,
  },
];
