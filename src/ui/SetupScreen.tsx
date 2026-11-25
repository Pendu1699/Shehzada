import { useMemo, useState } from 'react';
import { Banner, EmpireFlag } from '../art/Banner';
import { Portrait } from '../art/Portrait';
import { TERRAIN_WASH } from '../art/palette';
import { FACTION_BY_ID } from '../data/factions';
import { LEADER_BY_ID } from '../data/leaders';
import { PUNJAB_REGION_IDS, REGIONS } from '../data/regions';
import { SCENARIOS } from '../data/scenarios';
import { GEO } from '../engine/map';
import { useStore } from '../store';
import { audio } from '../audio/engine';

function chiefOf(scenario: (typeof SCENARIOS)[number], faction: string) {
  const a = scenario.armies.find((x) => x.owner === faction && x.leader);
  return a?.leader ? LEADER_BY_ID[a.leader] : undefined;
}

/** A miniature of the map with the faction's starting lands gilded. */
function StartMap({ scenario, faction }: { scenario: (typeof SCENARIOS)[number]; faction: string }) {
  const color = FACTION_BY_ID[faction]?.color ?? '#999';
  // Frame the Punjab, where every misl's story begins.
  const xs: number[] = [],
    ys: number[] = [];
  for (const id of PUNJAB_REGION_IDS) GEO.regions[id].poly.forEach((v, i) => (i % 2 ? ys : xs).push(v));
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return (
    <svg viewBox={`${x0 - 20} ${y0 - 20} ${x1 - x0 + 40} ${y1 - y0 + 40}`} style={{ width: '100%', height: 'auto', background: '#e9dab4', border: '1px solid var(--gold)' }} aria-label="starting position">
      {REGIONS.map((r) => {
        const owner = scenario.owners[r.id];
        const mine = owner === faction;
        const pts = GEO.regions[r.id].poly;
        const d = 'M' + pts.reduce((acc: string[], v, i) => (i % 2 ? acc : [...acc, `${v},${pts[i + 1]}`]), []).join('L') + 'Z';
        return <path key={r.id} d={d} fill={mine ? color : owner ? FACTION_BY_ID[owner]?.color ?? '#999' : TERRAIN_WASH[r.terrain]} fillOpacity={mine ? 0.85 : 0.25} stroke={mine ? '#C9A13B' : '#6b6257'} strokeWidth={mine ? 5 : 1} />;
      })}
      {GEO.rivers.map((rv) => (
        <polyline key={rv.id} points={rv.points.join(' ')} fill="none" stroke="#5E8C93" strokeWidth={5} opacity={0.8} />
      ))}
    </svg>
  );
}

export function SetupScreen() {
  const start = useStore((s) => s.start);
  const setScreen = useStore((s) => s.setScreen);
  const [scId, setScId] = useState('s1748');
  const scenario = SCENARIOS.find((s) => s.id === scId)!;
  const [faction, setFaction] = useState(scenario.recommended);
  const [difficulty, setDifficulty] = useState<'gentle' | 'standard' | 'hard'>('standard');
  const [seed, setSeed] = useState('');
  const playable = useMemo(() => scenario.playable, [scenario]);
  const f = FACTION_BY_ID[faction];
  const chief = chiefOf(scenario, faction);
  const pick = (id: string) => {
    audio.quill();
    setFaction(id);
  };
  return (
    <div className="setup">
      <div className="setup-header">
        <h1>Choose your century</h1>
        <div className="muted" style={{ color: '#e4d2a8' }}>
          Four starting points. Play each alone, or carry one into the next.
        </div>
      </div>
      <div className="scenario-row">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            className={`scenario-card ${s.id === scId ? 'selected' : ''}`}
            onClick={() => {
              audio.rustle();
              setScId(s.id);
              if (!s.playable.includes(faction)) setFaction(s.recommended);
            }}
          >
            <div className="inner">
              <div className="year">{s.year}</div>
              <div className="name">{s.title}</div>
              <div className="small muted">{s.festival === 'vaisakhi' ? 'Vaisakhi' : 'Diwali'} {s.year}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="misl-grid">
        {playable.map((id) => {
          const d = FACTION_BY_ID[id];
          const c = chiefOf(scenario, id);
          const empire = scenario.sarkar === id;
          return (
            <button key={id} className={`misl-card ${id === faction ? 'selected' : ''}`} onClick={() => pick(id)} aria-pressed={id === faction}>
              {id === scenario.recommended && <span className="rec">Historic path</span>}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 2, height: 92 }}>
                {empire ? <EmpireFlag faction={id} height={74} wave /> : <Banner faction={id} height={80} />}
                {c && <Portrait id={c.id} faction={id} female={c.female} age={scenario.year - c.born} size={62} royal={c.id === 'ranjit_singh' && scenario.year >= 1801} />}
              </div>
              <div className="misl-name">{empire ? 'Sikh Empire' : d.name}</div>
              <div className="epithet">{empire ? `The Sarkar-i-Khalsa · house of the ${d.name}` : d.epithet}</div>
              {c && <div className="small" style={{ marginTop: 3 }}>{c.name}</div>}
            </button>
          );
        })}
      </div>
      <div className="setup-detail">
        <div className="folio">
          <div className="folio-inner">
            <h2>{scenario.title}</h2>
            <p style={{ fontSize: '1.05em', lineHeight: 1.45 }}>{scenario.blurb}</p>
            <div className="rule" />
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {chief && <Portrait id={chief.id} faction={faction} female={chief.female} age={scenario.year - chief.born} size={96} />}
              <div style={{ flex: 1, minWidth: 220 }}>
                <h3>{scenario.sarkar === faction ? 'The Sikh Empire' : `${f.name} ${f.kind === 'misl' ? 'misl' : ''}`}</h3>
                <p className="small" style={{ marginTop: 0 }}>
                  {f.description}
                </p>
                {f.bonuses.map((b) => (
                  <div key={b.label} className="small">
                    <b>{b.label}.</b> {b.detail}
                  </div>
                ))}
                {chief && (
                  <p className="small muted">
                    <b>{chief.name}</b> — {chief.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="folio">
          <div className="folio-inner">
            <h3>Starting lands</h3>
            <StartMap scenario={scenario} faction={faction} />
            <div className="section">
              <div className="section-title">Difficulty</div>
              <div className="row">
                {(['gentle', 'standard', 'hard'] as const).map((d) => (
                  <button key={d} className={`chip ${difficulty === d ? 'on' : ''}`} onClick={() => setDifficulty(d)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="section">
              <div className="section-title">Seed (optional)</div>
              <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="random" style={{ width: '100%', fontFamily: 'inherit', padding: 4, border: '1px solid var(--gold-dark)', background: '#fffaf0' }} />
              <div className="small muted">The same seed and the same choices always tell the same story.</div>
            </div>
            <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
              <button className="btn ghost" onClick={() => setScreen('title')}>
                Back
              </button>
              <button
                className="btn kesri"
                onClick={() => {
                  audio.start();
                  audio.nagara(4);
                  start({ scenarioId: scId, playerFaction: faction, difficulty, seed: seed.trim() || Math.floor(Math.random() * 2 ** 31) });
                }}
              >
                Ride out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
