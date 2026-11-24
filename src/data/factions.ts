// Factions: the twelve misls and the powers around them.
//
// Every faction is written as people with their own interests. The Durrani kings
// came for revenue and prestige and went home; the Company was patient and
// methodical; the hill rajas balanced between stronger neighbours. None of them is
// a caricature, and the Sarkar-i-Khalsa itself was served by men of every faith.

export type FactionKind = 'misl' | 'power';

export interface Personality {
  /** Willingness to start wars. */
  aggression: number;
  /** Preference for defence and forts. */
  caution: number;
  /** Religious fervour: drives Josh response, Panthic unity. */
  zeal: number;
  /** Appetite for plunder and tribute. */
  greed: number;
  /** Keeps treaties and gurmatas. */
  honour: number;
}

export interface FactionBonus {
  label: string;
  detail: string;
}

export interface FactionModifiers {
  revenue?: number;
  trade?: number;
  piriGain?: number;
  siege?: number;
  fortDefense?: number;
  diplomacy?: number;
  recruitCost?: number;
  cavalryAttack?: number;
  artillery?: number;
  morale?: number;
  growth?: number;
  fortCost?: number;
  marriage?: number;
}

export interface FactionDef {
  id: string;
  name: string;
  /** Short epithet for cards. */
  epithet: string;
  kind: FactionKind;
  /** True for the Sikh misls (and the Sarkar they may become). */
  sikh: boolean;
  playable: boolean;
  /** Map tint. */
  color: string;
  /** Banner field and band colours, plus an emblem id drawn in src/art/banners.ts. */
  banner: { field: string; band: string; emblem: string; nishan?: boolean };
  description: string;
  bonuses: FactionBonus[];
  mods: FactionModifiers;
  personality: Personality;
  /**
   * A power of the wider subcontinent. Its frontiers move with the historical
   * timeline (engine/history.ts) rather than by AI conquest, unless the player
   * is fighting it; it defends what it holds.
   */
  distant?: boolean;
}

const misl = (d: Omit<FactionDef, 'kind' | 'sikh' | 'playable'>): FactionDef => ({ ...d, kind: 'misl', sikh: true, playable: true });
const power = (d: Omit<FactionDef, 'kind' | 'sikh' | 'playable' | 'bonuses'> & { bonuses?: FactionBonus[] }): FactionDef => ({
  bonuses: [],
  ...d,
  kind: 'power',
  sikh: false,
  playable: false,
});

