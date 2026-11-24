// Dastaars for the portraits: a wrapped turban drawn in layers (visible folds,
// a light edge on each wrap, a darker under-fold), plus one signature detail per
// misl so its sardars are recognisable at a glance. Coordinates are the
// Portrait's 0–100 × 0–120 box, profile facing left.
//
// The signature details are game styling inspired by period dress (dumallas and
// farlas of the Akali-Nihangs, chakars, jighas and kalgis, pearl strings). They
// are not claims about any misl's historical insignia.

import { hpick } from '../narrative/dhadi';

type Style = 'pagg' | 'dumalla';
type Mark = 'farla' | 'chakar' | 'kalgi' | 'jigha' | 'pearls' | 'shamla' | 'band' | 'tilla' | 'pennant' | 'twotone' | 'sarpech' | 'none';

interface Look {
  style: Style;
  colors?: string[];
  mark: Mark[];
}

/** One look per Sikh faction. Colours are picked from the list per sardar. */
const LOOKS: Record<string, Look> = {
  shaheedan: { style: 'dumalla', colors: ['#1F3A68', '#22305A'], mark: ['farla', 'chakar'] },
  nishanwalia: { style: 'dumalla', colors: ['#E8870E', '#1F3A68'], mark: ['pennant', 'chakar'] },
  ramgarhia: { style: 'pagg', colors: ['#5E6B2E', '#1F3A68', '#F2E6C9'], mark: ['chakar', 'band'] },
  ahluwalia: { style: 'pagg', colors: ['#1F3A68', '#E8870E', '#F2E6C9'], mark: ['kalgi', 'sarpech'] },
  bhangi: { style: 'pagg', colors: ['#22305A', '#1F3A68'], mark: ['band', 'shamla'] },
  kanhaiya: { style: 'pagg', colors: ['#B83A2B', '#F2E6C9', '#E8870E'], mark: ['pearls'] },
  sukerchakia: { style: 'pagg', colors: ['#C9A13B', '#E8870E', '#B83A2B'], mark: ['jigha', 'sarpech'] },
  nakai: { style: 'pagg', colors: ['#7A3B69', '#B83A2B', '#F2E6C9'], mark: ['shamla'] },
  dallewalia: { style: 'pagg', colors: ['#B83A2B', '#5E6B2E'], mark: ['twotone', 'tilla'] },
  faizullapuria: { style: 'pagg', colors: ['#F2E6C9', '#D9C07A'], mark: ['jigha', 'pearls'] },
  karorasinghia: { style: 'pagg', colors: ['#5E6B2E', '#E8870E'], mark: ['twotone', 'shamla'] },
  phulkian: { style: 'pagg', colors: ['#E4D2A8', '#B83A2B', '#C9A13B'], mark: ['tilla', 'sarpech'] },
};

const SHAPE: Record<Style, string> = {
  pagg: 'M41 36 C40 22 52 14 64 16 C74 18 76 30 72 42 C70 46 66 46 64 42 C62 36 52 34 41 36 Z',
  // A tall, tightly wound dumalla rising high over the crown.
  dumalla: 'M40 37 C38 22 46 10 58 9 C70 9 77 20 73 42 C71 46 66 46 64 42 C62 36 52 34 40 37 Z',
};

/** Wrap lines: each fold of cloth, from the brow up. */
const WRAPS: Record<Style, string[]> = {
  pagg: ['M42 34 C50 30 62 28 73 34', 'M42.5 30 C50 25 62 24 74 28', 'M44 26 C51 21 61 20 72 23', 'M47 22 C53 18 61 17 68 19'],
  dumalla: ['M41 34 C50 30 62 28 74 34', 'M41 29 C49 24 62 23 75 27', 'M41.5 24 C49 18 61 17 75 21', 'M43 19 C50 14 60 13 72 15', 'M47 14 C53 11 60 10 67 11'],
};

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
}

export function hasLook(faction: string) {
  return !!LOOKS[faction];
}

export function lookColor(faction: string, id: string, fallback: string) {
  const l = LOOKS[faction];
  return l?.colors ? hpick(l.colors, id, 't') : fallback;
}

