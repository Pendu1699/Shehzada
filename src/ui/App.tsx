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
