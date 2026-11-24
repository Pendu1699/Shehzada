// The title painting: Amritsar at first light, painted in the manner of a
// Pahari / Lahore miniature. Flat fields of pigment, gold for light, every tree
// and ripple drawn as a pattern, no airbrushed gradients. The Harmandir stands
// in the sarovar on its causeway; the parikrama is ringed with bungas, cypresses
// and flowering trees. No figures are shown.

import { mulberry } from './util';

const C = {
  lapis: '#1C2D5C',
  indigo: '#2D2F66',
  dusk: '#6E3F6A',
  saffron: '#E59A3A',
  cream: '#F5DFA6',
  hill: '#7D8A5A',
  hill2: '#5E6B45',
  marble: '#F1E9D6',
  marbleShade: '#D8CCB0',
  gold: '#D9A930',
  goldHi: '#F3D27A',
  goldLo: '#9C6F14',
  water: '#2F6A6A',
  waterHi: '#5E9C93',
  cypress: '#24432E',
  cypressHi: '#3A6646',
  leaf: '#3F6B3A',
  bloom: '#E8A0A8',
  bloom2: '#F6E3E0',
  sindoor: '#B83A2B',
  ink: '#1B1712',
};

/** A tall cypress, drawn as a flame of overlapping leaf-scales. */
function Cypress({ x, y, h }: { x: number; y: number; h: number }) {
  const w = h * 0.16;
  const scales = Array.from({ length: Math.floor(h / 9) }, (_, i) => {
    const t = i / (h / 9);
    const yy = y - h * (1 - t) + 4;
    const ww = w * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5) * (0.4 + 0.6 * t);
    return <path key={i} d={`M${x - ww} ${yy} Q${x} ${yy - 7} ${x + ww} ${yy}`} stroke={C.cypressHi} strokeWidth="1.2" fill="none" />;
  });
  return (
    <g>
      <path d={`M${x} ${y - h} C${x + w * 0.9} ${y - h * 0.6} ${x + w * 1.1} ${y - h * 0.15} ${x + w * 0.5} ${y} L${x - w * 0.5} ${y} C${x - w * 1.1} ${y - h * 0.15} ${x - w * 0.9} ${y - h * 0.6} ${x} ${y - h} Z`} fill={C.cypress} />
      {scales}
      <rect x={x - 1.5} y={y - 2} width="3" height="8" fill="#4A3220" />
    </g>
  );
}

/** A round flowering tree: a dark crown dotted with blossom, as the painters did it. */
function BloomTree({ x, y, r, seed, bloom = C.bloom }: { x: number; y: number; r: number; seed: number; bloom?: string }) {
  const rnd = mulberry(seed);
  const dots = Array.from({ length: Math.floor(r * 1.6) }, () => {
    const a = rnd() * Math.PI * 2,
      d = Math.sqrt(rnd()) * r * 0.92;
    return [x + Math.cos(a) * d, y - r + Math.sin(a) * d * 0.85] as const;
  });
  return (
    <g>
      <path d={`M${x - 3} ${y + 26} L${x - 2} ${y - r * 0.4} M${x + 2} ${y + 26} L${x + 3} ${y - r * 0.3}`} stroke="#4A3220" strokeWidth="3" />
      <ellipse cx={x} cy={y - r} rx={r} ry={r * 0.85} fill={C.leaf} />
      <ellipse cx={x - r * 0.25} cy={y - r * 1.15} rx={r * 0.6} ry={r * 0.45} fill="#4F7F46" opacity="0.6" />
      {dots.map(([dx, dy], i) => (
        <circle key={i} cx={dx} cy={dy} r={1.7} fill={i % 4 === 0 ? C.bloom2 : bloom} />
      ))}
    </g>
  );
}

