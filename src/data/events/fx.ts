// Small helpers used by event definitions.
import { addRecruits } from '../../engine/ai';
import { transferRegion } from '../../engine/conquest';
import { killLeader, generateLeader } from '../../engine/leaders';
import { changePiri } from '../../engine/miripiri';
import { armiesOf, armyMen, clamp, isSikh, regionsOf } from '../../engine/query';
import { pick } from '../../engine/rng';
import type { Army, FactionId, GameState, RegionId, Relation } from '../../engine/state';
import { newId } from '../../engine/state';

export const P = (s: GameState) => s.playerFaction;

export const fx = {
  money(s: GameState, f: FactionId, n: number) {
    if (s.factions[f]) s.factions[f].treasury += n;
  },
  piri: changePiri,
  legend(s: GameState, f: FactionId, n: number) {
    if (s.factions[f]) s.factions[f].legend += n;
  },
  stability(s: GameState, r: RegionId, n: number) {
    s.regions[r].stability = clamp(s.regions[r].stability + n, 0, 100);
  },
  control(s: GameState, r: RegionId, n: number) {
    s.regions[r].control = clamp(s.regions[r].control + n, 0, 100);
  },
  devastate(s: GameState, r: RegionId, n: number) {
    s.regions[r].devastation = clamp(s.regions[r].devastation + n, 0, 1);
  },
  loyalty(s: GameState, id: string | undefined, n: number) {
    if (id && s.leaders[id]) s.leaders[id].loyalty = clamp(s.leaders[id].loyalty + n, 0, 100);
  },
  recruit(s: GameState, f: FactionId, r: RegionId, type: string, men: number) {
    return addRecruits(s, f, r, type, men);
  },
  relation(s: GameState, a: FactionId, b: FactionId, rel: Relation) {
    if (!s.factions[a] || !s.factions[b]) return;
    s.factions[a].relations[b] = rel;
    s.factions[b].relations[a] = rel;
  },
  attitude(s: GameState, a: FactionId, b: FactionId, n: number) {
    if (!s.factions[a]) return;
    s.factions[a].attitude[b] = clamp((s.factions[a].attitude[b] ?? 0) + n, -100, 100);
  },
  give: transferRegion,
  kill: killLeader,
  newLeader: generateLeader,
  /** Lose a fraction of men across all armies of a faction (optionally only in some regions). */
  losses(s: GameState, f: FactionId, frac: number, regions?: Set<RegionId>) {
    let lost = 0;
    for (const a of armiesOf(s, f)) {
      if (regions && !regions.has(a.region)) continue;
      for (const u of a.units) {
        const l = Math.round(u.men * frac);
        u.men -= l;
        lost += l;
      }
      a.units = a.units.filter((u) => u.men > 0);
      if (!a.units.length) delete s.armies[a.id];
    }
    return lost;
  },
  spawn(s: GameState, owner: FactionId, region: RegionId, units: [string, number][], opts: Partial<Army> = {}): Army {
    const id = newId(s, 'A');
    const a: Army = { id, owner, region, units: units.map(([type, men]) => ({ type, men, xp: 0.3 })), path: [], stance: 'pitched', morale: 85, supply: 100, policy: owner === 'durrani' ? 'sack' : 'nazrana', ...opts };
    s.armies[id] = a;
    if (s.factions[owner]) s.factions[owner].alive = true;
    if (a.leader && s.leaders[a.leader]) {
      s.leaders[a.leader].armyId = id;
      s.leaders[a.leader].active = true;
      s.leaders[a.leader].faction = owner;
    }
    return a;
  },
  flag(s: GameState, f: FactionId, k: string, v: number | boolean | string = true) {
    if (s.factions[f]) s.factions[f].flags[k] = v;
  },
};

export const owns = (s: GameState, f: FactionId, r: RegionId) => s.regions[r]?.owner === f;
export const alive = (s: GameState, f: FactionId) => !!s.factions[f]?.alive;
export const leaderAlive = (s: GameState, id: string) => !!s.leaders[id]?.alive;
export const sikhOwner = (s: GameState, r: RegionId) => isSikh(s.regions[r].owner);
export const regionCount = (s: GameState, f: FactionId) => regionsOf(s, f).length;
export const strength = (s: GameState, f: FactionId) => armiesOf(s, f).reduce((t, a) => t + armyMen(a), 0);
export const randomOwned = (s: GameState, f: FactionId, filter: (r: RegionId) => boolean = () => true): RegionId | null => {
  const list = regionsOf(s, f).filter(filter);
  return list.length ? pick(s, list) : null;
};
export const randomLeader = (s: GameState, f: FactionId, filter: (id: string) => boolean = () => true): string | null => {
  const list = Object.values(s.leaders)
    .filter((l) => l.alive && l.active && l.faction === f && filter(l.id))
    .map((l) => l.id);
  return list.length ? pick(s, list) : null;
};
export const sikhFactions = (s: GameState) => Object.values(s.factions).filter((f) => f.alive && isSikh(f.id)).map((f) => f.id);
export const strongestSikh = (s: GameState): FactionId | null => {
  let best: FactionId | null = null;
  let bm = -1;
  for (const f of sikhFactions(s)) {
    const m = s.factions[f].miri + (s.factions[f].sarkar ? 1000 : 0);
    if (m > bm) ((bm = m), (best = f));
  }
  return best;
};
