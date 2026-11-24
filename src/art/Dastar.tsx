// Dastaars for the portraits, drawn after period Pahari and Lahore paintings.
//
//  - pagg: the tall court dastaar of the misldars. A high, broad crown that
//    rises toward the back, a folded front lobe whose seam runs up from the
//    brow, and diagonal wraps across the larger back lobe.
//  - dumalla: the Akali-Nihang dumalla. A wrapped base with a patterned band, a
//    tall cone leaning forward and ringed with steel chakars, a farla curling
//    from the tip, and a full fold of cloth behind the head.
//
// Each misl also gets a signature detail so its sardars read at a glance. These
// details are game styling inspired by period dress, not historical insignia.
// Coordinates are the Portrait's box (x 0–100, y −16–120), profile facing left.
// The dastaar is drawn over the portrait's frame, as in the miniatures.

import { hpick } from '../narrative/dhadi';

type Style = 'pagg' | 'dumalla';
type Mark = 'farla' | 'chakar' | 'kalgi' | 'jigha' | 'pearls' | 'shamla' | 'band' | 'tilla' | 'pennant' | 'twotone' | 'sarpech';

interface Look {
  style: Style;
  colors?: string[];
  mark: Mark[];
}

const LOOKS: Record<string, Look> = {
  shaheedan: { style: 'dumalla', colors: ['#1E3FA0', '#22307A'], mark: ['farla', 'chakar'] },
  // Standard-bearers: a saffron court dastaar with a white under-wrap, a gold band
  // and a small nishan on a staff rising from the crown.
  nishanwalia: { style: 'pagg', colors: ['#E8870E', '#F08A1C'], mark: ['twotone', 'band', 'pennant'] },
  ramgarhia: { style: 'pagg', colors: ['#5E6B2E', '#1F3A68', '#F2E6C9'], mark: ['chakar', 'band'] },
  ahluwalia: { style: 'pagg', colors: ['#1F3A68', '#E8870E', '#F2E6C9'], mark: ['kalgi', 'sarpech'] },
  bhangi: { style: 'pagg', colors: ['#22305A', '#1F3A68'], mark: ['band', 'shamla'] },
  kanhaiya: { style: 'pagg', colors: ['#B83A2B', '#F2E6C9', '#E8870E'], mark: ['pearls'] },
  sukerchakia: { style: 'pagg', colors: ['#E6C23B', '#E8870E', '#B83A2B'], mark: ['jigha', 'sarpech'] },
  nakai: { style: 'pagg', colors: ['#7A3B69', '#B83A2B', '#F2E6C9'], mark: ['shamla'] },
  dallewalia: { style: 'pagg', colors: ['#B83A2B', '#5E6B2E'], mark: ['twotone', 'tilla'] },
  faizullapuria: { style: 'pagg', colors: ['#F2E6C9', '#E6C23B'], mark: ['jigha', 'pearls'] },
  karorasinghia: { style: 'pagg', colors: ['#5E6B2E', '#E8870E'], mark: ['twotone', 'shamla'] },
  phulkian: { style: 'pagg', colors: ['#E6C23B', '#B83A2B', '#E4D2A8'], mark: ['tilla', 'sarpech'] },
};

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
}

export function lookColor(faction: string, id: string, fallback: string) {
  const l = LOOKS[faction];
  return l?.colors ? hpick(l.colors, id, 't') : fallback;
}

/* ── The court dastaar ─────────────────────────────────────────────────── */

const PAGG = 'M41 37 C40 31 39.5 25 40.5 19 C41.5 12 47 7.5 55 6.5 C62 5.8 69 6 73.5 8.5 C77.5 11 78.5 18 77.5 26 C77 32 75.5 38 72.5 43 C70 46 66.5 45.5 65 42 C63 37.5 57 35 49 35.4 C45.5 35.6 43 36.2 41 37 Z';
const PAGG_FRONT = 'M41 37 C40 31 39.5 25 40.5 19 C41.5 12 47 7.5 55 6.5 L57 6.8 C50 15 46.5 26 45 36 C43.5 36.2 42 36.6 41 37 Z';
const PAGG_SEAM = 'M45 36 C46.5 26 50 15 57 6.8';
const PAGG_WRAPS = ['M49.5 35.3 C55 26 63 16 72 9', 'M56 36 C61 29 68 21 76.5 15', 'M62 38 C66 33 71 28 77.8 23.5', 'M66 42 C69 39 73 36 77 33'];

