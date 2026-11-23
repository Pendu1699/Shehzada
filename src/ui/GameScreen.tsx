import { useEffect, useState } from 'react';
import { audio } from '../audio/engine';
import { REGION_BY_ID } from '../data/regions';
import { armiesOf, armyMen, polityName } from '../engine/query';
import { useStore } from '../store';
import { ArmyPanel } from './ArmyPanel';
import { BattleVignette } from './BattleVignette';
import { Folio, fmt } from './common';
import { getMap, MapView } from './MapView';
import { CodexModal, LedgerModal, SavesModal, SettingsModal, SummaryModal } from './Modals';
import { VaarPage } from './VaarPage';
import { DarbarModal } from './DarbarModal';
import { SarbatModal } from './SarbatModal';
import { RegionPanel } from './RegionPanel';
import { TopBar } from './TopBar';
import { EventModal } from './EventModal';
import { Tutorial } from './Tutorial';

function HoverCard() {
  const game = useStore((s) => s.game)!;
  const hover = useStore((s) => s.hover);
  const preview = useStore((s) => s.preview)();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', h);
    return () => window.removeEventListener('pointermove', h);
  }, []);
  if (!hover) return null;
  const st = game.regions[hover];
  const seen = (game.explored[hover] ?? 0) > 0;
  return (
    <div className="hovercard" style={{ left: Math.min(pos.x + 16, window.innerWidth - 270), top: pos.y + 18 }}>
      <b>{REGION_BY_ID[hover].name}</b>
      {seen ? <div className="small">{polityName(game, st.owner)}</div> : <div className="small muted">unexplored</div>}
      {preview && (
        <div className="small" style={{ color: 'var(--sindoor)' }}>
          March: {preview.path.length} region{preview.path.length > 1 ? 's' : ''}, about {preview.turns} turn{preview.turns > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

function DhadiPanel() {
  const game = useStore((s) => s.game)!;
  const openModal = useStore((s) => s.openModal);
  const [open, setOpen] = useState(true);
  const lines = game.summary?.dhadi ?? [];
  if (!open)
    return (
      <button className="btn small neela" style={{ position: 'absolute', right: 12, top: 66, zIndex: 7 }} onClick={() => setOpen(true)}>
        The Dhadi
      </button>
    );
  return (
    <Folio className="dhadi-panel">
      <div className="heading-band" style={{ marginBottom: 4 }}>
        <h3 style={{ margin: 0 }}>The Dhadi</h3>
        <span className="gurmukhi" style={{ color: 'var(--sindoor)' }}>ਢਾਡੀ</span>
        <span style={{ flex: 1 }} />
        <button className="btn small ghost" onClick={() => setOpen(false)} aria-label="Hide">
          –
        </button>
      </div>
      <div className="dhadi-text" style={{ fontSize: '0.92em' }}>
        {lines.slice(0, 4).map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      <button className="btn small" onClick={() => openModal('summary')}>
        The full account
      </button>
    </Folio>
  );
}

export function GameScreen() {
  const game = useStore((s) => s.game)!;
  const selRegion = useStore((s) => s.selRegion);
  const selArmy = useStore((s) => s.selArmy);
  const modal = useStore((s) => s.modal);
  const battleQueue = useStore((s) => s.battleQueue);
  const dispatch = useStore((s) => s.dispatch);
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);
  const selectArmy = useStore((s) => s.selectArmy);
  const selectRegion = useStore((s) => s.selectRegion);
  const settings = useStore((s) => s.settings);
  const [moveMode, setMoveMode] = useState(false);
  const [busy, setBusy] = useState(false);

  const endTurn = () => {
    if (busy || game.phase === 'ended') return;
    setBusy(true);
    audio.nagara(2);
    setMoveMode(false);
    // Let the drum sound before the (synchronous) resolution runs.
    setTimeout(() => {
      dispatch({ type: 'endTurn' });
      setBusy(false);
    }, 60);
  };

  useEffect(() => {
    if (game.phase === 'sarbat' && !modal && battleQueue.length === 0 && game.pendingEvents.length === 0) openModal('sarbat');
  }, [game.phase, modal, battleQueue.length, game.pendingEvents.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const map = getMap();
      const st = useStore.getState();
      if (e.key === 'Escape') {
        if (st.modal) closeModal();
        else if (moveMode) setMoveMode(false);
        else {
          selectArmy(null);
          selectRegion(null);
        }
        return;
      }
      if (st.modal || st.battleQueue.length) return;
      const k = e.key.toLowerCase();
      if (e.key === 'Enter') endTurn();
      else if (k === 'm' && st.selArmy) setMoveMode((m) => !m);
      else if (k === 'l') openModal('ledger');
      else if (k === 'k') openModal('sarbat');
      else if (k === 'c') openModal('codex');
      else if (k === 'b') openModal('darbar');
      else if (k === 'h') {
        const home = Object.values(game.regions).find((r) => r.owner === game.playerFaction);
        if (home) map?.focusOn(home.id, 1.4);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const mine = armiesOf(game, game.playerFaction);
        if (!mine.length) return;
        const i = mine.findIndex((a) => a.id === st.selArmy);
        const next = mine[(i + 1) % mine.length];
        selectArmy(next.id);
        selectRegion(next.region);
        map?.focusOn(next.region, 1.5);
      } else if (k === 'w' || e.key === 'ArrowUp') map?.panBy(0, 60);
      else if (k === 's' || e.key === 'ArrowDown') map?.panBy(0, -60);
      else if (k === 'a' || e.key === 'ArrowLeft') map?.panBy(60, 0);
      else if (k === 'd' || e.key === 'ArrowRight') map?.panBy(-60, 0);
      else if (e.key === '+' || e.key === '=') map?.zoomBy(1.2);
      else if (e.key === '-') map?.zoomBy(1 / 1.2);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const battle = battleQueue.length ? game.battles.find((b) => b.id === battleQueue[0]) : undefined;
  const myArmies = armiesOf(game, game.playerFaction);
  const idle = myArmies.filter((a) => !a.path.length).length;

  return (
    <div className={`game ${settings.reducedMotion ? 'reduced-motion' : ''}`}>
      <MapView moveMode={moveMode} onMoveIssued={() => setMoveMode(false)} />
      <TopBar />
      {selArmy && game.armies[selArmy] ? <ArmyPanel id={selArmy} moveMode={moveMode} setMoveMode={setMoveMode} /> : selRegion ? <RegionPanel id={selRegion} /> : null}
      <DhadiPanel />
      <HoverCard />
      <div className="zoom-ctl">
        <button className="btn small neela" onClick={() => getMap()?.zoomBy(1.25)} aria-label="Zoom in">
          +
        </button>
        <button className="btn small neela" onClick={() => getMap()?.zoomBy(0.8)} aria-label="Zoom out">
          −
        </button>
        <button className="btn small neela" onClick={() => getMap()?.fit()} aria-label="Whole map">
          ⤢
        </button>
      </div>
      <div className="endturn">
        <span className="small" style={{ color: '#f2e6c9', textShadow: '0 1px 2px #000' }}>
          {myArmies.length} armies · {fmt(myArmies.reduce((t, a) => t + armyMen(a), 0))} men · {idle} awaiting orders
        </span>
        <button className="nagara-btn" onClick={endTurn} disabled={busy || game.phase === 'ended'} title="End turn (Enter)">
          {busy ? '…' : (
            <>
              Beat the
              <br />
              nagara
            </>
          )}
        </button>
      </div>
      {settings.tutorial && <Tutorial />}
      {battle ? (
        <BattleVignette key={battle.id} report={battle} />
      ) : (
        <>
          {modal === 'summary' && <SummaryModal />}
          {modal === 'ledger' && <LedgerModal />}
          {modal === 'settings' && <SettingsModal />}
          {modal === 'saves' && <SavesModal />}
          {modal === 'codex' && <CodexModal />}
          {modal === 'sarbat' && <SarbatModal />}
          {modal === 'vaar' && <VaarPage />}
          {modal === 'darbar' && <DarbarModal />}
          {!modal && game.pendingEvents.length > 0 && <EventModal />}
        </>
      )}
    </div>
  );
}