export function Dastar({ faction, id, color, royal }: { faction: string; id: string; color: string; royal?: boolean }) {
  const look = LOOKS[faction] ?? { style: 'pagg', mark: [] };
  const turban = lookColor(faction, id, color);
  const dark = shade(turban, -0.35);
  const light = shade(turban, 0.35);
  const marks = new Set(look.mark);
  const second = shade(hpick(['#E8870E', '#1F3A68', '#F2E6C9', '#B83A2B'], id, 'tt'), 0);
  const shape = SHAPE[look.style];
  return (
    <g>
      {/* shamla: the loose end of the turban hanging behind */}
      {marks.has('shamla') && <path d="M70 36 C76 42 78 52 76 62 L72 61 C73 52 71 44 67 40 Z" fill={turban} stroke={dark} strokeWidth="0.6" />}
      <path d={shape} fill={turban} stroke={dark} strokeWidth="0.8" />
      {/* two-tone: a second cloth wound over the first */}
      {marks.has('twotone') && <path d="M42 31 C50 25 62 24 74 28 L74 33 C62 27 50 29 42 35 Z" fill={second} opacity="0.95" />}
      {/* folds: a dark under-line and a light edge for each wrap */}
      {WRAPS[look.style].map((d, i) => (
        <g key={i}>
          <path d={d} stroke={dark} strokeWidth="1.1" fill="none" opacity="0.7" />
          <path d={d} stroke={light} strokeWidth="0.5" fill="none" opacity="0.8" transform="translate(0 -0.9)" />
        </g>
      ))}
      {/* the pointed front where the wraps cross over the brow */}
      <path d={look.style === 'dumalla' ? 'M41 36 L47 24 L52 34 Z' : 'M42 35 L48 26 L52 33 Z'} fill={shade(turban, 0.15)} stroke={dark} strokeWidth="0.5" />
      {/* band: a thin gold or contrast strip along the lowest wrap */}
      {marks.has('band') && <path d="M42 34.5 C50 30.5 62 28.5 73 34.5" stroke="#C9A13B" strokeWidth="1.6" fill="none" />}
      {/* tilla: gold-thread embroidery along the edge */}
      {marks.has('tilla') && <path d="M42 33 C50 29 62 27 73 33" stroke="#E6C766" strokeWidth="0.9" strokeDasharray="1.4 1.1" fill="none" />}
      {/* pearls strung across the turban */}
      {marks.has('pearls') &&
        [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
          const t = k / 7;
          const x = 44 + t * 26;
          const y = 31 - Math.sin(t * Math.PI) * 4 - t * 1;
          return <circle key={k} cx={x} cy={y} r="0.95" fill="#F7F1E3" stroke="#B8AE98" strokeWidth="0.3" />;
        })}
      {/* chakar: a steel quoit worn on the turban */}
      {marks.has('chakar') && (
        <g>
          <ellipse cx="49" cy={look.style === 'dumalla' ? 22 : 26} rx="4.2" ry="7" fill="none" stroke="#B9BEC4" strokeWidth="1.8" />
          <ellipse cx="49" cy={look.style === 'dumalla' ? 22 : 26} rx="4.2" ry="7" fill="none" stroke="#6E747A" strokeWidth="0.5" />
        </g>
      )}
      {/* sarpech: a jewelled ornament on the front */}
      {marks.has('sarpech') && (
        <g>
          <path d="M50 30 C50 24 53 20 55 19 C55 23 54 27 53 30 Z" fill="#C9A13B" stroke="#8C6A1E" strokeWidth="0.4" />
          <circle cx="51.6" cy="30" r="1.5" fill="#2E8B57" stroke="#C9A13B" strokeWidth="0.5" />
        </g>
      )}
      {/* kalgi: a tall plume */}
      {(marks.has('kalgi') || royal) && (
        <g>
          <path d="M58 18 C56 8 62 2 66 0 C64 8 66 12 62 18 Z" fill="#F2E6C9" stroke="#C9A13B" strokeWidth="0.4" />
          <circle cx="58" cy="21.5" r="2" fill="#B83A2B" stroke="#C9A13B" strokeWidth="0.8" />
        </g>
      )}
      {/* jigha: a short jewelled aigrette */}
      {marks.has('jigha') && !royal && (
        <g>
          <path d="M55 19 C54 13 56 10 59 8 C58 12 59 15 57.5 19 Z" fill="#E6C766" stroke="#8C6A1E" strokeWidth="0.4" />
          <circle cx="56" cy="20.5" r="1.4" fill="#B83A2B" />
        </g>
      )}
    </g>
  );
}

/** Crest pieces that rise above the portrait's oval frame (drawn unclipped). */
export function DastarCrest({ faction, id, color }: { faction: string; id: string; color: string }) {
  const look = LOOKS[faction];
  if (!look) return null;
  const turban = lookColor(faction, id, color);
  const dark = shade(turban, -0.35);
  return (
    <g>
      {/* farla: a long cloth tail standing up from the dumalla and streaming back */}
      {look.mark.includes('farla') && (
        <path
          d="M55 11 C53 5 55 -2 61 -6 C66 -9 72 -8 77 -11 C76 -5 71 -2 66 -2 C62 -1 60 3 60 11 Z"
          fill={shade(turban, 0.1)}
          stroke={dark}
          strokeWidth="0.7"
        />
      )}
      {/* a saffron pennant on a short staff tucked into the dumalla */}
      {look.mark.includes('pennant') && (
        <g>
          <path d="M59 11 L59 -9" stroke="#5A3A1E" strokeWidth="1" />
          <path d="M59 -8 L71 -4 L59 0 Z" fill="#E8870E" stroke="#8C4A06" strokeWidth="0.5" />
        </g>
      )}
    </g>
  );
}
