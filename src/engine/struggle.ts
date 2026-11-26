// The Long Struggle, 1849–1947: a political game after the annexation.
//
// The player leads a movement, not an army. In each region of the Punjab it
// builds support and plants cells (its spies and organisers); it prints
// papers, sends envoys to foreign courts and the diaspora, holds peaceful
// morchas, hunts the informers the British plant among it — and, only when the
// ground is ready, rises. The British answer with "heat": raids, arrests and
// informers. History runs alongside (data/events/struggle.ts).

import { ASKS, MELA_REGIONS, VENTURES, contactOf, type Ask, type Venture } from '../data/abroad';
import { PUNJAB_REGION_IDS, REGION_BY_ID } from '../data/regions';
import { UNIT_TYPES } from '../data/units';
import { addRecruits } from './ai';
import { chronicle } from './chronicle';
import { transferRegion } from './conquest';
import { report } from './khabar';
import { neighbors } from './map';
import { changePiri } from './miripiri';
import { armiesIn, armyMen, clamp, year } from './query';
import { chance, pick, rand } from './rng';
import type { GameState, RegionId } from './state';
import { alert } from './vassals';

export type Power = 'france' | 'russia' | 'afghanistan' | 'ireland' | 'america' | 'germany' | 'japan';

export interface StruggleState {
  support: Record<RegionId, number>;
  /** Cells (spies and organisers) per region, 0–3. */
  cells: Record<RegionId, number>;
  /** Informers the British have planted, per region (unknown to the player until hunted). */
  informers: Record<RegionId, number>;
  heat: number;
  influence: Record<Power, number>;
  organisers: number;
  actionsLeft: number;
  press: boolean;
  /** Region the police mean to raid next season (if known to the player's spies, an alert warns). */
  raid?: RegionId;
  lyingLow: RegionId[];
  gurdwaraReform: number;
  arrests: number;
  /** Shipments of arms hidden for a rising. */
  arms?: number;
  /** How far the world has heard the Panth's cause (0–100). */
  voice?: number;
  /** The turn of the last meeting with each power. */
  met?: Partial<Record<Power, number>>;
  /** Businesses and institutions the movement has founded. */
  ventures?: Venture[];
  /** The turn each region was last asked for money. */
  collected?: Record<RegionId, number>;
  /** Last season's accounts. */
  ledger?: { label: string; value: number }[];
  /** After 1947: progress of the Punjabi Suba movement (0–100). */
  suba?: number;
}

export const POWERS: Record<Power, { name: string; from: number; to: number; detail: string }> = {
  france: { name: 'France', from: 1849, to: 1947, detail: 'Paris sheltered exiles; Duleep Singh plotted there in the 1880s.' },
  russia: { name: 'Russia', from: 1849, to: 1917, detail: 'The Great Game: the Tsar’s generals looked toward India over the Pamirs.' },
  afghanistan: { name: 'Kabul', from: 1849, to: 1947, detail: 'The amirs played the British and the Russians against each other.' },
  ireland: { name: 'The Irish', from: 1860, to: 1922, detail: 'Fenians and later Sinn Féin, who also fought the British Crown, and traded help.' },
  america: { name: 'The diaspora in America', from: 1900, to: 1966, detail: 'Punjabi farmers and mill-hands of California and British Columbia; the Ghadar Party printed its paper in San Francisco.' },
  germany: { name: 'Germany', from: 1900, to: 1945, detail: 'In both world wars Berlin courted Indian revolutionaries.' },
  japan: { name: 'Japan', from: 1937, to: 1945, detail: 'The Indian National Army was raised with Japanese backing.' },
};

export const isStruggle = (s: GameState) => s.mode === 'struggle';
export const punjab = () => [...PUNJAB_REGION_IDS];

export function initStruggle(s: GameState): void {
  const support: Record<string, number> = {};
  const cells: Record<string, number> = {};
  const informers: Record<string, number> = {};
  for (const r of punjab()) {
    const def = REGION_BY_ID[r];
    support[r] = Math.round(5 + def.faith.sikh * 0.4);
    cells[r] = 0;
    informers[r] = 0;
  }
  for (const r of ['amritsar', 'lahore', 'tarn_taran', 'gujranwala']) if (support[r] !== undefined) support[r] += 10;
  cells.amritsar = 1;
  s.struggle = {
    support,
    cells,
    informers,
    heat: 30,
    influence: { france: 5, russia: 5, afghanistan: 10, ireland: 0, america: 0, germany: 0, japan: 0 },
    organisers: 3,
    actionsLeft: 3,
    press: false,
    lyingLow: [],
    gurdwaraReform: 0,
    arrests: 0,
    arms: 0,
    voice: 0,
    met: {},
    ventures: [],
    collected: {},
    ledger: [],
  };
}

