import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import {
  listRecoveryCopies,
  SAVE_KEY,
} from '../../src/persistence/localStorageAdapter';
import { useT2GameStore } from '../../src/store/gameStoreT2';
import { SAVE_KEY_T2 } from '../../src/persistence/localStorageAdapter';
import { content } from '../../src/content';
import { contentT2 } from '../../src/content/t2';
import { buildMemory, replay } from '../../src/engine';
import { event, played, saveFixture, storageFixture } from './fixtures';

beforeEach(() => {
  storageFixture();
  useGameStore.setState({ save: null, loaded: false, error: null });
  useT2GameStore.setState({ save: null, loaded: false, error: null });
});
afterEach(() => vi.unstubAllGlobals());

it.each([false, true])(
  'start preserves an existing run (completed=%s), even before hydration',
  async (completed) => {
    const save = saveFixture(
      completed
        ? [
            ...played('t1.coda', 'sortir'),
            event({ type: 'run_completed', timelineId: 't1' }),
          ]
        : [],
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
    useGameStore.getState().append({
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

const completedRoom = () => {
  const events = saveFixture([
    ...played('t1.chambre-froide', 'dossier-a'),
    event({
      type: 'law_signed',
      lawNumber: 1,
      principleId: 'P_INNOCENT',
      statementId: 'innocent.default',
      statementText: 'Une phrase signée ce jour-là.',
    }),
    ...played('t1.coda', 'sortir'),
    event({ type: 'run_completed', timelineId: 't1' }),
  ]).events;
  return replay(events, content);
};

it('starts the house from a frozen memory of the room, on a fresh device', async () => {
  // Regression: this start threw IncompatibleSaveError and wrote nothing.
  const memory = buildMemory(completedRoom(), content, 'Dans la pièce');
  await useT2GameStore.getState().start({
    pseudonym: 'Atlas',
    reportingConsent: true,
    inherited: { fromRunId: 'room-run', memory },
  });
  const save = useT2GameStore.getState().save!;
  expect(save.timelineId).toBe('t2');
  expect(save.events.map((e) => e.type)).toEqual([
    'run_started',
    'memory_inherited',
  ]);
  expect(JSON.parse(localStorage.getItem(SAVE_KEY_T2)!)).toEqual(save);
  const house = replay(save.events, contentT2);
  expect(house.laws[0]).toMatchObject({
    number: 1,
    inheritedFrom: 't1',
    statementText: 'Une phrase signée ce jour-là.',
    origin: { text: 'Dans la pièce, tu as transmis le dossier A au bloc.' },
  });
  expect(house.choices['t1.chambre-froide']).toBe('dossier-a');
  expect(house.decisions).toBe(0);
});

it('refuses to open the house without the room, and says so', async () => {
  await expect(useT2GameStore.getState().start()).rejects.toThrow();
  expect(useT2GameStore.getState().error).toBeTruthy();
  expect(localStorage.getItem(SAVE_KEY_T2)).toBeNull();
  expect(() => buildMemory(replay([], content), content, 'x')).toThrow();
});
