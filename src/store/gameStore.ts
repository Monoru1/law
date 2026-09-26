'use client';
import { create } from 'zustand';
import { content } from '../content';
import { replay, type GameEvent } from '../engine';
import { localStorageAdapter } from '../persistence/localStorageAdapter';
import { CURRENT_SCHEMA_VERSION } from '../persistence/migrations';
import {
  defaultSettings,
  type SaveGame,
  type Settings,
} from '../persistence/SaveAdapter';
type EventDraft = GameEvent extends infer E
  ? E extends GameEvent
    ? Omit<E, 'id' | 'at'>
    : never
  : never;
type Store = {
  save: SaveGame | null;
  loaded: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  start: () => Promise<void>;
  append: (event: EventDraft) => Promise<void>;
  settings: (update: Partial<Settings>) => Promise<void>;
  clear: () => Promise<void>;
};
const persist = async (save: SaveGame) => localStorageAdapter.save(save);
export const useGameStore = create<Store>((set, get) => ({
  save: null,
  loaded: false,
  error: null,
  hydrate: async () => {
    try {
      const save = await localStorageAdapter.load();
      set({ save, loaded: true, error: null });
    } catch (e) {
      set({
        save: null,
        loaded: true,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
  start: async () => {
    const now = Date.now();
    const runId = crypto.randomUUID();
    const event: GameEvent = {
      type: 'run_started',
      id: crypto.randomUUID(),
      at: now,
      contentVersion: content.version,
    };
    const save: SaveGame = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      contentVersion: content.version,
      runId,
      createdAt: now,
      updatedAt: now,
      events: [event],
      settings: { ...defaultSettings },
    };
    await persist(save);
    set({ save, error: null });
  },
  append: async (partial) => {
    const save = get().save;
    if (!save) return;
    const event = {
      ...partial,
      id: crypto.randomUUID(),
      at: Date.now(),
    } as GameEvent;
    const next = {
      ...save,
      updatedAt: event.at,
      events: [...save.events, event],
    };
    await persist(next);
    set({ save: next });
  },
  settings: async (update) => {
    const save = get().save;
    if (!save) return;
    const next = {
      ...save,
      settings: { ...save.settings, ...update },
      updatedAt: Date.now(),
    };
    await persist(next);
    set({ save: next });
  },
  clear: async () => {
    await localStorageAdapter.clear();
    set({ save: null, error: null });
  },
}));
export const selectGame = (save: SaveGame | null) =>
  replay(save?.events ?? [], content);
