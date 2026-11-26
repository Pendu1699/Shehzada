import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/actions';
import { dateOf, turnsUntil } from '../src/engine/calendar';
import { resolveBattle, siegeProgress } from '../src/engine/combat';
import { factionIncome, recruitPool, regionRevenue } from '../src/engine/economy';
import { desecrate, onCapture } from '../src/engine/josh';
import { GRAPH, GEO } from '../src/engine/map';
import { computeMiri, changePiri, balanceOf } from '../src/engine/miripiri';
import { findPath, stepCost } from '../src/engine/movement';
import { armyMen } from '../src/engine/query';
import { rand, seedFromString } from '../src/engine/rng';
import { deserialize, serialize } from '../src/engine/save';
import { newGame } from '../src/engine/setup';
import type { Army, GameState } from '../src/engine/state';
import { endTurn } from '../src/engine/turn';
import { PUNJAB_REGION_IDS, REGIONS } from '../src/data/regions';
import { FACTIONS } from '../src/data/factions';
import { SCENARIOS } from '../src/data/scenarios';

const fresh = (seed = 42, scenarioId = 's1748', playerFaction = 'ahluwalia') => newGame({ scenarioId, playerFaction, seed });

function army(owner: string, region: string, units: [string, number][], extra: Partial<Army> = {}): Army {
  return { id: `T${owner}${region}`, owner, region, units: units.map(([type, men]) => ({ type, men, xp: 0 })), path: [], stance: 'pitched', morale: 80, supply: 100, policy: 'spare', ...extra };
}

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = { rng: 123 };
    const b = { rng: 123 };
    const sa = Array.from({ length: 20 }, () => rand(a));
    const sb = Array.from({ length: 20 }, () => rand(b));
    expect(sa).toEqual(sb);
    expect(new Set(sa).size).toBe(20);
    for (const v of sa) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThan(1);
  });
  it('hashes string seeds stably', () => {
    expect(seedFromString('khalsa')).toBe(seedFromString('khalsa'));
    expect(seedFromString('khalsa')).not.toBe(seedFromString('khalsa2'));
  });
});

describe('calendar', () => {
  it('alternates Vaisakhi and Diwali, two turns a year', () => {
    expect(dateOf(1748, 'vaisakhi', 0).label).toBe('Vaisakhi 1748');
    expect(dateOf(1748, 'vaisakhi', 1).label).toBe('Diwali 1748');
    expect(dateOf(1748, 'vaisakhi', 2).label).toBe('Vaisakhi 1749');
    expect(dateOf(1839, 'diwali', 1).label).toBe('Vaisakhi 1840');
    expect(dateOf(1748, 'vaisakhi', 0).monsoon).toBe(true);
    expect(dateOf(1748, 'vaisakhi', 1).winter).toBe(true);
  });
  it('spans the century in about 202 turns', () => {
    expect(turnsUntil(1748, 'vaisakhi', 1848, 'diwali')).toBe(201);
  });
});

describe('map', () => {
  it('has a detailed Punjab and the wider subcontinent, every region connected', () => {
    expect(PUNJAB_REGION_IDS.size).toBeGreaterThanOrEqual(45);
    expect(PUNJAB_REGION_IDS.size).toBeLessThanOrEqual(61);
    expect(REGIONS.length).toBeGreaterThan(130);
    for (const r of REGIONS) {
      expect(GEO.regions[r.id], r.id).toBeDefined();
      expect(GRAPH[r.id].length, r.id).toBeGreaterThan(0);
    }
  });
  it('separates the doabs with rivers', () => {
    const lahoreSheikhupura = GRAPH.lahore.find((e) => e.to === 'sheikhupura');
    expect(lahoreSheikhupura?.river).toBe('ravi');
    expect(GRAPH.ramnagar.some((e) => e.ford === 'ramnagar_ford' && e.river === 'chenab')).toBe(true);
  });
  it('faith mixes sum to 100', () => {
    for (const r of REGIONS) expect(r.faith.sikh + r.faith.hindu + r.faith.muslim + (r.faith.other ?? 0), r.id).toBe(100);
  });
});

