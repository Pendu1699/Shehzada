// The Sarbat Khalsa before the Akal Takht, painted in the flat manner of the
// title miniature. The building follows the era: after Ahmad Shah blew it up
// in 1762 it was rebuilt as a modest two-storeyed hall (1774); the gilded dome
// and the upper storeys of white marble belong to the Sarkar years. In front
// stand the two Nishan Sahibs of Miri and Piri. No figures of the Gurus.

import { FACTION_BY_ID } from '../data/factions';

const MARBLE = '#F4EEDF';
const SHADE = '#D9CFB8';
const LINE = '#B8AA8A';
const DARK = '#4A3A28';
const GOLD = '#D9A930';
const GOLD_HI = '#F3D27A';
const GOLD_LO = '#9C6F14';

function Arches({ x, y, w, h, n, deep = DARK }: { x: number; y: number; w: number; h: number; n: number; deep?: string }) {
  const gap = w / n;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const ax = x + i * gap + gap * 0.14,
          aw = gap * 0.72;
        const top = y + h * 0.28;
        return (
          <path
            key={i}
            d={`M${ax} ${y + h} L${ax} ${top} Q${ax + aw * 0.12} ${top - h * 0.16} ${ax + aw * 0.3} ${top - h * 0.18} Q${ax + aw * 0.5} ${top - h * 0.3} ${ax + aw * 0.7} ${top - h * 0.18} Q${ax + aw * 0.88} ${top - h * 0.16} ${ax + aw} ${top} L${ax + aw} ${y + h} Z`}
            fill={deep}
            stroke={LINE}
            strokeWidth="1"
          />
        );
      })}
    </g>
  );
}

/** A jali balustrade: a rail with small pierced panels. */
function Balustrade({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={7} fill={MARBLE} stroke={LINE} strokeWidth="0.8" />
      {Array.from({ length: Math.floor(w / 9) }, (_, i) => (
        <rect key={i} x={x + 3 + i * 9} y={y + 1.8} width={4} height={3.4} fill={SHADE} />
      ))}
    </g>
  );
}

/** A projecting eave (chhajja) on small brackets. */
function Chhajja({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <path d={`M${x - 8} ${y} L${x + w + 8} ${y} L${x + w} ${y + 5} L${x} ${y + 5} Z`} fill={MARBLE} stroke={LINE} strokeWidth="0.8" />
      {Array.from({ length: Math.floor(w / 26) + 1 }, (_, i) => (
        <path key={i} d={`M${x + i * 26} ${y + 5} l3 0 l-1.5 5 Z`} fill={SHADE} />
      ))}
    </g>
  );
}

/** A small open kiosk with a gilded dome. */
function Kiosk({ x, y, s, gilt }: { x: number; y: number; s: number; gilt: boolean }) {
  const dome = gilt ? GOLD : MARBLE;
  return (
    <g>
      <rect x={x - 9 * s} y={y - 18 * s} width={18 * s} height={18 * s} fill={MARBLE} stroke={LINE} strokeWidth="0.8" />
      {[-5, 0, 5].map((d) => (
        <rect key={d} x={x + (d - 1.6) * s} y={y - 15 * s} width={3.2 * s} height={12 * s} fill={DARK} opacity="0.75" />
      ))}
      <path d={`M${x - 10.5 * s} ${y - 18 * s} L${x + 10.5 * s} ${y - 18 * s} L${x + 9 * s} ${y - 20.5 * s} L${x - 9 * s} ${y - 20.5 * s} Z`} fill={MARBLE} stroke={LINE} strokeWidth="0.6" />
      <path d={`M${x - 9 * s} ${y - 20.5 * s} C${x - 10 * s} ${y - 30 * s} ${x - 3 * s} ${y - 36 * s} ${x} ${y - 38 * s} C${x + 3 * s} ${y - 36 * s} ${x + 10 * s} ${y - 30 * s} ${x + 9 * s} ${y - 20.5 * s} Z`} fill={dome} stroke={gilt ? GOLD_LO : LINE} strokeWidth="0.8" />
      {gilt && <path d={`M${x - 4 * s} ${y - 21 * s} Q${x - 4 * s} ${y - 31 * s} ${x} ${y - 37 * s} M${x + 4 * s} ${y - 21 * s} Q${x + 4 * s} ${y - 31 * s} ${x} ${y - 37 * s}`} stroke={GOLD_LO} strokeWidth="0.7" fill="none" />}
      <path d={`M${x} ${y - 38 * s} L${x} ${y - 46 * s}`} stroke={gilt ? GOLD_HI : LINE} strokeWidth={1.4 * s} />
      <circle cx={x} cy={y - 46 * s} r={1.6 * s} fill={gilt ? GOLD_HI : LINE} />
    </g>
  );
}

