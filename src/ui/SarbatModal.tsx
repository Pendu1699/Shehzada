// The Sarbat Khalsa: misl banners in a circle before the Akal Takht, and the
// gurmatas laid before the assembly.

import { useState } from 'react';
import { BannerEmblem } from '../art/Banner';
import { FACTION_BY_ID } from '../data/factions';
import { GURMATA_INFO, assembly, sarbatConvenes, tally, type GurmataKind } from '../engine/sarbat';
import { date, isSikh, polityName } from '../engine/query';
import { useStore } from '../store';
import { Modal, Tip } from './common';

function GatheringScene({ members }: { members: string[] }) {
  const n = members.length;
  return (
    <svg viewBox="0 0 600 220" style={{ width: '100%', height: 'auto', display: 'block', background: 'linear-gradient(#e9d9b0,#dcc394)', border: '1px solid var(--gold)' }} aria-label="The assembly before the Akal Takht">
      <defs>
        <linearGradient id="sv-gilt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a0" />
          <stop offset="1" stopColor="#b8862a" />
        </linearGradient>
      </defs>
      {/* sarovar and Harmandir behind */}
      <rect x="0" y="40" width="600" height="46" fill="#9cc0c0" opacity="0.8" />
      <rect x="270" y="46" width="60" height="26" fill="url(#sv-gilt)" />
      <path d="M284 46 Q300 26 316 46 Z" fill="url(#sv-gilt)" />
      <rect x="200" y="66" width="70" height="4" fill="#efe3c4" />
      {/* the Akal Takht */}
      <g>
        <rect x="250" y="96" width="100" height="52" fill="#f2e6c9" stroke="#8c6a1e" />
        <rect x="262" y="84" width="76" height="14" fill="url(#sv-gilt)" />
        <path d="M282 84 Q300 66 318 84 Z" fill="url(#sv-gilt)" />
        {[262, 282, 302, 322].map((x) => (
          <path key={x} d={`M${x} 148 L${x} 118 Q${x + 8} 106 ${x + 16} 118 L${x + 16} 148`} fill="#c9a874" stroke="#8c6a1e" strokeWidth="0.8" />
        ))}
        {/* two Nishan Sahibs */}
        {[230, 370].map((x) => (
          <g key={x}>
            <line x1={x} y1={150} x2={x} y2={70} stroke="#5a3a1e" strokeWidth="2.4" />
            <path d={`M${x} 70 L${x + 22} 77 L${x} 84 Z`} fill="#E8870E" />
          </g>
        ))}
      </g>
      {/* sardars seated in a half-circle */}
      {members.map((f, i) => {
        const a = Math.PI * (0.1 + (0.8 * (i + 0.5)) / n);
        const x = 300 - Math.cos(a) * 250;
        const y = 196 - Math.sin(a) * 30;
        const d = FACTION_BY_ID[f];
        return (
          <g key={f} transform={`translate(${x} ${y})`}>
            <line x1="-12" y1="0" x2="-12" y2="-44" stroke="#5a3a1e" strokeWidth="1.4" />
            <path d="M-12 -44 L10 -37 L-12 -30 Z" fill={d.banner.field} stroke="#1b1712" strokeWidth="0.4" />
            <ellipse cx="0" cy="2" rx="12" ry="3" fill="#00000022" />
            <path d="M-7 0 Q0 -16 7 0 Z" fill="#f2e6c9" stroke="#1b1712" strokeWidth="0.5" />
            <circle cx="0" cy="-14" r="3.6" fill="#c68b59" />
            <ellipse cx="0" cy="-16.5" rx="4.4" ry="3.2" fill={d.banner.field === '#1F3A68' ? '#1F3A68' : '#E8870E'} />
          </g>
        );
      })}
    </svg>
  );
}

