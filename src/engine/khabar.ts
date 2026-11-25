// Khabar: the news of the subcontinent, season by season.
//
// The Mughal court kept akhbar-navis, news-writers who sent newsletters
// (akhbarat) from every province; the Rajput courts, the Peshwas and Ranjit
// Singh's darbar kept them too. The Khabar is the player's own akhbar: wars,
// conquests and deaths across the map, the history that moves around the
// Punjab, and the talk of the bazaars.

import { REGION_BY_ID } from '../data/regions';
import { date } from './query';
import { pick, rand } from './rng';
import type { GameState, RegionId } from './state';

export type Desk = 'punjab' | 'afghan' | 'hindustan' | 'rajputana' | 'sindh' | 'deccan' | 'south' | 'bengal' | 'hills' | 'company';

export interface KhabarItem {
  turn: number;
  year: number;
  festival: 'vaisakhi' | 'diwali';
  desk: Desk;
  headline: string;
  text: string;
  region?: RegionId;
  /** 1 = bazaar talk, 2 = news, 3 = great news. */
  weight: number;
}

export const DESK_NAME: Record<Desk, string> = {
  punjab: 'The Punjab',
  afghan: 'Kabul and Khurasan',
  hindustan: 'Delhi and Hindustan',
  rajputana: 'Rajputana',
  sindh: 'Sindh and Baluchistan',
  deccan: 'The Deccan',
  south: 'The South',
  bengal: 'Bengal and Bihar',
  hills: 'The Hills, Nepal and Tibet',
  company: 'The Company',
};

const DOAB_DESK: Record<string, Desk> = {
  sind_sagar: 'punjab', chaj: 'punjab', rachna: 'punjab', bari: 'punjab', bist_jalandhar: 'punjab', malwa: 'punjab', multan: 'punjab', derajat: 'punjab',
  peshawar: 'afghan', afghan: 'afghan', hills: 'hills', kashmir: 'hills', himalaya: 'hills', tibet: 'hills',
  doab_ganga: 'hindustan', hindustan: 'hindustan', central: 'hindustan', rajputana: 'rajputana', gujarat: 'rajputana',
  baluch: 'sindh', sindh: 'sindh', deccan: 'deccan', south: 'south', ceylon: 'south', bengal: 'bengal',
};

export const deskOf = (region?: RegionId): Desk => (region && REGION_BY_ID[region] ? DOAB_DESK[REGION_BY_ID[region].doab] ?? 'hindustan' : 'hindustan');

/** File a report in the Khabar. */
export function report(s: GameState, headline: string, text: string, opts: { region?: RegionId; desk?: Desk; weight?: number } = {}): void {
  const d = date(s);
  s.khabar ??= [];
  s.khabar.push({ turn: s.turn, year: d.year, festival: d.festival, desk: opts.desk ?? deskOf(opts.region), headline, text, region: opts.region, weight: opts.weight ?? 2 });
  if (s.khabar.length > 500) s.khabar.splice(0, s.khabar.length - 400);
}

/* ── Dated reports: what the news-writers would have sent ─────────────────── */

interface Dated {
  year: number;
  festival?: 'vaisakhi' | 'diwali';
  desk: Desk;
  headline: string;
  text: string;
}

