// World coordinate system for the Painted Punjab (see PLAN.md §2).
// An equirectangular projection centred on the Punjab, with east–west distances
// scaled by cos(32°) so the map is not stretched sideways.

export const LON0 = 69.6;
export const LAT0 = 35.0;
export const SCALE = 180; // world units per degree of latitude
export const KX = 0.848; // ≈ cos(32°)
export const WORLD_W = Math.ceil((78.0 - LON0) * KX * SCALE); // 1283
export const WORLD_H = Math.ceil((LAT0 - 28.4) * SCALE); // 1188

export function project(lat: number, lon: number): [number, number] {
  return [(lon - LON0) * KX * SCALE, (LAT0 - lat) * SCALE];
}

export function unproject(x: number, y: number): [number, number] {
  return [LAT0 - y / SCALE, x / (KX * SCALE) + LON0];
}
