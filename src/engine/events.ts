// The event engine. Events have a date window, trigger conditions, a context
// (region/leader/faction), dhadi narration and either automatic effects (world
// events) or choices for the player. History fires by default; conditions let the
// player bend or avert it.

import { EVENTS, EVENT_BY_ID, type EventDef } from '../data/events/index';
import { chronicle } from './chronicle';
import { report } from './khabar';
import { date } from './query';
import { chance } from './rng';
import type { GameState, PendingEvent } from './state';
import { newId } from './state';

function inWindow(s: GameState, ev: EventDef): boolean {
  const d = date(s);
  const key = d.year * 2 + (d.festival === 'diwali' ? 1 : 0);
  if (ev.from) {
    const k = ev.from.year * 2 + (ev.from.festival === 'diwali' ? 1 : 0);
    if (key < k) return false;
  }
  if (ev.to) {
    const k = ev.to.year * 2 + (ev.to.festival === 'diwali' ? 1 : 0);
    if (key > k) return false;
  }
  return true;
}

export function eligible(s: GameState, ev: EventDef): Record<string, string | number> | null {
  if (!inWindow(s, ev)) return null;
  const once = ev.once ?? ev.kind === 'historical';
  if (once && s.firedEvents[ev.id] !== undefined) return null;
  if (ev.cooldown && s.firedEvents[ev.id] !== undefined && s.turn - s.firedEvents[ev.id] < ev.cooldown) return null;
  if (ev.season && date(s).festival !== ev.season) return null;
  const ctx = ev.ctx ? ev.ctx(s) : {};
  if (!ctx) return null;
  if (ev.when && !ev.when(s, ctx)) return null;
  return ctx;
}

/** Run events for the new turn. World events apply now; player events are queued. */
export function runEvents(s: GameState): { notes: string[]; dhadi: string[] } {
  const notes: string[] = [];
  const dhadi: string[] = [];
  if (s.phase === 'ended') return { notes, dhadi };
  let genericFired = 0;
  for (const ev of EVENTS) {
    const ctx = eligible(s, ev);
    if (!ctx) continue;
    if (ev.kind === 'generic') {
      if (genericFired >= 1) continue;
      if (!chance(s, ev.chance ?? 0.05)) continue;
      genericFired++;
    } else if (ev.chance !== undefined && !chance(s, ev.chance)) continue;
    s.firedEvents[ev.id] = s.turn;
    const text = ev.text(s, ctx);
    const forPlayer = ev.choices && ev.choices.length > 0 && (!ev.playerOnly || ev.playerOnly(s, ctx));
    if (forPlayer) {
      s.pendingEvents.push({ id: newId(s, 'E'), eventId: ev.id, ctx });
    } else {
      dhadi.push(text);
      if (ev.kind === 'historical') report(s, ev.title, text, { region: typeof ctx.region === 'string' ? ctx.region : undefined, weight: ev.weight && ev.weight >= 6 ? 3 : 2 });
      const r = ev.effect?.(s, ctx);
      if (r) notes.push(r);
      // A choice event not for the player resolves with its historical (AI) choice.
      if (ev.choices && ev.choices.length) {
        const c = ev.choices[ev.aiChoice ?? 0];
        const res = c.effect(s, ctx);
        if (res) notes.push(res);
      }
      if (ev.chronicle !== false) chronicle(s, ev.mood === 'solemn' ? 'event' : 'event', ev.chronicleText?.(s, ctx) ?? text, { weight: ev.weight ?? (ev.kind === 'historical' ? 5 : 1), region: typeof ctx.region === 'string' ? ctx.region : undefined });
    }
  }
  return { notes, dhadi };
}

export function pendingView(s: GameState, p: PendingEvent) {
  const ev = EVENT_BY_ID[p.eventId];
  return {
    ev,
    text: ev.text(s, p.ctx),
    choices: (ev.choices ?? []).map((c, i) => ({
      i,
      label: typeof c.label === 'function' ? c.label(s, p.ctx) : c.label,
      detail: typeof c.detail === 'function' ? c.detail(s, p.ctx) : c.detail,
      available: c.available ? c.available(s, p.ctx) : true,
    })),
  };
}

/** Apply the player's choice. Returns the result text, or null if invalid. */
export function resolveEventChoice(s: GameState, pendingId: string, choice: number): string | null {
  const idx = s.pendingEvents.findIndex((p) => p.id === pendingId);
  if (idx < 0) return null;
  const p = s.pendingEvents[idx];
  const ev = EVENT_BY_ID[p.eventId];
  const c = ev?.choices?.[choice];
  if (!c) return null;
  if (c.available && !c.available(s, p.ctx)) return null;
  s.pendingEvents.splice(idx, 1);
  ev.effect?.(s, p.ctx);
  const res = c.effect(s, p.ctx) ?? '';
  const label = typeof c.label === 'function' ? c.label(s, p.ctx) : c.label;
  if (ev.chronicle !== false)
    chronicle(s, 'event', `${(ev.chronicleText?.(s, p.ctx) ?? ev.title).replace(/[?.]$/, '')} — ${label.replace(/\.$/, '')}. ${res}`.trim(), {
      faction: s.playerFaction,
      weight: ev.weight ?? (ev.kind === 'historical' ? 5 : 1),
      region: typeof p.ctx.region === 'string' ? p.ctx.region : undefined,
    });
  return res || label;
}
