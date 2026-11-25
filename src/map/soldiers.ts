// The soldiers on the map, dressed for who they are. Drawn small but in the
// flat manner of the Company-period and Pahari pictures of soldiers: the
// headgear and coat are what tell one army from another, so they are drawn
// large and bold; faces carry beard and moustache as each tradition wore them.
//
// References (see HISTORY.md, "Soldiers on the map"):
//  * Sikh misls: the tall court dastaar of each misl (as on the portraits), a
//    long chola, spear and dhal. The Akali-Nihangs of the Shaheedan and the
//    Budha Dal: the blue dumalla with farla and steel chakars.
//  * Durrani and other Afghan forces: a turban wound about a peaked kulah, a
//    long chapan, the lungi sash, the long jezail; full beard, lip trimmed.
//  * Mughal governors and the nawabs: the flat atpati pagri with a sarpech
//    plume, the flared white jama with a coloured cummerbund; beard, lip trimmed.
//  * Marathas: the rounded pagadi (pheta) with its turra, the white angarkha
//    tied at the side, the lance with the swallow-tailed bhagwa jhenda.
//  * The Company: red coats ("Lal Paltan") with white cross-belts; sepoys in
//    the "sundial" turban with its tall pointed badge, Europeans in the shako.
//  * Rajputs and the hill states: the bright pagri with turra, whiskers and
//    moustache. Gorkhas: the topi and the khukuri. Mysore: Tipu's tiger-stripe.

import { GraphicsContext } from 'pixi.js';
import { lookOf } from '../art/Dastar';
import { FACTION_BY_ID } from '../data/factions';
import { hexToNum } from '../art/util';

const INK = 0x1b1712;
const SKIN = 0xc68b59;

export type Head = 'pagg' | 'dumalla' | 'kulah' | 'atpati' | 'pagadi' | 'rajput' | 'sundial' | 'shako' | 'topi' | 'sindhi' | 'fur' | 'headcloth';
export type Coat = 'chola' | 'jama' | 'chapan' | 'angarkha' | 'redcoat' | 'bluecoat' | 'tiger' | 'chuba' | 'plain';
export type Face = 'beard_moustache' | 'beard_trimmed' | 'moustache' | 'whiskers' | 'clean';
export type Weapon = 'spear' | 'jezail' | 'matchlock' | 'musket' | 'lance_jhenda' | 'sabre' | 'khukuri' | 'bow';

export interface Kit {
  head: Head;
  /** Main headgear colour; second colour for stripes, badges or the peak of a kulah. */
  headColor: string;
  head2: string;
  coat: Coat;
  coatColor: string;
  sash: string;
  legs: string;
  face: Face;
  beard: number;
  weapon: Weapon;
  shield: boolean;
  /** Pennant colour on a spear, if any. */
  pennant?: string;
  /** Extra marks from a misl's dastaar look. */
  marks?: string[];
}

const AFGHAN = new Set(['durrani', 'peshawar', 'kalat', 'rohillas', 'kasur', 'multan']);
const NAWABI = new Set(['mughal', 'malerkotla', 'bahawalpur', 'nawab_awadh', 'nawab_bengal', 'nizam', 'arcot']);
const RAJPUT = new Set(['rajputs', 'jats', 'kangra', 'hill_states', 'jammu']);