export const avgSupport = (s: GameState) => {
  const st = s.struggle;
  if (!st) return 0;
  const rs = punjab().filter((r) => REGION_BY_ID[r].faith.sikh >= 10);
  return Math.round(rs.reduce((t, r) => t + (st.support[r] ?? 0), 0) / Math.max(1, rs.length));
};

export const powerOpen = (s: GameState, p: Power) => year(s) >= POWERS[p].from && year(s) <= POWERS[p].to;

/** The British strength in a region: garrisons there and next door. */
export function garrison(s: GameState, r: RegionId): number {
  const gov = s.flags?.transferred ? 'india' : 'company';
  let t = armiesIn(s, r).filter((a) => a.owner === gov).reduce((n, a) => n + armyMen(a), 0);
  for (const e of neighbors(r)) t += armiesIn(s, e.to).filter((a) => a.owner === gov).reduce((n, a) => n + armyMen(a), 0) * 0.3;
  return t + 2000;
}

/* ── Actions ─────────────────────────────────────────────────────────────── */

export type StruggleAct = 'organise' | 'cell' | 'morcha' | 'lie_low' | 'rise' | 'hunt' | 'press' | 'print' | 'petition' | 'envoy' | 'meet' | 'collect' | 'venture';

export const ACT_INFO: Record<StruggleAct, { name: string; cost: number; detail: string }> = {
  organise: { name: 'Organise', cost: 5, detail: 'Meetings in the villages and the gurdwaras. Support +8 here (more with cells).' },
  cell: { name: 'Plant a cell', cost: 10, detail: 'Organisers and spies in the bazaars, the cantonment and the police lines. Up to three cells; they warn of raids and make risings safer.' },
  morcha: { name: 'Hold a morcha', cost: 10, detail: 'A peaceful agitation at a gurdwara or a court: jathas court arrest by the hundred. Great support here and around, Piri — and heat.' },
  lie_low: { name: 'Lie low', cost: 0, detail: 'Hide the papers and the men here this season. A raid finds nothing.' },
  rise: { name: 'Rise', cost: 40, detail: 'Raise the region in revolt and take it from the British. Needs support 70 and two cells. Failure is ruinous.' },
  hunt: { name: 'Hunt informers', cost: 15, detail: 'Find the police informers planted among your people, across the Punjab. Heat −10.' },
  press: { name: 'Set up a press', cost: 30, detail: 'A secret press, to print papers and pamphlets in Gurmukhi and Urdu.' },
  print: { name: 'Print the paper', cost: 10, detail: 'Support +3 wherever you have a cell; heat +6.' },
  petition: { name: 'Petition the Crown', cost: 5, detail: 'Memorials, deputations, loyal addresses. Heat −8; the hot-heads grumble (support −1).' },
  envoy: { name: 'Send an envoy', cost: 20, detail: 'Seek friends abroad. Influence with that power +12.' },
  meet: { name: 'Meet', cost: 10, detail: 'Sit down with them and ask for something: money, arms, shelter for exiles, or a voice in the world. Needs influence 20; once every two years with each power.' },
  collect: { name: 'Collect funds', cost: 0, detail: 'Pass the bowl at the gurdwaras and the melas. The more support here, the more is given; asking the same villages too often brings less.' },
  venture: { name: 'Found', cost: 0, detail: 'Found a business or institution that pays the movement every season.' },
};

/* ── Friends abroad: meetings ───────────────────────────────────────────── */

export const MEET_MIN = 20;
export const MEET_EVERY = 4;

const atWorldWar = (y: number) => (y >= 1914 && y <= 1918) || (y >= 1939 && y <= 1945);

