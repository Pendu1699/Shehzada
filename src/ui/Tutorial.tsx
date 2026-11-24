// Counsel from Nawab Kapur Singh: the tutorial, framed as advice from the old
// organiser of the Dal Khalsa to a young sardar. It can be replayed at any time
// from the "Counsel" button. Each step points at the thing it talks about with a
// glowing outline, advances on its own when the player does the thing, and can
// always be stepped through with Back / Next.

import { useEffect, useState } from 'react';
import { Portrait } from '../art/Portrait';
import { armiesOf } from '../engine/query';
import { useStore } from '../store';

type St = ReturnType<typeof useStore.getState>;

interface Step {
  title: string;
  text: string;
  /** CSS selector of the element to highlight. */
  target?: string;
  /** What the player should do, shown in bold. */
  todo?: string;
  done?: (s: St, start: St) => boolean;
}

const mineSelected = (s: St) => !!s.selArmy && s.game?.armies[s.selArmy]?.owner === s.game?.playerFaction;
const ownRegionSelected = (s: St) => !!s.selRegion && s.game?.regions[s.selRegion]?.owner === s.game?.playerFaction;

const STEPS: Step[] = [
  {
    title: 'The painted Punjab',
    text: 'Come, young sardar, sit by me. This map is your country. Bright colour shows where your riders have been; a pencil sketch means no one of ours has looked there yet.',
    todo: 'Drag to move the map. Scroll (or pinch) to zoom. The + − ⤢ buttons do the same.',
    target: '.zoom-ctl',
  },
  {
    title: 'Your jatha',
    text: 'Your horsemen stand beside your dera under your banner. The number under them is how many men they are.',
    todo: 'Click your army on the map (or press Tab).',
    done: (s) => mineSelected(s),
  },
  {
    title: 'Riding out',
    text: 'Rivers slow you, and in the monsoon only ferries are safe. A dashed red line shows the road before you commit, with the number of turns it will take.',
    todo: 'Press Move (or M), then click a neighbouring region. Right-click also moves.',
    target: '[data-tut="move"]',
    done: (s) => !!s.game && armiesOf(s.game, s.game.playerFaction).some((a) => a.path.length > 0),
  },
  {
    title: 'How to fight',
    text: 'Battles happen when armies meet. Against the slow armies of the subahdar, Dhai Phat — strike, wheel away, strike again — bleeds them without risking your jatha. Ambush needs jungle, bela or hills. Pitched battle is for when you are stronger.',
    todo: 'Pick a stance for your army.',
    target: '.stance-grid',
    done: (s) => !!s.game && armiesOf(s.game, s.game.playerFaction).some((a) => a.stance !== 'pitched'),
  },
  {
    title: 'Your lands',
    text: 'Each region shows its owner, its revenue, its fort and how firmly you hold it (control). Land is where your money and your men come from.',
    todo: 'Click one of your own regions (on the map, not the army).',
    done: (s) => ownRegionSelected(s),
  },
  {
    title: 'Raising men',
    text: 'Where your control is strong you can recruit. Horsemen are fast; musketeers hold forts; guns break walls but crawl. Each costs silver now and upkeep every turn.',
    todo: 'Use Recruit in the region panel when you can afford it — or press Next.',
    target: '[data-tut="recruit"]',
  },
  {
    title: 'The langar',
    text: 'Piri does not grow from words but from bread shared with every hungry person, whatever their faith. A langar costs silver each turn and raises Piri, stability and recruits.',
    todo: 'Tick Langar in one of your regions.',
    target: '[data-tut="langar"]',
    done: (s) => !!s.game && Object.values(s.game.regions).some((r) => r.owner === s.game!.playerFaction && r.langar),
  },
  {
    title: 'Rakhi',
    text: 'Villages beyond your lands may pay you rakhi — a fifth of the harvest for your protection. It is good silver, but if raiders come and you do not ride to defend them, you lose both the rakhi and Piri.',
    todo: 'Select a neighbouring region you do not own to see "Offer rakhi". Press Next to go on.',
    target: '[data-tut="rakhi"]',
  },
  {
    title: 'Silver',
    text: 'Your treasury, and in brackets what it will change by this turn. Hover over any number in the game to see how it is worked out.',
    todo: 'Hover over the treasury.',
    target: '[data-tut="treasury"]',
  },
  {
    title: 'The two swords',
    text: 'Miri is your worldly power; Piri is the Panth’s trust in you. Let one run far ahead of the other and your house will crack. Grow them together — the word under the numbers tells you how balanced they are.',
    target: '.swords',
  },
  {
    title: 'Ending the season',
    text: 'Each turn is half a year, Vaisakhi or Diwali. When you are done giving orders, beat the nagara. Then everyone moves, battles are fought and the dhadi tells you what happened.',
    todo: 'Beat the nagara (or press Enter).',
    target: '.nagara-btn',
    done: (s, start) => (s.game?.turn ?? 0) > (start.game?.turn ?? 0),
  },
  {
    title: 'Events',
    text: 'Messengers will bring news and hard choices. History happens by default, but your choices can bend it. Kind choices usually cost silver and earn Piri; cruel ones the other way round.',
  },
  {
    title: 'The Sarbat Khalsa',
    text: 'Every Vaisakhi and Diwali the misls gather at Amritsar and vote on gurmatas — to unite against an invader, to build, to make peace. Honour what is decided: breaking a gurmata costs you dearly in Piri.',
    target: '[data-tut="sarbat"]',
  },
  {
    title: 'The Bahi-khata',
    text: 'Your ledger holds everything: income and costs, your armies, your sardars, diplomacy with other powers, and the chronicle of what has happened.',
    target: '[data-tut="ledger"]',
  },
  {
    title: 'Go well',
    text: 'When the Afghan king comes down in the cold season, remember: a Singh who lives to ride again is not defeated. If you forget any of this, press Counsel at the top and I will sit with you again.',
    target: '[data-tut="counsel"]',
  },
];

