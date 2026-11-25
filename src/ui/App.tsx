import { useEffect } from 'react';
import { useStore } from '../store';
import { audio } from '../audio/engine';
import { GameScreen } from './GameScreen';
import { SettingsModal } from './Modals';
import { SetupScreen } from './SetupScreen';
import { TitleScreen } from './TitleScreen';

export function App() {
  const screen = useStore((s) => s.screen);
  const game = useStore((s) => s.game);
  const modal = useStore((s) => s.modal);
  const toasts = useStore((s) => s.toasts);
  const settings = useStore((s) => s.settings);
  useEffect(() => {
    document.documentElement.style.setProperty('--ui-scale', String(settings.uiScale));
    audio.settings = { master: settings.master, music: settings.music, sfx: settings.sfx, muted: settings.muted };
    audio.applySettings();
  }, [settings]);
  return (
    <>
      <BrushInk />
      {screen === 'title' && <TitleScreen />}
      {screen === 'setup' && <SetupScreen />}
      {screen === 'game' && game && <GameScreen />}
      {screen !== 'game' && modal === 'settings' && <SettingsModal />}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * The ink of a reed brush, as an SVG filter used by the Gurmukhi titles: the
 * edges of each stroke wander and bleed a little into the paper, and the ink
 * lies unevenly, heavier in places and dry in others.
 */
function BrushInk() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="brush-ink" x="-5%" y="-10%" width="110%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="grain" />
        <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="ragged" />
        <feMorphology in="ragged" operator="dilate" radius="0.35" result="full" />
        <feGaussianBlur in="full" stdDeviation="0.45" result="bleed" />
        <feComponentTransfer in="bleed" result="bleedSoft">
          <feFuncA type="linear" slope="0.55" />
        </feComponentTransfer>
        <feTurbulence type="fractalNoise" baseFrequency="0.04 0.35" numOctaves="2" seed="11" result="dry" />
        <feColorMatrix in="dry" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.45" result="dryMask" />
        <feComposite in="full" in2="dryMask" operator="in" result="brushed" />
        <feMerge>
          <feMergeNode in="bleedSoft" />
          <feMergeNode in="brushed" />
        </feMerge>
      </filter>
      {/* The same ink, lighter, for small headings: only the edges wander. */}
      <filter id="brush-ink-small" x="-5%" y="-10%" width="110%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="5" result="grain" />
        <feDisplacementMap in="SourceGraphic" in2="grain" scale="0.9" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
