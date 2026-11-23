// The Darbar: the court of the Sarkar-i-Khalsa in the manner of a darbar painting —
// the throne beneath a canopy, the factions seated in rows, their standing shown
// as gold-leaf bars.

import { Portrait } from '../art/Portrait';
import { COURT_COSTS, COURT_FACTIONS, collapseRisk, courtStability, type CourtFactionId } from '../engine/court';
import { year } from '../engine/query';
import { useStore } from '../store';
import { Bar, BreakdownView, Heading, Modal, Tip, rs } from './common';

const SEAT_COLORS: Record<CourtFactionId, string> = {
  sandhawalia: '#7A3B69',
  dogra: '#7D5A50',
  panches: '#E8870E',
  misl_families: '#5E6B2E',
  europeans: '#1F3A68',
};

function DarbarScene() {
  const order: CourtFactionId[] = ['misl_families', 'sandhawalia', 'dogra', 'europeans', 'panches'];
  return (
    <svg viewBox="0 0 640 200" style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--gold)', background: 'linear-gradient(#e9d9b0, #d8bf86)' }} aria-hidden="true">
      {/* canopy and throne */}
      <rect x="0" y="150" width="640" height="50" fill="#b83a2b" opacity="0.55" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={i * 40 + 6} y={156} width={28} height={38} fill="none" stroke="#e6c766" strokeWidth="1" opacity="0.6" />
      ))}
      <path d="M260 30 L380 30 L370 50 L270 50 Z" fill="#c9a13b" />
      <line x1="272" y1="50" x2="272" y2="150" stroke="#8c6a1e" strokeWidth="4" />
      <line x1="368" y1="50" x2="368" y2="150" stroke="#8c6a1e" strokeWidth="4" />
      <rect x="290" y="96" width="60" height="50" rx="8" fill="#e6c766" stroke="#8c6a1e" />
      <ellipse cx="320" cy="96" rx="34" ry="8" fill="#c9a13b" />
      <g transform="translate(320 120)">
        <path d="M-10 26 Q0 -6 10 26 Z" fill="#f2e6c9" />
        <circle cx="0" cy="-8" r="6" fill="#c68b59" />
        <ellipse cx="0" cy="-12" rx="7" ry="5" fill="#E8870E" />
        <path d="M-2 -18 Q0 -26 4 -28" stroke="#f2e6c9" strokeWidth="2" fill="none" />
      </g>
      {order.map((k, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const rank = Math.floor(i / 2);
        return Array.from({ length: 3 }, (_, j) => {
          const x = 320 + side * (90 + rank * 95 + j * 26);
          const y = 150 - j * 2;
          return (
            <g key={`${k}${j}`} transform={`translate(${x} ${y})`}>
              <path d="M-8 0 Q0 -18 8 0 Z" fill={SEAT_COLORS[k]} />
              <circle cx="0" cy="-20" r="4" fill="#c68b59" />
              <ellipse cx="0" cy="-23" rx="5" ry="3.6" fill={k === 'europeans' ? '#1b1712' : '#f2e6c9'} />
            </g>
          );
        });
      })}
    </svg>
  );
}

