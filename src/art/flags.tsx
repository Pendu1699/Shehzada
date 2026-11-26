// Flags of the misls and the powers, each drawn from its own story.
//
// Few misl banners survive, and none is securely documented (see HISTORY.md,
// "Flags"), so the misl flags are game designs built from what each misl was
// known for: the Bhangis named for bhang, the Ramgarhias' fort of Ram Rauni,
// Nawab Kapur Singh fanning the sangat when the nawabship was offered him, the
// Nishanwalias who carried the blue nishans, the Shaheedan's weapons of the
// martyrs. Where a power's flag is known it is followed: the Sikh Empire's
// saffron pennant with the sun and a green, vine-worked border; the East India
// Company's red and white stripes with the Union in the canton; the Marathas'
// swallow-tailed bhagwa jhenda; Nepal's double pennant with moon and sun; the
// Nizam's yellow flag with the kulcha; the lion of Kandy.
//
// The Khanda appears only on Nishan Sahibs (here: on the Nishanwalias' crossed
// nishans), never as a misl's own device.

import type { JSX } from 'react';

export type Shape = 'pennant' | 'swallow' | 'rect' | 'double' | 'stripes' | 'tricolour' | 'hoist';
export type Pattern = 'none' | 'dots' | 'trefoil' | 'chevrons' | 'waves' | 'stars';

export interface FlagDesign {
  shape: Shape;
  field: string;
  /** Border band, drawn with a vine if `vine` is set. */
  border?: string;
  vine?: string;
  device: string;
  deviceColor: string;
  pattern?: Pattern;
  patternColor?: string;
}

const GOLD = '#E6C766';