/** The dress of an army: by its owner, and by the troops it is mostly made of. */
export function kitFor(owner: string, unitType: string, sarkarRegular: boolean): Kit {
  const f = FACTION_BY_ID[owner];
  const banner = f?.banner.field ?? '#E8870E';
  if (owner === 'company') {
    const european = unitType === 'british_regular' || unitType === 'horse_artillery';
    if (unitType === 'company_cav' || unitType === 'horse_artillery')
      return { head: european ? 'shako' : 'sundial', headColor: '#1F2A44', head2: '#C9A13B', coat: 'bluecoat', coatColor: '#3A5A8C', sash: '#F2E6C9', legs: '#F2E6C9', face: european ? 'clean' : 'moustache', beard: 0, weapon: 'sabre', shield: false };
    return { head: european ? 'shako' : 'sundial', headColor: european ? '#1B1712' : '#1F2A44', head2: '#E6C766', coat: 'redcoat', coatColor: '#B02222', sash: '#F7F1E3', legs: european ? '#F2E6C9' : 'skin', face: european ? 'clean' : 'moustache', beard: 0, weapon: 'musket', shield: false };
  }
  if (f?.sikh) {
    const nihang = owner === 'shaheedan' || unitType === 'nihang';
    if (nihang)
      return { head: 'dumalla', headColor: '#1E3FA0', head2: '#C3C8CE', coat: 'chola', coatColor: '#22307A', sash: '#E8870E', legs: '#22307A', face: 'beard_moustache', beard: 0x1b1712, weapon: 'spear', shield: true, pennant: '#E8870E' };
    const look = lookOf(owner);
    const pagg = look?.colors?.[0] ?? banner;
    if (sarkarRegular)
      return { head: 'pagg', headColor: pagg, head2: '#C9A13B', coat: 'redcoat', coatColor: '#B83A2B', sash: '#F7F1E3', legs: '#F2E6C9', face: 'beard_moustache', beard: 0x1b1712, weapon: 'musket', shield: false, marks: look?.mark };
    return {
      head: 'pagg',
      headColor: pagg,
      head2: look?.colors?.[1] ?? '#C9A13B',
      coat: 'chola',
      coatColor: owner === 'nishanwalia' ? '#F2E6C9' : pagg === '#F2E6C9' || pagg === '#E4D2A8' ? '#E8870E' : '#F2E6C9',
      sash: banner,
      legs: '#E4D2A8',
      face: 'beard_moustache',
      beard: 0x1b1712,
      weapon: unitType === 'jezailchi' || unitType === 'piyada' ? 'matchlock' : 'spear',
      shield: true,
      pennant: owner === 'nishanwalia' ? '#E8870E' : banner,
      marks: look?.mark,
    };
  }
  if (AFGHAN.has(owner))
    return { head: 'kulah', headColor: owner === 'rohillas' ? '#E8E0CC' : '#D8D2C2', head2: owner === 'durrani' ? '#2F6F73' : '#8C2A2A', coat: 'chapan', coatColor: owner === 'durrani' ? '#3D4F5A' : '#5A4A3A', sash: '#B8A27A', legs: '#E8E0CC', face: 'beard_trimmed', beard: 0x2a1f16, weapon: unitType === 'durrani_cav' ? 'sabre' : 'jezail', shield: unitType === 'durrani_cav' };
  if (owner === 'sindh_amirs')
    return { head: 'sindhi', headColor: '#9E1B1B', head2: '#E6C766', coat: 'jama', coatColor: '#EDE6D6', sash: '#2F6F73', legs: '#EDE6D6', face: 'beard_trimmed', beard: 0x1b1712, weapon: 'jezail', shield: true };
  if (NAWABI.has(owner))
    return { head: 'atpati', headColor: owner === 'nizam' ? '#E6C766' : '#F4EEDF', head2: '#B83A2B', coat: 'jama', coatColor: '#F4EEDF', sash: banner, legs: '#C9B48A', face: 'beard_trimmed', beard: 0x1b1712, weapon: unitType === 'piyada' ? 'matchlock' : 'spear', shield: true };
  if (owner === 'maratha')
    return { head: 'pagadi', headColor: '#B83A2B', head2: '#E6C766', coat: 'angarkha', coatColor: '#F4EEDF', sash: '#E8870E', legs: '#F4EEDF', face: 'moustache', beard: 0, weapon: 'lance_jhenda', shield: true, pennant: '#E8870E' };
  if (owner === 'khudadad')
    return { head: 'atpati', headColor: '#6B2A4A', head2: '#E8870E', coat: 'tiger', coatColor: '#D9A030', sash: '#6B2A4A', legs: '#EDE6D6', face: 'beard_trimmed', beard: 0x1b1712, weapon: 'musket', shield: false };
  if (owner === 'gurkha')
    return { head: 'topi', headColor: '#1B1712', head2: '#C9A13B', coat: 'plain', coatColor: '#2F3F5A', sash: '#F2E6C9', legs: '#EDE6D6', face: 'moustache', beard: 0, weapon: 'khukuri', shield: false };
  if (owner === 'tibet')
    return { head: 'fur', headColor: '#7A4A2A', head2: '#8C2A3A', coat: 'chuba', coatColor: '#7A2A3A', sash: '#C9A13B', legs: '#3A2A22', face: 'clean', beard: 0, weapon: 'matchlock', shield: false };
  if (owner === 'kandy')
    return { head: 'headcloth', headColor: '#F4EEDF', head2: '#B83A2B', coat: 'plain', coatColor: '#F4EEDF', sash: '#B83A2B', legs: '#F4EEDF', face: 'moustache', beard: 0, weapon: 'spear', shield: false };
  if (RAJPUT.has(owner))
    return { head: 'rajput', headColor: owner === 'jats' ? '#E6C23B' : owner === 'jammu' ? '#B83A2B' : '#E8870E', head2: '#B83A2B', coat: 'jama', coatColor: '#F4EEDF', sash: banner, legs: '#E4D2A8', face: 'whiskers', beard: 0x1b1712, weapon: unitType === 'hill_levy' ? 'matchlock' : 'spear', shield: true, pennant: banner };
  return { head: 'headcloth', headColor: '#F2E6C9', head2: banner, coat: 'plain', coatColor: banner, sash: '#F2E6C9', legs: '#E4D2A8', face: 'moustache', beard: 0, weapon: 'spear', shield: true };
}