export function DarbarModal() {
  const game = useStore((s) => s.game)!;
  const dispatch = useStore((s) => s.dispatch);
  const p = game.playerFaction;
  const fs = game.factions[p];
  const c = game.court;
  if (!fs.sarkar || !c) {
    return (
      <Modal>
        <Heading en="Darbar" pa="ਦਰਬਾਰ" />
        <p>The darbar belongs to the Sarkar-i-Khalsa. While you lead a misl, your sardars sit with you on the ground around the fire, and that is court enough.</p>
      </Modal>
    );
  }
  const stab = courtStability(c);
  const risk = collapseRisk(game, p);
  const heir = c.heir ? game.leaders[c.heir] : undefined;
  const heirs = Object.values(game.leaders).filter((l) => l.alive && l.active && l.faction === p && l.id !== fs.chief);
  const done = (act: string) => !!fs.flags[`court_${act}_${game.turn}`];
  return (
    <Modal wide>
      <Heading en="The Darbar" pa="ਦਰਬਾਰ" right={<span className="small muted">Lahore · {fs.chief ? game.leaders[fs.chief]?.name : ''}</span>} />
      <DarbarScene />
      <div className="row" style={{ gap: 24, margin: '10px 0' }}>
        <Tip title="Stability of the darbar" content={<BreakdownView b={{ total: stab.value, parts: stab.parts }} digits={0} />}>
          <div style={{ width: 220 }} tabIndex={0}>
            <b>Darbar stability {stab.value}</b>
            <Bar value={stab.value} color="#c9a13b" />
          </div>
        </Tip>
        <Tip title="Danger to the succession" content={<span>The chance that the history of 1839–46 repeats: deaths, assassinations and betrayal. Lower it by preparing an heir, binding the army, keeping the factions loyal and balanced, keeping Miri and Piri close, and calling the Sarbat Khalsa.</span>}>
          <div style={{ width: 220 }} tabIndex={0}>
            <b>Danger {Math.round(risk * 100)}%</b>
            <Bar value={risk * 100} color="#b83a2b" />
          </div>
        </Tip>
        <div style={{ width: 220 }}>
          <b>The army bound to the throne {Math.round(c.armyBound)}</b>
          <Bar value={c.armyBound} color="#e8870e" />
        </div>
        {c.crisis && <span className="chip on" style={{ background: 'var(--sindoor)', color: 'var(--wasli)' }}>Succession crisis</span>}
        {c.regency > 0 && <span className="chip">Regency</span>}
      </div>
      <table className="ledger">
        <thead>
          <tr>
            <th>Faction</th>
            <th style={{ width: 160 }}>Influence</th>
            <th style={{ width: 160 }}>Loyalty</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(Object.keys(COURT_FACTIONS) as CourtFactionId[]).map((k) => (
            <tr key={k}>
              <td>
                <Tip title={COURT_FACTIONS[k].name} content={<span>{COURT_FACTIONS[k].detail}</span>}>
                  <span tabIndex={0}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, background: SEAT_COLORS[k], marginRight: 6 }} />
                    {COURT_FACTIONS[k].name}
                  </span>
                </Tip>
              </td>
              <td>
                <Bar value={c.factions[k].influence} color={SEAT_COLORS[k]} />
              </td>
              <td>
                <Bar value={c.factions[k].loyalty} color={c.factions[k].loyalty < 40 ? '#b83a2b' : '#5e6b2e'} />
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn small" disabled={done('favour') || fs.treasury < COURT_COSTS.favour} onClick={() => dispatch({ type: 'court', act: 'favour', target: k })}>
                  Favour ({rs(COURT_COSTS.favour)})
                </button>{' '}
                <button className="btn small ghost" disabled={done('curb') || fs.treasury < COURT_COSTS.curb} onClick={() => dispatch({ type: 'court', act: 'curb', target: k })}>
                  Curb
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="section">
        <div className="section-title">The succession</div>
        <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
          {heir && <Portrait id={heir.id} faction={p} age={year(game) - heir.born} size={64} />}
          <div style={{ flex: 1 }}>
            <div>
              Heir: <b>{heir ? heir.name : 'none named'}</b>
            </div>
            <div style={{ width: 240 }}>
              Prepared {Math.round(c.heirPrepared)} <Bar value={c.heirPrepared} color="#1f3a68" />
            </div>
            <div className="row" style={{ marginTop: 6 }}>
              <select defaultValue="" onChange={(e) => e.target.value && dispatch({ type: 'court', act: 'name_heir', target: e.target.value })} aria-label="Name an heir">
                <option value="">Name an heir…</option>
                {heirs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <button className="btn small" disabled={!heir || done('educate') || fs.treasury < COURT_COSTS.educate} onClick={() => dispatch({ type: 'court', act: 'educate' })}>
                Educate the heir ({rs(COURT_COSTS.educate)})
              </button>
              <button className="btn small kesri" disabled={done('bind_army') || fs.treasury < COURT_COSTS.bind_army} onClick={() => dispatch({ type: 'court', act: 'bind_army' })}>
                Bind the army ({rs(COURT_COSTS.bind_army)})
              </button>
            </div>
          </div>
          <div style={{ width: 260 }}>
            <label className="row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={fs.convenesSarbat} onChange={(e) => dispatch({ type: 'setConvenes', on: e.target.checked })} />
              Keep calling the Sarbat Khalsa
            </label>
            <div className="small muted">Costs you freedom of action; gives Piri every season, and keeps the army’s panches loyal to the Panth.</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