export const FLAGS: Record<string, FlagDesign> = {
  // ── The misls ──
  ahluwalia: { shape: 'pennant', field: '#1F3A68', border: '#C9A13B', device: 'kalgi', deviceColor: GOLD, pattern: 'dots', patternColor: '#C9A13B' },
  bhangi: { shape: 'pennant', field: '#2F5A2E', border: '#E8870E', device: 'bhang', deviceColor: '#A8D66A', pattern: 'none' },
  ramgarhia: { shape: 'pennant', field: '#5E120E', border: '#1B1712', device: 'ramgarh', deviceColor: '#E8C9A0', pattern: 'chevrons', patternColor: '#7A2A22' },
  kanhaiya: { shape: 'pennant', field: '#B83A2B', border: '#1F3A68', device: 'morpankh', deviceColor: '#1F6F6A', pattern: 'dots', patternColor: '#E6A07A' },
  sukerchakia: { shape: 'pennant', field: '#E6A82E', border: '#3F6B2E', device: 'lion', deviceColor: '#5A3A14', pattern: 'none' },
  nakai: { shape: 'swallow', field: '#5E2A5A', border: '#C9A13B', device: 'horsehead', deviceColor: '#F2E6C9', pattern: 'chevrons', patternColor: '#71386C' },
  dallewalia: { shape: 'swallow', field: '#2F6F73', border: '#E8870E', device: 'river', deviceColor: '#F2E6C9', pattern: 'waves', patternColor: '#3E8285' },
  nishanwalia: { shape: 'pennant', field: '#1E3FA0', border: '#E8870E', device: 'nishans', deviceColor: '#E8870E', pattern: 'none' },
  faizullapuria: { shape: 'pennant', field: '#3D6B4F', border: '#E6C766', device: 'pankha', deviceColor: GOLD, pattern: 'trefoil', patternColor: '#C9A13B' },
  karorasinghia: { shape: 'pennant', field: '#7A6A2A', border: '#B83A2B', device: 'darwaza', deviceColor: '#F2E6C9', pattern: 'dots', patternColor: '#9A8A4A' },
  shaheedan: { shape: 'pennant', field: '#22307A', border: '#E8870E', device: 'shastar', deviceColor: '#D9DDE2', pattern: 'stars', patternColor: '#3A4A9A' },
  phulkian: { shape: 'pennant', field: '#F2E6C9', border: '#6B8F3A', device: 'phul', deviceColor: '#C9502B', pattern: 'trefoil', patternColor: '#8FAF5A' },
  khalsa_panth: { shape: 'pennant', field: '#E8870E', border: '#1E3FA0', vine: '#E6C766', device: 'nishans', deviceColor: '#1E3FA0', pattern: 'none' },
  // ── The powers of the Punjab ──
  durrani: { shape: 'rect', field: '#1B1712', border: '#2F6F73', device: 'crescent_swords', deviceColor: '#F2E6C9', pattern: 'none' },
  mughal: { shape: 'pennant', field: '#2E6B45', border: '#C9A13B', vine: GOLD, device: 'sherkhurshid', deviceColor: GOLD, pattern: 'none' },
  maratha: { shape: 'swallow', field: '#E8770E', device: 'none', deviceColor: '#E8770E', pattern: 'none' },
  company: { shape: 'stripes', field: '#B02222', device: 'union', deviceColor: '#F2E6C9', pattern: 'none' },
  // The two dominions of 1947.
  india: { shape: 'tricolour', field: '#F7F3EA', device: 'chakra', deviceColor: '#1F3A8C', pattern: 'none' },
  pakistan: { shape: 'hoist', field: '#1E5E36', device: 'crescent_star', deviceColor: '#F7F3EA', pattern: 'none' },
  kangra: { shape: 'pennant', field: '#C9502B', border: '#1F3A68', device: 'mountain', deviceColor: '#F2E6C9', pattern: 'none' },
  hill_states: { shape: 'pennant', field: '#8C6A3A', border: '#B83A2B', device: 'mountain', deviceColor: '#F2E6C9', pattern: 'chevrons', patternColor: '#9C7A4A' },
  jammu: { shape: 'rect', field: '#B83A2B', border: '#E6C23B', device: 'sun', deviceColor: '#E6C23B', pattern: 'none' },
  gurkha: { shape: 'double', field: '#B0182A', border: '#1F3A8C', device: 'moonsun', deviceColor: '#F7F1E3', pattern: 'none' },
  kasur: { shape: 'rect', field: '#3E6B5A', border: '#F2E6C9', device: 'crescent', deviceColor: '#F2E6C9', pattern: 'none' },
  multan: { shape: 'rect', field: '#4F7F6A', border: '#C9A13B', device: 'dome', deviceColor: '#C9A13B', pattern: 'none' },
  peshawar: { shape: 'rect', field: '#24434A', border: '#E4D2A8', device: 'crescent_swords', deviceColor: '#E4D2A8', pattern: 'none' },
  bahawalpur: { shape: 'rect', field: '#5A7A3A', border: '#F2E6C9', device: 'crescent', deviceColor: '#F2E6C9', pattern: 'stars', patternColor: '#6A8A4A' },
  malerkotla: { shape: 'pennant', field: '#4F7F55', border: '#C9A13B', device: 'crescent', deviceColor: GOLD, pattern: 'none' },
  // ── The wider subcontinent ──
  rajputs: { shape: 'pennant', field: '#E8870E', border: '#7A1E1A', device: 'sun', deviceColor: '#FCE38A', pattern: 'none' },
  jats: { shape: 'pennant', field: '#E6C23B', border: '#5A3A14', device: 'fort', deviceColor: '#5A3A14', pattern: 'none' },
  rohillas: { shape: 'rect', field: '#2E4E3E', border: '#E4D2A8', device: 'crescent_swords', deviceColor: '#E4D2A8', pattern: 'none' },
  nawab_awadh: { shape: 'pennant', field: '#3A5A7A', border: '#C9A13B', device: 'fish', deviceColor: GOLD, pattern: 'none' },
  nawab_bengal: { shape: 'pennant', field: '#2E6B5A', border: '#F2E6C9', device: 'crescent', deviceColor: '#F2E6C9', pattern: 'dots', patternColor: '#3E7B6A' },
  nizam: { shape: 'rect', field: '#E6C23B', border: '#8C6A1E', device: 'kulcha', deviceColor: '#F7EFD9', pattern: 'none' },
  khudadad: { shape: 'rect', field: '#E3A02E', border: '#2A1A10', device: 'tiger', deviceColor: '#2A1A10', pattern: 'none' },
  arcot: { shape: 'pennant', field: '#3E7A6A', border: '#F2E6C9', device: 'crescent', deviceColor: '#F2E6C9', pattern: 'none' },
  sindh_amirs: { shape: 'rect', field: '#9E1B1B', border: '#E6C766', device: 'crescent', deviceColor: '#E6C766', pattern: 'chevrons', patternColor: '#AE2B2B' },
  kalat: { shape: 'rect', field: '#7A5A3A', border: '#2F4F4F', device: 'crescent_swords', deviceColor: '#F2E6C9', pattern: 'none' },
  tibet: { shape: 'rect', field: '#B83A2B', border: '#E6C23B', device: 'snowlion', deviceColor: '#F7F1E3', pattern: 'none' },
  kandy: { shape: 'rect', field: '#7A1E1A', border: '#E6C23B', device: 'kandylion', deviceColor: '#E6C23B', pattern: 'none' },
};

