// The Darbar of the Sarkar-i-Khalsa, and succession.
//
// After 1801 the player who rules as the Sarkar must manage a court with factions
// — the Sandhawalia sardars (royal kin), the Dogra brothers, the panches of the
// Khalsa Army, the old misl families and the European officers — and plan the
// succession. A weak succession lets the historical chain of 1839–46 run: deaths,
// assassinations, a regency, an army that answers to its own councils, and
// commanders who betray it in the field. Good preparation can avert it.

import { chronicle } from './chronicle';
import { changePiri } from './miripiri';
import { clamp, polityName, year } from './query';
import type { FactionId, GameState } from './state';

export type CourtFactionId = 'sandhawalia' | 'dogra' | 'panches' | 'misl_families' | 'europeans';

export const COURT_FACTIONS: Record<CourtFactionId, { name: string; detail: string }> = {
  sandhawalia: { name: 'The Sandhawalia sardars', detail: 'Kinsmen of the royal house, proud and quick to take offence. Historically they murdered Sher Singh and Dhian Singh in 1843.' },
  dogra: { name: 'The Dogra brothers', detail: 'Gulab Singh, Dhian Singh and Suchet Singh of Jammu: able ministers with their own designs on the hills.' },
  panches: { name: 'The Khalsa Army panches', detail: 'Elected councils of the regiments. After 1839 they became a political power of their own.' },
  misl_families: { name: 'The old misl families', detail: 'The Attariwalas, Majithias, Ahluwalias and others whose grandfathers rode in the Dal Khalsa.' },
  europeans: { name: 'The European officers', detail: 'Ventura, Allard, Avitabile, Court: drillmasters and governors, loyal while they are paid.' },
};

export interface CourtFaction {
  influence: number;
  loyalty: number;
}

export interface Court {
  factions: Record<CourtFactionId, CourtFaction>;
  heir?: string;
  heirPrepared: number;
  armyBound: number;
  crisis: boolean;
  /** Turns of regency (a child ruler). */
  regency: number;
}

export function newCourt(s: GameState, f: FactionId): Court {
  const y = year(s);
  const court: Court = {
    factions: {
      sandhawalia: { influence: 15, loyalty: 60 },
      dogra: { influence: y >= 1820 ? 30 : 10, loyalty: 50 },
      panches: { influence: y >= 1839 ? 25 : 5, loyalty: 65 },
      misl_families: { influence: 30, loyalty: 65 },
      europeans: { influence: s.factions[f].flags.european_officers ? 15 : 0, loyalty: 70 },
    },
    heirPrepared: y >= 1839 ? 20 : 30,
    armyBound: 55,
    crisis: false,
    regency: 0,
  };
  const heirs = ['kharak_singh', 'nau_nihal_singh', 'sher_singh'].filter((id) => s.leaders[id]?.alive && s.leaders[id].faction === f);
  court.heir = heirs[0];
  return court;
}

export function courtStability(c: Court): { value: number; parts: { label: string; value: number }[] } {
  const fs = Object.values(c.factions);
  const totalInf = fs.reduce((t, x) => t + x.influence, 0) || 1;
  const avgLoyalty = fs.reduce((t, x) => t + x.loyalty * x.influence, 0) / totalInf;
  const dominant = Math.max(...fs.map((x) => x.influence)) / totalInf;
  const parts = [
    { label: 'Loyalty of the factions (weighted by influence)', value: Math.round(avgLoyalty) },
    { label: 'One faction dominates the darbar', value: dominant > 0.4 ? -Math.round((dominant - 0.4) * 100) : 0 },
    { label: 'The army bound to the throne', value: Math.round((c.armyBound - 50) / 3) },
    { label: 'Heir prepared', value: Math.round((c.heirPrepared - 50) / 4) },
  ];
  return { value: clamp(parts.reduce((t, p) => t + p.value, 0), 0, 100), parts };
}

export type CourtAction = 'favour' | 'curb' | 'educate' | 'bind_army' | 'name_heir';

export const COURT_COSTS: Record<CourtAction, number> = { favour: 20, curb: 10, educate: 15, bind_army: 30, name_heir: 0 };

