// World coordinate system for the painted map (see PLAN.md §2).
// An equirectangular projection covering the subcontinent from Herat to
// Bengal and from the Oxus to Ceylon. East–west distances are scaled by
// cos(32°), true at the Punjab, so the heart of the map is not stretched.

export const LON0 = 60.0;
export const LAT0 = 37.6;
export const LON1 = 92.6;
export const LAT1 = 5.6;
export const SCALE = 180; // world units per degree of latitude
export const KX = 0.848; // ≈ cos(32°)
export const WORLD_W = Math.ceil((LON1 - LON0) * KX * SCALE);
export const WORLD_H = Math.ceil((LAT0 - LAT1) * SCALE);

export function project(lat: number, lon: number): [number, number] {
  return [(lon - LON0) * KX * SCALE, (LAT0 - lat) * SCALE];
}

export function unproject(x: number, y: number): [number, number] {
  return [LAT0 - y / SCALE, x / (KX * SCALE) + LON0];
}
