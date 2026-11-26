// The Sarbat Khalsa before the Akal Takht.
//
// The building follows the era. After Ahmad Shah blew it up in 1762 it was
// rebuilt (1774) as a two-storeyed hall with a small white dome. In the Sarkar
// years it rose to five storeys of white marble: a basement with its arcade, the
// darbar with the golden palki, the great arched gallery with its balcony, a
// storey of windows, and the drum under a ribbed, gilded onion dome. The gallery
// and the storey above it turn back at the corners, and four chhatris stand on
// the corners: two tall ones beside the dome, two low ones at the ends of the
// gallery. Two stairs climb to the darbar. The proportions follow photographs
// of the Takht.
//
// Two Nishan Sahibs, of Miri and Piri, stand beside it. The Gurus are not
// depicted. The finials are plain kalash spires: the Khanda is kept for the
// Nishan Sahib.

import { FACTION_BY_ID } from '../data/factions';

const MARBLE = '#F6F1E4';
const SIDE = '#E4DBC6'; // the faces that turn back
const SHADE = '#D6CBB2';
const LINE = '#A99A78';
const DOOR = '#7A4E2A';
const GOLD_LO = '#8F6410';

const DARK = 'url(#at-dark)';
const GILT = 'url(#at-gilt)';

/** A cusped (multifoil) arch, or a round one if lobes is 0. y is the apex. */
function archD(x: number, y: number, w: number, h: number, lobes: number): string {
  const rx = w / 2;
  const cx = x + rx;
  const ry = Math.min(h * 0.5, w * 0.62);
  const ys = y + ry;
  let d = `M${x} ${y + h} L${x} ${ys}`;
  if (!lobes) d += ` A${rx} ${ry} 0 0 1 ${x + w} ${ys}`;
  else {
    let px = x,
      py = ys;
    for (let i = 1; i <= lobes; i++) {
      const phi = Math.PI - (i * Math.PI) / lobes;
      // A slightly pointed outline: the top rises a little faster than a circle.
      const nx = cx + rx * Math.cos(phi);
      const ny = ys - ry * Math.pow(Math.sin(phi), 0.8);
      const r = Math.hypot(nx - px, ny - py) * 0.6;
      d += ` A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${nx.toFixed(2)} ${ny.toFixed(2)}`;
      px = nx;
      py = ny;
    }
  }
  return d + ` L${x + w} ${y + h} Z`;
}

function Arch({ x, y, w, h, lobes = 0, fill = DARK, frame }: { x: number; y: number; w: number; h: number; lobes?: number; fill?: string; frame?: boolean }) {
  return (
    <g>
      {frame && <rect x={x - 3} y={y - 3} width={w + 6} height={h + 3} fill="none" stroke={LINE} strokeWidth="0.7" />}
      <path d={archD(x, y, w, h, lobes)} fill={fill} stroke={LINE} strokeWidth="0.8" />
    </g>
  );
}

/** n arches side by side across [x, x+w], with slender piers between them. */
function ArchRow({ x, y, w, h, n, lobes = 0, pier = 0.22, fill = DARK, frame }: { x: number; y: number; w: number; h: number; n: number; lobes?: number; pier?: number; fill?: string; frame?: boolean }) {
  const gap = w / n;
  const aw = gap * (1 - pier);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <Arch key={i} x={x + i * gap + (gap - aw) / 2} y={y} w={aw} h={h} lobes={lobes} fill={fill} frame={frame} />
      ))}
    </g>
  );
}

/** A jali railing: a pierced marble screen between a rail and a plinth. */
function Railing({ x, y, w, h = 8 }: { x: number; y: number; w: number; h?: number }) {
  const posts = Math.max(1, Math.round(w / 16));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="url(#at-jali)" stroke={LINE} strokeWidth="0.7" />
      <rect x={x - 1} y={y - 1.5} width={w + 2} height={2.2} fill={MARBLE} stroke={LINE} strokeWidth="0.5" />
      {Array.from({ length: posts + 1 }, (_, i) => (
        <rect key={i} x={x + (i * w) / posts - 1.2} y={y - 1} width={2.4} height={h + 1} fill={MARBLE} stroke={LINE} strokeWidth="0.4" />
      ))}
    </g>
  );
}

