import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { TITLE_GURMUKHI } from '../data/glossary';
import { listSlots, loadFromSlot } from '../engine/save';
import { serialize } from '../engine/save';
import { useStore } from '../store';

/** An original stylised dawn over the sarovar at Amritsar: reflected light, a gilded
 * pavilion on its causeway, bungas and trees in silhouette, birds and lamp-light. */
export function DawnPainting() {
  const stars = Array.from({ length: 40 }, (_, i) => ({ x: (i * 137.5) % 1600, y: ((i * 71) % 260) + 10, r: (i % 3) * 0.5 + 0.6 }));
  return (
    <svg className="dawn" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#142846" />
          <stop offset="0.38" stopColor="#3d3f6e" />
          <stop offset="0.6" stopColor="#c0685a" />
          <stop offset="0.74" stopColor="#f0a54a" />
          <stop offset="0.8" stopColor="#f6d79a" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3c27a" />
          <stop offset="0.25" stopColor="#a8705a" />
          <stop offset="1" stopColor="#1f2b48" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff4cf" />
          <stop offset="0.5" stopColor="#ffd27a" />
          <stop offset="1" stopColor="#ffb04a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gilt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a0" />
          <stop offset="1" stopColor="#b8862a" />
        </linearGradient>
      </defs>
      <rect width="1600" height="720" fill="url(#sky)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f2e6c9" opacity={0.5 - (s.y / 600)} />
      ))}
      <circle cx="800" cy="560" r="170" fill="url(#sun)" opacity="0.9" className="sun-glow" />
      <circle cx="800" cy="575" r="52" fill="#fff0c4" opacity="0.95" />
      {/* distant city: domes, bungas and the line of the parikrama */}
      <path
        d="M0 600 L60 600 L60 570 L80 570 L80 552 L92 540 L104 552 L104 570 L170 570 L170 585 L230 585 L230 560 L238 548 L246 560 L246 585 L330 585 L330 562 L352 562 L352 540 L360 528 L368 540 L368 562 L440 562 L440 580 L520 580 L520 566 L540 566 L540 548 L558 535 L576 548 L576 566 L620 566 L620 600 L980 600 L980 566 L1024 566 L1024 548 L1042 535 L1060 548 L1060 566 L1080 566 L1080 580 L1160 580 L1160 562 L1232 562 L1232 540 L1240 528 L1248 540 L1248 562 L1270 562 L1270 585 L1354 585 L1354 560 L1362 548 L1370 560 L1370 585 L1430 585 L1430 570 L1496 570 L1496 552 L1508 540 L1520 552 L1520 570 L1540 570 L1540 600 L1600 600 L1600 640 L0 640 Z"
        fill="#2a2440"
        opacity="0.88"
      />
      {/* trees at the edges */}
      {[60, 180, 1420, 1540].map((x, i) => (
        <g key={i} fill="#1a1a2e">
          <rect x={x - 4} y={560} width={8} height={60} />
          <ellipse cx={x} cy={545} rx={52} ry={40} />
          <ellipse cx={x - 30} cy={565} rx={34} ry={26} />
          <ellipse cx={x + 30} cy={562} rx={36} ry={26} />
        </g>
      ))}
      {/* the sarovar */}
      <rect y="620" width="1600" height="280" fill="url(#water)" />
      <ellipse cx="800" cy="650" rx="130" ry="10" fill="#fff0c4" opacity="0.55" />
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x={800 - 40 - i * 9 + ((i * 37) % 30)} y={665 + i * 12} width={80 + i * 14} height="2" fill="#ffe2a0" opacity={0.42 - i * 0.02} />
      ))}
      {/* causeway */}
      <rect x="560" y="628" width="232" height="9" fill="#e8d6b0" opacity="0.9" />
      {/* the gilded pavilion */}
      <g>
        <rect x="790" y="590" width="100" height="44" fill="#f2e6c9" />
        <rect x="800" y="558" width="80" height="34" fill="url(#gilt)" />
        <path d="M818 558 Q840 520 862 558 Z" fill="url(#gilt)" />
        <path d="M840 520 L840 506" stroke="#ffe9a0" strokeWidth="2" />
        <circle cx="840" cy="504" r="3" fill="#ffe9a0" />
        {[800, 880].map((x) => (
          <g key={x}>
            <path d={`M${x - 8} 558 Q${x} 540 ${x + 8} 558 Z`} fill="url(#gilt)" />
          </g>
        ))}
        {[806, 826, 846, 866].map((x) => (
          <rect key={x} x={x} y="600" width="8" height="22" rx="4" fill="#b8862a" opacity="0.8" />
        ))}
      </g>
      {/* reflection of the pavilion */}
      <g opacity="0.35" transform="translate(0 1268) scale(1 -1)">
        <rect x="790" y="590" width="100" height="44" fill="#f2e6c9" />
        <rect x="800" y="558" width="80" height="34" fill="url(#gilt)" />
        <path d="M818 558 Q840 520 862 558 Z" fill="url(#gilt)" />
      </g>
      {/* birds */}
      {[
        [520, 300],
        [560, 320],
        [600, 290],
        [1040, 260],
        [1080, 280],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q8 -8 16 0 q8 -8 16 0`} stroke="#2a2440" strokeWidth="2.2" fill="none" className="bird" />
      ))}
      {/* diyas along the parikrama */}
      {Array.from({ length: 26 }, (_, i) => (
        <circle key={i} cx={40 + i * 60} cy={636} r="2.2" fill="#ffd27a" className="diya" style={{ animationDelay: `${(i * 0.37) % 2}s` }} />
      ))}
    </svg>
  );
}

export function TitleScreen() {
  const setScreen = useStore((s) => s.setScreen);
  const load = useStore((s) => s.load);
  const openModal = useStore((s) => s.openModal);
  const [hasSave, setHasSave] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setHasSave(listSlots().length > 0);
  }, []);
  const begin = () => {
    audio.start();
    audio.nagara(3);
    setScreen('setup');
  };
  const cont = () => {
    audio.start();
    const slots = listSlots();
    if (!slots.length) return;
    const g = loadFromSlot(slots[0].name);
    if (g) load(serialize(g));
  };
  return (
    <div className="title-screen">
      <DawnPainting />
      <div className="folio title-card">
        <div className="folio-inner" style={{ overflow: 'visible' }}>
          <p className="g-title">{TITLE_GURMUKHI}</p>
          <h1 className="e-title">Raj Karega Khalsa</h1>
          <div className="subtitle">The Punjab, 1748 – 1849</div>
          <div className="rule" />
          <div className="title-menu">
            <button className="btn kesri" onClick={begin} autoFocus>
              Begin a new vaar
            </button>
            {hasSave && (
              <button className="btn" onClick={cont}>
                Continue
              </button>
            )}
            <button
              className="btn neela"
              onClick={() => {
                audio.start();
                file.current?.click();
              }}
            >
              Import a saved game
            </button>
            <button className="btn ghost" onClick={() => openModal('settings')}>
              Settings
            </button>
          </div>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) load(await f.text());
            }}
          />
          <p className="small muted" style={{ maxWidth: 440, margin: '14px auto 0' }}>
            A dhadi sings of a hunted people who became a sovereign state, and of how that state was lost. This time, the song is yours to make.
          </p>
        </div>
      </div>
    </div>
  );
}
