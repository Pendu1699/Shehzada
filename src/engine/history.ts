// The wider subcontinent's history, 1748–1849, as a timeline of who held what.
//
// The Punjab is where the game is played: its frontiers move by war, treaty and
// the player's choices. Beyond it, the powers of Hindustan, the Deccan, Bengal,
// Afghanistan and Tibet follow this timeline, so history runs roughly as it
// happened around the player — unless the player holds the land in question,
// in which case history bends and the chronicle says so.
//
// Dates are the year the change took effect (often a treaty or the decisive
// battle). Princely states that accepted the Company's paramountcy after 1818
// are shown as Company land: in the game they are closed to everyone else.

import { REGION_BY_ID } from '../data/regions';
import { chronicle } from './chronicle';
import { year } from './query';
import type { GameState } from './state';

/** Owners of the regions beyond the Punjab at Vaisakhi 1748 (null: local rulers). */
export const OUTER_1748: Record<string, string | null> = {
  kabul: 'durrani', jalalabad: 'durrani', ghazni: 'durrani', kandahar: 'durrani', herat: 'durrani', farah: 'durrani',
  hazarajat: null, balkh: null, kunduz: null, badakhshan: null, chitral: null, swat: null, gilgit: null, baltistan: null, ladakh: null,
  quetta: 'kalat', kalat: 'kalat', makran: 'kalat', las_bela: 'kalat',
  shikarpur: 'sindh_amirs', hyderabad_sindh: 'sindh_amirs', thatta: 'sindh_amirs', thar: 'sindh_amirs',
  bikaner: 'rajputs', jaisalmer: 'rajputs', jodhpur: 'rajputs', jaipur: 'rajputs', ajmer: 'mughal', mewar: 'rajputs', kota: 'rajputs',
  bharatpur: 'jats', agra: 'mughal', gwalior: null, rohilkhand: 'rohillas', farrukhabad: null, kumaon: null, garhwal: null,
  awadh: 'nawab_awadh', allahabad: 'nawab_awadh', benares: 'nawab_awadh', bundelkhand: null,
  malwa_c: 'maratha', bhopal: null, gondwana: null, nagpur: 'maratha', chhattisgarh: 'maratha', khandesh: 'nizam',
  ahmedabad: 'mughal', surat: 'mughal', kathiawar: null, kutch: null,
  bombay: 'company', konkan: 'maratha', pune: 'maratha', aurangabad: 'nizam', nanded: 'nizam', hyderabad: 'nizam', bijapur: 'nizam', circars: 'nizam', bastar: null,
  orissa: 'nawab_bengal', kanara: null, mysore: 'khudadad', carnatic: 'arcot', madras: 'company', tanjore: null, madurai: 'arcot', malabar: null, travancore: null,
  ceylon: 'kandy', bihar: 'nawab_bengal', chota_nagpur: null, murshidabad: 'nawab_bengal', rangpur: 'nawab_bengal', calcutta: 'company', dhaka: 'nawab_bengal', chittagong: 'nawab_bengal',
  kathmandu: null, gorkha: 'gurkha', sikkim: null, ngari: 'tibet', changtang: 'tibet', tsang: 'tibet', lhasa: 'tibet',
};

export interface HistoryStep {
  year: number;
  regions: string[];
  owner: string | null;
  /** What happened, for the chronicle. */
  text: string;
  /** What the chronicle says if the player's hold on the land prevented it. */
  bent?: string;
}

