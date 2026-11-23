import { Portrait } from '../art/Portrait';
import { TRAITS } from '../data/leaders';
import { REGION_BY_ID } from '../data/regions';
import { UNIT_TYPES } from '../data/units';
import { STANCES } from '../engine/combat';
import { movementPoints, pathTurns } from '../engine/movement';
import { armiesIn, armyMen, isCavalryArmy, polityName, year } from '../engine/query';
import type { Stance } from '../engine/state';
import { useStore } from '../store';
import { Bar, BreakdownView, Folio, Tip, fmt } from './common';

const STANCE_ORDER: Stance[] = ['pitched', 'dhai_phat', 'ambush', 'night_raid', 'siege', 'hold'];
const POLICY: Record<string, { name: string; detail: string }> = {
  spare: { name: 'Spare', detail: 'Take the town without plunder. Piri rises; the people settle quickly.' },
  nazrana: { name: 'Nazrana', detail: 'Levy a tribute on submission. Money, a little resentment.' },
  sack: { name: 'Sack', detail: 'Plunder the town. Much money; heavy Piri loss, devastation and hatred.' },
};

export function ArmyPanel({ id, moveMode, setMoveMode }: { id: string; moveMode: boolean; setMoveMode: (b: boolean) => void }) {
  const game = useStore((s) => s.game)!;
  const dispatch = useStore((s) => s.dispatch);
  const selectArmy = useStore((s) => s.selectArmy);
  const a = game.armies[id];
  if (!a) return null;
  const mine = a.owner === game.playerFaction;
  const L = a.leader ? game.leaders[a.leader] : undefined;
  const mp = movementPoints(game, a);
  const turns = a.path.length ? pathTurns(game, a, a.path) : 0;
  const companions = armiesIn(game, a.region).filter((x) => x.owner === a.owner && x.id !== a.id);
  const leaders = Object.values(game.leaders).filter((l) => l.alive && l.active && l.faction === game.playerFaction);
  const visible = mine || (game.explored[a.region] ?? 0) > 0;
  if (!visible) return null;
  return (
    <Folio className="side-panel">
      <div className="heading-band">
        <div>
          <h2 style={{ margin: 0 }}>{a.name ?? (L ? `${L.name}’s army` : `Army of ${polityName(game, a.owner)}`)}</h2>
          <div className="small muted">
            {polityName(game, a.owner)} · at {REGION_BY_ID[a.region].name}
          </div>
        </div>
      </div>
      {L && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Portrait id={L.id} faction={L.faction} female={L.female} age={year(game) - L.born} size={64} royal={L.id === 'ranjit_singh' && year(game) >= 1801} />
          <div className="small" style={{ flex: 1 }}>
            <b>{L.name}</b>, aged {year(game) - L.born}
            <div>
              Martial {L.martial} · Admin {L.admin} · Diplomacy {L.diplomacy}
            </div>
            {mine && (
              <Tip title="Loyalty" content={<span>Falls when Miri runs far ahead of Piri, when pay is in arrears, or when a jagir is revoked. A disloyal commander may hold back — or betray — in battle.</span>}>
                <div style={{ width: 140 }} tabIndex={0}>
                  Loyalty {Math.round(L.loyalty)} <Bar value={L.loyalty} color={L.loyalty < 40 ? '#b83a2b' : '#5e6b2e'} />
                </div>
              </Tip>
            )}
            <div className="row" style={{ marginTop: 3 }}>
              {L.traits.map((t) => (
                <Tip key={t} title={TRAITS[t].name} content={<span>{TRAITS[t].detail}</span>}>
                  <span className="chip" tabIndex={0}>
                    {TRAITS[t].name}
                  </span>
                </Tip>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="section">
        <div className="section-title">
          {fmt(armyMen(a))} men {isCavalryArmy(a) ? '· a horse army' : ''}
        </div>
        {a.units.map((u) => (
          <Tip key={u.type} block title={UNIT_TYPES[u.type]?.name} content={<span>{UNIT_TYPES[u.type]?.gloss} Experience {Math.round(u.xp * 100)}%.</span>}>
            <div className="unit-row">
              <span>{UNIT_TYPES[u.type]?.name ?? u.type}</span>
              <span>{fmt(u.men)}</span>
            </div>
          </Tip>
        ))}
        <dl className="kv" style={{ marginTop: 6 }}>
          <dt>Morale</dt>
          <dd>
            <Bar value={a.morale} color="#e8870e" />
          </dd>
          <dt>Supply</dt>
          <dd>
            <Bar value={a.supply} color="#5e6b2e" />
          </dd>
          <dt>Pace</dt>
          <dd>
            <Tip title="Movement this half-year" content={<BreakdownView b={{ total: mp.total, parts: mp.parts }} />}>
              <span tabIndex={0}>{fmt(mp.total, 1)} points</span>
            </Tip>
          </dd>
          {a.josh ? (
            <>
              <dt>Josh</dt>
              <dd style={{ color: 'var(--kesri-deep)' }}>Righteous fury, {a.josh} turn(s)</dd>
            </>
          ) : null}
          {a.baggage && (
            <>
              <dt>Baggage</dt>
              <dd>
                {fmt(a.baggage.plunder)}k plunder, {fmt(a.baggage.captives)} captives
              </dd>
            </>
          )}
        </dl>
      </div>
      {mine && (
        <>
          <div className="section">
            <div className="section-title">Orders</div>
            <div className="row">
              <button data-tut="move" className={`btn small ${moveMode ? 'kesri' : ''}`} onClick={() => setMoveMode(!moveMode)} title="M">
                {moveMode ? 'Choose a destination…' : 'Move'}
              </button>
              {a.path.length > 0 && (
                <button className="btn small ghost" onClick={() => dispatch({ type: 'cancelMove', armyId: a.id })}>
                  Halt
                </button>
              )}
              <button className="btn small ghost" onClick={() => dispatch({ type: 'split', armyId: a.id })}>
                Divide
              </button>
              {companions.map((c) => (
                <button key={c.id} className="btn small ghost" onClick={() => dispatch({ type: 'merge', armyId: c.id, intoId: a.id })}>
                  Join {c.name ?? fmt(armyMen(c))}
                </button>
              ))}
            </div>
            {a.path.length > 0 && (
              <p className="small" style={{ margin: '4px 0' }}>
                Marching to <b>{REGION_BY_ID[a.path[a.path.length - 1]].name}</b> by way of {a.path.slice(0, -1).map((r) => REGION_BY_ID[r].name).join(', ') || 'the direct road'} — about {turns} turn{turns > 1 ? 's' : ''}.
              </p>
            )}
            <p className="small muted" style={{ margin: '4px 0' }}>
              Right-click (or shift-click) a region to march there, or press Move and tap it.
            </p>
          </div>
          <div className="section">
            <div className="section-title">Stance</div>
            <div className="stance-grid">
              {STANCE_ORDER.map((st) => (
                <Tip key={st} title={STANCES[st].name} content={<span>{STANCES[st].detail}</span>}>
                  <button className={`chip ${a.stance === st ? 'on' : ''}`} style={{ width: '100%' }} onClick={() => dispatch({ type: 'setStance', armyId: a.id, stance: st })}>
                    {STANCES[st].name}
                  </button>
                </Tip>
              ))}
            </div>
          </div>
          <div className="section">
            <div className="section-title">On taking a town</div>
            <div className="row">
              {Object.entries(POLICY).map(([k, v]) => (
                <Tip key={k} title={v.name} content={<span>{v.detail}</span>}>
                  <button className={`chip ${a.policy === k ? 'on' : ''}`} onClick={() => dispatch({ type: 'setPolicy', armyId: a.id, policy: k as 'spare' })}>
                    {v.name}
                  </button>
                </Tip>
              ))}
            </div>
            <div className="row" style={{ marginTop: 5 }}>
              <Tip title="Subjugate" content={<span>Take a region held by no great power (local chiefs) when you reach it.</span>}>
                <button className={`chip ${a.task === 'capture' ? 'on' : ''}`} onClick={() => dispatch({ type: 'setTask', armyId: a.id, task: a.task === 'capture' ? null : 'capture' })}>
                  Subjugate
                </button>
              </Tip>
              <Tip title="Raid" content={<span>Plunder the region you reach instead of taking it. Raiding those you are not at war with costs Piri.</span>}>
                <button className={`chip ${a.task === 'raid' ? 'on' : ''}`} onClick={() => dispatch({ type: 'setTask', armyId: a.id, task: a.task === 'raid' ? null : 'raid' })}>
                  Raid
                </button>
              </Tip>
            </div>
          </div>
          <div className="section">
            <div className="section-title">Commander</div>
            <select
              value={a.leader ?? ''}
              onChange={(e) => dispatch({ type: 'assignLeader', armyId: a.id, leaderId: e.target.value || null })}
              style={{ width: '100%' }}
              aria-label="Commander"
            >
              <option value="">— none —</option>
              {leaders.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} (martial {l.martial}){l.armyId && l.armyId !== a.id ? ' · with another army' : ''}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn small ghost" onClick={() => selectArmy(null)}>
          Close
        </button>
      </div>
    </Folio>
  );
}
