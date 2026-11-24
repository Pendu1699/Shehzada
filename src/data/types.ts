// Shared static-data types. These describe data that never changes during a game
// (region attributes, unit types, leader templates). Mutable state lives in engine/state.ts.

export type Terrain = 'plains' | 'bela' | 'jungle' | 'hills' | 'bar' | 'desert' | 'mountain';

export type Doab =
  | 'sind_sagar'
  | 'chaj'
  | 'rachna'
  | 'bari'
  | 'bist_jalandhar'
  | 'malwa'
  | 'hills'
  | 'kashmir'
  | 'multan'
  | 'peshawar'
  | 'derajat'
  | 'doab_ganga'
  | 'afghan'
  | 'baluch'
  | 'sindh'
  | 'rajputana'
  | 'hindustan'
  | 'central'
  | 'gujarat'
  | 'deccan'
  | 'south'
  | 'bengal'
  | 'himalaya'
  | 'tibet'
  | 'ceylon';

export type Resource =
  | 'salt'
  | 'shawls'
  | 'horses'
  | 'saffron'
  | 'timber'
  | 'cotton'
  | 'indigo'
  | 'sugar'
  | 'grain'
  | 'iron'
  | 'camels';

export type SiteKind = 'takht' | 'gurdwara' | 'temple' | 'mosque' | 'shrine' | 'fort' | 'mandi' | 'battlefield';

export interface SacredSite {
  id: string;
  name: string;
  kind: SiteKind;
  /** Sikh sacred sites can be desecrated by hostile non-Sikh powers, which triggers Josh. */
  sikhSacred?: boolean;
  note: string;
}

export interface FaithMix {
  sikh: number;
  hindu: number;
  muslim: number;
  /** Buddhists, Jains, animists and others (the regions beyond the Punjab). */
  other?: number;
}

export interface RegionDef {
  id: string;
  name: string;
  /** The region's seat: [latitude, longitude] in degrees. Used by scripts/build-map.ts. */
  seat: [number, number];
  doab: Doab;
  terrain: Terrain;
  /** 1 (barren) .. 5 (richest canal-and-well land). */
  fertility: number;
  /** Rough population in thousands c.1750. Game estimate, not census data. */
  population: number;
  /** Percent shares, summing to 100. Game estimates for c.1750 (see HISTORY.md). */
  faith: FaithMix;
  /** Starting fort level 0..5. */
  fort: number;
  /** 0..5: mandis, road traffic, caravan routes. */
  trade: number;
  resources: Resource[];
  sites: SacredSite[];
  /** Other towns of the region, drawn as small labels. [name, lat, lon] */
  towns?: [string, number, number][];
  /** True if the region lies on the Grand Trunk Road (invasion highway and trade artery). */
  gtRoad?: boolean;
}