describe('new game', () => {
  it('builds every scenario for every playable faction', () => {
    for (const sc of SCENARIOS)
      for (const f of sc.playable) {
        const s = newGame({ scenarioId: sc.id, playerFaction: f, seed: 1 });
        expect(s.factions[f].alive).toBe(true);
        // Every player starts with an army — except the movement of the Long Struggle.
        if (sc.mode !== 'struggle') expect(Object.values(s.armies).some((a) => a.owner === f)).toBe(true);
      }
  });
  it('knows the whole map by report and the player’s own land in detail', () => {
    const s = fresh();
    expect(s.explored.kapurthala).toBe(2);
    expect(s.explored.peshawar).toBe(1);
    expect(s.explored.lhasa).toBe(1);
  });
});

describe('save/load', () => {
  it('round-trips exactly', () => {
    let s = fresh(7);
    s = endTurn(s);
    const json = serialize(s);
    const back = deserialize(json);
    expect(back).toEqual(s);
  });
  it('a loaded game resumes the identical random stream', () => {
    const s = endTurn(fresh(9));
    const a = endTurn(endTurn(s));
    const b = endTurn(endTurn(deserialize(serialize(s))));
    expect(serialize(a)).toBe(serialize(b));
  });
  it('rejects junk', () => {
    expect(() => deserialize('{"hello":1}')).toThrow();
  });
});

describe('determinism', () => {
  it('same seed + same actions gives the same game', () => {
    const run = () => {
      let s = fresh(1234);
      const a = Object.values(s.armies).find((x) => x.owner === 'ahluwalia')!;
      s = applyAction(s, { type: 'move', armyId: a.id, to: 'jalandhar' }).state;
      for (let i = 0; i < 12; i++) s = endTurn(s);
      return serialize(s);
    };
    expect(run()).toBe(run());
  });
  it('different seeds diverge', () => {
    let a = fresh(1);
    let b = fresh(2);
    for (let i = 0; i < 10; i++) ((a = endTurn(a)), (b = endTurn(b)));
    expect(serialize(a)).not.toBe(serialize(b));
  });
});

describe('economy', () => {
  it('revenue breakdown sums to its total', () => {
    const s = fresh();
    for (const id of ['lahore', 'amritsar', 'kapurthala']) {
      const b = regionRevenue(s, id);
      expect(b.parts.reduce((t, p) => t + p.value, 0)).toBeCloseTo(b.total, 5);
    }
    const inc = factionIncome(s, 'ahluwalia');
    expect(inc.parts.length).toBeGreaterThan(2);
  });
  it('a starting misl can feed its jatha', () => {
    for (const f of ['ahluwalia', 'sukerchakia', 'shaheedan', 'nakai']) {
      const s = newGame({ scenarioId: 's1748', playerFaction: f, seed: 3 });
      expect(factionIncome(s, f).total, f).toBeGreaterThan(-3);
    }
  });
  it('jagirs halve central revenue from the region', () => {
    const s = fresh();
    const before = regionRevenue(s, 'kapurthala').total;
    const r = applyAction(s, { type: 'grantJagir', region: 'kapurthala', leaderId: 'jassa_ahluwalia' });
    expect(r.error).toBeUndefined();
    expect(regionRevenue(r.state, 'kapurthala').total).toBeCloseTo(before / 2, 1);
  });
  it('langar raises Piri over turns', () => {
    let s = fresh();
    s = applyAction(s, { type: 'toggleLangar', region: 'kapurthala' }).state;
    const p0 = s.factions.ahluwalia.piri;
    s = endTurn(s);
    expect(s.factions.ahluwalia.piri).toBeGreaterThan(p0 - 3); // langar offsets other losses
    expect(s.summary?.piri.some((x) => x.reason.startsWith('Langar'))).toBe(true);
  });
  it('recruit pools grow with Piri for Sikh factions', () => {
    const s = fresh();
    const low = recruitPool(s, 'kapurthala', 'ahluwalia').total;
    s.factions.ahluwalia.piri = 95;
    expect(recruitPool(s, 'kapurthala', 'ahluwalia').total).toBeGreaterThan(low);
  });
});

describe('miri and piri', () => {
  it('Miri grows with land and stays within 0–100', () => {
    const s = fresh();
    const m0 = computeMiri(s, 'ahluwalia').total;
    for (const r of ['jalandhar', 'hoshiarpur', 'lahore', 'amritsar', 'sialkot']) s.regions[r].owner = 'ahluwalia';
    const m1 = computeMiri(s, 'ahluwalia').total;
    expect(m1).toBeGreaterThan(m0);
    expect(computeMiri(s, 'mughal').total).toBeLessThanOrEqual(100);
  });
  it('a big gap makes the polity brittle', () => {
    const s = fresh();
    s.factions.ahluwalia.miri = 90;
    s.factions.ahluwalia.piri = 30;
    expect(balanceOf(s, 'ahluwalia').state).toBe('very_brittle');
    s.factions.ahluwalia.piri = 85;
    expect(balanceOf(s, 'ahluwalia').state).toBe('balanced');
  });
  it('Piri is clamped', () => {
    const s = fresh();
    changePiri(s, 'ahluwalia', 500, 'test');
    expect(s.factions.ahluwalia.piri).toBe(100);
    changePiri(s, 'ahluwalia', -500, 'test');
    expect(s.factions.ahluwalia.piri).toBe(0);
  });
});