/** How a power answers each kind of ask (1 = ordinary). */
function askBias(power: Power, ask: Ask, y: number): number {
  const war = atWorldWar(y);
  const table: Record<Power, Record<Ask, number>> = {
    france: { funds: 0.8, arms: 0.4, shelter: 1.3, voice: 1.2 },
    russia: { funds: 1, arms: 1, shelter: 1, voice: 0.7 },
    afghanistan: { funds: 0.7, arms: 1.1, shelter: 1.2, voice: 0.5 },
    ireland: { funds: 0.7, arms: 0.9, shelter: 0.9, voice: 1.2 },
    america: { funds: 1.4, arms: 0.9, shelter: 1.1, voice: 1.2 },
    germany: { funds: war ? 1.4 : 0.8, arms: war ? 1.5 : 0.5, shelter: 0.9, voice: 0.8 },
    japan: { funds: 1, arms: 1.4, shelter: 0.8, voice: 0.8 },
  };
  return table[power][ask];
}

export function askChance(s: GameState, power: Power, ask: Ask): number {
  const st = s.struggle;
  if (!st) return 0;
  const inf = st.influence[power];
  if (inf < MEET_MIN) return 0;
  const base = { funds: 0.3, arms: 0.15, shelter: 0.4, voice: 0.4 }[ask];
  return clamp((base + inf / 140) * askBias(power, ask, year(s)), 0.05, 0.9);
}

/** Seasons until the power will meet again (0: now). */
export function meetWait(s: GameState, power: Power): number {
  const last = s.struggle?.met?.[power];
  return last === undefined ? 0 : Math.max(0, last + MEET_EVERY - s.turn);
}

/** What asking for money would bring, if they agree. */
export function fundsOffered(s: GameState, power: Power): number {
  const inf = s.struggle?.influence[power] ?? 0;
  return Math.round((15 + inf * 0.8) * askBias(power, 'funds', year(s)));
}

/* ── Paying for it ──────────────────────────────────────────────────────── */

/** What passing the bowl in a region would bring. */
export function collectAmount(s: GameState, r: RegionId): number {
  const st = s.struggle;
  if (!st) return 0;
  const sup = st.support[r] ?? 0;
  let amt = 2 + sup * 0.2 + REGION_BY_ID[r].population / 120;
  if (MELA_REGIONS[r]) amt *= 1.5;
  const last = st.collected?.[r];
  if (last !== undefined && s.turn - last < 4) amt *= 0.4;
  return Math.max(1, Math.round(amt));
}

export function ventureOpen(s: GameState, v: Venture): boolean {
  const st = s.struggle;
  if (!st) return false;
  if (year(s) < VENTURES[v].from || (st.ventures ?? []).includes(v)) return false;
  if (v === 'farms' && st.influence.america < 10) return false;
  return true;
}

/** Income of a venture this season. */
export function ventureIncome(s: GameState, v: Venture): number {
  const st = s.struggle!;
  const base = VENTURES[v].income;
  switch (v) {
    case 'bank':
      return Math.round(base + avgSupport(s) * 0.05);
    case 'farms':
      return Math.round(base + st.influence.america * 0.08);
    case 'trade':
      return Math.round(base + (st.support.amritsar ?? 0) * 0.02);
    default:
      return base;
  }
}

export function riseChance(s: GameState, r: RegionId): number {
  const st = s.struggle!;
  const support = st.support[r] ?? 0;
  const cells = st.cells[r] ?? 0;
  // The Punjabi Suba was won by morchas, not risings.
  if (s.flags?.transferred) return 0;
  if (support < 70 || cells < 2) return 0;
  const foreign = Object.values(st.influence).reduce((t, v) => t + v, 0);
  const g = garrison(s, r);
  let c = 0.15 + (support - 70) / 100 + cells * 0.08 + Math.min(4, st.arms ?? 0) * 0.07 + foreign / 600 - g / 60000 - (st.informers[r] ?? 0) * 0.15 - st.heat / 400;
  // A world war draws the British army away.
  if ((year(s) >= 1914 && year(s) <= 1918) || (year(s) >= 1939 && year(s) <= 1945)) c += 0.12;
  return clamp(c, 0.02, 0.85);
}

