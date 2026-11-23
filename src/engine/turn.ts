// Turn resolution.
//
// Phases (see the design brief): Sarbat Khalsa → Revenue & Rakhi → Orders →
// Resolution (movement, battles, sieges) → Events → Dhadi's turn summary.
// The player issues orders during 'orders'; endTurn() runs everything else and
// leaves the new turn at its Sarbat Khalsa phase (or straight in orders if there is
// nothing to vote on).

import { REGION_BY_ID } from '../data/regions';
import { battleVerdict, seasonLine } from '../narrative/dhadi';
import { runAI } from './ai';
import { FINAL_FESTIVAL, FINAL_YEAR } from './calendar';
import { chronicle } from './chronicle';
import { garrisonOf, resolveBattle, siegeProgress, type Side } from './combat';
import { captureRegion, checkElimination, checkRakhiObligations, destroyArmy, raidRegion, retreat } from './conquest';
import { collectIncome, stabilityTarget } from './economy';
import { refreshExploration } from './explore';
import { spawnInvasions } from './invasions';
import { joshTurn } from './josh';
import { killLeader, leaderTurn } from './leaders';
import { edgeBetween } from './map';
import { balanceOf, changePiri, updateMiri } from './miripiri';
import { canEnter, movementPoints, stepCost } from './movement';
import { armiesIn, armyMen, atWar, clamp, date, factionName, friendly, isSikh, polityName } from './query';
import { chance, rand, shuffle } from './rng';
import type { Army, BattleReport, GameState } from './state';
import { resolveEventChoice, runEvents } from './events';
import { EVENT_BY_ID } from '../data/events/index';
import { finishSarbat, runSarbatKhalsa } from './sarbat';
import { checkEnding } from './endings';
import { courtTurn } from './court';

export interface ResolutionLog {
  dhadi: string[];
  notes: string[];
  battles: BattleReport[];
}

function moveArmies(s: GameState, log: ResolutionLog) {
  const moving = shuffle(
    s,
    Object.values(s.armies).filter((a) => a.path.length),
  );
  for (const a of Object.values(s.armies)) {
    a.from = a.region;
    a.entered = false;
  }
  const mp = new Map(moving.map((a) => [a.id, movementPoints(s, a).total]));
  const moved = new Set<string>();
  const stopped = new Set<string>();
  for (let step = 0; step < 8; step++) {
    let any = false;
    for (const a of moving) {
      if (!s.armies[a.id] || stopped.has(a.id) || !a.path.length) continue;
      const next = a.path[0];
      const e = edgeBetween(a.region, next);
      if (!e || !canEnter(s, a.owner, next)) {
        a.path = [];
        continue;
      }
      const c = stepCost(s, a, e);
      const left = mp.get(a.id)!;
      if (c.cost > left && moved.has(a.id)) {
        stopped.add(a.id);
        continue;
      }
      mp.set(a.id, left - c.cost);
      moved.add(a.id);
      any = true;
      a.region = next;
      a.entered = true;
      a.path.shift();
      if (c.risk > 0) {
        const lost = Math.round(armyMen(a) * c.risk * (0.5 + rand(s)));
        if (lost > 0) {
          for (const u of a.units) u.men -= Math.round((u.men / armyMen(a)) * lost);
          if (a.owner === s.playerFaction) log.notes.push(`Crossing the ${e.river} in flood, ${a.name ?? 'your army'} lost ${lost.toLocaleString()} men and much baggage to the river.`);
        }
      }
      // Stop on contact with enemies or enemy walls.
      const hostileArmy = armiesIn(s, next).some((x) => x.id !== a.id && atWar(s, a.owner, x.owner));
      const owner = s.regions[next].owner;
      const hostileLand = owner && atWar(s, a.owner, owner);
      if (hostileArmy || hostileLand) {
        stopped.add(a.id);
        if (hostileArmy) a.path = [];
      }
    }
    if (!any) break;
  }
}

function sidesIn(s: GameState, region: string): Map<string, Army[]> {
  const m = new Map<string, Army[]>();
  for (const a of armiesIn(s, region)) {
    if (armyMen(a) <= 0) continue;
    const l = m.get(a.owner) ?? [];
    l.push(a);
    m.set(a.owner, l);
  }
  return m;
}