export const kitKey = (k: Kit) => `${k.head}|${k.headColor}|${k.head2}|${k.coat}|${k.coatColor}|${k.face}|${k.weapon}|${k.shield}|${k.pennant}|${(k.marks ?? []).join(',')}`;

const col = (c: string) => (c === 'skin' ? SKIN : hexToNum(c));

/* ── Heads (centre at hx, hy; facing right) ─────────────────────────────── */

function face(g: GraphicsContext, hx: number, hy: number, k: Kit) {
  g.circle(hx, hy, 2.5).fill(SKIN);
  g.circle(hx + 1.4, hy - 0.5, 0.42).fill(INK);
  const b = k.beard || INK;
  if (k.face === 'beard_moustache' || k.face === 'beard_trimmed') {
    // A full beard along the jaw to the chin.
    g.poly([hx - 1.4, hy + 0.2, hx + 2.6, hy + 0.9, hx + 2.3, hy + 3.4, hx + 0.6, hy + 4.4, hx - 1.3, hy + 2.6]).fill(b);
  }
  if (k.face === 'whiskers') g.poly([hx - 1.6, hy - 0.2, hx + 0.6, hy + 1.6, hx - 0.8, hy + 2.6]).fill(b);
  if (k.face === 'beard_moustache' || k.face === 'moustache' || k.face === 'whiskers') {
    // An upswept moustache, curling at the end.
    g.moveTo(hx + 2.6, hy + 0.9).bezierCurveTo(hx + 1.6, hy + 1.3, hx + 0.2, hy + 1.2, hx - 0.2, hy - 0.1).stroke({ width: 0.9, color: k.face === 'beard_moustache' ? 0x0a0806 : INK });
  }
  // beard_trimmed: the upper lip is left clear, as the Sunni practice of the age.
}