/** Do one action of the movement. Returns a message, or null if it cannot be done. */
export function struggleAct(s: GameState, act: StruggleAct, region?: RegionId, power?: Power, ask?: Ask, venture?: Venture): string | null {
  const st = s.struggle;
  const p = s.playerFaction;
  const fs = s.factions[p];
  if (!st || !isStruggle(s)) return null;
  const info = ACT_INFO[act];
  const freeAct = act === 'lie_low';
  if (!freeAct && st.actionsLeft <= 0) return null;
  if (fs.treasury < info.cost) return null;
  if (region && !PUNJAB_REGION_IDS.has(region)) return null;
  const spend = () => {
    fs.treasury -= info.cost;
    if (!freeAct) st.actionsLeft -= 1;
  };
  const name = region ? REGION_BY_ID[region].name : '';
  switch (act) {
    case 'organise': {
      if (!region) return null;
      spend();
      st.support[region] = clamp((st.support[region] ?? 0) + 8 + (st.cells[region] ?? 0) * 2, 0, 100);
      st.heat = clamp(st.heat + 2, 0, 100);
      return `Meetings were held in the villages of ${name}.`;
    }
    case 'cell': {
      if (!region || (st.cells[region] ?? 0) >= 3) return null;
      spend();
      // The more the police are watching, the likelier a new cell takes in an informer.
      if (chance(s, st.heat / 220)) st.informers[region] = (st.informers[region] ?? 0) + 1;
      st.cells[region] = (st.cells[region] ?? 0) + 1;
      st.heat = clamp(st.heat + 1, 0, 100);
      return `A new cell was formed in ${name}.`;
    }
    case 'morcha': {
      if (!region || (st.support[region] ?? 0) < 35) return null;
      spend();
      st.support[region] = clamp((st.support[region] ?? 0) + 15, 0, 100);
      for (const e of neighbors(region)) if (st.support[e.to] !== undefined) st.support[e.to] = clamp(st.support[e.to] + 4, 0, 100);
      st.heat = clamp(st.heat + 10, 0, 100);
      changePiri(s, p, 3, `A morcha at ${name}`);
      // Sometimes the police fire on the jathas — and the whole Punjab answers.
      if (chance(s, 0.15)) {
        for (const r of punjab()) st.support[r] = clamp((st.support[r] ?? 0) + 4, 0, 100);
        report(s, `Firing on the jathas at ${name}`, `The police fired on the jathas at ${name}. They did not lift a hand in return. The news ran through every village of the Punjab.`, { region, weight: 3 });
      }
      if (region === 'amritsar' && year(s) >= 1920) st.gurdwaraReform = clamp(st.gurdwaraReform + 25, 0, 100);
      if (s.flags?.suba) st.suba = clamp((st.suba ?? 0) + (region === 'amritsar' ? 12 : 6) + Math.round((st.support[region] ?? 0) / 20), 0, 100);
      return `Jatha after jatha courted arrest at ${name}, singing, unarmed.`;
    }
    case 'lie_low': {
      if (!region) return null;
      if (!st.lyingLow.includes(region)) st.lyingLow.push(region);
      return `In ${name} the papers were buried and the men went to their fields.`;
    }
    case 'rise': {
      if (!region) return null;
      const c = riseChance(s, region);
      if (c <= 0) return null;
      spend();
      // The hidden rifles come out of the wells and the haystacks.
      st.arms = Math.max(0, (st.arms ?? 0) - 2);
      if (chance(s, c)) {
        transferRegion(s, region, p, 55);
        const men = Math.round(REGION_BY_ID[region].population * ((st.support[region] ?? 0) / 100) * 40);
        addRecruits(s, p, region, UNIT_TYPES.nihang ? 'nihang' : 'ghorchare', Math.max(1000, Math.round(men * 0.4 / 100) * 100));
        addRecruits(s, p, region, 'ghorchare', Math.max(1000, Math.round(men * 0.6 / 100) * 100));
        s.factions[p].relations.company = 'war';
        s.factions.company.relations[p] = 'war';
        st.heat = 100;
        chronicle(s, 'conquest', `${name} rose, and the Nishan Sahib flew over its kotwali again.`, { faction: p, region, weight: 8 });
        return `${name} has risen! The British garrison is driven out.`;
      }
      st.support[region] = clamp((st.support[region] ?? 0) - 30, 0, 100);
      st.cells[region] = 0;
      st.heat = clamp(st.heat + 30, 0, 100);
      st.arrests += 1;
      chronicle(s, 'loss', `The rising in ${name} was betrayed and broken. Its leaders were transported to the Andamans.`, { faction: p, region, weight: 5 });
      return `The rising in ${name} failed. Its leaders were hanged or sent to the Andamans.`;
    }
    case 'hunt': {
      spend();
      let found = 0;
      for (const r of punjab()) {
        if ((st.informers[r] ?? 0) > 0 && chance(s, 0.6)) {
          found += st.informers[r];
          st.informers[r] = 0;
        }
      }
      st.heat = clamp(st.heat - 10, 0, 100);
      return found ? `${found} informer${found > 1 ? 's were' : ' was'} found among your people and cast out.` : 'No informers were found — this time.';
    }
    case 'press': {
      if (st.press) return null;
      spend();
      st.press = true;
      return 'A press was set up in a back room, its type cast in Gurmukhi.';
    }
    case 'print': {
      if (!st.press) return null;
      spend();
      for (const r of punjab()) if ((st.cells[r] ?? 0) > 0) st.support[r] = clamp((st.support[r] ?? 0) + 3, 0, 100);
      if (st.influence.america > 0) st.influence.america = clamp(st.influence.america + 2, 0, 100);
      st.heat = clamp(st.heat + 6, 0, 100);
      return `${paperName(s)} went out to the villages, read aloud at the wells.`;
    }
    case 'petition': {
      spend();
      st.heat = clamp(st.heat - 8, 0, 100);
      for (const r of punjab()) st.support[r] = clamp((st.support[r] ?? 0) - 1, 0, 100);
      return s.flags?.transferred ? 'A memorandum went to Delhi, with many signatures.' : 'A memorial went up to the Lieutenant-Governor, with many signatures.';
    }
    case 'envoy': {
      if (!power || !powerOpen(s, power)) return null;
      spend();
      st.influence[power] = clamp(st.influence[power] + 12, 0, 100);
      st.heat = clamp(st.heat + 3, 0, 100);
      return `An envoy reached ${POWERS[power].name}.`;
    }
    case 'meet': {
      if (!power || !ask || !powerOpen(s, power) || meetWait(s, power) > 0) return null;
      const who = contactOf(power, year(s));
      if (!who || st.influence[power] < MEET_MIN) return null;
      const pr = askChance(s, power, ask);
      spend();
      st.met = { ...(st.met ?? {}), [power]: s.turn };
      // British intelligence watched the exiles abroad.
      let tail = '';
      if (chance(s, 0.08 + st.heat / 400)) {
        st.heat = clamp(st.heat + 8, 0, 100);
        tail = ' British intelligence had a man in the room: the police at home know of it.';
      }
      if (!chance(s, pr)) {
        st.influence[power] = clamp(st.influence[power] - 4, 0, 100);
        return `${who.name} heard your envoy out, and promised nothing.${tail}`;
      }
      switch (ask) {
        case 'funds': {
          const amt = fundsOffered(s, power);
          fs.treasury += amt;
          st.influence[power] = clamp(st.influence[power] - 12, 0, 100);
          return `${who.name} gave ₹${amt}k to the cause.${tail}`;
        }
        case 'arms': {
          st.influence[power] = clamp(st.influence[power] - 10, 0, 100);
          if (chance(s, clamp(0.2 + st.heat / 300 - st.influence[power] / 400, 0.05, 0.6))) {
            st.heat = clamp(st.heat + 15, 0, 100);
            chronicle(s, 'loss', `A shipment of rifles from ${POWERS[power].name} was seized at sea.`, { faction: p, weight: 3 });
            return `${who.name} sent rifles — but the ship was searched and seized, and the police know who they were for.${tail}`;
          }
          st.arms = (st.arms ?? 0) + 1;
          st.heat = clamp(st.heat + 4, 0, 100);
          return `${who.name} sent rifles. They came ashore in crates of machine parts and are hidden in the villages.${tail}`;
        }
        case 'shelter': {
          st.heat = clamp(st.heat - 18, 0, 100);
          st.influence[power] = clamp(st.influence[power] - 6, 0, 100);
          return `${who.name} will shelter your hunted men. The police have lost the trail.${tail}`;
        }
        case 'voice': {
          st.voice = clamp((st.voice ?? 0) + 8 + Math.round(st.influence[power] / 10), 0, 100);
          st.influence[power] = clamp(st.influence[power] - 5, 0, 100);
          return `${who.name} raised the Punjab’s cause in ${POWERS[power].name === 'Kabul' ? 'the darbar' : 'the press and the halls of government'}. ${ASKS.voice.name}: the world hears a little more.${tail}`;
        }
      }
      return null;
    }
    case 'collect': {
      if (!region) return null;
      const amt = collectAmount(s, region);
      spend();
      fs.treasury += amt;
      st.collected = { ...(st.collected ?? {}), [region]: s.turn };
      st.heat = clamp(st.heat + 1, 0, 100);
      const mela = MELA_REGIONS[region];
      return mela ? `At ${mela} the sangat gave ₹${amt}k to the cause.` : `The villages of ${name} gave ₹${amt}k to the cause.`;
    }
    case 'venture': {
      if (!venture || !ventureOpen(s, venture)) return null;
      const v = VENTURES[venture];
      if (fs.treasury < v.cost) return null;
      spend();
      fs.treasury -= v.cost;
      st.ventures = [...(st.ventures ?? []), venture];
      if (venture === 'school') {
        for (const r of punjab()) st.support[r] = clamp((st.support[r] ?? 0) + 3, 0, 100);
        st.organisers += 1;
      }
      return `${v.name}: founded.`;
    }
  }
  return null;
}

