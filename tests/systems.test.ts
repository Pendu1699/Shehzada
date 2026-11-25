import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/actions';
import { collapseRisk, courtStability, newCourt } from '../src/engine/court';
import { diploChance } from '../src/engine/diplomacy';
import { endingFor } from '../src/engine/endings';
import { eligible, resolveEventChoice, runEvents } from '../src/engine/events';
import { killLeader } from '../src/engine/leaders';
import { finishSarbat, runSarbatKhalsa } from '../src/engine/sarbat';
import { newGame } from '../src/engine/setup';
import { endTurn } from '../src/engine/turn';
import { EVENTS, EVENT_BY_ID } from '../src/data/events/index';
import { composeVaar } from '../src/narrative/vaar';
import { serialize } from '../src/engine/save';

describe('events', () => {
  it('has the scripted history and at least 50 generic events', () => {
    expect(EVENTS.filter((e) => e.kind === 'generic').length).toBeGreaterThanOrEqual(50);
    for (const id of ['baba_deep_singh', 'vadda_ghallughara', 'panipat_captives', 'sirhind_1764', 'lahore_1765', 'baghel_singh_delhi', 'ranjit_lahore', 'maharaja_proclaimed', 'treaty_amritsar', 'koh_i_noor', 'jamrud_1837', 'lion_sleeps', 'sobraon', 'chillianwala_gujrat'])
      expect(EVENT_BY_ID[id], id).toBeDefined();
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
  });
  it('Ram Rauni comes to a Sikh player on the Diwali 1748 turn, and can be resolved', () => {
    let s = newGame({ scenarioId: 's1748', playerFaction: 'ahluwalia', seed: 3 });
    s = endTurn(s);
    const p = s.pendingEvents.find((e) => e.eventId === 'ram_rauni');
    expect(p).toBeDefined();
    const r = applyAction(s, { type: 'eventChoice', pendingId: p!.id, choice: 0 });
    expect(r.error).toBeUndefined();
    expect(r.state.pendingEvents.find((e) => e.id === p!.id)).toBeUndefined();
  });
  it('open decisions are taken by the current of history at the end of the turn', () => {
    let s = newGame({ scenarioId: 's1748', playerFaction: 'ahluwalia', seed: 3 });
    s = endTurn(s);
    expect(s.pendingEvents.length).toBeGreaterThan(0);
    s = endTurn(s);
    expect(s.firedEvents.ram_rauni).toBeDefined();
    expect(s.chronicle.some((c) => c.text.includes('Ram Rauni'))).toBe(true);
  });
  it('history can be averted: Nau Nihal Singh survives a well-prepared court', () => {
    const s = newGame({ scenarioId: 's1839', playerFaction: 'sukerchakia', seed: 11 });
    s.court!.crisis = false;
    s.court!.heirPrepared = 100;
    s.court!.armyBound = 100;
    for (const f of Object.values(s.court!.factions)) ((f.loyalty = 100), (f.influence = 20));
    s.factions.sukerchakia.piri = 95;
    s.factions.sukerchakia.miri = 90;
    expect(collapseRisk(s, 'sukerchakia')).toBeLessThan(0.05);
  });
  it('a resolved choice cannot be applied twice', () => {
    let s = newGame({ scenarioId: 's1748', playerFaction: 'ahluwalia', seed: 3 });
    s = endTurn(s);
    const p = s.pendingEvents[0];
    expect(resolveEventChoice(s, p.id, 0)).not.toBeNull();
    expect(resolveEventChoice(s, p.id, 0)).toBeNull();
  });
  it('generic events are not eligible before their windows or conditions', () => {
    const s = newGame({ scenarioId: 's1748', playerFaction: 'ahluwalia', seed: 3 });
    expect(eligible(s, EVENT_BY_ID.european_adventurer)).toBeNull(); // only from 1790
    expect(eligible(s, EVENT_BY_ID.lion_sleeps)).toBeNull();
  });
  it('runEvents is deterministic', () => {
    const a = newGame({ scenarioId: 's1767', playerFaction: 'bhangi', seed: 8 });
    const b = newGame({ scenarioId: 's1767', playerFaction: 'bhangi', seed: 8 });
    runEvents(a);
    runEvents(b);
    expect(serialize(a)).toBe(serialize(b));
  });
});