/** A projecting eave (chhajja) on brackets, with its shadow. */
function Chhajja({ x, y, w, d = 7 }: { x: number; y: number; w: number; d?: number }) {
  return (
    <g>
      <rect x={x} y={y + 5} width={w} height={d - 2} fill="#000" opacity="0.1" />
      <path d={`M${x - 7} ${y} L${x + w + 7} ${y} L${x + w + 2} ${y + 5} L${x - 2} ${y + 5} Z`} fill={MARBLE} stroke={LINE} strokeWidth="0.7" />
      {Array.from({ length: Math.floor(w / 14) + 1 }, (_, i) => (
        <path key={i} d={`M${x + i * 14 - 1.5} ${y + 5} l3 0 l-1 ${d - 2} l-1 0 Z`} fill={SHADE} />
      ))}
    </g>
  );
}

/** An onion dome; yb is its base. */
function onionD(cx: number, yb: number, w: number, h: number): string {
  const L = (k: number) => cx - w * k,
    R = (k: number) => cx + w * k,
    Y = (k: number) => yb - h * k;
  return (
    `M${L(0.5)} ${yb} C${L(0.7)} ${Y(0.34)} ${L(0.56)} ${Y(0.72)} ${L(0.12)} ${Y(0.87)} Q${L(0.03)} ${Y(0.92)} ${cx} ${Y(1)} ` +
    `Q${R(0.03)} ${Y(0.92)} ${R(0.12)} ${Y(0.87)} C${R(0.56)} ${Y(0.72)} ${R(0.7)} ${Y(0.34)} ${R(0.5)} ${yb} Z`
  );
}

function Dome({ cx, yb, w, h, gilt = true, ribs = 0, lotus }: { cx: number; yb: number; w: number; h: number; gilt?: boolean; ribs?: number; lotus?: boolean }) {
  return (
    <g>
      <path d={onionD(cx, yb, w, h)} fill={gilt ? GILT : MARBLE} stroke={gilt ? GOLD_LO : LINE} strokeWidth="0.9" />
      {Array.from({ length: ribs }, (_, i) => {
        const k = (i + 1) / (ribs + 1) - 0.5; // -0.5..0.5
        return <path key={i} d={`M${cx + k * w * 1.05} ${yb} Q${cx + k * w * 1.35} ${yb - h * 0.55} ${cx} ${yb - h}`} stroke={gilt ? GOLD_LO : LINE} strokeWidth="0.8" fill="none" opacity="0.75" />;
      })}
      {lotus &&
        Array.from({ length: 12 }, (_, i) => {
          const pw = w / 12;
          const px = cx - w / 2 + i * pw;
          return <path key={i} d={`M${px} ${yb} q${pw / 2} ${-pw * 1.3} ${pw} 0 Z`} fill={gilt ? '#E8BF4E' : SHADE} stroke={gilt ? GOLD_LO : LINE} strokeWidth="0.5" />;
        })}
    </g>
  );
}

/** A finial of stacked kalash beads and a spike. */
function Finial({ x, y, s, gilt = true }: { x: number; y: number; s: number; gilt?: boolean }) {
  const c = gilt ? '#F1CF6E' : LINE;
  const e = gilt ? GOLD_LO : LINE;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 16 * s} stroke={c} strokeWidth={1.3 * s} />
      <ellipse cx={x} cy={y - 3 * s} rx={2.6 * s} ry={1.6 * s} fill={c} stroke={e} strokeWidth="0.4" />
      <circle cx={x} cy={y - 7 * s} r={1.9 * s} fill={c} stroke={e} strokeWidth="0.4" />
      <circle cx={x} cy={y - 10.5 * s} r={1.4 * s} fill={c} stroke={e} strokeWidth="0.4" />
      <path d={`M${x - 2.4 * s} ${y - 12.5 * s} L${x + 2.4 * s} ${y - 12.5 * s} L${x} ${y - 14.5 * s} Z`} fill={c} />
      <path d={`M${x} ${y - 14 * s} L${x} ${y - 19 * s}`} stroke={c} strokeWidth={0.9 * s} />
    </g>
  );
}

