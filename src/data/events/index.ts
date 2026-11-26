import { ALT } from './alt';
import { GENERIC } from './generic';
import { HISTORICAL } from './historical';
import { LATE } from './late';
import { WORLD } from './world';
import { STRUGGLE } from './struggle';
import type { EventDef } from './types';

export type { EventDef } from './types';
export const EVENTS: EventDef[] = [...HISTORICAL, ...LATE, ...ALT, ...WORLD, ...STRUGGLE, ...GENERIC];
export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
