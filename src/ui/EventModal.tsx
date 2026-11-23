import { useEffect } from 'react';
import { audio } from '../audio/engine';
import { pendingView } from '../engine/events';
import { useStore } from '../store';
import { Modal } from './common';

/** One pending event, shown as an illuminated page with the dhadi's words and the choices. */
export function EventModal() {
  const game = useStore((s) => s.game)!;
  const dispatch = useStore((s) => s.dispatch);
  const p = game.pendingEvents[0];
  const v = p ? pendingView(game, p) : null;
  const mood = v?.ev.mood;
  useEffect(() => {
    if (!v) return;
    const prev = audio.getMood();
    if (mood === 'solemn') audio.setMood('mourning');
    else if (mood === 'heroic') audio.nagara(2);
    else if (mood === 'festive') audio.dhol(1);
    else audio.dhadd(2);
    return () => {
      if (mood === 'solemn') audio.setMood(prev === 'mourning' ? 'explore' : prev);
    };
  }, [p?.id]);
  if (!p || !v) return null;
  const solemn = mood === 'solemn';
  return (
    <Modal onClose={() => undefined} hideClose>
      <div style={{ filter: solemn ? 'saturate(0.55)' : undefined }}>
        <div className="heading-band">
          <h2>{v.ev.title}</h2>
          {v.ev.gurmukhi && <span className="gurmukhi">{v.ev.gurmukhi}</span>}
          <span style={{ flex: 1 }} />
          <span className="small muted">{v.ev.kind === 'historical' ? 'The current of history' : 'A matter for your judgment'}</span>
        </div>
        <div className="dhadi-text">
          <p>{v.text}</p>
        </div>
        <div className="rule" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {v.choices.map((c) => (
            <button
              key={c.i}
              className={`btn ${c.i === 0 ? 'kesri' : ''}`}
              style={{ textAlign: 'left', padding: '8px 12px' }}
              disabled={!c.available}
              onClick={() => {
                audio.quill();
                dispatch({ type: 'eventChoice', pendingId: p.id, choice: c.i });
              }}
            >
              <div>{c.label}</div>
              {c.detail && <div className="small" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>{c.detail}</div>}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