/** A bunga: a tall tower-house on the parikrama, with arched windows and a chhatri. */
function Bunga({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const rows = Math.floor(h / 22);
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} fill={C.marble} stroke={C.marbleShade} strokeWidth="1" />
      <rect x={x + w - 6} y={y - h} width={6} height={h} fill={C.marbleShade} />
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: Math.max(1, Math.floor(w / 14)) }, (_, c) => {
          const wx = x + 5 + c * 14,
            wy = y - h + 10 + r * 22;
          return <path key={`${r}-${c}`} d={`M${wx} ${wy + 10} L${wx} ${wy + 3} Q${wx + 3.5} ${wy - 2} ${wx + 7} ${wy + 3} L${wx + 7} ${wy + 10} Z`} fill="#6B5A44" />;
        }),
      )}
      <path d={`M${x - 3} ${y - h} L${x + w + 3} ${y - h}`} stroke={C.marbleShade} strokeWidth="3" />
      <path d={`M${x + w / 2 - 9} ${y - h} Q${x + w / 2} ${y - h - 20} ${x + w / 2 + 9} ${y - h} Z`} fill={C.marble} stroke={C.marbleShade} />
      <path d={`M${x + w / 2} ${y - h - 19} L${x + w / 2} ${y - h - 26}`} stroke={C.gold} strokeWidth="1.5" />
    </g>
  );
}

/** A small gilded chhatri: four posts and a ribbed dome. */
function Chhatri({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g>
      <rect x={x - 7 * s} y={y - 9 * s} width={14 * s} height={9 * s} fill={C.gold} />
      {[-5, 0, 5].map((d) => (
        <rect key={d} x={x + (d - 1.2) * s} y={y - 8 * s} width={2.4 * s} height={7 * s} fill={C.goldLo} />
      ))}
      <path d={`M${x - 8 * s} ${y - 9 * s} Q${x} ${y - 25 * s} ${x + 8 * s} ${y - 9 * s} Z`} fill={C.gold} />
      <path d={`M${x} ${y - 23 * s} L${x} ${y - 9 * s} M${x - 4 * s} ${y - 20 * s} Q${x - 4 * s} ${y - 12 * s} ${x - 6 * s} ${y - 9 * s} M${x + 4 * s} ${y - 20 * s} Q${x + 4 * s} ${y - 12 * s} ${x + 6 * s} ${y - 9 * s}`} stroke={C.goldLo} strokeWidth={0.8 * s} fill="none" />
      <path d={`M${x} ${y - 24 * s} L${x} ${y - 30 * s}`} stroke={C.goldHi} strokeWidth={1.2 * s} />
      <circle cx={x} cy={y - 30 * s} r={1.6 * s} fill={C.goldHi} />
    </g>
  );
}

