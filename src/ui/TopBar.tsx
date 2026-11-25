import { eraTitle } from '../engine/eras';
import { factionIncome } from '../engine/economy';
import { balanceOf, computeMiri } from '../engine/miripiri';
import { date, factionMen, isSikh, polityName } from '../engine/query';
import { useStore } from '../store';
import { BannerEmblem } from '../art/Banner';
import { BreakdownView, Tip, fmt, rs } from './common';

/** The two swords of Miri and Piri, crossed. */
function Swords({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <g strokeLinecap="round">
        <path d="M8 34 C14 24 22 14 33 5" stroke="#E6C766" strokeWidth="3" fill="none" />
        <path d="M32 34 C26 24 18 14 7 5" stroke="#E8870E" strokeWidth="3" fill="none" />
        <path d="M5 30 L13 36 M27 36 L35 30" stroke="#C9A13B" strokeWidth="3" />
      </g>
    </svg>
  );
}

function FestivalIcon({ festival }: { festival: 'vaisakhi' | 'diwali' }) {
  if (festival === 'diwali')
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-label="Diwali">
        <path d="M3 15 Q12 22 21 15 L19 13 Q12 17 5 13 Z" fill="#C58F5A" stroke="#8C6A1E" />
        <path d="M12 3 C15 7 15 10 12 12 C9 10 9 7 12 3 Z" fill="#FFC04A" className="diya" />
      </svg>
    );
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-label="Vaisakhi">
      {[8, 12, 16].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 22 L${x + (i - 1) * 1.5} 6`} stroke="#C9A13B" strokeWidth="1.4" />
          {[0, 1, 2, 3].map((k) => (
            <ellipse key={k} cx={x + (i - 1) * 1.5 * (1 - (k * 3 + 6) / 22)} cy={6 + k * 3} rx="1.5" ry="2.6" fill="#E6C766" />
          ))}
        </g>
      ))}
    </svg>
  );
}

export function TopBar() {
  const game = useStore((s) => s.game)!;
  const openModal = useStore((s) => s.openModal);
  const restartTutorial = useStore((s) => s.restartTutorial);
  const p = game.playerFaction;
  const fs = game.factions[p];
  const d = date(game);
  const inc = factionIncome(game, p);
  const miri = computeMiri(game, p);
  const bal = balanceOf(game, p);
  const balColor = bal.state === 'balanced' ? '#9bc46a' : bal.state === 'weak' ? '#8fb4e8' : '#ff8a6a';
  return (
    <div className="topbar" role="banner">
      <div className="date">
        <FestivalIcon festival={d.festival} />
        <span>{d.label}</span>
        <span className="small" style={{ fontWeight: 500, color: '#e4d2a8', fontStyle: 'italic' }}>
          {d.monsoon ? 'monsoon ahead' : 'cold season ahead'}
        </span>
        <span className="era-name" title="The age of the century you are in">
          {eraTitle(game)}
        </span>
      </div>
      <Tip title={polityName(game, p)} content={<span>{fs.sarkar ? 'The Sarkar-i-Khalsa' : 'Your misl'} · Legend {fmt(fs.legend)}</span>}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BannerEmblem faction={p} size={30} />
        </span>
      </Tip>
      <Tip title="Treasury" content={<><div className="small muted">Expected this half-year:</div><BreakdownView b={inc} unit="k" /></>}>
        <div className="stat" data-tut="treasury" tabIndex={0}>
          <span className="label">Treasury</span>
          <span className="value">
            {rs(fs.treasury)} <span className="small" style={{ color: inc.total >= 0 ? '#b8e08a' : '#ff9a7a' }}>({inc.total >= 0 ? '+' : ''}{fmt(inc.total)})</span>
          </span>
        </div>
      </Tip>
      <Tip
        title="Miri and Piri — the two swords"
        content={
          <>
            <div>
              <b>Miri {miri.total}</b> (temporal power)
            </div>
            <BreakdownView b={miri} digits={1} />
            <div style={{ marginTop: 6 }}>
              <b>Piri {Math.round(fs.piri)}</b> (the Panth’s trust). It moves only through costly choices: langar, sparing cities, keeping rakhi, honouring gurmatas, tolerance — or their opposites.
            </div>
            <div style={{ marginTop: 6, fontStyle: 'italic' }}>
              {bal.label}. {bal.detail}
            </div>
          </>
        }
      >
        <div className="swords" tabIndex={0}>
          <Swords />
          <div>
            <div className="stat">
              <span className="label">Miri · Piri</span>
            </div>
            <div className="meter" style={{ marginBottom: 2 }}>
              <div style={{ width: `${miri.total}%`, background: 'linear-gradient(90deg,#c9a13b,#e6c766)' }} />
            </div>
            <div className="meter">
              <div style={{ width: `${fs.piri}%`, background: 'linear-gradient(90deg,#c46a08,#e8870e)' }} />
            </div>
          </div>
          <div style={{ lineHeight: 1.05 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {miri.total} · {Math.round(fs.piri)}
            </div>
            <div className="balance" style={{ color: balColor }}>
              {bal.label}
            </div>
          </div>
        </div>
      </Tip>
      <Tip title="Under arms" content={<span>All men in your armies. Raise more in your own regions.</span>}>
        <div className="stat" tabIndex={0}>
          <span className="label">Men</span>
          <span className="value">{fmt(factionMen(game, p))}</span>
        </div>
      </Tip>
      {game.josh.active && (
        <Tip title="Josh" content={<span>The Panth answers the desecration: +morale, +attack, no rout, volunteers flood in. {game.josh.turnsLeft} turn(s) left.</span>}>
          <span className="chip on" style={{ background: 'var(--kesri)' }}>
            ਜੋਸ਼ Josh · {game.josh.turnsLeft}
          </span>
        </Tip>
      )}
      <span className="spacer" />
      <div className="actions">
        <button className="btn small" data-tut="ledger" onClick={() => openModal('ledger')} title="Ledger (L)">
          Bahi-khata
        </button>
        {isSikh(p) && !fs.sarkar && !Object.values(game.factions).some((f) => f.sarkar && f.alive) && (
          <button className="btn small kesri" onClick={() => openModal('unify')} title="Found the Sikh Empire">
            Unify the Punjab
          </button>
        )}
        <button className="btn small" data-tut="sarbat" onClick={() => openModal('sarbat')} title="Sarbat Khalsa (K)">
          Sarbat Khalsa
        </button>
        {fs.sarkar && (
          <button className="btn small kesri" onClick={() => openModal('darbar')} title="Darbar (B)">
            Darbar
          </button>
        )}
        <button className="btn small kesri" data-tut="counsel" onClick={() => restartTutorial()} title="Replay the tutorial (?)">
          ? Counsel
        </button>
        <button className="btn small" onClick={() => openModal('codex')} title="Codex (C)">
          Codex
        </button>
        <button className="btn small neela" onClick={() => openModal('saves')} title="Save and load">
          Save
        </button>
        <button className="btn small neela" onClick={() => openModal('settings')} title="Settings">
          ⚙
        </button>
      </div>
    </div>
  );
}
