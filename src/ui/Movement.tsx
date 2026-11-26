// The Long Struggle: the Movement page (the Punjab, friends abroad, funds),
// and the movement's section in a region's panel.

import { useState } from 'react';
import { ASKS, MELA_REGIONS, VENTURES, contactOf, type Ask, type Venture } from '../data/abroad';
import { REGION_BY_ID } from '../data/regions';
import { year } from '../engine/query';
import {
  ACT_INFO,
  MEET_MIN,
  POWERS,
  askChance,
  avgSupport,
  collectAmount,
  fundsOffered,
  garrison,
  meetWait,
  paperName,
  powerOpen,
  riseChance,
  ventureIncome,
  ventureOpen,
  type Power,
  type StruggleAct,
} from '../engine/struggle';
import { useStore } from '../store';
import { Bar, Heading, Modal, Tip, fmt, rs } from './common';

function ActButton({
  act,
  region,
  power,
  ask,
  venture,
  label,
  disabled,
  extra,
  cost,
}: {
  act: StruggleAct;
  region?: string;
  power?: Power;
  ask?: Ask;
  venture?: Venture;
  label?: string;
  disabled?: boolean;
  extra?: string;
  cost?: number;
}) {
  const game = useStore((s) => s.game)!;
  const dispatch = useStore((s) => s.dispatch);
  const st = game.struggle!;
  const info = ACT_INFO[act];
  const price = cost ?? info.cost;
  const noActs = act !== 'lie_low' && st.actionsLeft <= 0;
  const poor = game.factions[game.playerFaction].treasury < price;
  return (
    <Tip
      title={label ?? info.name}
      content={
        <span>
          {info.detail} {price ? `Costs ${rs(price)}.` : 'Costs nothing.'} {act !== 'lie_low' ? 'Takes one organiser this season.' : ''} {extra ?? ''}
        </span>
      }
    >
      <button className={`btn small ${act === 'rise' ? 'kesri' : ''}`} disabled={disabled || noActs || poor} onClick={() => dispatch({ type: 'struggle', act, region, power, ask, venture })}>
        {label ?? info.name}
      </button>
    </Tip>
  );
}

type Tab = 'punjab' | 'abroad' | 'funds';

