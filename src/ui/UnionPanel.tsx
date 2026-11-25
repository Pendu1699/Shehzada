// The Union page of the Bahi-khata: found a league, invite houses into it,
// send silver to help them raise armies, and see who stands with you.

import { useState } from 'react';
import { BannerEmblem } from '../art/Banner';
import { FACTION_BY_ID } from '../data/factions';
import { polityName, regionsOf } from '../engine/query';
import { UNION_NAMES, joinChance, unionOf } from '../engine/unions';
import { useStore } from '../store';
import { Heading, Tip, fmt, rs } from './common';

export function UnionPanel() {
  const game = useStore((s) => s.game)!;
  const dispatch = useStore((s) => s.dispatch);
  const p = game.playerFaction;
  const u = unionOf(game, p);
  const [name, setName] = useState(UNION_NAMES[0]);
  const [aid, setAid] = useState(20);
  const candidates = Object.values(game.factions)
    .filter((f) => f.alive && f.id !== p && !FACTION_BY_ID[f.id]?.distant && f.id !== 'company')
    .map((f) => ({ f, c: joinChance(game, f.id), other: unionOf(game, f.id) }))
    .filter((x) => x.c > 0 || x.other)
    .sort((a, b) => b.c - a.c);
  return (
    <>
      <Heading en="Union" pa="ਸਾਂਝ" />
      <p className="small" style={{ marginTop: 0 }}>
        A union is a league of houses sworn to stand together, as the misls once stood in the Dal Khalsa. Its members are allies; when any one is attacked the others ride to
        its side; you may raise men in your partners’ lands (at a quarter more cost), and send them silver to build their own armies.
      </p>
      {!u ? (
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="Name of the union" />
          <button className="btn kesri" onClick={() => dispatch({ type: 'foundUnion', name })}>
            Found the union
          </button>
        </div>
      ) : (
        <>
          <h3 style={{ marginBottom: 4 }}>{u.name}</h3>
          <div className="small muted">
            Led by {polityName(game, u.leader)} · {u.members.length} {u.members.length === 1 ? 'member' : 'members'}
          </div>
          <table className="ledger" style={{ marginTop: 6 }}>
            <thead>
              <tr>
                <th>Member</th>
                <th>Lands</th>
                <th>Treasury</th>
                <th>Miri</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {u.members.map((m) => (
                <tr key={m}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <BannerEmblem faction={m} size={22} /> {polityName(game, m)}
                      {m === p && <span className="chip">you</span>}
                    </span>
                  </td>
                  <td>{regionsOf(game, m).length}</td>
                  <td>{rs(game.factions[m].treasury)}</td>
                  <td>{fmt(game.factions[m].miri)}</td>
                  <td>
                    {m !== p && (
                      <Tip title="Send silver" content={<span>Silver for them to raise men. They will spend it on soldiers next season, and think better of you.</span>}>
                        <button className="btn small" disabled={game.factions[p].treasury < aid} onClick={() => dispatch({ type: 'sendAid', target: m, amount: aid })}>
                          Send {rs(aid)}
                        </button>
                      </Tip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ gap: 6, alignItems: 'center', marginTop: 6 }}>
            <span className="small">Aid to send:</span>
            {[10, 20, 50, 100].map((n) => (
              <button key={n} className={`chip ${aid === n ? 'on' : ''}`} onClick={() => setAid(n)}>
                {rs(n)}
              </button>
            ))}
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn small ghost" onClick={() => confirm(`Leave the ${u.name}?`) && dispatch({ type: 'leaveUnion' })}>
              Leave the union
            </button>
          </div>
          <div className="rule" />
          <h3>Invite others</h3>
          {candidates.length === 0 && <p className="small muted">No house will hear your envoys just now. Better relations, a common enemy or a stronger hand would help.</p>}
          <table className="ledger">
            <tbody>
              {candidates.map(({ f, c, other }) => (
                <tr key={f.id}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <BannerEmblem faction={f.id} size={22} /> {polityName(game, f.id)}
                    </span>
                  </td>
                  <td className="small">{other ? `in the ${other.name}` : `about ${Math.round(c * 100)}% likely`}</td>
                  <td>
                    {!other && (
                      <button className="btn small kesri" onClick={() => dispatch({ type: 'inviteUnion', target: f.id })}>
                        Invite
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
