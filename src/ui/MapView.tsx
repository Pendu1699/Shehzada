import { useEffect, useRef } from 'react';
import { PaintedMap } from '../map/renderer';
import { useStore } from '../store';
import { audio } from '../audio/engine';

let mapInstance: PaintedMap | null = null;
export const getMap = () => mapInstance;

export function MapView({ moveMode, onMoveIssued }: { moveMode: boolean; onMoveIssued: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const game = useStore((s) => s.game);
  const selRegion = useStore((s) => s.selRegion);
  const selArmy = useStore((s) => s.selArmy);
  const hover = useStore((s) => s.hover);
  const settings = useStore((s) => s.settings);
  const moveRef = useRef(moveMode);
  moveRef.current = moveMode;
  const onMoveRef = useRef(onMoveIssued);
  onMoveRef.current = onMoveIssued;

  useEffect(() => {
    if (!host.current) return;
    const map = new PaintedMap(host.current, {
      onRegionClick: (id, e) => {
        const st = useStore.getState();
        st.openMenu(null);
        const a = st.selArmy ? st.game?.armies[st.selArmy] : undefined;
        const mine = a && a.owner === st.game?.playerFaction;
        // Right-click (or Move mode) with your army selected: march there.
        if (mine && (e.right || e.shift || moveRef.current)) {
          if (st.dispatch({ type: 'move', armyId: a.id, to: id })) {
            audio.quill();
            onMoveRef.current();
          }
          return;
        }
        // Right-click with nothing of yours selected: quick actions for that land.
        if (e.right) {
          st.selectRegion(id);
          st.openMenu({ kind: 'region', id, x: e.x, y: e.y });
          return;
        }
        // Left-click on land selects the land, nothing else.
        audio.rustle();
        st.selectArmy(null);
        st.selectRegion(id);
      },
      onArmyClick: (id) => {
        const st = useStore.getState();
        st.openMenu(null);
        const a = st.game?.armies[id];
        if (!a) return;
        const sel = st.selArmy ? st.game?.armies[st.selArmy] : undefined;
        if (sel && sel.owner === st.game?.playerFaction && a.owner !== sel.owner && moveRef.current) {
          st.dispatch({ type: 'move', armyId: sel.id, to: a.region });
          onMoveRef.current();
          return;
        }
        audio.quill();
        st.selectArmy(id);
        st.selectRegion(a.region);
      },
      onArmyContext: (id, x, y) => {
        const st = useStore.getState();
        const a = st.game?.armies[id];
        if (!a) return;
        const sel = st.selArmy ? st.game?.armies[st.selArmy] : undefined;
        const player = st.game?.playerFaction;
        // Your army selected, right-click someone else's army: march on it.
        if (sel && sel.owner === player && sel.id !== id && a.owner !== player) {
          st.openMenu(null);
          if (st.dispatch({ type: 'move', armyId: sel.id, to: a.region })) {
            audio.quill();
            onMoveRef.current();
          }
          return;
        }
        // Your own army: open its orders.
        if (a.owner === player) {
          st.selectArmy(id);
          st.selectRegion(a.region);
          st.openMenu({ kind: 'army', id, x, y });
          return;
        }
        st.openMenu(null);
        st.selectArmy(id);
        st.selectRegion(a.region);
      },
      onArmyDragStart: (id) => {
        const st = useStore.getState();
        const a = st.game?.armies[id];
        if (!a || a.owner !== st.game?.playerFaction) return false;
        st.openMenu(null);
        st.selectArmy(id);
        st.selectRegion(a.region);
        return true;
      },
      onArmyDrop: (id, region, split) => {
        const st = useStore.getState();
        st.setHover(null);
        const a = st.game?.armies[id];
        if (!a || !region || region === a.region) return;
        let mover = id;
        if (split) {
          const before = new Set(Object.keys(st.game!.armies));
          if (!st.dispatch({ type: 'split', armyId: id })) return;
          const fresh = Object.keys(useStore.getState().game!.armies).find((k) => !before.has(k));
          if (!fresh) return;
          mover = fresh;
        }
        if (st.dispatch({ type: 'move', armyId: mover, to: region })) {
          audio.quill();
          st.selectArmy(mover);
          onMoveRef.current();
        }
      },
      onHover: (id) => useStore.getState().setHover(id),
    });
    mapInstance = map;
    (window as unknown as { __map: PaintedMap }).__map = map;
    let alive = true;
    void (async () => {
      await document.fonts.ready;
      await map.init();
      if (!alive) return;
      const s = useStore.getState();
      if (s.game) {
        map.update(s.game, { selectedRegion: s.selRegion, selectedArmy: s.selArmy, colorBlind: s.settings.colorBlind, reducedMotion: s.settings.reducedMotion });
        const army = Object.values(s.game.armies).find((a) => a.owner === s.game!.playerFaction);
        const home = army?.region ?? Object.values(s.game.regions).find((r) => r.owner === s.game!.playerFaction)?.id;
        if (home) map.focusOn(home, 2.2);
      }
    })();
    return () => {
      alive = false;
      map.destroy();
      mapInstance = null;
    };
  }, []);

  useEffect(() => {
    if (!game || !mapInstance) return;
    const preview = useStore.getState().preview();
    mapInstance.update(game, {
      selectedRegion: selRegion,
      selectedArmy: selArmy,
      preview,
      colorBlind: settings.colorBlind,
      reducedMotion: settings.reducedMotion,
      mourning: game.josh.active && game.josh.turnsLeft >= 3,
    });
  }, [game, selRegion, selArmy, settings.colorBlind, settings.reducedMotion]);

  useEffect(() => {
    if (!mapInstance) return;
    mapInstance.setPreview(useStore.getState().preview());
  }, [hover, selArmy, game]);

  return <div className="map-host" ref={host} />;
}