export function MovementModal() {
  const game = useStore((s) => s.game)!;
  const close = useStore((s) => s.closeModal);
  const [tab, setTab] = useState<Tab>('punjab');
  const st = game.struggle!;
  return (
    <Modal onClose={close}>
      <Heading
        en="The Movement"
        pa="ਲਹਿਰ"
        right={
          <span className="small muted">
            Treasury {rs(game.factions[game.playerFaction].treasury)} · {st.actionsLeft} of {st.organisers} organisers free
          </span>
        }
      />
      <div className="tabs">
        {(
          [
            ['punjab', 'The Punjab'],
            ['abroad', 'Friends abroad'],
            ['funds', 'Funds'],
          ] as [Tab, string][]
        ).map(([id, name]) => (
          <button key={id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
            {name}
          </button>
        ))}
      </div>
      {tab === 'punjab' && <PunjabTab />}
      {tab === 'abroad' && <AbroadTab />}
      {tab === 'funds' && <FundsTab />}
    </Modal>
  );
}

function PunjabTab() {
  const game = useStore((s) => s.game)!;
  const st = game.struggle!;
  return (
    <div className="movement-grid">
      <div>
        <p className="small" style={{ margin: '2px 0 6px' }}>
          Each action takes one organiser. Click a region of the Punjab to work there — organise, plant cells, collect funds, hold morchas — or act across the province below.
        </p>
        <Tip block title="Support" content={<span>The average support for the movement in the Sikh lands of the Punjab. It brings donations, and it is what a rising stands on.</span>}>
          <div>
            <div className="small">Support {avgSupport(game)}%</div>
            <Bar value={avgSupport(game)} color="var(--kesri)" />
          </div>
        </Tip>
        <Tip
          block
          title="Heat"
          content={<span>How hard the police are watching. Heat brings raids — your spies may warn you of one — and above 90, mass arrests. It falls a little each season.</span>}
        >
          <div style={{ marginTop: 6 }}>
            <div className="small">Heat {Math.round(st.heat)}</div>
            <Bar value={st.heat} color="var(--sindoor)" />
          </div>
        </Tip>
        {st.raid && (st.cells[st.raid] > 0 || (st.cells.lahore ?? 0) >= 2) && (
          <p className="small" style={{ color: 'var(--sindoor)' }}>
            Your spies warn of a raid in {REGION_BY_ID[st.raid].name} next season.
          </p>
        )}
        <div className="section-title" style={{ marginTop: 10 }}>
          Across the Punjab
        </div>
        <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
          {st.press ? <ActButton act="print" label={`Print ${paperName(game)}`} /> : <ActButton act="press" />}
          <ActButton act="hunt" />
          <ActButton act="petition" label={game.flags?.transferred ? 'Petition Delhi' : undefined} />
        </div>
      </div>
      <div>
        {game.flags?.suba && (
          <>
            <div className="section-title">The Punjabi Suba</div>
            <Tip
              block
              title="Punjabi Suba"
              content={
                <span>
                  A state of the Punjabi language within India. Morchas advance it — most at Amritsar — and so do the great events of the years. At 100 it is won; history granted a smaller one in
                  1966.
                </span>
              }
            >
              <div style={{ marginBottom: 10 }}>
                <div className="small">{Math.round(st.suba ?? 0)}% — hold morchas, court arrest, keep the Panth behind you.</div>
                <Bar value={st.suba ?? 0} color="var(--kesri)" />
              </div>
            </Tip>
          </>
        )}
        {!game.flags?.transferred && <div className="section-title">Freeing the gurdwaras</div>}
        {game.flags?.transferred ? null : game.flags?.gurdwaras_freed ? (
          <p className="small">The gurdwaras and the Akal Takht are in the Panth’s hands.</p>
        ) : (
          <Tip block title="Gurdwara reform" content={<span>From 1920, morchas at Amritsar advance the cause of freeing the gurdwaras from the mahants and the government’s sarbrah.</span>}>
            <div>
              <div className="small">{year(game) < 1920 ? 'Not yet: the morchas begin in 1920.' : `${Math.round(st.gurdwaraReform)}% — hold morchas at Amritsar.`}</div>
              <Bar value={st.gurdwaraReform} color="#1e3fa0" />
            </div>
          </Tip>
        )}
        <div className="section-title" style={{ marginTop: 10 }}>
          {game.flags?.transferred ? 'No risings' : 'For a rising'}
        </div>
        {game.flags?.transferred ? (
          <p className="small" style={{ margin: 0 }}>
            In free India the movement fights with morchas, the vote and the press. Courting arrest by the thousand is its weapon now.
          </p>
        ) : (
          <p className="small" style={{ margin: 0 }}>
            A region can rise with support 70 and two cells. Arms hidden for it: <b>{st.arms ?? 0}</b> shipment{(st.arms ?? 0) === 1 ? '' : 's'} (ask friends abroad for more).
            {(year(game) >= 1914 && year(game) <= 1918) || (year(game) >= 1939 && year(game) <= 1945) ? ' The British army is away at the world war: now is the time.' : ''}
          </p>
        )}
        <div className="section-title" style={{ marginTop: 10 }}>
          The world hears the Panth
        </div>
        <Tip
          block
          title="Voice"
          content={<span>Raised by friends abroad who speak for you. In 1947, a loud enough voice with strong support at home means the Panth is heard when the line is drawn.</span>}
        >
          <div>
            <div className="small">{Math.round(st.voice ?? 0)} of 60 needed</div>
            <Bar value={st.voice ?? 0} max={60} color="var(--mehndi)" />
          </div>
        </Tip>
      </div>
    </div>
  );
}

function standing(v: number): string {
  if (v >= 70) return 'Patron';
  if (v >= 40) return 'Friendly';
  if (v >= MEET_MIN) return 'Listening';
  if (v > 0) return 'Distant';
  return 'Unknown';
}

function AbroadTab() {
  const game = useStore((s) => s.game)!;
  const st = game.struggle!;
  const [open, setOpen] = useState<Power | null>(null);
  const y = year(game);
  return (
    <div>
      <p className="small" style={{ margin: '2px 0 8px' }}>
        Send envoys to win a power’s trust; once they listen (influence {MEET_MIN}), arrange a meeting and ask for money, arms, shelter for hunted men, or a voice in the world. Each power meets you
        once every two years. British intelligence watched every exile — the hotter the police at home, the likelier a meeting is reported.
      </p>
      <div className="abroad-list">
        {(Object.keys(POWERS) as Power[]).map((p) => {
          const live = powerOpen(game, p);
          const who = contactOf(p, y);
          const inf = st.influence[p];
          const wait = meetWait(game, p);
          return (
            <div key={p} className={`abroad-card ${live ? '' : 'closed'}`}>
              <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
                <b>{POWERS[p].name}</b>
                <span className="small muted">{live ? standing(inf) : `reachable ${POWERS[p].from}–${POWERS[p].to}`}</span>
                <span style={{ flex: 1 }} />
                {live && (
                  <>
                    <ActButton act="envoy" power={p} label="Send envoy" />
                    <Tip
                      title="Arrange a meeting"
                      content={
                        <span>
                          {inf < MEET_MIN
                            ? `They will not meet you yet: influence ${Math.round(inf)} of ${MEET_MIN}.`
                            : wait
                              ? `They met you lately; again in ${wait} season${wait > 1 ? 's' : ''}.`
                              : 'Choose what to ask for.'}
                        </span>
                      }
                    >
                      <button className={`btn small ${open === p ? 'kesri' : ''}`} disabled={inf < MEET_MIN || wait > 0 || st.actionsLeft <= 0} onClick={() => setOpen(open === p ? null : p)}>
                        Meet…
                      </button>
                    </Tip>
                  </>
                )}
              </div>
              {live && who && (
                <div className="small" style={{ margin: '2px 0 4px' }}>
                  <i>{who.name}.</i> {who.note}
                </div>
              )}
              <Bar value={inf} color="var(--mehndi)" />
              {open === p && live && (
                <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  {(Object.keys(ASKS) as Ask[]).map((a) => (
                    <ActButton
                      key={a}
                      act="meet"
                      power={p}
                      ask={a}
                      label={`${ASKS[a].name} (${Math.round(askChance(game, p, a) * 100)}%)`}
                      extra={`${ASKS[a].detail}${a === 'funds' ? ` They might give about ${rs(fundsOffered(game, p))}.` : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FundsTab() {
  const game = useStore((s) => s.game)!;
  const st = game.struggle!;
  const ledger = st.ledger ?? [];
  const net = ledger.reduce((t, l) => t + l.value, 0);
  const y = year(game);
  return (
    <div className="movement-grid">
      <div>
        <div className="section-title">Last season’s accounts</div>
        {ledger.length === 0 ? (
          <p className="small muted">The accounts are drawn up at the end of the season.</p>
        ) : (
          <table className="ledger">
            <tbody>
              {ledger.map((l) => (
                <tr key={l.label}>
                  <td>{l.label}</td>
                  <td style={{ textAlign: 'right' }} className={l.value < 0 ? 'neg' : ''}>
                    {l.value > 0 ? '+' : l.value < 0 ? '−' : ''}
                    {rs(Math.abs(l.value))}
                  </td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>Net</b>
                </td>
                <td style={{ textAlign: 'right' }} className={net < 0 ? 'neg' : ''}>
                  <b>
                    {net > 0 ? '+' : net < 0 ? '−' : ''}
                    {rs(Math.abs(net))}
                  </b>
                </td>
              </tr>
            </tbody>
          </table>
        )}
        <p className="small" style={{ marginTop: 8 }}>
          Other ways to raise money: <b>collect funds</b> in a region (click it on the map — the melas at {Object.values(MELA_REGIONS).join(', ')} give most), and <b>ask friends abroad</b> at a
          meeting.
        </p>
      </div>
      <div>
        <div className="section-title">Ventures</div>
        <p className="small muted" style={{ margin: '0 0 4px' }}>
          Businesses and institutions that pay the movement every season, as Sikh banks, colonists, transporters and emigrants did.
        </p>
        <table className="ledger">
          <tbody>
            {(Object.keys(VENTURES) as Venture[]).map((v) => {
              const d = VENTURES[v];
              const owned = (st.ventures ?? []).includes(v);
              const early = y < d.from;
              return (
                <tr key={v} style={{ opacity: early ? 0.5 : 1 }}>
                  <td>
                    <Tip title={d.name} content={<span>{d.detail}</span>}>
                      <span>{d.name}</span>
                    </Tip>
                    <div className="small muted">{early ? `from ${d.from}` : v === 'school' ? 'one more organiser' : `about ${rs(owned ? ventureIncome(game, v) : d.income)} a season`}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {owned ? (
                      <span className="small">Founded ✓</span>
                    ) : (
                      !early && (
                        <ActButton
                          act="venture"
                          venture={v}
                          label={`Found · ${rs(d.cost)}`}
                          cost={d.cost}
                          disabled={!ventureOpen(game, v)}
                          extra={v === 'farms' && st.influence.america < 10 ? 'Needs friends in America (influence 10).' : d.detail}
                        />
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The movement's section in a region panel. */
export function RegionMovement({ id }: { id: string }) {
  const game = useStore((s) => s.game)!;
  const st = game.struggle!;
  if (st.support[id] === undefined || game.regions[id].owner === game.playerFaction) return null;
  const sup = Math.round(st.support[id]);
  const cells = st.cells[id] ?? 0;
  const rc = riseChance(game, id);
  const gift = collectAmount(game, id);
  return (
    <div className="section">
      <div className="section-title">The Movement</div>
      <Tip block title="Support here" content={<span>Raise it by organising and morchas; it fades slowly on its own and falls in raids.</span>}>
        <div>
          <div className="small">Support {sup}%</div>
          <Bar value={sup} color="var(--kesri)" />
        </div>
      </Tip>
      <div className="small" style={{ marginTop: 4 }}>
        Cells: {'●'.repeat(cells)}
        {'○'.repeat(3 - cells)} · {game.flags?.transferred ? 'Government' : 'British'} troops near: {fmt(Math.round(garrison(game, id)))}
        {st.raid === id && (cells > 0 || (st.cells.lahore ?? 0) >= 2) && <span style={{ color: 'var(--sindoor)' }}> · a raid is coming!</span>}
      </div>
      <div className="row" style={{ gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
        <ActButton act="organise" region={id} />
        <ActButton act="cell" region={id} disabled={cells >= 3} />
        <ActButton act="collect" region={id} label={`Collect ${rs(gift)}`} extra={MELA_REGIONS[id] ? `Here: ${MELA_REGIONS[id]}.` : ''} />
        <ActButton act="morcha" region={id} disabled={sup < 35} extra="Needs support 35." />
        <ActButton act="lie_low" region={id} disabled={st.lyingLow.includes(id)} />
        {!game.flags?.transferred && (
          <ActButton
            act="rise"
            region={id}
            disabled={rc <= 0}
            label={rc > 0 ? `Rise (${Math.round(rc * 100)}%)` : 'Rise'}
            extra="Needs support 70 and two cells; hidden arms, a world war and friends abroad help; informers and nearby troops make it harder."
          />
        )}
      </div>
    </div>
  );
}
