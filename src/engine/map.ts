// The region graph, built once from the generated geometry.

import geometry from '../data/generated/mapGeometry.json';
import { REGIONS, REGION_BY_ID } from '../data/regions';
import { FORDS, RIVERS } from '../data/rivers';

export interface Edge {
  to: string;
  river?: string;
  ford?: string;
  fordKind?: 'ford' | 'ferry' | 'bridge';
  /** Straight-line distance between seats in world units. */
  dist: number;
}

export interface Geometry {
  meta: { width: number; height: number; cell: number };
  regions: Record<string, { poly: number[]; seat: [number, number]; anchor: [number, number]; cells: number }>;
  adjacency: { a: string; b: string; border: number; river?: string; ford?: string; mid: [number, number] }[];
  rivers: { id: string; points: number[] }[];
  fords: { id: string; pos: number[] }[];
  towns: { region: string; name: string; pos: number[] }[];
}

export const GEO = geometry as unknown as Geometry;

const FORD_BY_ID = Object.fromEntries(FORDS.map((f) => [f.id, f]));
export const RIVER_BY_ID = Object.fromEntries(RIVERS.map((r) => [r.id, r]));

export const GRAPH: Record<string, Edge[]> = Object.fromEntries(REGIONS.map((r) => [r.id, [] as Edge[]]));
for (const a of GEO.adjacency) {
  const sa = GEO.regions[a.a].seat;
  const sb = GEO.regions[a.b].seat;
  const dist = Math.hypot(sa[0] - sb[0], sa[1] - sb[1]);
  const fk = a.ford ? FORD_BY_ID[a.ford]?.kind : undefined;
  GRAPH[a.a].push({ to: a.b, river: a.river, ford: a.ford, fordKind: fk, dist });
  GRAPH[a.b].push({ to: a.a, river: a.river, ford: a.ford, fordKind: fk, dist });
}

export function neighbors(id: string): Edge[] {
  return GRAPH[id] ?? [];
}

export function edgeBetween(a: string, b: string): Edge | undefined {
  return GRAPH[a]?.find((e) => e.to === b);
}

export function isAdjacent(a: string, b: string): boolean {
  return !!edgeBetween(a, b);
}

export function regionDef(id: string) {
  return REGION_BY_ID[id];
}

/** Regions within `hops` steps. */
export function within(id: string, hops: number): Set<string> {
  const seen = new Set([id]);
  let frontier = [id];
  for (let h = 0; h < hops; h++) {
    const next: string[] = [];
    for (const r of frontier) for (const e of neighbors(r)) if (!seen.has(e.to)) (seen.add(e.to), next.push(e.to));
    frontier = next;
  }
  return seen;
}
