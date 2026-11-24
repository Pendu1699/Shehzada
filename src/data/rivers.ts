// The rivers of the Punjab as hand-authored [lat, lon] polylines, upstream to downstream.
// Approximate: shape matters more than survey precision. The "barrier" flag tells
// scripts/build-map.ts whether region borders should snap to the river.

export interface RiverDef {
  id: string;
  name: string;
  /** Older or Punjabi name, shown in the codex. */
  altName?: string;
  barrier: boolean;
  /** Width in world units at the mouth; the renderer tapers upstream. */
  width: number;
  points: [number, number][];
}

export const RIVERS: RiverDef[] = [
  {
    id: 'indus',
    name: 'Indus',
    altName: 'Sindh, Attock',
    barrier: true,
    width: 7,
    points: [
      [35.1, 72.92], [34.85, 72.9], [34.45, 72.86], [34.08, 72.7], [33.93, 72.42], [33.89, 72.25],
      [33.6, 71.95], [33.25, 71.72], [32.96, 71.55], [32.55, 71.45], [32.2, 71.25], [31.83, 71.0],
      [31.3, 70.9], [30.8, 70.86], [30.3, 70.84], [29.9, 70.78], [29.45, 70.66], [28.95, 70.4], [28.4, 69.95],
      [27.7, 68.86], [27.0, 68.2], [26.3, 67.95], [25.4, 68.35], [24.7, 68.0], [24.1, 67.45],
    ],
  },
  {
    id: 'kabul',
    name: 'Kabul River',
    altName: 'Landai',
    barrier: true,
    width: 4,
    points: [[34.53, 69.17], [34.43, 69.9], [34.45, 70.3], [34.3, 70.85], [34.2, 71.2], [34.12, 71.5], [34.02, 71.9], [33.92, 72.23]],
  },
  {
    id: 'jhelum_vale',
    name: 'Jhelum (Vyeth, in the Vale)',
    altName: 'Vyeth',
    barrier: false,
    width: 3,
    points: [[33.73, 75.15], [33.95, 75.0], [34.08, 74.8], [34.3, 74.6], [34.2, 74.35]],
  },
  {
    id: 'jhelum',
    name: 'Jhelum',
    altName: 'Vitasta, Bihat',
    barrier: true,
    width: 5,
    points: [
      [34.2, 74.35], [34.12, 74.0], [34.32, 73.6], [34.37, 73.47], [34.1, 73.5], [33.7, 73.58], [33.3, 73.65],
      [33.08, 73.68], [32.93, 73.73], [32.75, 73.42], [32.58, 73.04], [32.45, 72.72], [32.3, 72.4], [31.9, 72.28], [31.5, 72.2], [31.15, 72.15],
    ],
  },
  {
    id: 'chenab',
    name: 'Chenab',
    altName: 'Chandrabhaga',
    barrier: true,
    width: 6,
    points: [
      [33.3, 75.6], [33.12, 75.2], [33.02, 74.92], [32.9, 74.73], [32.68, 74.42], [32.5, 74.12], [32.33, 73.82],
      [32.12, 73.5], [31.9, 73.2], [31.75, 72.95], [31.5, 72.6], [31.28, 72.25], [31.15, 72.15], [30.95, 72.0],
      [30.7, 71.85], [30.45, 71.55], [30.2, 71.36], [29.8, 71.2], [29.35, 71.05], [29.1, 70.7], [28.95, 70.4],
    ],
  },
  {
    id: 'ravi',
    name: 'Ravi',
    altName: 'Iravati',
    barrier: true,
    width: 4,
    points: [
      [32.45, 76.4], [32.55, 76.13], [32.45, 75.85], [32.37, 75.6], [32.2, 75.33], [32.04, 75.03], [31.85, 74.7],
      [31.63, 74.3], [31.4, 74.0], [31.15, 73.6], [30.92, 73.15], [30.72, 72.62], [30.68, 72.15], [30.7, 71.85],
    ],
  },
  {
    id: 'beas',
    name: 'Beas',
    altName: 'Vipasha',
    barrier: true,
    width: 4,
    points: [
      [32.22, 77.18], [31.96, 77.1], [31.71, 76.93], [31.75, 76.55], [31.88, 76.22], [31.97, 75.95], [32.0, 75.65],
      [31.8, 75.45], [31.52, 75.29], [31.38, 75.15], [31.22, 75.02], [31.16, 74.95],
    ],
  },
  {
    id: 'sutlej',
    name: 'Sutlej',
    altName: 'Shatadru',
    barrier: true,
    width: 6,
    points: [
      [30.72, 81.3], [31.05, 80.4], [31.4, 79.5], [31.75, 78.9], [31.55, 78.2], [31.48, 77.62], [31.36, 77.1], [31.33, 76.76], [31.42, 76.5], [31.25, 76.43], [31.1, 76.5], [30.98, 76.48],
      [31.0, 76.2], [31.02, 75.85], [31.05, 75.5], [31.1, 75.2], [31.16, 74.95], [31.05, 74.75], [30.98, 74.58],
      [30.7, 74.25], [30.4, 74.0], [30.1, 73.6], [29.95, 73.2], [29.7, 72.6], [29.5, 72.0], [29.48, 71.7], [29.35, 71.05],
    ],
  },
  {
    id: 'yamuna',
    name: 'Yamuna',
    altName: 'Jamna',
    barrier: true,
    width: 5,
    points: [[30.65, 77.75], [30.44, 77.62], [30.15, 77.38], [29.8, 77.2], [29.4, 77.12], [29.0, 77.2], [28.7, 77.28], [28.4, 77.32], [27.9, 77.6], [27.18, 78.02], [26.78, 79.02], [26.12, 79.74], [25.42, 81.88]],
  },
  // ── Beyond the Punjab ──────────────────────────────────────────────────────
  { id: 'ganga', name: 'Ganga', altName: 'Ganges', barrier: true, width: 9, points: [
    [30.99, 78.94], [30.4, 78.5], [29.95, 78.16], [28.78, 78.13], [27.38, 79.6], [26.47, 80.35], [25.42, 81.88], [25.15, 82.57], [25.32, 83.02],
    [25.57, 83.98], [25.62, 85.15], [25.38, 86.47], [25.26, 87.0], [25.05, 87.84], [24.8, 87.92], [24.3, 88.6], [23.8, 89.7], [23.22, 90.65], [22.5, 90.7], [22.0, 90.8]] },
  { id: 'hooghly', name: 'Hooghly', altName: 'Bhagirathi', barrier: true, width: 5, points: [[24.8, 87.95], [24.18, 88.27], [23.4, 88.37], [22.57, 88.36], [21.9, 88.1]] },
  { id: 'brahmaputra', name: 'Brahmaputra', altName: 'Jamuna (in Bengal)', barrier: true, width: 9, points: [[26.3, 92.6], [26.1, 91.0], [26.02, 89.98], [25.15, 89.7], [24.3, 89.8], [23.8, 89.7]] },
  { id: 'tsangpo', name: 'Yarlung Tsangpo', barrier: true, width: 5, points: [[30.4, 82.2], [29.6, 84.5], [29.3, 87.0], [29.27, 88.88], [29.3, 90.5], [29.2, 92.6]] },
  { id: 'ghaghara', name: 'Ghaghara', altName: 'Sarju', barrier: true, width: 5, points: [[29.0, 80.4], [28.2, 81.2], [27.4, 81.6], [26.8, 82.2], [26.3, 83.5], [25.75, 84.6]] },
  { id: 'chambal', name: 'Chambal', barrier: true, width: 4, points: [[22.6, 75.7], [23.6, 75.6], [24.6, 75.7], [25.2, 75.85], [26.0, 76.9], [26.5, 78.3], [26.48, 79.2]] },
  { id: 'narmada', name: 'Narmada', barrier: true, width: 6, points: [[22.67, 81.75], [23.1, 79.9], [22.9, 78.2], [22.4, 76.5], [22.0, 74.5], [21.85, 73.5], [21.7, 72.8]] },
  { id: 'tapti', name: 'Tapti', barrier: true, width: 4, points: [[21.75, 78.25], [21.3, 76.2], [21.1, 74.8], [21.2, 72.8]] },
  { id: 'mahanadi', name: 'Mahanadi', barrier: true, width: 5, points: [[20.7, 81.6], [21.3, 82.6], [21.5, 83.9], [20.9, 85.0], [20.45, 85.9], [20.3, 86.7]] },
  { id: 'godavari', name: 'Godavari', barrier: true, width: 6, points: [[19.95, 73.8], [19.5, 75.2], [19.15, 77.31], [18.8, 79.0], [18.0, 80.6], [17.0, 81.8], [16.5, 82.3]] },
  { id: 'krishna', name: 'Krishna', barrier: true, width: 6, points: [[17.95, 73.65], [16.85, 74.6], [16.5, 76.3], [16.2, 77.8], [16.3, 79.0], [16.5, 80.6], [15.9, 81.1]] },
  { id: 'kaveri', name: 'Kaveri', barrier: false, width: 5, points: [[12.4, 75.7], [12.4, 76.7], [12.2, 77.3], [11.6, 77.8], [11.0, 78.5], [10.9, 79.5], [11.3, 79.8]] },
  { id: 'helmand', name: 'Helmand', barrier: true, width: 4, points: [[34.5, 68.0], [33.4, 66.5], [32.0, 64.8], [31.4, 64.3], [30.6, 63.6], [31.1, 61.9], [31.0, 61.5]] },
  { id: 'oxus', name: 'Oxus', altName: 'Amu Darya', barrier: true, width: 7, points: [[36.6, 71.6], [37.2, 70.6], [37.35, 69.4], [37.2, 68.3], [37.3, 67.1], [37.6, 66.2]] },
];

