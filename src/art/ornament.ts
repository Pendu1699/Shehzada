// Manuscript ornament in the manner of Mughal and Pahari album pages and Sikh
// darbar manuscripts: the hashiya (illuminated margin) with its gold vine scroll,
// jadwal rules (fine coloured lines framing the picture), lotus dividers, the
// kangura (stepped merlon) border, and a drawn nagara drum. Everything is flat
// pigment and gold, the way the painters worked: no gloss, no airbrush.

import { svgUrl } from './util';

const GOLD = '#C9A13B';
const GOLD_HI = '#E6C766';
const SINDOOR = '#B83A2B';
const WASLI = '#F2E6C9';
const LAJWARD = '#1E3263';

const leaf = (x: number, y: number, a: number, s = 1, fill = GOLD) =>
  `<path transform='translate(${x} ${y}) rotate(${a}) scale(${s})' d='M0 0 C2 -3 6 -3 8 0 C6 3 2 3 0 0 Z' fill='${fill}'/>`;

const rosette = (x: number, y: number, r: number, petals = 8, fill = GOLD, heart = SINDOOR) =>
  `<g transform='translate(${x} ${y})'>${Array.from({ length: petals }, (_, i) => `<path transform='rotate(${(360 / petals) * i})' d='M0 0 C${r * 0.35} ${-r * 0.35} ${r * 0.35} ${-r * 0.85} 0 ${-r} C${-r * 0.35} ${-r * 0.85} ${-r * 0.35} ${-r * 0.35} 0 0 Z' fill='${fill}'/>`).join('')}<circle r='${r * 0.28}' fill='${heart}'/><circle r='${r * 0.12}' fill='${GOLD_HI}'/></g>`;

/** A small five-petalled flower seen from the front. */
const blossom = (x: number, y: number, r: number, fill = GOLD_HI) => rosette(x, y, r, 5, fill, SINDOOR);

/**
 * The hashiya: a 96-unit tile for `border-image` with slice 32. Corners carry a
 * rosette; the edges carry a running vine whose period matches the 32-unit
 * middle slice so it tiles without a seam. Jadwal rules run along the inner edge.
 */
export function hashiyaBorder(ground = LAJWARD): string {
  const S = 96;
  // One period of the vine on the top edge, x 32→64, centred on y 16.
  const vine = `<path d='M32 17 C37 9 43 9 48 17 C53 25 59 25 64 17' stroke='${GOLD}' stroke-width='1.3' fill='none'/>
${leaf(37, 12.5, -150, 0.8)}${leaf(43, 12, -30, 0.8)}${leaf(53, 21.5, 30, 0.8)}${leaf(59, 22, 150, 0.8)}
${blossom(40, 9.5, 3.2)}${blossom(56, 24.5, 3.2)}
<circle cx='48' cy='17' r='1' fill='${GOLD_HI}'/>`;
  const edges = [0, 90, 180, 270].map((a) => `<g transform='rotate(${a} 48 48)'>${vine}</g>`).join('');
  const corners = [
    [16, 16],
    [80, 16],
    [16, 80],
    [80, 80],
  ]
    .map(([x, y]) => rosette(x, y, 8.5) + `<circle cx='${x}' cy='${y}' r='11' fill='none' stroke='${GOLD}' stroke-width='0.6'/>`)
    .join('');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${S}' height='${S}' viewBox='0 0 ${S} ${S}'>
<rect width='${S}' height='${S}' fill='${ground}'/>
<rect x='1' y='1' width='${S - 2}' height='${S - 2}' fill='none' stroke='${GOLD}' stroke-width='1.4'/>
<rect x='3.2' y='3.2' width='${S - 6.4}' height='${S - 6.4}' fill='none' stroke='${SINDOOR}' stroke-width='0.7'/>
${edges}${corners}
<rect x='28.2' y='28.2' width='${S - 56.4}' height='${S - 56.4}' fill='none' stroke='${WASLI}' stroke-width='0.9'/>
<rect x='29.8' y='29.8' width='${S - 59.6}' height='${S - 59.6}' fill='none' stroke='${GOLD}' stroke-width='1.6'/>
<rect x='31.4' y='31.4' width='${S - 62.8}' height='${S - 62.8}' fill='none' stroke='${SINDOOR}' stroke-width='0.7'/>
</svg>`;
  return svgUrl(svg);
}

/** A lotus divider: a lotus at the centre, a scrolling vine to either side. */
export function lotusRule(): string {
  const W = 260,
    H = 22,
    c = W / 2,
    y = 11;
  const side = (dir: 1 | -1) => {
    const x = (v: number) => c + dir * v;
    return `<path d='M${x(14)} ${y} C${x(26)} ${y - 8} ${x(38)} ${y + 8} ${x(52)} ${y} S${x(78)} ${y - 6} ${x(96)} ${y} L${x(124)} ${y}' stroke='${GOLD}' stroke-width='1.1' fill='none'/>
${leaf(x(24), y - 3, dir === 1 ? -40 : -140, 0.9)}${leaf(x(42), y + 3, dir === 1 ? 40 : 140, 0.9)}${leaf(x(66), y - 2.5, dir === 1 ? -35 : -145, 0.75)}${leaf(x(84), y + 2, dir === 1 ? 30 : 150, 0.7)}
${blossom(x(52), y, 2.6)}<circle cx='${x(124)}' cy='${y}' r='1.4' fill='${SINDOOR}'/>`;
  };
  // Lotus seen from the side: a fan of pointed petals on a cup.
  const petals = [-56, -30, 0, 30, 56]
    .map(
      (a, i) =>
        `<path transform='translate(${c} ${y + 5}) rotate(${a})' d='M0 0 C3.2 -4 3.2 -10 0 -${i === 2 ? 15 : 12} C-3.2 -10 -3.2 -4 0 0 Z' fill='${i % 2 ? GOLD : SINDOOR}' stroke='${i % 2 ? '#8C6A1E' : '#7A2018'}' stroke-width='0.4'/>`,
    )
    .join('');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'>
