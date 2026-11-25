// Movement over the region graph: terrain, rivers, fords and the monsoon.
//
// Historically motivated rules:
//  * The monsoon (the Vaisakhi→Diwali half-year) swells all six rivers. Fords drown,
//    only ferries work, and crossing elsewhere risks men and baggage.
//  * Cavalry is hampered by monsoon mud; winter is the campaigning season.
//  * Hills and mountains slow everyone except leaders who know them.

import { FACTION_BY_ID } from '../data/factions';
import { REGION_BY_ID } from '../data/regions';
import type { Terrain } from '../data/types';
import { neighbors, type Edge } from './map';
import { armySpeed, atWar, date, friendly, hasTrait, isCavalryArmy, isSikh } from './query';
import type { Army, FactionId, GameState, RegionId } from './state';

const TERRAIN_COST: Record<Terrain, number> = {
  plains: 1,
  bela: 1.2,
  jungle: 1.4,
  hills: 1.5,
  bar: 1.2,
  desert: 1.6,
  mountain: 2,
};

export interface StepCost {
  cost: number;
  parts: { label: string; value: number }[];
  /** Risky crossing: fraction of men that may be lost. */
  risk: number;
}

export function stepCost(s: GameState, army: Army, edge: Edge): StepCost {
  const def = REGION_BY_ID[edge.to];
  const d = date(s);
  const parts: { label: string; value: number }[] = [];
  let t = TERRAIN_COST[def.terrain];
  if ((def.terrain === 'hills' || def.terrain === 'mountain') && hasTrait(s, army.leader, 'mountain_warrior')) t = 1;
  if (def.terrain === 'bar' && army.owner === 'nakai' && isCavalryArmy(army)) t = 1;
  parts.push({ label: `Terrain: ${def.terrain}`, value: t });
  if (s.regions[edge.to]?.buildings.includes('road')) {
    parts.push({ label: 'A metalled road', value: -0.3 });
    t = Math.max(0.6, t - 0.3);
  }
  // The regions beyond the Punjab are wide: a march across Rajputana or the
  // Deccan takes longer than across a doab of the Punjab.
  const span = Math.min(4, edge.dist / 85);
  if (span > 1.15) {
    const extra = Math.round(t * (span - 1) * 100) / 100;
    parts.push({ label: `A long road to ${def.name}`, value: extra });
    t += extra;
  }
  let risk = 0;
  if (edge.river) {
    let c: number;
    if (d.monsoon) {
      if (edge.fordKind === 'ferry') c = 1.2;
      else if (edge.fordKind === 'bridge') c = 0.4;
      else {
        c = 3;
        risk = edge.fordKind === 'ford' ? 0.05 : 0.08;
      }
      parts.push({ label: `Crossing the ${edge.river} in flood${edge.ford ? ` at ${edge.ford.replace(/_/g, ' ')}` : ''}`, value: c });
    } else {
      c = edge.fordKind === 'ford' ? 0.4 : edge.fordKind === 'ferry' ? 0.7 : edge.fordKind === 'bridge' ? 0.2 : 1.2;
      parts.push({ label: `Crossing the ${edge.river}${edge.ford ? ' by ford' : ''}`, value: c });
    }
    t += c;
  }
  return { cost: Math.round(t * 100) / 100, parts, risk };
}

export function movementPoints(s: GameState, army: Army): { total: number; parts: { label: string; value: number }[] } {
  const parts: { label: string; value: number }[] = [];
  const base = armySpeed(army);
  parts.push({ label: 'Pace of the slowest troops', value: base });
  if (date(s).monsoon && isCavalryArmy(army)) parts.push({ label: 'Monsoon mud hampers the horse', value: -1 });
  if (army.josh && army.josh > 0) parts.push({ label: 'Josh: riding for Amritsar', value: 1 });
  if (army.supply < 30) parts.push({ label: 'Hungry and short of fodder', value: -0.5 });
  const total = Math.max(1, parts.reduce((t, p) => t + p.value, 0));
  return { total, parts };
}

/** Can this faction's army enter the region at all (without declaring war)? */
export function canEnter(s: GameState, f: FactionId, region: RegionId): boolean {
  const owner = s.regions[region].owner;
  if (!owner || owner === f) return true;
  if (friendly(s, f, owner)) return true;
  if (atWar(s, f, owner)) return true;
  // The misls of the Dal Khalsa ride freely through one another's lands while at peace.
  if (isSikh(f) && isSikh(owner) && s.factions[f]?.relations[owner] !== 'war') return true;
  // Safe passage through regions of a faction at peace.
  if (s.factions[f]?.flags[`passage_${owner}`]) return true;
  return false;
}

/** Cheapest path (excluding the start) from the army's region to `to`, or null. */
export function findPath(s: GameState, army: Army, to: RegionId, opts: { ignorePeace?: boolean } = {}): RegionId[] | null {
  if (to === army.region) return [];
  const dist = new Map<string, number>([[army.region, 0]]);
  const prev = new Map<string, string>();
  const open = new Set([army.region]);
  while (open.size) {
    let cur = '';
    let best = Infinity;
    for (const r of open) {
      const d = dist.get(r)!;
      if (d < best) ((best = d), (cur = r));
    }
    open.delete(cur);
    if (cur === to) break;
    for (const e of neighbors(cur)) {
      if (!opts.ignorePeace && e.to !== to && !canEnter(s, army.owner, e.to)) continue;
      if (!opts.ignorePeace && e.to === to && !canEnter(s, army.owner, e.to)) continue;
      const nd = best + stepCost(s, army, e).cost;
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, cur);
        open.add(e.to);
      }
    }
  }
  if (!prev.has(to)) return null;
  const path: string[] = [];
  for (let r: string | undefined = to; r && r !== army.region; r = prev.get(r)) path.unshift(r);
  return path;
}

/** How many turns a path will take, for the UI. */
export function pathTurns(s: GameState, army: Army, path: RegionId[]): number {
  const mp = movementPoints(s, army).total;
  let turns = 1;
  let left = mp;
  let at = army.region;
  let movedThisTurn = false;
  for (const r of path) {
    const e = neighbors(at).find((x) => x.to === r);
    if (!e) break;
    const c = stepCost(s, army, e).cost;
    if (c > left && movedThisTurn) {
      turns++;
      left = mp;
      movedThisTurn = false;
    }
    left -= c;
    movedThisTurn = true;
    at = r;
  }
  return turns;
}

export function isRaider(f: FactionId): boolean {
  return f === 'durrani' || f === 'maratha';
}

export function factionHome(f: FactionId): RegionId | undefined {
  return f === 'durrani' ? 'peshawar' : f === 'maratha' ? 'delhi' : undefined;
}

export function mislName(f: FactionId): string {
  return FACTION_BY_ID[f]?.name ?? f;
}
