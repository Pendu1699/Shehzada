// The Long Struggle: who the movement could actually meet abroad, by year,
// and the ventures that paid for it.

import type { Power } from '../engine/struggle';

export interface Contact {
  from: number;
  to: number;
  name: string;
  note: string;
}

/** The people an envoy of the movement would sit down with, power by power. */
export const CONTACTS: Record<Power, Contact[]> = {
  france: [
    { from: 1849, to: 1870, name: 'The ministers of Napoleon III', note: 'The Second Empire watched Britain warily, and let exiles talk in its cafés.' },
    { from: 1870, to: 1885, name: 'Indian exiles in republican Paris', note: 'Paris was where the enemies of every empire came to argue.' },
    { from: 1886, to: 1893, name: 'Maharaja Duleep Singh in Paris', note: 'The last Maharaja lived in Paris from 1886, with the Fenian Patrick Casey among his friends, and died there in 1893.' },
    { from: 1894, to: 1935, name: 'Madame Bhikaiji Cama and the Paris Indian Society', note: 'She raised a flag of free India at Stuttgart in 1907 and ran papers from Paris for thirty years.' },
    { from: 1936, to: 1947, name: 'Indian students and exiles in Paris', note: 'A smaller circle by now, but still a door to the press of Europe.' },
  ],
  russia: [
    { from: 1849, to: 1866, name: 'The Tsar’s generals at Orenburg', note: 'Russia was still crossing the steppe toward Central Asia.' },
    { from: 1867, to: 1881, name: 'General Kaufman, Governor-General at Tashkent', note: 'From Tashkent the Russians looked over the Pamirs toward India.' },
    { from: 1882, to: 1888, name: 'Mikhail Katkov’s circle in Moscow', note: 'Katkov, the Moscow editor, brought Duleep Singh to Russia in 1887 to press his cause with the Tsar.' },
    { from: 1889, to: 1917, name: 'The General Staff at Tashkent', note: 'The Great Game went on in maps and spies until the revolution.' },
  ],
  afghanistan: [
    { from: 1849, to: 1863, name: 'Amir Dost Mohammad Khan', note: 'He had fought the British and the Sikhs both, and trusted neither.' },
    { from: 1864, to: 1879, name: 'Amir Sher Ali Khan', note: 'He received a Russian mission in 1878 — and the British invaded.' },
    { from: 1880, to: 1901, name: 'Amir Abdur Rahman Khan', note: 'The Iron Amir took British money and gave little back.' },
    { from: 1902, to: 1919, name: 'Amir Habibullah Khan', note: 'In 1915 a Provisional Government of Free India was proclaimed in Kabul under his eye.' },
    { from: 1919, to: 1929, name: 'King Amanullah Khan', note: 'He won Afghanistan’s full independence from Britain in 1919.' },
    { from: 1930, to: 1947, name: 'The court of Kabul', note: 'Under Nadir Shah and Zahir Shah, Kabul stayed careful.' },
  ],
  ireland: [
    { from: 1860, to: 1881, name: 'The Fenian Brotherhood', note: 'Irish republicans in America and Paris, sworn enemies of the Crown.' },
    { from: 1882, to: 1916, name: 'Clan na Gael', note: 'The Irish-American brotherhood worked with the Ghadar Party and the Germans in 1915.' },
    { from: 1917, to: 1922, name: 'Éamon de Valera and the Friends of Freedom for India', note: 'In New York in 1920 de Valera spoke for India’s freedom alongside Ireland’s.' },
  ],
  america: [
    { from: 1900, to: 1912, name: 'The Khalsa Diwan Society, Vancouver', note: 'Punjabi mill-hands and farmers of British Columbia, founded 1906; they built gurdwaras and sent money home.' },
    { from: 1913, to: 1918, name: 'The Ghadar Party at Yugantar Ashram, San Francisco', note: 'Sohan Singh Bhakna, Lala Har Dayal and Kartar Singh Sarabha printed Ghadar there.' },
    { from: 1919, to: 1938, name: 'The Pacific Coast Khalsa Diwan Society, Stockton', note: 'The Stockton gurdwara (1912) was the meeting place of the Punjabis of California.' },
    { from: 1939, to: 1947, name: 'J. J. Singh’s India League of America', note: 'A Sikh merchant in New York who lobbied Congress for Indian freedom and citizenship.' },
  ],
  germany: [
    { from: 1900, to: 1913, name: 'The Kaiser’s Foreign Office', note: 'Berlin watched the British Empire for weak seams.' },
    { from: 1914, to: 1918, name: 'The Berlin India Committee', note: 'Indian revolutionaries in Berlin, with German money and arms ships for the Ghadar rising.' },
    { from: 1919, to: 1940, name: 'The Foreign Office in Berlin', note: 'After the war Germany had little to give.' },
    { from: 1941, to: 1945, name: 'Subhas Chandra Bose’s Free India Centre, Berlin', note: 'Bose raised a legion of Indian prisoners of war in Germany before leaving for Asia.' },
  ],
  japan: [
    { from: 1937, to: 1941, name: 'Rash Behari Bose in Tokyo', note: 'An Indian revolutionary in exile since 1915, who founded the Indian Independence League.' },
    { from: 1942, to: 1945, name: 'Major Fujiwara and Captain Mohan Singh', note: 'Mohan Singh, a Sikh officer of the British Indian Army, raised the first Indian National Army in 1942.' },
  ],
};