${side(1)}${side(-1)}${petals}<path d='M${c - 7} ${y + 5} Q${c} ${y + 9} ${c + 7} ${y + 5}' stroke='${GOLD}' stroke-width='1.2' fill='none'/>
</svg>`;
  return svgUrl(svg);
}

/** The kangura: a row of stepped merlons, as along the top of a Mughal wall or the edge of a textile. */
export function kanguraBorder(fill = GOLD, ground = SINDOOR): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='9' viewBox='0 0 16 9'>
<rect width='16' height='9' fill='${ground}'/>
<path d='M2 9 L2 6 L4 6 L4 3.5 L6 3.5 L6 1.2 L10 1.2 L10 3.5 L12 3.5 L12 6 L14 6 L14 9 Z' fill='${fill}'/>
<circle cx='8' cy='4.6' r='1' fill='${ground}'/>
<rect y='8' width='16' height='1' fill='#5E120E'/>
</svg>`;
  return svgUrl(svg);
}

/** A buta: the paisley-like flowering sprig of Kashmiri shawls and Punjabi block prints. */
export function butaTile(ground = '#16244A', ink = '#2C4378'): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'>
<rect width='44' height='44' fill='${ground}'/>
<g fill='${ink}'>
<path d='M11 30 C5 26 6 16 13 14 C19 12 22 18 19 22 C17 25 13 23 14 21 C16 22 17 19 15 18 C11 17 9 22 11 26 C12 28 13 29 11 30 Z'/>
<path d='M33 8 C27 4 28 -6 35 -8' transform='translate(0 0)'/>
<path d='M33 52 C27 48 28 38 35 36 C41 34 44 40 41 44 C39 47 35 45 36 43 C38 44 39 41 37 40 C33 39 31 44 33 48 C34 50 35 51 33 52 Z' transform='translate(0 -22)'/>
<circle cx='31' cy='38' r='1.2'/><circle cx='9' cy='7' r='1.2'/>
</g>
</svg>`;
  return svgUrl(svg);
}

/** A nagara drum seen from above at an angle: copper bowl, skin, leather lacing. */
export function nagaraDrum(): string {
  const lacing = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const x1 = 50 + Math.cos(a) * 40,
      y1 = 46 + Math.sin(a) * 30;
    const x2 = 50 + Math.cos(a + 0.22) * 34,
      y2 = 72 + Math.sin(a + 0.22) * 18;
    return Math.sin(a) > -0.2 ? `<path d='M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}' stroke='#3A2414' stroke-width='1.6'/>` : '';
  }).join('');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'>
<ellipse cx='50' cy='90' rx='34' ry='6' fill='#000' opacity='0.3'/>
<path d='M10 46 C10 74 28 92 50 92 C72 92 90 74 90 46 Z' fill='#9A5A2A'/>
<path d='M10 46 C10 74 28 92 50 92 C38 86 26 70 24 46 Z' fill='#7A4220'/>
<path d='M62 52 C66 66 66 78 60 88' stroke='#C98A4A' stroke-width='3' fill='none' opacity='0.7'/>
${lacing}
<ellipse cx='50' cy='46' rx='41' ry='31' fill='#5E120E'/>
<ellipse cx='50' cy='46' rx='38' ry='28' fill='#E8D2A0'/>
<ellipse cx='50' cy='46' rx='38' ry='28' fill='none' stroke='#C9A13B' stroke-width='1.4'/>
<ellipse cx='50' cy='46' rx='14' ry='10' fill='#D9BC82'/>
</svg>`;
  return svgUrl(svg);
}

/** Set the ornament images as CSS custom properties on the document root. */
export function installOrnament(root: HTMLElement) {
  root.style.setProperty('--hashiya', hashiyaBorder());
  root.style.setProperty('--hashiya-red', hashiyaBorder('#7A1E1A'));
  root.style.setProperty('--lotus-rule', lotusRule());
  root.style.setProperty('--kangura', kanguraBorder());
  root.style.setProperty('--buta', butaTile());
  root.style.setProperty('--nagara', nagaraDrum());
}
