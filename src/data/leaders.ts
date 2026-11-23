// Historical leaders. Dates follow the standard accounts (see HISTORY.md); where a
// birth year is uncertain it is marked "c." in the note and the game uses an estimate.
//
// `faction` is the leader's house at the start of the game. Leaders marked
// joins: 'sarkar' appear in their historical year and offer service to the strongest
// Sikh power (usually the Sarkar-i-Khalsa), whoever that turns out to be.

export type TraitId =
  | 'cavalry_master'
  | 'guerrilla'
  | 'fort_builder'
  | 'diplomat'
  | 'zealous'
  | 'just'
  | 'ambitious'
  | 'cautious'
  | 'artillerist'
  | 'administrator'
  | 'reckless'
  | 'beloved'
  | 'schemer'
  | 'drillmaster'
  | 'mountain_warrior'
  | 'old_guard'
  | 'frontier_warden'
  | 'merciful';

export interface TraitDef {
  id: TraitId;
  name: string;
  detail: string;
}

export const TRAITS: Record<TraitId, TraitDef> = {
  cavalry_master: { id: 'cavalry_master', name: 'Master of horse', detail: '+20% cavalry attack.' },
  guerrilla: { id: 'guerrilla', name: 'Dhai Phat', detail: 'Dhai Phat and Ambush far more effective.' },
  fort_builder: { id: 'fort_builder', name: 'Fort-builder', detail: '+1 fort level when defending; sieges by this leader go faster.' },
  diplomat: { id: 'diplomat', name: 'Diplomat', detail: 'Better treaty and gurmata outcomes.' },
  zealous: { id: 'zealous', name: 'Zealous', detail: '+15% morale; greater Josh.' },
  just: { id: 'just', name: 'Just', detail: '+stability where stationed; small Piri each turn.' },
  ambitious: { id: 'ambitious', name: 'Ambitious', detail: 'Loyalty falls faster when Piri is low.' },
  cautious: { id: 'cautious', name: 'Cautious', detail: 'Fewer losses when defeated, smaller victories.' },
  artillerist: { id: 'artillerist', name: 'Artillerist', detail: '+30% artillery attack and siege.' },
  administrator: { id: 'administrator', name: 'Administrator', detail: '+10% revenue as governor or diwan.' },
  reckless: { id: 'reckless', name: 'Reckless', detail: '+attack, +losses.' },
  beloved: { id: 'beloved', name: 'Beloved of the Khalsa', detail: 'Death costs Legend; presence lifts morale.' },
  schemer: { id: 'schemer', name: 'Schemer', detail: 'Gains influence at court; loyalty is never certain.' },
  drillmaster: { id: 'drillmaster', name: 'Drillmaster', detail: 'Regular troops +20% attack and defence.' },
  mountain_warrior: { id: 'mountain_warrior', name: 'Mountain warrior', detail: 'No penalty in hills and mountains.' },
  old_guard: { id: 'old_guard', name: 'Old guard', detail: 'Steady: +10% defence.' },
  frontier_warden: { id: 'frontier_warden', name: 'Warden of the frontier', detail: 'Stability and defence on the frontier.' },
  merciful: { id: 'merciful', name: 'Merciful', detail: 'Sparing cities gives more Piri.' },
};

export interface LeaderDef {
  id: string;
  name: string;
  faction: string;
  born: number;
  /** Historical year of death. The game uses this unless history is bent. */
  died: number;
  traits: TraitId[];
  martial: number;
  admin: number;
  diplomacy: number;
  /** Base loyalty 0..100. */
  loyalty: number;
  female?: boolean;
  /** Appears from this year (defaults to born + 16). */
  from?: number;
  joins?: 'sarkar';
  /** Head of the faction at game start in the scenarios where they are alive. */
  chief?: boolean;
  note: string;
  /** Cause of historical death, used by the dhadi. */
  fate?: 'battle' | 'age' | 'assassinated' | 'accident' | 'illness' | 'executed';
}

