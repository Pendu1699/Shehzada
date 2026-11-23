// Design tokens: the palette of a Sikh/Pahari-school miniature.
export const PALETTE = {
  kesri: '#E8870E',
  neela: '#1F3A68',
  wasli: '#F2E6C9',
  paper: '#E4D2A8',
  gold: '#C9A13B',
  goldLight: '#E6C766',
  sindoor: '#B83A2B',
  mehndi: '#5E6B2E',
  ink: '#1B1712',
  company: '#9E1B1B',
  river: '#5E8C93',
  riverDeep: '#3F6C74',
} as const;

/** Terrain washes for explored land. */
export const TERRAIN_WASH: Record<string, string> = {
  plains: '#C9C27A',
  bela: '#9DB27C',
  jungle: '#6F8F4E',
  hills: '#B69A6A',
  bar: '#D2BC86',
  desert: '#E0C58F',
  mountain: '#A89F94',
};

/** Colour-blind-safe faction palette (Okabe–Ito based), used when the setting is on. */
export const CB_SAFE = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#000000', '#999999', '#882255', '#44AA99', '#117733'];