function recordBattle(s: GameState, b: BattleReport, log: ResolutionLog) {
  s.battles.push(b);
  if (s.battles.length > 120) s.battles.shift();
  log.battles.push(b);
  const involved = b.attacker === s.playerFaction || b.defender === s.playerFaction;
  const big = b.aMen + b.dMen >= 30000;
  if (involved || big) {
    const won = (b.winner === 'attacker' && b.attacker === s.playerFaction) || (b.winner === 'defender' && b.defender === s.playerFaction);
    const winnerF = b.winner === 'attacker' ? b.attacker : b.winner === 'defender' ? b.defender : null;
    const text = `Battle at ${REGION_BY_ID[b.region].name}: ${polityName(s, b.attacker)} (${b.aMen.toLocaleString()}) against ${polityName(s, b.defender)} (${b.dMen.toLocaleString()}). ${winnerF ? `${factionName(winnerF)} held the field.` : 'Neither side held the field.'} Losses ${b.aLosses.toLocaleString()} and ${b.dLosses.toLocaleString()}.`;
    chronicle(s, 'battle', text, { faction: involved ? s.playerFaction : winnerF ?? undefined, region: b.region, weight: (involved ? 3 : 1) + (big ? 3 : 0) + (won ? 1 : 0) });
    if (involved) log.dhadi.push(battleVerdict(s, b));
  }
  // Leaders on the winning side gain renown; vengeance for desecration.
  const winners = b.winner === 'attacker' ? b.attackerLeader : b.winner === 'defender' ? b.defenderLeader : undefined;
  if (winners && s.leaders[winners]) s.leaders[winners].victories += 1;
  const loserLeader = b.winner === 'attacker' ? b.defenderLeader : b.winner === 'defender' ? b.attackerLeader : undefined;
  if (loserLeader && s.josh.vengeanceLeader === loserLeader) {
    const victor = b.winner === 'attacker' ? b.attacker : b.defender;
    if (isSikh(victor)) {
      s.factions[victor].legend += 6;
      chronicle(s, 'josh', `${s.leaders[loserLeader]?.name ?? 'The desecrator'} was beaten in the field by ${polityName(s, victor)}. The dhadis sing of it still.`, { faction: victor, weight: 8 });
      s.josh.vengeanceLeader = undefined;
    }
  }
  if (b.captivesFreed && isSikh(b.attacker)) {
    changePiri(s, b.attacker, Math.min(8, 2 + b.captivesFreed / 2000), 'Freeing captives from the baggage train');
    chronicle(s, 'captives', `${b.captivesFreed.toLocaleString()} captives were freed by ${polityName(s, b.attacker)} and escorted home.`, { faction: b.attacker, region: b.region, weight: 6 });
  }
  // A leader may fall.
  for (const [lid, lost, men] of [
    [b.attackerLeader, b.aLosses, b.aMen],
    [b.defenderLeader, b.dLosses, b.dMen],
  ] as const) {
    if (!lid || !s.leaders[lid]?.alive) continue;
    const p = 0.01 + (lost / Math.max(1, men)) * 0.08;
    if (chance(s, p)) killLeader(s, lid, `fell in battle at ${REGION_BY_ID[b.region].name}`);
  }
}

