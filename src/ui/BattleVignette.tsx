// The battle vignette: opposing formations as painted miniature figures on a
// strip of ground, nagaras between the rounds, rising dust, and a morale bar.

import { useEffect, useMemo, useState } from 'react';
import { audio } from '../audio/engine';
import { FACTION_BY_ID } from '../data/factions';
import { REGION_BY_ID } from '../data/regions';
import { STANCES } from '../engine/combat';
import { polityName } from '../engine/query';
import type { BattleReport } from '../engine/state';
import { battleVerdict } from '../narrative/dhadi';
import { useStore } from '../store';
import { BattleScene } from './BattleScene';
import { Modal, Tip, fmt } from './common';

export function BattleVignette({ report }: { report: BattleReport }) {
  const game = useStore((s) => s.game)!;
  const nextBattle = useStore((s) => s.nextBattle);
  const [round, setRound] = useState(0);
  const total = report.rounds.length;
  const done = round >= total;
  const aCol = FACTION_BY_ID[report.attacker]?.color ?? '#888';
  const dCol = FACTION_BY_ID[report.defender]?.color ?? '#888';
  const lostSoFar = useMemo(() => {
    let a = 0,
      d = 0;
    for (let i = 0; i < Math.min(round, total); i++) {
      a += report.rounds[i].aLoss;
      d += report.rounds[i].dLoss;
    }
    return { a, d };
  }, [round, report, total]);
  const cur = report.rounds[Math.min(round, total) - 1];
  const aMorale = cur ? cur.aMorale : 80;
  const dMorale = cur ? cur.dMorale : 80;
  useEffect(() => {
    if (round > 0 && round <= total) audio.nagara(1);
    if (round === total && total > 0) {
      const won = (report.winner === 'attacker' && report.attacker === game.playerFaction) || (report.winner === 'defender' && report.defender === game.playerFaction);
      if (won) setTimeout(() => audio.dhol(2), 400);
    }
  }, [round]);
  useEffect(() => {
    if (round >= total) return;
    const t = setTimeout(() => setRound((r) => r + 1), round === 0 ? 900 : 1900);
    return () => clearTimeout(t);
  }, [round, total]);
  const line = round === 0 ? `${polityName(game, report.attacker)} chose ${STANCES[report.stance].name}.` : done ? battleVerdict(game, report) : cur?.line;
  return (
    <Modal onClose={nextBattle}>
      <div className="heading-band">
        <h2>Battle at {REGION_BY_ID[report.region].name}</h2>
        <span className="gurmukhi">ਜੰਗ</span>
      </div>
      <div className="battle-stage">
        <BattleScene game={game} report={report} round={round} total={total} lost={lostSoFar} />
        <div className="battle-counts">
          <span>
            {polityName(game, report.attacker)} — {fmt(report.aMen - lostSoFar.a)}
          </span>
          <span>
            {fmt(report.dMen - lostSoFar.d)} — {polityName(game, report.defender)}
          </span>
        </div>
      </div>
      <div className="morale-bars">
        <div>
          <div className="small">Morale</div>
          <div className="bar" style={{ height: 10 }}>
            <div style={{ width: `${Math.min(100, aMorale)}%`, background: aCol, transition: 'width 0.8s' }} />
          </div>
        </div>
        <div>
          <div className="small" style={{ textAlign: 'right' }}>
            Morale
          </div>
          <div className="bar" style={{ height: 10, transform: 'scaleX(-1)' }}>
            <div style={{ width: `${Math.min(100, dMorale)}%`, background: dCol, transition: 'width 0.8s' }} />
          </div>
        </div>
      </div>
      <div className="battle-line" aria-live="polite">
        {line}
      </div>
      {done && (
        <div className="small" style={{ textAlign: 'center' }}>
          Losses: {polityName(game, report.attacker)} {fmt(report.aLosses)}, {polityName(game, report.defender)} {fmt(report.dLosses)}.
          {report.notes.map((n, i) => (
            <div key={i} className="muted">
              {n}
            </div>
          ))}
        </div>
      )}
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
        <Tip
          title="What decided it"
          content={
            <div>
              {report.modifiers.map((m, i) => (
                <div className="tip-row" key={i}>
                  <span>{m.label}</span>
                  <span>{m.value}</span>
                </div>
              ))}
              {!report.modifiers.length && <span>Numbers and steel.</span>}
            </div>
          }
        >
          <span className="chip" tabIndex={0}>
            Modifiers
          </span>
        </Tip>
        <div className="row">
          {!done && (
            <button className="btn small ghost" onClick={() => setRound(total)}>
              Skip
            </button>
          )}
          <button className="btn small kesri" onClick={nextBattle}>
            {done ? 'Onward' : 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
