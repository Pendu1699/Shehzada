// Revenue, rakhi, jagirs, langar and upkeep. All amounts are in thousands of rupees
// per half-year turn. Every figure is built as a Breakdown so tooltips can explain it.

import { FACTION_BY_ID } from '../data/factions';
import { REGION_BY_ID } from '../data/regions';
import { UNIT_TYPES } from '../data/units';
import { bd, clamp, date, isSikh, type Breakdown, type Part } from './query';
import type { FactionId, GameState, RegionId } from './state';

const RESOURCE_VALUE: Record<string, number> = {
  salt: 5,
  shawls: 9,
  saffron: 4,
  horses: 2,
  timber: 1.5,
  cotton: 2,
  indigo: 2.5,
  sugar: 2,
  grain: 1,
  iron: 1.5,
  camels: 1,
};

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Gross harvest and trade value of a region this turn, before it is divided up. */
export function regionGross(s: GameState, id: RegionId): { land: number; trade: number } {
  const def = REGION_BY_ID[id];
  const st = s.regions[id];
  const d = date(s);
  const season = d.harvest === 'rabi' ? 1 : 0.9;
  const famine = s.regions[id].buildings.includes('canal') ? 1.1 : 1;
  const land = def.population * def.fertility * 0.05 * season * famine * (1 - st.devastation) * (0.55 + st.stability / 220);
  let trade = def.trade * 2.2 * (def.gtRoad ? 1.4 : 1) * (1 - st.devastation * 0.8);
  for (const res of def.resources) trade += RESOURCE_VALUE[res] ?? 0;
  if (id === 'amritsar' && !st.desecrated.includes('harmandir')) trade += 6; // the mandis of Amritsar thrive around the shrine
  if (st.buildings.includes('sarai')) trade *= 1.15;
  return { land, trade };
}

/** What the owner actually collects from one region. */
export function regionRevenue(s: GameState, id: RegionId): Breakdown {
  const st = s.regions[id];
  const owner = st.owner;
  if (!owner) return bd([]);
  const mods = FACTION_BY_ID[owner]?.mods ?? {};
  const { land, trade } = regionGross(s, id);
  const control = st.control / 100;
  const parts: Part[] = [];
  parts.push({ label: 'Land revenue (harvest share)', value: land * control * (mods.revenue ?? 1) });
  parts.push({ label: 'Trade and mandis', value: trade * control * (mods.trade ?? 1) });
  if (st.rakhi && st.rakhi !== owner) parts.push({ label: `Rakhi paid to ${FACTION_BY_ID[st.rakhi]?.name ?? st.rakhi}`, value: -(land + trade) * 0.2 });
  if (st.jagir) {
    const sub = parts.reduce((t, p) => t + p.value, 0);
    parts.push({ label: `Jagir of ${s.leaders[st.jagir]?.name ?? 'a sardar'}`, value: -sub * 0.5 });
  }
  return bd(parts.map((p) => ({ ...p, value: r1(p.value) })));
}

/** Rakhi: a fifth of the produce of protected villages outside your direct rule. */
export function rakhiIncome(s: GameState, f: FactionId): Breakdown {
  const parts: Part[] = [];
  for (const r of Object.values(s.regions)) {
    if (r.rakhi !== f || r.owner === f) continue;
    const { land, trade } = regionGross(s, r.id);
    parts.push({ label: `Rakhi from ${REGION_BY_ID[r.id].name}`, value: r1((land + trade) * 0.2) });
  }
  return bd(parts);
}

export function langarCost(s: GameState, id: RegionId): number {
  const famine = !!s.factions[s.regions[id].owner ?? '']?.flags[`famine_${id}`] || s.regions[id].devastation > 0.3;
  return r1(REGION_BY_ID[id].population * 0.03 * (famine ? 2 : 1));
}

export function armyUpkeep(s: GameState, f: FactionId): number {
  let t = 0;
  for (const a of Object.values(s.armies)) {
    if (a.owner !== f) continue;
    for (const u of a.units) t += (u.men / 100) * (UNIT_TYPES[u.type]?.upkeep ?? 1);
  }
  return r1(t);
}