function resolveBattles(s: GameState, log: ResolutionLog) {
  for (const region of Object.keys(s.regions)) {
    for (let iter = 0; iter < 3; iter++) {
      const sides = sidesIn(s, region);
      const factions = [...sides.keys()];
      let pair: [string, string] | null = null;
      for (let i = 0; i < factions.length && !pair; i++)
        for (let j = i + 1; j < factions.length && !pair; j++) if (atWar(s, factions[i], factions[j])) pair = [factions[i], factions[j]];
      if (!pair) break;
      // The side that entered this turn attacks.
      const [f1, f2] = pair;
      const e1 = sides.get(f1)!.some((a) => a.entered);
      const e2 = sides.get(f2)!.some((a) => a.entered);
      const [att, def] = e1 && !e2 ? [f1, f2] : e2 && !e1 ? [f2, f1] : armyMen(sides.get(f1)![0]) >= armyMen(sides.get(f2)![0]) ? [f1, f2] : [f2, f1];
      // Allies of the defender in the same region join.
      const defArmies = factions.filter((f) => f === def || (friendly(s, f, def) && atWar(s, f, att))).flatMap((f) => sides.get(f)!);
      const attArmies = factions.filter((f) => f === att || (friendly(s, f, att) && atWar(s, f, def))).flatMap((f) => sides.get(f)!);
      const st = s.regions[region];
      const defOwnsWalls = st.owner === def && st.fort > 0;
      const A: Side = { faction: att, armies: attArmies, stance: attArmies[0].stance === 'hold' || attArmies[0].stance === 'siege' ? 'pitched' : attArmies[0].stance };
      const D: Side = { faction: def, armies: defArmies, stance: defArmies[0].stance, garrison: defOwnsWalls ? garrisonOf(s, region) : undefined };
      const b = resolveBattle(s, { region, attacker: A, defender: D, fortLevel: defOwnsWalls && (D.stance === 'hold' || !!D.garrison) ? st.fort : 0 });
      recordBattle(s, b, log);
      // Aftermath.
      if (b.winner === 'attacker') {
        for (const a of defArmies) if (s.armies[a.id]) log.notes.push(retreat(s, a));
      } else if (b.winner === 'defender') {
        for (const a of attArmies) if (s.armies[a.id]) log.notes.push(retreat(s, a));
      } else {
        // Hit-and-run: the attacker rides back whence it came.
        for (const a of attArmies) {
          if (!s.armies[a.id]) continue;
          if (a.from && a.from !== region && !armiesIn(s, a.from).some((x) => atWar(s, x.owner, a.owner))) a.region = a.from;
          a.path = [];
        }
      }
      for (const a of [...attArmies, ...defArmies]) if (s.armies[a.id] && armyMen(a) <= 0) destroyArmy(s, a.id);
      checkElimination(s, att);
      checkElimination(s, def);
    }
  }
}

function resolveOccupation(s: GameState, log: ResolutionLog) {
  for (const a of shuffle(s, Object.values(s.armies))) {
    if (!s.armies[a.id] || armyMen(a) <= 0) continue;
    const st = s.regions[a.region];
    const owner = st.owner;
    const hostileHere = armiesIn(s, a.region).some((x) => atWar(s, x.owner, a.owner));
    if (hostileHere) continue;
    if (a.task === 'raid' && owner !== a.owner && a.path.length === 0) {
      const text = raidRegion(s, a);
      if (a.owner === s.playerFaction || owner === s.playerFaction) log.notes.push(text);
      a.task = undefined;
      continue;
    }
    if (a.path.length) continue;
    if (a.stance === 'dhai_phat' || a.stance === 'night_raid') continue;
    const hostileOwner = owner && atWar(s, a.owner, owner);
    const subjugate = !owner && a.task === 'capture';
    if (!hostileOwner && !subjugate) {
      if (st.siege && st.siege.by === a.owner) st.siege = undefined;
      continue;
    }
    if (a.withdrawTurn !== undefined && s.turn >= a.withdrawTurn) continue;
    // Walls: siege or storm.
    if (st.fort > 0 || subjugate) {
      if (a.stance === 'siege' && !subjugate) {
        if (!st.siege || st.siege.by !== a.owner) st.siege = { by: a.owner, armyId: a.id, progress: 0, turns: 0 };
        const g = siegeProgress(s, armiesIn(s, a.region).filter((x) => x.owner === a.owner), a.region);
        st.siege.progress += g.gain;
        st.siege.turns += 1;
        if (st.siege.progress >= 100) {
          const r = captureRegion(s, a.region, a.owner, a, 'surrendered');
          log.notes.push(r.text);
          if (r.desecrated) log.dhadi.push(...desecrationLines(s, a.region));
        } else if (a.owner === s.playerFaction || owner === s.playerFaction) {
          log.notes.push(`The siege of ${REGION_BY_ID[a.region].name} goes on (${Math.round(st.siege.progress)}% of the way to its fall).`);
        }
        continue;
      }
      // Storm the walls against the garrison.
      const garrison = garrisonOf(s, a.region);
      const A: Side = { faction: a.owner, armies: armiesIn(s, a.region).filter((x) => x.owner === a.owner), stance: 'pitched' };
      const D: Side = { faction: owner ?? 'local', armies: [], garrison, stance: 'hold' };
      const b = resolveBattle(s, { region: a.region, attacker: A, defender: D, fortLevel: st.fort, assault: true });
      if (owner) recordBattle(s, b, log);
      if (b.winner === 'attacker') {
        const r = captureRegion(s, a.region, a.owner, a, 'stormed');
        log.notes.push(r.text);
        if (r.desecrated) log.dhadi.push(...desecrationLines(s, a.region));
      } else {
        st.siege = { by: a.owner, armyId: a.id, progress: 10, turns: 1 };
        a.stance = 'siege';
        if (a.owner === s.playerFaction) log.notes.push(`The storm of ${REGION_BY_ID[a.region].name} failed; your army has settled down to a siege.`);
      }
      continue;
    }
    const r = captureRegion(s, a.region, a.owner, a, 'occupied');
    if (a.owner === s.playerFaction || owner === s.playerFaction || REGION_BY_ID[a.region].population >= 150) log.notes.push(r.text);
    if (r.desecrated) log.dhadi.push(...desecrationLines(s, a.region));
  }
}