export function SarbatModal() {
  const game = useStore((s) => s.game)!;
  const dispatch = useStore((s) => s.dispatch);
  const close = useStore((s) => s.closeModal);
  const p = game.playerFaction;
  const convenes = sarbatConvenes(game);
  const members = assembly(game);
  const pending = game.gurmatas.filter((g) => g.passed === undefined);
  const active = game.gurmatas.filter((g) => g.passed && g.until >= game.turn);
  const [kind, setKind] = useState<GurmataKind>('misl_peace');
  const [target, setTarget] = useState('');
  const canPropose = convenes && !game.factions[p].flags[`proposed_${game.turn}`];
  const enemies = Object.values(game.factions).filter((f) => f.alive && !isSikh(f.id) && members.some((m) => game.factions[m].relations[f.id] === 'war'));
  const disperse = () => {
    dispatch({ type: 'finishSarbat' });
    close();
  };
  return (
    <Modal onClose={disperse}>
      <div className="heading-band">
        <h2>Sarbat Khalsa</h2>
        <span className="gurmukhi">ਸਰਬੱਤ ਖ਼ਾਲਸਾ</span>
        <span style={{ flex: 1 }} />
        <span className="small muted">{date(game).label} · before the Akal Takht</span>
      </div>
      {!convenes ? (
        <p>
          {game.factions[p].sarkar
            ? 'The Sarbat Khalsa is no longer called. The Sarkar governs from the darbar at Lahore.'
            : isSikh(p)
              ? 'Too few misls remain to hold the assembly.'
              : 'Only the Sikh misls sit in the Sarbat Khalsa.'}
        </p>
      ) : (
        <>
          <GatheringScene members={members} />
          <p className="small muted" style={{ margin: '6px 0' }}>
            Each misl’s voice carries weight by its standing (its Miri). A gurmata passed here binds every misl; breaking one costs dear in Piri.
          </p>
          {pending.length === 0 && <p>No gurmatas are before the assembly this season.</p>}
          {pending.map((g) => {
            const t = tally(game, g);
            const mine = g.votesFor.includes(p) ? 'yes' : g.votesAgainst.includes(p) ? 'no' : 'yes';
            return (
              <div key={g.id} style={{ borderBottom: '1px solid rgba(201,161,59,0.6)', padding: '6px 0' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.1em' }}>{g.title}</b>
                    <div className="small muted">
                      Proposed by {polityName(game, g.proposer)}. {GURMATA_INFO[g.kind as GurmataKind]?.detail}
                    </div>
                  </div>
                  <div className="row">
                    <button className={`chip ${mine === 'yes' ? 'on' : ''}`} onClick={() => dispatch({ type: 'vote', gurmataId: g.id, yes: true })}>
                      Aye
                    </button>
                    <button className={`chip ${mine === 'no' ? 'on' : ''}`} onClick={() => dispatch({ type: 'vote', gurmataId: g.id, yes: false })}>
                      Nay
                    </button>
                  </div>
                </div>
                <div className="row small" style={{ marginTop: 4 }}>
                  <span>For:</span>
                  {g.votesFor.map((f) => (
                    <Tip key={f} content={<span>{polityName(game, f)}</span>}>
                      <BannerEmblem faction={f} size={20} />
                    </Tip>
                  ))}
                  <span style={{ marginLeft: 10 }}>Against:</span>
                  {g.votesAgainst.map((f) => (
                    <Tip key={f} content={<span>{polityName(game, f)}</span>}>
                      <BannerEmblem faction={f} size={20} />
                    </Tip>
                  ))}
                  <span style={{ flex: 1 }} />
                  <span className="muted">
                    weight {t.yes} – {t.no}
                  </span>
                </div>
              </div>
            );
          })}
          {canPropose && (
            <div className="section">
              <div className="section-title">Lay a gurmata before the assembly</div>
              <div className="row">
                <select value={kind} onChange={(e) => setKind(e.target.value as GurmataKind)}>
                  {(Object.keys(GURMATA_INFO) as GurmataKind[]).filter((k) => k !== 'rebuild' || game.josh.rebuild).map((k) => (
                    <option key={k} value={k}>
                      {GURMATA_INFO[k].name}
                    </option>
                  ))}
                </select>
                {kind === 'unite_vs' && (
                  <select value={target} onChange={(e) => setTarget(e.target.value)}>
                    <option value="">against…</option>
                    {enemies.map((f) => (
                      <option key={f.id} value={f.id}>
                        {polityName(game, f.id)}
                      </option>
                    ))}
                  </select>
                )}
                {kind === 'recognise' && (
                  <select value={target} onChange={(e) => setTarget(e.target.value)}>
                    <option value="">whom…</option>
                    {members.map((f) => (
                      <option key={f} value={f}>
                        {polityName(game, f)}
                      </option>
                    ))}
                  </select>
                )}
                <button className="btn small kesri" disabled={(kind === 'unite_vs' || kind === 'recognise') && !target} onClick={() => dispatch({ type: 'propose', kind, target: target || undefined })}>
                  Propose
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {active.length > 0 && (
        <div className="section">
          <div className="section-title">Gurmatas in force</div>
          {active.map((g) => (
            <div key={g.id} className="small">
              {g.title} — binding until {g.until - game.turn <= 0 ? 'this season ends' : `${g.until - game.turn} more season(s)`}
            </div>
          ))}
        </div>
      )}
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
        <button className="btn kesri" onClick={disperse}>
          {pending.length ? 'Count the voices and disperse' : 'Disperse'}
        </button>
      </div>
    </Modal>
  );
}
