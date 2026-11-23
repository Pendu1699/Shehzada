// Endings (expanded in Milestone 7).
import { chronicle } from './chronicle';
import type { GameState } from './state';

export function checkEnding(s: GameState, finalTurnPassed: boolean): void {
  if (s.phase === 'ended') return;
  const p = s.factions[s.playerFaction];
  if (!p.alive) {
    s.phase = 'ended';
    s.ending = { kind: 'ghallughara', turn: s.turn };
    chronicle(s, 'loss', 'And so the misl was scattered, and its banner fell. But the Panth endures.', { faction: s.playerFaction, weight: 10 });
    return;
  }
  if (finalTurnPassed) {
    s.phase = 'ended';
    const company = s.factions.company;
    const sovereign = p.miri >= 55 && p.piri >= 55 && (!company?.alive || p.miri >= company.miri * 0.8);
    s.ending = { kind: sovereign ? 'sovereign' : p.flags.company_protection ? 'protected' : 'annexation', turn: s.turn };
  }
}