function desecrationLines(s: GameState, region: string): string[] {
  return [
    `Hush now. The dhadd falls silent. At ${REGION_BY_ID[region].name} the sacred places have been defiled by ${polityName(s, s.regions[region].owner)}.`,
    'The sarovar is fouled; the walls are broken. Old men weep in the villages, and young men take down their swords from the wall.',
    'Then the nagaras begin again — slowly, then all together. From every misl, every village, the riders come. This is Josh.',
  ];
}

function upkeepArmies(s: GameState, log: ResolutionLog) {
  const d = date(s);
  for (const a of Object.values(s.armies)) {
    const st = s.regions[a.region];
    const own = st.owner === a.owner || friendly(s, st.owner, a.owner) || st.rakhi === a.owner;
    if (own) {
      a.supply = clamp(a.supply + 40, 0, 100);
      a.morale = clamp(a.morale + 8, 0, 85 + (a.josh ? 15 : 0));
    } else {
      const def = REGION_BY_ID[a.region];
      let forage = def.fertility * 6 - 25 - armyMen(a) / 1500;
      if (def.terrain === 'desert' || def.terrain === 'bar') forage -= 10;
      if (d.monsoon) forage -= 8;
      a.supply = clamp(a.supply + forage, 0, 100);
      a.morale = clamp(a.morale + 2, 0, 80);
    }
    if (a.supply < 20) {
      const loss = Math.round(armyMen(a) * 0.06);
      for (const u of a.units) u.men = Math.max(0, u.men - Math.round(u.men * 0.06));
      a.morale = clamp(a.morale - 8, 0, 100);
      if (a.owner === s.playerFaction && loss > 0) log.notes.push(`${a.name ?? 'An army'} is starving in ${REGION_BY_ID[a.region].name}: ${loss.toLocaleString()} men lost to hunger and desertion.`);
    }
    a.units = a.units.filter((u) => u.men > 0);
    if (!a.units.length) destroyArmy(s, a.id);
  }
}

function invadersGoHome(s: GameState, log: ResolutionLog) {
  for (const a of Object.values(s.armies)) {
    if (a.withdrawTurn === undefined || !a.home) continue;
    if (s.turn >= a.withdrawTurn && a.region === a.home) {
      const fs = s.factions[a.owner];
      if (a.baggage) {
        fs.treasury += a.baggage.plunder;
        if (a.baggage.captives > 500) {
          chronicle(s, 'event', `The Durrani army went home over the Indus with its plunder and ${a.baggage.captives.toLocaleString()} captives.`, { faction: a.owner, weight: 3 });
          log.notes.push(`The invaders recrossed the Indus with ${a.baggage.captives.toLocaleString()} captives.`);
        }
      }
      // Leave a garrison of a quarter; the rest go home.
      for (const u of a.units) u.men = Math.round(u.men * 0.25);
      a.withdrawTurn = undefined;
      a.baggage = undefined;
      a.name = 'Durrani garrison';
      if (a.leader && ['ahmad_shah', 'zaman_shah'].includes(a.leader)) {
        s.leaders[a.leader].armyId = undefined;
        a.leader = undefined;
      }
    }
  }
}

function regionTurn(s: GameState) {
  for (const st of Object.values(s.regions)) {
    const contested = armiesIn(s, st.id).some((a) => st.owner && atWar(s, a.owner, st.owner));
    if (st.owner && !contested) st.control = clamp(st.control + (st.langar ? 8 : 5), 0, 100);
    const target = stabilityTarget(s, st.id);
    st.stability = clamp(st.stability + (target - st.stability) * 0.2, 0, 100);
    st.devastation = clamp(st.devastation - 0.05, 0, 1);
    if (st.siege) {
      const besieger = s.armies[st.siege.armyId];
      if (!besieger || besieger.region !== st.id || besieger.owner !== st.siege.by) st.siege = undefined;
    }
  }
}