const DATED: Dated[] = [
  { year: 1748, desk: 'hindustan', headline: 'The emperor is dead', text: 'Muhammad Shah has died at Delhi, weeks after his son’s army turned back the Afghans at Manupur. Ahmad Shah, the new emperor, is twenty-two.' },
  { year: 1748, festival: 'diwali', desk: 'deccan', headline: 'The Nizam is gone', text: 'Asaf Jah, the old Nizam-ul-Mulk, has died at Burhanpur. His sons are already quarrelling over the Deccan, and the French and English companies are choosing sides.' },
  { year: 1749, desk: 'south', headline: 'War in the Carnatic', text: 'Dupleix of the French company has put his own candidate on the throne of Arcot. The English back the other.' },
  { year: 1751, festival: 'diwali', desk: 'south', headline: 'Clive holds Arcot', text: 'A young clerk of the English company, Robert Clive, has held the fort of Arcot for fifty days against the French and their nawab.' },
  { year: 1754, desk: 'hindustan', headline: 'An emperor blinded', text: 'The wazir Imad-ul-Mulk has deposed and blinded the emperor Ahmad Shah. Alamgir II sits on the throne of Delhi — at the wazir’s pleasure.' },
  { year: 1756, desk: 'bengal', headline: 'Siraj-ud-Daula takes Calcutta', text: 'The young Nawab of Bengal has taken Fort William from the English company. Many prisoners died in a small cell; the English call it the Black Hole.' },
  { year: 1757, desk: 'hindustan', headline: 'Delhi and Mathura sacked', text: 'Ahmad Shah Durrani has plundered Delhi and fallen on Mathura and Vrindavan at the time of a festival. The Yamuna, they say, ran red.' },
  { year: 1758, desk: 'hindustan', headline: 'Marathas at Attock', text: 'Raghunath Rao’s horsemen have driven the Afghans out of Lahore and watered their horses at Attock. Never has a Maratha army ridden so far.' },
  { year: 1759, festival: 'diwali', desk: 'hindustan', headline: 'Another emperor murdered', text: 'Alamgir II has been murdered at Delhi. His son Shah Alam, far away in Bihar, proclaims himself emperor.' },
  { year: 1760, desk: 'south', headline: 'Wandiwash', text: 'At Wandiwash the English have broken the French army of Lally. French power in India will not recover.' },
  { year: 1761, desk: 'hindustan', headline: 'Panipat', text: 'At Panipat, on the fourteenth of January, Ahmad Shah has destroyed the Maratha army. Sadashivrao Bhau and the Peshwa’s son are dead; perhaps a hundred thousand fell. The Peshwa himself dies of grief months later.' },
  { year: 1761, desk: 'south', headline: 'Hyder Ali takes Mysore', text: 'Hyder Ali, a soldier risen from nothing, has made himself master of Mysore. The Wodeyar raja keeps only his title.' },
  { year: 1763, desk: 'hindustan', headline: 'Suraj Mal killed', text: 'Raja Suraj Mal of Bharatpur, the wisest head among the Jats, has been killed in an ambush by Najib-ud-Daula’s men near the Hindan.' },
  { year: 1764, festival: 'diwali', desk: 'bengal', headline: 'Buxar', text: 'At Buxar the Company’s sepoys have beaten the armies of Bengal, Awadh and the emperor together.' },
  { year: 1767, desk: 'south', headline: 'Mysore against the Company', text: 'Hyder Ali and the Nizam have made war on the English of Madras. Hyder’s horse ride to the walls of Madras itself.' },
  { year: 1771, desk: 'hindustan', headline: 'The emperor returns to Delhi', text: 'Shah Alam has come home to Delhi under Maratha escort, after twelve years in exile.' },
  { year: 1772, desk: 'afghan', headline: 'Ahmad Shah dies', text: 'Ahmad Shah Durrani has died at Murgha, worn down by the sore that ate his face. His son Timur Shah moves the capital from Kandahar to Kabul.' },
  { year: 1772, desk: 'company', headline: 'Warren Hastings in Bengal', text: 'The Company has sent Warren Hastings to govern Bengal. He means to collect the revenue himself.' },
  { year: 1775, desk: 'deccan', headline: 'The First Maratha War', text: 'The Bombay government has taken up Raghunath Rao’s claim to be Peshwa. War has begun between the Company and Pune.' },
  { year: 1782, desk: 'deccan', headline: 'Peace of Salbai', text: 'The Marathas and the Company have made peace at Salbai. Mahadji Scindia stands as guarantor — and as the greatest man in Hindustan.' },
  { year: 1783, desk: 'hindustan', headline: 'The Khalsa in Delhi', text: 'Sikh horse under Baghel Singh have entered Delhi. They will leave with a share of the city’s customs, and gurdwaras at the places where the Gurus are remembered.' },
  { year: 1784, desk: 'south', headline: 'Peace of Mangalore', text: 'Tipu Sultan has made peace with the Company at Mangalore, on equal terms. The English commissioners are not pleased.' },
  { year: 1788, desk: 'hindustan', headline: 'The emperor blinded', text: 'Ghulam Qadir the Rohilla has seized the Red Fort and put out the eyes of the emperor Shah Alam. Mahadji Scindia is marching.' },
  { year: 1792, desk: 'south', headline: 'Tipu loses half his kingdom', text: 'Cornwallis has forced Tipu Sultan to cede half his kingdom and send two of his sons as hostages.' },
  { year: 1793, desk: 'bengal', headline: 'The Permanent Settlement', text: 'The Company has fixed the land revenue of Bengal for ever. The zamindars are to be landlords now, in the English manner.' },
  { year: 1794, desk: 'hindustan', headline: 'Mahadji Scindia dies', text: 'Mahadji Scindia, who rebuilt Maratha power after Panipat, has died near Pune.' },
  { year: 1795, desk: 'deccan', headline: 'Kharda', text: 'The Maratha chiefs have united one last time and beaten the Nizam at Kharda.' },
  { year: 1799, desk: 'south', headline: 'Srirangapatna falls', text: 'The English have stormed Srirangapatna. Tipu Sultan was found dead at the breach.' },
  { year: 1800, desk: 'deccan', headline: 'Nana Phadnavis dies', text: 'Nana Phadnavis, the minister who held the Maratha confederacy together, has died. Wise men say its wisdom died with him.' },
  { year: 1802, festival: 'diwali', desk: 'deccan', headline: 'The Treaty of Bassein', text: 'The Peshwa has fled to the English and signed away his independence at Bassein. Scindia and Bhonsle will not accept it.' },
  { year: 1806, desk: 'south', headline: 'Mutiny at Vellore', text: 'Sepoys at Vellore have risen against new orders on turbans and caste marks. The revolt was put down with great bloodshed.' },
  { year: 1809, desk: 'company', headline: 'Treaty of Amritsar', text: 'Metcalfe’s treaty is signed: the Sutlej is the line between the Company and the Lahore Darbar.' },
  { year: 1813, desk: 'company', headline: 'The Company’s monopoly broken', text: 'Parliament in London has ended the Company’s monopoly of the India trade. Missionaries may now go where they please.' },
  { year: 1817, desk: 'hindustan', headline: 'The Pindaris hunted', text: 'The Company has sent armies from three sides to destroy the Pindari raiders of Malwa.' },
  { year: 1824, desk: 'bengal', headline: 'War with Burma', text: 'The Company has gone to war with the King of Ava over Assam and Arakan.' },
  { year: 1829, desk: 'bengal', headline: 'Sati forbidden', text: 'Lord William Bentinck has forbidden sati in the Company’s territories.' },
  { year: 1835, desk: 'company', headline: 'English for the schools', text: 'Macaulay’s minute has carried the day: the Company will pay for teaching in English, not Persian or Sanskrit.' },
  { year: 1838, desk: 'afghan', headline: 'The Army of the Indus', text: 'The Company is marching on Kabul by the Bolan Pass to restore Shah Shuja to the throne Dost Mohammad holds.' },
  { year: 1839, desk: 'afghan', headline: 'Shah Shuja at Kabul', text: 'Shah Shuja has entered Kabul behind British bayonets. The Afghans watched in silence.' },
  { year: 1841, festival: 'diwali', desk: 'afghan', headline: 'Rising at Kabul', text: 'Kabul has risen. The British envoys Burnes and Macnaghten are dead; the army in the cantonments is surrounded.' },
  { year: 1843, desk: 'sindh', headline: 'Sindh annexed', text: 'Napier has beaten the Amirs at Miani and Dubba. Sindh is the Company’s.' },
  { year: 1846, desk: 'hills', headline: 'Kashmir sold', text: 'By the Treaty of Amritsar the Company has sold Kashmir to Gulab Singh of Jammu for seventy-five lakh rupees.' },
  { year: 1848, desk: 'company', headline: 'Dalhousie arrives', text: 'The new Governor-General, Lord Dalhousie, is thirty-five and in a hurry.' },
];