function head(g: GraphicsContext, hx: number, hy: number, k: Kit) {
  const c1 = col(k.headColor),
    c2 = col(k.head2);
  switch (k.head) {
    case 'pagg': {
      // The tall court dastaar: high at the back, a folded front lobe.
      g.poly([hx - 2.7, hy - 0.3, hx - 3.1, hy - 4.4, hx - 1.4, hy - 6.6, hx + 1.6, hy - 6.4, hx + 3.0, hy - 4.0, hx + 2.6, hy - 1.0]).fill(c1).stroke({ width: 0.5, color: INK, alpha: 0.6 });
      g.moveTo(hx + 2.2, hy - 1.1).lineTo(hx + 0.2, hy - 6.2).stroke({ width: 0.6, color: INK, alpha: 0.55 });
      g.moveTo(hx - 2.2, hy - 2.2).lineTo(hx + 1.2, hy - 4.6).stroke({ width: 0.4, color: 0xffffff, alpha: 0.35 });
      const m = new Set(k.marks ?? []);
      if (m.has('kalgi') || m.has('jigha')) g.poly([hx + 0.6, hy - 6.4, hx + 1.8, hy - 10, hx + 1.4, hy - 6.2]).fill(m.has('kalgi') ? 0xf7f1e3 : 0xe6c766);
      if (m.has('chakar')) g.ellipse(hx + 1.6, hy - 3.6, 0.9, 2.1).stroke({ width: 0.7, color: 0xc3c8ce });
      if (m.has('pennant')) {
        g.moveTo(hx + 0.6, hy - 6.2).lineTo(hx + 1.6, hy - 11).stroke({ width: 0.5, color: 0x5a3a1e });
        g.poly([hx + 1.6, hy - 11, hx + 4.4, hy - 10.2, hx + 1.4, hy - 9.2]).fill(0xe8870e);
      }
      if (m.has('pearls') || m.has('band') || m.has('tilla')) g.moveTo(hx - 2.8, hy - 1.4).lineTo(hx + 2.7, hy - 2.0).stroke({ width: 0.6, color: 0xe6c766 });
      break;
    }
    case 'dumalla': {
      // Base, a tall cone leaning forward, a farla, and steel chakars.
      g.poly([hx - 2.8, hy - 0.2, hx - 3.0, hy - 3.2, hx + 2.8, hy - 3.4, hx + 2.7, hy - 0.8]).fill(c1);
      g.poly([hx - 2.6, hy - 3.2, hx - 1.2, hy - 8.8, hx + 0.8, hy - 11.2, hx + 2.6, hy - 3.4]).fill(c1).stroke({ width: 0.5, color: INK, alpha: 0.6 });
      g.ellipse(hx, hy - 5.2, 2.6, 0.8).stroke({ width: 0.8, color: c2 });
      g.ellipse(hx + 0.2, hy - 7.6, 1.6, 0.55).stroke({ width: 0.7, color: c2 });
      g.moveTo(hx + 0.8, hy - 11).bezierCurveTo(hx + 2.4, hy - 13.2, hx + 4.4, hy - 12.6, hx + 4.8, hy - 10.6).stroke({ width: 1.2, color: c1 });
      break;
    }
    case 'kulah': {
      // A turban wound about a peaked cap; a loose end hangs behind.
      g.poly([hx - 1.1, hy - 3.6, hx + 0.2, hy - 8.2, hx + 1.5, hy - 3.6]).fill(c2);
      g.ellipse(hx + 0.2, hy - 2.7, 3.3, 1.9).fill(c1).stroke({ width: 0.5, color: INK, alpha: 0.5 });
      g.moveTo(hx - 3.0, hy - 2.4).lineTo(hx + 3.2, hy - 3.2).stroke({ width: 0.5, color: INK, alpha: 0.35 });
      g.moveTo(hx - 2.6, hy - 1.8).bezierCurveTo(hx - 4.6, hy - 0.5, hx - 4.8, hy + 2.2, hx - 3.6, hy + 4.2).stroke({ width: 1.3, color: c1 });
      break;
    }
    case 'atpati': {
      // The flat, wide pagri of the Mughal court, with a sarpech plume.
      g.poly([hx - 2.8, hy - 0.8, hx - 3.4, hy - 3.6, hx + 3.6, hy - 4.2, hx + 3.0, hy - 0.8]).fill(c1).stroke({ width: 0.5, color: INK, alpha: 0.55 });
      g.moveTo(hx - 3.0, hy - 2.2).lineTo(hx + 3.2, hy - 2.6).stroke({ width: 0.4, color: INK, alpha: 0.35 });
      g.poly([hx + 1.6, hy - 4.0, hx + 2.6, hy - 8.4, hx + 2.2, hy - 3.9]).fill(0xf7f1e3);
      g.circle(hx + 1.9, hy - 3.6, 0.6).fill(c2);
      break;
    }
    case 'pagadi': {
      // The rounded Maratha pagadi with its front fold and a turra behind.
      g.ellipse(hx + 0.3, hy - 3.0, 3.2, 2.6).fill(c1).stroke({ width: 0.5, color: INK, alpha: 0.55 });
      g.moveTo(hx - 2.0, hy - 1.6).bezierCurveTo(hx, hy - 4.4, hx + 1.6, hy - 4.6, hx + 3.2, hy - 2.6).stroke({ width: 0.6, color: c2 });
      g.poly([hx - 2.4, hy - 4.4, hx - 3.8, hy - 7.2, hx - 1.6, hy - 5.2]).fill(c1);
      g.moveTo(hx - 2.8, hy - 2.0).bezierCurveTo(hx - 4.4, hy - 1.0, hx - 4.4, hy + 1.6, hx - 3.4, hy + 3.0).stroke({ width: 1.1, color: c1 });
      break;
    }
    case 'rajput': {
      // A bright pagri, striped, with a turra plume.
      g.ellipse(hx + 0.2, hy - 3.2, 3.2, 2.5).fill(c1).stroke({ width: 0.5, color: INK, alpha: 0.5 });
      for (const d of [-1.6, 0, 1.6]) g.moveTo(hx - 2.4 + d, hy - 1.4).lineTo(hx + 0.4 + d, hy - 5.2).stroke({ width: 0.55, color: c2 });
      g.poly([hx + 1.8, hy - 5.0, hx + 3.2, hy - 7.8, hx + 2.6, hy - 4.8]).fill(0xe6c766);
      break;
    }
    case 'sundial': {
      // The Bengal sepoy's "sundial" turban: tall, flat-fronted, a pointed badge.
      g.poly([hx - 2.4, hy - 0.8, hx - 2.6, hy - 6.2, hx + 2.6, hy - 6.8, hx + 2.6, hy - 1.0]).fill(c1).stroke({ width: 0.5, color: INK, alpha: 0.6 });
      g.rect(hx - 2.6, hy - 1.8, 5.2, 0.9).fill(0xf7f1e3);
      g.poly([hx + 1.4, hy - 1.6, hx + 3.2, hy - 5.4, hx + 1.6, hy - 9.6, hx + 0.6, hy - 5.0]).fill(c2).stroke({ width: 0.3, color: INK, alpha: 0.5 });
      break;
    }
    case 'shako': {
      // A black shako with a peak and a white plume.
      g.poly([hx - 2.4, hy - 1.2, hx - 2.8, hy - 6.6, hx + 2.8, hy - 6.6, hx + 2.4, hy - 1.2]).fill(c1);
      g.poly([hx + 1.0, hy - 1.4, hx + 4.0, hy - 0.6, hx + 2.4, hy - 1.8]).fill(c1);
      g.rect(hx - 2.6, hy - 6.6, 5.2, 0.6).fill(c2);
      g.ellipse(hx - 0.4, hy - 8.2, 0.9, 1.8).fill(0xf7f1e3);
      break;
    }
    case 'topi': {
      g.poly([hx - 2.4, hy - 1.6, hx - 2.2, hy - 4.4, hx + 2.8, hy - 4.8, hx + 2.6, hy - 1.8]).fill(c1);
      g.rect(hx - 1.2, hy - 3.6, 0.9, 0.9).fill(c2);
      break;
    }
    case 'sindhi': {
      // The Sindhi topi: a round embroidered cap with a cut-out at the front.
      g.poly([hx - 2.6, hy - 1.2, hx - 2.6, hy - 4.6, hx + 2.8, hy - 4.6, hx + 2.8, hy - 1.2]).fill(c1).stroke({ width: 0.5, color: INK, alpha: 0.5 });
      for (let i = 0; i < 4; i++) g.circle(hx - 1.8 + i * 1.3, hy - 3.2, 0.35).fill(c2);
      g.poly([hx + 1.2, hy - 1.2, hx + 2.0, hy - 3.0, hx + 2.8, hy - 1.2]).fill(SKIN);
      break;
    }
    case 'fur': {
      g.ellipse(hx, hy - 2.6, 3.4, 1.4).fill(c1);
      g.poly([hx - 2.0, hy - 3.0, hx - 1.2, hy - 6.2, hx + 1.4, hy - 6.2, hx + 2.0, hy - 3.0]).fill(c2);
      break;
    }
    case 'headcloth': {
      g.ellipse(hx + 0.2, hy - 2.6, 2.9, 2.0).fill(c1).stroke({ width: 0.5, color: INK, alpha: 0.45 });
      break;
    }
  }
}