/** The Sikh Empire flag, after the Sarkar-i-Khalsa's own standard. */
export const EMPIRE_FLAG: FlagDesign = { shape: 'pennant', field: '#DC4A0E', border: '#1E7A1E', vine: '#D8C060', device: 'empiresun', deviceColor: '#FFC81E', pattern: 'trefoil', patternColor: '#D8C060' };

const fallback = (field: string): FlagDesign => ({ shape: 'pennant', field, border: '#C9A13B', device: 'sun', deviceColor: '#F2E6C9', pattern: 'none' });
export const flagOf = (faction: string, field = '#C9A13B') => FLAGS[faction] ?? fallback(field);

/* ── Devices (100 × 100 box) ─────────────────────────────────────────────── */

export function Device({ id, color }: { id: string; color: string }): JSX.Element | null {
  const c = color;
  switch (id) {
    case 'none':
      return null;
    case 'kalgi':
      // Sultan-ul-Qaum: a jewelled sarpech with a tall plume, over crossed talwars.
      return (
        <g fill={c} stroke={c}>
          <path d="M22 86 Q34 62 70 40 M78 86 Q66 62 30 40" fill="none" strokeWidth="5" strokeLinecap="round" />
          <path d="M50 62 C40 56 38 46 44 40 C46 46 50 48 50 48 C50 48 54 46 56 40 C62 46 60 56 50 62 Z" stroke="none" />
          <path d="M50 48 C46 32 52 18 62 8 C60 22 58 36 52 48 Z" stroke="none" />
          <circle cx="50" cy="58" r="4" fill="#B83A2B" stroke="none" />
        </g>
      );
    case 'bhang':
      // A seven-fingered bhang leaf.
      return (
        <g fill={c}>
          {[-72, -48, -24, 0, 24, 48, 72].map((a, i) => {
            const len = [22, 30, 38, 44, 38, 30, 22][i];
            return <path key={a} transform={`rotate(${a} 50 74)`} d={`M50 74 C${46} ${74 - len * 0.4} ${46} ${74 - len * 0.8} 50 ${74 - len} C${54} ${74 - len * 0.8} ${54} ${74 - len * 0.4} 50 74 Z`} />;
          })}
          <rect x="48.5" y="72" width="3" height="18" rx="1.2" />
        </g>
      );
    case 'ramgarh':
      // Ram Rauni rebuilt as Ramgarh: a fort with a bunga, and the carpenter's tesa.
      return (
        <g fill={c}>
          <path d="M18 84 L18 50 L26 50 L26 44 L34 44 L34 50 L42 50 L42 30 L58 30 L58 50 L66 50 L66 44 L74 44 L74 50 L82 50 L82 84 Z" />
          <path d="M45 84 L45 66 Q50 58 55 66 L55 84 Z" fill="#00000066" />
          <path d="M44 30 L50 20 L56 30 Z" />
          <path d="M70 26 L84 12 M80 10 L88 18 L84 22 Z" stroke={c} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'morpankh':
      // A peacock feather, for the house named from Kahna.
      return (
        <g>
          <path d="M50 92 Q46 60 54 14" stroke="#C9A13B" strokeWidth="2.4" fill="none" />
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M${51 + i * 0.1} ${80 - i * 4.5} l${i % 2 ? 14 : -14} -6`} stroke="#3E8A5A" strokeWidth="1.6" />
          ))}
          <ellipse cx="54" cy="30" rx="15" ry="19" fill="#2F8A6A" />
          <ellipse cx="54" cy="31" rx="10" ry="13" fill="#C9A13B" />
          <ellipse cx="54" cy="32" rx="6.5" ry="8.5" fill={c} />
          <ellipse cx="54" cy="33" rx="3.5" ry="4.5" fill="#1B2A5A" />
        </g>
      );
    case 'lion':
      // The lion — Sher-e-Punjab — walking, with the sun over its back.
      return (
        <g fill={c}>
          <circle cx="62" cy="22" r="8" fill="#B83A2B" />
          <path d="M14 70 C16 58 26 52 40 54 L60 54 C62 44 70 38 80 42 C86 44 88 50 86 56 C84 60 78 60 74 58 L72 76 L64 76 L62 64 L42 64 L38 76 L30 76 L32 64 C24 66 18 72 14 70 Z" />
          <path d="M70 40 C66 34 70 28 76 30 C82 28 88 34 86 40" />
          <path d="M14 70 C8 64 8 56 12 52 C10 58 14 62 16 62" fill="none" stroke={c} strokeWidth="3" />
        </g>
      );
    case 'horsehead':
      return (
        <g fill={c}>
          <path d="M30 88 C30 66 36 50 46 40 L48 22 L54 32 L60 20 L62 36 C72 42 80 54 82 66 C82 72 76 74 72 70 L64 60 C60 68 56 78 56 88 Z" />
          <circle cx="62" cy="44" r="2.6" fill="#1B1712" />
          <path d="M44 40 C38 48 34 60 34 74" stroke="#1B1712" strokeWidth="2" fill="none" opacity="0.5" />
        </g>
      );
    case 'river':
      // Raiders across the Sutlej: a spear over the waters.
      return (
        <g fill="none" stroke={c} strokeWidth="4.5" strokeLinecap="round">
          {[58, 70, 82].map((y) => (
            <path key={y} d={`M12 ${y} q10 -8 20 0 t20 0 t20 0 t20 0`} />
          ))}
          <path d="M22 82 L78 18" />
          <path d="M78 18 L66 22 L74 30 Z" fill={c} stroke="none" />
        </g>
      );
    case 'nishans':
      // The standard-bearers: two Nishan Sahibs crossed, their cloth streaming outward.
      return (
        <g>
          <path d="M22 92 L70 10 M78 92 L30 10" stroke="#D9D2C0" strokeWidth="4" strokeLinecap="round" />
          <path d="M70 10 L67 2 L74 4 Z M30 10 L33 2 L26 4 Z" fill="#D9D2C0" />
          <path d="M68 14 L96 26 L60 32 Z" fill={c} />
          <path d="M32 14 L4 26 L40 32 Z" fill={c} />
        </g>
      );
    case 'pankha':
      // Nawab Kapur Singh was fanning the sangat when the nawabship was offered him.
      return (
        <g fill={c}>
          <rect x="47.5" y="50" width="5" height="42" rx="2" />
          <path d="M50 52 C30 52 18 40 18 26 C18 14 32 8 50 8 C68 8 82 14 82 26 C82 40 70 52 50 52 Z" />
          <path d="M50 46 C36 46 26 38 26 27 C26 18 36 14 50 14 C64 14 74 18 74 27 C74 38 64 46 50 46 Z" fill="none" stroke="#1B1712" strokeWidth="1.5" opacity="0.45" />
          {[30, 40, 50, 60, 70].map((x) => (
            <path key={x} d={`M${x} 16 L50 46`} stroke="#1B1712" strokeWidth="1.2" opacity="0.35" />
          ))}
          <path d="M20 26 l-6 4 l6 4 Z M80 26 l6 4 l-6 4 Z" />
        </g>
      );
    case 'darwaza':
      // Baghel Singh entered Delhi in 1783: a city gate, and the spear above it.
      return (
        <g fill={c}>
          <path d="M18 88 L18 38 L30 32 L30 26 L70 26 L70 32 L82 38 L82 88 Z" />
          <path d="M36 88 L36 60 Q50 40 64 60 L64 88 Z" fill="#1B1712" opacity="0.6" />
          {[22, 32, 42, 52, 62, 72].map((x) => (
            <path key={x} d={`M${x} 26 l3 -6 l3 6 Z`} />
          ))}
          <path d="M50 22 L50 2 M50 2 l-5 8 l10 0 Z" stroke={c} strokeWidth="3" />
        </g>
      );
    case 'shastar':
      // The weapons of the martyrs: two kirpans crossed behind a dhal, a katar before it.
      return (
        <g>
          <path d="M18 86 Q26 54 72 16 M82 86 Q74 54 28 16" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" />
          <path d="M12 80 L26 90 M88 80 L74 90" stroke="#C9A13B" strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="56" r="19" fill="#5A3A1E" stroke="#C9A13B" strokeWidth="2.4" />
          {[[43, 50], [57, 50], [43, 62], [57, 62]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.4" fill="#C9A13B" />
          ))}
          <path d="M50 18 L55 40 L45 40 Z" fill={c} />
          <rect x="44" y="40" width="12" height="3.6" fill="#C9A13B" />
          <rect x="44" y="43.6" width="2.6" height="8" fill="#C9A13B" />
          <rect x="53.4" y="43.6" width="2.6" height="8" fill="#C9A13B" />
        </g>
      );
    case 'phul':
      // Phul, the flower: the house of Baba Phul.
      return (
        <g>
          <rect x="48.5" y="56" width="3" height="34" fill="#4F6B2A" />
          <path d="M50 74 C40 70 34 62 34 56 C42 58 48 64 50 74 Z M50 80 C60 76 66 68 66 62 C58 64 52 70 50 80 Z" fill="#6B8F3A" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="50" cy="22" rx="10" ry="16" transform={`rotate(${a} 50 38)`} fill={c} />
          ))}
          <circle cx="50" cy="38" r="8" fill="#E6C766" />
        </g>
      );
    case 'empiresun':
      // The Sikh Empire's sun: a gold disc with wavy rays.
      return (
        <g>
          {Array.from({ length: 32 }, (_, i) => {
            const a = (i / 32) * Math.PI * 2;
            const long = i % 2 === 0;
            const r0 = 17,
              r1 = long ? 40 : 32;
            const mx = 50 + Math.cos(a + 0.06) * ((r0 + r1) / 2),
              my = 50 + Math.sin(a + 0.06) * ((r0 + r1) / 2);
            return <path key={i} d={`M${50 + Math.cos(a) * r0} ${50 + Math.sin(a) * r0} Q${mx} ${my} ${50 + Math.cos(a) * r1} ${50 + Math.sin(a) * r1}`} stroke={c} strokeWidth={long ? 2.6 : 1.8} fill="none" strokeLinecap="round" />;
          })}
          <circle cx="50" cy="50" r="16" fill={c} />
        </g>
      );
    case 'union':
      return null;
    case 'crescent':
      return (
        <g fill={c}>
          <path fillRule="evenodd" d="M16 50 A30 30 0 1 0 76 50 A30 30 0 1 0 16 50 Z M30 46 A26 26 0 1 0 82 46 A26 26 0 1 0 30 46 Z" />
          <path d="M70 36 L73 44 L81 44 L75 49 L77 57 L70 52 L63 57 L65 49 L59 44 L67 44 Z" />
        </g>
      );
    case 'chakra':
      return (
        <g stroke={c} fill="none">
          <circle cx="50" cy="50" r="40" strokeWidth="6" />
          <circle cx="50" cy="50" r="7" fill={c} />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * Math.PI) / 12;
            return <line key={i} x1={50} y1={50} x2={50 + 38 * Math.cos(a)} y2={50 + 38 * Math.sin(a)} strokeWidth="2.6" />;
          })}
        </g>
      );
    case 'crescent_star':
      return (
        <g fill={c}>
          <path fillRule="evenodd" d="M14 52 A34 34 0 1 0 82 52 A34 34 0 1 0 14 52 Z M28 44 A30 30 0 1 0 88 44 A30 30 0 1 0 28 44 Z" />
          <path d="M70 26 L74 37 L86 37 L76 44 L80 56 L70 49 L60 56 L64 44 L54 37 L66 37 Z" />
        </g>
      );
    case 'crescent_swords':
      return (
        <g fill={c}>
          <path fillRule="evenodd" d="M22 38 A25 25 0 1 0 72 38 A25 25 0 1 0 22 38 Z M38 33 A21 21 0 1 0 80 33 A21 21 0 1 0 38 33 Z" />
          <path d="M14 90 Q40 70 86 64 M86 90 Q60 70 14 64" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    case 'sherkhurshid':
      // The lion and sun of the Persianate courts, carried on Mughal alams.
      return (
        <g fill={c}>
          <circle cx="58" cy="34" r="13" />
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M58 14 L61 21 L55 21 Z" transform={`rotate(${i * 30} 58 34)`} />
          ))}
          <path d="M12 82 C14 70 24 64 38 66 L58 66 C60 58 68 54 76 58 C80 62 80 68 76 70 L74 86 L66 86 L64 76 L42 76 L38 86 L30 86 L32 76 C24 78 16 84 12 82 Z" />
        </g>
      );
    case 'mountain':
      return (
        <g fill={c}>
          <path d="M10 84 L36 36 L48 54 L62 30 L90 84 Z" />
          <path d="M62 30 L70 44 L62 40 L54 44 Z M36 36 L42 46 L36 44 L30 46 Z" fill="#FFFFFF" />
        </g>
      );
    case 'sun':
      return (
        <g fill={c}>
          <circle cx="50" cy="50" r="15" />
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d="M50 20 L53.5 31 L46.5 31 Z" transform={`rotate(${i * 22.5} 50 50)`} />
          ))}
        </g>
      );
    case 'fort':
      return (
        <g fill={c}>
          <path d="M14 86 L14 46 L24 46 L24 38 L34 38 L34 46 L44 46 L44 34 L56 34 L56 46 L66 46 L66 38 L76 38 L76 46 L86 46 L86 86 Z" />
          <path d="M44 86 L44 64 Q50 54 56 64 L56 86 Z" fill="#00000055" />
        </g>
      );
    case 'moonsun':
      return (
        <g fill={c}>
          <path d="M30 18 A20 20 0 0 0 70 18 A16 14 0 0 1 30 18 Z" />
          <circle cx="50" cy="25" r="5" />
          <circle cx="50" cy="70" r="11" />
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M50 52 L52.5 60 L47.5 60 Z" transform={`rotate(${i * 30} 50 70)`} />
          ))}
        </g>
      );
    case 'dome':
      return (
        <g fill={c}>
          <path d="M24 86 L24 56 L76 56 L76 86 Z" />
          <path d="M28 56 C28 30 72 30 72 56 Z" />
          <path d="M50 30 L50 16" stroke={c} strokeWidth="3" />
          <circle cx="50" cy="14" r="3" />
        </g>
      );
    case 'fish':
      // The twin fish (mahi maratib) of the Awadh court.
      return (
        <g fill={c}>
          <path d="M16 40 C30 26 56 26 70 40 L84 30 L82 46 L84 62 L70 52 C56 66 30 66 16 52 C12 48 12 44 16 40 Z" transform="translate(0 -10) scale(1 0.85)" />
          <path d="M16 40 C30 26 56 26 70 40 L84 30 L82 46 L84 62 L70 52 C56 66 30 66 16 52 C12 48 12 44 16 40 Z" transform="translate(100 32) scale(-1 0.85)" />
        </g>
      );
    case 'kulcha':
      // The Asaf Jahi flag: a round loaf, from the founding legend of the house.
      return (
        <g>
          <circle cx="50" cy="50" r="24" fill={c} stroke="#B8962A" strokeWidth="2.5" />
          {[[42, 42], [58, 44], [50, 56], [40, 58], [60, 58], [50, 36]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" fill="#C9A13B" />
          ))}
        </g>
      );
    case 'tiger':
      // Tipu's tiger: the bubri stripe.
      return (
        <g fill={c}>
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${14 + i * 16} 16 C${24 + i * 16} 36 ${10 + i * 16} 56 ${22 + i * 16} 84 C${16 + i * 16} 60 ${30 + i * 16} 40 ${20 + i * 16} 16 Z`} />
          ))}
        </g>
      );
    case 'snowlion':
      return (
        <g fill={c}>
          <path d="M14 78 C18 64 30 58 44 60 L62 60 C64 50 72 44 80 48 C86 52 86 60 80 62 L78 80 L70 80 L68 70 L46 70 L42 80 L34 80 L36 70 C28 72 20 80 14 78 Z" />
          <circle cx="76" cy="46" r="10" fill="#2F8A6A" />
          <path d="M14 78 C6 70 8 60 16 56" fill="none" stroke="#2F8A6A" strokeWidth="4" />
        </g>
      );
    case 'kandylion':
      // The lion of Kandy, holding a sword.
      return (
        <g fill={c}>
          <path d="M14 82 C18 66 30 58 44 60 L62 60 C62 46 72 38 80 42 C86 46 86 54 80 58 L76 82 L68 82 L66 72 L46 72 L42 82 L34 82 L36 72 C28 74 20 84 14 82 Z" />
          <path d="M66 52 L88 22" stroke={c} strokeWidth="4" strokeLinecap="round" />
          <path d="M84 30 L92 24" stroke={c} strokeWidth="5" />
        </g>
      );
    default:
      return <circle cx="50" cy="50" r="16" fill={c} />;
  }
}

