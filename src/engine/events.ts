// Event engine (expanded in Milestone 6).
import type { GameState } from './state';

export function runEvents(_s: GameState): { notes: string[]; dhadi: string[] } {
  return { notes: [], dhadi: [] };
}

export function resolveEventChoice(_s: GameState, _pendingId: string, _choice: number): string | null {
  return null;
}