/** Face and headgear, drawn a little larger than life so the dress reads on the map. */
function drawHead(g: GraphicsContext, hx: number, hy: number, k: Kit, scale = 1.3) {
  // The neck joins the head to the shoulders.
  g.rect(hx - 1.1, hy + 0.5, 2.2, 3.6).fill(SKIN);
  g.save();
  g.translate(hx, hy + 1.2);
  g.scale(scale, scale);
  face(g, 0, -1.2 / scale, k);
  head(g, 0, -1.2 / scale, k);
  g.restore();
}

/* ── Bodies ─────────────────────────────────────────────────────────────── */

/** Torso and skirt of a standing man (feet at y = 0, shoulders near y = -19). */
function footBody(g: GraphicsContext, k: Kit) {
  const coat = col(k.coatColor);
  const legs = col(k.legs);
  const long = k.coat === 'chapan' || k.coat === 'chuba' || k.coat === 'chola';
  const flare = k.coat === 'jama' || k.coat === 'angarkha';
  // legs
  const legTop = long ? -4 : flare ? -5 : -8;
  g.moveTo(-1.5, legTop).lineTo(-2.8, 0).stroke({ width: 1.8, color: legs });
  g.moveTo(1.5, legTop).lineTo(2.8, 0).stroke({ width: 1.8, color: legs });
  g.moveTo(-3.4, 0).lineTo(-1.8, 0).stroke({ width: 1.1, color: INK });
  g.moveTo(2.2, 0).lineTo(3.8, 0).stroke({ width: 1.1, color: INK });
  // coat
  if (flare) g.poly([-3.4, -19, 3.4, -19, 3.2, -12, 5.6, -5, -5.2, -5, -3.2, -12]).fill(coat).stroke({ width: 0.6, color: INK, alpha: 0.5 });
  else if (long) g.poly([-3.4, -19, 3.4, -19, 3.4, -11, 4.0, -4, -4.0, -4, -3.4, -11]).fill(coat).stroke({ width: 0.6, color: INK, alpha: 0.5 });
  else g.poly([-3.2, -8, 3.2, -8, 3.4, -19, -3.4, -19]).fill(coat).stroke({ width: 0.6, color: INK, alpha: 0.5 });
  // details by coat
  if (k.coat === 'redcoat') {
    g.moveTo(-2.4, -18.6).lineTo(2.6, -9).stroke({ width: 0.9, color: col(k.sash) });
    g.moveTo(2.4, -18.6).lineTo(-2.6, -9).stroke({ width: 0.9, color: col(k.sash) });
    g.rect(-2.8, -19.4, 5.6, 1.1).fill(0xe6c766);
  }
  if (k.coat === 'bluecoat') g.moveTo(-2.2, -18.4).lineTo(2.4, -9.6).stroke({ width: 0.9, color: col(k.sash) });
  if (k.coat === 'angarkha') g.moveTo(2.4, -18.6).bezierCurveTo(-0.8, -15, -1.2, -12, 1.6, -11).stroke({ width: 0.6, color: INK, alpha: 0.45 });
  if (k.coat === 'chapan') {
    g.moveTo(-1.2, -18).lineTo(-1.6, -5).stroke({ width: 0.5, color: 0xd8cbb0, alpha: 0.6 });
    g.moveTo(1.2, -18).lineTo(1.6, -5).stroke({ width: 0.5, color: 0xd8cbb0, alpha: 0.6 });
    // the lungi over the shoulder
    g.moveTo(-2.4, -18.6).lineTo(2.8, -11.4).stroke({ width: 1.3, color: col(k.sash) });
  }
  if (k.coat === 'tiger') for (const y of [-17, -14.5, -12, -9.5]) g.moveTo(-2.6, y).quadraticCurveTo(-0.6, y - 1.2, 0.6, y + 0.4).stroke({ width: 0.7, color: INK, alpha: 0.75 });
  if (k.coat === 'chuba') g.poly([-2.6, -19, 0.4, -19, -1.2, -12]).fill({ color: 0xc9a13b, alpha: 0.7 });
  // waist sash or cummerbund
  if (k.coat !== 'redcoat' && k.coat !== 'bluecoat') g.rect(-3.0, -12.4, 6.0, 1.5).fill(col(k.sash));
  // shield on the back
  if (k.shield) {
    g.circle(-3.4, -14.5, 2.6).fill(0x5a3a1e).stroke({ width: 0.5, color: 0xc9a13b });
    g.circle(-3.4, -14.5, 0.6).fill(0xc9a13b);
  }
}

