'use client';
import { create } from 'zustand';
import { replay, validateEvent, type Content, type GameEvent } from '../engine';
import {
  contentIdentity,
  CURRENT_SCHEMA_VERSION,
} from '../persistence/migrations';
import {
  defaultSettings,
  type ReportingStatus,
  type SaveAdapter,
  type SaveGame,
  type Settings,
} from '../persistence/SaveAdapter';

type ExtendedAdapter = SaveAdapter & {
  replace(save: SaveGame): Promise<void>;
  restore(key: string): Promise<SaveGame>;
};

type EventDraft = GameEvent extends infer E
  ? E extends GameEvent
    ? Omit<E, 'id' | 'at'>
    : never
  : never;

export type GameStore = {
  save: SaveGame | null;
  loaded: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  start: (options?: {
    replaceExisting?: true;
    pseudonym?: string;
    reportingConsent?: boolean;
  }) => Promise<void>;
  restore: (key: string) => Promise<void>;
  append: (event: EventDraft) => Promise<void>;
  settings: (update: Partial<Settings>) => Promise<void>;
  setReportingStatus: (status: ReportingStatus) => Promise<void>;
  clear: () => Promise<void>;
};

export function createGameStore(adapter: ExtendedAdapter, content: Content) {
  // Serialize mutations so simultaneous UI actions cannot lose journal entries.
  let pending: Promise<unknown> = Promise.resolve();
  function enqueue<T>(action: () => Promise<T>): Promise<T> {
    const result = pending.then(action);
    pending = result.catch(() => undefined);
    return result;
  }

  const persist = async (save: SaveGame) => adapter.save(save);

  return create<GameStore>((set, get) => ({
    save: null,
    loaded: false,
    error: null,
    hydrate: () =>
      enqueue(async () => {
        try {
          let save = await adapter.load();
          if (save && save.reportingStatus === 'sending') {
            const corrected: SaveGame = { ...save, reportingStatus: 'failed' };
            try {
              await persist(corrected);
            } catch {
              /* best effort */
            }
            save = corrected;
          }
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
            const existing = await adapter.load();
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
        const pseudonym = options?.pseudonym?.trim().slice(0, 64) || undefined;
        const save: SaveGame = {
          schemaVersion: CURRENT_SCHEMA_VERSION,
          contentVersion: content.version,
          runId,
          contentIdentity: contentIdentity(content),
          createdAt: now,
          updatedAt: now,
          events: [event],
          settings: { ...defaultSettings },
          ...(pseudonym !== undefined ? { pseudonym } : {}),
          ...(options?.reportingConsent !== undefined
            ? { reportingConsent: options.reportingConsent }
            : {}),
        };
        if (options?.replaceExisting) await adapter.replace(save);
        else await persist(save);
        set({ save, loaded: true, error: null });
      }),
    restore: (key) =>
      enqueue(async () => {
        const save = await adapter.restore(key);
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
    setReportingStatus: (status) =>
      enqueue(async () => {
        const save = get().save;
        if (!save) return;
        const next: SaveGame = {
          ...save,
          reportingStatus: status,
          updatedAt: Date.now(),
        };
        await persist(next);
        set({ save: next });
      }),
    clear: () =>
      enqueue(async () => {
        await adapter.clear();
        set({ save: null, error: null });
      }),
  }));
}
