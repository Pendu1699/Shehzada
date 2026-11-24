import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { TITLE_GURMUKHI } from '../data/glossary';
import { listSlots, loadFromSlot } from '../engine/save';
import { serialize } from '../engine/save';
import { useStore } from '../store';

import { MiniaturePainting } from '../art/Miniature';

/** The title painting (kept under this name for other screens that import it). */
export function DawnPainting() {
  return <MiniaturePainting />;
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
