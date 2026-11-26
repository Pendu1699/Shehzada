// Core mutable game state. Everything here is plain JSON so a save is just this object.

import type { Festival } from './calendar';
import type { TraitId } from '../data/leaders';
import type { Court } from './court';

export const SAVE_VERSION = 1;

export type FactionId = string;
export type RegionId = string;

export type Relation = 'war' | 'peace' | 'truce' | 'alliance' | 'vassal' | 'overlord';

export interface UnitStack {
  type: string;
  men: number;
  /** 0..1, grows with battles survived. */
  xp: number;
}

export type Stance = 'dhai_phat' | 'ambush' | 'pitched' | 'siege' | 'hold' | 'night_raid';

export interface Army {
  id: string;
  owner: FactionId;
  region: RegionId;
  units: UnitStack[];
  leader?: string;
  /** Remaining path (excluding current region). */
  path: RegionId[];
  /** Standing stance used when attacked, or the chosen stance for the next attack. */
  stance: Stance;
  morale: number; // 0..100
  supply: number; // 0..100
  /** Plunder and captives carried (Durrani baggage trains). */
  baggage?: { plunder: number; captives: number };
  /** Invading armies that will withdraw home after this turn. */
  withdrawTurn?: number;
  /** For Durrani invasions etc: the region to withdraw to. */
  home?: RegionId;
  /** Josh: righteous fury, turns remaining. */
  josh?: number;
  name?: string;
  /** What to do on taking a town: spare it, levy a nazrana (tribute), or sack it. */
  policy: 'spare' | 'nazrana' | 'sack';
  /** Explicit task at the destination: subjugate a neutral region, or raid. */
  task?: 'capture' | 'raid';
  /** Region the army stood in at the start of the turn (for withdrawals). */
  from?: RegionId;
  /** Entered its current region this turn (it is the attacker there). */
  entered?: boolean;
}

export interface Siege {
  by: FactionId;
  armyId: string;
  progress: number; // 0..100
  turns: number;
}

export interface RegionState {
  id: RegionId;
  owner: FactionId | null;
  /** 0..100: how firmly the owner holds it. */
  control: number;
  fort: number;
  stability: number; // 0..100
  /** Faction receiving rakhi (protection payment) from this region, if not the owner. */
  rakhi: FactionId | null;
  rakhiTurns: number;
  langar: boolean;
  /** 0..1 damage from war, famine, flood. Recovers over time. */
  devastation: number;
  siege?: Siege;
  /** Leader holding this region as a jagir. */
  jagir?: string;
  /** Desecrated sacred site ids. */
  desecrated: string[];
  /** Patronage built here: gurdwara, temple, mosque, sarai, canal, school, bagh. */
  buildings: string[];
  /** Tax set by the owner (player): light, normal or heavy. */
  tax?: 'light' | 'normal' | 'heavy';
  /** Town grown by the owner: 0 village … 4 great city. */
  town?: number;
  /** Turn on which the Company's red ink reached this region (for the seep animation). */
  inkSince?: number;
  /** Raided this turn by (faction), for rakhi obligations. */
  raidedBy?: FactionId;
}

export interface Leader {
  id: string;
  name: string;
  faction: FactionId;
  born: number;
  died: number; // scheduled year of death (historical or generated)
  alive: boolean;
  traits: TraitId[];
  martial: number;
  admin: number;
  diplomacy: number;
  loyalty: number;
  female?: boolean;
  historical: boolean;
  armyId?: string;
  /** Battles won, for the Vaar. */
  victories: number;
  /** Turn they joined or became active. */
  active: boolean;
  jagir?: RegionId;
}

export interface FactionState {
  id: FactionId;
  alive: boolean;
  treasury: number;
  piri: number; // 0..100
  legend: number;
  /** Last computed Miri (0..100), cached for display/AI. */
  miri: number;
  chief?: string;
  relations: Record<FactionId, Relation>;
  /** -100..100 */
  attitude: Record<FactionId, number>;
  /** The unified Sarkar-i-Khalsa. */
  sarkar: boolean;
  flags: Record<string, number | boolean | string>;
  /** Company foothold points, per faction that signed treaties with the Company. */
  foothold: number;
  /** For the player: whether the Sarbat Khalsa is still convened after unification. */
  convenesSarbat: boolean;
  /** Turns of brittleness accumulated (Miri far ahead of Piri). */
  brittle: number;
  /** Accumulated revenue last turn (for UI). */
  lastIncome: number;
}

export interface Gurmata {
  id: string;
  kind: string;
  title: string;
  proposer: FactionId;
  target?: string;
  /** Turn index until which it binds. */
  until: number;
  votesFor: FactionId[];
  votesAgainst: FactionId[];
  passed?: boolean;
}

