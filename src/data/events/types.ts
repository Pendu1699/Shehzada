import type { Festival } from '../../engine/calendar';
import type { GameState } from '../../engine/state';

export type Ctx = Record<string, string | number>;

export interface EventChoice {
  label: string | ((s: GameState, ctx: Ctx) => string);
  detail?: string | ((s: GameState, ctx: Ctx) => string);
  available?: (s: GameState, ctx: Ctx) => boolean;
  /** Apply the choice; return a short result line for the reports. */
  effect: (s: GameState, ctx: Ctx) => string | void;
}

export interface EventDef {
  id: string;
  title: string;
  gurmukhi?: string;
  kind: 'historical' | 'generic';
  from?: { year: number; festival?: Festival };
  to?: { year: number; festival?: Festival };
  season?: Festival;
  once?: boolean;
  cooldown?: number;
  /** Per-turn probability once eligible (generic events default to 5%). */
  chance?: number;
  /** How worthy of the Vaar (chronicle weight). */
  weight?: number;
  mood?: 'solemn' | 'heroic' | 'festive' | 'neutral' | 'ominous';
  ctx?: (s: GameState) => Ctx | null;
  when?: (s: GameState, ctx: Ctx) => boolean;
  /** Dhadi narration. */
  text: (s: GameState, ctx: Ctx) => string;
  /** Automatic effect (applies before any choice). */
  effect?: (s: GameState, ctx: Ctx) => string | void;
  choices?: EventChoice[];
  /** Which choice the current of history takes if the player is not involved. */
  aiChoice?: number;
  /** If set, the choices go to the player only when this is true; otherwise aiChoice applies. */
  playerOnly?: (s: GameState, ctx: Ctx) => boolean;
  chronicle?: boolean;
  chronicleText?: (s: GameState, ctx: Ctx) => string;
}
