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
    ],
  },
  {
    id: 'kabul',
    name: 'Kabul River',
    altName: 'Landai',
    barrier: true,
    width: 4,
    points: [[34.45, 70.3], [34.3, 70.85], [34.2, 71.2], [34.12, 71.5], [34.02, 71.9], [33.92, 72.23]],
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
      [31.48, 77.62], [31.36, 77.1], [31.33, 76.76], [31.42, 76.5], [31.25, 76.43], [31.1, 76.5], [30.98, 76.48],
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
    points: [[30.65, 77.75], [30.44, 77.62], [30.15, 77.38], [29.8, 77.2], [29.4, 77.12], [29.0, 77.2], [28.7, 77.28], [28.4, 77.32]],
  },
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
];