/** A chhatri: an open pavilion with a gilded dome on a tall pedestal. y is the base. */
function Chhatri({ x, y, s, pedestal, gilt = true }: { x: number; y: number; s: number; pedestal: number; gilt?: boolean }) {
  const top = y - pedestal; // floor of the pavilion
  const ph = 13 * s; // pavilion height
  return (
    <g>
      {/* the pedestal: a shaft with mouldings that flares out under the pavilion */}
      <rect x={x - 4.5 * s} y={top + 6 * s} width={9 * s} height={pedestal - 6 * s} fill={MARBLE} stroke={LINE} strokeWidth="0.7" />
      {pedestal > 20 &&
        [0.35, 0.65].map((k) => <rect key={k} x={x - 5.5 * s} y={top + 6 * s + (pedestal - 6 * s) * k} width={11 * s} height={2 * s} fill={MARBLE} stroke={LINE} strokeWidth="0.5" />)}
      <path d={`M${x - 4.5 * s} ${top + 6 * s} C${x - 5 * s} ${top + 3 * s} ${x - 9 * s} ${top + 2 * s} ${x - 10 * s} ${top} L${x + 10 * s} ${top} C${x + 9 * s} ${top + 2 * s} ${x + 5 * s} ${top + 3 * s} ${x + 4.5 * s} ${top + 6 * s} Z`} fill={MARBLE} stroke={LINE} strokeWidth="0.7" />
      <Railing x={x - 10 * s} y={top - 3 * s} w={20 * s} h={3 * s} />
      {/* the open pavilion */}
      <rect x={x - 9 * s} y={top - ph} width={18 * s} height={ph - 3 * s} fill={MARBLE} stroke={LINE} strokeWidth="0.7" />
      <ArchRow x={x - 8.4 * s} y={top - ph + 1.6 * s} w={16.8 * s} h={ph - 4.6 * s} n={3} lobes={s > 1.3 ? 4 : 0} pier={0.28} />
      <path d={`M${x - 11.5 * s} ${top - ph} L${x + 11.5 * s} ${top - ph} L${x + 9.5 * s} ${top - ph + 2.4 * s} L${x - 9.5 * s} ${top - ph + 2.4 * s} Z`} fill={MARBLE} stroke={LINE} strokeWidth="0.6" />
      <rect x={x - 8 * s} y={top - ph - 2 * s} width={16 * s} height={2 * s} fill={gilt ? GILT : MARBLE} stroke={gilt ? GOLD_LO : LINE} strokeWidth="0.4" />
      <Dome cx={x} yb={top - ph - 2 * s} w={14 * s} h={12.5 * s} gilt={gilt} ribs={s > 1.3 ? 3 : 0} />
      <Finial x={x} y={top - ph - 14.5 * s} s={s * 0.7} gilt={gilt} />
    </g>
  );
}

/** A small gilded domelet on a little drum. */
function Domelet({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g>
      <rect x={x - 5 * s} y={y - 5 * s} width={10 * s} height={5 * s} fill={MARBLE} stroke={LINE} strokeWidth="0.5" />
      <Dome cx={x} yb={y - 5 * s} w={10 * s} h={10 * s} />
      <Finial x={x} y={y - 15 * s} s={s * 0.5} />
    </g>
  );
}

function NishanSahib({ x, base, h, flip }: { x: number; base: number; h: number; flip?: boolean }) {
  const top = base - h;
  const dir = flip ? -1 : 1;
  return (
    <g>
      <rect x={x - 8} y={base - 8} width={16} height={8} fill={MARBLE} stroke={LINE} />
      <rect x={x - 5} y={base - 12} width={10} height={4} fill={MARBLE} stroke={LINE} />
      <line x1={x} y1={base - 12} x2={x} y2={top} stroke="#E8870E" strokeWidth="4" />
      <line x1={x + 1} y1={base - 12} x2={x + 1} y2={top} stroke="#B86A08" strokeWidth="1" />
      <path d={`M${x} ${top + 4} L${x + 46 * dir} ${top + 19} L${x} ${top + 34} Z`} fill="#E8870E" stroke="#9A5206" strokeWidth="0.8" />
      <path d={`M${x} ${top} L${x - 3} ${top - 12} L${x} ${top - 16} L${x + 3} ${top - 12} Z`} fill="#C9C9C9" stroke="#6E6E6E" strokeWidth="0.6" />
    </g>
  );
}