function Pagg({ look, turban, id, royal }: { look: Look; turban: string; id: string; royal?: boolean }) {
  const dark = shade(turban, -0.38);
  const light = shade(turban, 0.3);
  const m = new Set(look.mark);
  const second = m.has('pennant') ? '#F7F1E3' : hpick(['#E8870E', '#1F3A68', '#F2E6C9', '#B83A2B'].filter((c) => c !== turban), id, 'tt');
  return (
    <g>
      {m.has('shamla') && <path d="M73 38 C79 44 80.5 55 78.5 66 L74.5 65 C75.5 55 73.5 47 69.5 42 Z" fill={turban} stroke={dark} strokeWidth="0.7" />}
      <path d={PAGG} fill={turban} stroke={dark} strokeWidth="0.9" />
      {PAGG_WRAPS.map((d, i) => (
        <g key={i}>
          <path d={d} stroke={dark} strokeWidth="1" fill="none" opacity="0.55" />
          <path d={d} stroke={light} strokeWidth="0.6" fill="none" opacity="0.75" transform="translate(-0.8 0.4)" />
        </g>
      ))}
      <path d={PAGG_FRONT} fill={m.has('twotone') ? second : shade(turban, 0.12)} stroke={dark} strokeWidth="0.6" />
      <path d="M42.5 34 C42 28 42.5 21 45 15" stroke={m.has('twotone') ? shade(second, -0.3) : dark} strokeWidth="0.7" fill="none" opacity="0.5" />
      <path d={PAGG_SEAM} stroke={dark} strokeWidth="1.1" fill="none" />
      {m.has('band') && <path d="M41.5 36.2 C48 34.2 57 34.4 64.5 40" stroke="#C9A13B" strokeWidth="1.8" fill="none" />}
      {m.has('tilla') && <path d="M41.8 34.6 C48 32.8 57 33 64.8 38.4" stroke="#E6C766" strokeWidth="1" strokeDasharray="1.4 1.1" fill="none" />}
      {m.has('pearls') &&
        Array.from({ length: 9 }, (_, k) => {
          const t = k / 8;
          return <circle key={k} cx={46 + t * 26} cy={31 - t * 17 + Math.sin(t * Math.PI) * 2} r="1" fill="#F7F1E3" stroke="#B8AE98" strokeWidth="0.3" />;
        })}
      {m.has('chakar') && <ellipse cx="45.5" cy="22" rx="3.6" ry="8.5" fill="none" stroke="#B9BEC4" strokeWidth="1.8" />}
      {m.has('sarpech') && (
        <g>
          <path d="M45 30 C44.5 24 46 19 48.5 16 C48.5 21 48 26 47.5 30 Z" fill="#C9A13B" stroke="#8C6A1E" strokeWidth="0.4" />
          <circle cx="46.2" cy="30" r="1.5" fill="#2E8B57" stroke="#C9A13B" strokeWidth="0.5" />
        </g>
      )}
      {(m.has('kalgi') || royal) && (
        <g>
          <path d="M52 9 C49 -2 54 -10 59 -13 C57 -5 59 0 55 9 Z" fill="#F7F1E3" stroke="#C9A13B" strokeWidth="0.4" />
          <circle cx="53.5" cy="10" r="2" fill="#B83A2B" stroke="#C9A13B" strokeWidth="0.8" />
        </g>
      )}
      {m.has('pennant') && (
        <g>
          <path d="M60 7 L66 -15" stroke="#5A3A1E" strokeWidth="1.2" />
          <circle cx="66.2" cy="-15.6" r="1.1" fill="#C9A13B" />
          <path d="M65.6 -13.5 L79 -9.5 L63.8 -5.4 Z" fill="#E8870E" stroke="#8C4A06" strokeWidth="0.5" />
          <path d="M64.4 -8 L72 -9.4" stroke="#1F3A68" strokeWidth="1.2" />
        </g>
      )}
      {m.has('jigha') && !royal && (
        <g>
          <path d="M50 10 C49 4 51 0 54 -2 C53 3 54 6 52.5 10 Z" fill="#E6C766" stroke="#8C6A1E" strokeWidth="0.4" />
          <circle cx="51" cy="11" r="1.4" fill="#B83A2B" />
        </g>
      )}
    </g>
  );
}

