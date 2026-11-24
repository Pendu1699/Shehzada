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
        const a = st.selArmy ? st.game?.armies[st.selArmy] : undefined;
        if (a && a.owner === st.game?.playerFaction && (e.right || e.shift || moveRef.current)) {
          if (st.dispatch({ type: 'move', armyId: a.id, to: id })) {
            audio.quill();
            onMoveRef.current();
          }
          return;
        }
        audio.rustle();
        st.selectRegion(id);
        // Selecting a region with your own army selects that army.
        const mine = Object.values(st.game?.armies ?? {}).find((x) => x.region === id && x.owner === st.game?.playerFaction);
        st.selectArmy(mine ? mine.id : null);
      },
      onArmyClick: (id) => {
        const st = useStore.getState();
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