/** The full half-year account for a faction. */
export function factionIncome(s: GameState, f: FactionId): Breakdown {
  const parts: Part[] = [];
  let land = 0,
    trade = 0,
    rakhiPaid = 0,
    jagir = 0,
    langar = 0,
    forts = 0,
    patronage = 0;
  for (const r of Object.values(s.regions)) {
    if (r.owner !== f) continue;
    const rev = regionRevenue(s, r.id);
    for (const p of rev.parts) {
      if (p.label.startsWith('Land')) land += p.value;
      else if (p.label.startsWith('Trade')) trade += p.value;
      else if (p.label.startsWith('Rakhi')) rakhiPaid += p.value;
      else if (p.label.startsWith('Jagir')) jagir += p.value;
    }
    if (r.langar) langar += langarCost(s, r.id);
    forts += r.fort * 0.5 * (FACTION_BY_ID[f]?.mods.fortCost ?? 1);
    patronage += r.buildings.length * 0.4;
  }
  const chief = s.factions[f].chief ? s.leaders[s.factions[f].chief!] : undefined;
  const adminMult = chief ? 1 + (chief.admin - 3) * 0.03 : 1;
  parts.push({ label: 'Land revenue', value: land * adminMult });
  parts.push({ label: 'Trade and mandis', value: trade });
  if (chief && chief.admin !== 3) parts.push({ label: `Administration of ${chief.name}`, value: 0 });
  const rk = rakhiIncome(s, f).total;
  if (rk) parts.push({ label: 'Rakhi received', value: rk });
  if (rakhiPaid) parts.push({ label: 'Rakhi paid to others', value: rakhiPaid });
  if (jagir) parts.push({ label: 'Revenue held by jagirdars', value: jagir });
  for (const [k, v] of Object.entries(s.factions[f].flags)) {
    if (k.startsWith('tribute_from_') && s.factions[k.slice(13)]?.alive) parts.push({ label: `Tribute from ${FACTION_BY_ID[k.slice(13)]?.name ?? k.slice(13)}`, value: Number(v) });
    if (k.startsWith('tribute_to_') && s.factions[k.slice(11)]?.alive) parts.push({ label: `Tribute to ${FACTION_BY_ID[k.slice(11)]?.name ?? k.slice(11)}`, value: -Number(v) });
  }
  parts.push({ label: 'Army pay and fodder', value: -armyUpkeep(s, f) });
  if (forts) parts.push({ label: 'Fort garrisons and repair', value: -forts });
  if (langar) parts.push({ label: 'Langar', value: -langar });
  if (patronage) parts.push({ label: 'Upkeep of patronage', value: -patronage });
  if (f !== s.playerFaction && FACTION_BY_ID[f]) {
    const diff = s.settings.difficulty;
    const aiBonus = diff === 'hard' ? 0.2 : diff === 'gentle' ? -0.15 : 0;
    if (aiBonus) parts.push({ label: 'Difficulty', value: (land + trade) * aiBonus });
  }
  return bd(parts.map((p) => ({ ...p, value: r1(p.value) })));
}

/** Men available to raise in a region this turn. */
export function recruitPool(s: GameState, id: RegionId, f: FactionId): Breakdown {
  const def = REGION_BY_ID[id];
  const st = s.regions[id];
  const parts: Part[] = [];
  if (isSikh(f)) {
    parts.push({ label: 'Sikh volunteers', value: def.population * def.faith.sikh * 0.12 });
    parts.push({ label: 'Hired men of other faiths', value: def.population * (100 - def.faith.sikh) * 0.03 });
    const piri = s.factions[f].piri;
    parts.push({ label: 'Piri (the Panth answers)', value: (def.population * def.faith.sikh * 0.12 * (piri - 50)) / 100 });
  } else {
    parts.push({ label: 'Levies', value: def.population * 6 });
  }
  if (st.langar) parts.push({ label: 'Langar', value: def.population * 3 });
  parts.push({ label: 'Control', value: -(1 - st.control / 100) * def.population * 4 });
  if (s.josh.active && isSikh(f)) parts.push({ label: 'Josh: volunteers flood in', value: def.population * def.faith.sikh * 0.1 });
  const b = bd(parts.map((p) => ({ ...p, value: Math.round(p.value) })));
  b.total = Math.max(0, Math.round(b.total / 50) * 50);
  return b;
}

export function recruitCost(_s: GameState, f: FactionId, unitId: string, men: number): number {
  const u = UNIT_TYPES[unitId];
  let c = (u.cost * men) / 100;
  const mods = FACTION_BY_ID[f]?.mods ?? {};
  if (u.cls === 'cavalry' && mods.recruitCost) c *= mods.recruitCost;
  if (u.cls === 'artillery' && mods.artillery) c /= mods.artillery;
  if (unitId === 'nihang' && f === 'shaheedan') c *= 0.7;
  return r1(c);
}

/** Apply the turn's income; handle arrears. Returns the breakdown applied. */
export function collectIncome(s: GameState, f: FactionId): Breakdown {
  const inc = factionIncome(s, f);
  const fs = s.factions[f];
  fs.treasury = r1(fs.treasury + inc.total);
  fs.lastIncome = inc.total;
  return inc;
}

export function stabilityTarget(s: GameState, id: RegionId): number {
  const st = s.regions[id];
  const def = REGION_BY_ID[id];
  const owner = st.owner;
  if (!owner) return 50;
  let t = 50;
  const fs = s.factions[owner];
  if (isSikh(owner)) {
    t += (fs.piri - 50) * 0.4;
    t += def.faith.sikh * 0.15;
  } else {
    t += def.faith.muslim > 60 && ['mughal', 'durrani', 'kasur', 'multan', 'peshawar', 'bahawalpur', 'malerkotla'].includes(owner) ? 10 : 0;
  }
  if (st.langar) t += 10;
  t += st.buildings.length * 3;
  t -= st.devastation * 40;
  t -= (100 - st.control) * 0.2;
  return clamp(t, 5, 100);
}
