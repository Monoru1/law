import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import {
  listRecoveryCopies,
  SAVE_KEY,
} from '../../src/persistence/localStorageAdapter';
import { event, saveFixture, storageFixture } from './fixtures';

beforeEach(() => {
  storageFixture();
  useGameStore.setState({ save: null, loaded: false, error: null });
});
afterEach(() => vi.unstubAllGlobals());

it.each([false, true])(
  'start preserves an existing run (completed=%s), even before hydration',
  async (completed) => {
    const save = saveFixture(
      completed ? [event({ type: 'run_completed', timelineId: 't1' })] : [],
    );
    const raw = JSON.stringify(save);
    localStorage.setItem(SAVE_KEY, raw);
    await useGameStore.getState().start();
    expect(localStorage.getItem(SAVE_KEY)).toBe(raw);
    expect(useGameStore.getState().save).toEqual(save);
  },
);

it('requires explicit replacement, then allows restoration of the archived run', async () => {
  await useGameStore.getState().start();
  const first = useGameStore.getState().save;
  await useGameStore.getState().start({ replaceExisting: true });
  expect(useGameStore.getState().save?.runId).not.toBe(first?.runId);
  await useGameStore.getState().restore(listRecoveryCopies()[0]!.key);
  expect(useGameStore.getState().save).toEqual(first);
});

it('cannot bypass a corrupt save by starting after failed hydration', async () => {
  localStorage.setItem(SAVE_KEY, '{broken');
  await useGameStore.getState().hydrate();
  expect(useGameStore.getState().error).toBeTruthy();
  await expect(useGameStore.getState().start()).rejects.toThrow();
  expect(localStorage.getItem(SAVE_KEY)).toBe('{broken');
});

it('serializes simultaneous starts and appends, and rejects invalid choices before writing', async () => {
  await Promise.all([
    useGameStore.getState().start(),
    useGameStore.getState().start(),
  ]);
  expect(useGameStore.getState().save?.events).toHaveLength(1);
  await Promise.all([
    useGameStore
      .getState()
      .append({ type: 'scene_entered', sceneId: 't1.bouton', sceneVersion: 1 }),
    useGameStore
      .getState()
      .append({ type: 'scene_skipped', sceneId: 't1.bouton' }),
  ]);
  expect(useGameStore.getState().save?.events).toHaveLength(3);
  const raw = localStorage.getItem(SAVE_KEY);
  await expect(
    useGameStore
      .getState()
      .append({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: 1,
        input: 'binary',
        value: 'invented',
        hesitationMs: 0,
        selectionChanges: 0,
      }),
  ).rejects.toThrow();
  expect(localStorage.getItem(SAVE_KEY)).toBe(raw);
});