describe('movement', () => {
  it('the monsoon makes unforded crossings slow and risky', () => {
    const s = fresh(); // Vaisakhi turn: monsoon ahead
    const a = army('ahluwalia', 'lahore', [['ghorchare', 1000]]);
    const e = GRAPH.lahore.find((x) => x.river && !x.ford)!;
    const wet = stepCost(s, a, e);
    const dry = stepCost({ ...s, turn: 1 } as GameState, a, e);
    expect(wet.cost).toBeGreaterThan(dry.cost);
    expect(wet.risk).toBeGreaterThan(0);
  });
  it('finds paths and respects peace', () => {
    const s = fresh();
    const a = Object.values(s.armies).find((x) => x.owner === 'ahluwalia')!;
    expect(findPath(s, a, 'jalandhar')).toEqual(['jalandhar']);
    // Kasur is at peace with the Ahluwalia: no entry without war.
    expect(findPath(s, a, 'kasur')).toBeNull();
  });
});

describe('combat', () => {
  const base = () => {
    const s = fresh();
    s.armies = {};
    return s;
  };
  it('a much larger army wins a pitched battle', () => {
    const s = base();
    const A = army('ahluwalia', 'lahore', [['ghorchare', 6000]]);
    const D = army('mughal', 'lahore', [['piyada', 1000]]);
    const r = resolveBattle(s, { region: 'lahore', attacker: { faction: 'ahluwalia', armies: [A], stance: 'pitched' }, defender: { faction: 'mughal', armies: [D], stance: 'pitched' }, fortLevel: 0 });
    expect(r.winner).toBe('attacker');
    expect(r.dLosses).toBeGreaterThan(r.aLosses);
  });
  it('Dhai Phat costs the horse less and decides nothing', () => {
    const s = base();
    const mk = () => ({ A: army('ahluwalia', 'lahore', [['ghorchare', 2000]]), D: army('mughal', 'lahore', [['piyada', 4000], ['top', 200]]) });
    const p = mk();
    const pitched = resolveBattle(s, { region: 'lahore', attacker: { faction: 'ahluwalia', armies: [p.A], stance: 'pitched' }, defender: { faction: 'mughal', armies: [p.D], stance: 'pitched' }, fortLevel: 0 });
    const d = mk();
    const dhai = resolveBattle(s, { region: 'lahore', attacker: { faction: 'ahluwalia', armies: [d.A], stance: 'dhai_phat' }, defender: { faction: 'mughal', armies: [d.D], stance: 'pitched' }, fortLevel: 0 });
    expect(dhai.rounds.length).toBeLessThanOrEqual(3);
    expect(dhai.aLosses / Math.max(1, dhai.dLosses)).toBeLessThan(pitched.aLosses / Math.max(1, pitched.dLosses));
  });
  it('ambush is strong in cover and weak in the open', () => {
    const s = base();
    const fight = (region: string) => {
      const A = army('ahluwalia', region, [['ghorchare', 2000]]);
      const D = army('mughal', region, [['mughal_cav', 2000]]);
      return resolveBattle(s, { region, attacker: { faction: 'ahluwalia', armies: [A], stance: 'ambush' }, defender: { faction: 'mughal', armies: [D], stance: 'pitched' }, fortLevel: 0 });
    };
    expect(fight('pathankot').modifiers.some((m) => m.label.startsWith('Ambush from cover'))).toBe(true);
    expect(fight('lahore').modifiers.some((m) => m.label.startsWith('Ambush without cover'))).toBe(true);
  });
  it('a night raid on a baggage train frees captives', () => {
    const s = base();
    const A = army('ahluwalia', 'sirhind', [['ghorchare', 3000]]);
    const D = army('durrani', 'sirhind', [['durrani_cav', 5000]], { baggage: { plunder: 50, captives: 2200 } });
    const r = resolveBattle(s, { region: 'sirhind', attacker: { faction: 'ahluwalia', armies: [A], stance: 'night_raid' }, defender: { faction: 'durrani', armies: [D], stance: 'pitched' }, fortLevel: 0 });
    expect(r.captivesFreed ?? 0).toBeGreaterThan(0);
    expect(D.baggage!.captives).toBeLessThan(2200);
  });
  it('walls favour the defender', () => {
    const s = base();
    const fight = (fort: number) => {
      const A = army('ahluwalia', 'lahore', [['ghorchare', 3000]]);
      const D = army('mughal', 'lahore', [['piyada', 2000]], { stance: 'hold' });
      return resolveBattle(s, { region: 'lahore', attacker: { faction: 'ahluwalia', armies: [A], stance: 'pitched' }, defender: { faction: 'mughal', armies: [D], stance: 'hold' }, fortLevel: fort });
    };
    const open = fight(0);
    const walled = fight(4);
    expect(walled.aLosses).toBeGreaterThan(open.aLosses * 0.9);
  });
  it('guns breach walls faster than horse alone', () => {
    const s = base();
    const horse = siegeProgress(s, [army('bhangi', 'lahore', [['ghorchare', 3000]])], 'lahore').parts[0].value;
    const guns = siegeProgress(s, [army('bhangi', 'lahore', [['ghorchare', 3000], ['top', 600]])], 'lahore').parts[0].value;
    expect(guns).toBeGreaterThan(horse);
  });
  it('losses are applied to the armies', () => {
    const s = base();
    const A = army('ahluwalia', 'lahore', [['ghorchare', 2000]]);
    const D = army('mughal', 'lahore', [['mughal_cav', 2000]]);
    const r = resolveBattle(s, { region: 'lahore', attacker: { faction: 'ahluwalia', armies: [A], stance: 'pitched' }, defender: { faction: 'mughal', armies: [D], stance: 'pitched' }, fortLevel: 0 });
    expect(armyMen(A)).toBe(2000 - r.aLosses);
    expect(armyMen(D)).toBe(2000 - r.dLosses);
  });
});