/** The Harmandir: a marble lower storey of cusped arches, a gilded upper storey, a fluted dome. */
function Harmandir({ x, y }: { x: number; y: number }) {
  const W = 150;
  const L = x - W / 2;
  const arches = Array.from({ length: 5 }, (_, i) => {
    const ax = L + 12 + i * 26.5;
    return <path key={i} d={`M${ax} ${y - 6} L${ax} ${y - 34} Q${ax + 4} ${y - 44} ${ax + 9} ${y - 46} Q${ax + 14} ${y - 44} ${ax + 18} ${y - 34} L${ax + 18} ${y - 6} Z`} fill="#3E2E1E" stroke={C.gold} strokeWidth="1" />;
  });
  return (
    <g>
      {/* marble plinth and lower storey */}
      <rect x={L - 8} y={y - 6} width={W + 16} height={10} fill={C.marble} stroke={C.marbleShade} />
      <rect x={L} y={y - 56} width={W} height={50} fill={C.marble} stroke={C.marbleShade} />
      {/* pietra-dura inlay band */}
      {Array.from({ length: 14 }, (_, i) => (
        <circle key={i} cx={L + 6 + i * 10.6} cy={y - 51} r="2" fill={i % 2 ? C.sindoor : '#2F6A4A'} />
      ))}
      {arches}
      {/* gilded upper storey */}
      <rect x={L + 4} y={y - 104} width={W - 8} height={48} fill={C.gold} />
      <rect x={L + 4} y={y - 104} width={W - 8} height={48} fill="none" stroke={C.goldLo} strokeWidth="1.2" />
      {/* embossed panels on the gold */}
      {Array.from({ length: 6 }, (_, i) => {
        const px = L + 12 + i * 22;
        return (
          <g key={i}>
            <path d={`M${px} ${y - 62} L${px} ${y - 84} Q${px + 7} ${y - 98} ${px + 14} ${y - 84} L${px + 14} ${y - 62} Z`} fill="none" stroke={C.goldLo} strokeWidth="1.1" />
            <circle cx={px + 7} cy={y - 76} r="3" fill="none" stroke={C.goldHi} strokeWidth="0.8" />
          </g>
        );
      })}
      <path d={`M${L} ${y - 104} L${L + W} ${y - 104}`} stroke={C.goldHi} strokeWidth="3" />
      {/* parapet of small kanguras */}
      {Array.from({ length: 19 }, (_, i) => (
        <path key={i} d={`M${L + 2 + i * 7.8} ${y - 105} l2 -5 l2 0 l2 5 Z`} fill={C.gold} />
      ))}
      {/* corner chhatris */}
      <Chhatri x={L + 12} y={y - 108} s={0.9} />
      <Chhatri x={L + W - 12} y={y - 108} s={0.9} />
      {/* the central fluted dome on a drum */}
      <rect x={x - 30} y={y - 130} width={60} height={22} fill={C.gold} stroke={C.goldLo} />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${x - 26 + i * 8.6} ${y - 110} L${x - 26 + i * 8.6} ${y - 126} Q${x - 22 + i * 8.6} ${y - 131} ${x - 18 + i * 8.6} ${y - 126} L${x - 18 + i * 8.6} ${y - 110}`} fill="none" stroke={C.goldLo} strokeWidth="1" />
      ))}
      <path d={`M${x - 36} ${y - 130} C${x - 40} ${y - 160} ${x - 18} ${y - 182} ${x} ${y - 192} C${x + 18} ${y - 182} ${x + 40} ${y - 160} ${x + 36} ${y - 130} Z`} fill={C.gold} />
      {[-24, -12, 0, 12, 24].map((d) => (
        <path key={d} d={`M${x + d} ${y - 130} Q${x + d * 0.7} ${y - 165} ${x} ${y - 190}`} stroke={C.goldLo} strokeWidth="1.2" fill="none" />
      ))}
      <path d={`M${x - 36} ${y - 130} C${x - 40} ${y - 160} ${x - 18} ${y - 182} ${x} ${y - 192}`} stroke={C.goldHi} strokeWidth="2" fill="none" />
      {/* inverted lotus and finial */}
      <path d={`M${x - 8} ${y - 190} Q${x} ${y - 200} ${x + 8} ${y - 190} Z`} fill={C.goldHi} />
      <path d={`M${x} ${y - 198} L${x} ${y - 216}`} stroke={C.goldHi} strokeWidth="2.4" />
      {[204, 210].map((d) => (
        <circle key={d} cx={x} cy={y - d} r="3" fill={C.goldHi} />
      ))}
      {/* small domes either side of the main dome */}
      <Chhatri x={x - 52} y={y - 108} s={0.75} />
      <Chhatri x={x + 52} y={y - 108} s={0.75} />
    </g>
  );
}

/** Gold cloud-ribbons of the Persian-Mughal kind (the 'chi' cloud). */
function CloudRibbon({ x, y, s, flip }: { x: number; y: number; s: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path
        d="M0 0 C10 -14 30 -14 38 -4 C44 -14 62 -14 68 -2 C76 -10 92 -8 96 2 C88 0 82 4 80 10 C70 4 58 8 54 14 C46 6 30 6 24 12 C18 4 6 6 0 0 Z"
        fill={C.goldHi}
        opacity="0.9"
      />
      <path d="M8 2 C16 -6 28 -6 34 0 M44 2 C50 -6 60 -6 64 2 M72 4 C78 -2 86 -2 90 2" stroke={C.goldLo} strokeWidth="1.2" fill="none" />
      <path d="M24 12 C20 22 30 28 36 22 C38 18 34 14 30 17" stroke={C.goldHi} strokeWidth="2.2" fill="none" />
    </g>
  );
}

/** A foreground flowering plant, as in the borders of the Shah Jahan albums. */
function Plant({ x, y, seed, flower }: { x: number; y: number; seed: number; flower: string }) {
  const rnd = mulberry(seed);
  const h = 50 + rnd() * 40;
  const lean = (rnd() - 0.5) * 14;
  const leaves = Array.from({ length: 4 }, (_, i) => {
    const t = 0.15 + i * 0.18;
    const side = i % 2 ? 1 : -1;
    const lx = x + lean * t,
      ly = y - h * t;
    return <path key={i} d={`M${lx} ${ly} C${lx + side * 10} ${ly - 4} ${lx + side * 18} ${ly - 14} ${lx + side * 22} ${ly - 22} C${lx + side * 12} ${ly - 18} ${lx + side * 4} ${ly - 10} ${lx} ${ly} Z`} fill={i % 2 ? C.leaf : '#557F45'} />;
  });
  const fx = x + lean,
    fy = y - h;
  return (
    <g>
      <path d={`M${x} ${y} Q${x + lean * 0.4} ${y - h * 0.5} ${fx} ${fy}`} stroke="#4F6B33" strokeWidth="2" fill="none" />
      {leaves}
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={fx} cy={fy - 6} rx="4" ry="7" transform={`rotate(${a} ${fx} ${fy})`} fill={flower} />
      ))}
      <circle cx={fx} cy={fy} r="3" fill={C.goldHi} />
    </g>
  );
}

export function MiniaturePainting() {
  const rnd = mulberry(1748);
  const H0 = 470; // the line of the far bank
  const WATER = 560; // the near edge of the parikrama / start of the water
  const cx = 800;
  // Ripples: a basket-weave of small arcs, the way water is painted in miniatures.
  const ripples: JSX.Element[] = [];
  for (let row = 0; row < 16; row++) {
    const yy = WATER + 26 + row * 18;
    for (let col = 0; col < 42; col++) {
      const xx = col * 40 + (row % 2) * 20 - 10;
      if (Math.abs(xx + 10 - cx) < 70 && yy < 760) continue; // keep the reflection clear
      ripples.push(<path key={`${row}-${col}`} d={`M${xx} ${yy} q10 -6 20 0`} stroke={C.waterHi} strokeWidth="1.3" fill="none" opacity={0.55} />);
    }
  }
  const lotuses = Array.from({ length: 12 }, () => [rnd() * 1600, WATER + 120 + rnd() * 200] as const).filter(([x]) => Math.abs(x - cx) > 140);
  return (
    <svg className="dawn" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* sky in flat painted bands */}
      <rect width="1600" height="900" fill={C.lapis} />
      <path d="M0 250 C300 236 520 262 800 248 C1080 234 1300 260 1600 246 L1600 900 L0 900 Z" fill={C.indigo} />
      <path d="M0 340 C260 330 560 352 800 338 C1040 326 1340 348 1600 336 L1600 900 L0 900 Z" fill={C.dusk} />
      <path d="M0 400 C300 392 540 410 800 398 C1060 388 1320 406 1600 396 L1600 900 L0 900 Z" fill={C.saffron} />
      <path d="M0 440 C300 434 520 448 800 438 C1080 430 1300 446 1600 438 L1600 900 L0 900 Z" fill={C.cream} />
      {/* stars and a thin moon in the dark */}
      {Array.from({ length: 34 }, (_, i) => (
        <circle key={i} cx={(i * 211) % 1600} cy={20 + ((i * 97) % 200)} r={i % 5 === 0 ? 1.8 : 1} fill={C.goldHi} opacity="0.8" />
      ))}
      <path d="M1290 96 a26 26 0 1 0 22 40 a20 20 0 1 1 -22 -40 Z" fill={C.goldHi} />
      <CloudRibbon x={220} y={170} s={1.3} />
      <CloudRibbon x={1180} y={210} s={1.1} flip />
      <CloudRibbon x={560} y={300} s={0.8} />
      <CloudRibbon x={1420} y={330} s={0.7} flip />
      {/* birds in a skein */}
      {[
        [980, 280],
        [1004, 292],
        [1028, 286],
        [1052, 298],
        [1076, 292],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q6 -6 12 0 q6 -6 12 0`} stroke={C.ink} strokeWidth="1.6" fill="none" className="bird" />
      ))}
      {/* the far hills, stippled with trees */}
      <path d={`M0 ${H0} C120 440 220 450 320 438 C420 426 520 452 640 444 L960 444 C1080 452 1180 424 1280 434 C1380 444 1480 430 1600 442 L1600 ${H0 + 20} L0 ${H0 + 20} Z`} fill={C.hill} />
      {Array.from({ length: 60 }, (_, i) => {
        const x = (i * 27.3) % 1600;
        if (x > 640 && x < 960) return null;
        return <circle key={i} cx={x} cy={452 + ((i * 13) % 14)} r={3 + (i % 3)} fill={C.hill2} />;
      })}
      {/* the parikrama: marble walk, bungas and trees */}
      {[
        [40, 70, 120],
        [190, 56, 96],
        [1340, 60, 104],
        [1480, 74, 128],
      ].map(([x, w, h], i) => (
        <Bunga key={i} x={x} y={WATER - 18} w={w} h={h} />
      ))}
      {[150, 300, 360, 1280, 1450].map((x, i) => (
        <Cypress key={i} x={x} y={WATER - 16} h={110 + (i % 2) * 30} />
      ))}
      <BloomTree x={430} y={WATER - 24} r={40} seed={3} />
      <BloomTree x={520} y={WATER - 22} r={30} seed={5} bloom="#F2C3C8" />
      <BloomTree x={1110} y={WATER - 22} r={34} seed={7} />
      <BloomTree x={1200} y={WATER - 24} r={42} seed={9} bloom="#F2C3C8" />
      <Cypress x={600} y={WATER - 16} h={96} />
      <Cypress x={1010} y={WATER - 16} h={104} />
      <rect x="0" y={WATER - 20} width="1600" height="22" fill={C.marble} />
      {Array.from({ length: 80 }, (_, i) => (
        <rect key={i} x={i * 20} y={WATER - 20} width="10" height="22" fill={C.marbleShade} opacity="0.5" />
      ))}
      <rect x="0" y={WATER - 22} width="1600" height="3" fill={C.marbleShade} />
      {/* the sarovar */}
      <rect x="0" y={WATER + 2} width="1600" height={900 - WATER} fill={C.water} />
      {ripples}
      {/* the reflection, broken by ripples */}
      <g opacity="0.32" transform={`translate(0 ${2 * (WATER + 96)}) scale(1 -1)`}>
        <Harmandir x={cx} y={WATER + 96} />
      </g>
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M${cx - 70 + (i % 3) * 8} ${WATER + 112 + i * 14} l${130 - (i % 3) * 14} 0`} stroke={C.water} strokeWidth="3" />
      ))}
      {/* the causeway from the Darshani Deori */}
      <rect x="560" y={WATER + 84} width={cx - 560 - 70} height="12" fill={C.marble} stroke={C.marbleShade} />
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i}>
          <rect x={572 + i * 17} y={WATER + 72} width="2" height="12" fill={C.goldLo} />
          <circle cx={573 + i * 17} cy={WATER + 71} r="2.6" fill={C.goldHi} className="diya" style={{ animationDelay: `${(i * 0.31) % 2}s` }} />
        </g>
      ))}
      <g>
        <rect x="520" y={WATER + 30} width="50" height="66" fill={C.marble} stroke={C.marbleShade} />
        <path d={`M532 ${WATER + 96} L532 ${WATER + 62} Q545 ${WATER + 46} 558 ${WATER + 62} L558 ${WATER + 96} Z`} fill="#3E2E1E" />
        <Chhatri x={545} y={WATER + 30} s={0.8} />
      </g>
      <Harmandir x={cx} y={WATER + 96} />
      {/* lotuses and ducks on the water */}
      {lotuses.map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="14" ry="4" fill="#3F6B3A" />
          {i % 2 === 0 && (
            <g>
              <path d={`M${x - 5} ${y - 1} Q${x - 6} ${y - 10} ${x} ${y - 13} Q${x + 6} ${y - 10} ${x + 5} ${y - 1} Z`} fill={C.bloom} />
              <path d={`M${x} ${y - 1} Q${x - 2} ${y - 8} ${x} ${y - 12} Q${x + 2} ${y - 8} ${x} ${y - 1} Z`} fill={C.bloom2} />
            </g>
          )}
        </g>
      ))}
      {[
        [300, WATER + 140],
        [340, WATER + 150],
        [1240, WATER + 190],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${i === 2 ? -1 : 1} 1)`}>
          <path d="M-12 0 C-12 -8 6 -10 10 -4 L14 -12 C18 -14 20 -12 18 -9 L22 -8 L16 -6 C16 2 4 4 -12 0 Z" fill="#F1E9D6" stroke={C.ink} strokeWidth="0.6" />
          <path d="M-8 -2 C-2 -6 6 -6 10 -3" stroke={C.marbleShade} strokeWidth="1" fill="none" />
        </g>
      ))}
      {/* the flowering near bank */}
      <path d="M0 860 C200 846 380 866 600 852 C820 840 1000 864 1200 850 C1380 840 1500 856 1600 848 L1600 900 L0 900 Z" fill="#4A5E34" />
      {Array.from({ length: 22 }, (_, i) => (
        <Plant key={i} x={30 + i * 74 + ((i * 17) % 30)} y={872} seed={i + 11} flower={[C.sindoor, C.bloom, '#F2E6C9', '#E59A3A'][i % 4]} />
      ))}
    </svg>
  );
}