/* ── Field patterns ───────────────────────────────────────────────────────── */

function PatternFill({ id, color, uid }: { id: Pattern; color: string; uid: string }) {
  const pid = `pat-${uid}`;
  let body: JSX.Element | null = null;
  switch (id) {
    case 'dots':
      body = <circle cx="5" cy="5" r="1.2" fill={color} />;
      break;
    case 'trefoil':
      body = (
        <g fill={color}>
          <circle cx="5" cy="3.6" r="1" />
          <circle cx="3.8" cy="5.6" r="1" />
          <circle cx="6.2" cy="5.6" r="1" />
        </g>
      );
      break;
    case 'chevrons':
      body = <path d="M0 7 L5 3 L10 7" stroke={color} strokeWidth="1.4" fill="none" />;
      break;
    case 'waves':
      body = <path d="M0 6 q2.5 -3 5 0 t5 0" stroke={color} strokeWidth="1.2" fill="none" />;
      break;
    case 'stars':
      body = <path d="M5 2.4 L5.8 4.4 L8 4.4 L6.2 5.6 L6.9 7.6 L5 6.4 L3.1 7.6 L3.8 5.6 L2 4.4 L4.2 4.4 Z" fill={color} />;
      break;
    default:
      return null;
  }
  return (
    <defs>
      <pattern id={pid} width="10" height="10" patternUnits="userSpaceOnUse">
        {body}
      </pattern>
    </defs>
  );
}