/** The weapon of a man on foot, held at the shoulder or in hand. */
function footWeapon(g: GraphicsContext, k: Kit) {
  switch (k.weapon) {
    case 'jezail':
      g.moveTo(-2, -12).lineTo(14, -27).stroke({ width: 1.2, color: 0x5a3a1e });
      g.moveTo(-2, -12).quadraticCurveTo(-4, -10, -3.2, -8.4).stroke({ width: 1.6, color: 0x5a3a1e });
      g.moveTo(9, -22.2).lineTo(14, -27).stroke({ width: 0.9, color: 0x6b6b6b });
      break;
    case 'musket':
      g.moveTo(-0.6, -12).lineTo(11, -25).stroke({ width: 1.3, color: 0x4a3018 });
      g.moveTo(8, -21.6).lineTo(11, -25).stroke({ width: 0.9, color: 0x6b6b6b });
      g.moveTo(11, -25).lineTo(13.4, -27.6).stroke({ width: 0.6, color: 0xb0b0b0 });
      break;
    case 'matchlock':
      g.moveTo(-1, -14).lineTo(13, -25).stroke({ width: 1.3, color: 0x4a3018 });
      g.moveTo(9, -22).lineTo(13, -25).stroke({ width: 1, color: 0x6b6b6b });
      break;
    case 'khukuri':
      g.moveTo(2.6, -14).quadraticCurveTo(6, -15, 7.6, -12).stroke({ width: 1.4, color: 0x9a9a9a });
      g.moveTo(2.2, -14).lineTo(3.2, -13.6).stroke({ width: 1.2, color: 0x3a2a1a });
      break;
    case 'bow':
      g.moveTo(4, -24).quadraticCurveTo(8, -15, 4, -6).stroke({ width: 0.9, color: 0x5a3a1e });
      break;
    default: {
      // spear, lance with jhenda, or sabre: a spear on foot
      g.moveTo(3.4, 0).lineTo(5.6, -30).stroke({ width: 0.9, color: 0x5a3a1e });
      g.poly([5.6, -30, 6.4, -33.4, 4.8, -30.4]).fill(0x8c8c8c);
      if (k.pennant) g.poly([5.4, -28.6, 9.6, -27.4, 5.3, -26]).fill(col(k.pennant));
    }
  }
}