describe('Sarbat Khalsa', () => {
  it('tables a gurmata of unity when an invader is in the doabs, and it binds the misls', () => {
    const s = newGame({ scenarioId: 's1748', playerFaction: 'ahluwalia', seed: 5 });
    const d = Object.values(s.armies).find((a) => a.owner === 'durrani')!;
    d.region = 'lahore';
    for (const u of d.units) u.men *= 6;
    runSarbatKhalsa(s);
    const g = s.gurmatas.find((x) => x.kind === 'unite_vs' && x.target === 'durrani');
    expect(g).toBeDefined();
    finishSarbat(s);
    expect(g!.passed).toBe(true);
    expect(s.factions.bhangi.relations.ahluwalia).toBe('alliance');
    expect(s.factions.bhangi.relations.durrani).toBe('war');
    expect(s.phase).toBe('orders');
  });
  it('the player can propose once a season', () => {
    const s = newGame({ scenarioId: 's1767', playerFaction: 'ahluwalia', seed: 5 });
    const r1 = applyAction(s, { type: 'propose', kind: 'misl_peace' });
    expect(r1.error).toBeUndefined();
    const r2 = applyAction(r1.state, { type: 'propose', kind: 'langar_all' });
    expect(r2.error).toBeDefined();
  });
  it('declaring war on a misl under a peace gurmata costs heavy Piri', () => {
    let s = newGame({ scenarioId: 's1767', playerFaction: 'ahluwalia', seed: 5 });
    s = applyAction(s, { type: 'propose', kind: 'misl_peace' }).state;
    finishSarbat(s);
    const before = s.factions.ahluwalia.piri;
    const r = applyAction(s, { type: 'declareWar', target: 'kanhaiya' });
    expect(before - r.state.factions.ahluwalia.piri).toBeGreaterThan(10);
  });
});

describe('court and succession', () => {
  it('the true heir succeeds, not a minister', () => {
    const s = newGame({ scenarioId: 's1839', playerFaction: 'sukerchakia', seed: 2 });
    expect(s.factions.sukerchakia.chief).toBe('kharak_singh');
    s.court!.heirPrepared = 0;
    killLeader(s, 'kharak_singh', 'died');
    expect(s.factions.sukerchakia.chief).toBe('nau_nihal_singh');
  });
  it('favouring a faction raises its loyalty and costs money', () => {
    const s = newGame({ scenarioId: 's1839', playerFaction: 'sukerchakia', seed: 2 });
    const before = s.court!.factions.panches.loyalty;
    const t0 = s.factions.sukerchakia.treasury;
    const r = applyAction(s, { type: 'court', act: 'favour', target: 'panches' });
    expect(r.state.court!.factions.panches.loyalty).toBeGreaterThan(before);
    expect(r.state.factions.sukerchakia.treasury).toBeLessThan(t0);
  });
  it('stability falls when one faction dominates', () => {
    const s = newGame({ scenarioId: 's1839', playerFaction: 'sukerchakia', seed: 2 });
    const c = newCourt(s, 'sukerchakia');
    const base = courtStability(c).value;
    c.factions.dogra.influence = 95;
    expect(courtStability(c).value).toBeLessThan(base);
  });
});

describe('diplomacy', () => {
  it('tribute needs a border and a much stronger hand', () => {
    const s = newGame({ scenarioId: 's1767', playerFaction: 'nakai', seed: 4 });
    expect(diploChance(s, 'tribute', 'company')).toBe(0);
  });
  it('a shared enemy makes alliance likelier', () => {
    const s = newGame({ scenarioId: 's1748', playerFaction: 'ahluwalia', seed: 4 });
    const withEnemy = diploChance(s, 'alliance', 'bhangi');
    s.factions.ahluwalia.relations.mughal = 'peace';
    s.factions.ahluwalia.relations.durrani = 'peace';
    expect(diploChance(s, 'alliance', 'bhangi')).toBeLessThan(withEnemy);
  });
});

describe('endings and the Vaar', () => {
  it('chooses an ending from the record', () => {
    const s = newGame({ scenarioId: 's1839', playerFaction: 'sukerchakia', seed: 1 });
    expect(['sovereign', 'annexation']).toContain(endingFor(s));
    s.factions.sukerchakia.flags.annexed = true;
    expect(endingFor(s)).toBe('annexation');
    s.factions.sukerchakia.flags.annexed = false;
    s.factions.sukerchakia.flags.loyal_to_resident = true;
    expect(endingFor(s)).toBe('protected');
  });
  it('a full 1839 game reaches March 1849 with a Vaar', () => {
    let s = newGame({ scenarioId: 's1839', playerFaction: 'sukerchakia', seed: 21 });
    for (let i = 0; i < 30 && s.phase !== 'ended'; i++) s = endTurn(s);
    expect(s.phase).toBe('ended');
    expect(s.ending).toBeDefined();
    const v = composeVaar(s);
    expect(v.stanzas.length).toBeGreaterThan(3);
    for (const st of v.stanzas) expect(st).not.toMatch(/undefined|NaN/);
  });
});

