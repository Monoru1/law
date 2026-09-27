import { vi } from 'vitest';
import { content } from '../../src/content';
import type { Content, GameEvent } from '../../src/engine';
import { CURRENT_SCHEMA_VERSION } from '../../src/persistence/migrations';
import {
  defaultSettings,
  type SaveGame,
} from '../../src/persistence/SaveAdapter';

let serial = 0;
export type Draft = GameEvent extends infer E
  ? E extends GameEvent
    ? Omit<E, 'id' | 'at'>
    : never
  : never;
export const event = (draft: Draft): GameEvent =>
  ({
    ...draft,
    id: `test-${++serial}`,
    at: serial,
  }) as GameEvent;
export const entered = (sceneId: string, timeline: Content = content) =>
  event({
    type: 'scene_entered',
    sceneId,
    sceneVersion: timeline.scenes.find((s) => s.id === sceneId)!.version,
  });
export const choice = (
  sceneId: string,
  value: string | number,
  timeline: Content = content,
): GameEvent => {
  const scene = timeline.scenes.find((scene) => scene.id === sceneId)!;
  const kind =
    scene.variants?.find((v) => v.input?.kind)?.input?.kind ?? scene.input.kind;
  return event({
    type: 'choice_locked',
    sceneId,
    sceneVersion: scene.version,
    input: kind,
    value,
    hesitationMs: 1,
    selectionChanges: 0,
  });
};
/** A decision as the player flow records it: inside its entered scene. */
export const played = (
  sceneId: string,
  value: string | number,
  timeline: Content = content,
): GameEvent[] => [
  entered(sceneId, timeline),
  choice(sceneId, value, timeline),
];
export const saveFixture = (
  events: GameEvent[] = [],
  timeline: Content = content,
): SaveGame => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  timelineId: timeline.timelineId as SaveGame['timelineId'],
  contentVersion: timeline.version,
  runId: 'original',
  createdAt: 1,
  updatedAt: 1,
  events: [
    event({ type: 'run_started', contentVersion: timeline.version }),
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
