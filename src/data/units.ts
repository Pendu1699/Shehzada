// Unit types. Numbers are per 100 men. "era" gates when a type can be raised.
//
//   attack   damage dealt per round in open battle
//   defense  damage absorbed
//   morale   staying power (the Nihangs' refusal to retreat is modelled as high morale + noRetreat)
//   speed    movement points per half-year turn (the army moves at its slowest unit's pace)
//   siege    contribution to breaching forts
//   cost     treasury cost to raise 100 men (Rs. thousand)
//   upkeep   treasury cost per turn per 100 men. Misl horsemen were largely
//            self-supporting volunteers who shared in plunder and rakhi, so their
//            upkeep is low; the Sarkar's regular battalions drew monthly pay.

export type UnitClass = 'cavalry' | 'infantry' | 'artillery' | 'irregular';

export interface UnitType {
  id: string;
  name: string;
  /** Short plain-English gloss for tooltips. */
  gloss: string;
  cls: UnitClass;
  attack: number;
  defense: number;
  morale: number;
  speed: number;
  siege: number;
  cost: number;
  upkeep: number;
  /** Which factions can raise it: 'sikh' (any misl), 'sarkar' (the unified Sarkar-i-Khalsa only), or faction ids. */
  raisedBy: string[];
  /** Earliest year it can be raised. */
  from?: number;
  /** Requires a flag on the faction (e.g. European officers in service). */
  requiresFlag?: string;
  noRetreat?: boolean;
  /** Fights at full strength from ambush terrain (light troops). */
  skirmisher?: boolean;
  /** Bonus when the army uses Dhai Phat. */
  dhaiPhat?: boolean;
}