export function contactOf(power: Power, y: number): Contact | null {
  return CONTACTS[power].find((c) => y >= c.from && y <= c.to) ?? null;
}

export type Ask = 'funds' | 'arms' | 'shelter' | 'voice';

export const ASKS: Record<Ask, { name: string; detail: string }> = {
  funds: { name: 'Ask for money', detail: 'Silver for the movement. The more they trust you, the more they give — and the less they trust you afterward.' },
  arms: { name: 'Ask for arms', detail: 'Rifles smuggled in for a rising: each shipment makes a rising likelier to hold. Ships can be caught at sea.' },
  shelter: { name: 'Shelter our exiles', detail: 'Hunted leaders slip abroad. The police lose the trail: heat falls.' },
  voice: { name: 'Speak for us', detail: 'Raise the Punjab in their press and parliaments. The world hearing the Panth counts in 1947.' },
};

/* ── Paying for it ──────────────────────────────────────────────────────── */

export type Venture = 'trade' | 'colony' | 'bank' | 'farms' | 'transport' | 'school';

export const VENTURES: Record<Venture, { name: string; from: number; cost: number; income: number; detail: string }> = {
  trade: {
    name: 'A trading house in the bazaar',
    from: 1849,
    cost: 30,
    income: 3,
    detail: 'Sikh merchants of Amritsar’s shawl and grain trade give a share of their profit to the cause.',
  },
  colony: {
    name: 'Land in the canal colonies',
    from: 1892,
    cost: 50,
    income: 6,
    detail: 'The new canals turned the bar into wheat land around Lyallpur. Sikh families settled it, and their harvests feed the movement.',
  },
  bank: {
    name: 'A Sikh bank',
    from: 1904,
    cost: 60,
    income: 5,
    detail: 'The Co-operative Credit Societies Act (1904) made Sikh credit societies legal; the Punjab & Sind Bank was founded in Amritsar in 1908. Its income grows with support.',
  },
  farms: {
    name: 'Farms in the Sacramento valley',
    from: 1905,
    cost: 40,
    income: 4,
    detail: 'Punjabi farmers in California lease orchards and rice land; their remittances grow with your friends in America.',
  },
  transport: {
    name: 'A motor transport company',
    from: 1920,
    cost: 40,
    income: 5,
    detail: 'Sikh drivers and owners ran most of the lorries and buses of the Punjab between the wars.',
  },
  school: {
    name: 'Khalsa schools and a college',
    from: 1892,
    cost: 50,
    income: 0,
    detail: 'Khalsa College, Amritsar, opened in 1892. Schools train the next generation of workers: one more organiser, for good, and support across the Punjab.',
  },
};

/** Melas where a collection brings in more. */
export const MELA_REGIONS: Record<string, string> = {
  amritsar: 'Vaisakhi and Diwali at Amritsar',
  anandpur: 'Hola Mohalla at Anandpur',
  faridkot: 'the Maghi mela at Muktsar',
};