/** The cloth's outline in a 100 × 60 box (hoist on the left). */
function shapePath(shape: Shape): string {
  switch (shape) {
    case 'swallow':
      return 'M0 0 L100 0 L78 30 L100 60 L0 60 Z';
    case 'pennant':
      return 'M0 0 L100 30 L0 60 Z';
    case 'double':
      return 'M0 0 L74 28 L30 28 L82 60 L0 60 Z';
    default:
      return 'M0 0 L100 0 L100 60 L0 60 Z';
  }
}

let uidCounter = 0;

/** The cloth of a flag (no pole), drawn in a 100 × 60 box. */
export function FlagCloth({ design, accent }: { design: FlagDesign; accent?: { device: string; color: string } }) {
  const uid = `f${++uidCounter}`;
  const d = shapePath(design.shape);
  const clip = `clip-${uid}`;
  const isPennant = design.shape === 'pennant';
  // Where the device sits: in the broad part of the cloth.
  const dev = isPennant
    ? { x: 7, y: 9, s: 0.43 }
    : design.shape === 'double'
      ? { x: 8, y: 22, s: 0.34 }
      : design.shape === 'tricolour'
        ? { x: 41, y: 21, s: 0.18 }
        : design.shape === 'hoist'
          ? { x: 42, y: 8, s: 0.44 }
          : { x: 26, y: 6, s: 0.48 };
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
      </defs>
      {design.pattern && design.pattern !== 'none' && <PatternFill id={design.pattern} color={design.patternColor ?? '#00000022'} uid={uid} />}
      <g clipPath={`url(#${clip})`}>
        <path d={d} fill={design.field} />
        {design.shape === 'stripes' &&
          Array.from({ length: 13 }, (_, i) => (i % 2 ? <rect key={i} x="0" y={(i * 60) / 13} width="100" height={60 / 13} fill="#F7F1E3" /> : null))}
        {design.shape === 'tricolour' && (
          <g>
            <rect x="0" y="0" width="100" height="20" fill="#F08A24" />
            <rect x="0" y="40" width="100" height="20" fill="#1E7A2E" />
          </g>
        )}
        {design.shape === 'hoist' && <rect x="0" y="0" width="25" height="60" fill="#F7F3EA" />}
        {design.shape === 'stripes' && (
          // The Union in the canton (St George and St Andrew, as before 1801).
          <g>
            <rect x="0" y="0" width="40" height="27.7" fill="#1F2A5A" />
            <path d="M0 0 L40 27.7 M40 0 L0 27.7" stroke="#F7F1E3" strokeWidth="5" />
            <path d="M20 0 V27.7 M0 13.85 H40" stroke="#F7F1E3" strokeWidth="8" />
            <path d="M20 0 V27.7 M0 13.85 H40" stroke="#B02222" strokeWidth="4.6" />
          </g>
        )}
        {design.pattern && design.pattern !== 'none' && <path d={d} fill={`url(#pat-${uid})`} />}
        {design.border && <path d={d} fill="none" stroke={design.border} strokeWidth={design.vine ? 10 : 6} strokeLinejoin="round" />}
        {design.vine && <path d={d} fill="none" stroke={design.vine} strokeWidth="1.6" strokeDasharray="2.2 1.6" strokeLinejoin="round" />}
      </g>
      {design.vine && <path d={d} fill="none" stroke={design.vine} strokeWidth="1.4" strokeLinejoin="round" />}
      <g transform={`translate(${dev.x} ${dev.y}) scale(${dev.s})`}>
        <Device id={design.device} color={design.deviceColor} />
      </g>
      {accent && (
        <g transform="translate(3 3) scale(0.17)">
          <circle cx="50" cy="50" r="46" fill="#F7EFD9" stroke={design.border ?? '#1B1712'} strokeWidth="6" />
          <g transform="translate(14 14) scale(0.72)">
            <Device id={accent.device} color={accent.color} />
          </g>
        </g>
      )}
    </g>
  );
}

