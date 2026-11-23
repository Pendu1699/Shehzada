/**
 * Headless AI-vs-AI runner for balancing.
 *   npm run simulate -- --games 20 --scenario s1748 --turns 60
 * The "player" faction is driven by the same AI as everyone else.
 */
import { newGame } from '../src/engine/setup';
import { endTurn } from '../src/engine/turn';
import { runAIForPlayer } from '../src/engine/autoplay';
import { regionsOf, year } from '../src/engine/query';
import { SCENARIO_BY_ID } from '../src/data/scenarios';

const args = process.argv.slice(2);
const arg = (k: string, d: string) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const games = Number(arg('games', '10'));
const scenario = arg('scenario', 's1748');
const maxTurns = Number(arg('turns', '400'));
const player = arg('player', SCENARIO_BY_ID[scenario].recommended);

const results: { territory: Record<string, number>; unifier?: string; annexedYear?: number; ending?: string; years: number; playerAlive: boolean; piri: number; miri: number }[] = [];
const t0 = Date.now();
for (let g = 0; g < games; g++) {
  let s = newGame({ scenarioId: scenario, playerFaction: player, seed: 1000 + g });
  let turns = 0;
  while (s.phase !== 'ended' && turns < maxTurns) {
    s = runAIForPlayer(s);
    s = endTurn(s);
    turns++;
  }
  const territory: Record<string, number> = {};
  for (const f of Object.keys(s.factions)) {
    const n = regionsOf(s, f).length;
    if (n) territory[f] = n;
  }
  const unifier = Object.values(s.factions).find((f) => f.sarkar)?.id;
  results.push({ territory, unifier, ending: s.ending?.kind, years: year(s), playerAlive: s.factions[player].alive, piri: Math.round(s.factions[player].piri), miri: s.factions[player].miri });
}
const avg: Record<string, number> = {};
for (const r of results) for (const [f, n] of Object.entries(r.territory)) avg[f] = (avg[f] ?? 0) + n / results.length;
console.log(`Scenario ${scenario}, player ${player}, ${games} games, ${(Date.now() - t0) / 1000}s`);
console.log('Average territory:');
for (const [f, n] of Object.entries(avg).sort((a, b) => b[1] - a[1])) console.log(`  ${f.padEnd(16)} ${n.toFixed(1)}`);
const endings: Record<string, number> = {};
for (const r of results) endings[r.ending ?? 'unfinished'] = (endings[r.ending ?? 'unfinished'] ?? 0) + 1;
console.log('Endings:', endings);
console.log('Unifiers:', results.map((r) => r.unifier ?? '-').join(', '));
console.log('Player alive:', results.filter((r) => r.playerAlive).length, '/', results.length, ' final year avg', (results.reduce((t, r) => t + r.years, 0) / results.length).toFixed(0));
console.log('Player Miri/Piri:', results.map((r) => `${r.miri}/${r.piri}`).join(' '));