describe('respect rules in the text', () => {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(f)) files.push(p);
    }
  };
  walk(join(__dirname, '../src'));
  it('names of the Gurus always carry "Ji"', () => {
    const re = /Guru (Nanak Dev|Angad Dev|Amar Das|Ram Das|Arjan Dev|Hargobind|Har Rai|Har Krishan|Tegh Bahadur|Gobind Singh)(?! Ji)/;
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      expect(re.test(text), f).toBe(false);
    }
  });
  it('no action or event offers a Sikh faction desecration', () => {
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      expect(/type: 'desecrate'/.test(text), f).toBe(false);
    }
  });
});

describe('history beyond the Punjab', () => {
  it('starts each era with the subcontinent as it stood', async () => {
    const { newGame } = await import('../src/engine/setup');
    const g48 = newGame({ scenarioId: 's1748', playerFaction: 'ahluwalia', seed: 1 });
    expect(g48.regions.murshidabad.owner).toBe('nawab_bengal');
    expect(g48.regions.calcutta.owner).toBe('company');
    const g99 = newGame({ scenarioId: 's1799', playerFaction: 'sukerchakia', seed: 1 });
    expect(g99.regions.murshidabad.owner).toBe('company');
    expect(g99.regions.agra.owner).toBe('maratha');
    const g39 = newGame({ scenarioId: 's1839', playerFaction: 'sukerchakia', seed: 1 });
    expect(g39.regions.pune.owner).toBe('company');
    expect(g39.regions.ladakh.owner).toBe('jammu');
  });
  it('moves frontiers on time, but not over land the player holds', async () => {
    const { newGame } = await import('../src/engine/setup');
    const { applyHistory } = await import('../src/engine/history');
    const s = newGame({ scenarioId: 's1748', playerFaction: 'ahluwalia', seed: 2 });
    s.regions.bihar.owner = 'ahluwalia';
    // Jump the calendar to 1765.
    s.turn = (1765 - s.startYear) * 2;
    applyHistory(s);
    expect(s.regions.murshidabad.owner).toBe('company');
    expect(s.regions.bihar.owner).toBe('ahluwalia');
    expect(s.chronicle.some((c) => /not where the Khalsa/.test(c.text))).toBe(true);
  });
});

describe('ages and alternative history', () => {
  it('opens a new age with an era page, named after the player’s own story', async () => {
    const { newGame } = await import('../src/engine/setup');
    const { endTurn } = await import('../src/engine/turn');
    let s = newGame({ scenarioId: 's1748', playerFaction: 'bhangi', seed: 5 });
    expect(s.summary?.era).toBeUndefined();
    // Jump to the last turn of 1764 and play into 1765.
    s.turn = (1764 - s.startYear) * 2 + 1;
    s = endTurn(s);
    expect(s.summary?.era?.title).toBe('The Misl Raj');
    expect(s.summary?.era?.lines.length).toBeGreaterThan(2);
  });
  it('lets another misl proclaim the Sarkar early, and names the age for it', async () => {
    const { newGame } = await import('../src/engine/setup');
    const { eligible, resolveEventChoice, runEvents } = await import('../src/engine/events');
    const { EVENT_BY_ID } = await import('../src/data/events/index');
    const { eraTitle } = await import('../src/engine/eras');
    const s = newGame({ scenarioId: 's1767', playerFaction: 'bhangi', seed: 9 });
    const take = ['lahore', 'amritsar', 'kasur', 'gujranwala', 'sialkot', 'wazirabad', 'jalandhar', 'kapurthala', 'batala', 'pathankot', 'sheikhupura', 'chunian'];
    for (const r of take) s.regions[r].owner = 'bhangi';
    s.factions.bhangi.piri = 70;
    expect(eligible(s, EVENT_BY_ID.khalsa_raj_early)).not.toBeNull();
    runEvents(s);
    const pe = s.pendingEvents.find((p) => p.eventId === 'khalsa_raj_early')!;
    expect(pe).toBeDefined();
    resolveEventChoice(s, pe.id, 0);
    expect(s.factions.bhangi.sarkar).toBe(true);
    expect(eraTitle(s, 'misl_raj')).toBe('The Sarkar of the Bhangi');
    expect(eraTitle(s, 'sarkar')).toBe('The Bhangi Sarkar');
  });
});