/** A round badge with the house's device, for the top bar and lists. */
export function FlagBadge({ design, size }: { design: FlagDesign; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill={design.field} stroke={design.border ?? '#1B1712'} strokeWidth="6" />
      {design.vine && <circle cx="50" cy="50" r="46" fill="none" stroke={design.vine} strokeWidth="1.5" strokeDasharray="3 2" />}
      {design.shape === 'stripes' ? (
        <g>
          <clipPath id="badge-clip-company">
            <circle cx="50" cy="50" r="44" />
          </clipPath>
          <g clipPath="url(#badge-clip-company)">
            {Array.from({ length: 9 }, (_, i) => (i % 2 ? <rect key={i} x="0" y={i * 11} width="100" height="11" fill="#F7F1E3" /> : null))}
            <rect x="6" y="6" width="44" height="40" fill="#1F2A5A" />
            <path d="M28 6 V46 M6 26 H50" stroke="#F7F1E3" strokeWidth="9" />
            <path d="M28 6 V46 M6 26 H50" stroke="#B02222" strokeWidth="5" />
          </g>
        </g>
      ) : (
        <g transform="translate(16 16) scale(0.68)">
          <Device id={design.device === 'none' ? 'sun' : design.device} color={design.device === 'none' ? '#F7F1E3' : design.deviceColor} />
        </g>
      )}
    </svg>
  );
}