/* ── Bazaar talk ─────────────────────────────────────────────────────────── */

const TALK: { desk: Desk; headline: string; text: string; monsoon?: boolean }[] = [
  { desk: 'punjab', headline: 'Grain in the Amritsar mandi', text: 'Wheat sells at {n} seers to the rupee in the Amritsar mandi; the traders say the harvest is {good}.' },
  { desk: 'punjab', headline: 'Pilgrims at Amritsar', text: 'Sangats from Malwa and the Doaba crowd the parikrama for the festival. The langar fires burn all night.' },
  { desk: 'punjab', headline: 'The rivers rise', text: 'The Ravi and the Chenab are in flood. Boatmen at the ghats ask double fares, and get them.', monsoon: true },
  { desk: 'afghan', headline: 'Caravan from Bukhara', text: 'A caravan of {n} camels has come down the Khyber with horses, dried fruit and Bukhara silk.' },
  { desk: 'afghan', headline: 'Snow in the passes', text: 'Snow has closed the passes above Kabul early this year. The traders who did not leave in time will winter in Peshawar.' },
  { desk: 'hindustan', headline: 'Delhi talk', text: 'In the Chandni Chowk they say the emperor’s pension is in arrears again, and the qila servants have not been paid.' },
  { desk: 'hindustan', headline: 'Pilgrims at Haridwar', text: 'A great mela at Haridwar. Naga sadhus and bairagis quarrelled over the order of bathing; the faujdar kept them apart.' },
  { desk: 'rajputana', headline: 'A Rajput succession', text: 'A succession quarrel at one of the Rajput courts. Both claimants have asked the Marathas for help, and both will pay for it.' },
  { desk: 'sindh', headline: 'Indus boats', text: 'The boatmen of the Indus say the river is running high below Sukkur. Trade to Thatta is good.' },
  { desk: 'deccan', headline: 'Cotton from Berar', text: 'Carts of Berar cotton crowd the roads to Surat and Bombay. Prices are high: the English mills want all they can get.' },
  { desk: 'south', headline: 'Pepper on the Malabar coast', text: 'Dutch, English and Arab ships wait off Calicut for the pepper harvest.' },
  { desk: 'bengal', headline: 'Muslin of Dhaka', text: 'The weavers of Dhaka complain the Company’s gomashtas force them to sell their muslin below its price.' },
  { desk: 'bengal', headline: 'Ships at Calcutta', text: '{n} Company ships lie in the Hooghly below Fort William, loading saltpetre, indigo and silk.' },
  { desk: 'hills', headline: 'Shawl-wool from Tibet', text: 'The pashm caravans from Rudok and Gartok have reached Leh. The shawl-weavers of Srinagar wait for them.' },
  { desk: 'hills', headline: 'A hill raja’s wedding', text: 'Two hill rajas have sealed a peace with a wedding. Painters from Guler made the bride’s portrait.' },
  { desk: 'company', headline: 'Letters from London', text: 'The ships have brought letters from London: the Directors want more revenue and fewer wars, as they always do.' },
];

/** Each turn: the dated news of this season, and a little bazaar talk. */
export function gatherKhabar(s: GameState): void {
  const d = date(s);
  for (const n of DATED) {
    if (n.year !== d.year) continue;
    if ((n.festival ?? 'vaisakhi') !== d.festival) continue;
    report(s, n.headline, n.text, { desk: n.desk, weight: 3 });
  }
  const talk = TALK.filter((t) => t.monsoon === undefined || t.monsoon === d.monsoon);
  for (let i = 0; i < 2; i++) {
    const t = pick(s, talk);
    const text = t.text.replace('{n}', String(Math.round(10 + rand(s) * 30))).replace('{good}', rand(s) < 0.5 ? 'good' : 'thin');
    report(s, t.headline, text, { desk: t.desk, weight: 1 });
  }
}