function NishanSahib({ x, base, h, flip }: { x: number; base: number; h: number; flip?: boolean }) {
  const top = base - h;
  const dir = flip ? -1 : 1;
  return (
    <g>
      <rect x={x - 7} y={base - 6} width={14} height={6} fill={MARBLE} stroke={LINE} />
      <line x1={x} y1={base - 6} x2={x} y2={top} stroke="#E8870E" strokeWidth="4" />
      <line x1={x} y1={base - 6} x2={x} y2={top} stroke="#B86A08" strokeWidth="1" />
      <path d={`M${x} ${top + 4} L${x + 52 * dir} ${top + 20} L${x} ${top + 36} Z`} fill="#E8870E" stroke="#9A5206" strokeWidth="0.8" />
      <path d={`M${x} ${top} L${x - 3} ${top - 12} L${x} ${top - 16} L${x + 3} ${top - 12} Z`} fill="#C9C9C9" stroke="#6E6E6E" strokeWidth="0.6" />
    </g>
  );
}

export function AkalTakhtScene({ members, year }: { members: string[]; year: number }) {
  const grand = year >= 1800;
  const cx = 400;
  return (
    <svg viewBox="0 -44 800 424" style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--gold)' }} aria-label="The Sarbat Khalsa gathered before the Akal Takht">
      {/* sky in flat bands, with gold cloud ribbons */}
      <rect y="-44" width="800" height="424" fill="#3B5C8C" />
      <path d="M0 150 C200 140 600 160 800 146 L800 380 L0 380 Z" fill="#6F8FB4" />
      <path d="M0 220 C220 212 580 230 800 218 L800 380 L0 380 Z" fill="#A9BDD0" />
      {[[110, 70, 1], [640, 52, 0.9], [700, 120, 0.6], [60, 150, 0.6]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M0 0 C10 -14 30 -14 38 -4 C44 -14 62 -14 68 -2 C76 -10 92 -8 96 2 C88 0 82 4 80 10 C70 4 58 8 54 14 C46 6 30 6 24 12 C18 4 6 6 0 0 Z" fill="#F7EFD9" opacity="0.9" />
        </g>
      ))}
      {/* the parikrama walls and bungas behind */}
      <rect x="0" y="250" width="800" height="70" fill={SHADE} />
      {[30, 120, 640, 730].map((x) => (
        <g key={x}>
          <rect x={x} y={200} width={50} height={120} fill={MARBLE} stroke={LINE} />
          <Arches x={x + 4} y={212} w={42} h={24} n={3} />
          <Arches x={x + 4} y={250} w={42} h={30} n={3} />
        </g>
      ))}

      {/* ── The Akal Takht ── */}
      <g>
        {/* plinth and ground storey */}
        <rect x={cx - 215} y={300} width={430} height={18} fill={MARBLE} stroke={LINE} />
        <rect x={cx - 200} y={238} width={400} height={62} fill={MARBLE} stroke={LINE} />
        <Arches x={cx - 70} y={246} w={140} h={54} n={5} />
        <rect x={cx - 186} y={255} width={34} height={45} fill="#7A5230" stroke={LINE} />
        <rect x={cx + 152} y={255} width={34} height={45} fill="#7A5230" stroke={LINE} />
        <rect x={cx - 130} y={258} width={38} height={26} fill="#7A5230" opacity="0.85" />
        <rect x={cx + 92} y={258} width={38} height={26} fill="#7A5230" opacity="0.85" />
        <rect x={cx - 26} y={254} width={52} height={46} fill={GOLD} opacity="0.55" />
        <Balustrade x={cx - 205} y={231} w={410} />
        {/* first storey: the great arched gallery */}
        <rect x={cx - 190} y={168} width={380} height={63} fill={MARBLE} stroke={LINE} />
        <Arches x={cx - 120} y={174} w={240} h={57} n={5} deep="#5E4A36" />
        <Arches x={cx - 186} y={182} w={62} h={42} n={1} deep="#6B5640" />
        <Arches x={cx + 124} y={182} w={62} h={42} n={1} deep="#6B5640" />
        <Chhajja x={cx - 196} y={163} w={392} />
        <Balustrade x={cx - 198} y={156} w={396} />
        {grand ? (
          <>
            {/* second storey */}
            <rect x={cx - 165} y={112} width={330} height={44} fill={MARBLE} stroke={LINE} />
            <Arches x={cx - 150} y={118} w={300} h={34} n={9} deep="#6B5640" />
            <Chhajja x={cx - 170} y={108} w={340} />
            <Balustrade x={cx - 172} y={101} w={344} />
            {/* top pavilion */}
            <rect x={cx - 72} y={66} width={144} height={35} fill={MARBLE} stroke={LINE} />
            <Arches x={cx - 52} y={70} w={104} h={31} n={3} deep="#5E4A36" />
            <rect x={cx - 76} y={61} width={152} height={6} fill={GOLD} />
            {/* the gilded fluted dome */}
            <path d={`M${cx - 62} ${61} C${cx - 72} ${30} ${cx - 34} ${4} ${cx} ${-4} C${cx + 34} ${4} ${cx + 72} ${30} ${cx + 62} ${61} Z`} fill={GOLD} stroke={GOLD_LO} strokeWidth="1.2" />
            {[-44, -26, -9, 9, 26, 44].map((d) => (
              <path key={d} d={`M${cx + d} ${61} Q${cx + d * 0.75} ${20} ${cx} ${-3}`} stroke={GOLD_LO} strokeWidth="1.1" fill="none" />
            ))}
            <path d={`M${cx - 62} ${61} C${cx - 72} ${30} ${cx - 34} ${4} ${cx} ${-4}`} stroke={GOLD_HI} strokeWidth="2.2" fill="none" />
            {/* finial */}
            <path d={`M${cx - 9} ${-2} Q${cx} ${-12} ${cx + 9} ${-2} Z`} fill={GOLD_HI} />
            <line x1={cx} y1={-6} x2={cx} y2={-30} stroke={GOLD_HI} strokeWidth="2.6" />
            {[-14, -22].map((y) => (
              <ellipse key={y} cx={cx} cy={y} rx="5" ry="2.6" fill={GOLD_HI} />
            ))}
            {/* small gilded domes beside the great dome, and kiosks at the corners */}
            <Kiosk x={cx - 82} y={61} s={0.8} gilt />
            <Kiosk x={cx + 82} y={61} s={0.8} gilt />
            <Kiosk x={cx - 150} y={101} s={1.15} gilt />
            <Kiosk x={cx + 150} y={101} s={1.15} gilt />
            <Kiosk x={cx - 182} y={156} s={1.25} gilt />
            <Kiosk x={cx + 182} y={156} s={1.25} gilt />
          </>
        ) : (
          <>
            {/* the modest hall of the misl years, with a small white dome */}
            <rect x={cx - 60} y={124} width={120} height={32} fill={MARBLE} stroke={LINE} />
            <Arches x={cx - 46} y={128} w={92} h={28} n={3} deep="#6B5640" />
            <path d={`M${cx - 48} ${124} C${cx - 52} ${100} ${cx - 22} ${84} ${cx} ${80} C${cx + 22} ${84} ${cx + 52} ${100} ${cx + 48} ${124} Z`} fill={MARBLE} stroke={LINE} strokeWidth="1.2" />
            <line x1={cx} y1={80} x2={cx} y2={66} stroke={GOLD} strokeWidth="2" />
            <circle cx={cx} cy={64} r="3" fill={GOLD} />
            <Kiosk x={cx - 182} y={156} s={1.1} gilt={false} />
            <Kiosk x={cx + 182} y={156} s={1.1} gilt={false} />
          </>
        )}
      </g>

      {/* the two Nishan Sahibs of Miri and Piri */}
      <NishanSahib x={150} base={322} h={250} />
      <NishanSahib x={186} base={322} h={232} />

      {/* the marble courtyard */}
      <rect x="0" y="318" width="800" height="62" fill="#EDE5D0" />
      {Array.from({ length: 14 }, (_, i) => (
        <line key={i} x1={i * 62 - 30} y1={318} x2={(i - 6.5) * 120 + 400} y2={380} stroke={LINE} strokeWidth="0.8" opacity="0.6" />
      ))}
      {[330, 346, 364].map((y) => (
        <line key={y} x1={0} y1={y} x2={800} y2={y} stroke={LINE} strokeWidth="0.8" opacity="0.6" />
      ))}

      {/* the sardars of the misls, seated in a crescent under their banners */}
      {members.map((f, i) => {
        const n = members.length;
        const t = n === 1 ? 0.5 : i / (n - 1);
        const x = 90 + t * 620;
        const y = 362 - Math.sin(t * Math.PI) * 18;
        const d = FACTION_BY_ID[f];
        return (
          <g key={f} transform={`translate(${x} ${y})`}>
            <line x1="-14" y1="2" x2="-14" y2="-58" stroke="#5a3a1e" strokeWidth="1.6" />
            <path d="M-14 -58 L14 -50 L-14 -42 Z" fill={d.banner.field} stroke="#1b1712" strokeWidth="0.5" />
            <path d="M-14 -50 L6 -50" stroke={d.banner.band} strokeWidth="2" />
            <ellipse cx="0" cy="3" rx="14" ry="3.4" fill="#00000022" />
            <path d="M-9 2 Q0 -18 9 2 Z" fill="#F2E6C9" stroke="#1b1712" strokeWidth="0.6" />
            <circle cx="0" cy="-17" r="4.2" fill="#c68b59" />
            <path d="M-5 -18.5 C-6 -26 4 -28 6 -22 C6 -19 4 -18.5 2 -19 Z" fill={f === 'shaheedan' ? '#1E3FA0' : d.banner.field} stroke="#1b1712" strokeWidth="0.4" />
            <path d="M-3.5 -15 Q0 -9 3.5 -15 Z" fill="#1b1712" />
          </g>
        );
      })}
    </svg>
  );
}
