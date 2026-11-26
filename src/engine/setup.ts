import { jathedarTurn, raiseDalKhalsa } from './panth';
import { eraTransition } from './eras';
import { outerOwnersAt, seedHistory } from './history';
// Building a new game from a scenario.

import { FACTIONS } from '../data/factions';
import { LEADERS } from '../data/leaders';
import { REGIONS } from '../data/regions';
import { SCENARIO_BY_ID } from '../data/scenarios';
import { seedFromString } from './rng';
import { SAVE_VERSION, type FactionState, type GameState, type Leader, type RegionState } from './state';
import { refreshExploration } from './explore';
import { updateMiri } from './miripiri';
import { newCourt } from './court';
import { generateSummaryOpening } from '../narrative/dhadi';

export interface NewGameOptions {
  scenarioId: string;
  playerFaction: string;
  seed?: number | string;
  difficulty?: 'gentle' | 'standard' | 'hard';
}

export function newGame(opts: NewGameOptions): GameState {
  const sc = SCENARIO_BY_ID[opts.scenarioId];
  if (!sc) throw new Error(`unknown scenario ${opts.scenarioId}`);
  const seed = typeof opts.seed === 'number' ? opts.seed >>> 0 : seedFromString(String(opts.seed ?? `${sc.id}-${opts.playerFaction}`));
  const year = sc.year;

  const regions: Record<string, RegionState> = {};
  const outer = outerOwnersAt(sc.year);
  for (const r of REGIONS) {
    const owner = sc.owners[r.id] ?? outer[r.id] ?? null;
    regions[r.id] = {
      id: r.id,
      owner,
      control: owner ? (sc.year === 1748 && FACTIONS.find((f) => f.id === owner)?.kind === 'misl' ? 55 : 75) : 50,
      fort: r.fort,
      stability: 60,
      rakhi: sc.rakhi?.[r.id] ?? null,
      rakhiTurns: 0,
      langar: false,
      devastation: 0,
      desecrated: [],
      buildings: [],
    };
  }

  const absent = new Set(sc.absent ?? []);
  const factions: Record<string, FactionState> = {};
  for (const f of FACTIONS) {
    const alive = !absent.has(f.id);
    factions[f.id] = {
      id: f.id,
      alive,
      treasury: sc.treasury[f.id] ?? sc.treasury.default ?? 50,
      piri: sc.piri[f.id] ?? sc.piri.default ?? 45,
      legend: 0,
      miri: 0,
      relations: {},
      attitude: {},
      sarkar: sc.sarkar === f.id,
      flags: { ...(sc.flags?.[f.id] ?? {}) },
      foothold: 0,
      convenesSarbat: true,
      brittle: 0,
      lastIncome: 0,
    };
  }
  // Relations: peace by default; scenario wars and alliances; misls start with warm attitudes to each other.
  for (const a of FACTIONS)
    for (const b of FACTIONS) {
      if (a.id === b.id) continue;
      factions[a.id].relations[b.id] = 'peace';
      factions[a.id].attitude[b.id] = a.sikh && b.sikh ? 25 : 0;
    }
  const setRel = (a: string, b: string, rel: 'war' | 'alliance') => {
    factions[a].relations[b] = rel;
    factions[b].relations[a] = rel;
    factions[a].attitude[b] = rel === 'war' ? -60 : 50;
    factions[b].attitude[a] = rel === 'war' ? -60 : 50;
  };
  for (const [a, b] of sc.wars) setRel(a, b, 'war');
  for (const [a, b] of sc.alliances ?? []) setRel(a, b, 'alliance');

  // Leaders alive at the start year.
  const leaders: Record<string, Leader> = {};
  for (const l of LEADERS) {
    const from = l.from ?? l.born + 16;
    if (l.died <= year) continue;
    // Sarkar-era figures join only via events unless the scenario is the Sarkar era.
    const active = from <= year && (!l.joins || !!sc.sarkar);
    leaders[l.id] = {
      id: l.id,
      name: l.name,
      faction: l.joins && sc.sarkar ? sc.sarkar : l.faction,
      born: l.born,
      died: l.died,
      alive: true,
      traits: [...l.traits],
      martial: l.martial,
      admin: l.admin,
      diplomacy: l.diplomacy,
      loyalty: l.loyalty,
      female: l.female,
      historical: true,
      victories: 0,
      active,
    };
  }

  const s: GameState = {
    version: SAVE_VERSION,
    seed,
    rng: seed,
    scenarioId: sc.id,
    startYear: sc.year,
    startFestival: sc.festival,
    turn: 0,
    playerFaction: opts.playerFaction,
    phase: 'orders',
    regions,
    factions,
    armies: {},
    leaders,
    explored: {},
    gurmatas: [],
    josh: { active: false, turnsLeft: 0 },
    chronicle: [],
    battles: [],
    khabar: [],
    lastBattles: [],
    pendingEvents: [],
    firedEvents: {},
    summary: null,
    piriNotes: [],
    nextId: 0,
    settings: { difficulty: opts.difficulty ?? 'standard' },
  };

  for (const a of sc.armies) {
    if (!factions[a.owner]?.alive) continue;
    s.nextId += 1;
    const id = `A${s.nextId}`;
    const leader = a.leader && leaders[a.leader]?.active ? a.leader : undefined;
    s.armies[id] = {
      id,
      owner: a.owner,
      region: a.region,
      units: a.units.map(([type, men]) => ({ type, men, xp: 0.2 })),
      leader,
      path: [],
      stance: 'pitched',
      morale: 80,
      supply: 100,
      name: a.name,
      policy: 'spare',
    };
    if (leader) leaders[leader].armyId = id;
  }
  // Chiefs.
  for (const f of FACTIONS) {
    const chief = LEADERS.find((l) => l.faction === f.id && l.chief && leaders[l.id]?.active) ?? LEADERS.find((l) => leaders[l.id]?.active && leaders[l.id].faction === f.id);
    if (chief) factions[f.id].chief = chief.id;
  }
  if (sc.sarkar) {
    const ruler = sc.year >= 1839 ? 'kharak_singh' : 'ranjit_singh';
    if (leaders[ruler]) factions[sc.sarkar].chief = ruler;
  }

  // Factions with no land and no army at start are not on the map.
  for (const f of FACTIONS) {
    const hasLand = Object.values(regions).some((r) => r.owner === f.id);
    const hasArmy = Object.values(s.armies).some((a) => a.owner === f.id);
    if (!hasLand && !hasArmy) factions[f.id].alive = false;
  }
  if (!factions[opts.playerFaction]?.alive) throw new Error(`${opts.playerFaction} is not present in ${sc.id}`);

  if (sc.sarkar === opts.playerFaction) {
    s.court = newCourt(s, opts.playerFaction);
    if (sc.year >= 1839) s.court.crisis = true;
  }
  for (const f of Object.keys(factions)) updateMiri(s, f);
  seedHistory(s);
  raiseDalKhalsa(s);
  jathedarTurn(s);
  eraTransition(s);
  refreshExploration(s);
  s.summary = { turn: 0, dhadi: generateSummaryOpening(s), income: [], notes: [], piri: [] };
  return s;
}
