// Sacred sites, desecration, Josh, the Vow and the rebuilding of Amritsar.
//
// History: Massa Ranghar occupied the Harmandir in 1740 and was punished by Bhai
// Mehtab Singh and Bhai Sukha Singh; Ahmad Shah's forces desecrated it in 1757 (Baba
// Deep Singh marched to free it and fell) and blew it up in 1762 (after the Vadda
// Ghallughara). Each time the Panth answered. The game models that answer as Josh.
//
// Sikh factions — the player included — are never offered a desecrate option. This
// module only ever lets non-Sikh powers desecrate, and tests enforce it.

import { REGION_BY_ID } from '../data/regions';
import { chronicle } from './chronicle';
import { changePiri } from './miripiri';
import { aliveFactions, clamp, factionName, isSikh, polityName } from './query';
import { rand } from './rng';
import type { FactionId, GameState, RegionId } from './state';

/** How readily each power would desecrate a captured shrine (0 = never). Reflects history, not prejudice:
 * the Marathas, the hill rajas and the Company never did; the Durrani and some Mughal governors did. */
const DESECRATION_PROPENSITY: Record<string, number> = {
  durrani: 0.3,
  mughal: 0.18,
  peshawar: 0.12,
  kasur: 0.06,
  multan: 0.04,
  malerkotla: 0.02,
  bahawalpur: 0.02,
};

export const JOSH_TURNS = 4;

export function sikhSites(region: RegionId) {
  return REGION_BY_ID[region].sites.filter((x) => x.sikhSacred);
}

/** Called when a region changes hands. Returns true if the captor desecrated the shrines. */
export function onCapture(s: GameState, region: RegionId, captor: FactionId, opts: { forceDesecrate?: boolean } = {}): boolean {
  const sites = sikhSites(region);
  if (!sites.length) return false;
  if (isSikh(captor)) {
    // A Sikh faction retaking desecrated shrines opens the rebuilding.
    const st = s.regions[region];
    if (st.desecrated.length && region === 'amritsar' && !s.josh.rebuild) {
      s.josh.rebuild = { progress: 0, needed: 120, contributors: {} };
      chronicle(s, 'rebuilding', `${polityName(s, captor)} retook Amritsar. Among the rubble the Panth resolved to raise the Harmandir again.`, { faction: captor, region, weight: 7 });
    }
    if (s.josh.vow && captor === s.playerFaction && region === 'amritsar') fulfilVow(s);
    return false;
  }
  let p = opts.forceDesecrate ? 1 : DESECRATION_PROPENSITY[captor] ?? 0;
  // Such acts were rare and terrible; they do not repeat while the memory is fresh.
  if (s.josh.active || s.josh.rebuild || s.regions[region].desecrated.length) p = opts.forceDesecrate ? p : 0;
  const hostileToPanth = aliveFactions(s).some((f) => isSikh(f) && s.factions[captor]?.relations[f] === 'war');
  if (!opts.forceDesecrate && (!hostileToPanth || rand(s) >= p)) return false;
  desecrate(s, region, captor);
  return true;
}

export function desecrate(s: GameState, region: RegionId, by: FactionId): void {
  const st = s.regions[region];
  const sites = sikhSites(region);
  st.desecrated = sites.map((x) => x.id);
  const names = sites.map((x) => x.name).join(' and ');
  chronicle(s, 'desecration', `The forces of ${factionName(by)} desecrated ${names}. Silence fell over the Panth, and then a great cry.`, { region, faction: by, weight: 10 });
  // Every Sikh polity feels the wound, then the fury.
  for (const f of aliveFactions(s)) if (isSikh(f)) changePiri(s, f, -2, `The desecration of ${names}`);
  triggerJosh(s, by);
}

export function triggerJosh(s: GameState, by: FactionId): void {
  const army = Object.values(s.armies).find((a) => a.owner === by && a.leader);
  s.josh.active = true;
  s.josh.turnsLeft = JOSH_TURNS;
  s.josh.desecratedBy = by;
  s.josh.vengeanceLeader = army?.leader;
  for (const a of Object.values(s.armies)) {
    if (!isSikh(a.owner)) continue;
    a.josh = a.owner === 'shaheedan' ? JOSH_TURNS + 2 : JOSH_TURNS;
    a.morale = clamp(a.morale + 25, 0, 100);
  }
  // Panthic unity: misls at war with each other are pressed to make peace.
  for (const f of aliveFactions(s)) {
    if (!isSikh(f)) continue;
    for (const g of aliveFactions(s)) {
      if (!isSikh(g) || f === g) continue;
      if (s.factions[f].relations[g] === 'war' && f !== s.playerFaction && g !== s.playerFaction) {
        s.factions[f].relations[g] = 'truce';
        s.factions[g].relations[f] = 'truce';
      }
    }
    // Every Sikh polity takes the field against the desecrator.
    s.factions[f].relations[by] = 'war';
    if (s.factions[by]) s.factions[by].relations[f] = 'war';
  }
  chronicle(s, 'josh', 'The nagaras of every misl beat together. Josh — righteous fury — ran through the Khalsa like fire through dry grass.', { weight: 6 });
}

