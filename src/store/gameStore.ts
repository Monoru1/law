'use client';
import { create } from 'zustand';
import { content } from '../content';
import { replay, validateEvent, type GameEvent } from '../engine';
import { localStorageAdapter } from '../persistence/localStorageAdapter';
import {
  contentIdentity,
  CURRENT_SCHEMA_VERSION,
} from '../persistence/migrations';
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
  start: (options?: { replaceExisting: true }) => Promise<void>;
  restore: (key: string) => Promise<void>;
  append: (event: EventDraft) => Promise<void>;
  settings: (update: Partial<Settings>) => Promise<void>;
  clear: () => Promise<void>;
};
const persist = async (save: SaveGame) => localStorageAdapter.save(save);
// Serialize mutations so simultaneous UI actions cannot lose journal entries.
let pending: Promise<unknown> = Promise.resolve();
function enqueue<T>(action: () => Promise<T>): Promise<T> {
  const result = pending.then(action);
  pending = result.catch(() => undefined);
  return result;
}
export const useGameStore = create<Store>((set, get) => ({
  save: null,
  loaded: false,
  error: null,
  hydrate: () =>
    enqueue(async () => {
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
    }),
  start: (options) =>
    enqueue(async () => {
      if (!options?.replaceExisting) {
        try {
          const existing = await localStorageAdapter.load();
          if (existing) {
            set({ save: existing, loaded: true, error: null });
            return;
          }
        } catch (error) {
          set({
            loaded: true,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      }
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
        contentIdentity: contentIdentity(content),
        createdAt: now,
        updatedAt: now,
        events: [event],
        settings: { ...defaultSettings },
      };
      if (options?.replaceExisting) await localStorageAdapter.replace(save);
      else await persist(save);
      set({ save, loaded: true, error: null });
    }),
  restore: (key) =>
    enqueue(async () => {
      const save = await localStorageAdapter.restore(key);
      set({ save, loaded: true, error: null });
    }),
  append: (partial) =>
    enqueue(async () => {
      const save = get().save;
      if (!save) return;
      const event = {
        ...partial,
        id: crypto.randomUUID(),
        at: Date.now(),
      } as GameEvent;
      validateEvent(event, replay(save.events, content), content);
      const next = {
        ...save,
        updatedAt: event.at,
        events: [...save.events, event],
      };
      await persist(next);
      set({ save: next });
    }),
  settings: (update) =>
    enqueue(async () => {
      const save = get().save;
      if (!save) return;
      const next = {
        ...save,
        settings: { ...save.settings, ...update },
        updatedAt: Date.now(),
      };
      await persist(next);
      set({ save: next });
    }),
  clear: () =>
    enqueue(async () => {
      await localStorageAdapter.clear();
      set({ save: null, error: null });
    }),
}));
export const selectGame = (save: SaveGame | null) =>
  replay(save?.events ?? [], content);
