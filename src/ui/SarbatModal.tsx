// The Sarbat Khalsa: misl banners in a circle before the Akal Takht, and the
// gurmatas laid before the assembly.

import { useState } from 'react';
import { AkalTakhtScene } from '../art/AkalTakht';
import { BannerEmblem } from '../art/Banner';
import { GURMATA_INFO, assembly, sarbatConvenes, tally, type GurmataKind } from '../engine/sarbat';
import { date, isSikh, polityName } from '../engine/query';
import { useStore } from '../store';
import { Modal, Tip } from './common';

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
      <AkalTakhtScene members={convenes ? members : []} year={date(game).year} />
      <p className="small" style={{ margin: '6px 0 4px', fontStyle: 'italic' }}>
        {date(game).year < 1800
          ? 'Twice a year, at Vaisakhi and Diwali, the sardars of every misl gather at Amritsar before the Akal Takht — the throne of the Timeless One, raised by Guru Hargobind facing the Harmandir. Here, before the Guru Granth Sahib, the Khalsa decides as one.'
          : 'The Akal Takht stands in white marble and gold, enriched in the Sarkar years. The throne of the Timeless One answers to no king.'}
      </p>
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