export function paperName(s: GameState): string {
  const y = year(s);
  if (y >= 1947) return 'Akali Patrika';
  if (y >= 1926) return 'The Kirti';
  if (y >= 1920) return 'The Akali';
  if (y >= 1913) return 'Ghadar';
  if (y >= 1886) return 'The Khalsa Akhbar';
  return 'The pamphlet';
}

/* ── The season ─────────────────────────────────────────────────────────── */

/** Each turn of the Long Struggle: donations, decay, the British answer. */
export function struggleTurn(s: GameState): void {
  const st = s.struggle;
  if (!st || !isStruggle(s)) return;
  const p = s.playerFaction;
  const fs = s.factions[p];
  const y = year(s);
  // The movement cannot be destroyed by losing its land (older saves marked it fallen).
  fs.alive = true;
  // Older saves wore the movement's Piri away under the sarbrah's toll, which now falls on others; give it back once.
  if (!fs.flags.piri_restored) {
    fs.flags.piri_restored = true;
    if (fs.piri < 45) fs.piri = 45;
  }
  // The season's accounts: what came in, and what the work cost.
  const ledger: { label: string; value: number }[] = [];
  ledger.push({ label: 'Donations of the sangat', value: Math.round(4 + avgSupport(s) * 0.16) });
  const abroad = Math.round(st.influence.america * 0.1 + Object.values(st.influence).reduce((t, v) => t + v, 0) * 0.02);
  if (abroad) ledger.push({ label: 'Remittances from abroad', value: abroad });
  if (st.press) ledger.push({ label: `Subscriptions to ${paperName(s)}`, value: Math.round(1 + avgSupport(s) * 0.05) });
  for (const v of st.ventures ?? []) {
    const inc = ventureIncome(s, v);
    if (inc) ledger.push({ label: VENTURES[v].name, value: inc });
  }
  if (s.flags?.gurdwaras_freed) ledger.push({ label: 'The golak of the freed gurdwaras', value: 10 });
  ledger.push({ label: 'Keep of the organisers', value: -st.organisers });
  if (st.press) ledger.push({ label: 'Paper, ink and the press', value: -2 });
  if (st.raid && !st.lyingLow.includes(st.raid)) ledger.push({ label: 'Lawyers for the arrested', value: -5 });
  // The Press Act of 1910: papers deposited a security, forfeited at the government's pleasure.
  if (st.press && y >= 1910 && st.heat >= 60 && chance(s, 0.15)) {
    ledger.push({ label: y >= 1947 ? 'Security forfeited under the press laws' : 'Security forfeited under the Press Act', value: -15 });
    alert(s, { kind: 'unrest', title: 'The Press Act', text: `The government has forfeited the security of ${paperName(s)}. A new deposit had to be found.` });
  }
  const net = ledger.reduce((t, l) => t + l.value, 0);
  fs.treasury = Math.max(0, fs.treasury + net);
  st.ledger = ledger;
  // Support drifts back toward what the people would feel anyway.
  for (const r of punjab()) {
    const base = 5 + REGION_BY_ID[r].faith.sikh * 0.4;
    st.support[r] = clamp(st.support[r] + (base - st.support[r]) * 0.04, 0, 100);
  }
  for (const k of Object.keys(st.influence) as Power[]) st.influence[k] = clamp(st.influence[k] - (powerOpen(s, k) ? 1 : 8), 0, 100);
  // The raid planned last season.
  if (st.raid) {
    const r = st.raid;
    if (st.lyingLow.includes(r)) {
      report(s, 'A raid finds nothing', `The police raided ${REGION_BY_ID[r].name} and found only farmers in their fields.`, { region: r, weight: 1 });
    } else {
      st.support[r] = clamp(st.support[r] - 15, 0, 100);
      st.cells[r] = Math.max(0, st.cells[r] - 1);
      st.arrests += 1;
      alert(s, { kind: 'unrest', title: `Raid in ${REGION_BY_ID[r].name}`, text: 'The police struck in the night. Men were arrested and a cell was broken.' });
      chronicle(s, 'loss', `The police raided ${REGION_BY_ID[r].name}; men of the movement were taken.`, { faction: p, region: r, weight: 2 });
    }
    st.raid = undefined;
  }
  st.lyingLow = [];
  // The next raid: the police go where support and their informers are.
  st.heat = clamp(st.heat - 3, 0, 100);
  if (chance(s, st.heat / 110)) {
    const cands = punjab().filter((r) => st.support[r] > 30 || st.cells[r] > 0);
    if (cands.length) {
      const weighted = cands.sort((a, b) => st.support[b] + st.informers[b] * 30 - (st.support[a] + st.informers[a] * 30));
      const r = rand(s) < 0.6 ? weighted[0] : pick(s, cands);
      st.raid = r;
      // A cell in the region, or two in Lahore (in the police lines), hears of it.
      if (st.cells[r] > 0 || (st.cells.lahore ?? 0) >= 2) alert(s, { kind: 'unrest', title: `Your spies warn of a raid in ${REGION_BY_ID[r].name}`, text: 'The police mean to strike there next season. Lie low there, or lose a cell.' });
    }
  }
  // Mass arrests when the heat is too great.
  if (st.heat >= 90 && chance(s, 0.4)) {
    st.organisers = Math.max(1, st.organisers - 1);
    for (const r of punjab()) st.support[r] = clamp(st.support[r] - 5, 0, 100);
    alert(s, { kind: 'war', title: 'Mass arrests', text: 'Under new ordinances the leaders of the movement have been rounded up. You have one organiser fewer.' });
  }
  // Organisers return as the movement grows.
  const want = 3 + (y >= 1873 ? 1 : 0) + (y >= 1920 ? 1 : 0) + (avgSupport(s) >= 50 ? 1 : 0) + ((st.ventures ?? []).includes('school') ? 1 : 0);
  if (st.organisers < want && chance(s, 0.3)) st.organisers += 1;
  st.actionsLeft = st.organisers;
  // The Gurdwara Reform Movement: freeing the Takht.
  if (st.gurdwaraReform >= 100 && !s.flags?.gurdwaras_freed) {
    s.flags = { ...(s.flags ?? {}), gurdwaras_freed: true };
    changePiri(s, p, 10, 'The gurdwaras freed from the mahants and the sarbrahs');
    chronicle(s, 'event', 'The gurdwaras passed into the hands of the Panth: the sarbrah left the Akal Takht.', { faction: p, weight: 8 });
    alert(s, { kind: 'submission', title: 'The gurdwaras are free', text: 'The Akal Takht has a jathedar of the Panth again.' });
  }
}

