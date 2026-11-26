// After 1947: the settlement of the player's lands, the Punjabi Suba movement
// (1947–1966), and the first years of a Sikh state that history never had.
// The Suba events follow the standard accounts; the state's are alternative
// history built on the real questions of 1947–50: refugees, Kashmir, the canal
// waters, and what kind of state to be. Violence is reported as history; the
// game rewards shelter, restraint and organisation.

import { PUNJAB_REGION_IDS, REGION_BY_ID } from '../regions';
import { bargainingPower, settle, settlementLands } from '../../engine/partition';
import { clamp, regionsOf } from '../../engine/query';
import type { GameState } from '../../engine/state';
import { fx, P } from './fx';
import type { EventDef } from './types';

const suba = (s: GameState) => !!s.flags?.suba && !!s.struggle;
const state = (s: GameState) => typeof s.factions[P(s)]?.flags.state_name === 'string';
const free = (s: GameState) => state(s) && !!s.factions[P(s)].flags.khalsa_state;
const name = (s: GameState) => String(s.factions[P(s)].flags.state_name);

const sup = (s: GameState, d: number) => {
  const st = s.struggle!;
  for (const r of PUNJAB_REGION_IDS) if (st.support[r] !== undefined && REGION_BY_ID[r].faith.sikh >= 20) st.support[r] = clamp(st.support[r] + d, 0, 100);
};
const heat = (s: GameState, d: number): void => {
  s.struggle!.heat = clamp(s.struggle!.heat + d, 0, 100);
};
const progress = (s: GameState, d: number): void => {
  s.struggle!.suba = clamp((s.struggle!.suba ?? 0) + d, 0, 100);
};
const stabilityAll = (s: GameState, d: number, filter: (r: string) => boolean = () => true) => {
  for (const r of regionsOf(s, P(s))) if (filter(r)) fx.stability(s, r, d);
};

function sovereignDetail(s: GameState, label: string): string {
  const power = bargainingPower(s);
  const { add, princes } = settlementLands(s, 'sovereign');
  const what =
    power >= 60
      ? `Your strength at the table (${power}) wins the Sikh lands around yours as well (${add.length} more)${princes ? ', and the Sikh princes of Patiala, Nabha, Jind, Faridkot and Kapurthala join you' : ''}.`
      : `Your strength at the table (${power}) wins recognition for the ${regionsOf(s, P(s)).length} lands you hold, and no more. (60 would win the Sikh lands around them.)`;
  return `${label} ${what} India and Pakistan will be wary neighbours.`;
}