export const LEADERS: LeaderDef[] = [
  // ── Ahluwalia ──
  { id: 'jassa_ahluwalia', name: 'Jassa Singh Ahluwalia', faction: 'ahluwalia', born: 1718, died: 1783, traits: ['beloved', 'diplomat', 'cavalry_master'], martial: 4, admin: 4, diplomacy: 5, loyalty: 100, chief: true, note: 'Leader of the Dal Khalsa; called Sultan-ul-Qaum. Wounded many times, including at the Vadda Ghallughara.', fate: 'age' },
  { id: 'bhag_singh_ahluwalia', name: 'Bhag Singh Ahluwalia', faction: 'ahluwalia', born: 1747, died: 1801, traits: ['cautious', 'administrator'], martial: 2, admin: 3, diplomacy: 3, loyalty: 80, from: 1783, note: 'Successor of Jassa Singh at Kapurthala.', fate: 'age' },
  { id: 'fateh_singh_ahluwalia', name: 'Fateh Singh Ahluwalia', faction: 'ahluwalia', born: 1784, died: 1837, traits: ['diplomat', 'just'], martial: 3, admin: 3, diplomacy: 4, loyalty: 85, from: 1801, note: 'Turban-brother of Ranjit Singh; exchanged turbans with him as a pledge of friendship.', fate: 'age' },

  // ── Faizullapuria / Singhpuria ──
  { id: 'kapur_singh', name: 'Nawab Kapur Singh', faction: 'faizullapuria', born: 1697, died: 1753, traits: ['beloved', 'just', 'old_guard'], martial: 4, admin: 4, diplomacy: 5, loyalty: 100, chief: true, note: 'Accepted a Mughal nawabship in 1733 and used it to organise the Budha Dal and Taruna Dal.', fate: 'age' },
  { id: 'khushal_singh', name: 'Khushal Singh Singhpuria', faction: 'faizullapuria', born: 1730, died: 1795, traits: ['cavalry_master'], martial: 3, admin: 3, diplomacy: 3, loyalty: 80, from: 1753, note: 'Nephew of Nawab Kapur Singh; extended the misl into Jalandhar and the Cis-Sutlej.', fate: 'age' },
  { id: 'budh_singh_singhpuria', name: 'Budh Singh Singhpuria', faction: 'faizullapuria', born: 1770, died: 1816, traits: ['cautious'], martial: 2, admin: 3, diplomacy: 2, loyalty: 70, from: 1795, note: 'Last independent chief of the misl; his Jalandhar holdings were absorbed by Lahore in 1811.', fate: 'age' },

  // ── Bhangi ──
  { id: 'hari_singh_bhangi', name: 'Hari Singh Bhangi', faction: 'bhangi', born: 1720, died: 1765, traits: ['ambitious', 'cavalry_master'], martial: 4, admin: 3, diplomacy: 2, loyalty: 100, chief: true, note: 'Made the Bhangi misl the most powerful of its day. Death year given variously as 1764–65.', fate: 'battle' },
  { id: 'jhanda_singh_bhangi', name: 'Jhanda Singh Bhangi', faction: 'bhangi', born: 1740, died: 1774, traits: ['ambitious', 'artillerist'], martial: 4, admin: 3, diplomacy: 2, loyalty: 85, from: 1757, note: 'Took Multan (1772) and carried the Bhangi name to its height; assassinated in 1774.', fate: 'assassinated' },
  { id: 'gujjar_singh', name: 'Gujjar Singh Bhangi', faction: 'bhangi', born: 1730, died: 1788, traits: ['cavalry_master'], martial: 3, admin: 3, diplomacy: 3, loyalty: 75, from: 1750, note: 'One of the three Bhangi sardars who took Lahore in 1765; later ruled Gujrat.', fate: 'age' },
  { id: 'lehna_singh_bhangi', name: 'Lehna Singh Bhangi', faction: 'bhangi', born: 1735, died: 1797, traits: ['just', 'administrator'], martial: 3, admin: 4, diplomacy: 3, loyalty: 80, from: 1752, note: 'Co-ruler of Lahore from 1765; remembered as a just governor by all communities.', fate: 'age' },

  // ── Ramgarhia ──
  { id: 'jassa_ramgarhia', name: 'Jassa Singh Ramgarhia', faction: 'ramgarhia', born: 1723, died: 1803, traits: ['fort_builder', 'guerrilla', 'ambitious'], martial: 5, admin: 3, diplomacy: 2, loyalty: 100, chief: true, note: 'Defended Ram Rauni and rebuilt it as Ramgarh. Exiled across the Sutlej in 1776, he returned in 1783 and outlived his rivals.', fate: 'age' },
  { id: 'jodh_singh_ramgarhia', name: 'Jodh Singh Ramgarhia', faction: 'ramgarhia', born: 1750, died: 1815, traits: ['fort_builder'], martial: 3, admin: 3, diplomacy: 3, loyalty: 80, from: 1770, note: 'Son and successor of Jassa Singh Ramgarhia; on good terms with Ranjit Singh.', fate: 'age' },

  // ── Kanhaiya ──
  { id: 'jai_singh_kanhaiya', name: 'Jai Singh Kanhaiya', faction: 'kanhaiya', born: 1712, died: 1793, traits: ['diplomat', 'ambitious'], martial: 4, admin: 4, diplomacy: 4, loyalty: 100, chief: true, note: 'Ruled from Batala and the hills; for a time the most powerful of the misldars.', fate: 'age' },
  { id: 'gurbakhsh_kanhaiya', name: 'Gurbakhsh Singh Kanhaiya', faction: 'kanhaiya', born: 1759, died: 1785, traits: ['reckless', 'cavalry_master'], martial: 3, admin: 2, diplomacy: 2, loyalty: 90, from: 1775, note: 'Son of Jai Singh; killed fighting near Batala in 1785. Husband of Sada Kaur.', fate: 'battle' },
  { id: 'sada_kaur', name: 'Sada Kaur', faction: 'kanhaiya', born: 1762, died: 1832, female: true, traits: ['diplomat', 'administrator', 'ambitious'], martial: 4, admin: 5, diplomacy: 5, loyalty: 85, from: 1785, note: 'Head of the Kanhaiya misl after 1789 and mother-in-law of Ranjit Singh, whose rise she guided. She later fell out with him and was confined from 1821.', fate: 'illness' },

  // ── Sukerchakia ──
  { id: 'charat_singh', name: 'Charat Singh Sukerchakia', faction: 'sukerchakia', born: 1721, died: 1770, traits: ['cavalry_master', 'ambitious'], martial: 4, admin: 3, diplomacy: 3, loyalty: 100, chief: true, note: 'Founded the misl’s power around Gujranwala; killed by the accidental bursting of his own matchlock.', fate: 'accident' },
  { id: 'maha_singh', name: 'Maha Singh Sukerchakia', faction: 'sukerchakia', born: 1760, died: 1792, traits: ['ambitious', 'reckless'], martial: 4, admin: 3, diplomacy: 3, loyalty: 95, from: 1770, note: 'Expanded the misl and quarrelled with the Kanhaiyas; father of Ranjit Singh.', fate: 'illness' },
  { id: 'ranjit_singh', name: 'Ranjit Singh', faction: 'sukerchakia', born: 1780, died: 1839, traits: ['cavalry_master', 'diplomat', 'administrator'], martial: 5, admin: 5, diplomacy: 5, loyalty: 100, from: 1792, note: 'Took Lahore in 1799 and was proclaimed Maharaja in 1801. Built the Sarkar-i-Khalsa from the Khyber to the Sutlej.', fate: 'illness' },
  { id: 'mehtab_kaur', name: 'Mehtab Kaur', faction: 'kanhaiya', born: 1782, died: 1813, female: true, traits: ['just'], martial: 1, admin: 3, diplomacy: 3, loyalty: 80, from: 1796, note: 'Daughter of Sada Kaur and first wife of Ranjit Singh.', fate: 'illness' },

  // ── Nakai ──
  { id: 'hira_singh_nakai', name: 'Hira Singh Nakai', faction: 'nakai', born: 1706, died: 1767, traits: ['cavalry_master', 'old_guard'], martial: 3, admin: 3, diplomacy: 3, loyalty: 100, chief: true, note: 'Founder of the Nakai misl in the Nakka country.', fate: 'battle' },
  { id: 'ran_singh_nakai', name: 'Ran Singh Nakai', faction: 'nakai', born: 1740, died: 1781, traits: ['cautious'], martial: 3, admin: 3, diplomacy: 3, loyalty: 85, from: 1767, note: 'Held Chunian and the Nakka lands; father of Datar Kaur.', fate: 'age' },

  // ── Dallewalia ──
  { id: 'gulab_singh_dallewalia', name: 'Gulab Singh Dallewalia', faction: 'dallewalia', born: 1710, died: 1759, traits: ['zealous'], martial: 3, admin: 2, diplomacy: 2, loyalty: 100, chief: true, note: 'First leader of the Dallewalia misl.', fate: 'battle' },
  { id: 'tara_singh_ghaiba', name: 'Tara Singh Ghaiba', faction: 'dallewalia', born: 1717, died: 1807, traits: ['guerrilla', 'cavalry_master'], martial: 5, admin: 3, diplomacy: 2, loyalty: 90, from: 1740, note: 'Famed raider who held Rahon and lands on both banks of the Sutlej; lived to a great age.', fate: 'age' },

  // ── Nishanwalia ──
  { id: 'dasaundha_singh', name: 'Dasaundha Singh Nishanwalia', faction: 'nishanwalia', born: 1715, died: 1767, traits: ['zealous', 'old_guard'], martial: 3, admin: 2, diplomacy: 3, loyalty: 100, chief: true, note: 'Bore the Nishan Sahib of the Dal Khalsa.', fate: 'battle' },
  { id: 'sangat_singh_nishanwalia', name: 'Sangat Singh Nishanwalia', faction: 'nishanwalia', born: 1730, died: 1774, traits: ['cautious'], martial: 3, admin: 3, diplomacy: 3, loyalty: 85, from: 1767, note: 'Held Ambala and Shahabad. Dates uncertain.', fate: 'age' },

  // ── Karorasinghia ──
  { id: 'karora_singh', name: 'Karora Singh', faction: 'karorasinghia', born: 1710, died: 1761, traits: ['zealous', 'cavalry_master'], martial: 4, admin: 2, diplomacy: 2, loyalty: 100, chief: true, note: 'Gave his name to the misl; killed in 1761.', fate: 'battle' },
  { id: 'baghel_singh', name: 'Baghel Singh', faction: 'karorasinghia', born: 1730, died: 1802, traits: ['cavalry_master', 'diplomat', 'ambitious'], martial: 5, admin: 4, diplomacy: 4, loyalty: 90, from: 1750, note: 'Entered Delhi in 1783 and negotiated with Shah Alam II for gurdwaras at the historic sites.', fate: 'age' },

  // ── Shaheedan ──
  { id: 'baba_deep_singh', name: 'Baba Deep Singh', faction: 'shaheedan', born: 1682, died: 1757, traits: ['zealous', 'beloved', 'old_guard'], martial: 5, admin: 3, diplomacy: 2, loyalty: 100, chief: true, note: 'Scholar and warrior of Damdama Sahib. In 1757, past seventy, he marched on Amritsar after its desecration and fell fighting.', fate: 'battle' },
  { id: 'karam_singh_shaheed', name: 'Karam Singh Shaheed', faction: 'shaheedan', born: 1720, died: 1784, traits: ['zealous'], martial: 3, admin: 3, diplomacy: 2, loyalty: 95, from: 1757, note: 'Led the Shaheedan misl after Baba Deep Singh. Dates uncertain.', fate: 'age' },
  { id: 'gurbakhsh_singh_nihang', name: 'Gurbakhsh Singh Nihang', faction: 'shaheedan', born: 1688, died: 1764, traits: ['zealous', 'beloved'], martial: 4, admin: 1, diplomacy: 1, loyalty: 100, from: 1740, note: 'With thirty companions he defended the Harmandir against Abdali’s army in December 1764, and fell there.', fate: 'battle' },

  // ── Phulkian ──
  { id: 'ala_singh', name: 'Baba Ala Singh', faction: 'phulkian', born: 1691, died: 1765, traits: ['diplomat', 'cautious', 'administrator'], martial: 3, admin: 5, diplomacy: 5, loyalty: 100, chief: true, note: 'Founder of Patiala. Took Sirhind with the Dal Khalsa in 1764 and treated with Abdali, who recognised him.', fate: 'age' },
  { id: 'amar_singh_patiala', name: 'Amar Singh of Patiala', faction: 'phulkian', born: 1748, died: 1782, traits: ['ambitious', 'cavalry_master'], martial: 4, admin: 3, diplomacy: 3, loyalty: 85, from: 1765, note: 'Grandson of Ala Singh; given the title Raja-i-Rajgan by Ahmad Shah.', fate: 'illness' },
  { id: 'sahib_singh_patiala', name: 'Sahib Singh of Patiala', faction: 'phulkian', born: 1773, died: 1813, traits: ['cautious'], martial: 2, admin: 2, diplomacy: 3, loyalty: 75, from: 1782, note: 'Raja of Patiala; accepted Company protection in 1809.', fate: 'illness' },
  { id: 'gajpat_singh', name: 'Gajpat Singh of Jind', faction: 'phulkian', born: 1738, died: 1789, traits: ['administrator'], martial: 3, admin: 4, diplomacy: 3, loyalty: 70, from: 1763, note: 'Raja of Jind; his daughter was the mother of Ranjit Singh.', fate: 'age' },

  // ── Sarkar era: they offer service to the strongest Sikh power ──
  { id: 'mokham_chand', name: 'Diwan Mokham Chand', faction: 'sukerchakia', born: 1750, died: 1814, joins: 'sarkar', traits: ['cavalry_master', 'administrator'], martial: 5, admin: 4, diplomacy: 3, loyalty: 90, from: 1806, note: 'Ranjit Singh’s great commander: Attock (1813), the Cis-Sutlej and Kangra.', fate: 'illness' },
  { id: 'hari_singh_nalwa', name: 'Hari Singh Nalwa', faction: 'sukerchakia', born: 1791, died: 1837, joins: 'sarkar', traits: ['frontier_warden', 'cavalry_master', 'beloved'], martial: 5, admin: 4, diplomacy: 3, loyalty: 95, from: 1804, note: 'Commander-in-chief on the frontier; governor of Kashmir and Peshawar. Fell at Jamrud in 1837.', fate: 'battle' },
  { id: 'phula_singh', name: 'Akali Phula Singh', faction: 'sukerchakia', born: 1761, died: 1823, joins: 'sarkar', traits: ['zealous', 'beloved', 'reckless'], martial: 5, admin: 1, diplomacy: 1, loyalty: 75, from: 1800, note: 'Jathedar of the Akal Takht and leader of the Nihangs; he once had the Maharaja himself answer for a breach of discipline. Fell at Nowshera, 1823.', fate: 'battle' },
  { id: 'misr_diwan_chand', name: 'Misr Diwan Chand', faction: 'sukerchakia', born: 1780, died: 1825, joins: 'sarkar', traits: ['artillerist'], martial: 4, admin: 3, diplomacy: 2, loyalty: 90, from: 1812, note: 'Head of the artillery; commanded at Multan (1818) and in Kashmir (1819).', fate: 'illness' },
  { id: 'fakir_azizuddin', name: 'Fakir Azizuddin', faction: 'sukerchakia', born: 1780, died: 1845, joins: 'sarkar', traits: ['diplomat', 'just'], martial: 1, admin: 4, diplomacy: 5, loyalty: 95, from: 1799, note: 'Physician and foreign minister of the Sarkar, trusted envoy to the British.', fate: 'age' },
  { id: 'dina_nath', name: 'Dewan Dina Nath', faction: 'sukerchakia', born: 1795, died: 1857, joins: 'sarkar', traits: ['administrator', 'schemer'], martial: 1, admin: 5, diplomacy: 3, loyalty: 70, from: 1815, note: 'Finance minister who survived every turn of fortune at the Lahore court.', fate: 'age' },
  { id: 'ilahi_bakhsh', name: 'Ilahi Bakhsh', faction: 'sukerchakia', born: 1790, died: 1850, joins: 'sarkar', traits: ['artillerist', 'old_guard'], martial: 4, admin: 2, diplomacy: 1, loyalty: 85, from: 1820, note: 'General of artillery in the Topkhana. Dates approximate.', fate: 'age' },
  { id: 'ventura', name: 'Jean-Baptiste Ventura', faction: 'sukerchakia', born: 1794, died: 1858, joins: 'sarkar', traits: ['drillmaster'], martial: 4, admin: 3, diplomacy: 2, loyalty: 70, from: 1822, note: 'Italian veteran of Napoleon’s armies who trained the Fauj-i-Khas infantry.', fate: 'age' },
  { id: 'allard', name: 'Jean-François Allard', faction: 'sukerchakia', born: 1785, died: 1839, joins: 'sarkar', traits: ['drillmaster', 'cavalry_master'], martial: 4, admin: 3, diplomacy: 2, loyalty: 75, from: 1822, note: 'French cavalry officer who raised the dragoons of the Fauj-i-Khas.', fate: 'illness' },
  { id: 'sham_singh_attariwala', name: 'Sham Singh Attariwala', faction: 'sukerchakia', born: 1790, died: 1846, joins: 'sarkar', traits: ['beloved', 'zealous', 'old_guard'], martial: 4, admin: 3, diplomacy: 2, loyalty: 100, from: 1818, note: 'Veteran of Multan, Kashmir and the frontier. At Sobraon, in white, he led a last charge and fell. Birth year approximate.', fate: 'battle' },
  { id: 'kharak_singh', name: 'Kharak Singh', faction: 'sukerchakia', born: 1801, died: 1840, traits: ['cautious'], martial: 2, admin: 2, diplomacy: 2, loyalty: 90, from: 1817, note: 'Eldest son of Ranjit Singh; Maharaja 1839–40.', fate: 'illness' },
  { id: 'nau_nihal_singh', name: 'Nau Nihal Singh', faction: 'sukerchakia', born: 1821, died: 1840, traits: ['ambitious', 'cavalry_master'], martial: 4, admin: 3, diplomacy: 3, loyalty: 90, from: 1835, note: 'Gifted grandson of Ranjit Singh. Died when an archway fell on the day of his father’s cremation.', fate: 'accident' },
  { id: 'sher_singh', name: 'Sher Singh', faction: 'sukerchakia', born: 1807, died: 1843, traits: ['cavalry_master', 'reckless'], martial: 4, admin: 2, diplomacy: 3, loyalty: 80, from: 1823, note: 'Son of Ranjit Singh; Maharaja 1841–43; assassinated by the Sandhawalias.', fate: 'assassinated' },
  { id: 'jind_kaur', name: 'Maharani Jind Kaur', faction: 'sukerchakia', born: 1817, died: 1863, female: true, traits: ['ambitious', 'schemer', 'beloved'], martial: 2, admin: 4, diplomacy: 4, loyalty: 90, from: 1835, note: 'Regent for her son Duleep Singh from 1843; resisted the British to the end and died in exile.', fate: 'illness' },
  { id: 'duleep_singh', name: 'Duleep Singh', faction: 'sukerchakia', born: 1838, died: 1893, traits: [], martial: 1, admin: 1, diplomacy: 1, loyalty: 100, from: 1843, note: 'The last Maharaja, proclaimed as a child in 1843.', fate: 'age' },
  { id: 'dhian_singh', name: 'Raja Dhian Singh', faction: 'jammu', born: 1796, died: 1843, traits: ['schemer', 'administrator'], martial: 3, admin: 5, diplomacy: 4, loyalty: 55, from: 1818, note: 'Dogra chief minister of Lahore; killed by the Sandhawalias in 1843.', fate: 'assassinated' },
  { id: 'gulab_singh_dogra', name: 'Raja Gulab Singh', faction: 'jammu', born: 1792, died: 1857, traits: ['schemer', 'mountain_warrior', 'ambitious'], martial: 4, admin: 4, diplomacy: 5, loyalty: 40, from: 1809, note: 'Raja of Jammu; after 1846 Maharaja of Jammu and Kashmir under the Treaty of Amritsar.', fate: 'age' },
  { id: 'lal_singh', name: 'Raja Lal Singh', faction: 'sukerchakia', born: 1800, died: 1866, joins: 'sarkar', traits: ['schemer'], martial: 2, admin: 3, diplomacy: 3, loyalty: 35, from: 1838, note: 'Wazir in 1845–46; his conduct in the First Anglo-Sikh War has long been called treacherous.', fate: 'age' },
  { id: 'tej_singh', name: 'Tej Singh', faction: 'sukerchakia', born: 1799, died: 1862, joins: 'sarkar', traits: ['schemer', 'cautious'], martial: 3, admin: 3, diplomacy: 2, loyalty: 35, from: 1820, note: 'Commander-in-chief in 1845–46, widely held to have failed the army at Ferozeshah and Sobraon.', fate: 'age' },
  { id: 'chattar_singh', name: 'Chattar Singh Attariwala', faction: 'sukerchakia', born: 1790, died: 1855, joins: 'sarkar', traits: ['old_guard'], martial: 3, admin: 3, diplomacy: 3, loyalty: 85, from: 1830, note: 'Governor of Hazara who rose in 1848.', fate: 'age' },
  { id: 'sher_singh_attariwala', name: 'Sher Singh Attariwala', faction: 'sukerchakia', born: 1810, died: 1858, joins: 'sarkar', traits: ['cavalry_master'], martial: 4, admin: 2, diplomacy: 2, loyalty: 85, from: 1840, note: 'Commanded the Khalsa at Ramnagar, Chillianwala and Gujrat in 1848–49.', fate: 'age' },
  { id: 'mulraj', name: 'Diwan Mulraj', faction: 'sukerchakia', born: 1814, died: 1851, joins: 'sarkar', traits: ['cautious', 'administrator'], martial: 3, admin: 4, diplomacy: 2, loyalty: 70, from: 1844, note: 'Governor of Multan whose revolt in 1848 began the Second Anglo-Sikh War.', fate: 'illness' },

  // ── Other powers ──
  { id: 'ahmad_shah', name: 'Ahmad Shah Durrani', faction: 'durrani', born: 1722, died: 1772, traits: ['cavalry_master', 'ambitious'], martial: 5, admin: 4, diplomacy: 4, loyalty: 100, chief: true, note: 'Founder of the Durrani Empire; invaded India many times between 1748 and 1767.', fate: 'illness' },
  { id: 'jahan_khan', name: 'Jahan Khan', faction: 'durrani', born: 1720, died: 1770, traits: ['reckless'], martial: 4, admin: 2, diplomacy: 1, loyalty: 90, from: 1740, note: 'Ahmad Shah’s commander; governed Lahore for Timur Shah in 1757. Dates uncertain.', fate: 'age' },
  { id: 'timur_shah', name: 'Timur Shah Durrani', faction: 'durrani', born: 1748, died: 1793, traits: ['cautious', 'administrator'], martial: 3, admin: 4, diplomacy: 3, loyalty: 100, from: 1757, note: 'Son of Ahmad Shah; retook Multan from the Bhangis in 1780.', fate: 'illness' },
  { id: 'zaman_shah', name: 'Zaman Shah Durrani', faction: 'durrani', born: 1770, died: 1844, traits: ['ambitious'], martial: 3, admin: 2, diplomacy: 2, loyalty: 100, from: 1793, note: 'Invaded the Punjab several times in the 1790s; in 1798 he made Ranjit Singh governor of Lahore, by some accounts.', fate: 'age' },
  { id: 'shah_shuja', name: 'Shah Shuja', faction: 'durrani', born: 1785, died: 1842, traits: ['cautious'], martial: 2, admin: 2, diplomacy: 3, loyalty: 60, from: 1803, note: 'Deposed king of Kabul; parted with the Koh-i-Noor at Lahore in 1813.', fate: 'assassinated' },
  { id: 'mir_mannu', name: 'Mir Mannu (Mu’in-ul-Mulk)', faction: 'mughal', born: 1720, died: 1753, traits: ['reckless', 'ambitious'], martial: 4, admin: 3, diplomacy: 2, loyalty: 100, chief: true, note: 'Subahdar of Lahore 1748–53, notorious in Sikh memory for his persecution.', fate: 'accident' },
  { id: 'adina_beg', name: 'Adina Beg', faction: 'mughal', born: 1710, died: 1758, traits: ['schemer', 'diplomat'], martial: 3, admin: 5, diplomacy: 5, loyalty: 40, note: 'Faujdar of Jalandhar who played Mughals, Afghans, Marathas and Sikhs against each other.', fate: 'illness' },
  { id: 'zain_khan', name: 'Zain Khan', faction: 'mughal', born: 1720, died: 1764, traits: ['cautious'], martial: 3, admin: 3, diplomacy: 2, loyalty: 80, from: 1761, note: 'Afghan faujdar of Sirhind, killed when the Dal Khalsa took the city in January 1764.', fate: 'battle' },
  { id: 'raghunath_rao', name: 'Raghunath Rao', faction: 'maratha', born: 1734, died: 1783, traits: ['cavalry_master', 'ambitious'], martial: 4, admin: 2, diplomacy: 2, loyalty: 100, chief: true, note: 'Led the Maratha army to Lahore and Attock in 1758.', fate: 'age' },
  { id: 'sansar_chand', name: 'Raja Sansar Chand Katoch', faction: 'kangra', born: 1765, died: 1823, traits: ['ambitious', 'administrator'], martial: 3, admin: 4, diplomacy: 3, loyalty: 100, chief: true, from: 1782, note: 'Raja of Kangra and great patron of Pahari painting; besieged by the Gorkhas in 1806–09.', fate: 'age' },
  { id: 'ghamand_chand', name: 'Raja Ghamand Chand', faction: 'kangra', born: 1715, died: 1774, traits: ['cautious'], martial: 3, admin: 3, diplomacy: 3, loyalty: 100, chief: true, note: 'Katoch raja of Kangra in the mid-century.', fate: 'age' },
  { id: 'ranjit_dev', name: 'Raja Ranjit Dev', faction: 'jammu', born: 1700, died: 1781, traits: ['just', 'cautious'], martial: 3, admin: 4, diplomacy: 4, loyalty: 100, chief: true, note: 'Raja of Jammu whose city became a refuge in the troubled 1750s.', fate: 'age' },
  { id: 'amar_singh_thapa', name: 'Amar Singh Thapa', faction: 'gurkha', born: 1751, died: 1825, traits: ['mountain_warrior', 'ambitious'], martial: 5, admin: 3, diplomacy: 2, loyalty: 100, chief: true, from: 1800, note: 'Gorkha commander in the west; besieged Kangra 1806–09.', fate: 'age' },
  { id: 'muzaffar_khan', name: 'Nawab Muzaffar Khan', faction: 'multan', born: 1757, died: 1818, traits: ['old_guard', 'just'], martial: 3, admin: 3, diplomacy: 3, loyalty: 100, chief: true, from: 1779, note: 'Last nawab of Multan; fell with his sons defending the fort in 1818.', fate: 'battle' },
  { id: 'nizamuddin_kasur', name: 'Nizamuddin Khan of Kasur', faction: 'kasur', born: 1750, died: 1802, traits: ['ambitious'], martial: 3, admin: 3, diplomacy: 2, loyalty: 100, chief: true, from: 1780, note: 'Pathan chief of Kasur; opposed Ranjit Singh at Bhasin in 1800. Dates approximate.', fate: 'assassinated' },
  { id: 'dost_mohammad', name: 'Dost Mohammad Khan', faction: 'durrani', born: 1793, died: 1863, traits: ['ambitious', 'diplomat'], martial: 4, admin: 4, diplomacy: 4, loyalty: 100, from: 1826, note: 'Barakzai Amir of Kabul; contested Peshawar with the Sarkar in the 1830s.', fate: 'age' },
  { id: 'metcalfe', name: 'Charles Metcalfe', faction: 'company', born: 1785, died: 1846, traits: ['diplomat', 'cautious'], martial: 1, admin: 4, diplomacy: 5, loyalty: 100, from: 1808, note: 'Company envoy who negotiated the Treaty of Amritsar (1809).', fate: 'illness' },
  { id: 'ochterlony', name: 'David Ochterlony', faction: 'company', born: 1758, died: 1825, traits: ['cautious', 'old_guard'], martial: 4, admin: 3, diplomacy: 3, loyalty: 100, from: 1803, note: 'Company general at Delhi and Ludhiana.', fate: 'illness' },
  { id: 'gough', name: 'Hugh Gough', faction: 'company', born: 1779, died: 1869, traits: ['reckless', 'old_guard'], martial: 4, admin: 2, diplomacy: 1, loyalty: 100, from: 1843, note: 'Commander-in-chief in both Anglo-Sikh wars; known for frontal assaults.', fate: 'age' },
  { id: 'hardinge', name: 'Henry Hardinge', faction: 'company', born: 1785, died: 1856, traits: ['cautious', 'administrator'], martial: 3, admin: 4, diplomacy: 3, loyalty: 100, from: 1844, note: 'Governor-General during the First Anglo-Sikh War.', fate: 'age' },
  { id: 'dalhousie', name: 'Lord Dalhousie', faction: 'company', born: 1812, died: 1860, traits: ['ambitious', 'administrator'], martial: 2, admin: 5, diplomacy: 2, loyalty: 100, from: 1848, note: 'Governor-General who annexed the Punjab in March 1849.', fate: 'illness' },
];

