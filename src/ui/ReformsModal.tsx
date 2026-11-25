// Reforms: the tech tree, in three branches, studied one at a time.

import { BRANCH_NAME, REFORMS, REFORM_BY_ID, reformState, type Branch } from '../engine/reforms';
import { useStore } from '../store';
import { Heading, Modal, rs } from './common';

const BRANCHES: Branch[] = ['fauj', 'daftar', 'panth'];

export function ReformsModal() {
  const game = useStore((s) => s.game)!;
  const dispatch = useStore((s) => s.dispatch);
  const close = useStore((s) => s.closeModal);
  const p = game.playerFaction;
  const fs = game.factions[p];
  const studying = fs.flags.studying ? REFORM_BY_ID[String(fs.flags.studying)] : undefined;
  return (
    <Modal onClose={close}>
      <Heading en="Reforms" pa="ਸੁਧਾਰ" right={<span className="small muted">Treasury {rs(fs.treasury)}</span>} />
      <p className="small" style={{ marginTop: 0 }}>
        {studying ? (
          <>
            Now at work: <b>{studying.name}</b> — {Number(fs.flags.study_left ?? 0)} season(s) to go. Schools in your lands sometimes speed the work.
          </>
        ) : (
          'Choose one reform to begin. It is paid for at once and takes some seasons. Some need earlier reforms, and some are not possible before their time.'
        )}
      </p>
      <div className="reform-tree">
        {BRANCHES.map((b) => (
          <div key={b} className="reform-branch">
            <h3>{BRANCH_NAME[b]}</h3>
            {REFORMS.filter((r) => r.branch === b).map((r) => {
              const st = reformState(game, p, r);
              return (
                <div key={r.id} className={`reform-card ${st.state}`}>
                  <div className="reform-name">
                    {st.state === 'done' ? '✓ ' : ''}
                    {r.name}
                  </div>
                  <div className="small">{r.detail}</div>
                  <div className="reform-foot small">
                    {st.state === 'done' ? (
                      <span>Established</span>
                    ) : st.state === 'studying' ? (
                      <span>In progress — {Number(fs.flags.study_left ?? 0)} season(s)</span>
                    ) : st.state === 'locked' ? (
                      <span className="muted">{st.why}</span>
                    ) : (
                      <button className="btn small kesri" disabled={!!studying || fs.treasury < r.cost} onClick={() => dispatch({ type: 'beginReform', id: r.id })}>
                        Begin · {rs(r.cost)} · {r.turns} seasons
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Modal>
  );
}