export const AFTER: EventDef[] = [
  {
    id: 'st_settlement',
    title: 'The transfer of power',
    gurmukhi: 'ਸੱਤਾ ਦਾ ਤਬਾਦਲਾ',
    kind: 'historical',
    weight: 10,
    mood: 'solemn',
    once: true,
    when: () => false, // queued by "ride on" in 1947, never on its own
    text: (s) =>
      `The British are leaving. In Delhi the Viceroy, the Congress and the Muslim League bargain over maps, and a lawyer who has never seen the Punjab is drawing a line through it. You hold ${regionsOf(s, P(s)).length} ${regionsOf(s, P(s)).length === 1 ? 'land' : 'lands'} — and so the Panth has a seat at the table. What will you ask for?`,
    playerOnly: () => true,
    choices: [
      {
        label: 'Proclaim Khalistan, a sovereign Sikh state',
        detail: (s) => sovereignDetail(s, 'The name was first put forward in a pamphlet of 1940.'),
        effect: (s) => settle(s, 'sovereign', 'Khalistan'),
      },
      {
        label: 'Proclaim Sikhistan, a sovereign Sikh state',
        detail: (s) => sovereignDetail(s, 'The Akali Dal resolved for a Sikh state in March 1946; some called it Sikhistan.'),
        effect: (s) => settle(s, 'sovereign', 'Sikhistan'),
      },
      {
        label: 'Restore the Sarkar-i-Khalsa',
        detail: (s) => sovereignDetail(s, 'The old name of Ranjit Singh’s state, taken up again.'),
        effect: (s) => settle(s, 'sovereign', 'the Sarkar-i-Khalsa'),
      },
      {
        label: 'Join the Indian Union as Azad Punjab, a self-governing Sikh state',
        detail: (s) =>
          `The Akalis’ “Azad Punjab” plan of 1943: a province where Sikhs carry real weight. India grants your lands and ${settlementLands(s, 'autonomous').add.length} Sikh-majority lands around them, self-governing within the Union. Peace with India, light tribute; you may grow toward more.`,
        effect: (s) => settle(s, 'autonomous', 'Azad Punjab'),
      },
    ],
    aiChoice: 3,
  },

  /* ── The Punjabi Suba movement (no land in 1947) ── */
  {
    id: 'st_ps_partition',
    title: 'Ten million cross the line',
    kind: 'historical',
    from: { year: 1947 },
    to: { year: 1949 },
    weight: 9,
    mood: 'solemn',
    when: suba,
    text: () =>
      'The Radcliffe line has cut the Punjab in two. Columns of refugees miles long walk east and west; trains arrive full of the dead. Nankana Sahib, Panja Sahib and the canal colonies the Sikhs built are on the far side now.',
    playerOnly: () => true,
    choices: [
      {
        label: 'Open langars on every road, for refugees of every faith (₹20k)',
        detail: 'Piri and support rise; the movement is remembered for it.',
        available: (s) => s.factions[P(s)].treasury >= 20,
        effect: (s) => (fx.money(s, P(s), -20), fx.piri(s, P(s), 6, 'Langar for the refugees of 1947'), sup(s, 6), 'The langars fed whoever came, and asked nobody’s faith.'),
      },
      {
        label: 'Organise the camps and resettle the families from the west',
        detail: 'Support rises among the uprooted.',
        effect: (s) => (sup(s, 8), 'Families from Lyallpur and Montgomery were found land in the east.'),
      },
    ],
    aiChoice: 1,
  },
  {
    id: 'st_ps_pepsu',
    title: 'PEPSU',
    kind: 'historical',
    from: { year: 1948 },
    to: { year: 1949 },
    weight: 4,
    when: suba,
    text: () => 'Patiala, Nabha, Jind, Faridkot, Kapurthala, Malerkotla, Kalsia and Nalagarh are joined as the Patiala and East Punjab States Union, with the Maharaja of Patiala as Rajpramukh.',
    effect: (s) => progress(s, 3),
  },
  {
    id: 'st_ps_tara_singh',
    title: 'Master Tara Singh',
    kind: 'historical',
    from: { year: 1949 },
    to: { year: 1951 },
    weight: 6,
    mood: 'heroic',
    when: suba,
    text: () => 'Master Tara Singh and the Akali Dal ask for a state of the Punjabi language. The government calls it communalism; the villages call it the Punjabi Suba.',
    effect: (s) => (progress(s, 6), sup(s, 4)),
  },
  {
    id: 'st_ps_1955',
    title: 'The slogan is banned',
    kind: 'historical',
    from: { year: 1955 },
    to: { year: 1955, festival: 'diwali' },
    weight: 8,
    mood: 'ominous',
    when: suba,
    text: () =>
      'The government has banned the slogan “Punjabi Suba zindabad”. Twelve thousand have courted arrest shouting it; on the 4th of July the police entered the Darbar Sahib itself in pursuit of the jathas.',
    playerOnly: () => true,
    choices: [
      { label: 'Send jatha after jatha to court arrest', detail: 'The Suba advances greatly; heat soars.', effect: (s) => (progress(s, 15), heat(s, 15), sup(s, 5), 'The jails filled, and the ban was lifted.') },
      { label: 'Call off the morcha and talk', detail: 'Heat falls.', effect: (s) => (heat(s, -12), progress(s, 3), 'The leaders went to Delhi.') },
    ],
    aiChoice: 0,
  },
  {
    id: 'st_ps_src',
    title: 'The Commission says no',
    kind: 'historical',
    from: { year: 1955, festival: 'diwali' },
    to: { year: 1956, festival: 'diwali' },
    weight: 6,
    when: suba,
    text: () =>
      'The States Reorganisation Commission has redrawn India by language — every language but Punjabi. Instead Delhi offers the “Regional Formula”: one Punjab, with Hindi and Punjabi regional committees.',
    playerOnly: () => true,
    choices: [
      { label: 'Accept the Regional Formula, for now', detail: 'Heat falls; a little progress.', effect: (s) => (heat(s, -15), progress(s, 6), 'The Akalis tried the committees.') },
      { label: 'Reject it: nothing less than the Suba', detail: 'Support rises; so does heat.', effect: (s) => (sup(s, 5), heat(s, 6), progress(s, 3), 'The demand stood.') },
    ],
    aiChoice: 0,
  },
  {
    id: 'st_ps_1960',
    title: 'The great morcha',
    kind: 'historical',
    from: { year: 1960 },
    to: { year: 1961, festival: 'diwali' },
    weight: 8,
    mood: 'heroic',
    when: suba,
    text: () =>
      'The morcha of 1960 has sent some fifty-seven thousand to jail. Master Tara Singh is arrested; Sant Fateh Singh begins a fast unto death for the Punjabi Suba.',
    playerOnly: () => true,
    choices: [
      { label: 'Stand behind the fast', detail: 'Great progress and Piri; great heat.', effect: (s) => (progress(s, 15), fx.piri(s, P(s), 3, 'The fast for the Punjabi Suba'), heat(s, 12), 'The whole Punjab watched the fast.') },
      { label: 'Seek a settlement with Delhi', detail: 'Heat falls; some progress.', effect: (s) => (heat(s, -10), progress(s, 6), 'The fast was ended on a promise.') },
    ],
    aiChoice: 1,
  },
  {
    id: 'st_ps_1965',
    title: 'The war of 1965',
    kind: 'historical',
    from: { year: 1965 },
    to: { year: 1965, festival: 'diwali' },
    weight: 7,
    when: suba,
    text: () =>
      'War with Pakistan again, fought across the Punjab at Khem Karan and Asal Uttar. Sikh soldiers and Punjabi villagers carried the front. Delhi, grateful, opens the question of the Suba once more.',
    effect: (s) => (progress(s, 15), sup(s, 4)),
  },
  {
    id: 'st_ps_1966',
    title: 'The Punjab Reorganisation Act',
    kind: 'historical',
    from: { year: 1966, festival: 'diwali' },
    to: { year: 1967 },
    weight: 9,
    when: suba,
    text: () =>
      'On the 1st of November 1966 the Punjab is divided again, by language: a Punjabi-speaking Punjab, Haryana, and the hills to Himachal. Chandigarh becomes a union territory shared by two states; Punjabi-speaking villages are left outside, and the river waters are left to Delhi.',
  },

  /* ── A Sikh state, 1947–1950 ── */
  {
    id: 'kh_refugees',
    title: 'The refugees',
    kind: 'historical',
    from: { year: 1947 },
    to: { year: 1949 },
    weight: 8,
    mood: 'solemn',
    when: state,
    text: (s) =>
      `The line Radcliffe drew runs past the borders of ${name(s)}. Refugees of every faith pour across them: Sikhs and Hindus from the west, Muslims fleeing to Pakistan. The roads are full of the old, the hungry and the hunted.`,
    playerOnly: () => true,
    choices: [
      {
        label: 'Shelter all who come, and escort the Muslims safely west (₹30k)',
        detail: 'Piri and the world’s regard; the new state’s name is made.',
        available: (s) => s.factions[P(s)].treasury >= 30,
        effect: (s) => (fx.money(s, P(s), -30), fx.piri(s, P(s), 8, 'Shelter for the refugees of every faith'), fx.legend(s, P(s), 15), fx.attitude(s, 'pakistan', P(s), 20), fx.attitude(s, 'india', P(s), 10), 'The langars fed whoever came; Nihang jathas guarded the Muslim columns to the border.'),
      },
      {
        label: 'Close the borders and keep order inside them',
        detail: 'Stability, at a cost in Piri.',
        effect: (s) => (stabilityAll(s, 8), fx.piri(s, P(s), -4, 'Turning refugees away'), 'The borders were closed; order was kept, and some were left outside.'),
      },
    ],
    aiChoice: 1,
  },
  {
    id: 'kh_kashmir',
    title: 'War in Kashmir',
    kind: 'historical',
    from: { year: 1947, festival: 'diwali' },
    to: { year: 1948, festival: 'diwali' },
    weight: 7,
    when: free,
    text: (s) =>
      `India and Pakistan are at war over Kashmir. The Maharaja has acceded to India; tribesmen and Pakistani troops hold the west of the valley. ${regionsOf(s, P(s)).includes('pathankot') ? 'The only road from India to Jammu runs through Pathankot — through your lands.' : 'Both ask where you stand.'}`,
    playerOnly: () => true,
    choices: [
      { label: 'Stay neutral', detail: 'Neither is pleased, neither is angered.', effect: () => 'The state kept out of it.' },
      { label: 'Offer to mediate', detail: 'Legend; both cool a little if it fails.', effect: (s) => (fx.legend(s, P(s), 10), fx.attitude(s, 'india', P(s), -3), fx.attitude(s, 'pakistan', P(s), -3), 'Envoys went to Delhi and Karachi.') },
      { label: 'Let the Indian army pass', detail: 'India grateful; Pakistan hostile.', effect: (s) => (fx.attitude(s, 'india', P(s), 30), fx.attitude(s, 'pakistan', P(s), -30), 'Indian columns rolled north through your lands.') },
    ],
    aiChoice: 0,
  },
  {
    id: 'kh_waters',
    title: 'The canal waters',
    kind: 'historical',
    from: { year: 1948 },
    to: { year: 1949 },
    weight: 6,
    when: free,
    text: (s) =>
      `The canals of the west were cut to carry the rivers of the east. Now the headworks are in ${name(s)}, and Pakistan's fields wait on your gates. (In April 1948 India shut them for a month; the quarrel ran until the Indus Waters Treaty of 1960.)`,
    playerOnly: () => true,
    choices: [
      { label: 'Share the waters by treaty', detail: 'Pakistan warms greatly; Legend.', effect: (s) => (fx.attitude(s, 'pakistan', P(s), 35), fx.legend(s, P(s), 8), 'A treaty shared the rivers.') },
      { label: 'Sell the water dearly (+₹60k)', detail: 'Silver; Pakistan bitter.', effect: (s) => (fx.money(s, P(s), 60), fx.attitude(s, 'pakistan', P(s), -30), 'Water was sold by the cusec.') },
    ],
    aiChoice: 0,
  },
  {
    id: 'kh_constitution',
    title: 'A constitution',
    kind: 'historical',
    from: { year: 1949 },
    to: { year: 1951 },
    weight: 7,
    when: state,
    text: (s) => `${name(s).replace(/^t/, 'T')} needs a constitution. Its people are Sikh, Hindu, Muslim and Christian; its founders want it to be the Khalsa’s.`,
    playerOnly: () => true,
    choices: [
      {
        label: 'A state for all its people, under the Khalsa’s protection',
        detail: 'Stability everywhere; Piri through tolerance.',
        effect: (s) => (stabilityAll(s, 10), fx.piri(s, P(s), 3, 'A constitution for all faiths'), 'Every faith was given its place, as in the Sarkar’s darbar.'),
      },
      {
        label: 'A state of the Khalsa',
        detail: 'Piri; unrest where Sikhs are few.',
        effect: (s) => (fx.piri(s, P(s), 5, 'A Khalsa state'), stabilityAll(s, -10, (r) => REGION_BY_ID[r].faith.sikh < 40), 'The Panth wrote the laws.'),
      },
    ],
    aiChoice: 0,
  },
];
