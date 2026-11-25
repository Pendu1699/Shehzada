// The Khabar: the player's akhbar, a newsletter of the whole subcontinent,
// season by season, in the manner of the Mughal and Sikh court news-writers.

import { useMemo, useState } from 'react';
import { DESK_NAME, type Desk, type KhabarItem } from '../engine/khabar';
import { useStore } from '../store';
import { Modal } from './common';

const ORDER: Desk[] = ['punjab', 'afghan', 'hindustan', 'company', 'rajputana', 'sindh', 'hills', 'bengal', 'deccan', 'south'];

const seasonOf = (k: KhabarItem) => `${k.festival === 'vaisakhi' ? 'Vaisakhi' : 'Diwali'} ${k.year}`;

export function KhabarModal() {
  const game = useStore((s) => s.game)!;
  const close = useStore((s) => s.closeModal);
  const items = game.khabar ?? [];
  const turns = useMemo(() => [...new Set(items.map((k) => k.turn))].sort((a, b) => b - a), [items]);
  const [idx, setIdx] = useState(0);
  const turn = turns[idx];
  const season = items.filter((k) => k.turn === turn);
  const lead = [...season].sort((a, b) => b.weight - a.weight)[0];
  const desks = ORDER.filter((d) => season.some((k) => k.desk === d && !(k === lead && lead.weight >= 2)));
  return (
    <Modal onClose={close}>
      <div className="khabar">
        <div className="khabar-mast">
          <div className="khabar-title">
            Khabar <span className="gurmukhi">ਖ਼ਬਰ</span>
          </div>
          <div className="khabar-sub">News of the Punjab and all Hindustan, from the akhbar-navis of every court</div>
          <div className="khabar-nav">
            <button className="btn small ghost" disabled={idx >= turns.length - 1} onClick={() => setIdx(idx + 1)}>
              ← Earlier
            </button>
            <span className="khabar-date">{lead ? seasonOf(lead) : '—'}</span>
            <button className="btn small ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
              Later →
            </button>
          </div>
        </div>
        {!season.length ? (
          <p className="muted" style={{ textAlign: 'center' }}>
            No news yet. The news-writers send their letters at the turn of each season — beat the nagara.
          </p>
        ) : (
          <>
            {lead && lead.weight >= 2 && (
              <div className="khabar-lead">
                <div className="khabar-desk">{DESK_NAME[lead.desk]}</div>
                <h3>{lead.headline}</h3>
                <p>{lead.text}</p>
              </div>
            )}
            <div className="khabar-cols">
              {desks.map((d) => (
                <section key={d} className="khabar-section">
                  <div className="khabar-desk">{DESK_NAME[d]}</div>
                  {season
                    .filter((k) => k.desk === d && !(k === lead && lead.weight >= 2))
                    .sort((a, b) => b.weight - a.weight)
                    .map((k, i) => (
                      <article key={i} className={`khabar-item w${k.weight}`}>
                        <h4>{k.headline}</h4>
                        <p>{k.text}</p>
                      </article>
                    ))}
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
