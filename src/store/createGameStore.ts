'use client';
import { create } from 'zustand';
import {
  replay,
  validateEvent,
  type Content,
  type GameEvent,
  type Memory,
} from '../engine';
import { CURRENT_SCHEMA_VERSION } from '../persistence/migrations';
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
    // Required when the timeline inherits an earlier one.
    inherited?: { fromRunId: string; memory: Memory };
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

  type StartOptions = Parameters<GameStore['start']>[0];
  return create<GameStore>((set, get) => {
    async function begin(options: StartOptions) {
      if (!options?.replaceExisting) {
        const existing = await adapter.load();
        if (existing) {
          set({ save: existing, loaded: true, error: null });
          return;
        }
      }
      if (content.inherits && !options?.inherited)
        throw new Error('Cette partie commence après la précédente.');
      const now = Date.now();
      const events: GameEvent[] = [
        {
          type: 'run_started',
          id: crypto.randomUUID(),
          at: now,
          contentVersion: content.version,
        },
      ];
      if (content.inherits && options?.inherited)
        events.push({
          type: 'memory_inherited',
          id: crypto.randomUUID(),
          at: now,
          fromTimelineId: content.inherits.timelineId,
          fromRunId: options.inherited.fromRunId,
          memory: options.inherited.memory,
        });
      const pseudonym = options?.pseudonym?.trim().slice(0, 64) || undefined;
      const save: SaveGame = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        timelineId: content.timelineId as SaveGame['timelineId'],
        contentVersion: content.version,
        runId: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        events,
        settings: { ...defaultSettings },
        ...(pseudonym !== undefined ? { pseudonym } : {}),
        ...(options?.reportingConsent !== undefined
          ? { reportingConsent: options.reportingConsent }
          : {}),
      };
      if (options?.replaceExisting) await adapter.replace(save);
      else await persist(save);
      set({ save, loaded: true, error: null });
    }
    return {
      save: null,
      loaded: false,
      error: null,
      hydrate: () =>
        enqueue(async () => {
          try {
            let save = await adapter.load();
            if (save && save.reportingStatus === 'sending') {
              const corrected: SaveGame = {
                ...save,
                reportingStatus: 'failed',
              };
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
          try {
            await begin(options);
          } catch (error) {
            // A refused start must be visible; the original save stays intact.
            set({
              loaded: true,
              error: error instanceof Error ? error.message : String(error),
            });
            throw error;
          }
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
    };
  });
}