export const TIMELINE: HistoryStep[] = [
  { year: 1751, regions: ['balkh'], owner: 'durrani', text: 'Ahmad Shah’s generals took Balkh beyond the Hindu Kush.' },
  { year: 1751, regions: ['orissa'], owner: 'maratha', text: 'Alivardi Khan ceded Orissa to the Bhonsles of Nagpur to end the Maratha raids on Bengal.' },
  { year: 1752, regions: ['khandesh'], owner: 'maratha', text: 'Khandesh passed from the Nizam to the Peshwa.' },
  { year: 1756, regions: ['ajmer'], owner: 'maratha', text: 'Ajmer fell to the Marathas.' },
  { year: 1758, regions: ['ahmedabad'], owner: 'maratha', text: 'The Marathas took Ahmedabad; the Mughal province of Gujarat was gone.' },
  { year: 1759, regions: ['surat'], owner: 'company', text: 'The Company seized the castle of Surat.' },
  { year: 1760, regions: ['bijapur'], owner: 'maratha', text: 'After Udgir the Nizam ceded Bijapur to the Peshwa.' },
  { year: 1760, regions: ['chittagong'], owner: 'company', text: 'Mir Qasim granted Chittagong to the Company.' },
  { year: 1761, regions: ['agra'], owner: 'jats', text: 'While the Marathas bled at Panipat, Suraj Mal’s Jats took Agra.' },
  { year: 1763, regions: ['kanara'], owner: 'khudadad', text: 'Hyder Ali, master of Mysore since 1761, took Bednur and the Kanara coast.' },
  { year: 1765, regions: ['murshidabad', 'bihar', 'rangpur', 'dhaka'], owner: 'company', text: 'At Allahabad the emperor granted the Company the Diwani of Bengal, Bihar and Orissa. The richest province of Hindustan now paid a trading company.', bent: 'The Company was granted the Diwani of Bengal and Bihar — but not where the Khalsa’s banner flew.' },
  { year: 1766, regions: ['circars'], owner: 'company', text: 'The Northern Circars passed to the Company.' },
  { year: 1766, regions: ['malabar'], owner: 'khudadad', text: 'Hyder Ali overran Malabar.' },
  { year: 1768, regions: ['kathmandu'], owner: 'gurkha', text: 'Prithvi Narayan Shah of Gorkha took Kathmandu and made one kingdom of Nepal.' },
  { year: 1774, regions: ['rohilkhand'], owner: 'nawab_awadh', text: 'With Company bayonets, Shuja-ud-Daula of Awadh conquered Rohilkhand.' },
  { year: 1775, regions: ['benares'], owner: 'company', text: 'Awadh ceded Benares to the Company.' },
  { year: 1778, regions: ['farrukhabad'], owner: 'nawab_awadh', text: 'Farrukhabad fell under Awadh.' },
  { year: 1784, regions: ['gwalior'], owner: 'maratha', text: 'Mahadji Scindia took the fort of Gwalior.' },
  { year: 1785, regions: ['agra'], owner: 'maratha', text: 'Mahadji Scindia took Agra and held the emperor in his keeping.' },
  { year: 1790, regions: ['kumaon'], owner: 'gurkha', text: 'The Gorkhas conquered Kumaon.' },
  { year: 1792, regions: ['malabar'], owner: 'company', text: 'By the treaty of Seringapatam Tipu ceded Malabar to the Company.' },
  { year: 1799, regions: ['mysore', 'kanara', 'tanjore'], owner: 'company', text: 'Srirangapatna was stormed and Tipu Sultan died at the breach. Mysore became a Company client.', bent: 'Srirangapatna fell; the Company marched on — but not into lands the Khalsa held.' },
  { year: 1801, regions: ['rohilkhand', 'allahabad', 'farrukhabad', 'carnatic', 'madurai'], owner: 'company', text: 'Awadh ceded half its lands to the Company, and the Carnatic was annexed.' },
  { year: 1803, regions: ['agra', 'orissa', 'bundelkhand'], owner: 'company', text: 'Lake and Wellesley broke the Marathas at Delhi, Assaye and Laswari. Agra and Orissa passed to the Company.' },
  { year: 1804, regions: ['garhwal'], owner: 'gurkha', text: 'The Gorkhas conquered Garhwal.' },
  { year: 1815, regions: ['kumaon', 'garhwal'], owner: 'company', text: 'By the treaty of Sugauli the Gorkhas gave up Kumaon and Garhwal.' },
  { year: 1815, regions: ['ceylon'], owner: 'company', text: 'The British took Kandy, the last kingdom of Ceylon.' },
  {
    year: 1818,
    regions: ['pune', 'konkan', 'khandesh', 'bijapur', 'ahmedabad', 'ajmer', 'malwa_c', 'nagpur', 'chhattisgarh', 'gondwana', 'bhopal', 'kota', 'jaipur', 'jodhpur', 'mewar', 'bikaner', 'jaisalmer', 'kathiawar', 'kutch'],
    owner: 'company',
    text: 'The Third Maratha War ended the Peshwa’s rule; the Rajput and Maratha princes accepted the Company’s paramountcy. From the Sutlej to Cape Comorin, only the Punjab stood outside the red ink.',
    bent: 'The Maratha confederacy fell and the princes accepted the Company — save where the Khalsa’s own writ ran.',
  },
  { year: 1826, regions: ['bharatpur'], owner: 'company', text: 'Combermere stormed Bharatpur at last.' },
  { year: 1834, regions: ['ladakh'], owner: 'jammu', text: 'Zorawar Singh, general of Gulab Singh of Jammu, conquered Ladakh for the Lahore Darbar.' },
  { year: 1840, regions: ['baltistan'], owner: 'jammu', text: 'Zorawar Singh took Skardu and Baltistan.' },
  { year: 1843, regions: ['shikarpur', 'hyderabad_sindh', 'thatta', 'thar'], owner: 'company', text: 'Napier broke the Talpur Mirs at Miani and Dubba: Sindh was annexed.', bent: 'Napier conquered Sindh — but not the districts the Khalsa held.' },
  { year: 1844, regions: ['gwalior'], owner: 'company', text: 'After Maharajpur, Gwalior came under the Company’s control.' },
];