function useHighlight(selector?: string) {
  useEffect(() => {
    if (!selector) return;
    let el: Element | null = null;
    const apply = () => {
      const next = document.querySelector(selector);
      if (next === el) return;
      el?.classList.remove('tut-glow');
      el = next;
      el?.classList.add('tut-glow');
    };
    apply();
    const iv = window.setInterval(apply, 300);
    return () => {
      window.clearInterval(iv);
      el?.classList.remove('tut-glow');
    };
  }, [selector]);
}

export function Tutorial() {
  const state = useStore();
  const update = useStore((s) => s.updateSettings);
  const [i, setI] = useState(0);
  const [start, setStart] = useState(() => useStore.getState());
  const step = STEPS[i];
  const go = (n: number) => {
    setI(Math.max(0, Math.min(STEPS.length - 1, n)));
    setStart(useStore.getState());
  };
  const done = !!step?.done?.(state, start);
  useEffect(() => {
    if (done && i < STEPS.length - 1) {
      const t = window.setTimeout(() => go(i + 1), 700);
      return () => window.clearTimeout(t);
    }
  });
  const hidden = !step || !!state.modal || state.battleQueue.length > 0 || state.game?.pendingEvents.length;
  useHighlight(hidden ? undefined : step?.target);
  if (hidden) return null;
  const last = i === STEPS.length - 1;
  return (
    <div className="folio tutorial-card" role="dialog" aria-label="Tutorial">
      <div className="folio-inner tutorial-inner">
        <span className="tutorial-portrait">
          <Portrait id="kapur_singh" faction="faizullapuria" age={55} size={64} />
        </span>
        <div style={{ flex: 1 }}>
          <div className="tutorial-head">
            <span>{step.title}</span>
            <span className="tutorial-count">
              {i + 1} / {STEPS.length}
            </span>
          </div>
          <div className="tutorial-dots" aria-hidden="true">
            {STEPS.map((_, k) => (
              <span key={k} className={k < i ? 'past' : k === i ? 'now' : ''} />
            ))}
          </div>
          <p className="tutorial-text">{step.text}</p>
          {step.todo && <p className={`tutorial-todo ${done ? 'ok' : ''}`}>{done ? '✓ Well done.' : `→ ${step.todo}`}</p>}
          <div className="row tutorial-buttons">
            <button className="btn small ghost" onClick={() => update({ tutorial: false })}>
              Close
            </button>
            <span className="spacer" />
            <button className="btn" disabled={i === 0} onClick={() => go(i - 1)}>
              ← Back
            </button>
            {last ? (
              <button className="btn kesri" onClick={() => update({ tutorial: false })}>
                I will remember
              </button>
            ) : (
              <button className="btn kesri" onClick={() => go(i + 1)}>
                {step.done && !done ? 'Skip →' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
