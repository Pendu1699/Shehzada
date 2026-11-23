// Taking and losing land, retreats, raids and rakhi.

import { REGION_BY_ID } from '../data/regions';
import { chronicle } from './chronicle';
import { regionGross } from './economy';
import { onCapture } from './josh';
import { neighbors } from './map';
import { changePiri } from './miripiri';
import { armiesIn, armyMen, atWar, clamp, factionName, friendly, hasTrait, isCavalryArmy, isSikh, polityName, regionsOf } from './query';
import { rand } from './rng';
import type { Army, FactionId, GameState, RegionId } from './state';

export interface CaptureResult {
  text: string;
  desecrated: boolean;
}

/** Transfer a region. `army` is the army that took it (its policy decides spare/nazrana/sack). */
export function captureRegion(s: GameState, region: RegionId, captor: FactionId, army?: Army, how: 'stormed' | 'surrendered' | 'occupied' = 'occupied'): CaptureResult {
  const st = s.regions[region];
  const def = REGION_BY_ID[region];
  const prev = st.owner;
  st.owner = captor;
  st.control = how === 'surrendered' ? 45 : 30;
  st.stability = clamp(st.stability - 10, 0, 100);
  st.siege = undefined;
  if (st.rakhi === captor) st.rakhi = null;
  if (st.jagir) {
    const L = s.leaders[st.jagir];
    if (L) L.jagir = undefined;
    st.jagir = undefined;
  }
  st.langar = false;
  if (how === 'stormed' && st.fort >= 2) st.fort -= 1;
  if (captor === 'company' && st.inkSince === undefined) st.inkSince = s.turn;

  // Spare, nazrana or sack.
  const policy = army?.policy ?? 'nazrana';
  const { land, trade } = regionGross(s, region);
  const fs = s.factions[captor];
  let verb = 'took';
  if (policy === 'spare') {
    verb = 'took and spared';
    st.stability = clamp(st.stability + 8, 0, 100);
    st.control += 10;
    if (isSikh(captor)) {
      const mult = army && hasTrait(s, army.leader, 'merciful') ? 1.5 : 1;
      changePiri(s, captor, (def.population >= 100 ? 1.5 : 0.8) * mult, `Sparing ${def.name}`);
    }
  } else if (policy === 'nazrana') {
    const amt = Math.round((land + trade) * 0.8);
    fs.treasury += amt;
    verb = `levied a nazrana of ${amt} thousand rupees on`;
    st.stability = clamp(st.stability - 5, 0, 100);
  } else {
    const amt = Math.round((land + trade) * 2.2);
    fs.treasury += amt;
    st.devastation = clamp(st.devastation + 0.35, 0, 1);
    st.stability = clamp(st.stability - 30, 0, 100);
    st.control = 20;
    verb = 'sacked';
    if (isSikh(captor)) changePiri(s, captor, -5, `Sacking ${def.name}`);
    if (army?.baggage) {
      army.baggage.plunder += amt * 0.5;
      army.baggage.captives += Math.round(def.population * 8);
    }
  }
  const desecrated = onCapture(s, region, captor);
  const from = prev ? `, wresting it from ${polityName(s, prev)}` : '';
  const text =
    policy === 'nazrana'
      ? `${cap(polityName(s, captor))} took ${def.name}${from}, and ${verb} its people.`
      : `${cap(polityName(s, captor))} ${verb} ${def.name}${from}.`;
  const kind = policy === 'sack' ? 'sacked' : policy === 'spare' ? 'spared' : 'conquest';
  const weight = def.population >= 150 ? 6 : def.population >= 90 ? 4 : 2;
  chronicle(s, kind, text, { faction: captor, region, weight });
  if (prev === s.playerFaction) chronicle(s, 'loss', `${def.name} was lost to ${polityName(s, captor)}.`, { faction: prev, region, weight: weight + 1 });
  if (prev) checkElimination(s, prev, captor);
  return { text, desecrated };
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function checkElimination(s: GameState, f: FactionId, by?: FactionId): void {
  const fs = s.factions[f];
  if (!fs?.alive) return;
  const hasLand = regionsOf(s, f).length > 0;
  const hasArmy = Object.values(s.armies).some((a) => a.owner === f && armyMen(a) > 0);
  if (hasLand || hasArmy) return;
  fs.alive = false;
  chronicle(s, 'loss', `${polityName(s, f)} was no more${by ? `, swallowed by ${polityName(s, by)}` : ''}.`, { faction: f, weight: f === s.playerFaction ? 10 : 4 });
  for (const L of Object.values(s.leaders)) {
    if (L.faction !== f || !L.alive) continue;
    // Sardars of a fallen house seek service elsewhere.
    if (by && isSikh(by) && isSikh(f)) {
      L.faction = by;
      L.loyalty = Math.min(L.loyalty, 45);
    } else L.active = false;
  }
}

/** Where can a beaten army fall back to? Own, friendly or empty neutral regions without hostile armies. */
export function retreatTarget(s: GameState, army: Army): RegionId | null {
  const opts = neighbors(army.region)
    .map((e) => e.to)
    .filter((r) => !armiesIn(s, r).some((x) => atWar(s, x.owner, army.owner)))
    .map((r) => {
      const o = s.regions[r].owner;
      const score = o === army.owner ? 3 : friendly(s, o, army.owner) ? 2 : !o ? 1 : atWar(s, o, army.owner) ? -5 : 0;
      return { r, score: score + (army.from === r ? 0.5 : 0) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return opts[0]?.r ?? null;
}

/** Move a beaten army back. Returns a note. Horse can scatter and survive; foot is lost. */
export function retreat(s: GameState, army: Army): string {
  const to = retreatTarget(s, army);
  army.path = [];
  army.task = undefined;
  if (to) {
    army.region = to;
    army.morale = Math.max(15, army.morale - 10);
    return `${army.name ?? factionName(army.owner)} fell back to ${REGION_BY_ID[to].name}.`;
  }
  if (isCavalryArmy(army) && isSikh(army.owner)) {
    // Scatter to the jungles and thickets, as the jathas did in the worst years.
    for (const u of army.units) u.men = Math.round(u.men * 0.6);
    army.morale = 30;
    const any = neighbors(army.region).map((e) => e.to).find((r) => !armiesIn(s, r).some((x) => atWar(s, x.owner, army.owner)));
    if (any) {
      army.region = any;
      return `Surrounded, the jathas scattered into the thickets and gathered again at ${REGION_BY_ID[any].name}.`;
    }
  }
  const owner = army.owner;
  destroyArmy(s, army.id);
  checkElimination(s, owner);
  return `${army.name ?? `The army of ${factionName(owner)}`} was destroyed.`;
}

export function destroyArmy(s: GameState, id: string): void {
  const a = s.armies[id];
  if (!a) return;
  if (a.leader && s.leaders[a.leader]) s.leaders[a.leader].armyId = undefined;
  delete s.armies[id];
}

/** A raid: plunder without conquest. Marks the region raided (rakhi protectors must answer). */
export function raidRegion(s: GameState, army: Army): string {
  const st = s.regions[army.region];
  const def = REGION_BY_ID[army.region];
  const { land, trade } = regionGross(s, army.region);
  const take = Math.round((land + trade) * 0.6 * Math.min(1, armyMen(army) / 2000));
  s.factions[army.owner].treasury += take;
  st.devastation = clamp(st.devastation + 0.15, 0, 1);
  st.stability = clamp(st.stability - 10, 0, 100);
  st.raidedBy = army.owner;
  if (army.baggage) {
    army.baggage.plunder += take;
    army.baggage.captives += Math.round(def.population * 3);
  }
  if (isSikh(army.owner) && st.owner && !atWar(s, army.owner, st.owner)) changePiri(s, army.owner, -2, `Raiding ${def.name} without cause`);
  return `${polityName(s, army.owner)} raided ${def.name} and carried off ${take} thousand rupees in plunder.`;
}

/** Rakhi: does the region accept the protection of `f`? */
export function rakhiChance(s: GameState, f: FactionId, region: RegionId): number {
  const st = s.regions[region];
  if (st.owner === f || st.rakhi === f) return 0;
  const near = neighbors(region).some((e) => s.regions[e.to].owner === f) || armiesIn(s, region).some((a) => a.owner === f);
  if (!near) return 0;
  const myMen = Object.values(s.armies)
    .filter((a) => a.owner === f && (a.region === region || neighbors(region).some((e) => e.to === a.region)))
    .reduce((t, a) => t + armyMen(a), 0);
  const ownerMen = st.owner ? armiesIn(s, region).filter((a) => a.owner === st.owner).reduce((t, a) => t + armyMen(a), 0) + st.fort * 300 : 0;
  let p = 0.25 + (myMen - ownerMen) / Math.max(2000, myMen + ownerMen) * 0.5;
  p += (s.factions[f].piri - 50) / 150;
  p += (60 - st.stability) / 200; // unhappy villages look for protectors
  if (st.rakhi) p -= 0.15; // already protected by someone else
  if (st.owner && isSikh(st.owner) && isSikh(f)) p -= 0.2;
  return clamp(p, 0.02, 0.9);
}

export function offerRakhi(s: GameState, f: FactionId, region: RegionId): boolean {
  const p = rakhiChance(s, f, region);
  if (p <= 0) return false;
  const ok = rand(s) < p;
  if (ok) {
    const prev = s.regions[region].rakhi;
    s.regions[region].rakhi = f;
    s.regions[region].rakhiTurns = 0;
    if (f === s.playerFaction)
      chronicle(s, 'rakhi_kept', `The villages of ${REGION_BY_ID[region].name} tied their fortunes to ${polityName(s, f)} and paid rakhi${prev ? `, leaving ${factionName(prev)}` : ''}.`, { faction: f, region, weight: 2 });
  }
  return ok;
}

/** At the end of resolution: were rakhi villages protected when raided? */
export function checkRakhiObligations(s: GameState): string[] {
  const notes: string[] = [];
  for (const st of Object.values(s.regions)) {
    const prot = st.rakhi;
    if (!prot) {
      st.raidedBy = undefined;
      continue;
    }
    st.rakhiTurns += 1;
    if (st.raidedBy && st.raidedBy !== prot) {
      const answered = Object.values(s.armies).some((a) => a.owner === prot && (a.region === st.id || neighbors(st.id).some((e) => e.to === a.region)));
      const name = REGION_BY_ID[st.id].name;
      if (answered) {
        changePiri(s, prot, 1, `Protecting the rakhi villages of ${name}`);
        if (prot === s.playerFaction) {
          chronicle(s, 'rakhi_kept', `When ${factionName(st.raidedBy)} raided ${name}, ${polityName(s, prot)} rode to its defence, as rakhi demands.`, { faction: prot, region: st.id, weight: 3 });
          notes.push(`You answered the raid on ${name}; the rakhi bond holds.`);
        }
      } else {
        changePiri(s, prot, -3, `Failing to protect the rakhi villages of ${name}`);
        if (prot === s.playerFaction) {
          chronicle(s, 'rakhi_broken', `${name} paid rakhi to ${polityName(s, prot)}, but no rider came when ${factionName(st.raidedBy)} raided it.`, { faction: prot, region: st.id, weight: 4 });
          notes.push(`No one answered the raid on ${name}. The villages have withdrawn their rakhi.`);
        }
        st.rakhi = null;
      }
    }
    st.raidedBy = undefined;
    // Rakhi lapses if the protector vanishes or now rules it.
    if (st.rakhi && (!s.factions[st.rakhi]?.alive || st.owner === st.rakhi)) st.rakhi = null;
  }
  return notes;
}