/** A man on foot facing right, about 14 units wide, standing on y = 0. */
export function soldierFoot(k: Kit): GraphicsContext {
  const g = new GraphicsContext();
  g.ellipse(0, 0, 7, 1.8).fill({ color: 0x2a2014, alpha: 0.25 });
  footBody(g, k);
  footWeapon(g, k);
  drawHead(g, 0.4, -20.9, k);
  return g;
}

const HORSE_COATS = [0x7a4a2a, 0xb8b0a0, 0x3a2a22, 0xe6dccb, 0x9a6a3a];

/** A horseman facing right, about 30 units wide, standing on y = 0. */
export function soldierHorse(k: Kit, coat = 0, cloth = '#C9A13B'): GraphicsContext {
  const g = new GraphicsContext();
  const horse = HORSE_COATS[coat % HORSE_COATS.length];
  g.ellipse(0, 0, 13, 2.6).fill({ color: 0x2a2014, alpha: 0.25 });
  for (const [x0, x1] of [[-7, -8.5], [-4, -3], [5, 4.5], [8, 10]] as const) g.moveTo(x0, -8).lineTo(x1, 0).stroke({ width: 1.6, color: horse === 0xe6dccb ? 0x8a8070 : 0x2a1a12 });
  g.moveTo(-10, -12).bezierCurveTo(-14, -10, -15, -5, -13, -2).stroke({ width: 1.8, color: 0x2a1a12 });
  g.ellipse(0, -11, 10.5, 4.6).fill(horse).stroke({ width: 0.7, color: INK, alpha: 0.6 });
  g.poly([7, -13, 11, -21, 15.5, -21.5, 16, -18.5, 12.5, -17, 10, -9]).fill(horse).stroke({ width: 0.7, color: INK, alpha: 0.6 });
  g.poly([11, -21, 12.5, -23.5, 13, -21]).fill(horse);
  // bridle and saddle cloth in the army's colours
  g.moveTo(15.4, -19.8).lineTo(11.2, -17.4).stroke({ width: 0.6, color: hexToNum(cloth) });
  g.roundRect(-5.5, -15.8, 10, 6.4, 1.2).fill(hexToNum(cloth));
  g.rect(-5.5, -10.6, 10, 1).fill({ color: 0xc9a13b });
  // the rider: coat skirt over the saddle, torso, leg
  const coatC = col(k.coatColor);
  g.poly([-4.5, -14, 4.5, -14, 3.6, -10, -3.6, -10]).fill(coatC);
  g.moveTo(1, -12).lineTo(2.6, -7.2).stroke({ width: 1.6, color: col(k.legs) });
  g.poly([-2.6, -14, 2.6, -14, 2.9, -24.2, -2.5, -24.2]).fill(coatC).stroke({ width: 0.6, color: INK, alpha: 0.5 });
  if (k.coat === 'redcoat') {
    g.moveTo(-1.8, -23.8).lineTo(2.2, -15).stroke({ width: 0.8, color: col(k.sash) });
    g.moveTo(1.8, -23.8).lineTo(-2.2, -15).stroke({ width: 0.8, color: col(k.sash) });
  } else if (k.coat === 'tiger') {
    for (const y of [-22, -19.5, -17]) g.moveTo(-1.8, y).quadraticCurveTo(0, y - 1, 1.4, y + 0.3).stroke({ width: 0.6, color: INK, alpha: 0.75 });
  } else if (k.coat === 'chapan') {
    g.moveTo(-1.8, -24).lineTo(2.2, -17).stroke({ width: 1.2, color: col(k.sash) });
  } else g.rect(-2.4, -16.6, 4.8, 1.3).fill(col(k.sash));
  // weapon
  if (k.weapon === 'sabre') {
    g.moveTo(2, -20).quadraticCurveTo(8, -27, 6.4, -33).stroke({ width: 1.1, color: 0xa8a8a8 });
    g.moveTo(1.2, -19.4).lineTo(3, -20.6).stroke({ width: 1.2, color: 0x5a3a1e });
  } else if (k.weapon === 'jezail' || k.weapon === 'musket' || k.weapon === 'matchlock') {
    g.moveTo(-6, -15).lineTo(10, -33).stroke({ width: 1.1, color: 0x4a3018 });
  } else {
    g.moveTo(-6, -13).lineTo(12, -38).stroke({ width: 0.9, color: 0x5a3a1e });
    g.poly([12, -38, 13.8, -42.5, 10.6, -39]).fill(0x8c8c8c);
    if (k.weapon === 'lance_jhenda' && k.pennant) {
      // the bhagwa jhenda: swallow-tailed
      g.poly([11.2, -37, 17.6, -36.6, 15.4, -35.2, 17.4, -33.6, 10.4, -34.6]).fill(col(k.pennant));
    } else if (k.pennant) g.poly([10.6, -36.4, 15.2, -34.4, 9.6, -33.6]).fill(col(k.pennant));
  }
  if (k.shield) {
    g.circle(-2.8, -19.5, 2.9).fill(0x5a3a1e).stroke({ width: 0.6, color: 0xc9a13b });
    g.circle(-2.8, -19.5, 0.7).fill(0xc9a13b);
  }
  drawHead(g, 0.4, -26.3, k);
  return g;
}