function langarAndPiri(s: GameState) {
  for (const f of Object.values(s.factions)) {
    if (!f.alive) continue;
    const langars = Object.values(s.regions).filter((r) => r.owner === f.id && r.langar).length;
    if (langars && isSikh(f.id)) changePiri(s, f.id, Math.min(2.5, 0.35 * langars + 0.3), 'Langar kept open for all who come');
    // High standing must be kept up: the Panth expects more of those it honours most.
    if (f.piri > 60) changePiri(s, f.id, -(f.piri - 60) * 0.04, 'The Panth expects more of those it honours');
    // Just leaders as governors.
    for (const L of Object.values(s.leaders)) if (L.alive && L.faction === f.id && L.jagir && L.traits.includes('just')) changePiri(s, f.id, 0.2, `The just rule of ${L.name}`);
    if (f.treasury < 0) {
      for (const a of Object.values(s.armies)) {
        if (a.owner !== f.id) continue;
        a.morale = clamp(a.morale - 12, 0, 100);
        for (const u of a.units) u.men = Math.round(u.men * 0.95);
      }
      if (isSikh(f.id)) changePiri(s, f.id, -1, 'Soldiers’ pay in arrears');
    }
  }
}

/** End the player's turn and resolve everything until the next turn's orders. */
export function endTurn(prev: GameState): GameState {
  const s = structuredClone(prev);
  if (s.phase === 'ended') return s;
  // Decisions the player left open are taken by the current of history.
  for (const p of [...s.pendingEvents]) {
    const ev = EVENT_BY_ID[p.eventId];
    const order = [ev?.aiChoice ?? 0, ...(ev?.choices ?? []).map((_, i) => i)];
    for (const c of order) if (resolveEventChoice(s, p.id, c) !== null) break;
  }
  s.pendingEvents = [];
  if (s.gurmatas.some((g) => g.passed === undefined)) finishSarbat(s);
  const log: ResolutionLog = { dhadi: [], notes: [], battles: [] };

  runAI(s);
  moveArmies(s, log);
  resolveBattles(s, log);
  resolveOccupation(s, log);
  log.notes.push(...checkRakhiObligations(s));
  upkeepArmies(s, log);
  invadersGoHome(s, log);
  for (const f of Object.keys(s.factions)) checkElimination(s, f);

  // ── New turn ───────────────────────────────────────────────────────────────
  const endedNow = (() => {
    const d = date(s);
    return d.year > FINAL_YEAR || (d.year === FINAL_YEAR && d.festival === FINAL_FESTIVAL);
  })();
  s.turn += 1;
  s.lastBattles = log.battles.map((b) => b.id);
  log.notes.push(...leaderTurn(s));
  log.notes.push(...courtTurn(s));
  log.notes.push(...spawnInvasions(s));
  log.notes.push(...joshTurn(s));
  regionTurn(s);
  const incomeParts: { label: string; value: number }[] = [];
  for (const f of Object.values(s.factions)) {
    if (!f.alive) continue;
    const inc = collectIncome(s, f.id);
    if (f.id === s.playerFaction) incomeParts.push(...inc.parts);
  }
  langarAndPiri(s);
  for (const f of Object.keys(s.factions)) updateMiri(s, f);
  const bal = balanceOf(s, s.playerFaction);
  if (bal.state === 'brittle' || bal.state === 'very_brittle') {
    s.factions[s.playerFaction].brittle += 1;
    log.notes.push(`${bal.label}: ${bal.detail}`);
  } else s.factions[s.playerFaction].brittle = Math.max(0, s.factions[s.playerFaction].brittle - 1);

  const evNotes = runEvents(s);
  log.notes.push(...evNotes.notes);
  log.dhadi.push(...evNotes.dhadi);
  runSarbatKhalsa(s);
  refreshExploration(s);
  checkEnding(s, endedNow);

  s.summary = {
    turn: s.turn,
    dhadi: [seasonLine(s), ...log.dhadi],
    income: incomeParts,
    notes: log.notes.filter(Boolean),
    piri: s.piriNotes.map((n) => ({ delta: Math.round(n.delta * 10) / 10, reason: n.reason })),
  };
  s.piriNotes = [];
  if ((s.phase as string) !== 'ended') s.phase = s.gurmatas.some((g) => g.passed === undefined) ? 'sarbat' : 'orders';
  return s;
}
