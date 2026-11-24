import { useState } from 'react';
import { BannerEmblem } from '../art/Banner';
import { FACTION_BY_ID } from '../data/factions';
import { REGION_BY_ID } from '../data/regions';
import { UNIT_TYPES, canRaise } from '../data/units';
import { BUILDINGS, fortCost, type BuildingKind } from '../engine/actions';
import { rakhiChance } from '../engine/conquest';
import { langarCost, recruitCost, recruitPool, regionRevenue } from '../engine/economy';
import { armiesIn, armyMen, atWar, isSikh, polityName, relation, year } from '../engine/query';
import { useStore } from '../store';
import { Bar, BreakdownView, Folio, Tip, fmt, rs } from './common';

const DOAB_NAMES: Record<string, string> = {
  sind_sagar: 'Sind Sagar Doab',
  chaj: 'Chaj Doab',
  rachna: 'Rachna Doab',
  bari: 'Bari Doab',
  bist_jalandhar: 'Bist Jalandhar Doab',
  malwa: 'Malwa and the Cis-Sutlej',
  hills: 'The hills',
  kashmir: 'Kashmir',
  multan: 'Multan country',
  peshawar: 'Peshawar valley',
  derajat: 'The Derajat',
  doab_ganga: 'Ganga–Yamuna Doab',
};

function FaithBar({ sikh, hindu, muslim, other = 0 }: { sikh: number; hindu: number; muslim: number; other?: number }) {
  return (
    <Tip title="Faith of the people" content={<span>Sikh {sikh}% · Hindu {hindu}% · Muslim {muslim}%{other ? ` · Buddhist, Jain and others ${other}%` : ''}. Just and tolerant rule of all of them raises stability and Piri.</span>}>
      <div style={{ display: 'flex', height: 8, width: 160, border: '1px solid var(--gold-dark)' }}>
        <div style={{ width: `${sikh}%`, background: '#E8870E' }} />
        <div style={{ width: `${hindu}%`, background: '#C9A13B' }} />
        <div style={{ width: `${muslim}%`, background: '#5E6B2E' }} />
        {other > 0 && <div style={{ width: `${other}%`, background: '#7A6A9A' }} />}
      </div>
    </Tip>
  );
}

function Recruit({ region }: { region: string }) {
  const game = useStore((s) => s.game)!;
  const dispatch = useStore((s) => s.dispatch);
  const p = game.playerFaction;
  const fs = game.factions[p];
  const types = Object.values(UNIT_TYPES).filter((u) => canRaise(u, p, isSikh(p), fs.sarkar, year(game), fs.flags));
  const [unit, setUnit] = useState(types[0]?.id ?? 'ghorchare');
  const pool = recruitPool(game, region, p);
  const used = Number(fs.flags[`recruited_${region}_${game.turn}`] ?? 0);
  const avail = Math.max(0, pool.total - used);
  const [men, setMen] = useState(500);
  const n = Math.min(men, Math.floor(avail / 100) * 100);
  const cost = recruitCost(game, p, unit, n);
  const u = UNIT_TYPES[unit];
  return (
    <div className="section">
      <div className="section-title">Raise men</div>
      <div className="row">
        <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Troop type">
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <Tip title="Who will answer the call" content={<BreakdownView b={pool} digits={0} />}>
          <span className="small muted" tabIndex={0}>
            {fmt(avail)} available
          </span>
        </Tip>
      </div>
      {u && <div className="small muted" style={{ margin: '3px 0' }}>{u.gloss} Atk {u.attack} · Def {u.defense} · Morale {u.morale} · Pace {u.speed}</div>}
      <div className="row">
        <input type="range" min={100} max={Math.max(100, Math.floor(avail / 100) * 100)} step={100} value={Math.min(men, Math.max(100, avail))} onChange={(e) => setMen(Number(e.target.value))} style={{ flex: 1 }} aria-label="Men to raise" />
        <span style={{ minWidth: 48, textAlign: 'right' }}>{fmt(n)}</span>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="small">
          Cost {rs(cost)} · upkeep {fmt(((u?.upkeep ?? 1) * n) / 100, 1)}k/turn
        </span>
        <button data-tut="recruit" className="btn small kesri" disabled={n < 100 || cost > fs.treasury} onClick={() => dispatch({ type: 'recruit', region, unit, men: n })}>
          Raise
        </button>
      </div>
    </div>
  );
}