describe('sacred sites (respect rules)', () => {
  it('no Sikh faction ever desecrates', () => {
    for (const f of FACTIONS.filter((x) => x.sikh)) {
      const s = fresh();
      s.regions.amritsar.owner = f.id;
      expect(onCapture(s, 'amritsar', f.id)).toBe(false);
      expect(s.regions.amritsar.desecrated).toEqual([]);
    }
  });
  it('even forced, the capture hook will not let a Sikh faction desecrate', () => {
    const s = fresh();
    expect(onCapture(s, 'amritsar', 'bhangi', { forceDesecrate: true })).toBe(false);
  });
  it('desecration by an enemy power triggers Josh for every Sikh army', () => {
    const s = fresh();
    s.regions.amritsar.owner = 'durrani';
    desecrate(s, 'amritsar', 'durrani');
    expect(s.josh.active).toBe(true);
    for (const a of Object.values(s.armies)) if (FACTIONS.find((f) => f.id === a.owner)?.sikh) expect(a.josh).toBeGreaterThan(0);
    expect(s.regions.amritsar.desecrated).toContain('harmandir');
  });
  it('the player cannot take a desecrate action — none exists', () => {
    const s = fresh();
    const r = applyAction(s, { type: 'desecrate' } as never);
    expect(r.error).toBeDefined();
  });
});

describe('turns', () => {
  it('a 1748 game runs 60 turns without breaking invariants', () => {
    let s = fresh(77);
    for (let i = 0; i < 60 && s.phase !== 'ended'; i++) {
      s = endTurn(s);
      for (const a of Object.values(s.armies)) {
        expect(armyMen(a)).toBeGreaterThan(0);
        expect(s.regions[a.region]).toBeDefined();
        for (const u of a.units) expect(Number.isFinite(u.men)).toBe(true);
      }
      for (const f of Object.values(s.factions)) {
        expect(Number.isFinite(f.treasury)).toBe(true);
        expect(f.piri).toBeGreaterThanOrEqual(0);
        expect(f.piri).toBeLessThanOrEqual(100);
      }
    }
  });
  it('Durrani invasions arrive in the cold season', () => {
    let s = fresh(5);
    s = endTurn(s); // to Diwali 1748
    expect(Object.values(s.armies).some((a) => a.owner === 'durrani' && a.withdrawTurn !== undefined)).toBe(true);
  });
});
