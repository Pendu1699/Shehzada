// Deterministic seeded RNG (mulberry32). The generator's whole state is one uint32
// stored inside GameState, so a saved game resumes the exact same random stream.

export interface RngHolder {
  rng: number;
}

/** Advance the generator stored in `h` and return a float in [0, 1). */
export function rand(h: RngHolder): number {
  let t = (h.rng = (h.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randInt(h: RngHolder, lo: number, hi: number): number {
  return lo + Math.floor(rand(h) * (hi - lo + 1));
}

export function randRange(h: RngHolder, lo: number, hi: number): number {
  return lo + rand(h) * (hi - lo);
}

export function chance(h: RngHolder, p: number): boolean {
  return rand(h) < p;
}

export function pick<T>(h: RngHolder, arr: readonly T[]): T {
  return arr[Math.floor(rand(h) * arr.length)];
}

export function weightedPick<T>(h: RngHolder, items: readonly T[], weight: (t: T) => number): T | undefined {
  const total = items.reduce((s, t) => s + Math.max(0, weight(t)), 0);
  if (total <= 0) return undefined;
  let r = rand(h) * total;
  for (const t of items) {
    r -= Math.max(0, weight(t));
    if (r < 0) return t;
  }
  return items[items.length - 1];
}

export function shuffle<T>(h: RngHolder, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand(h) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Hash a string seed (e.g. "khalsa-1748") to a uint32. */
export function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