export const UNIT_TYPES: Record<string, UnitType> = {
  // ── Misl era ───────────────────────────────────────────────────────────────
  ghorchare: {
    id: 'ghorchare',
    name: 'Ghorchare',
    gloss: 'Misl horsemen: matchlock, sword and spear. The core of every jatha.',
    cls: 'cavalry',
    attack: 3,
    defense: 2,
    morale: 6,
    speed: 4,
    siege: 0,
    cost: 4,
    upkeep: 0.35,
    raisedBy: ['sikh'],
    dhaiPhat: true,
    skirmisher: true,
  },
  nihang: {
    id: 'nihang',
    name: 'Akali Nihang jatha',
    gloss: 'Blue-clad Akalis: fearless, zealous and impossible to rout.',
    cls: 'cavalry',
    attack: 4,
    defense: 2,
    morale: 10,
    speed: 4,
    siege: 0.5,
    cost: 5,
    upkeep: 0.3,
    raisedBy: ['sikh'],
    noRetreat: true,
    dhaiPhat: true,
  },
  jezailchi: {
    id: 'jezailchi',
    name: 'Jezailchi',
    gloss: 'Musketeers with long matchlocks; steady in defence and in ambush.',
    cls: 'infantry',
    attack: 3,
    defense: 3,
    morale: 5,
    speed: 2,
    siege: 0.5,
    cost: 3,
    upkeep: 0.4,
    raisedBy: ['sikh', 'durrani', 'kasur', 'multan', 'peshawar', 'bahawalpur', 'malerkotla'],
    skirmisher: true,
  },
  zamburak: {
    id: 'zamburak',
    name: 'Zamburak',
    gloss: 'Swivel-guns mounted on camels: mobile firepower.',
    cls: 'artillery',
    attack: 4,
    defense: 1,
    morale: 5,
    speed: 3,
    siege: 1.5,
    cost: 6,
    upkeep: 0.8,
    raisedBy: ['sikh', 'durrani', 'multan', 'bahawalpur'],
  },
  piyada: {
    id: 'piyada',
    name: 'Piyada',
    gloss: 'Irregular foot: village levies with spear and sword.',
    cls: 'irregular',
    attack: 1.5,
    defense: 2,
    morale: 3,
    speed: 2,
    siege: 0.5,
    cost: 1,
    upkeep: 0.2,
    raisedBy: ['*'],
  },
  top: {
    id: 'top',
    name: 'Heavy guns',
    gloss: 'Great bronze guns in the Bhangi manner: slow, but they break walls.',
    cls: 'artillery',
    attack: 3,
    defense: 1,
    morale: 4,
    speed: 1.5,
    siege: 6,
    cost: 10,
    upkeep: 1.5,
    raisedBy: ['sikh', 'mughal', 'durrani', 'maratha'],
  },

  // ── Sarkar era (Sarkar-i-Khalsa) ────────────────────────────────────────────
  fauj_ain_inf: {
    id: 'fauj_ain_inf',
    name: 'Fauj-i-Ain (infantry)',
    gloss: 'Regular battalions drilled in the European manner; the backbone of the Sarkar.',
    cls: 'infantry',
    attack: 5,
    defense: 5,
    morale: 7,
    speed: 2,
    siege: 1,
    cost: 6,
    upkeep: 1.1,
    raisedBy: ['sarkar'],
    from: 1803,
  },
  fauj_ain_cav: {
    id: 'fauj_ain_cav',
    name: 'Fauj-i-Ain (cavalry)',
    gloss: 'Regular cavalry regiments with uniform, drill and pay.',
    cls: 'cavalry',
    attack: 5,
    defense: 3,
    morale: 7,
    speed: 4,
    siege: 0,
    cost: 7,
    upkeep: 1.4,
    raisedBy: ['sarkar'],
    from: 1803,
  },
  fauj_khas: {
    id: 'fauj_khas',
    name: 'Fauj-i-Khas',
    gloss: 'The elite brigade raised in 1822 under Ventura and Allard, with its own standards.',
    cls: 'infantry',
    attack: 7,
    defense: 6,
    morale: 9,
    speed: 2.5,
    siege: 1,
    cost: 10,
    upkeep: 2,
    raisedBy: ['sarkar'],
    from: 1822,
    requiresFlag: 'european_officers',
  },
  topkhana: {
    id: 'topkhana',
    name: 'Topkhana',
    gloss: 'The Sarkar’s artillery park: horse and bullock guns, served by master gunners.',
    cls: 'artillery',
    attack: 7,
    defense: 2,
    morale: 6,
    speed: 2,
    siege: 7,
    cost: 12,
    upkeep: 2.4,
    raisedBy: ['sarkar'],
    from: 1810,
  },
  ghorchara_khas: {
    id: 'ghorchara_khas',
    name: 'Ghorchara Khas',
    gloss: 'Elite irregular cavalry of the old sardar families.',
    cls: 'cavalry',
    attack: 5,
    defense: 3,
    morale: 8,
    speed: 4,
    siege: 0,
    cost: 7,
    upkeep: 1.4,
    raisedBy: ['sarkar'],
    from: 1801,
    dhaiPhat: true,
  },
  be_qawaid: {
    id: 'be_qawaid',
    name: 'Fauj-i-Be-Qawaid',
    gloss: 'Irregulars of the Sarkar: jagirdari horse and garrison foot.',
    cls: 'irregular',
    attack: 2.5,
    defense: 2.5,
    morale: 5,
    speed: 3,
    siege: 0.5,
    cost: 2,
    upkeep: 0.5,
    raisedBy: ['sarkar'],
    from: 1801,
  },

  // ── Other powers ───────────────────────────────────────────────────────────
  durrani_cav: {
    id: 'durrani_cav',
    name: 'Durrani horse',
    gloss: 'Afghan tribal cavalry of the Durrani kings: hard-riding and battle-hardened.',
    cls: 'cavalry',
    attack: 5,
    defense: 3,
    morale: 7,
    speed: 4,
    siege: 0,
    cost: 6,
    upkeep: 1.2,
    raisedBy: ['durrani', 'peshawar'],
  },
  mughal_cav: {
    id: 'mughal_cav',
    name: 'Mughal heavy horse',
    gloss: 'Armoured cavalry of the subahdars and faujdars.',
    cls: 'cavalry',
    attack: 4,
    defense: 4,
    morale: 5,
    speed: 3,
    siege: 0,
    cost: 6,
    upkeep: 1.3,
    raisedBy: ['mughal', 'kasur', 'malerkotla', 'multan', 'bahawalpur'],
  },
  maratha_cav: {
    id: 'maratha_cav',
    name: 'Maratha horse',
    gloss: 'Fast Maratha light cavalry from the Deccan.',
    cls: 'cavalry',
    attack: 4,
    defense: 2,
    morale: 6,
    speed: 4,
    siege: 0,
    cost: 4,
    upkeep: 1,
    raisedBy: ['maratha'],
  },
  hill_levy: {
    id: 'hill_levy',
    name: 'Hill levies',
    gloss: 'Rajput and hill infantry who know every ridge and pass.',
    cls: 'infantry',
    attack: 2.5,
    defense: 3.5,
    morale: 5,
    speed: 2,
    siege: 0.5,
    cost: 2,
    upkeep: 0.5,
    raisedBy: ['hill_states', 'kangra', 'jammu', 'dogra'],
    skirmisher: true,
  },
  gurkha: {
    id: 'gurkha',
    name: 'Gurkha infantry',
    gloss: 'Hardy hill soldiers of the Gorkha kingdom.',
    cls: 'infantry',
    attack: 4,
    defense: 4,
    morale: 8,
    speed: 2,
    siege: 1,
    cost: 4,
    upkeep: 0.9,
    raisedBy: ['gurkha'],
    skirmisher: true,
  },
  sepoy: {
    id: 'sepoy',
    name: 'Company sepoys',
    gloss: 'Bengal Army native infantry, drilled and regularly paid.',
    cls: 'infantry',
    attack: 5,
    defense: 5,
    morale: 6,
    speed: 2,
    siege: 1,
    cost: 6,
    upkeep: 1.1,
    raisedBy: ['company'],
  },
  british_regular: {
    id: 'british_regular',
    name: 'British regulars',
    gloss: 'Queen’s and Company European regiments.',
    cls: 'infantry',
    attack: 6,
    defense: 6,
    morale: 8,
    speed: 2,
    siege: 1,
    cost: 10,
    upkeep: 2,
    raisedBy: ['company'],
  },
  company_cav: {
    id: 'company_cav',
    name: 'Company cavalry',
    gloss: 'Regular and irregular horse of the Bengal Army.',
    cls: 'cavalry',
    attack: 5,
    defense: 3,
    morale: 6,
    speed: 3.5,
    siege: 0,
    cost: 7,
    upkeep: 1.4,
    raisedBy: ['company'],
  },
  horse_artillery: {
    id: 'horse_artillery',
    name: 'Horse artillery',
    gloss: 'Light guns drawn at the gallop, and heavy siege trains behind them.',
    cls: 'artillery',
    attack: 7,
    defense: 2,
    morale: 7,
    speed: 2.5,
    siege: 6,
    cost: 12,
    upkeep: 2.4,
    raisedBy: ['company'],
  },
};

export function canRaise(unit: UnitType, factionId: string, isSikh: boolean, isSarkar: boolean, year: number, flags: Record<string, unknown>): boolean {
  if (unit.from && year < unit.from) return false;
  if (unit.requiresFlag && !flags[unit.requiresFlag]) return false;
  if (flags[`unlock_${unit.id}`]) return true;
  return unit.raisedBy.some((r) => r === '*' || r === factionId || (r === 'sikh' && isSikh) || (r === 'sarkar' && isSarkar));
}
