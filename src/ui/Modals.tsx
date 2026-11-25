import { useMemo, useRef, useState } from 'react';
import { BannerEmblem } from '../art/Banner';
import { Portrait } from '../art/Portrait';
import { MiniaturePainting } from '../art/Miniature';
import { FACTION_BY_ID } from '../data/factions';
import { GLOSSARY } from '../data/glossary';
import { LEADER_BY_ID, TRAITS } from '../data/leaders';
import { REGIONS, REGION_BY_ID } from '../data/regions';
import { factionIncome, regionRevenue, langarCost } from '../engine/economy';
import { DIPLO_INFO, diploChance, type DiploKind } from '../engine/diplomacy';
import { armiesOf, armyMen, date, isSikh, polityName, regionsOf, relation, year } from '../engine/query';
import { deleteSlot, listSlots, loadFromSlot, saveToSlot, serialize } from '../engine/save';
import { useStore } from '../store';
import { Heading, Modal, Tip, fmt, rs, signed } from './common';

export function SummaryModal() {
  const game = useStore((s) => s.game)!;
  const close = useStore((s) => s.closeModal);
  const s = game.summary;
  const [eraSeen, setEraSeen] = useState(false);
  if (!s) return null;
  const income = s.income.filter((p) => Math.abs(p.value) >= 0.05);
  return (
    <Modal>
      {s.era && !eraSeen && (
        <div className="era-page">
          <div className="era-art">
            <MiniaturePainting />
          </div>
          <div className="era-kicker">A new age begins</div>
          <h2 className="era-title">{s.era.title}</h2>
          <div className="era-years">{s.era.years}</div>
          <div className="rule" />
          {s.era.lines.map((l, i) => (
            <p key={i} className="era-line">
              {l}
            </p>
          ))}
          {s.era.ahead && <p className="era-ahead">{s.era.ahead} But this is your century, and the Punjab may yet take another road.</p>}
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <button className="btn kesri" autoFocus onClick={() => setEraSeen(true)}>
              Hear the season’s account
            </button>
          </div>
        </div>
      )}
      {(!s.era || eraSeen) && (
      <>
      <Heading en="The Dhadi sings" pa="ਢਾਡੀ ਵਾਰ" right={<span className="small muted">{date(game).label}</span>} />
      <div className="dhadi-text">
        {s.dhadi.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      {s.notes.length > 0 && (
        <>
          <div className="rule" />
          <h3>Reports from the field</h3>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {s.notes.map((n, i) => (
              <li key={i} style={{ marginBottom: 3 }}>
                {n}
              </li>
            ))}
          </ul>
        </>
      )}
      {(income.length > 0 || s.piri.length > 0) && (
        <>
          <div className="rule" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {income.length > 0 && (
              <div>
                <h3>The harvest account</h3>
                {income.map((p, i) => (
                  <div key={i} className="tip-row small">
                    <span>{p.label}</span>
                    <span className={p.value < 0 ? 'neg' : 'pos'}>{signed(p.value)}k</span>
                  </div>
                ))}
                <div className="tip-row small" style={{ borderTop: '1px solid var(--gold)', fontWeight: 700 }}>
                  <span>Net</span>
                  <span>{signed(income.reduce((t, p) => t + p.value, 0))}k</span>
                </div>
              </div>
            )}
            {s.piri.length > 0 && (
              <div>
                <h3>Piri</h3>
                {s.piri.map((p, i) => (
                  <div key={i} className="tip-row small">
                    <span>{p.reason}</span>
                    <span className={p.delta < 0 ? 'neg' : 'pos'}>{signed(p.delta)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn kesri" onClick={close} autoFocus>
          To the orders
        </button>
      </div>
      </>
      )}
    </Modal>
  );
}

export function LedgerModal() {
  const game = useStore((s) => s.game)!;
  const tab = useStore((s) => s.ledgerTab);
  const close = useStore((s) => s.closeModal);
  const dispatch = useStore((s) => s.dispatch);
  const openModal = useStore((s) => s.openModal);
  const selectArmy = useStore((s) => s.selectArmy);
  const selectRegion = useStore((s) => s.selectRegion);
  const p = game.playerFaction;
  const inc = factionIncome(game, p);
  const tabs: [string, string][] = [
    ['treasury', 'Treasury'],
    ['lands', 'Lands'],
    ['armies', 'Armies'],
    ['leaders', 'Sardars'],
    ['diplomacy', 'Diplomacy'],
    ['chronicle', 'Chronicle'],
  ];
  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="bahi" role="dialog" aria-label="Bahi-khata ledger">
        <button className="btn small neela modal-close" onClick={close} aria-label="Close" style={{ position: 'absolute', top: 6, right: 6 }}>
          ✕
        </button>
        <div className="tabs">
          {tabs.map(([id, name]) => (
            <button key={id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => openModal('ledger', id)}>
              {name}
            </button>
          ))}
        </div>
        <div className="pages">
          {tab === 'treasury' && (
            <>
              <Heading en="Bahi-khata" pa="ਵਹੀ-ਖਾਤਾ" right={<b>Treasury {rs(game.factions[p].treasury)}</b>} />
              <p className="small muted">The account for the coming half-year, in thousands of rupees.</p>
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Head of account</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {inc.parts.map((x, i) => (
                    <tr key={i}>
                      <td>{x.label}</td>
                      <td className={`num ${x.value < 0 ? 'neg' : 'pos'}`}>{signed(x.value)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <b>Net</b>
                    </td>
                    <td className="num">
                      <b>{signed(inc.total)}</b>
                    </td>
                  </tr>
                </tbody>
              </table>
              {game.josh.rebuild && (
                <div className="section">
                  <div className="section-title">Rebuilding the Harmandir</div>
                  <p className="small">
                    {fmt(game.josh.rebuild.progress)} of {fmt(game.josh.rebuild.needed)} thousand rupees gathered from the misls.
                  </p>
                  <div className="row">
                    {[10, 25, 50].map((amt) => (
                      <button key={amt} className="btn small kesri" disabled={game.factions[p].treasury < amt} onClick={() => dispatch({ type: 'contributeRebuild', amount: amt })}>
                        Give {rs(amt)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {tab === 'lands' && (
            <>
              <Heading en="Lands" pa="ਜ਼ਮੀਨ" />
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Control</th>
                    <th>Stability</th>
                    <th>Fort</th>
                    <th>Langar</th>
                    <th style={{ textAlign: 'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {regionsOf(game, p).map((r) => {
                    const st = game.regions[r];
                    return (
                      <tr key={r}>
                        <td>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              selectRegion(r);
                              close();
                            }}
                          >
                            {REGION_BY_ID[r].name}
                          </a>
                          {st.jagir && <span className="small muted"> (jagir)</span>}
                        </td>
                        <td>{Math.round(st.control)}</td>
                        <td>{Math.round(st.stability)}</td>
                        <td>{st.fort}</td>
                        <td>
                          <label className="small">
                            <input type="checkbox" checked={st.langar} onChange={() => dispatch({ type: 'toggleLangar', region: r })} /> {rs(langarCost(game, r))}
                          </label>
                        </td>
                        <td className="num">{fmt(regionRevenue(game, r).total, 1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {Object.values(game.regions).some((r) => r.rakhi === p && r.owner !== p) && (
                <p className="small">
                  Rakhi villages:{' '}
                  {Object.values(game.regions)
                    .filter((r) => r.rakhi === p && r.owner !== p)
                    .map((r) => REGION_BY_ID[r.id].name)
                    .join(', ')}
                </p>
              )}
            </>
          )}
          {tab === 'armies' && (
            <>
              <Heading en="Armies" pa="ਫ਼ੌਜ" />
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Army</th>
                    <th>Where</th>
                    <th>Commander</th>
                    <th>Morale</th>
                    <th style={{ textAlign: 'right' }}>Men</th>
                  </tr>
                </thead>
                <tbody>
                  {armiesOf(game, p).map((a) => (
                    <tr key={a.id}>
                      <td>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            selectArmy(a.id);
                            selectRegion(a.region);
                            close();
                          }}
                        >
                          {a.name ?? `Army ${a.id}`}
                        </a>
                      </td>
                      <td>
                        {REGION_BY_ID[a.region].name}
                        {a.path.length ? ` → ${REGION_BY_ID[a.path[a.path.length - 1]].name}` : ''}
                      </td>
                      <td>{a.leader ? game.leaders[a.leader]?.name : '—'}</td>
                      <td>{Math.round(a.morale)}</td>
                      <td className="num">{fmt(armyMen(a))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {tab === 'leaders' && (
            <>
              <Heading en="Sardars" pa="ਸਰਦਾਰ" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {Object.values(game.leaders)
                  .filter((l) => l.alive && l.active && l.faction === p)
                  .map((l) => (
                    <div key={l.id} style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(184,58,43,0.25)', paddingBottom: 6 }}>
                      <Portrait id={l.id} faction={l.faction} female={l.female} age={year(game) - l.born} size={54} royal={game.factions[p].chief === l.id && game.factions[p].sarkar} />
                      <div className="small">
                        <b>{l.name}</b> {game.factions[p].chief === l.id && <span className="chip on">Chief</span>}
                        <div>
                          Age {year(game) - l.born} · M{l.martial} A{l.admin} D{l.diplomacy} · Loyalty {Math.round(l.loyalty)}
                        </div>
                        <div>
                          {l.traits.map((t) => (
                            <span key={t} title={TRAITS[t].detail}>
                              {TRAITS[t].name}
                              {' · '}
                            </span>
                          ))}
                        </div>
                        <div className="muted">
                          {l.armyId ? 'In the field' : 'At court'}
                          {l.jagir ? ` · jagir of ${REGION_BY_ID[l.jagir].name}` : ''}
                        </div>
                        {LEADER_BY_ID[l.id] && <div className="muted" style={{ fontStyle: 'italic' }}>{LEADER_BY_ID[l.id].note}</div>}
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
          {tab === 'diplomacy' && (
            <>
              <Heading en="Diplomacy" pa="ਰਾਜਨੀਤੀ" />
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Power</th>
                    <th>Relation</th>
                    <th>Attitude</th>
                    <th>Lands</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {Object.values(game.factions)
                    .filter((f) => f.alive && f.id !== p)
                    .sort((a, b) => regionsOf(game, b.id).length - regionsOf(game, a.id).length)
                    .map((f) => {
                      const rel = relation(game, p, f.id);
                      return (
                        <tr key={f.id}>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <BannerEmblem faction={f.id} size={22} /> {polityName(game, f.id)}
                            </span>
                          </td>
                          <td style={{ color: rel === 'war' ? 'var(--sindoor)' : rel === 'alliance' ? 'var(--mehndi)' : undefined, fontWeight: 600 }}>{rel}</td>
                          <td>{Math.round(f.attitude[p] ?? 0)}</td>
                          <td>{regionsOf(game, f.id).length}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {(['alliance', 'marriage', 'tribute', 'passage', 'break_alliance'] as DiploKind[])
                              .filter((k) => diploChance(game, k, f.id) > 0)
                              .map((k) => (
                                <Tip key={k} title={DIPLO_INFO[k].name} content={<span>{DIPLO_INFO[k].detail} {k !== 'break_alliance' && `Chance about ${Math.round(diploChance(game, k, f.id) * 100)}%.`} {DIPLO_INFO[k].cost ? `Costs ${rs(DIPLO_INFO[k].cost)}.` : ''}</span>}>
                                  <button className="btn small" style={{ marginRight: 3 }} onClick={() => dispatch({ type: 'diplo', kind: k, target: f.id })}>
                                    {DIPLO_INFO[k].name.replace('Propose ', '').replace('Demand ', '').replace('Ask ', '')}
                                  </button>
                                </Tip>
                              ))}
                            {rel === 'war' ? (
                              <button className="btn small ghost" onClick={() => dispatch({ type: 'proposePeace', target: f.id })}>
                                Seek peace
                              </button>
                            ) : (
                              <button className="btn small ghost" onClick={() => confirm(`Declare war on ${polityName(game, f.id)}?${isSikh(f.id) && isSikh(p) ? ' War between misls costs Piri.' : ''}`) && dispatch({ type: 'declareWar', target: f.id })}>
                                Declare war
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </>
          )}
          {tab === 'chronicle' && (
            <>
              <Heading en="Chronicle" pa="ਤਵਾਰੀਖ਼" />
              {[...game.chronicle].reverse().slice(0, 200).map((c, i) => (
                <div key={i} className="small" style={{ marginBottom: 4 }}>
                  <b>
                    {c.festival === 'vaisakhi' ? 'Vaisakhi' : 'Diwali'} {c.year}.
                  </b>{' '}
                  {c.text}
                </div>
              ))}
              {!game.chronicle.length && <p className="muted">The pages are still blank.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsModal() {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const slider = (key: 'master' | 'music' | 'sfx', label: string) => (
    <label className="row" style={{ justifyContent: 'space-between' }}>
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={settings[key]} onChange={(e) => update({ [key]: Number(e.target.value) })} style={{ width: 200 }} />
    </label>
  );
  const toggle = (key: 'muted' | 'colorBlind' | 'reducedMotion' | 'autosave' | 'tutorial', label: string, help: string) => (
    <label className="row" style={{ justifyContent: 'space-between', cursor: 'pointer' }}>
      <span>
        {label} <span className="small muted">— {help}</span>
      </span>
      <input type="checkbox" checked={settings[key]} onChange={(e) => update({ [key]: e.target.checked })} />
    </label>
  );
  return (
    <Modal>
      <Heading en="Settings" />
      <div className="section">
        <div className="section-title">Sound</div>
        {slider('master', 'Master volume')}
        {slider('music', 'Drone and sarangi')}
        {slider('sfx', 'Drums and effects')}
        {toggle('muted', 'Mute', 'silence everything')}
      </div>
      <div className="section">
        <div className="section-title">Display and access</div>
        <label className="row" style={{ justifyContent: 'space-between' }}>
          <span>Interface scale</span>
          <input type="range" min={0.8} max={1.4} step={0.05} value={settings.uiScale} onChange={(e) => update({ uiScale: Number(e.target.value) })} style={{ width: 200 }} />
        </label>
        {toggle('colorBlind', 'Colour-blind-safe map', 'distinct Okabe–Ito colours for every power')}
        {toggle('reducedMotion', 'Reduced motion', 'no fluttering, shimmer or drifting clouds')}
        {toggle('autosave', 'Autosave', 'save at the start of every turn')}
        {toggle('tutorial', 'Counsel of Nawab Kapur Singh', 'show the tutorial hints')}
      </div>
      <div className="section">
        <div className="section-title">Keys</div>
        <div className="small" style={{ columns: 2 }}>
          <div>Enter — end turn</div>
          <div>Esc — close / deselect</div>
          <div>M — move mode for the selected army</div>
          <div>Tab — next army</div>
          <div>L — ledger · K — Sarbat Khalsa</div>
          <div>C — codex · H — home</div>
          <div>W A S D / arrows — pan</div>
          <div>+ / − — zoom</div>
          <div>Right-click — march the selected army</div>
        </div>
      </div>
    </Modal>
  );
}

export function SavesModal() {
  const game = useStore((s) => s.game);
  const load = useStore((s) => s.load);
  const toast = useStore((s) => s.toast);
  const [slots, setSlots] = useState(listSlots());
  const [name, setName] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const refresh = () => setSlots(listSlots());
  const download = () => {
    if (!game) return;
    const blob = new Blob([serialize(game)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shehzada-${game.playerFaction}-${date(game).year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Modal>
      <Heading en="Saved games" />
      {game && (
        <div className="row" style={{ marginBottom: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this save" style={{ flex: 1, fontFamily: 'inherit', padding: 4, border: '1px solid var(--gold-dark)', background: '#fffaf0' }} />
          <button
            className="btn small kesri"
            onClick={() => {
              const n = (name.trim() || `${game.factions[game.playerFaction].sarkar ? 'Sikh Empire' : FACTION_BY_ID[game.playerFaction].name} ${date(game).label}`).replace(/[^\w\s-]/g, '').slice(0, 40);
              try {
                saveToSlot(game, n, `${game.factions[game.playerFaction].sarkar ? 'Sikh Empire' : FACTION_BY_ID[game.playerFaction].name} · ${date(game).label}`);
                toast('Saved.');
              } catch (e) {
                toast((e as Error).message, 'error');
              }
              refresh();
            }}
          >
            Save
          </button>
          <button className="btn small" onClick={download}>
            Export JSON
          </button>
        </div>
      )}
      <div className="row" style={{ marginBottom: 8 }}>
        <button className="btn small neela" onClick={() => file.current?.click()}>
          Import JSON
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) load(await f.text());
          }}
        />
      </div>
      <table className="ledger">
        <tbody>
          {slots.map((s) => (
            <tr key={s.key}>
              <td>
                <b>{s.name}</b>
                <div className="small muted">{s.label}</div>
              </td>
              <td className="small">{new Date(s.savedAt).toLocaleString()}</td>
              <td style={{ textAlign: 'right' }}>
                <button
                  className="btn small"
                  onClick={() => {
                    const g = loadFromSlot(s.name);
                    if (g) load(serialize(g));
                  }}
                >
                  Load
                </button>{' '}
                <button
                  className="btn small ghost"
                  onClick={() => {
                    deleteSlot(s.name);
                    refresh();
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!slots.length && (
            <tr>
              <td className="muted">No saved games yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </Modal>
  );
}

export function CodexModal() {
  const game = useStore((s) => s.game);
  const [tab, setTab] = useState<'terms' | 'people' | 'places' | 'powers'>('terms');
  const [q, setQ] = useState('');
  const ql = q.toLowerCase();
  const people = useMemo(() => Object.values(LEADER_BY_ID).filter((l) => !game || game.leaders[l.id] || year(game) > l.died), [game]);
  return (
    <Modal wide>
      <Heading en="Codex" pa="ਸ਼ਬਦਾਵਲੀ" right={<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search codex" style={{ fontFamily: 'inherit', padding: 3, border: '1px solid var(--gold-dark)', background: '#fffaf0' }} />} />
      <div className="row" style={{ marginBottom: 8 }}>
        {(['terms', 'people', 'places', 'powers'] as const).map((t) => (
          <button key={t} className={`chip ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'terms' && (
        <div style={{ columns: '2 300px', columnGap: 22 }}>
          {GLOSSARY.filter((g) => !ql || g.term.toLowerCase().includes(ql) || g.gloss.toLowerCase().includes(ql)).map((g) => (
            <div key={g.id} style={{ breakInside: 'avoid', marginBottom: 8 }}>
              <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.1em' }}>{g.term}</b> {g.gurmukhi && <span className="gurmukhi" style={{ color: 'var(--sindoor)' }}>{g.gurmukhi}</span>} <i className="small muted">{g.translit}</i>
              <div className="small">{g.gloss}</div>
            </div>
          ))}
        </div>
      )}
      {tab === 'people' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {people
            .filter((l) => !ql || l.name.toLowerCase().includes(ql))
            .map((l) => (
              <div key={l.id} style={{ display: 'flex', gap: 8 }}>
                <Portrait id={l.id} faction={l.faction} female={l.female} age={45} size={48} />
                <div className="small">
                  <b>{l.name}</b> ({l.born}–{l.died})
                  <div className="muted">{l.note}</div>
                </div>
              </div>
            ))}
        </div>
      )}
      {tab === 'places' && (
        <div style={{ columns: '2 300px', columnGap: 22 }}>
          {REGIONS.filter((r) => !ql || r.name.toLowerCase().includes(ql)).map((r) => (
            <div key={r.id} style={{ breakInside: 'avoid', marginBottom: 8 }}>
              <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.05em' }}>{r.name}</b>
              <div className="small muted">
                {r.terrain}, {fmt(r.population)}k people{r.resources.length ? ` · ${r.resources.join(', ')}` : ''}
              </div>
              {r.sites.map((x) => (
                <div key={x.id} className="small">
                  <i>{x.name}</i> — {x.note}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {tab === 'powers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {Object.values(FACTION_BY_ID)
            .filter((f) => !ql || f.name.toLowerCase().includes(ql))
            .map((f) => (
              <div key={f.id} style={{ display: 'flex', gap: 8 }}>
                <BannerEmblem faction={f.id} size={40} />
                <div className="small">
                  <b>{f.name}</b> — <i>{f.epithet}</i>
                  <div>{f.description}</div>
                </div>
              </div>
            ))}
        </div>
      )}
    </Modal>
  );
}

export { Tip };