export function takeVow(s: GameState): boolean {
  if (!s.josh.active || s.josh.vow) return false;
  s.josh.vow = { deadline: s.turn + JOSH_TURNS, taken: s.turn };
  for (const a of Object.values(s.armies)) if (a.owner === s.playerFaction) a.josh = (a.josh ?? 0) + 2;
  chronicle(s, 'vow', `Before the assembled jathas, ${polityName(s, s.playerFaction)} took the vow: free Amritsar, or fall.`, { faction: s.playerFaction, weight: 7 });
  return true;
}

function fulfilVow(s: GameState) {
  s.josh.vow = undefined;
  changePiri(s, s.playerFaction, 12, 'The vow to free Amritsar fulfilled');
  s.factions[s.playerFaction].legend += 10;
  chronicle(s, 'vow', 'The vow was kept. Amritsar was free, and the dhadis sang of it in every village.', { faction: s.playerFaction, weight: 9 });
}

/** Each turn: count Josh down, check the vow, progress rebuilding. */
export function joshTurn(s: GameState): string[] {
  const notes: string[] = [];
  if (s.josh.active) {
    s.josh.turnsLeft -= 1;
    for (const a of Object.values(s.armies)) if (a.josh) a.josh = Math.max(0, a.josh - 1);
    // Feuding among misls while the Panth is called to arms costs dearly.
    const p = s.playerFaction;
    if (isSikh(p)) {
      const feuds = aliveFactions(s).filter((g) => g !== p && isSikh(g) && s.factions[p].relations[g] === 'war');
      if (feuds.length) changePiri(s, p, -2 * feuds.length, 'Fighting fellow Sikhs while the Panth is called to arms');
    }
    if (s.josh.turnsLeft <= 0) {
      s.josh.active = false;
      notes.push('The fury of the Josh has passed; the jathas return to their own lands.');
    }
  }
  if (s.josh.vow && s.turn > s.josh.vow.deadline) {
    s.josh.vow = undefined;
    changePiri(s, s.playerFaction, -10, 'The vow to free Amritsar was not kept');
    chronicle(s, 'vow', 'The vow was not kept, and the dhadis were silent about it.', { faction: s.playerFaction, weight: 5 });
    notes.push('The vow was not kept. The Panth remembers.');
  }
  const rb = s.josh.rebuild;
  if (rb && s.regions.amritsar.owner && isSikh(s.regions.amritsar.owner)) {
    // AI misls contribute a little each turn.
    for (const f of aliveFactions(s)) {
      if (!isSikh(f) || f === s.playerFaction) continue;
      const fs = s.factions[f];
      const give = Math.min(Math.max(0, fs.treasury * 0.08), 8);
      if (give >= 1) {
        fs.treasury -= give;
        rb.progress += give;
        rb.contributors[f] = (rb.contributors[f] ?? 0) + give;
      }
    }
    if (rb.progress >= rb.needed) completeRebuild(s);
  }
  return notes;
}

export function contributeRebuild(s: GameState, f: FactionId, amount: number): boolean {
  const rb = s.josh.rebuild;
  const fs = s.factions[f];
  if (!rb || amount <= 0 || fs.treasury < amount) return false;
  fs.treasury -= amount;
  rb.progress += amount;
  rb.contributors[f] = (rb.contributors[f] ?? 0) + amount;
  if (rb.progress >= rb.needed) completeRebuild(s);
  return true;
}

function completeRebuild(s: GameState) {
  const rb = s.josh.rebuild!;
  s.regions.amritsar.desecrated = [];
  s.josh.rebuild = undefined;
  const total = Object.values(rb.contributors).reduce((t, v) => t + v, 0) || 1;
  for (const [f, amt] of Object.entries(rb.contributors)) {
    changePiri(s, f, 3 + 10 * (amt / total), 'Raising the Harmandir again');
    s.factions[f].legend += Math.round(5 * (amt / total)) + 1;
  }
  s.regions.amritsar.stability = clamp(s.regions.amritsar.stability + 20, 0, 100);
  chronicle(s, 'rebuilding', 'The sarovar was cleansed and filled again, and the Harmandir rose from the rubble. Those who carried the bricks wept, and so did those who only watched.', { region: 'amritsar', weight: 9 });
}