/* ── The Nihang dumalla ────────────────────────────────────────────────── */

function Dumalla({ look, turban }: { look: Look; turban: string }) {
  const dark = shade(turban, -0.4);
  const light = shade(turban, 0.32);
  const m = new Set(look.mark);
  const steel = '#C3C8CE';
  return (
    <g>
      {/* the fold of cloth gathered behind the head */}
      <path d="M68 24 C78 22 83 30 81 39 C80 45 74 47 70 43 Z" fill={turban} stroke={dark} strokeWidth="0.8" />
      <path d="M71 27 C77 27 80 33 78.5 39" stroke={light} strokeWidth="0.7" fill="none" opacity="0.7" />
      {/* the base, wrapped close around the head */}
      <path d="M41 37 C40 32 40.5 27 43 23.5 L72 21.5 C76 26 77 33 74 40 C72 45 67 45.5 65 42 C63 37.5 57 35 49 35.4 C45.5 35.6 43 36.2 41 37 Z" fill={turban} stroke={dark} strokeWidth="0.9" />
      <path d="M42 33 C50 30 60 30 70 34" stroke={dark} strokeWidth="0.9" fill="none" opacity="0.5" />
      <path d="M42 29 C50 26 61 26 73 29" stroke={dark} strokeWidth="0.9" fill="none" opacity="0.5" />
      {/* the patterned band where the cone begins */}
      <path d="M42.8 24 L72 22 L72.6 26 L42.4 28 Z" fill={shade(turban, -0.25)} stroke={dark} strokeWidth="0.5" />
      {[0, 1, 2, 3, 4, 5, 6].map((k) => (
        <rect key={k} x={44.5 + k * 4} y={24.8 - k * 0.27} width="1.6" height="1.6" fill="#F2E6C9" />
      ))}
      {/* the tall cone, leaning forward */}
      <path d="M43.5 23.5 C45 14 47 5 50.5 -3 C51.5 -5.5 53.5 -6.5 55 -5 C59 2 65 12 71.5 22 Z" fill={turban} stroke={dark} strokeWidth="0.9" />
      {['M45 17 C52 14 60 14 67.5 17', 'M46.5 10.5 C52 8 58 8 63 11', 'M48.5 3.5 C52 1.5 55.5 1.5 58.5 4'].map((d, i) => (
        <g key={i}>
          <path d={d} stroke={dark} strokeWidth="1" fill="none" opacity="0.6" />
          <path d={d} stroke={light} strokeWidth="0.6" fill="none" opacity="0.8" transform="translate(0 -1)" />
        </g>
      ))}
      {/* steel chakars ringing the cone */}
      {m.has('chakar') &&
        [
          [56, 14.5, 12.5, 3.4],
          [55, 6.5, 8.5, 2.6],
          [53.5, -0.5, 5, 1.8],
        ].map(([cx, cy, rx, ry], i) => (
          <g key={i} transform={`rotate(-8 ${cx} ${cy})`}>
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#5E646A" strokeWidth="2.2" />
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={steel} strokeWidth="1.3" />
          </g>
        ))}
      {/* farla: the cloth end curling forward from the tip */}
      {m.has('farla') && (
        <path d="M51 -4 C49 -10 44 -13 38.5 -11 C37 -10.5 36.5 -8.5 38 -7.5 C40 -9 43.5 -8.5 45.5 -6 C47 -4 49.5 -2.5 51 -4 Z" fill={turban} stroke={dark} strokeWidth="0.7" />
      )}
      {/* a saffron pennant on a short staff tucked into the cone */}
      {m.has('pennant') && (
        <g>
          <path d="M54 0 L58 -15" stroke="#5A3A1E" strokeWidth="1" />
          <path d="M57.7 -14 L69 -12 L56.2 -8.6 Z" fill="#E8870E" stroke="#8C4A06" strokeWidth="0.5" />
        </g>
      )}
    </g>
  );
}

export function Dastar({ faction, id, color, royal }: { faction: string; id: string; color: string; royal?: boolean }) {
  const look = LOOKS[faction] ?? { style: 'pagg' as const, mark: [] };
  const turban = lookColor(faction, id, color);
  return look.style === 'dumalla' ? <Dumalla look={look} turban={turban} /> : <Pagg look={look} turban={turban} id={id} royal={royal} />;
}
