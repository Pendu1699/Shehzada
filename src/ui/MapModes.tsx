// The map-view switcher and its legend.

import { TERRAIN_WASH } from '../art/palette';
import { ALLIANCE_KEY, FAITH_KEY, MAP_MODES, WEALTH_STOPS_KEY, type MapMode } from '../map/mapModes';
import { useStore } from '../store';
import { Tip } from './common';

const SWATCHES: Partial<Record<MapMode, [string, string][]>> = {
  alliances: [
    ['You', ALLIANCE_KEY.you],
    ['Union', ALLIANCE_KEY.union],
    ['Allies', ALLIANCE_KEY.ally],
    ['Puppets', ALLIANCE_KEY.puppet],
    ['At war', ALLIANCE_KEY.war],
    ['Others', ALLIANCE_KEY.other],
  ],
  faith: [
    ['Sikh', FAITH_KEY.sikh],
    ['Hindu', FAITH_KEY.hindu],
    ['Muslim', FAITH_KEY.muslim],
    ['Buddhist & other', FAITH_KEY.other],
  ],
  terrain: Object.entries(TERRAIN_WASH).map(([k, v]) => [k, v] as [string, string]),
};

export function MapModes() {
  const mode = useStore((s) => s.settings.mapMode ?? 'painted');
  const update = useStore((s) => s.updateSettings);
  const sw = SWATCHES[mode];
  const struggle = useStore((s) => !!s.game?.struggle);
  return (
    <div className="map-modes">
      {mode !== 'painted' && (
        <div className="map-legend">
          {mode === 'support' ? (
            <div className="legend-ramp">
              <span>none</span>
              <span className="ramp" style={{ background: 'linear-gradient(90deg, #EFE6D0, #C8500E)' }} />
              <span>fervent</span>
            </div>
          ) : mode === 'wealth' ? (
            <div className="legend-ramp">
              <span>poor</span>
              <span className="ramp" style={{ background: `linear-gradient(90deg, ${WEALTH_STOPS_KEY.join(',')})` }} />
              <span>rich</span>
            </div>
          ) : mode === 'countries' ? (
            <span className="small">Each land in its owner’s colour. Your lands are edged in gold.</span>
          ) : (
            sw?.map(([label, c]) => (
              <span key={label} className="legend-item">
                <i style={{ background: c }} />
                {label}
              </span>
            ))
          )}
        </div>
      )}
      <div className="map-mode-buttons" role="group" aria-label="Map view">
        {MAP_MODES.filter((m) => m.id !== 'support' || struggle).map((m) => (
          <Tip key={m.id} title={`${m.name} view`} content={<span>{m.detail}</span>}>
            <button className={`chip ${mode === m.id ? 'on' : ''}`} onClick={() => update({ mapMode: m.id })}>
              {m.name}
            </button>
          </Tip>
        ))}
      </div>
    </div>
  );
}