export function courtAction(s: GameState, act: CourtAction, target?: string): string | null {
  const f = s.playerFaction;
  const c = s.court;
  if (!c || !s.factions[f].sarkar) return null;
  const cost = COURT_COSTS[act];
  if (s.factions[f].treasury < cost) return null;
  if (s.factions[f].flags[`court_${act}_${s.turn}`]) return null;
  s.factions[f].treasury -= cost;
  s.factions[f].flags[`court_${act}_${s.turn}`] = true;
  switch (act) {
    case 'favour': {
      const x = c.factions[target as CourtFactionId];
      if (!x) return null;
      x.influence = clamp(x.influence + 8, 0, 100);
      x.loyalty = clamp(x.loyalty + 12, 0, 100);
      for (const [k, y] of Object.entries(c.factions)) if (k !== target) y.loyalty = clamp(y.loyalty - 2, 0, 100);
      return `${COURT_FACTIONS[target as CourtFactionId].name} are honoured with robes and jagirs.`;
    }
    case 'curb': {
      const x = c.factions[target as CourtFactionId];
      if (!x) return null;
      x.influence = clamp(x.influence - 14, 0, 100);
      x.loyalty = clamp(x.loyalty - 12, 0, 100);
      return `${COURT_FACTIONS[target as CourtFactionId].name} lose their offices.`;
    }
    case 'educate':
      if (!c.heir || !s.leaders[c.heir]?.alive) return null;
      c.heirPrepared = clamp(c.heirPrepared + 7 + (s.leaders[c.heir].admin - 2) * 2, 0, 100);
      return `${s.leaders[c.heir].name} sits in the darbar and rides with the army.`;
    case 'bind_army':
      c.armyBound = clamp(c.armyBound + 12, 0, 100);
      c.factions.panches.loyalty = clamp(c.factions.panches.loyalty + 8, 0, 100);
      return 'Arrears are paid and the regiments swear again before the Granth Sahib to serve the throne.';
    case 'name_heir':
      if (!target || !s.leaders[target]?.alive || s.leaders[target].faction !== f) return null;
      c.heir = target;
      c.heirPrepared = Math.max(10, c.heirPrepared - 15);
      return `${s.leaders[target].name} is named heir.`;
  }
}

/** Each turn: the court drifts. */
export function courtTurn(s: GameState): string[] {
  const notes: string[] = [];
  const f = s.playerFaction;
  const fs = s.factions[f];
  if (!fs.sarkar) return notes;
  if (!s.court) s.court = newCourt(s, f);
  const c = s.court;
  const y = year(s);
  const gap = fs.miri - fs.piri;
  if (y >= 1818) c.factions.dogra.influence = clamp(c.factions.dogra.influence + 1.2, 0, 100);
  if (fs.flags.european_officers) c.factions.europeans.influence = clamp(Math.max(c.factions.europeans.influence, 10) + 0.3, 0, 40);
  if (fs.treasury < 0) {
    c.factions.panches.influence = clamp(c.factions.panches.influence + 4, 0, 100);
    c.factions.panches.loyalty = clamp(c.factions.panches.loyalty - 5, 0, 100);
    c.armyBound = clamp(c.armyBound - 4, 0, 100);
  }
  if (c.crisis) c.factions.panches.influence = clamp(c.factions.panches.influence + 2, 0, 100);
  if (fs.convenesSarbat) c.factions.panches.loyalty = clamp(c.factions.panches.loyalty + 1, 0, 100);
  for (const x of Object.values(c.factions)) {
    if (gap > 20) x.loyalty = clamp(x.loyalty - (gap - 20) / 15, 0, 100);
    else x.loyalty = clamp(x.loyalty + 0.5, 0, 100);
  }
  c.armyBound = clamp(c.armyBound - 0.5, 0, 100);
  if (c.heir && !s.leaders[c.heir]?.alive) {
    c.heir = Object.values(s.leaders).find((l) => l.alive && l.faction === f && l.id !== fs.chief && ['kharak_singh', 'nau_nihal_singh', 'sher_singh', 'duleep_singh'].includes(l.id))?.id;
  }
  if (c.regency > 0) c.regency -= 1;
  return notes;
}

/** How exposed is a Sarkar (player or AI) to the historical collapse? 0 safe .. 1 doomed. */
export function collapseRisk(s: GameState, f: FactionId): number {
  const fs = s.factions[f];
  if (!fs?.sarkar) return 0;
  if (f !== s.playerFaction || !s.court) return 0.85; // an AI Sarkar follows the current of history
  const stab = courtStability(s.court).value;
  const gap = Math.max(0, fs.miri - fs.piri);
  return clamp(1 - stab / 70 + gap / 80 - (fs.convenesSarbat ? 0.15 : 0) + (s.court.crisis ? 0.2 : 0), 0, 1);
}

export function onRulerDeath(s: GameState, f: FactionId): void {
  const fs = s.factions[f];
  if (!fs.sarkar) return;
  if (f === s.playerFaction && s.court) {
    const c = s.court;
    const stab = courtStability(c).value;
    if (c.heir && s.leaders[c.heir]?.alive && c.heirPrepared >= 60 && stab >= 55) {
      fs.chief = c.heir;
      chronicle(s, 'succession', `${s.leaders[c.heir].name} succeeded to the throne without a sword drawn, as had been prepared.`, { faction: f, weight: 6 });
      changePiri(s, f, 2, 'A peaceful succession');
      c.heirPrepared = 30;
      c.heir = undefined;
      return;
    }
    c.crisis = true;
    chronicle(s, 'succession', `The succession of ${polityName(s, f)} was not secured. The factions of the darbar began to stir.`, { faction: f, weight: 6 });
  }
}
