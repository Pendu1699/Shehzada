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