export const LEADER_BY_ID: Record<string, LeaderDef> = Object.fromEntries(LEADERS.map((l) => [l.id, l]));

// Authentic Punjabi given names for generated sardars (Sikh men take the name Singh,
// women Kaur). Village names supply the familiar "-wala/-wala" style surnames.
export const GIVEN_NAMES = [
  'Amar', 'Baghel', 'Bhag', 'Budh', 'Charat', 'Dal', 'Desa', 'Dharam', 'Fateh', 'Gurbakhsh', 'Gurdit', 'Hamir', 'Hari',
  'Hukam', 'Jai', 'Jodh', 'Jhanda', 'Karam', 'Kahn', 'Khushal', 'Lal', 'Mahtab', 'Mit', 'Nidhan', 'Prem', 'Ram', 'Sadhu',
  'Sangat', 'Sobha', 'Sukha', 'Tara', 'Tehal', 'Wazir', 'Atar', 'Bir', 'Chanda', 'Diwan', 'Gulab', 'Jiwan', 'Mehar',
];
export const GIVEN_NAMES_F = ['Bibi Sahib', 'Rup', 'Desan', 'Raj', 'Daya', 'Kishan', 'Sukhan', 'Rattan', 'Prem', 'Basant'];
export const VILLAGE_NAMES = [
  'Attari', 'Majithia', 'Sandhanwalia', 'Bhadaur', 'Mansahia', 'Butalia', 'Ladwa', 'Thehpuria', 'Kalalwala', 'Rangar Nangal',
  'Chhachhi', 'Panjwar', 'Sialba', 'Mokal', 'Nakodar', 'Dhanoa', 'Bhurewala', 'Mirowal', 'Ghanaya', 'Kakar', 'Randhawa',
  'Gill', 'Sidhu', 'Sandhu', 'Virk', 'Bajwa', 'Cheema', 'Dhillon', 'Grewal', 'Aulakh',
];