describe('unifying the Punjab', () => {
  const setup = async (piri: number, miri: number) => {
    const { newGame } = await import('../src/engine/setup');
    const s = newGame({ scenarioId: 's1767', playerFaction: 'bhangi', seed: 4 });
    const { PUNJAB_REGION_IDS } = await import('../src/data/regions');
    const lands = ['lahore', 'amritsar', ...[...PUNJAB_REGION_IDS].filter((r) => r !== 'lahore' && r !== 'amritsar').slice(0, 14)];
    for (const r of lands) s.regions[r].owner = 'bhangi';
    s.factions.bhangi.piri = piri;
    s.factions.bhangi.miri = miri;
    return s;
  };
  it('is out of reach without both high Miri and high Piri', async () => {
    const { canUnify } = await import('../src/engine/unify');
    expect(canUnify(await setup(40, 70), 'bhangi', 'proclamation')).toBe(false);
    expect(canUnify(await setup(70, 40), 'bhangi', 'proclamation')).toBe(false);
    expect(canUnify(await setup(66, 68), 'bhangi', 'proclamation')).toBe(true);
    expect(canUnify(await setup(66, 68), 'bhangi', 'gurmata')).toBe(false); // the assembly asks more Piri
  });
  it('proclaims the Sikh Empire, by that name', async () => {
    const { applyAction } = await import('../src/engine/actions');
    const { polityName } = await import('../src/engine/query');
    const s = await setup(66, 68);
    const r = applyAction(s, { type: 'proclaimEmpire' });
    expect(r.error).toBeUndefined();
    expect(r.state.factions.bhangi.sarkar).toBe(true);
    expect(polityName(r.state, 'bhangi')).toBe('the Sikh Empire');
  });
  it('lets misls that vote for you join the empire through the Sarbat Khalsa', async () => {
    const { castVote, finishSarbat, assembly } = await import('../src/engine/sarbat');
    const s = await setup(80, 70);
    for (const f of assembly(s)) if (f !== 'bhangi') s.factions[f].attitude.bhangi = 60;
    expect(castVote(s, '', true, 'unify')).toBe(true);
    const g = s.gurmatas.find((x) => x.kind === 'unify')!;
    // Make the vote decisive for the test: every other misl agrees.
    g.votesFor = assembly(s);
    g.votesAgainst = [];
    const joiner = assembly(s).find((f) => f !== 'bhangi' && f !== 'phulkian')!;
    finishSarbat(s);
    expect(s.factions.bhangi.sarkar).toBe(true);
    expect(s.factions[joiner].alive).toBe(false);
  });
});

describe('the Khabar', () => {
  it('fills with dated news, history and bazaar talk as seasons pass', async () => {
    const { newGame } = await import('../src/engine/setup');
    const { endTurn } = await import('../src/engine/turn');
    let s = newGame({ scenarioId: 's1748', playerFaction: 'ahluwalia', seed: 3 });
    for (let i = 0; i < 6; i++) s = endTurn(s);
    const k = s.khabar ?? [];
    expect(k.length).toBeGreaterThan(10);
    expect(k.some((x) => x.headline === 'The Nizam is gone')).toBe(true);
    expect(new Set(k.map((x) => x.desk)).size).toBeGreaterThan(3);
  });
});

