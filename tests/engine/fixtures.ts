import { vi } from 'vitest';
import { content } from '../../src/content';
import type { GameEvent } from '../../src/engine';
import {
  contentIdentity,
  CURRENT_SCHEMA_VERSION,
} from '../../src/persistence/migrations';
import {
  defaultSettings,
  type SaveGame,
} from '../../src/persistence/SaveAdapter';

let serial = 0;
type Draft = GameEvent extends infer E
  ? E extends GameEvent
    ? Omit<E, 'id' | 'at'>
    : never
  : never;
export const event = (draft: Draft): GameEvent => ({
  ...draft,
  id: `test-${++serial}`,
  at: serial,
});
export const choice = (sceneId: string, value: string | number): GameEvent => {
  const scene = content.scenes.find((scene) => scene.id === sceneId)!;
  return event({
    type: 'choice_locked',
    sceneId,
    sceneVersion: scene.version,
    input: scene.input.kind,
    value,
    hesitationMs: 1,
    selectionChanges: 0,
  });
};
export const saveFixture = (events: GameEvent[] = []): SaveGame => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  contentVersion: content.version,
  contentIdentity: contentIdentity(content),
  runId: 'original',
  createdAt: 1,
  updatedAt: 1,
  events: [
    event({ type: 'run_started', contentVersion: content.version }),
    ...events,
  ],
  settings: { ...defaultSettings },
});
export function storageFixture() {
  const map = new Map<string, string>();
  const storage = {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => {
      map.set(key, value);
    }),
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
  vi.stubGlobal('localStorage', storage);
  return { map, storage };
}
