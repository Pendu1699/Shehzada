// Zustand store: holds the GameState and UI state. All game changes go through
// the engine's applyAction(); React and Pixi only read.

import { create } from 'zustand';
import { audio } from './audio/engine';
import { applyAction, type Action } from './engine/actions';
import { findPath, pathTurns } from './engine/movement';
import { date, year } from './engine/query';
import { deserialize, saveToSlot, serialize } from './engine/save';
import { newGame, type NewGameOptions } from './engine/setup';
import type { GameState } from './engine/state';

export type Screen = 'title' | 'setup' | 'game';
export type Modal = null | 'ledger' | 'sarbat' | 'codex' | 'settings' | 'saves' | 'summary' | 'vaar' | 'help' | 'event' | 'darbar' | 'unify';

export interface Settings {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
  colorBlind: boolean;
  uiScale: number;
  reducedMotion: boolean;
  autosave: boolean;
  tutorial: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  master: 0.8,
  music: 0.6,
  sfx: 0.8,
  muted: false,
  colorBlind: false,
  uiScale: 1,
  reducedMotion: false,
  autosave: true,
  tutorial: true,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('rkk.settings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** The quick-actions menu opened by right-clicking an army or a region. */
export interface MapMenu {
  kind: 'army' | 'region';
  id: string;
  x: number;
  y: number;
}

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'error';
}

interface Store {
  screen: Screen;
  game: GameState | null;
  selRegion: string | null;
  selArmy: string | null;
  hover: string | null;
  modal: Modal;
  battleQueue: string[];
  toasts: Toast[];
  settings: Settings;
  ledgerTab: string;
  tutorialRun: number;
  menu: MapMenu | null;
  openMenu(m: MapMenu | null): void;
  restartTutorial(): void;
  setScreen(s: Screen): void;
  start(opts: NewGameOptions): void;
  load(json: string): void;
  dispatch(a: Action): boolean;
  selectRegion(id: string | null): void;
  selectArmy(id: string | null): void;
  setHover(id: string | null): void;
  openModal(m: Modal, tab?: string): void;
  closeModal(): void;
  nextBattle(): void;
  toast(text: string, kind?: Toast['kind']): void;
  dismissToast(id: number): void;
  updateSettings(p: Partial<Settings>): void;
  preview(): { path: string[]; turns: number } | null;
  exportSave(): string | null;
}

let toastId = 0;

function moodFor(g: GameState): Parameters<typeof audio.setMood>[0] {
  const d = date(g);
  if (g.josh.active && g.josh.turnsLeft >= 3) return 'mourning';
  if (g.josh.active) return 'war';
  if (year(g) >= 1839) return 'twilight';
  if (d.festival === 'diwali') return 'diwali';
  if (d.monsoon) return 'monsoon';
  return 'explore';
}

export const useStore = create<Store>((set, get) => ({
  screen: 'title',
  game: null,
  selRegion: null,
  selArmy: null,
  hover: null,
  modal: null,
  battleQueue: [],
  toasts: [],
  settings: loadSettings(),
  ledgerTab: 'treasury',
  tutorialRun: 0,
  menu: null,
  openMenu: (m) => set({ menu: m }),
  restartTutorial: () => {
    const s = get();
    s.updateSettings({ tutorial: true });
    set({ tutorialRun: s.tutorialRun + 1, modal: null });
  },

  setScreen: (screen) => set({ screen }),

  start: (opts) => {
    const game = newGame(opts);
    audio.setEra(year(game));
    audio.setMood(moodFor(game));
    set({ game, screen: 'game', selRegion: null, selArmy: null, modal: 'summary', battleQueue: [] });
  },

  load: (json) => {
    try {
      const game = deserialize(json);
      audio.setEra(year(game));
      audio.setMood(moodFor(game));
      set({ game, screen: 'game', selRegion: null, selArmy: null, modal: null, battleQueue: [] });
    } catch (e) {
      get().toast((e as Error).message, 'error');
    }
  },

  dispatch: (a) => {
    const g = get().game;
    if (!g) return false;
    const r = applyAction(g, a);
    if (r.error) {
      get().toast(r.error, 'error');
      return false;
    }
    const patch: Partial<Store> = { game: r.state };
    if (r.info) get().toast(r.info);
    if (a.type === 'endTurn') {
      const s = r.state;
      const mine = s.lastBattles.filter((id) => {
        const b = s.battles.find((x) => x.id === id);
        return b && (b.attacker === s.playerFaction || b.defender === s.playerFaction);
      });
      patch.battleQueue = mine;
      patch.modal = s.phase === 'ended' ? 'vaar' : 'summary';
      if (patch.selArmy === undefined && get().selArmy && !s.armies[get().selArmy!]) patch.selArmy = null;
      audio.setEra(year(s));
      audio.setMood(moodFor(s));
      if (date(s).festival === 'vaisakhi') audio.dhol(2);
      else audio.dhadd(3);
      if (get().settings.autosave) {
        try {
          saveToSlot(s, 'autosave', `Autosave · ${date(s).label}`);
        } catch {
          /* storage full or unavailable */
        }
      }
    }
    set(patch);
    return true;
  },

  selectRegion: (id) => set({ selRegion: id }),
  selectArmy: (id) => set({ selArmy: id }),
  setHover: (id) => set({ hover: id }),
  openModal: (m, tab) => {
    audio.rustle();
    set(tab ? { modal: m, ledgerTab: tab } : { modal: m });
  },
  closeModal: () => set({ modal: null }),
  nextBattle: () => set({ battleQueue: get().battleQueue.slice(1) }),
  toast: (text, kind = 'info') => {
    const id = ++toastId;
    set({ toasts: [...get().toasts.slice(-3), { id, text, kind }] });
    setTimeout(() => get().dismissToast(id), kind === 'error' ? 5200 : 3600);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  updateSettings: (p) => {
    const settings = { ...get().settings, ...p };
    try {
      localStorage.setItem('rkk.settings', JSON.stringify(settings));
    } catch {
      /* ignore */
    }
    audio.settings = { master: settings.master, music: settings.music, sfx: settings.sfx, muted: settings.muted };
    audio.applySettings();
    set({ settings });
  },
  preview: () => {
    const { game, selArmy, hover } = get();
    if (!game || !selArmy || !hover) return null;
    const a = game.armies[selArmy];
    if (!a || a.owner !== game.playerFaction || hover === a.region) return null;
    const path = findPath(game, a, hover);
    if (!path) return null;
    return { path, turns: pathTurns(game, a, path) };
  },
  exportSave: () => {
    const g = get().game;
    return g ? serialize(g) : null;
  },
}));