/** A golden palki under a small dome, seen through the darbar's central arch. */
function Palki({ x, base }: { x: number; base: number }) {
  return (
    <g>
      <rect x={x - 22} y={base - 46} width={44} height={46} fill="#F3D27A" opacity="0.18" />
      <rect x={x - 12} y={base - 12} width={24} height={12} fill={GILT} stroke={GOLD_LO} strokeWidth="0.6" />
      {[-10, 10].map((d) => (
        <rect key={d} x={x + d - 1.2} y={base - 27} width={2.4} height={15} fill={GILT} />
      ))}
      <rect x={x - 13} y={base - 29} width={26} height={3} fill={GILT} stroke={GOLD_LO} strokeWidth="0.4" />
      <Dome cx={x} yb={base - 29} w={20} h={13} />
      <Finial x={x} y={base - 42} s={0.4} />
    </g>
  );
}

/** One side of the stairs that climb to the darbar terrace. */
function Stair({ x0, x1, yTop, yBot }: { x0: number; x1: number; yTop: number; yBot: number }) {
  const n = 9;
  const steps = Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / (n + 1);
    return { x: x0 + (x1 - x0) * t, y: yBot - (yBot - yTop) * t };
  });
  return (
    <g>
      <path d={`M${x0} ${yBot} L${x1} ${yTop} L${x1} ${yBot} Z`} fill={MARBLE} stroke={LINE} strokeWidth="0.7" />
      {steps.map((p, i) => (
        <line key={i} x1={p.x} y1={p.y} x2={x1} y2={p.y} stroke={LINE} strokeWidth="0.6" />
      ))}
      <line x1={x0} y1={yBot - 10} x2={x1} y2={yTop - 10} stroke="#C9A13B" strokeWidth="1.4" />
      {steps.filter((_, i) => i % 3 === 0).map((p, i) => (
        <line key={i} x1={p.x} y1={p.y} x2={p.x} y2={p.y - 10} stroke="#C9A13B" strokeWidth="0.9" />
      ))}
    </g>
  );
}

const sym = (cx: number, x: number, w = 0) => 2 * cx - x - w;

