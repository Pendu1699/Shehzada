// Endings. The game ends in March 1849 or when the player's polity is destroyed.
//   sovereign   — the Khalsa Raj survives: strong in Miri and Piri, the Company held off
//   protected   — survive as a princely state under the Company (the Phulkian path)
//   annexation  — the historical ending
//   ghallughara — your misl destroyed

import { chronicle } from './chronicle';
import { regionsOf } from './query';
import type { GameState } from './state';

export function endingFor(s: GameState): NonNullable<GameState['ending']>['kind'] {
  const p = s.factions[s.playerFaction];
  if (!p.alive) return 'ghallughara';
  const lands = regionsOf(s, s.playerFaction).length;
  if (p.flags.annexed || lands === 0) return 'annexation';
  if (p.flags.company_protection || p.flags.loyal_to_resident) return 'protected';
  if (p.flags.treaty_lahore && !p.flags.second_war_won) return 'annexation';
  const company = s.factions.company;
  const companyStrong = company?.alive && company.miri > p.miri * 1.6;
  if (p.miri >= 45 && p.piri >= 45 && !companyStrong) return 'sovereign';
  if (p.miri >= 30 && p.piri >= 55 && !companyStrong) return 'sovereign';
  return 'annexation';
}

export function checkEnding(s: GameState, finalTurnPassed: boolean): void {
  if (s.phase === 'ended') return;
  const p = s.factions[s.playerFaction];
  if (!p.alive) {
    s.phase = 'ended';
    s.ending = { kind: 'ghallughara', turn: s.turn };
    chronicle(s, 'loss', 'And so the banner fell. But the Panth endures.', { faction: s.playerFaction, weight: 10 });
    return;
  }
  if (finalTurnPassed || p.flags.annexed) {
    s.phase = 'ended';
    s.ending = { kind: endingFor(s), turn: s.turn };
    if (s.ending.kind === 'annexation' && p.flags.koh_i_noor) p.flags.koh_i_noor = 'taken';
  }
}