export interface BattleRound {
  aLoss: number;
  dLoss: number;
  aMorale: number;
  dMorale: number;
  line: string;
}

export interface BattleReport {
  id: string;
  turn: number;
  region: RegionId;
  attacker: FactionId;
  defender: FactionId;
  attackerLeader?: string;
  defenderLeader?: string;
  stance: Stance;
  defStance: Stance;
  aMen: number;
  dMen: number;
  rounds: BattleRound[];
  winner: 'attacker' | 'defender' | 'none';
  aLosses: number;
  dLosses: number;
  notes: string[];
  /** Breakdown of modifiers, for the tooltip. */
  modifiers: { label: string; value: string }[];
  betrayal?: string;
  captivesFreed?: number;
}

export interface ChronicleEntry {
  turn: number;
  year: number;
  festival: Festival;
  kind:
    | 'battle'
    | 'conquest'
    | 'loss'
    | 'spared'
    | 'sacked'
    | 'rakhi_kept'
    | 'rakhi_broken'
    | 'langar'
    | 'gurmata'
    | 'death'
    | 'event'
    | 'desecration'
    | 'rebuilding'
    | 'betrayal'
    | 'treaty'
    | 'captives'
    | 'koh_i_noor'
    | 'sarkar'
    | 'succession'
    | 'josh'
    | 'vow';
  text: string;
  faction?: FactionId;
  region?: RegionId;
  leader?: string;
  weight: number;
}

export interface PendingEvent {
  id: string;
  eventId: string;
  /** Data the event template needs (region, faction, leader…). */
  ctx: Record<string, string | number>;
}

export interface Josh {
  active: boolean;
  turnsLeft: number;
  desecratedBy?: FactionId;
  vengeanceLeader?: string;
  vow?: { deadline: number; taken: number };
  /** Amritsar rebuilding project. */
  rebuild?: { progress: number; needed: number; contributors: Record<FactionId, number> };
}

export interface TurnSummary {
  turn: number;
  dhadi: string[];
  income: { label: string; value: number }[];
  notes: string[];
  piri: { delta: number; reason: string }[];
  /** Set on the turn a new age begins. */
  era?: import('./eras').EraPage;
}

export interface GameState {
  version: number;
  seed: number;
  rng: number;
  scenarioId: string;
  startYear: number;
  startFestival: Festival;
  turn: number;
  playerFaction: FactionId;
  phase: 'sarbat' | 'orders' | 'ended';
  regions: Record<RegionId, RegionState>;
  factions: Record<FactionId, FactionState>;
  armies: Record<string, Army>;
  leaders: Record<string, Leader>;
  /** Player's fog of war: 0 = pencil underdrawing, 1 = seen (colour wash), 2 = visited. */
  explored: Record<RegionId, 0 | 1 | 2>;
  gurmatas: Gurmata[];
  josh: Josh;
  chronicle: ChronicleEntry[];
  battles: BattleReport[];
  /** Alliance unions (engine/unions.ts). */
  unions?: import('./unions').Union[];
  /** World-level flags (e.g. gurdwaras_freed). */
  flags?: Record<string, number | boolean | string>;
  /** Who keeps the Akal Takht. */
  jathedar?: import('./panth').Jathedar;
  /** 'struggle' for The Long Struggle (1849–1947). */
  mode?: 'century' | 'struggle';
  struggle?: import('./struggle').StruggleState;
  /** On-screen alerts for the player (wars declared, revolts...). */
  alerts?: import('./vassals').Alert[];
  /** The Khabar: news of the subcontinent (engine/khabar.ts). */
  khabar?: import('./khabar').KhabarItem[];
  /** Battles from the most recent resolution, for the vignette. */
  lastBattles: string[];
  pendingEvents: PendingEvent[];
  firedEvents: Record<string, number>;
  summary: TurnSummary | null;
  /** Piri changes for the player during the current turn, shown in the summary. */
  piriNotes: { delta: number; reason: string }[];
  nextId: number;
  /** Set when the game ends. */
  /** The player chose to ride on past 1849: the world runs on with no history script. */
  beyond?: boolean;
  ending?: { kind: 'sovereign' | 'protected' | 'annexation' | 'ghallughara' | 'raj_restored' | 'khalsa_voice' | 'gurdwaras_freed' | 'partition'; turn: number };
  settings: { difficulty: 'gentle' | 'standard' | 'hard' };
  /** The player's darbar, once they rule as the Sarkar-i-Khalsa. */
  court?: Court;
}

export function newId(s: GameState, prefix: string): string {
  s.nextId += 1;
  return `${prefix}${s.nextId}`;
}
