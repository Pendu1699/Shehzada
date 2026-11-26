// The Long Struggle: the Movement page, and the movement's section in a
// region's panel.

import { REGION_BY_ID } from '../data/regions';
import { ACT_INFO, POWERS, avgSupport, garrison, paperName, powerOpen, riseChance, type Power, type StruggleAct } from '../engine/struggle';
import { year } from '../engine/query';
import { useStore } from '../store';
import { Bar, Heading, Modal, Tip, fmt, rs } from './common';

function ActButton({ act, region, power, label, disabled, extra }: { act: StruggleAct; region?: string; power?: Power; label?: string; disabled?: boolean; extra?: string }) {
  const game = useStore((s) => s.game)!;
  const dispatch = useStore((s) => s.dispatch);
  const st = game.struggle!;
  const info = ACT_INFO[act];
  const noActs = act !== 'lie_low' && st.actionsLeft <= 0;
  const poor = game.factions[game.playerFaction].treasury < info.cost;
  return (
    <Tip title={info.name} content={<span>{info.detail} {info.cost ? `Costs ${rs(info.cost)}.` : 'Costs nothing.'} {act !== 'lie_low' ? 'Takes one organiser this season.' : ''} {extra ?? ''}</span>}>
      <button className={`btn small ${act === 'rise' ? 'kesri' : ''}`} disabled={disabled || noActs || poor} onClick={() => dispatch({ type: 'struggle', act, region, power })}>
        {label ?? info.name}
      </button>
    </Tip>
  );
}

export function MovementModal() {
  const game = useStore((s) => s.game)!;
  const close = useStore((s) => s.closeModal);
  const st = game.struggle!;
  return (
    <Modal onClose={close}>
      <Heading en="The Movement" pa="ਲਹਿਰ" right={<span className="small muted">Treasury {rs(game.factions[game.playerFaction].treasury)}</span>} />
      <div className="movement-grid">
        <div>
          <div className="section-title">This season</div>
          <p className="small" style={{ margin: '2px 0 6px' }}>
            <b>{st.actionsLeft}</b> of {st.organisers} organisers free. Each action takes one. Click a region of the Punjab to work there, or act across the province below.
          </p>
          <Tip block title="Support" content={<span>The average support for the movement in the Sikh lands of the Punjab. It brings donations, and it is what a rising stands on.</span>}>
            <div>
              <div className="small">Support {avgSupport(game)}%</div>
              <Bar value={avgSupport(game)} color="var(--kesri)" />
            </div>
          </Tip>
          <Tip block title="Heat" content={<span>How hard the police are watching. Heat brings raids — your spies may warn you of one — and above 90, mass arrests. It falls a little each season.</span>}>
            <div style={{ marginTop: 6 }}>
              <div className="small">Heat {Math.round(st.heat)}</div>
              <Bar value={st.heat} color="var(--sindoor)" />
            </div>
          </Tip>
          {st.raid && (st.cells[st.raid] > 0 || (st.cells.lahore ?? 0) >= 2) && <p className="small" style={{ color: 'var(--sindoor)' }}>Your spies warn of a raid in {REGION_BY_ID[st.raid].name} next season.</p>}
          <div className="section-title" style={{ marginTop: 10 }}>
            Across the Punjab
          </div>
          <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
            {st.press ? <ActButton act="print" label={`Print ${paperName(game)}`} /> : <ActButton act="press" />}
            <ActButton act="hunt" />
            <ActButton act="petition" />
          </div>
          <div className="section-title" style={{ marginTop: 10 }}>
            Freeing the gurdwaras
          </div>
          {game.flags?.gurdwaras_freed ? (
            <p className="small">The gurdwaras and the Akal Takht are in the Panth’s hands.</p>
          ) : (
            <Tip block title="Gurdwara reform" content={<span>From 1920, morchas at Amritsar advance the cause of freeing the gurdwaras from the mahants and the government’s sarbrah.</span>}>
              <div>
                <div className="small">{year(game) < 1920 ? 'Not yet: the morchas begin in 1920.' : `${Math.round(st.gurdwaraReform)}% — hold morchas at Amritsar.`}</div>
                <Bar value={st.gurdwaraReform} color="#1e3fa0" />
              </div>
            </Tip>
          )}
        </div>
        <div>
          <div className="section-title">Friends abroad</div>
          <table className="ledger">
            <tbody>
              {(Object.keys(POWERS) as Power[]).map((p) => (
                <tr key={p} style={{ opacity: powerOpen(game, p) ? 1 : 0.45 }}>
                  <td>
                    <Tip title={POWERS[p].name} content={<span>{POWERS[p].detail} {powerOpen(game, p) ? '' : `(Reachable ${POWERS[p].from}–${POWERS[p].to}.)`}</span>}>
                      <span>{POWERS[p].name}</span>
                    </Tip>
                  </td>
                  <td style={{ width: 100 }}>
                    <Bar value={st.influence[p]} color="var(--mehndi)" />
                  </td>
                  <td>{powerOpen(game, p) && <ActButton act="envoy" power={p} label="Envoy" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small muted">
            Friends abroad send money, shelter exiles, and make a rising likelier to hold. At the end, in 1947, they decide whether the world hears the Panth.
          </p>
        </div>
      </div>
    </Modal>
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
        {'○'.repeat(3 - cells)} · British troops near: {fmt(Math.round(garrison(game, id)))}
        {st.raid === id && (cells > 0 || (st.cells.lahore ?? 0) >= 2) && <span style={{ color: 'var(--sindoor)' }}> · a raid is coming!</span>}
      </div>
      <div className="row" style={{ gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
        <ActButton act="organise" region={id} />
        <ActButton act="cell" region={id} disabled={cells >= 3} />
        <ActButton act="morcha" region={id} disabled={sup < 35} extra="Needs support 35." />
        <ActButton act="lie_low" region={id} disabled={st.lyingLow.includes(id)} />
        <ActButton act="rise" region={id} disabled={rc <= 0} label={rc > 0 ? `Rise (${Math.round(rc * 100)}%)` : 'Rise'} extra="Needs support 70 and two cells; informers and nearby troops make it harder; a world war makes it easier." />
      </div>
    </div>
  );
}