export interface FordDef {
  id: string;
  name: string;
  river: string;
  at: [number, number];
  /** 'ford' is wadeable in the dry season; 'ferry' needs boats and is slower, but works in flood. */
  kind: 'ford' | 'ferry' | 'bridge';
}

export const FORDS: FordDef[] = [
  { id: 'attock_ferry', name: 'Attock', river: 'indus', at: [33.89, 72.25], kind: 'ferry' },
  { id: 'kalabagh', name: 'Kalabagh', river: 'indus', at: [32.96, 71.55], kind: 'ferry' },
  { id: 'dera_ferry', name: 'Dera Ismail Khan ferry', river: 'indus', at: [31.83, 71.0], kind: 'ferry' },
  { id: 'jhelum_ferry', name: 'Jhelum ghat', river: 'jhelum', at: [32.93, 73.73], kind: 'ferry' },
  { id: 'pdk_ferry', name: 'Pind Dadan Khan', river: 'jhelum', at: [32.58, 73.04], kind: 'ferry' },
  { id: 'wazirabad_ford', name: 'Wazirabad', river: 'chenab', at: [32.47, 74.1], kind: 'ford' },
  { id: 'ramnagar_ford', name: 'Ramnagar', river: 'chenab', at: [32.33, 73.82], kind: 'ford' },
  { id: 'shahdara', name: 'Shahdara ferry', river: 'ravi', at: [31.62, 74.3], kind: 'ferry' },
  { id: 'harike', name: 'Harike pattan', river: 'sutlej', at: [31.16, 74.95], kind: 'ford' },
  { id: 'phillaur', name: 'Phillaur ghat', river: 'sutlej', at: [31.02, 75.79], kind: 'ferry' },
  { id: 'ropar', name: 'Ropar', river: 'sutlej', at: [30.98, 76.5], kind: 'ford' },
  { id: 'ferozepur_ghat', name: 'Ferozepur ghat', river: 'sutlej', at: [30.98, 74.58], kind: 'ferry' },
  { id: 'beas_ghat', name: 'Beas ghat', river: 'beas', at: [31.52, 75.29], kind: 'ferry' },
  { id: 'buriya', name: 'Buriya ghat', river: 'yamuna', at: [30.15, 77.38], kind: 'ford' },
  { id: 'agra_ghat', name: 'Agra ghat', river: 'yamuna', at: [27.18, 78.02], kind: 'ferry' },
  { id: 'haridwar', name: 'Haridwar', river: 'ganga', at: [29.95, 78.16], kind: 'ford' },
  { id: 'prayag_ferry', name: 'Prayag', river: 'ganga', at: [25.42, 81.88], kind: 'ferry' },
  { id: 'benares_ghat', name: 'Benares ghats', river: 'ganga', at: [25.32, 83.02], kind: 'ferry' },
  { id: 'patna_ghat', name: 'Patna ghat', river: 'ganga', at: [25.62, 85.15], kind: 'ferry' },
  { id: 'rajmahal', name: 'Rajmahal', river: 'ganga', at: [25.05, 87.84], kind: 'ferry' },
  { id: 'hooghly_ferry', name: 'Calcutta ferry', river: 'hooghly', at: [22.57, 88.36], kind: 'ferry' },
  { id: 'dhubri', name: 'Dhubri', river: 'brahmaputra', at: [26.02, 89.98], kind: 'ferry' },
  { id: 'goalundo', name: 'Goalundo', river: 'ganga', at: [23.8, 89.7], kind: 'ferry' },
  { id: 'dholpur', name: 'Dholpur', river: 'chambal', at: [26.6, 77.9], kind: 'ford' },
  { id: 'hoshangabad', name: 'Hoshangabad', river: 'narmada', at: [22.75, 77.72], kind: 'ford' },
  { id: 'surat_ferry', name: 'Surat', river: 'tapti', at: [21.2, 72.85], kind: 'ferry' },
  { id: 'cuttack_ford', name: 'Cuttack', river: 'mahanadi', at: [20.45, 85.88], kind: 'ford' },
  { id: 'nanded_ford', name: 'Nanded', river: 'godavari', at: [19.15, 77.31], kind: 'ford' },
  { id: 'krishna_ford', name: 'Raichur doab ford', river: 'krishna', at: [16.3, 77.3], kind: 'ford' },
  { id: 'srirangapatna_ford', name: 'Srirangapatna', river: 'kaveri', at: [12.42, 76.68], kind: 'ford' },
  { id: 'girishk', name: 'Girishk', river: 'helmand', at: [31.8, 64.57], kind: 'ford' },
  { id: 'kilif', name: 'Kilif', river: 'oxus', at: [37.35, 66.3], kind: 'ferry' },
  { id: 'gartok_ford', name: 'Tirthapuri', river: 'sutlej', at: [31.15, 80.75], kind: 'ford' },
  { id: 'shigatse_ferry', name: 'Shigatse', river: 'tsangpo', at: [29.27, 88.88], kind: 'ferry' },
  { id: 'sukkur', name: 'Sukkur', river: 'indus', at: [27.7, 68.86], kind: 'ferry' },
  { id: 'palk_ferry', name: 'Palk Strait', river: 'palk', at: [9.3, 79.4], kind: 'ferry' },
  { id: 'hyderabad_ferry', name: 'Hyderabad ferry', river: 'indus', at: [25.4, 68.35], kind: 'ferry' },
];
