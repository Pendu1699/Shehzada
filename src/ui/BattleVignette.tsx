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
import { Modal, Tip, fmt } from './common';

function Rider({ x, y, color, turban, flip, fallen }: { x: number; y: number; color: string; turban: string; flip?: boolean; fallen?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`} opacity={fallen ? 0.25 : 1} style={{ transition: 'opacity 0.8s' }}>
      <ellipse cx="0" cy="0" rx="13" ry="2.5" fill="#2a2014" opacity="0.25" />
      {[-7, -4, 5, 8].map((lx, i) => (
        <line key={i} x1={lx} y1={-8} x2={lx + (i % 2 ? 1.5 : -1.5)} y2={0} stroke="#2a1a12" strokeWidth="1.6" />
      ))}
      <ellipse cx="0" cy="-11" rx="10.5" ry="4.6" fill="#7a4a2a" />
      <path d="M7 -13 L11 -21 L15.5 -21.5 L16 -18.5 L12.5 -17 L10 -9 Z" fill="#7a4a2a" />
      <rect x="-5" y="-15.5" width="9" height="6" rx="1" fill={color} />
      <path d="M-2.5 -15 L2.5 -15 L2 -24 L-1.6 -24 Z" fill="#f2e6c9" />
      <circle cx="0.6" cy="-26" r="2.1" fill="#c68b59" />
      <ellipse cx="0.4" cy="-27.6" rx="2.6" ry="2.1" fill={turban} />
      <line x1="-6" y1="-13" x2="12" y2="-38" stroke="#5a3a1e" strokeWidth="0.9" />
      <path d="M12 -38 L13.8 -42.5 L10.6 -39 Z" fill="#8c8c8c" />
      <circle cx="-2.8" cy="-19.5" r="2.9" fill="#5a3a1e" stroke="#c9a13b" strokeWidth="0.6" />
    </g>
  );
}

function Formation({ side, men, lost, color, turban, round }: { side: 'L' | 'R'; men: number; lost: number; color: string; turban: string; round: number }) {
  const n = Math.min(28, Math.max(5, Math.round(Math.sqrt(men) / 3)));
  const fallen = Math.round((lost / Math.max(1, men)) * n);
  const advance = Math.min(round, 3) * 22;
  const figures = [];
  for (let i = 0; i < n; i++) {
    const row = i % 4;
    const col = Math.floor(i / 4);
    const x = side === 'L' ? 70 + col * 24 + row * 6 + advance : 730 - col * 24 - row * 6 - advance;
    const y = 120 + row * 26;
    figures.push(<Rider key={i} x={x} y={y} color={color} turban={turban} flip={side === 'R'} fallen={i >= n - fallen} />);
  }
  return <g>{figures}</g>;
}

export function BattleVignette({ report }: { report: BattleReport }) {
  const game = useStore((s) => s.game)!;
  const nextBattle = useStore((s) => s.nextBattle);
  const [round, setRound] = useState(0);
  const total = report.rounds.length;
  const done = round >= total;
  const aCol = FACTION_BY_ID[report.attacker]?.color ?? '#888';
  const dCol = FACTION_BY_ID[report.defender]?.color ?? '#888';
  const aTurban = FACTION_BY_ID[report.attacker]?.sikh ? FACTION_BY_ID[report.attacker].banner.field : '#f2e6c9';
  const dTurban = FACTION_BY_ID[report.defender]?.sikh ? FACTION_BY_ID[report.defender].banner.field : '#f2e6c9';
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
        <svg viewBox="0 0 800 240" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="dust" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#b08a5a" stopOpacity="0.55" />
              <stop offset="1" stopColor="#b08a5a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M0 95 Q200 80 400 92 T800 88 L800 240 L0 240 Z" fill="#d8bf86" />
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M${i * 60} 95 q6 -10 12 0`} stroke="#7a8a4a" strokeWidth="1.2" fill="none" />
          ))}
          <Formation side="L" men={report.aMen} lost={lostSoFar.a} color={aCol} turban={aTurban} round={round} />
          <Formation side="R" men={report.dMen} lost={lostSoFar.d} color={dCol} turban={dTurban} round={round} />
          {round > 0 && (
            <g style={{ transition: 'opacity 1s' }} opacity={done ? 0.4 : 0.9}>
              {[0, 1, 2, 3, 4].map((i) => (
                <ellipse key={i} cx={360 + i * 22 + (round % 2) * 10} cy={150 + (i % 2) * 30} rx={70} ry={40} fill="url(#dust)" />
              ))}
            </g>
          )}
          <g fontFamily="Cormorant Garamond, serif" fontWeight="700" fontSize="16">
            <text x="16" y="26" fill="#1b1712">
              {polityName(game, report.attacker)} — {fmt(report.aMen - lostSoFar.a)}
            </text>
            <text x="784" y="26" textAnchor="end" fill="#1b1712">
              {fmt(report.dMen - lostSoFar.d)} — {polityName(game, report.defender)}
            </text>
          </g>
        </svg>
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
