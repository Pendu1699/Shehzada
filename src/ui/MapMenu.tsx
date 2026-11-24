// Quick actions on the map: right-click one of your armies or a piece of land
// and the common orders appear beside the pointer, so the side panels do not
// have to carry everything. Also the hint strip that says what each mouse
// button does at this moment.

import { useEffect, useRef } from 'react';
import { REGION_BY_ID } from '../data/regions';
import { fortCost } from '../engine/actions';
import { STANCES } from '../engine/combat';
import { rakhiChance } from '../engine/conquest';
import { langarCost } from '../engine/economy';
import { armyMen, polityName } from '../engine/query';
import type { Stance } from '../engine/state';
import { useStore } from '../store';
import { getMap } from './MapView';
import { fmt, rs } from './common';

function Item({ label, hint, onClick, disabled, on }: { label: string; hint?: string; onClick: () => void; disabled?: boolean; on?: boolean }) {
  return (
    <button className={`menu-item ${on ? 'on' : ''}`} disabled={disabled} onClick={onClick}>
      <span>{label}</span>
      {hint && <span className="menu-hint">{hint}</span>}
    </button>
  );
}

export function MapMenu() {
  const menu = useStore((s) => s.menu);
  const game = useStore((s) => s.game);
  const openMenu = useStore((s) => s.openMenu);
  const dispatch = useStore((s) => s.dispatch);
  const selectArmy = useStore((s) => s.selectArmy);
  const selectRegion = useStore((s) => s.selectRegion);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (ref.current && e.target instanceof Node && ref.current.contains(e.target)) return;
      openMenu(null);
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && openMenu(null);
    window.addEventListener('pointerdown', close, true);
    window.addEventListener('wheel', close, true);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointerdown', close, true);
      window.removeEventListener('wheel', close, true);
      window.removeEventListener('keydown', key);
    };
  }, [menu, openMenu]);

  if (!menu || !game) return null;
  const p = game.playerFaction;
  const done = (ok: boolean) => ok && openMenu(null);
  const left = Math.min(menu.x + 6, window.innerWidth - 250);
  const top = Math.min(menu.y + 6, window.innerHeight - 360);
  let body: JSX.Element | null = null;

  if (menu.kind === 'army') {
    const a = game.armies[menu.id];
    if (!a) return null;
    const leader = a.leader ? game.leaders[a.leader] : undefined;
    const others = Object.values(game.armies).filter((b) => b.owner === p && b.id !== a.id && b.region === a.region);
    body = (
      <>
        <div className="menu-title">
          {leader ? `Jatha of ${leader.name.split(' ').slice(0, 2).join(' ')}` : 'Your jatha'}
          <span className="menu-sub">
            {fmt(armyMen(a))} men · {REGION_BY_ID[a.region].name}
          </span>
        </div>
        <div className="menu-tip">To march: right-click a region, or drag the army there.</div>
        <Item label="Divide in half" hint="Ctrl + drag" disabled={armyMen(a) < 200} onClick={() => done(dispatch({ type: 'split', armyId: a.id }))} />
        <Item label="Detach a third" disabled={armyMen(a) < 300} onClick={() => done(dispatch({ type: 'split', armyId: a.id, fraction: 1 / 3 }))} />
        {others.map((b) => (
          <Item key={b.id} label={`Join with ${b.leader ? game.leaders[b.leader].name.split(' ')[0] + '’s jatha' : 'the jatha here'}`} hint={`${fmt(armyMen(b))} men`} onClick={() => done(dispatch({ type: 'merge', armyId: b.id, intoId: a.id }))} />
        ))}
        {a.path.length > 0 && <Item label="Halt — cancel the march" onClick={() => done(dispatch({ type: 'cancelMove', armyId: a.id }))} />}
        <div className="menu-sep">How to fight</div>
        <div className="menu-stances">
          {(Object.keys(STANCES) as Stance[]).map((k) => (
            <button key={k} className={`chip ${a.stance === k ? 'on' : ''}`} title={STANCES[k].detail} onClick={() => dispatch({ type: 'setStance', armyId: a.id, stance: k })}>
              {STANCES[k].name}
            </button>
          ))}
        </div>
        <div className="menu-sep" />
        <Item
          label="Centre the map here"
          onClick={() => {
            getMap()?.focusOn(a.region, 2.2);
            openMenu(null);
          }}
        />
      </>
    );
  } else {
    const r = game.regions[menu.id];
    const def = REGION_BY_ID[menu.id];
    const fs = game.factions[p];
    const mine = r.owner === p;
    const rakhi = !mine ? rakhiChance(game, p, menu.id) : 0;
    body = (
      <>
        <div className="menu-title">
          {def.name}
          <span className="menu-sub">{r.owner ? polityName(game, r.owner) : 'no one holds it'}</span>
        </div>
        {mine && (
          <>
            <Item label={r.langar ? 'Close the langar' : 'Open a langar'} hint={`${rs(langarCost(game, menu.id))}/turn`} on={r.langar} onClick={() => done(dispatch({ type: 'toggleLangar', region: menu.id }))} />
            <Item label="Strengthen the fort" hint={r.fort >= 5 ? 'at its strongest' : rs(fortCost(game, menu.id))} disabled={r.fort >= 5 || fs.treasury < fortCost(game, menu.id)} onClick={() => done(dispatch({ type: 'buildFort', region: menu.id }))} />
            <Item
              label="Raise men here…"
              hint="opens the region"
              onClick={() => {
                selectArmy(null);
                selectRegion(menu.id);
                openMenu(null);
              }}
            />
          </>
        )}
        {!mine && rakhi > 0 && <Item label="Offer rakhi" hint={`about ${Math.round(rakhi * 100)}%`} onClick={() => done(dispatch({ type: 'offerRakhi', region: menu.id }))} />}
        <Item
          label="Show details"
          onClick={() => {
            selectArmy(null);
            selectRegion(menu.id);
            openMenu(null);
          }}
        />
        <Item
          label="Centre the map here"
          onClick={() => {
            getMap()?.focusOn(menu.id, 2.2);
            openMenu(null);
          }}
        />
      </>
    );
  }
  return (
    <div ref={ref} className="map-menu folio" style={{ left, top }} role="menu" onContextMenu={(e) => e.preventDefault()}>
      <div className="folio-inner">{body}</div>
    </div>
  );
}

/** What the mouse does right now, in one line. */
export function MouseHints({ moveMode }: { moveMode: boolean }) {
  const game = useStore((s) => s.game);
  const selArmy = useStore((s) => s.selArmy);
  if (!game) return null;
  const a = selArmy ? game.armies[selArmy] : undefined;
  const mine = a && a.owner === game.playerFaction;
  const hints: [string, string][] = moveMode
    ? [
        ['Left-click', 'march there'],
        ['Esc', 'stop choosing'],
      ]
    : mine
      ? [
          ['Right-click land', 'march'],
          ['Drag army', 'march'],
          ['Ctrl + drag', 'divide & send half'],
          ['Right-click army', 'orders'],
        ]
      : [
          ['Left-click', 'select'],
          ['Right-click', 'quick actions'],
          ['Drag', 'pan'],
          ['Wheel', 'zoom'],
        ];
  return (
    <div className="mouse-hints" aria-label="Mouse controls">
      {hints.map(([k, v]) => (
        <span key={k}>
          <b>{k}</b> {v}
        </span>
      ))}
    </div>
  );
}