export function AkalTakhtScene({ members, year }: { members: string[]; year: number }) {
  const grand = year >= 1800;
  const cx = 400;
  return (
    <svg viewBox="0 -86 800 466" style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--gold)' }} aria-label="The Sarbat Khalsa gathered before the Akal Takht">
      <defs>
        <linearGradient id="at-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5E8DC8" />
          <stop offset="0.7" stopColor="#A9C5E3" />
          <stop offset="1" stopColor="#D6E3EF" />
        </linearGradient>
        <linearGradient id="at-gilt" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9A6A12" />
          <stop offset="0.28" stopColor="#F4D57E" />
          <stop offset="0.5" stopColor="#DDAE38" />
          <stop offset="0.82" stopColor="#B98418" />
          <stop offset="1" stopColor="#7E560D" />
        </linearGradient>
        <linearGradient id="at-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B2B1E" />
          <stop offset="1" stopColor="#6A5440" />
        </linearGradient>
        <pattern id="at-jali" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill={MARBLE} />
          <path d="M2.5 0.8 L4.2 2.5 L2.5 4.2 L0.8 2.5 Z" fill={SHADE} />
        </pattern>
      </defs>

      {/* the sky, with a few clouds */}
      <rect y="-86" width="800" height="466" fill="url(#at-sky)" />
      {[[70, -40, 1], [600, -55, 0.85], [680, 40, 0.7], [20, 90, 0.6], [520, 110, 0.5]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M0 0 C10 -14 30 -14 38 -4 C44 -14 62 -14 68 -2 C76 -10 92 -8 96 2 C88 0 82 4 80 10 C70 4 58 8 54 14 C46 6 30 6 24 12 C18 4 6 6 0 0 Z" fill="#FFFFFF" opacity="0.85" />
        </g>
      ))}

      {/* the parikrama: an older bunga to the left, white arcades to the right */}
      <g>
        <rect x={0} y={214} width={150} height={104} fill="#D8C7A2" stroke={LINE} />
        <rect x={0} y={208} width={154} height={6} fill="#CDBA92" stroke={LINE} strokeWidth="0.6" />
        <ArchRow x={4} y={224} w={140} h={30} n={5} lobes={0} pier={0.3} />
        <ArchRow x={4} y={270} w={140} h={44} n={5} lobes={4} pier={0.3} />
        <rect x={650} y={222} width={150} height={96} fill={MARBLE} stroke={LINE} />
        <Railing x={648} y={214} w={152} />
        <ArchRow x={656} y={230} w={140} h={28} n={5} lobes={4} pier={0.3} />
        <Railing x={650} y={262} w={150} h={6} />
        <ArchRow x={656} y={276} w={140} h={42} n={5} lobes={4} pier={0.3} />
      </g>

      {/* ── The Akal Takht ── */}
      <g>
        {/* stairs to the darbar terrace */}
        <Stair x0={140} x1={190} yTop={272} yBot={318} />
        <g transform={`translate(${2 * cx} 0) scale(-1 1)`}>
          <Stair x0={140} x1={190} yTop={272} yBot={318} />
        </g>

        {/* the basement storey: shuttered windows and a small arcade */}
        <rect x={190} y={274} width={420} height={44} fill={MARBLE} stroke={LINE} />
        <rect x={186} y={312} width={428} height={6} fill={SHADE} stroke={LINE} strokeWidth="0.6" />
        {[206, 262].flatMap((x) => [x, sym(cx, x, 34)]).map((x) => (
          <g key={x}>
            <rect x={x - 2} y={282} width={38} height={26} fill={MARBLE} stroke={LINE} strokeWidth="0.7" />
            <rect x={x} y={284} width={34} height={22} fill={DOOR} />
            {[1, 2, 3].map((k) => (
              <line key={k} x1={x + (k * 34) / 4} y1={284} x2={x + (k * 34) / 4} y2={306} stroke="#5A3618" strokeWidth="0.8" />
            ))}
          </g>
        ))}
        <ArchRow x={348} y={281} w={104} h={37} n={5} lobes={4} pier={0.26} />
        <Railing x={184} y={266} w={432} />

        {/* the darbar: the golden palki in the middle, arched doorways either side */}
        <rect x={200} y={206} width={400} height={60} fill={MARBLE} stroke={LINE} />
        <rect x={343} y={218} width={114} height={48} fill={DARK} />
        <ArchRow x={343} y={218} w={114} h={48} n={3} lobes={6} pier={0.12} fill="#4A3828" />
        <Palki x={cx} base={266} />
        {[272, sym(cx, 272, 60)].map((x) => (
          <g key={x}>
            <Arch x={x} y={216} w={60} h={50} lobes={6} fill={SHADE} frame />
            <rect x={x + 16} y={238} width={28} height={28} fill={DOOR} stroke="#5A3618" strokeWidth="0.8" />
            <line x1={x + 30} y1={238} x2={x + 30} y2={266} stroke="#5A3618" strokeWidth="0.8" />
          </g>
        ))}
        {[212, sym(cx, 212, 40)].map((x) => (
          <g key={x}>
            <Arch x={x} y={222} w={40} h={44} lobes={4} fill={SHADE} frame />
            <rect x={x + 10} y={240} width={20} height={26} fill={DOOR} stroke="#5A3618" strokeWidth="0.8" />
          </g>
        ))}
        {[262, 338, 462, 538].map((x) => (
          <rect key={x} x={x - 1.5} y={208} width={3} height={58} fill={SIDE} />
        ))}
        <Chhajja x={198} y={204} w={404} />

        {grand ? (
          <>
            {/* the great gallery, with its balcony; its ends turn back */}
            <rect x={226} y={140} width={348} height={64} fill={MARBLE} stroke={LINE} />
            <path d="M180 146 L226 140 L226 204 L180 204 Z" fill={SIDE} stroke={LINE} />
            <path d="M620 146 L574 140 L574 204 L620 204 Z" fill={SIDE} stroke={LINE} />
            <ArchRow x={290} y={150} w={220} h={46} n={5} lobes={6} pier={0.2} frame />
            {[236, sym(cx, 236, 44)].map((x) => (
              <g key={x}>
                <Arch x={x} y={150} w={44} h={46} lobes={6} fill={SHADE} frame />
                <Arch x={x + 12} y={164} w={20} h={30} lobes={0} />
              </g>
            ))}
            <Arch x={188} y={154} w={30} h={42} lobes={4} />
            <Arch x={582} y={154} w={30} h={42} lobes={4} />
            <Railing x={178} y={194} w={444} h={9} />
            <Chhajja x={180} y={134} w={440} />
            <Railing x={182} y={126} w={436} />

            {/* the storey of windows */}
            <rect x={272} y={82} width={256} height={46} fill={MARBLE} stroke={LINE} />
            <path d="M252 86 L272 82 L272 128 L252 128 Z" fill={SIDE} stroke={LINE} />
            <path d="M548 86 L528 82 L528 128 L548 128 Z" fill={SIDE} stroke={LINE} />
            <line x1={252} y1={92} x2={548} y2={92} stroke={LINE} strokeWidth="0.6" />
            <ArchRow x={276} y={98} w={248} h={26} n={7} lobes={0} pier={0.45} frame />
            <Arch x={257} y={100} w={10} h={24} />
            <Arch x={533} y={100} w={10} h={24} />
            <Chhajja x={252} y={76} w={296} />
            <Railing x={246} y={68} w={308} />

            {/* the drum, the gilded dome and its finial */}
            <rect x={352} y={44} width={96} height={24} fill={MARBLE} stroke={LINE} />
            <ArchRow x={360} y={49} w={80} h={19} n={3} lobes={4} pier={0.4} />
            <rect x={346} y={38} width={108} height={6} fill={GILT} stroke={GOLD_LO} strokeWidth="0.6" />
            <Dome cx={cx} yb={38} w={88} h={74} ribs={7} lotus />
            <Finial x={cx} y={-36} s={2.0} />

            {/* domelets at the corners of the drum and of the roof */}
            <Domelet x={347} y={44} s={1.1} />
            <Domelet x={453} y={44} s={1.1} />
            <Domelet x={300} y={68} s={1.2} />
            <Domelet x={500} y={68} s={1.2} />

            {/* the four chhatris */}
            <Chhatri x={272} y={126} s={1.6} pedestal={78} />
            <Chhatri x={528} y={126} s={1.6} pedestal={78} />
            <Chhatri x={196} y={128} s={1.2} pedestal={22} />
            <Chhatri x={604} y={128} s={1.2} pedestal={22} />
          </>
        ) : (
          <>
            {/* the modest hall of the misl years, under a small white dome */}
            <Railing x={196} y={196} w={408} />
            <rect x={318} y={150} width={164} height={46} fill={MARBLE} stroke={LINE} />
            <ArchRow x={326} y={158} w={148} h={36} n={3} lobes={6} pier={0.22} frame />
            <Chhajja x={316} y={144} w={168} />
            <rect x={352} y={128} width={96} height={16} fill={MARBLE} stroke={LINE} />
            <Dome cx={cx} yb={128} w={82} h={54} gilt={false} ribs={5} lotus />
            <Finial x={cx} y={74} s={1.6} />
            <Chhatri x={214} y={196} s={1.1} pedestal={10} gilt={false} />
            <Chhatri x={586} y={196} s={1.1} pedestal={10} gilt={false} />
          </>
        )}
      </g>

      {/* the two Nishan Sahibs of Miri and Piri */}
      <NishanSahib x={88} base={322} h={372} flip />
      <NishanSahib x={118} base={322} h={350} flip />

      {/* the marble courtyard */}
      <rect x="0" y="318" width="800" height="62" fill="#EEE7D6" />
      {Array.from({ length: 14 }, (_, i) => (
        <line key={i} x1={i * 62 - 30} y1={318} x2={(i - 6.5) * 120 + 400} y2={380} stroke={LINE} strokeWidth="0.7" opacity="0.5" />
      ))}
      {[330, 346, 364].map((y) => (
        <line key={y} x1={0} y1={y} x2={800} y2={y} stroke={LINE} strokeWidth="0.7" opacity="0.5" />
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