export function RegionPanel({ id }: { id: string }) {
  const game = useStore((s) => s.game)!;
  const dispatch = useStore((s) => s.dispatch);
  const selectArmy = useStore((s) => s.selectArmy);
  const def = REGION_BY_ID[id];
  const st = game.regions[id];
  const p = game.playerFaction;
  const fs = game.factions[p];
  const seen = (game.explored[id] ?? 0) > 0;
  const mine = st.owner === p;
  const rev = regionRevenue(game, id);
  const armies = armiesIn(game, id).filter((a) => a.owner === p || seen);
  const idleLeaders = Object.values(game.leaders).filter((l) => l.alive && l.active && l.faction === p && !l.jagir);
  const [jagirLeader, setJagirLeader] = useState('');
  const rakhiP = rakhiChance(game, p, id);
  return (
    <Folio className="side-panel">
      <div className="heading-band">
        {st.owner && seen && <BannerEmblem faction={st.owner} size={34} />}
        <div>
          <h2 style={{ margin: 0 }}>{def.name}</h2>
          <div className="small muted">
            {DOAB_NAMES[def.doab]} · {def.terrain === 'bela' ? 'riverine bela' : def.terrain === 'bar' ? 'the bar (dry upland)' : def.terrain}
          </div>
        </div>
      </div>
      {!seen ? (
        <p className="muted">Your riders have not yet seen this country. Only a pencil sketch of it is known.</p>
      ) : (
        <>
          <dl className="kv">
            <dt>Held by</dt>
            <dd>
              {polityName(game, st.owner)}
              {st.owner && st.owner !== p && <span className="small muted"> · {relation(game, p, st.owner)}</span>}
            </dd>
            {st.rakhi && (
              <>
                <dt>Rakhi to</dt>
                <dd>{polityName(game, st.rakhi)}</dd>
              </>
            )}
            <dt>People</dt>
            <dd>
              {fmt(def.population)}k <FaithBar {...def.faith} />
            </dd>
            <dt>Fort</dt>
            <dd>{st.fort ? `Level ${st.fort}` : 'Unwalled'}</dd>
            <dt>Control</dt>
            <dd>
              <Bar value={st.control} />
            </dd>
            <dt>Stability</dt>
            <dd>
              <Bar value={st.stability} color="#c9a13b" />
            </dd>
            {st.devastation > 0.05 && (
              <>
                <dt>Devastation</dt>
                <dd>
                  <Bar value={st.devastation * 100} color="#b83a2b" />
                </dd>
              </>
            )}
            {def.resources.length > 0 && (
              <>
                <dt>Resources</dt>
                <dd className="small">{def.resources.join(', ')}</dd>
              </>
            )}
            {st.owner && (
              <>
                <dt>Revenue</dt>
                <dd>
                  <Tip title="Revenue this half-year" content={<BreakdownView b={rev} unit="k" />}>
                    <span tabIndex={0}>{rs(rev.total)}</span>
                  </Tip>
                </dd>
              </>
            )}
            {st.jagir && (
              <>
                <dt>Jagir of</dt>
                <dd>{game.leaders[st.jagir]?.name}</dd>
              </>
            )}
          </dl>
          {st.siege && (
            <p className="small" style={{ color: 'var(--sindoor)' }}>
              Besieged by {polityName(game, st.siege.by)}: {Math.round(st.siege.progress)}% toward its fall.
            </p>
          )}
          {def.sites.length > 0 && (
            <div className="section">
              <div className="section-title">Places</div>
              {def.sites.map((x) => (
                <div key={x.id} className="small" style={{ marginBottom: 3 }}>
                  <b style={{ color: st.desecrated.includes(x.id) ? '#6f6a62' : undefined }}>{x.name}</b>
                  {st.desecrated.includes(x.id) && <span style={{ color: 'var(--sindoor)' }}> — desecrated</span>}
                  <span className="muted"> {x.note}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {armies.length > 0 && (
        <div className="section">
          <div className="section-title">Armies here</div>
          {armies.map((a) => (
            <div key={a.id} className="unit-row" style={{ cursor: 'pointer' }} onClick={() => selectArmy(a.id)}>
              <span>
                <span style={{ display: 'inline-block', width: 9, height: 9, background: FACTION_BY_ID[a.owner]?.color, marginRight: 5, border: '1px solid #0004' }} />
                {a.name ?? (a.leader ? game.leaders[a.leader]?.name : polityName(game, a.owner))}
              </span>
              <span>{fmt(armyMen(a))}</span>
            </div>
          ))}
        </div>
      )}
      {mine && (
        <>
          <div className="section">
            <div className="section-title">Governance</div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <Tip title="Langar" content={<span>Keep the community kitchen open to all. Costs {rs(langarCost(game, id))} a turn (twice that in famine). Raises Piri, stability and recruitment.</span>}>
                <label className="row" style={{ cursor: 'pointer' }}>
                  <input data-tut="langar" type="checkbox" checked={st.langar} onChange={() => dispatch({ type: 'toggleLangar', region: id })} /> Langar ({rs(langarCost(game, id))}/turn)
                </label>
              </Tip>
              <button className="btn small" disabled={st.fort >= 5 || fs.treasury < fortCost(game, id)} onClick={() => dispatch({ type: 'buildFort', region: id })}>
                Strengthen fort ({rs(fortCost(game, id))})
              </button>
            </div>
            <div className="row" style={{ marginTop: 6 }}>
              {(Object.keys(BUILDINGS) as BuildingKind[]).map((k) => (
                <Tip key={k} title={BUILDINGS[k].name} content={<span>{BUILDINGS[k].detail} Cost {rs(BUILDINGS[k].cost)}.</span>}>
                  <button className={`chip ${st.buildings.includes(k) ? 'on' : ''}`} disabled={st.buildings.includes(k)} onClick={() => dispatch({ type: 'build', region: id, kind: k })}>
                    {BUILDINGS[k].name}
                  </button>
                </Tip>
              ))}
            </div>
            <div className="row" style={{ marginTop: 6 }}>
              {st.jagir ? (
                <Tip title="Revoke jagir" content={<span>Takes the land back. The sardar’s loyalty falls sharply.</span>}>
                  <button className="btn small ghost" onClick={() => dispatch({ type: 'revokeJagir', region: id })}>
                    Revoke jagir
                  </button>
                </Tip>
              ) : (
                <>
                  <select value={jagirLeader} onChange={(e) => setJagirLeader(e.target.value)} aria-label="Sardar for jagir">
                    <option value="">Grant as jagir to…</option>
                    {idleLeaders.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} (loyalty {Math.round(l.loyalty)})
                      </option>
                    ))}
                  </select>
                  <Tip title="Jagir" content={<span>Half this region’s revenue goes to the sardar, whose loyalty rises by 15 and keeps rising while the grant lasts.</span>}>
                    <button className="btn small" disabled={!jagirLeader} onClick={() => dispatch({ type: 'grantJagir', region: id, leaderId: jagirLeader })}>
                      Grant
                    </button>
                  </Tip>
                </>
              )}
            </div>
          </div>
          {st.control >= 40 ? <Recruit region={id} /> : <p className="small muted">Your hold here is too weak to raise men (control below 40).</p>}
        </>
      )}
      {!mine && seen && (
        <div className="section">
          <div className="section-title">Dealings</div>
          <div className="row">
            {rakhiP > 0 && (
              <Tip title="Offer rakhi" content={<span>Offer your protection for a fifth of the produce. Chance about {Math.round(rakhiP * 100)}%. If the villages are raided and you do not ride to their aid, you lose Piri and the rakhi.</span>}>
                <button data-tut="rakhi" className="btn small kesri" onClick={() => dispatch({ type: 'offerRakhi', region: id })}>
                  Offer rakhi
                </button>
              </Tip>
            )}
            {st.owner && st.owner !== p && !atWar(game, p, st.owner) && (
              <Tip title="Declare war" content={<span>{FACTION_BY_ID[st.owner]?.sikh ? 'War on fellow Sikhs costs Piri, and more if a gurmata forbids it.' : 'Your armies may then enter their lands.'}</span>}>
                <button className="btn small ghost" onClick={() => confirm(`Declare war on ${polityName(game, st.owner)}?`) && dispatch({ type: 'declareWar', target: st.owner! })}>
                  Declare war
                </button>
              </Tip>
            )}
            {st.owner && atWar(game, p, st.owner) && (
              <button className="btn small ghost" onClick={() => dispatch({ type: 'proposePeace', target: st.owner! })}>
                Send envoys for peace
              </button>
            )}
          </div>
        </div>
      )}
    </Folio>
  );
}
