// Original, procedurally varied miniature-style profile portraits.
// Flat colour, a single profile facing left, a plain coloured ground and a gold
// frame, in the manner of Pahari and Lahore court portraits. These are generic
// figures, not likenesses; the Gurus are never depicted.

import { FACTION_BY_ID } from '../data/factions';
import { hpick } from '../narrative/dhadi';
import { Dastar, DastarCrest } from './Dastar';

export interface PortraitProps {
  id: string;
  faction: string;
  female?: boolean;
  age?: number;
  royal?: boolean;
  size?: number;
  muted?: boolean;
}

const TURBANS = ['#E8870E', '#1F3A68', '#F2E6C9', '#B83A2B', '#C9A13B', '#5E6B2E', '#7A3B69', '#D9C07A'];
const ROBES = ['#F2E6C9', '#E4D2A8', '#B83A2B', '#5E6B2E', '#1F3A68', '#C9A13B', '#8A5A2B'];
const GROUNDS = ['#4F6B3A', '#2E4E6B', '#7A5A2E', '#6B3A3A', '#3F5E5A'];
const SKIN = ['#C68B59', '#B97A4A', '#D19A6A', '#A86E42'];

export function Portrait({ id, faction, female, age = 40, royal, size = 96, muted }: PortraitProps) {
  const sikh = !!FACTION_BY_ID[faction]?.sikh;
  const company = faction === 'company';
  const turban = hpick(TURBANS, id, 't');
  const robe = hpick(ROBES, id, 'r');
  const ground = hpick(GROUNDS, id, 'g');
  const skin = hpick(SKIN, id, 's');
  const beard = age >= 65 ? '#EDE8DD' : age >= 50 ? '#8E8A84' : '#1B1712';
  const w = size,
    h = size * 1.32;
  const filter = muted ? 'grayscale(0.7) sepia(0.3)' : undefined;
  return (
    <svg width={w} height={h} viewBox="0 -12 100 132" style={{ filter }} role="img" aria-label="portrait">
      <defs>
        <clipPath id={`oval-${id}`}>
          <ellipse cx="50" cy="60" rx="44" ry="55" />
        </clipPath>
      </defs>
      <ellipse cx="50" cy="60" rx="48" ry="59" fill="#C9A13B" />
      <ellipse cx="50" cy="60" rx="46" ry="57" fill="#8C6A1E" />
      <g clipPath={`url(#oval-${id})`}>
        <rect width="100" height="120" fill={ground} />
        <rect y="88" width="100" height="32" fill="#00000022" />
        {/* body / jama */}
        <path d={company ? 'M18 120 C22 96 34 84 52 82 C70 84 82 96 86 120 Z' : 'M14 120 C18 94 34 82 52 80 C72 82 86 96 90 120 Z'} fill={company ? '#9E1B1B' : robe} />
        {!company && <path d="M50 82 C52 96 50 110 46 120" stroke="#00000033" strokeWidth="1.5" fill="none" />}
        {company && <path d="M48 84 L52 120 M44 86 L40 120" stroke="#E6C766" strokeWidth="1.2" />}
        {/* neck */}
        <path d="M47 66 L45 82 L58 82 L58 64 Z" fill={skin} />
        {/* face, profile facing left */}
        <path d="M60 30 C50 28 44 33 43 40 L41 45 L36.5 52 L40 54 L39.5 57 L42 58.5 L41 61 L43 64 C46 68 56 68 60 64 C66 58 66 36 60 30 Z" fill={skin} />
        <path d="M44.5 45.5 q2.6 -1.6 4.8 0 q-2.4 1.2 -4.8 0 Z" fill="#1B1712" />
        <path d="M43.5 42.5 q3 -1.6 6 -0.4" stroke="#1B1712" strokeWidth="0.9" fill="none" />
        {female ? (
          <>
            <path d="M40 34 C40 18 64 16 70 30 C76 44 74 70 82 100 L70 104 C66 84 64 66 62 56 C60 44 52 36 40 34 Z" fill={hpick(['#B83A2B', '#E8870E', '#7A3B69', '#1F3A68'], id, 'd')} opacity="0.95" />
            <path d="M42 33 C46 30 54 30 58 34" stroke="#C9A13B" strokeWidth="1.2" fill="none" />
            <circle cx="39.5" cy="51" r="1.6" fill="none" stroke="#C9A13B" strokeWidth="0.8" />
          </>
        ) : (
          <>
            {!company && (
              <path
                d={sikh ? 'M46 52 C44 58 41 66 43 74 C47 80 58 78 62 70 C64 62 63 54 62 50 L54 52 Z' : 'M46 54 C44 60 43 66 45 70 C50 74 58 72 61 66 C63 60 62 54 62 50 L54 54 Z'}
                fill={beard}
              />
            )}
            {company ? (
              <>
                <path d="M30 32 C34 18 70 16 78 30 L72 32 C64 26 42 26 36 34 Z" fill="#1B1712" />
                <path d="M40 30 L36 14 L48 26 Z" fill="#F2E6C9" />
              </>
            ) : (
              <Dastar faction={faction} id={id} color={turban} royal={royal} />
            )}
          </>
        )}
        {!female && !company && (
          // A full, upswept mustache: across the upper lip, sweeping back over the
          // cheek and curling up at the end.
          <g>
            <path
              d="M38.4 54.4 C41 52.4 45.5 52.6 49 53.8 C52.5 55 56 53.6 58 50 C59.4 47.4 58.6 44.4 56.2 44.6 C54.4 44.8 54.2 47 55.6 47.4 C56.6 47.6 57 46.6 56.6 46 C57.4 48.8 55.6 52.4 52 54.8 C48 57.4 43 57.6 40.2 56.8 C38.8 56.4 38 55.4 38.4 54.4 Z"
              fill={beard === '#1B1712' ? '#2E2219' : beard}
              stroke="#000000aa"
              strokeWidth="0.6"
            />
            <path d="M41.5 54.6 C45 54 49 55.4 52.6 54 C55 53 56.6 51 57 48.6" stroke="#ffffff55" strokeWidth="0.7" fill="none" />
          </g>
        )}
        {!female && !company && <path d="M52 88 L62 118" stroke="#C9A13B" strokeWidth="2" />}
      </g>
      <ellipse cx="50" cy="60" rx="46" ry="57" fill="none" stroke="#E6C766" strokeWidth="1" />
      {!female && !company && <DastarCrest faction={faction} id={id} color={turban} />}
    </svg>
  );
}