describe('the war of 1845, the years beyond, reforms and taxes', () => {
  it('brings the Company across the Sutlej in the cold season of 1845', async () => {
    const { newGame } = await import('../src/engine/setup');
    const { eligible } = await import('../src/engine/events');
    const { EVENT_BY_ID } = await import('../src/data/events/index');
    const s = newGame({ scenarioId: 's1839', playerFaction: 'sukerchakia', seed: 2, difficulty: 'gentle' });
    s.turn = (1845 - s.startYear) * 2 + (s.startFestival === 'diwali' ? 0 : 1);
    expect(eligible(s, EVENT_BY_ID.first_war)).not.toBeNull();
  });
  it('lets the player ride on past 1849 with the world still running', async () => {
    const { newGame } = await import('../src/engine/setup');
    const { endTurn } = await import('../src/engine/turn');
    const { applyAction } = await import('../src/engine/actions');
    const { date } = await import('../src/engine/query');
    let s = newGame({ scenarioId: 's1839', playerFaction: 'sukerchakia', seed: 2 });
    s.phase = 'ended';
    s.ending = { kind: 'sovereign', turn: s.turn };
    s.turn = (1849 - s.startYear) * 2;
    const r = applyAction(s, { type: 'rideOn' });
    expect(r.error).toBeUndefined();
    s = r.state;
    for (let i = 0; i < 3; i++) s = endTurn(s);
    expect(s.phase).not.toBe('ended');
    expect(date(s).year).toBeGreaterThan(1849);
  });
  it('studies a reform over seasons and applies its bonus', async () => {
    const { newGame } = await import('../src/engine/setup');
    const { applyAction } = await import('../src/engine/actions');
    const { endTurn } = await import('../src/engine/turn');
    const { factionMods, hasReform } = await import('../src/engine/reforms');
    let s = newGame({ scenarioId: 's1767', playerFaction: 'bhangi', seed: 6 });
    s.factions.bhangi.treasury = 500;
    s = applyAction(s, { type: 'beginReform', id: 'revenue_daftar' }).state;
    expect(s.factions.bhangi.flags.studying).toBe('revenue_daftar');
    for (let i = 0; i < 3; i++) s = endTurn(s);
    expect(hasReform(s, 'bhangi', 'revenue_daftar')).toBe(true);
    expect(factionMods(s, 'bhangi').revenue).toBeGreaterThan(1);
  });
  it('heavy tax raises revenue and lowers stability; towns grow revenue', async () => {
    const { newGame } = await import('../src/engine/setup');
    const { regionRevenue, stabilityTarget } = await import('../src/engine/economy');
    const s = newGame({ scenarioId: 's1767', playerFaction: 'bhangi', seed: 6 });
    const r = Object.values(s.regions).find((x) => x.owner === 'bhangi')!.id;
    const base = regionRevenue(s, r).total;
    const baseStab = stabilityTarget(s, r);
    s.regions[r].tax = 'heavy';
    expect(regionRevenue(s, r).total).toBeGreaterThan(base);
    expect(stabilityTarget(s, r)).toBeLessThan(baseStab);
    s.regions[r].tax = 'normal';
    s.regions[r].town = 3;
    expect(regionRevenue(s, r).total).toBeGreaterThan(base);
  });
});

describe('alerts and puppets', () => {
  it('raises an alert when a house goes to war with the player during the turn', async () => {
    const { newGame } = await import('../src/engine/setup');
    const { endTurn } = await import('../src/engine/turn');
    let s = newGame({ scenarioId: 's1748', playerFaction: 'ahluwalia', seed: 3 });
    // The Durrani come down at Diwali 1748 and are at war with every misl.
    s.factions.durrani.relations.ahluwalia = 'peace';
    s.factions.ahluwalia.relations.durrani = 'peace';
    for (let i = 0; i < 2; i++) s = endTurn(s);
    expect((s.alerts ?? []).some((a) => a.kind === 'war' && a.faction === 'durrani')).toBe(true);
  });
  it('makes a puppet that pays tribute at the level set, and revolts when pushed', async () => {
    const { newGame } = await import('../src/engine/setup');
    const { makeVassal, vassalTurn, liberty } = await import('../src/engine/vassals');
    const { factionIncome } = await import('../src/engine/economy');
    const s = newGame({ scenarioId: 's1767', playerFaction: 'bhangi', seed: 8 });
    const t = 'nakai';
    makeVassal(s, 'bhangi', t);
    const light = (() => { s.factions[t].flags.tribute_level = 'light'; return factionIncome(s, 'bhangi').parts.find((p) => p.label.startsWith('Tribute from'))!.value; })();
    const heavy = (() => { s.factions[t].flags.tribute_level = 'heavy'; return factionIncome(s, 'bhangi').parts.find((p) => p.label.startsWith('Tribute from'))!.value; })();
    expect(heavy).toBeGreaterThan(light);
    s.factions[t].flags.liberty = 99;
    s.factions[t].miri = s.factions.bhangi.miri;
    for (let i = 0; i < 6 && s.factions[t].flags.overlord; i++) vassalTurn(s);
    expect(s.factions[t].flags.overlord).toBeUndefined();
    expect(s.factions.bhangi.relations[t]).toBe('war');
    expect((s.alerts ?? []).some((a) => a.kind === 'revolt')).toBe(true);
    expect(liberty(s, t)).toBe(0);
  });
  it('annexes a loyal puppet after ten seasons', async () => {
    const { newGame } = await import('../src/engine/setup');
    const { makeVassal, annex } = await import('../src/engine/vassals');
    const s = newGame({ scenarioId: 's1767', playerFaction: 'bhangi', seed: 8 });
    makeVassal(s, 'bhangi', 'nakai');
    expect(annex(s, 'nakai')).toBeNull();
    s.turn += 10;
    s.factions.nakai.flags.liberty = 10;
    s.factions.bhangi.treasury = 1000;
    expect(annex(s, 'nakai')).not.toBeNull();
    expect(s.factions.nakai.alive).toBe(false);
  });
});
