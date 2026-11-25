// House flags on poles and as round badges. The designs themselves are in
// ./flags.tsx; this file picks the right one (a misl's own flag, or its version
// of the Sikh Empire flag once it rules the Punjab).

import { FACTION_BY_ID } from '../data/factions';
import { useStore } from '../store';
import { EMPIRE_VARIANT } from './empire';
import { EMPIRE_FLAG, FlagBadge, FlagCloth, flagOf, type FlagDesign } from './flags';

export { EMPIRE_FIELD, empireEdge } from './empire';

/** Is this house the Sikh Empire in the current game? */
function useEmpire(faction: string): boolean {
  return useStore((s) => !!s.game?.factions[faction]?.sarkar);
}

export function BannerEmblem({ faction, size = 40 }: { faction: string; size?: number }) {
  const f = FACTION_BY_ID[faction];
  const empire = useEmpire(faction);
  if (!f) return null;
  return <FlagBadge design={empire ? empireDesign(faction) : flagOf(faction, f.banner.field)} size={size} />;
}

/** The Sikh Empire flag as flown by a given house: its border colour, its device in the hoist. */
function empireDesign(faction: string): FlagDesign {
  return { ...EMPIRE_FLAG, border: EMPIRE_VARIANT[faction]?.edge ?? EMPIRE_FLAG.border };
}

function FlagOnPole({ design, height, wave, label, accent }: { design: FlagDesign; height: number; wave: boolean; label: string; accent?: { device: string; color: string } }) {
  return (
    <svg width={height * 1.15} height={height} viewBox="0 0 115 100" className={wave ? 'banner-wave' : undefined} role="img" aria-label={label}>
      <rect x="6" y="4" width="3.5" height="96" fill="#5A3A1E" />
      <circle cx="7.75" cy="4" r="3.5" fill="#C9A13B" />
      <g className="banner-cloth" transform="translate(9.5 7)">
        <FlagCloth design={design} accent={accent} />
      </g>
    </svg>
  );
}

/** A house's flag on its pole. `wave` animates via CSS. */
export function Banner({ faction, height = 120, wave = true }: { faction: string; height?: number; wave?: boolean }) {
  const f = FACTION_BY_ID[faction];
  const empire = useEmpire(faction);
  if (!f) return null;
  if (empire) return <EmpireFlag faction={faction} height={height} wave={wave} />;
  return <FlagOnPole design={flagOf(faction, f.banner.field)} height={height} wave={wave} label={`${f.name} flag`} />;
}

/**
 * A house's version of the Sikh Empire flag: the saffron pennant with the
 * golden sun, its border in the house's colour (green for the historical
 * Sukerchakia Sarkar) and the house's old device in the hoist.
 */
export function EmpireFlag({ faction, height = 120, wave = true }: { faction: string; height?: number; wave?: boolean }) {
  const f = FACTION_BY_ID[faction];
  if (!f) return null;
  const own = flagOf(faction, f.banner.field);
  const accent = faction === 'sukerchakia' ? undefined : { device: own.device, color: own.field };
  return <FlagOnPole design={empireDesign(faction)} height={height} wave={wave} label={`The Sikh Empire flag of the ${f.name} house`} accent={accent} />;
}
