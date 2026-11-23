// Lets the AI play the player's faction too (for simulation and for the
// "let the sardars decide" option).
import { runAIFor } from './ai';
import type { GameState } from './state';

export function runAIForPlayer(prev: GameState): GameState {
  const s = structuredClone(prev);
  runAIFor(s, s.playerFaction);
  if (s.phase === 'sarbat') s.phase = 'orders';
  return s;
}
