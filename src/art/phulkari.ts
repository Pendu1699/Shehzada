// Phulkari / bagh-style geometric embroidery patterns as SVG, for panel backgrounds.
// Bagh phulkari covers the cloth with interlocking lozenges in floss silk; these are
// original geometric compositions in that spirit.
import { svgUrl } from './util';

export function phulkariTile(opts: { ground?: string; silk?: string; silk2?: string; size?: number } = {}): string {
  const g = opts.ground ?? '#7A1E1A';
  const s1 = opts.silk ?? '#E8A23A';
  const s2 = opts.silk2 ?? '#F2D27A';
  const n = opts.size ?? 40;
  const h = n / 2;
  // Concentric lozenges with stepped (darn-stitch) edges.
  const diamond = (r: number) => `M${h} ${h - r} L${h + r} ${h} L${h} ${h + r} L${h - r} ${h} Z`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${n}' height='${n}' viewBox='0 0 ${n} ${n}'>
<rect width='${n}' height='${n}' fill='${g}'/>
<path d='${diamond(h - 1)}' fill='${s1}'/>
<path d='${diamond(h - 5)}' fill='${g}'/>
<path d='${diamond(h - 8)}' fill='${s2}'/>
<path d='${diamond(h - 12)}' fill='${s1}'/>
<path d='${diamond(3)}' fill='${g}'/>
<path d='M0 0 L4 0 L0 4 Z M${n} 0 L${n - 4} 0 L${n} 4 Z M0 ${n} L4 ${n} L0 ${n - 4} Z M${n} ${n} L${n - 4} ${n} L${n} ${n - 4} Z' fill='${s2}'/>
<g stroke='${g}' stroke-width='0.6' opacity='0.5'>${Array.from({ length: 8 }, (_, i) => `<line x1='${h - (h - 1) + i * 2.4}' y1='${h}' x2='${h}' y2='${h - (h - 1) + i * 2.4}'/>`).join('')}</g>
</svg>`;
  return svgUrl(svg);
}

/** A gold floral manuscript border as a border-image source (slice 24). */
export function goldBorder(opts: { band?: string; gold?: string } = {}): string {
  const band = opts.band ?? '#1F3A68';
  const gold = opts.gold ?? '#C9A13B';
  const S = 72;
  const leaf = (x: number, y: number, r: number) => `<path d='M${x} ${y} q${r} ${-r} ${2 * r} 0 q${-r} ${r} ${-2 * r} 0 Z' fill='${gold}'/>`;
  const flower = (x: number, y: number, r: number) =>
    `<g transform='translate(${x} ${y})'>${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx='${r}' ry='${r / 2.2}' cx='${r}' transform='rotate(${a})' fill='${gold}'/>`).join('')}<circle r='${r / 2}' fill='#B83A2B'/></g>`;
  const vine = (y: number) => `<path d='M24 ${y} C30 ${y - 6} 42 ${y + 6} 48 ${y}' stroke='${gold}' stroke-width='1.4' fill='none'/>${leaf(30, y - 3, 3)}${leaf(39, y + 3, 3)}`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${S}' height='${S}' viewBox='0 0 ${S} ${S}'>
<rect width='${S}' height='${S}' fill='${band}'/>
<rect x='2' y='2' width='${S - 4}' height='${S - 4}' fill='none' stroke='${gold}' stroke-width='2'/>
<rect x='21' y='21' width='${S - 42}' height='${S - 42}' fill='none' stroke='${gold}' stroke-width='1.2'/>
${flower(12, 12, 4.5)}${flower(S - 12, 12, 4.5)}${flower(12, S - 12, 4.5)}${flower(S - 12, S - 12, 4.5)}
${vine(12)}${vine(S - 12)}
<g transform='rotate(90 ${S / 2} ${S / 2})'>${vine(12)}${vine(S - 12)}</g>
</svg>`;
  return svgUrl(svg);
}
