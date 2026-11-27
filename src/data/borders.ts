// The modern borders of the subcontinent that the map's regions are cut to,
// so that the lands of 1947 pass cleanly to India, Pakistan and (East
// Pakistan, today) Bangladesh: the Radcliffe line through the Punjab, the
// border of Sindh and Rajasthan down to Sir Creek, the Line of Control in
// Kashmir, and the border of Bangladesh. Coordinates are [lat, lon], traced
// by hand from the standard maps (a few kilometres' accuracy is enough at the
// map's scale).

import type { RegionId } from '../engine/state';

/** India–Pakistan, from Sir Creek in the south to the Karakoram in the north. */
export const INDIA_PAKISTAN: [number, number][] = [
  [23.62, 68.15], // Sir Creek
  [23.95, 68.75],
  [24.22, 69.5], // the Rann of Kutch
  [24.28, 70.3],
  [24.6, 71.08],
  [25.05, 70.88],
  [25.7, 70.25], // Munabao
  [26.15, 69.95],
  [26.6, 69.5], // the Jaisalmer bulge
  [27.1, 69.75],
  [27.6, 70.2],
  [27.95, 70.6],
  [28.4, 71.2],
  [28.95, 72.15],
  [29.35, 72.85],
  [29.8, 73.3],
  [30.15, 73.65],
  [30.42, 73.98], // Fazilka
  [30.75, 74.25],
  [31.0, 74.52], // Hussainiwala, on the Sutlej
  [31.3, 74.6],
  [31.6, 74.57], // Wagah, between Lahore and Amritsar
  [31.85, 74.8],
  [32.04, 75.03], // Dera Baba Nanak, on the Ravi
  [32.3, 75.38],
  [32.45, 75.35],
  [32.55, 74.98],
  [32.62, 74.66], // Suchetgarh: the Sialkot–Jammu boundary
  [32.9, 74.45],
  [33.25, 74.05], // the Line of Control
  [33.75, 73.95],
  [34.1, 73.88],
  [34.6, 73.95],
  [34.78, 74.45],
  [34.72, 75.1],
  [34.62, 75.7],
  [34.68, 76.2],
  [35.04, 77.0], // NJ9842
  [35.7, 77.0],
  [37.2, 77.0],
];

/** Bangladesh (East Pakistan in 1947). */
export const BANGLADESH: [number, number][] = [
  [21.6, 89.05],
  [22.3, 88.95],
  [22.95, 88.9],
  [23.25, 88.72],
  [23.65, 88.58],
  [24.15, 88.72],
  [24.3, 88.3],
  [24.85, 88.1],
  [25.2, 88.45],
  [25.55, 88.08],
  [26.0, 88.22],
  [26.45, 88.38],
  [26.6, 88.9],
  [26.3, 89.6],
  [25.95, 89.85],
  [25.28, 89.88],
  [25.22, 90.6],
  [25.18, 91.6],
  [25.1, 92.4],
  [24.55, 92.25],
  [24.1, 91.88],
  [23.7, 91.25],
  [23.25, 91.35],
  [23.0, 91.6],
  [23.45, 91.95],
  [23.6, 92.25],
  [22.8, 92.5],
  [21.9, 92.65],
  [21.0, 92.35],
  [20.6, 92.3],
  [21.4, 91.85],
  [22.0, 91.75],
  [22.55, 90.7],
  [21.75, 90.0],
];

/** The lands that went to Pakistan in 1947 (west, and East Bengal). */
export const TO_PAKISTAN = new Set<RegionId>([
  // West Punjab
  'lahore', 'kasur', 'chunian', 'dipalpur', 'pakpattan', 'multan', 'sialkot', 'gujranwala', 'wazirabad', 'ramnagar', 'sheikhupura',
  'jhang', 'kamalia', 'gujrat', 'bhera', 'rawalpindi', 'dhanni', 'khewra', 'khushab', 'mankera', 'attock', 'bahawalpur',
  // The Frontier and the hills (Azad Kashmir and Gilgit-Baltistan beyond the Line of Control)
  'hazara', 'peshawar', 'jamrud', 'kohat', 'bannu', 'dera_ismail_khan', 'dera_ghazi_khan', 'chitral', 'swat', 'gilgit', 'baltistan', 'mirpur', 'muzaffarabad',
  // Baluchistan and Sindh
  'quetta', 'kalat', 'makran', 'las_bela', 'shikarpur', 'hyderabad_sindh', 'thatta', 'thar',
  // East Bengal
  'dhaka', 'chittagong', 'rangpur',
]);

export const TO_BANGLADESH = new Set<RegionId>(['dhaka', 'chittagong', 'rangpur']);

/** Lands outside British India in 1947, left to their own rulers. */
export const OUTSIDE_RAJ = new Set<RegionId>([
  'kabul', 'jalalabad', 'ghazni', 'kandahar', 'herat', 'farah', 'hazarajat', 'balkh', 'kunduz', 'badakhshan',
  'kathmandu', 'gorkha', 'sikkim', 'ngari', 'changtang', 'tsang', 'lhasa', 'ceylon',
]);

/** Which side of the modern borders a region belongs to. */
export function sideOf(id: RegionId): 'pk' | 'bd' | 'in' | 'free' {
  if (TO_BANGLADESH.has(id)) return 'bd';
  if (TO_PAKISTAN.has(id)) return 'pk';
  if (OUTSIDE_RAJ.has(id)) return 'free';
  return 'in';
}

/** The country west of the India–Pakistan line, closed round through the far west. */
export const WEST_OF_LINE: [number, number][] = [...INDIA_PAKISTAN, [40, 77.0], [40, 50], [18, 50], [18, 68.15]];

export function inPoly(lat: number, lon: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
