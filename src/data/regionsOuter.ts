import type { Doab, RegionDef, Resource, SacredSite, Terrain } from './types';

// Beyond the Punjab: the rest of the subcontinent from Herat to Bengal, with
// a strip of Tibet. These regions are larger and coarser than the Punjab's
// (the Punjab stays the detailed heart of the game). Populations are game
// figures scaled to keep economies comparable, not census estimates; faith
// mixes are rough c.1750 sketches. 'other' covers Buddhists, Jains, animists
// and others outside the three faiths the Punjab model tracks.

const site = (id: string, name: string, kind: SacredSite['kind'], note: string, sikhSacred = false): SacredSite => ({ id, name, kind, note, sikhSacred });

function R(
  id: string,
  name: string,
  seat: [number, number],
  doab: Doab,
  terrain: Terrain,
  fertility: number,
  population: number,
  faith: [number, number, number, number?],
  fort: number,
  trade: number,
  resources: Resource[],
  sites: SacredSite[] = [],
  extra: Partial<RegionDef> = {},
): RegionDef {
  const [sikh, hindu, muslim, other = 0] = faith;
  return { id, name, seat, doab, terrain, fertility, population, faith: { sikh, hindu, muslim, other }, fort, trade, resources, sites, ...extra };
}

export const OUTER_REGIONS: RegionDef[] = [
  // ── Afghanistan and the north-west ────────────────────────────────────────
  R('kabul', 'Kabul', [34.53, 69.17], 'afghan', 'mountain', 2, 160, [1, 4, 95], 4, 4, ['horses', 'iron'], [
    site('bala_hisar_kabul', 'Bala Hisar', 'fort', 'The citadel of Kabul above the city.'),
    site('gurdwara_kabul', 'Dharamsal of Guru Nanak, Kabul', 'gurdwara', 'Kept by the Sikh and Hindu traders of Kabul in memory of Guru Nanak’s visit.', true),
  ], { towns: [['Charikar', 35.01, 69.17]] }),
  R('jalalabad', 'Jalalabad', [34.43, 70.45], 'afghan', 'hills', 3, 90, [1, 5, 94], 2, 3, ['grain', 'sugar']),
  R('ghazni', 'Ghazni', [33.55, 68.42], 'afghan', 'mountain', 2, 90, [0, 1, 99], 4, 2, ['horses'], [site('ghazni_minarets', 'Minarets of Ghazni', 'shrine', 'Towers of the Ghaznavid kings.')]),
  R('kandahar', 'Kandahar', [31.61, 65.71], 'afghan', 'desert', 2, 140, [0, 2, 98], 4, 4, ['horses', 'camels'], [site('ahmad_shah_tomb', 'Tomb of Ahmad Shah', 'shrine', 'Ahmad Shah Durrani was buried at Kandahar in 1772.')]),
  R('herat', 'Herat', [34.35, 62.2], 'afghan', 'plains', 3, 150, [0, 1, 99], 4, 4, ['grain', 'shawls'], [site('herat_masjid', 'Friday Mosque of Herat', 'mosque', 'The great Timurid mosque.')]),
  R('farah', 'Farah and Sistan', [32.37, 62.11], 'afghan', 'desert', 1, 60, [0, 0, 100], 2, 1, ['camels']),
  R('hazarajat', 'Hazarajat', [34.82, 67.83], 'afghan', 'mountain', 1, 70, [0, 0, 100], 1, 1, ['horses'], [site('bamiyan', 'Bamiyan', 'shrine', 'The great carved Buddhas in the cliff, already ancient.')]),
  R('balkh', 'Balkh', [36.76, 66.9], 'afghan', 'plains', 3, 110, [0, 0, 100], 3, 3, ['horses', 'cotton'], [site('rauza_sharif', 'Rauza-i-Sharif', 'shrine', 'The blue shrine of Mazar.')]),
  R('kunduz', 'Kunduz', [36.73, 68.86], 'afghan', 'plains', 2, 70, [0, 0, 100], 2, 2, ['horses']),
  R('badakhshan', 'Badakhshan', [37.12, 70.58], 'afghan', 'mountain', 1, 50, [0, 0, 100], 2, 2, ['iron'], [], { towns: [['Faizabad', 37.12, 70.58]] }),
  R('chitral', 'Chitral', [35.85, 71.79], 'himalaya', 'mountain', 1, 30, [0, 0, 100], 2, 1, ['timber']),
  R('swat', 'Swat and Dir', [34.77, 72.36], 'peshawar', 'hills', 3, 90, [0, 1, 99], 2, 2, ['grain', 'timber']),
  R('gilgit', 'Gilgit', [35.92, 74.31], 'himalaya', 'mountain', 1, 25, [0, 0, 100], 2, 1, []),
  R('baltistan', 'Baltistan', [35.3, 75.63], 'himalaya', 'mountain', 1, 30, [0, 0, 100], 2, 1, [], [], { towns: [['Skardu', 35.3, 75.63]] }),
  R('ladakh', 'Ladakh', [34.16, 77.58], 'himalaya', 'mountain', 1, 35, [0, 2, 10, 88], 2, 3, ['shawls'], [site('hemis', 'Hemis Gompa', 'temple', 'The great Drukpa monastery above the Indus.')], { towns: [['Leh', 34.16, 77.58]] }),

  // ── Baluchistan and Sindh ─────────────────────────────────────────────────
  R('quetta', 'Quetta and Shal', [30.18, 66.98], 'baluch', 'mountain', 1, 50, [0, 2, 98], 2, 2, ['horses']),
  R('kalat', 'Kalat', [29.03, 66.59], 'baluch', 'mountain', 1, 60, [0, 3, 97], 3, 2, ['camels'], [site('miri_kalat', 'Miri of Kalat', 'fort', 'Palace-fort of the Khans of Kalat.')]),
  R('makran', 'Makran', [26.0, 63.05], 'baluch', 'desert', 1, 40, [0, 1, 99], 1, 2, ['camels']),
  R('las_bela', 'Las Bela', [26.23, 66.33], 'baluch', 'desert', 1, 30, [0, 2, 98], 1, 1, ['camels']),
  R('shikarpur', 'Shikarpur', [27.95, 68.64], 'sindh', 'plains', 3, 140, [1, 25, 74], 2, 5, ['grain', 'indigo'], [site('sadh_belo', 'Sadh Belo', 'temple', 'The island temple in the Indus at Sukkur.')], { towns: [['Sukkur', 27.7, 68.86], ['Khairpur', 27.53, 68.76]] }),
  R('hyderabad_sindh', 'Hyderabad (Sindh)', [25.39, 68.37], 'sindh', 'plains', 3, 160, [0, 20, 80], 3, 3, ['grain', 'cotton']),
  R('thatta', 'Thatta and Karachi', [24.75, 67.92], 'sindh', 'bela', 2, 110, [0, 15, 85], 2, 4, ['salt', 'cotton'], [site('makli', 'Makli necropolis', 'shrine', 'The great city of tombs above Thatta.')], { towns: [['Karachi', 24.86, 67.0]] }),
  R('thar', 'Umarkot and the Thar', [25.36, 69.74], 'sindh', 'desert', 1, 50, [0, 45, 55], 2, 1, ['camels']),

  // ── Rajputana ─────────────────────────────────────────────────────────────
  R('bikaner', 'Bikaner', [28.02, 73.31], 'rajputana', 'desert', 1, 90, [0, 85, 15], 4, 2, ['camels'], [site('junagarh', 'Junagarh', 'fort', 'The fort of the Rathores of Bikaner.')]),
  R('jaisalmer', 'Jaisalmer', [26.92, 70.91], 'rajputana', 'desert', 1, 50, [0, 80, 20], 4, 3, ['camels'], [site('sonar_qila', 'Sonar Qila', 'fort', 'The golden fort of the Bhatis on its ridge in the desert.')]),
  R('jodhpur', 'Marwar (Jodhpur)', [26.24, 73.02], 'rajputana', 'desert', 2, 150, [0, 85, 15], 5, 3, ['camels', 'salt'], [site('mehrangarh', 'Mehrangarh', 'fort', 'The fort of the Rathores of Marwar.')]),
  R('jaipur', 'Amber and Jaipur', [26.92, 75.82], 'rajputana', 'plains', 3, 200, [0, 85, 15], 5, 4, ['grain', 'cotton'], [site('amber_fort', 'Amber', 'fort', 'Fort-palace of the Kachhwahas.')]),
  R('ajmer', 'Ajmer', [26.45, 74.64], 'rajputana', 'hills', 2, 100, [0, 70, 30], 3, 4, ['grain'], [site('ajmer_dargah', 'Dargah of Khwaja Moinuddin Chishti', 'shrine', 'The most beloved Sufi shrine of Hindustan.')]),
  R('mewar', 'Mewar (Udaipur)', [24.58, 73.71], 'rajputana', 'hills', 2, 140, [0, 92, 8], 5, 3, ['grain'], [site('chittor', 'Chittorgarh', 'fort', 'The fort of three sieges and three sakas.')]),
  R('kota', 'Kota and Bundi', [25.18, 75.83], 'rajputana', 'hills', 3, 110, [0, 88, 12], 4, 3, ['grain']),
  R('bharatpur', 'Bharatpur', [27.22, 77.49], 'hindustan', 'plains', 4, 150, [0, 85, 15], 5, 3, ['grain'], [site('lohagarh', 'Lohagarh', 'fort', 'The mud-walled “iron fort” of the Jats, which Lake could not take in 1805.')], { towns: [['Deeg', 27.47, 77.33]] }),

  // ── Hindustan: the Doab, Rohilkhand, Awadh ────────────────────────────────
  R('agra', 'Agra', [27.18, 78.01], 'hindustan', 'plains', 4, 220, [0, 70, 30], 5, 5, ['grain', 'indigo'], [
    site('taj_mahal', 'Taj Mahal', 'shrine', 'Shah Jahan’s tomb for Mumtaz Mahal on the Yamuna.'),
    site('agra_fort', 'Agra Fort', 'fort', 'The red fort of Akbar.'),
    site('gurdwara_guru_ka_tal', 'Guru ka Tal', 'gurdwara', 'Where Guru Tegh Bahadur Ji was arrested in 1675.', true),
  ], { towns: [['Mathura', 27.49, 77.67]], gtRoad: true }),
  R('gwalior', 'Gwalior', [26.22, 78.18], 'central', 'hills', 3, 120, [0, 85, 15], 5, 3, ['grain'], [site('gwalior_fort', 'Gwalior Fort', 'fort', 'The fort on its rock; Guru Hargobind Ji was held here, and freed with fifty-two princes.', true)]),
  R('rohilkhand', 'Rohilkhand', [28.37, 79.43], 'hindustan', 'plains', 4, 200, [0, 65, 35], 3, 3, ['grain', 'sugar'], [], { towns: [['Bareilly', 28.37, 79.43], ['Rampur', 28.8, 79.03]] }),
  R('farrukhabad', 'Farrukhabad', [27.39, 79.58], 'hindustan', 'plains', 4, 130, [0, 75, 25], 2, 3, ['grain', 'indigo']),
  R('kumaon', 'Kumaon', [29.6, 79.66], 'himalaya', 'mountain', 1, 60, [0, 98, 2], 2, 1, ['timber'], [site('nanakmatta', 'Nanakmatta Sahib', 'gurdwara', 'Where Guru Nanak Dev Ji met the yogis of Gorakhmata.', true)], { towns: [['Almora', 29.6, 79.66]] }),
  R('garhwal', 'Garhwal', [30.22, 78.78], 'himalaya', 'mountain', 1, 60, [0, 98, 2], 2, 1, ['timber'], [site('badrinath', 'Badrinath', 'temple', 'One of the four dhams of the Himalaya.')], { towns: [['Dehra', 30.32, 78.03]] }),
  R('awadh', 'Awadh (Lucknow)', [26.85, 80.95], 'hindustan', 'plains', 5, 280, [0, 80, 20], 3, 5, ['grain', 'indigo', 'sugar'], [site('ayodhya', 'Ayodhya', 'temple', 'The city of Ram on the Sarju.')], { towns: [['Faizabad', 26.77, 82.14], ['Kanpur', 26.45, 80.33]] }),
  R('allahabad', 'Allahabad', [25.44, 81.85], 'hindustan', 'plains', 4, 180, [0, 82, 18], 4, 4, ['grain'], [site('prayag', 'Prayag', 'temple', 'The meeting of the Ganga and the Yamuna.')]),
  R('benares', 'Benares', [25.32, 83.0], 'hindustan', 'plains', 5, 200, [0, 85, 15], 2, 5, ['grain', 'shawls', 'sugar'], [site('kashi', 'Kashi Vishwanath', 'temple', 'The holiest city of the Hindus, on the ghats of the Ganga.')]),
  R('bundelkhand', 'Bundelkhand', [25.45, 78.57], 'central', 'hills', 2, 120, [0, 90, 10], 4, 2, ['grain', 'iron'], [site('orchha', 'Orchha', 'fort', 'The palaces of the Bundela rajas on the Betwa.')], { towns: [['Jhansi', 25.45, 78.57]] }),

  // ── Central India and Gujarat ─────────────────────────────────────────────
  R('malwa_c', 'Malwa (Indore and Ujjain)', [22.72, 75.86], 'central', 'plains', 4, 200, [0, 88, 12], 3, 4, ['grain', 'cotton'], [site('ujjain', 'Mahakal, Ujjain', 'temple', 'One of the twelve jyotirlingas.')]),
  R('bhopal', 'Bhopal', [23.26, 77.41], 'central', 'hills', 3, 100, [0, 80, 20], 3, 2, ['grain']),
  R('gondwana', 'Gondwana (Jabalpur)', [23.18, 79.95], 'central', 'jungle', 2, 110, [0, 60, 5, 35], 2, 1, ['timber', 'iron']),
  R('nagpur', 'Berar and Nagpur', [21.15, 79.09], 'central', 'plains', 3, 180, [0, 88, 12], 3, 3, ['cotton', 'grain']),
  R('chhattisgarh', 'Chhattisgarh', [21.25, 81.63], 'central', 'jungle', 2, 110, [0, 80, 2, 18], 2, 1, ['grain', 'timber']),
  R('khandesh', 'Khandesh', [21.31, 76.23], 'central', 'plains', 3, 130, [0, 85, 15], 4, 3, ['cotton'], [site('asirgarh', 'Asirgarh', 'fort', 'The key of the Deccan.')], { towns: [['Burhanpur', 21.31, 76.23]] }),
  R('ahmedabad', 'Gujarat (Ahmedabad)', [23.02, 72.57], 'gujarat', 'plains', 4, 240, [0, 75, 15, 10], 3, 5, ['cotton', 'indigo'], [], { towns: [['Baroda', 22.31, 73.18]] }),
  R('surat', 'Surat', [21.17, 72.83], 'gujarat', 'bela', 3, 170, [0, 70, 20, 10], 3, 5, ['cotton', 'indigo']),
  R('kathiawar', 'Kathiawar', [21.52, 70.46], 'gujarat', 'hills', 2, 140, [0, 82, 18], 3, 3, ['cotton', 'horses'], [site('somnath', 'Somnath', 'temple', 'The shore temple, sacked by Mahmud of Ghazni and rebuilt by Ahilyabai Holkar in 1783.'), site('dwarka', 'Dwarka', 'temple', 'The city of Krishna on the western sea.')], { towns: [['Junagadh', 21.52, 70.46]] }),
  R('kutch', 'Kutch', [23.25, 69.67], 'gujarat', 'desert', 1, 70, [0, 75, 20, 5], 3, 3, ['salt', 'horses'], [], { towns: [['Bhuj', 23.25, 69.67]] }),

  // ── The Deccan ────────────────────────────────────────────────────────────
  R('bombay', 'Bombay', [18.93, 72.83], 'deccan', 'bela', 2, 80, [0, 70, 15, 15], 4, 5, ['cotton', 'salt']),
  R('konkan', 'Konkan', [17.4, 73.35], 'deccan', 'jungle', 2, 110, [0, 85, 15], 3, 3, ['salt', 'timber'], [], { towns: [['Ratnagiri', 16.99, 73.3]] }),
  R('pune', 'Pune', [18.52, 73.86], 'deccan', 'hills', 3, 160, [0, 90, 10], 4, 4, ['grain'], [site('shaniwar_wada', 'Shaniwar Wada', 'fort', 'The palace of the Peshwas.'), site('raigad', 'Raigad', 'fort', 'Shivaji’s capital on its hill.')]),
  R('aurangabad', 'Aurangabad', [19.88, 75.34], 'deccan', 'plains', 3, 150, [0, 75, 25], 4, 3, ['cotton', 'grain'], [site('daulatabad', 'Daulatabad', 'fort', 'The fort on its cone of rock.'), site('ellora', 'Ellora', 'temple', 'Caves carved by Buddhists, Hindus and Jains.')]),
  R('nanded', 'Nanded', [19.15, 77.31], 'deccan', 'plains', 3, 100, [2, 80, 18], 2, 2, ['cotton'], [site('hazur_sahib', 'Takht Sachkhand Sri Hazur Sahib', 'takht', 'Where Guru Gobind Singh Ji passed Guruship to the Granth in 1708. One of the five Takhts.', true)]),
  R('hyderabad', 'Hyderabad', [17.39, 78.49], 'deccan', 'plains', 3, 220, [0, 70, 30], 5, 5, ['cotton', 'grain'], [site('golconda', 'Golconda', 'fort', 'The fortress of the diamond kings.'), site('charminar', 'Charminar', 'mosque', 'The four minarets at the heart of the city.')]),
  R('bijapur', 'Bijapur', [16.83, 75.71], 'deccan', 'plains', 2, 140, [0, 80, 20], 4, 3, ['cotton'], [site('gol_gumbaz', 'Gol Gumbaz', 'shrine', 'The great dome of Bijapur.')]),
  R('circars', 'The Northern Circars', [17.0, 81.8], 'deccan', 'bela', 4, 180, [0, 92, 8], 2, 4, ['grain', 'cotton', 'salt'], [], { towns: [['Masulipatnam', 16.17, 81.13], ['Rajahmundry', 17.0, 81.8]] }),
  R('bastar', 'Bastar', [19.08, 82.03], 'central', 'jungle', 1, 60, [0, 40, 2, 58], 1, 1, ['timber']),
  R('orissa', 'Orissa (Cuttack)', [20.46, 85.88], 'bengal', 'bela', 3, 170, [0, 92, 8], 3, 3, ['grain', 'salt'], [site('puri', 'Jagannath, Puri', 'temple', 'The temple of the Lord of the World; Guru Nanak Dev Ji sang the Aarti here.')]),

  // ── The South ─────────────────────────────────────────────────────────────
  R('kanara', 'Kanara (Mangalore)', [12.91, 74.86], 'south', 'jungle', 3, 120, [0, 85, 10, 5], 3, 4, ['timber', 'sugar']),
  R('mysore', 'Mysore', [12.3, 76.64], 'south', 'hills', 3, 220, [0, 88, 12], 5, 4, ['grain', 'iron'], [site('srirangapatna', 'Srirangapatna', 'fort', 'The island fortress-capital of Hyder Ali and Tipu Sultan.')], { towns: [['Bangalore', 12.97, 77.59]] }),
  R('carnatic', 'The Carnatic (Arcot)', [12.91, 79.13], 'south', 'plains', 4, 230, [0, 88, 12], 3, 4, ['grain', 'cotton'], [site('tirupati', 'Tirupati', 'temple', 'The hill temple of Venkateswara.')], { towns: [['Pondicherry', 11.93, 79.83]] }),
  R('madras', 'Madras', [13.08, 80.27], 'south', 'bela', 2, 90, [0, 85, 10, 5], 4, 5, ['cotton', 'salt'], [site('fort_st_george', 'Fort St George', 'fort', 'The Company’s first fortress in India.')]),
  R('tanjore', 'Tanjore', [10.79, 79.14], 'south', 'plains', 5, 200, [0, 92, 6, 2], 3, 4, ['grain'], [site('brihadeeswara', 'Brihadeeswara', 'temple', 'The great Chola temple.')]),
  R('madurai', 'Madurai', [9.93, 78.12], 'south', 'plains', 3, 160, [0, 90, 8, 2], 3, 3, ['cotton', 'grain'], [site('meenakshi', 'Meenakshi Amman', 'temple', 'The temple-city of Madurai.')]),
  R('malabar', 'Malabar (Calicut)', [11.25, 75.78], 'south', 'jungle', 3, 150, [0, 65, 25, 10], 2, 5, ['timber', 'sugar'], [], { towns: [['Cochin', 9.93, 76.26]] }),
  R('travancore', 'Travancore', [8.52, 76.94], 'south', 'jungle', 3, 140, [0, 75, 5, 20], 3, 4, ['timber', 'sugar'], [site('padmanabhaswamy', 'Padmanabhaswamy', 'temple', 'Temple of the rajas of Travancore.')]),
  R('ceylon', 'Ceylon (Kandy)', [7.29, 80.63], 'ceylon', 'mountain', 2, 110, [0, 20, 8, 72], 3, 4, ['timber', 'sugar'], [site('dalada', 'Temple of the Tooth', 'temple', 'The relic of the Buddha at Kandy.')], { towns: [['Colombo', 6.93, 79.85], ['Jaffna', 9.66, 80.02]] }),

  // ── Bihar and Bengal ──────────────────────────────────────────────────────
  R('bihar', 'Bihar (Patna)', [25.59, 85.14], 'bengal', 'plains', 5, 260, [0, 85, 15], 3, 5, ['grain', 'indigo', 'salt'], [site('patna_sahib', 'Takht Sri Patna Sahib', 'takht', 'The birthplace of Guru Gobind Singh Ji. One of the five Takhts.', true)]),
  R('chota_nagpur', 'Chota Nagpur', [23.34, 85.31], 'bengal', 'jungle', 1, 90, [0, 45, 5, 50], 1, 1, ['iron', 'timber']),
  R('murshidabad', 'Murshidabad', [24.18, 88.27], 'bengal', 'plains', 5, 260, [0, 60, 40], 3, 5, ['grain', 'shawls'], [site('plassey', 'Plassey', 'battlefield', 'The mango grove where Clive won Bengal in 1757.')]),
  R('rangpur', 'North Bengal', [25.74, 89.25], 'bengal', 'plains', 4, 180, [0, 55, 45], 1, 3, ['grain', 'indigo']),
  R('calcutta', 'Calcutta', [22.57, 88.36], 'bengal', 'bela', 4, 160, [0, 65, 30, 5], 4, 5, ['salt', 'indigo'], [site('fort_william', 'Fort William', 'fort', 'The Company’s fortress on the Hooghly.')]),
  R('dhaka', 'Dhaka', [23.81, 90.41], 'bengal', 'bela', 5, 230, [0, 45, 55], 3, 5, ['cotton', 'grain'], [site('sangat_tola', 'Gurdwara Sangat Tola', 'gurdwara', 'Where Guru Nanak Dev Ji and later Guru Tegh Bahadur Ji stayed in Dhaka.', true)]),
  R('chittagong', 'Chittagong', [22.34, 91.83], 'bengal', 'jungle', 3, 110, [0, 30, 55, 15], 2, 4, ['timber', 'salt']),

  // ── Nepal, Sikkim and Tibet ───────────────────────────────────────────────
  R('kathmandu', 'Nepal (Kathmandu)', [27.71, 85.32], 'himalaya', 'mountain', 3, 120, [0, 75, 1, 24], 3, 4, ['timber'], [site('pashupatinath', 'Pashupatinath', 'temple', 'The temple of Shiva on the Bagmati.')]),
  R('gorkha', 'Gorkha', [28.0, 84.63], 'himalaya', 'mountain', 1, 70, [0, 85, 0, 15], 3, 1, ['timber'], [], { towns: [['Pokhara', 28.21, 83.99]] }),
  R('sikkim', 'Sikkim', [27.33, 88.61], 'himalaya', 'mountain', 1, 25, [0, 20, 0, 80], 2, 2, []),
  R('ngari', 'Ngari (Western Tibet)', [31.75, 80.36], 'tibet', 'mountain', 1, 25, [0, 3, 2, 95], 1, 2, ['shawls'], [site('kailash', 'Kailash and Mansarovar', 'temple', 'The holy mountain and lake, sacred to Hindus, Buddhists and Jains.')], { towns: [['Gartok', 31.75, 80.36], ['Taklakot', 30.31, 81.17]] }),
  R('changtang', 'Changtang', [32.6, 85.0], 'tibet', 'mountain', 1, 15, [0, 0, 1, 99], 0, 1, ['shawls']),
  R('tsang', 'Tsang (Shigatse)', [29.27, 88.88], 'tibet', 'mountain', 2, 70, [0, 0, 2, 98], 3, 3, ['shawls'], [site('tashilhunpo', 'Tashilhunpo', 'temple', 'Seat of the Panchen Lama.')]),
  R('lhasa', 'Lhasa', [29.65, 91.12], 'tibet', 'mountain', 2, 90, [0, 0, 3, 97], 3, 4, ['shawls'], [site('potala', 'Potala', 'temple', 'The palace of the Dalai Lama.'), site('jokhang', 'Jokhang', 'temple', 'The holiest temple of Tibet.')]),
];