/** The struggle's end, in 1947 (or before, if the Punjab is won). */
export function struggleEnding(s: GameState): 'raj_restored' | 'khalsa_voice' | 'gurdwaras_freed' | 'partition' | 'khalsa_state' | 'punjabi_suba' | 'suba_1966' | null {
  const p = s.playerFaction;
  // After 1947: the Punjabi Suba movement, or a settlement still being made.
  if (s.flags?.transferred) {
    if (!s.flags.suba) return null;
    if ((s.struggle?.suba ?? 0) >= 100) return 'punjabi_suba';
    return year(s) >= 1967 ? 'suba_1966' : null;
  }
  const held = Object.values(s.regions).filter((r) => r.owner === p).map((r) => r.id);
  const won = held.includes('lahore') && held.includes('amritsar') && held.length >= 14;
  if (won) return 'raj_restored';
  const d = year(s);
  if (d < 1947) return null;
  const foreign = Object.values(s.struggle?.influence ?? {}).reduce((t, v) => t + v, 0);
  if (held.length >= 1) return 'khalsa_state';
  if ((avgSupport(s) >= 65 && foreign >= 100) || ((s.struggle?.voice ?? 0) >= 60 && avgSupport(s) >= 50)) return 'khalsa_voice';
  if (s.flags?.gurdwaras_freed) return 'gurdwaras_freed';
  return 'partition';
}