export const FACTIONS: FactionDef[] = [
  misl({
    id: 'ahluwalia',
    name: 'Ahluwalia',
    epithet: 'Leaders of the Dal Khalsa',
    color: '#D97B1A',
    banner: { field: '#E8870E', band: '#C9A13B', emblem: 'khanda', nishan: true },
    description:
      'Jassa Singh Ahluwalia, raised in the household of Nawab Kapur Singh, led the Dal Khalsa for a generation. His misl is not the largest, but the Panth listens when he speaks.',
    bonuses: [
      { label: 'Sultan-ul-Qaum', detail: 'Starts with high Piri; Piri gains +25%.' },
      { label: 'Voice of the Panth', detail: 'Gurmatas you propose gain extra support.' },
      { label: 'Kapurthala', detail: 'Good diplomacy with all misls.' },
    ],
    mods: { piriGain: 1.25, diplomacy: 1.2 },
    personality: { aggression: 0.4, caution: 0.5, zeal: 0.8, greed: 0.3, honour: 0.9 },
  }),
  misl({
    id: 'bhangi',
    name: 'Bhangi',
    epithet: 'Masters of Lahore and the great gun',
    color: '#2E5E4E',
    banner: { field: '#1F3A68', band: '#E8870E', emblem: 'gun' },
    description:
      'The strongest misl of the early years, holding Amritsar, Lahore, Gujrat and Sialkot at its height. Its chiefs captured the great Zamzama gun, ever after called “Bhangian di Top”.',
    bonuses: [
      { label: 'Bhangian di Top', detail: 'Heavy guns cost less; +30% siege.' },
      { label: 'Majha strength', detail: '+10% land revenue.' },
    ],
    mods: { siege: 1.3, artillery: 1.2, revenue: 1.1 },
    personality: { aggression: 0.65, caution: 0.4, zeal: 0.5, greed: 0.6, honour: 0.55 },
  }),
  misl({
    id: 'ramgarhia',
    name: 'Ramgarhia',
    epithet: 'Builders of forts',
    color: '#8A5A2B',
    banner: { field: '#E8870E', band: '#1B1712', emblem: 'fort' },
    description:
      'Jassa Singh Ramgarhia held the mud fort of Ram Rauni at Amritsar and rebuilt it as Ramgarh. A carpenter’s son and a master of walls, he was exiled, returned and outlived most of his rivals.',
    bonuses: [
      { label: 'Ramgarh', detail: 'Forts cost half; +40% fort defence.' },
      { label: 'Craftsmen', detail: '+15% trade income.' },
    ],
    mods: { fortCost: 0.5, fortDefense: 1.4, trade: 1.15 },
    personality: { aggression: 0.5, caution: 0.7, zeal: 0.6, greed: 0.4, honour: 0.7 },
  }),
  misl({
    id: 'kanhaiya',
    name: 'Kanhaiya',
    epithet: 'Alliances and marriages',
    color: '#7A3B69',
    banner: { field: '#1F3A68', band: '#B83A2B', emblem: 'lotus' },
    description:
      'Jai Singh Kanhaiya ruled from Batala and the hills. His daughter-in-law Sada Kaur became one of the shrewdest minds of the age and the patron of the young Ranjit Singh.',
    bonuses: [
      { label: 'Marriage alliances', detail: 'Marriage diplomacy far more effective.' },
      { label: 'Sada Kaur', detail: 'A powerful leader with her own event chain.' },
    ],
    mods: { diplomacy: 1.25, marriage: 1.6 },
    personality: { aggression: 0.5, caution: 0.55, zeal: 0.5, greed: 0.5, honour: 0.65 },
  }),
  misl({
    id: 'sukerchakia',
    name: 'Sukerchakia',
    epithet: 'Small beginnings, great destiny',
    color: '#C8962E',
    banner: { field: '#E8870E', band: '#5E6B2E', emblem: 'lion' },
    description:
      'Charat Singh’s misl began around Gujranwala with little land. His son Maha Singh and grandson Ranjit Singh would build from it the Sarkar-i-Khalsa.',
    bonuses: [
      { label: 'Rising star', detail: '+25% growth from conquest and revenue.' },
      { label: 'Ghorchare', detail: '+10% cavalry attack.' },
    ],
    mods: { growth: 1.25, cavalryAttack: 1.1 },
    personality: { aggression: 0.7, caution: 0.4, zeal: 0.5, greed: 0.5, honour: 0.6 },
  }),
  misl({
    id: 'nakai',
    name: 'Nakai',
    epithet: 'Horse-breeders of the Nakka',
    color: '#7C8C2E',
    banner: { field: '#E8870E', band: '#7C8C2E', emblem: 'horse' },
    description:
      'From the Nakka country south-west of Lahore, famed for its horses. Ranjit Singh’s first wife, Datar Kaur, came from the Nakai house.',
    bonuses: [
      { label: 'Nakka horses', detail: 'Cavalry recruits cost 20% less.' },
      { label: 'Riders of the bar', detail: 'Cavalry moves freely in the bar.' },
    ],
    mods: { recruitCost: 0.8 },
    personality: { aggression: 0.45, caution: 0.55, zeal: 0.5, greed: 0.45, honour: 0.65 },
  }),
  misl({
    id: 'dallewalia',
    name: 'Dallewalia',
    epithet: 'Raiders across the Sutlej',
    color: '#B5653A',
    banner: { field: '#1F3A68', band: '#E8870E', emblem: 'spear' },
    description:
      'Led by Gulab Singh and later the famous Tara Singh Ghaiba, holding Rahon and lands on both banks of the Sutlej.',
    bonuses: [{ label: 'Ghaiba', detail: '+20% cavalry attack in Dhai Phat.' }],
    mods: { cavalryAttack: 1.15 },
    personality: { aggression: 0.6, caution: 0.4, zeal: 0.55, greed: 0.55, honour: 0.6 },
  }),
  misl({
    id: 'nishanwalia',
    name: 'Nishanwalia',
    epithet: 'Standard-bearers of the Dal Khalsa',
    color: '#2F4F86',
    banner: { field: '#E8870E', band: '#1F3A68', emblem: 'khanda', nishan: true },
    description: 'The misl that carried the Nishan Sahib before the Dal Khalsa in battle, settled around Ambala and Shahabad.',
    bonuses: [
      { label: 'The Nishan', detail: 'All Sikh armies fighting beside yours gain morale.' },
      { label: 'Steadfast', detail: '+10% morale.' },
    ],
    mods: { morale: 1.1, piriGain: 1.1 },
    personality: { aggression: 0.4, caution: 0.55, zeal: 0.75, greed: 0.3, honour: 0.85 },
  }),
  misl({
    id: 'faizullapuria',
    name: 'Faizullapuria (Singhpuria)',
    epithet: 'Nawab Kapur Singh’s misl',
    color: '#9B7A3C',
    banner: { field: '#E8870E', band: '#C9A13B', emblem: 'sun' },
    description:
      'Nawab Kapur Singh accepted a nawabship from the Mughals in 1733 and used it to organise the Khalsa into the Budha Dal and Taruna Dal. His misl later held Jalandhar.',
    bonuses: [
      { label: 'The Nawab’s counsel', detail: 'Leaders are more loyal.' },
      { label: 'Budha Dal veterans', detail: '+10% morale.' },
    ],
    mods: { morale: 1.1, piriGain: 1.1 },
    personality: { aggression: 0.4, caution: 0.6, zeal: 0.7, greed: 0.35, honour: 0.85 },
  }),
  misl({
    id: 'karorasinghia',
    name: 'Karorasinghia',
    epithet: 'Baghel Singh’s riders',
    color: '#5E4B8B',
    banner: { field: '#1F3A68', band: '#C9A13B', emblem: 'star' },
    description:
      'From Hoshiarpur to the Cis-Sutlej and beyond the Yamuna. Its chief Baghel Singh entered Delhi in 1783 and had the sites of the Gurus’ history marked with gurdwaras.',
    bonuses: [
      { label: 'Beyond the Yamuna', detail: 'Raids and rakhi in the Ganga–Yamuna doab pay more.' },
      { label: 'Delhi', detail: 'The 1783 event chain is open to you.' },
    ],
    mods: { revenue: 1.05, cavalryAttack: 1.1 },
    personality: { aggression: 0.65, caution: 0.4, zeal: 0.6, greed: 0.6, honour: 0.6 },
  }),
  misl({
    id: 'shaheedan',
    name: 'Shaheedan',
    epithet: 'Keepers of Damdama Sahib',
    color: '#1F3A68',
    banner: { field: '#1F3A68', band: '#E8870E', emblem: 'khanda', nishan: true },
    description:
      'The misl of the martyrs, in the line of Baba Deep Singh, custodians of Damdama Sahib at Talwandi Sabo. Small in land, immense in spirit.',
    bonuses: [
      { label: 'Martyr-spirit', detail: '+25% morale; Josh lasts longer.' },
      { label: 'Damdami Taksal', detail: 'High starting Piri; Nihang jathas cost less.' },
    ],
    mods: { morale: 1.25, piriGain: 1.15 },
    personality: { aggression: 0.5, caution: 0.35, zeal: 1.0, greed: 0.2, honour: 0.95 },
  }),
  {
    id: 'phulkian',
    name: 'Phulkian',
    epithet: 'Patiala, Nabha and Jind',
    kind: 'misl',
    sikh: true,
    playable: true,
    color: '#6E8B3D',
    banner: { field: '#E8870E', band: '#6E8B3D', emblem: 'wheat' },
    description:
      'The descendants of Phul in the Malwa, led by Baba Ala Singh. Never part of the Dal Khalsa’s eleven, the Phulkian houses walked a careful path between the Panth, the Afghans and later the Company, and survived 1849 as protected states.',
    bonuses: [
      { label: 'Cautious statecraft', detail: 'Can treat with the Durrani and the Company without the usual Piri cost.' },
      { label: 'Protected State', detail: 'An alternative ending: survive 1849 under Company protection.' },
    ],
    mods: { diplomacy: 1.3, revenue: 1.1 },
    personality: { aggression: 0.35, caution: 0.8, zeal: 0.4, greed: 0.5, honour: 0.7 },
  },

  // ── Powers ────────────────────────────────────────────────────────────────
  power({
    id: 'durrani',
    name: 'Durrani Empire',
    epithet: 'Kings of Kabul and Kandahar',
    color: '#2F6F73',
    banner: { field: '#2F6F73', band: '#F2E6C9', emblem: 'crescent' },
    description:
      'Ahmad Shah Durrani built an empire from Khurasan to Delhi. His armies came down the Grand Trunk Road in the cold season for revenue and glory, and went home before the heat.',
    mods: {},
    personality: { aggression: 0.8, caution: 0.3, zeal: 0.6, greed: 0.9, honour: 0.6 },
  }),
  power({
    id: 'mughal',
    name: 'Mughal governors',
    epithet: 'The subahs of Lahore and Sirhind',
    color: '#3D6B4F',
    banner: { field: '#3D6B4F', band: '#C9A13B', emblem: 'sun' },
    description:
      'The subahdars of Lahore and the faujdars of Sirhind and Jalandhar governed in the name of a weakening emperor at Delhi, caught between the Afghans, the Marathas and the Khalsa.',
    mods: {},
    personality: { aggression: 0.5, caution: 0.6, zeal: 0.4, greed: 0.6, honour: 0.5 },
  }),
  power({
    id: 'maratha',
    name: 'Maratha Confederacy',
    epithet: 'Horsemen of the Deccan',
    color: '#B8572A',
    banner: { field: '#E8870E', band: '#B83A2B', emblem: 'sun' },
    description: 'The Marathas reached Lahore and Attock in 1758, and were broken by Ahmad Shah at Panipat in 1761.',
    mods: {},
    personality: { aggression: 0.7, caution: 0.4, zeal: 0.4, greed: 0.8, honour: 0.5 },
  }),
  power({
    id: 'company',
    name: 'East India Company',
    epithet: 'The patient tide',
    color: '#9E1B1B',
    banner: { field: '#9E1B1B', band: '#F2E6C9', emblem: 'cross' },
    description:
      'A trading company with an army, a treasury and infinite patience. It signs treaties, waits, and advances. After 1809 the Sutlej is its line, for a time.',
    mods: {},
    personality: { aggression: 0.5, caution: 0.85, zeal: 0.1, greed: 0.8, honour: 0.6 },
  }),
  power({
    id: 'kangra',
    name: 'Katoch of Kangra',
    epithet: 'Rajas of the hill fortress',
    color: '#6C7A9C',
    banner: { field: '#6C7A9C', band: '#C9A13B', emblem: 'mountain' },
    description: 'The ancient Katoch house of Kangra. Raja Sansar Chand made his court a centre of Pahari painting.',
    mods: {},
    personality: { aggression: 0.45, caution: 0.7, zeal: 0.3, greed: 0.5, honour: 0.6 },
  }),
  power({
    id: 'hill_states',
    name: 'Rajput Hill States',
    epithet: 'Chamba, Mandi, Kahlur, Sirmur, Nurpur',
    color: '#8C8C6A',
    banner: { field: '#8C8C6A', band: '#B83A2B', emblem: 'mountain' },
    description: 'A patchwork of old Rajput states in the Siwaliks, paying tribute to whoever was strongest below them.',
    mods: {},
    personality: { aggression: 0.25, caution: 0.85, zeal: 0.3, greed: 0.4, honour: 0.6 },
  }),
  power({
    id: 'jammu',
    name: 'Jammu',
    epithet: 'Rajas of Jammu, later the Dogra brothers',
    color: '#7D5A50',
    banner: { field: '#7D5A50', band: '#E8870E', emblem: 'mountain' },
    description:
      'Under Raja Ranjit Dev Jammu prospered as a refuge in troubled years. In the next century the Dogra brothers Gulab Singh and Dhian Singh rose high in the Lahore darbar with their own designs.',
    mods: {},
    personality: { aggression: 0.4, caution: 0.75, zeal: 0.2, greed: 0.7, honour: 0.4 },
  }),
  power({
    id: 'gurkha',
    name: 'Gorkha Kingdom',
    epithet: 'From Nepal to the Sutlej',
    color: '#5A5A5A',
    banner: { field: '#B83A2B', band: '#1F3A68', emblem: 'sun' },
    description: 'The expanding Gorkha kingdom besieged Kangra from 1806 to 1809 under Amar Singh Thapa.',
    mods: {},
    personality: { aggression: 0.7, caution: 0.5, zeal: 0.3, greed: 0.6, honour: 0.6 },
  }),
  power({
    id: 'kasur',
    name: 'Pathans of Kasur',
    epithet: 'Afghan chiefs of Kasur',
    color: '#4E7F6A',
    banner: { field: '#4E7F6A', band: '#F2E6C9', emblem: 'crescent' },
    description: 'An Afghan family settled at Kasur for generations, holding the town and its villages near Lahore.',
    mods: {},
    personality: { aggression: 0.5, caution: 0.6, zeal: 0.5, greed: 0.5, honour: 0.6 },
  }),
  power({
    id: 'multan',
    name: 'Nawabs of Multan',
    epithet: 'Governors of the southern city',
    color: '#5D8A82',
    banner: { field: '#5D8A82', band: '#C9A13B', emblem: 'crescent' },
    description: 'Afghan governors of Multan under Durrani suzerainty, the last of them Nawab Muzaffar Khan, who fell defending the fort in 1818.',
    mods: {},
    personality: { aggression: 0.35, caution: 0.75, zeal: 0.5, greed: 0.5, honour: 0.8 },
  }),
  power({
    id: 'peshawar',
    name: 'Sardars of Peshawar',
    epithet: 'Barakzai brothers of the frontier',
    color: '#3F6E78',
    banner: { field: '#3F6E78', band: '#E4D2A8', emblem: 'crescent' },
    description: 'Barakzai sardars who ruled Peshawar between the Durrani collapse and the Sikh advance.',
    mods: {},
    personality: { aggression: 0.5, caution: 0.55, zeal: 0.5, greed: 0.6, honour: 0.5 },
  }),
  power({
    id: 'bahawalpur',
    name: 'Nawabs of Bahawalpur',
    epithet: 'Daudpotras of the Sutlej',
    color: '#7E8F57',
    banner: { field: '#7E8F57', band: '#F2E6C9', emblem: 'crescent' },
    description: 'The Daudpotra nawabs of Bahawalpur, careful neighbours of every power on the lower Sutlej.',
    mods: {},
    personality: { aggression: 0.25, caution: 0.85, zeal: 0.4, greed: 0.5, honour: 0.7 },
  }),
  power({
    id: 'malerkotla',
    name: 'Nawabs of Malerkotla',
    epithet: 'Afghan house of the Malwa',
    color: '#6B8F71',
    banner: { field: '#6B8F71', band: '#C9A13B', emblem: 'crescent' },
    description:
      'Nawab Sher Muhammad Khan of Malerkotla had protested the execution of the younger Sahibzadas in 1705, and Sikh tradition has honoured his house ever since. His successors nonetheless sided with Abdali in 1762.',
    mods: {},
    personality: { aggression: 0.3, caution: 0.75, zeal: 0.4, greed: 0.4, honour: 0.75 },
  }),
  // ── The wider subcontinent ───────────────────────────────────────────────
  power({
    id: 'rajputs',
    name: 'Rajput states',
    epithet: 'Marwar, Mewar, Amber and the desert kingdoms',
    color: '#C0703A',
    banner: { field: '#E8870E', band: '#7A1E1A', emblem: 'sun' },
    description: 'Ancient Rajput houses in their great forts — Rathores at Jodhpur and Bikaner, Sisodias at Udaipur, Kachhwahas at Jaipur — paying chauth to the Marathas and quarrelling over succession.',
    mods: {},
    personality: { aggression: 0.3, caution: 0.8, zeal: 0.5, greed: 0.4, honour: 0.8 },
    distant: true,
  }),
  power({
    id: 'jats',
    name: 'Jats of Bharatpur',
    epithet: 'Suraj Mal’s mud-walled kingdom',
    color: '#8A6A2A',
    banner: { field: '#8A6A2A', band: '#F2E6C9', emblem: 'sun' },
    description: 'Raja Suraj Mal built a Jat kingdom between Delhi and Agra, held Agra itself from 1761, and sheltered the Maratha wounded after Panipat. Lohagarh never fell to the British by storm.',
    mods: {},
    personality: { aggression: 0.5, caution: 0.6, zeal: 0.3, greed: 0.6, honour: 0.6 },
    distant: true,
  }),
  power({
    id: 'rohillas',
    name: 'Rohilla Afghans',
    epithet: 'Najib-ud-Daula and the Pathans of Rohilkhand',
    color: '#4E7A5A',
    banner: { field: '#4E7A5A', band: '#E4D2A8', emblem: 'crescent' },
    description: 'Afghan settlers east of the Ganga. Najib-ud-Daula held Delhi for Ahmad Shah and fought the Sikhs across the Yamuna for years; Rohilkhand fell to Awadh in 1774.',
    mods: {},
    personality: { aggression: 0.6, caution: 0.5, zeal: 0.5, greed: 0.6, honour: 0.5 },
    distant: true,
  }),
  power({
    id: 'nawab_awadh',
    name: 'Nawabs of Awadh',
    epithet: 'The court at Lucknow',
    color: '#5C7A8C',
    banner: { field: '#5C7A8C', band: '#C9A13B', emblem: 'crescent' },
    description: 'Wazirs of the empire turned kings of Lucknow: rich, cultivated, and from Buxar in 1764 tied ever closer to the Company.',
    mods: {},
    personality: { aggression: 0.3, caution: 0.8, zeal: 0.3, greed: 0.5, honour: 0.6 },
    distant: true,
  }),
  power({
    id: 'nawab_bengal',
    name: 'Nawabs of Bengal',
    epithet: 'Murshidabad, Bengal, Bihar and Orissa',
    color: '#3E7F6E',
    banner: { field: '#3E7F6E', band: '#F2E6C9', emblem: 'crescent' },
    description: 'Alivardi Khan held the richest province in Hindustan against the Maratha raids. His grandson Siraj-ud-Daula lost it at Plassey in 1757.',
    mods: {},
    personality: { aggression: 0.3, caution: 0.7, zeal: 0.3, greed: 0.5, honour: 0.6 },
    distant: true,
  }),
  power({
    id: 'nizam',
    name: 'Nizams of Hyderabad',
    epithet: 'Asaf Jahis of the Deccan',
    color: '#6D5A8C',
    banner: { field: '#6D5A8C', band: '#E6C766', emblem: 'crescent' },
    description: 'The Mughal viceroys of the Deccan, independent in all but name, balancing between the Marathas, Mysore and the Company.',
    mods: {},
    personality: { aggression: 0.35, caution: 0.75, zeal: 0.3, greed: 0.5, honour: 0.55 },
    distant: true,
  }),
  power({
    id: 'khudadad',
    name: 'Kingdom of Mysore',
    epithet: 'Wodeyars, then Hyder Ali and Tipu Sultan',
    color: '#8C3E5A',
    banner: { field: '#8C3E5A', band: '#E8870E', emblem: 'sun' },
    description: 'Hyder Ali seized the Wodeyar state in 1761 and made it the most modern army in the south; his son Tipu fought the Company in four wars and died on the walls of Srirangapatna in 1799.',
    mods: {},
    personality: { aggression: 0.6, caution: 0.5, zeal: 0.4, greed: 0.6, honour: 0.6 },
    distant: true,
  }),
  power({
    id: 'arcot',
    name: 'Nawabs of the Carnatic',
    epithet: 'Arcot, between the French and the English',
    color: '#5A8A7A',
    banner: { field: '#5A8A7A', band: '#F2E6C9', emblem: 'crescent' },
    description: 'The nawabs of Arcot, whose wars of succession drew the French and English companies into Indian politics.',
    mods: {},
    personality: { aggression: 0.25, caution: 0.8, zeal: 0.3, greed: 0.5, honour: 0.5 },
    distant: true,
  }),
  power({
    id: 'sindh_amirs',
    name: 'Rulers of Sindh',
    epithet: 'Kalhoras, then the Talpur Mirs',
    color: '#7A8A3A',
    banner: { field: '#7A8A3A', band: '#F2E6C9', emblem: 'crescent' },
    description: 'The Kalhora rulers of Sindh paid tribute to Kabul; the Talpur Mirs replaced them in 1783 and held the lower Indus until Napier’s conquest in 1843.',
    mods: {},
    personality: { aggression: 0.3, caution: 0.75, zeal: 0.5, greed: 0.5, honour: 0.6 },
    distant: true,
  }),
  power({
    id: 'kalat',
    name: 'Khanate of Kalat',
    epithet: 'Nasir Khan and the Baloch tribes',
    color: '#9A7A4A',
    banner: { field: '#9A7A4A', band: '#2F4F4F', emblem: 'crescent' },
    description: 'Mir Nasir Khan the Great united the Baloch tribes and rode with Ahmad Shah to India.',
    mods: {},
    personality: { aggression: 0.4, caution: 0.6, zeal: 0.5, greed: 0.5, honour: 0.6 },
    distant: true,
  }),
  power({
    id: 'tibet',
    name: 'Ganden Phodrang',
    epithet: 'The government of Tibet at Lhasa',
    color: '#7A6A9A',
    banner: { field: '#B8860B', band: '#7A1E1A', emblem: 'sun' },
    description: 'The Dalai Lama’s government at Lhasa, with a Qing amban at its side. In 1841 Zorawar Singh’s Dogra army marched into Ngari and died in the snows at To-yo.',
    mods: {},
    personality: { aggression: 0.15, caution: 0.9, zeal: 0.5, greed: 0.3, honour: 0.7 },
    distant: true,
  }),
  power({
    id: 'kandy',
    name: 'Kingdom of Kandy',
    epithet: 'The hill kingdom of Ceylon',
    color: '#8A5A3A',
    banner: { field: '#8A5A3A', band: '#E6C766', emblem: 'sun' },
    description: 'The last independent kingdom of Ceylon, behind its hills and forests, until the British took it in 1815.',
    mods: {},
    personality: { aggression: 0.15, caution: 0.9, zeal: 0.5, greed: 0.3, honour: 0.7 },
    distant: true,
  }),
];

export const FACTION_BY_ID: Record<string, FactionDef> = Object.fromEntries(FACTIONS.map((f) => [f.id, f]));
export const MISL_IDS = FACTIONS.filter((f) => f.kind === 'misl').map((f) => f.id);
