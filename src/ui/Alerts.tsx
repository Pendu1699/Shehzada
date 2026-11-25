// Alerts: red cards that drop in when something demands the player's attention
// this season — a war declared on them, a puppet restless or in revolt.

import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { BannerEmblem } from '../art/Banner';
import { useStore } from '../store';

export function Alerts() {
  const game = useStore((s) => s.game);
  const busyModal = useStore((s) => s.battleQueue.length > 0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const sounded = useRef(new Set<string>());
  const list = (game?.alerts ?? []).map((a, i) => ({ ...a, key: `${a.turn}-${i}` })).filter((a) => game && a.turn === game.turn && !dismissed.has(a.key));
  useEffect(() => {
    for (const a of list) {
      if (sounded.current.has(a.key)) continue;
      sounded.current.add(a.key);
      if (a.kind === 'war' || a.kind === 'revolt') audio.nagara(3);
    }
  });
  if (!game || !list.length || busyModal) return null;
  return (
    <div className="alert-stack" role="alert" aria-live="assertive">
      {list.map((a) => (
        <div key={a.key} className={`alert-card ${a.kind}`}>
          {a.faction && <BannerEmblem faction={a.faction} size={34} />}
          <div style={{ flex: 1 }}>
            <div className="alert-title">{a.title}</div>
            <div className="alert-text">{a.text}</div>
          </div>
          <button className="btn small ghost" onClick={() => setDismissed(new Set([...dismissed, a.key]))} aria-label="Dismiss">
            ✕
          </button>
        </div>
      ))}
      {list.length > 1 && (
        <button className="btn small" onClick={() => setDismissed(new Set([...dismissed, ...list.map((a) => a.key)]))}>
          Dismiss all
        </button>
      )}
    </div>
  );
}
