// Counsel from Nawab Kapur Singh: the tutorial, framed as advice from the old
// organiser of the Dal Khalsa to a young sardar. Steps advance as the player acts.

import { useEffect, useState } from 'react';
import { Portrait } from '../art/Portrait';
import { armiesOf } from '../engine/query';
import { useStore } from '../store';

interface Step {
  id: string;
  text: string;
  done: (s: ReturnType<typeof useStore.getState>) => boolean;
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    text: 'Come, young sardar, sit by me. This painted Punjab is your country. Where the colour is bright, your riders have been; where it is only a pencil sketch, no one of ours has looked yet. Drag to move across it, and turn the wheel to come closer.',
    done: () => false,
  },
  {
    id: 'army',
    text: 'First, find your jatha. Click your horsemen on the map — they stand beside your dera with your banner.',
    done: (s) => !!s.selArmy && s.game?.armies[s.selArmy]?.owner === s.game?.playerFaction,
  },
  {
    id: 'move',
    text: 'Now ride. Right-click a neighbouring region (or press Move and tap it) to send them. Watch the rivers: in the monsoon only ferries are safe, and the horse sink in the mud.',
    done: (s) => !!s.game && armiesOf(s.game, s.game.playerFaction).some((a) => a.path.length > 0),
  },
  {
    id: 'stance',
    text: 'Before you meet an enemy, choose how to fight. Against the slow armies of the subahdar, Dhai Phat — strike, wheel away, strike again — will bleed them without risking your jatha. Ambush needs jungle, bela or hills.',
    done: (s) => !!s.game && armiesOf(s.game, s.game.playerFaction).some((a) => a.stance !== 'pitched'),
  },
  {
    id: 'region',
    text: 'Click your own region. Keep a langar there if you can: Piri does not grow from words but from bread shared with every hungry person, whatever their faith.',
    done: (s) => !!s.game && Object.values(s.game.regions).some((r) => r.owner === s.game!.playerFaction && r.langar),
  },
  {
    id: 'swords',
    text: 'Look at the two swords above: Miri is your power, Piri the Panth’s trust in you. Let one run far ahead of the other and your house will crack. Grow them together. Now beat the nagara to end the season.',
    done: (s) => (s.game?.turn ?? 0) >= 1,
  },
  {
    id: 'done',
    text: 'Good. Every Vaisakhi and Diwali the Sarbat Khalsa will gather at Amritsar. Honour its gurmatas. Protect the villages that pay you rakhi. And when the Afghan king comes down in the cold season, remember: a Singh who lives to ride again is not defeated. I have nothing more to teach you that the years will not.',
    done: () => false,
  },
];

export function Tutorial() {
  const state = useStore();
  const update = useStore((s) => s.updateSettings);
  const [i, setI] = useState(0);
  const step = STEPS[i];
  useEffect(() => {
    if (step && step.done(state) && i < STEPS.length - 1) setI(i + 1);
  });
  if (!step || state.modal || state.battleQueue.length) return null;
  return (
    <div className="folio" style={{ position: 'absolute', left: '50%', bottom: 18, transform: 'translateX(-50%)', width: 'min(620px, calc(100vw - 150px))', zIndex: 12 }}>
      <div className="folio-inner" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 12px' }}>
        <Portrait id="kapur_singh" faction="faizullapuria" age={55} size={56} />
        <div style={{ flex: 1 }}>
          <div className="small" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--sindoor)' }}>
            The counsel of Nawab Kapur Singh
          </div>
          <div style={{ fontSize: '0.95em' }}>{step.text}</div>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
            {i === 0 && (
              <button className="btn small" onClick={() => setI(1)}>
                Go on
              </button>
            )}
            {i === STEPS.length - 1 ? (
              <button className="btn small kesri" onClick={() => update({ tutorial: false })}>
                I will remember
              </button>
            ) : (
              <button className="btn small ghost" onClick={() => update({ tutorial: false })}>
                Enough counsel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
