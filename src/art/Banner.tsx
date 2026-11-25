// Misl banners: triangular pennants in kesri and neela, each with a band and an
// original emblem. The Khanda appears only on Nishan Sahib banners, and nowhere else
// in the interface.

import { FACTION_BY_ID } from '../data/factions';
import { useStore } from '../store';

export { EMPIRE_FIELD, empireEdge } from './empire';
import { EMPIRE_FIELD, EMPIRE_VARIANT, empireEdge } from './empire';

/**
 * The arms of the Sikh Empire: a dhal (round shield) with two crossed talwars
 * behind it and a katar (punch-dagger) upright before it — after the flags of
 * the Sarkar-i-Khalsa. In a 100×100 box.
 */
export function EmpireArms({ color }: { color: string }) {
  return (
    <g>
      <path d="M22 84 Q30 52 70 18" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d="M78 84 Q70 52 30 18" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d="M16 80 L28 88 M84 80 L72 88" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <circle cx="50" cy="54" r="20" fill={color} />
      <circle cx="50" cy="54" r="15" fill="none" stroke="#F2E6C9" strokeWidth="1.6" opacity="0.6" />
      {[[42, 48], [58, 48], [42, 60], [58, 60]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill="#F2E6C9" opacity="0.8" />
      ))}
      <path d="M50 14 L55 38 L45 38 Z" fill={color} />
      <rect x="44" y="38" width="12" height="4" fill={color} />
      <rect x="44" y="42" width="2.6" height="9" fill={color} />
      <rect x="53.4" y="42" width="2.6" height="9" fill={color} />
    </g>
  );
}

/** Is this house the Sikh Empire in the current game? */
function useEmpire(faction: string): boolean {
  return useStore((s) => !!s.game?.factions[faction]?.sarkar);
}

export function KhandaPath({ color }: { color: string }) {
  // Chakkar, central khanda and two kirpans, drawn in a 100×100 box.
  return (
    <g fill={color} stroke={color}>
      <circle cx="50" cy="54" r="21" fill="none" strokeWidth="6" />
      <path d="M50 6 L56 20 L54.5 70 L45.5 70 L44 20 Z" stroke="none" />
      <rect x="40" y="69" width="20" height="4" rx="1.5" stroke="none" />
      <rect x="47.5" y="73" width="5" height="11" stroke="none" />
      <circle cx="50" cy="87" r="3.2" stroke="none" />
      <path d="M57 84 C 26 84, 10 60, 22 30" fill="none" strokeWidth="5" strokeLinecap="round" />
      <path d="M43 84 C 74 84, 90 60, 78 30" fill="none" strokeWidth="5" strokeLinecap="round" />
      <rect x="54" y="80" width="10" height="5" rx="1.5" stroke="none" transform="rotate(-12 59 82)" />
      <rect x="36" y="80" width="10" height="5" rx="1.5" stroke="none" transform="rotate(12 41 82)" />
    </g>
  );
}

function Emblem({ id, color }: { id: string; color: string }) {
  switch (id) {
    case 'khanda':
      return <KhandaPath color={color} />;
    case 'gun':
      return (
        <g fill={color}>
          <rect x="22" y="40" width="52" height="14" rx="6" />
          <rect x="70" y="42" width="8" height="10" rx="2" />
          <circle cx="36" cy="64" r="11" fill="none" stroke={color} strokeWidth="5" />
          <circle cx="36" cy="64" r="3" />
        </g>
      );
    case 'fort':
      return (
        <g fill={color}>
          <path d="M20 80 L20 42 L28 42 L28 34 L36 34 L36 42 L44 42 L44 30 L56 30 L56 42 L64 42 L64 34 L72 34 L72 42 L80 42 L80 80 Z" />
          <path d="M44 80 L44 62 Q50 52 56 62 L56 80 Z" fill="#00000055" />
        </g>
      );
    case 'lotus':
      return (
        <g fill={color}>
          <path d="M50 22 C58 36 58 52 50 66 C42 52 42 36 50 22 Z" />
          <path d="M50 66 C36 60 26 48 24 34 C36 38 46 50 50 66 Z" />
          <path d="M50 66 C64 60 74 48 76 34 C64 38 54 50 50 66 Z" />
          <rect x="30" y="68" width="40" height="5" rx="2" />
        </g>
      );
    case 'lion':
      return (
        <g fill={color}>
          <path d="M18 66 C22 52 34 48 46 50 L60 50 C66 40 76 36 84 42 C80 46 80 50 84 54 C78 58 72 58 68 56 L70 74 L62 74 L60 62 L42 62 L38 74 L30 74 L32 60 C26 62 22 66 18 66 Z" />
          <path d="M18 66 C12 62 12 54 16 50" fill="none" stroke={color} strokeWidth="3" />
        </g>
      );
    case 'horse':
      return (
        <g fill={color}>
          <path d="M22 74 L28 54 C30 46 40 42 50 44 L62 44 L70 30 L74 28 L78 36 L84 42 L80 46 L72 44 L70 56 L74 74 L68 74 L64 60 L42 60 L36 74 Z" />
        </g>
      );
    case 'spear':
      return (
        <g fill={color}>
          <rect x="48" y="26" width="4" height="58" />
          <path d="M50 10 L57 28 L43 28 Z" />
          <path d="M42 34 L58 34 L54 38 L46 38 Z" fill="#B83A2B" />
        </g>
      );
    case 'sun':
      return (
        <g fill={color}>
          <circle cx="50" cy="50" r="14" />
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M50 22 L53 32 L47 32 Z" transform={`rotate(${i * 30} 50 50)`} />
          ))}
        </g>
      );
    case 'star':
      return <path fill={color} d="M50 18 L58 42 L84 42 L63 57 L71 82 L50 67 L29 82 L37 57 L16 42 L42 42 Z" />;
    case 'wheat':
      return (
        <g fill={color}>
          <rect x="48.5" y="30" width="3" height="52" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <ellipse cx="44" cy={30 + i * 8} rx="5" ry="2.6" transform={`rotate(-35 44 ${30 + i * 8})`} />
              <ellipse cx="56" cy={30 + i * 8} rx="5" ry="2.6" transform={`rotate(35 56 ${30 + i * 8})`} />
            </g>
          ))}
          <ellipse cx="50" cy="24" rx="2.6" ry="5" />
        </g>
      );
    case 'crescent':
      return (
        <g fill={color}>
          <path d="M60 22 A30 30 0 1 0 60 78 A24 24 0 1 1 60 22 Z" />
          <circle cx="66" cy="50" r="5" />
        </g>
      );
    case 'cross':
      return (
        <g fill={color}>
          <rect x="44" y="18" width="12" height="64" />
          <rect x="22" y="40" width="56" height="12" />
        </g>
      );
    case 'mountain':
      return (
        <g fill={color}>
          <path d="M14 78 L40 34 L52 52 L62 40 L86 78 Z" />
          <path d="M40 34 L46 44 L40 42 L34 44 Z" fill="#F2E6C9" />
        </g>
      );
    default:
      return <circle cx="50" cy="50" r="18" fill={color} />;
  }
}

