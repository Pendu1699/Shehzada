// The chronicle: a structured record of the player's century. The Vaar at the end
// of the game is generated from it, so entries carry a weight (how worthy of song).

import { date } from './query';
import type { ChronicleEntry, GameState } from './state';

export function chronicle(
  s: GameState,
  kind: ChronicleEntry['kind'],
  text: string,
  opts: { faction?: string; region?: string; leader?: string; weight?: number } = {},
): void {
  const d = date(s);
  s.chronicle.push({ turn: s.turn, year: d.year, festival: d.festival, kind, text, faction: opts.faction, region: opts.region, leader: opts.leader, weight: opts.weight ?? 1 });
  if (s.chronicle.length > 1500) {
    // Keep the most song-worthy entries if the chronicle grows very long.
    s.chronicle.sort((a, b) => b.weight - a.weight || a.turn - b.turn);
    s.chronicle = s.chronicle.slice(0, 1200).sort((a, b) => a.turn - b.turn);
  }
}

export function playerChronicle(s: GameState): ChronicleEntry[] {
  return s.chronicle.filter((c) => !c.faction || c.faction === s.playerFaction || c.weight >= 6);
}