/** A gun on its carriage with a gunner of the army beside it. */
export function soldierGun(k: Kit, cloth: string): GraphicsContext {
  const g = new GraphicsContext();
  g.ellipse(2, 0, 14, 2).fill({ color: 0x2a2014, alpha: 0.25 });
  g.poly([-6, -9, 16, -13, 16.5, -10, -5, -5]).fill(0x8a6a2a).stroke({ width: 0.7, color: INK, alpha: 0.6 });
  g.circle(16.3, -11.5, 1.2).fill(INK);
  g.circle(1, -5, 5).fill(0x5a3a1e).stroke({ width: 1, color: INK });
  for (let a = 0; a < 6; a++) g.moveTo(1, -5).lineTo(1 + Math.cos((a * Math.PI) / 3) * 5, -5 + Math.sin((a * Math.PI) / 3) * 5).stroke({ width: 0.6, color: INK });
  g.poly([-7, -6, -12, 0, -10, 0, -5, -5]).fill(0x5a3a1e);
  g.rect(-4, -11, 4, 2).fill(hexToNum(cloth));
  // the gunner stands behind, slightly smaller
  g.save();
  g.translate(-9, 0);
  g.scale(0.85, 0.85);
  footBody(g, { ...k, shield: false });
  drawHead(g, 0.4, -20.9, k);
  g.moveTo(2.6, -16).lineTo(8, -6).stroke({ width: 0.9, color: 0x5a3a1e });
  g.restore();
  return g;
}