/** Owners of the outer regions at the start of a given year (for scenario setup). */
export function outerOwnersAt(startYear: number): Record<string, string | null> {
  const o: Record<string, string | null> = { ...OUTER_1748 };
  for (const step of TIMELINE) if (step.year < startYear) for (const r of step.regions) o[r] = step.owner;
  return o;
}

const key = (st: HistoryStep) => `history_${st.year}_${st.regions[0]}`;

/** Mark the steps before the start year as already passed. */
export function seedHistory(s: GameState): void {
  for (const st of TIMELINE) if (st.year < s.startYear) s.firedEvents[key(st)] = 0;
}

/**
 * Apply this year's history beyond the Punjab. Runs each turn; a step fires on
 * the first turn of its year. Land the player holds, or where the player's
 * armies stand, is left alone.
 */
export function applyHistory(s: GameState): string[] {
  const y = year(s);
  const notes: string[] = [];
  for (const st of TIMELINE) {
    if (st.year > y || s.firedEvents[key(st)] !== undefined) continue;
    s.firedEvents[key(st)] = s.turn;
    const p = s.playerFaction;
    let bent = false;
    let moved = 0;
    for (const r of st.regions) {
      const rs = s.regions[r];
      if (!rs) continue;
      const playerHere = rs.owner === p || Object.values(s.armies).some((a) => a.owner === p && a.region === r);
      if (playerHere) {
        bent = true;
        continue;
      }
      if (rs.owner === st.owner) continue;
      rs.owner = st.owner;
      rs.control = 60;
      rs.siege = undefined;
      rs.rakhi = null;
      moved++;
      if (st.owner && s.factions[st.owner] && !s.factions[st.owner].alive) s.factions[st.owner].alive = true;
    }
    if (!moved && !bent) continue;
    const text = bent ? (st.bent ?? `${st.text} — but not where the Khalsa held the land.`) : st.text;
    chronicle(s, 'event', text, { weight: bent ? 6 : 2, region: st.regions[0] });
    notes.push(text);
    // Powers left with no land and no army leave the stage.
    for (const f of Object.values(s.factions)) {
      if (!f.alive || f.id === p) continue;
      const hasLand = Object.values(s.regions).some((rr) => rr.owner === f.id);
      const hasArmy = Object.values(s.armies).some((a) => a.owner === f.id);
      if (!hasLand && !hasArmy && st.regions.some((r) => REGION_BY_ID[r] && OUTER_1748[r] === f.id)) f.alive = false;
    }
  }
  return notes;
}
