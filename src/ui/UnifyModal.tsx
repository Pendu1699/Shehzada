// Unify the Punjab: the two roads to the Sikh Empire, and how far you have come
// on each. Both are hard by design.

import { EmpireFlag } from '../art/Banner';
import { isSikh } from '../engine/query';
import { canUnify, unifyRequirements, type Requirement } from '../engine/unify';
import { useStore } from '../store';
import { Heading, Modal } from './common';

function Checklist({ reqs }: { reqs: Requirement[] }) {
  return (
    <ul className="unify-list">
      {reqs.map((r) => (
        <li key={r.label} className={r.ok ? 'ok' : 'no'}>
          <span className="unify-mark">{r.ok ? '✓' : '✗'}</span>
          <span>
            <b>{r.label}</b> <span className="small muted">{r.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function UnifyModal() {
  const game = useStore((s) => s.game)!;
  const dispatch = useStore((s) => s.dispatch);
  const openModal = useStore((s) => s.openModal);
  const close = useStore((s) => s.closeModal);
  const p = game.playerFaction;
  const procl = unifyRequirements(game, p, 'proclamation');
  const gurm = unifyRequirements(game, p, 'gurmata');
  const canP = canUnify(game, p, 'proclamation');
  const canG = canUnify(game, p, 'gurmata');
  return (
    <Modal onClose={close}>
      <Heading en="Unify the Punjab" pa="ਪੰਜਾਬ ਇੱਕ ਕਰੋ" />
      <div className="unify-top">
        <EmpireFlag faction={p} height={110} />
        <p>
          Make your house the <b>Sikh Empire</b> — the Sarkar-i-Khalsa — with a darbar at Lahore, coin struck in the name of the Gurus, and your misl’s own version of the
          empire’s flag. It is meant to be hard: a throne won before its time, or without the Panth’s trust, will not hold.
        </p>
      </div>
      {!isSikh(p) ? (
        <p>Only a Sikh house can found the Sikh Empire.</p>
      ) : (
        <div className="unify-roads">
          <div>
            <h3>Proclaim it yourself</h3>
            <p className="small">You take the title by your own hand. The other misls keep their lands, and resent it.</p>
            <Checklist reqs={procl} />
            <button
              className="btn kesri"
              disabled={!canP}
              onClick={() => {
                if (dispatch({ type: 'proclaimEmpire' })) close();
              }}
            >
              Proclaim the Sikh Empire
            </button>
          </div>
          <div>
            <h3>Be named by the Sarbat Khalsa</h3>
            <p className="small">Ask the assembly before the Akal Takht. You need two-thirds of its weight; the misls that vote for you join the empire with their lands and armies.</p>
            <Checklist reqs={gurm} />
            <button className="btn neela" disabled={!canG} onClick={() => openModal('sarbat')}>
              Go to the Sarbat Khalsa
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