export function BannerEmblem({ faction, size = 40 }: { faction: string; size?: number }) {
  const f = FACTION_BY_ID[faction];
  const empire = useEmpire(faction);
  if (!f) return null;
  if (empire)
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill={EMPIRE_FIELD} stroke={empireEdge(faction)} strokeWidth="6" />
        <g transform="translate(14 12) scale(0.72)">
          <EmpireArms color="#1B1712" />
        </g>
      </svg>
    );
  const nishan = !!f.banner.nishan;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill={f.banner.field} stroke={f.banner.band} strokeWidth="4" />
      <g transform="translate(15 15) scale(0.7)">
        <Emblem id={nishan || f.banner.emblem !== 'khanda' ? f.banner.emblem : 'sun'} color={f.banner.field === '#1F3A68' ? '#E8870E' : '#1B1712'} />
      </g>
    </svg>
  );
}

/** A pennant on a pole. `wave` animates via CSS. */
export function Banner({ faction, height = 120, wave = true }: { faction: string; height?: number; wave?: boolean }) {
  const f = FACTION_BY_ID[faction];
  const empire = useEmpire(faction);
  if (!f) return null;
  if (empire) return <EmpireFlag faction={faction} height={height} wave={wave} />;
  const { field, band, emblem, nishan } = f.banner;
  const emblemColor = field === '#1F3A68' || field === '#2F6F73' || field === '#9E1B1B' ? '#F2E6C9' : '#1F3A68';
  const showEmblem = nishan || emblem !== 'khanda';
  return (
    <svg width={height * 0.9} height={height} viewBox="0 0 90 100" className={wave ? 'banner-wave' : undefined} role="img" aria-label={`${f.name} banner`}>
      <defs>
        <linearGradient id={`bshade-${faction}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect x="8" y="4" width="3.5" height="96" fill="#5A3A1E" />
      <circle cx="9.75" cy="4" r="3.5" fill="#C9A13B" />
      {nishan && <path d="M9.75 -2 L12 4 L7.5 4 Z" fill="#C9A13B" />}
      <g className="banner-cloth">
        <path d="M11.5 8 L86 30 L11.5 58 Z" fill={field} />
        <path d="M11.5 50 L60 39.5 L66 37 L11.5 58 Z" fill={band} />
        <path d="M11.5 8 L86 30 L11.5 58 Z" fill={`url(#bshade-${faction})`} />
        {showEmblem && (
          <g transform="translate(16 15) scale(0.26)">
            <Emblem id={emblem} color={emblemColor} />
          </g>
        )}
      </g>
    </svg>
  );
}

/**
 * A house's version of the Sikh Empire flag: the saffron swallow-tailed flag
 * with the dhal, talwars and katar, edged and banded in the house's colours,
 * with its old misl emblem in the hoist.
 */
export function EmpireFlag({ faction, height = 120, wave = true }: { faction: string; height?: number; wave?: boolean }) {
  const f = FACTION_BY_ID[faction];
  if (!f) return null;
  const edge = empireEdge(faction);
  const misl = EMPIRE_VARIANT[faction]?.emblem ?? (f.banner.emblem !== 'khanda' ? f.banner.emblem : 'sun');
  return (
    <svg width={height * 1.1} height={height} viewBox="0 0 110 100" className={wave ? 'banner-wave' : undefined} role="img" aria-label={`The Sikh Empire flag of the ${f.name} house`}>
      <rect x="6" y="4" width="3.5" height="96" fill="#5A3A1E" />
      <circle cx="7.75" cy="4" r="3.5" fill="#C9A13B" />
      <g className="banner-cloth">
        <path d="M9.5 8 L104 8 L90 30 L104 52 L9.5 52 Z" fill={EMPIRE_FIELD} stroke={edge} strokeWidth="3" strokeLinejoin="round" />
        <rect x="9.5" y="46" width="88" height="4" fill={edge} />
        <g transform="translate(36 8) scale(0.42)">
          <EmpireArms color="#1B1712" />
        </g>
        <rect x="12" y="11" width="18" height="18" rx="2" fill={edge} />
        <g transform="translate(13 12) scale(0.16)">
          <Emblem id={misl} color="#F2E6C9" />
        </g>
      </g>
    </svg>
  );
}
