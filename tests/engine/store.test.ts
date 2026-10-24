import { rebirthContent } from '../../src/content/rebirth';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import {
  listRecoveryCopies,
  SAVE_KEY,
} from '../../src/persistence/localStorageAdapter';
import { useT2GameStore } from '../../src/store/gameStoreT2';
import { SAVE_KEY_T2 } from '../../src/persistence/localStorageAdapter';
import { content } from '../../src/content';
import { contentT0 } from '../../src/content/t0';
import { contentT3 } from '../../src/content/t3';
import { createGameStore } from '../../src/store/createGameStore';
import { createLocalStorageAdapter } from '../../src/persistence/localStorageAdapter';
import { simulateTalkRun } from '../../scripts/simulation-talk';
import { seeded, simulateJourney3 } from '../../scripts/simulation';
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

it('opens the house from a room finished before this version, keeping its words', async () => {
  const { readFileSync } = await import('node:fs');
  const { migrateSave } = await import('../../src/persistence/migrations');
  const identity = readFileSync(
    new URL('../fixtures/identity-17c614d.json', import.meta.url),
    'utf8',
  );
  let n = 0;
  const e = (draft: Record<string, unknown>) =>
    ({ ...draft, id: `p-${++n}`, at: n }) as never;
  const legacy = {
    schemaVersion: 2,
    contentVersion: '1.0.0',
    contentIdentity: identity,
    runId: 'production-player',
    createdAt: 1,
    updatedAt: 1,
    settings: {
      simpleConfirmation: false,
      reducedMotion: 'auto',
      textSize: 'normal',
      sound: false,
    },
    events: [
      e({ type: 'run_started', contentVersion: '1.0.0' }),
      e({ type: 'scene_entered', sceneId: 't1.pourquoi', sceneVersion: 1 }),
      e({
        type: 'justification_given',
        sceneId: 't1.pourquoi',
        text: 'Mes mots.',
      }),
      e({
        type: 'choice_locked',
        sceneId: 't1.pourquoi',
        sceneVersion: 1,
        input: 'freeText',
        value: 'written',
        hesitationMs: 1,
        selectionChanges: 0,
      }),
      e({
        type: 'scene_entered',
        sceneId: 't1.chambre-froide',
        sceneVersion: 1,
      }),
      e({
        type: 'choice_locked',
        sceneId: 't1.chambre-froide',
        sceneVersion: 1,
        input: 'binary',
        value: 'dossier-b',
        hesitationMs: 1,
        selectionChanges: 0,
      }),
      e({
        type: 'law_signed',
        lawNumber: 1,
        principleId: 'P_NOMBRE',
        statementId: 'nombre.default',
      }),
      e({ type: 'scene_entered', sceneId: 't1.pas-encore', sceneVersion: 1 }),
      e({
        type: 'choice_locked',
        sceneId: 't1.pas-encore',
        sceneVersion: 1,
        input: 'choice',
        value: 'continuer',
        hesitationMs: 1,
        selectionChanges: 0,
      }),
      e({ type: 'scene_entered', sceneId: 't1.coda', sceneVersion: 2 }),
      e({
        type: 'choice_locked',
        sceneId: 't1.coda',
        sceneVersion: 2,
        input: 'choice',
        value: 'sortir',
        hesitationMs: 1,
        selectionChanges: 0,
      }),
      e({ type: 'run_completed', timelineId: 't1' }),
    ],
  };
  const room = migrateSave(legacy, content);
  const memory = buildMemory(
    replay(room.events, content),
    content,
    'Dans la pièce',
  );
  expect(memory.justifications['t1.pourquoi']).toBe('Mes mots.');
  expect(memory.laws[0]).toMatchObject({
    statementText:
      'Quand je dois choisir, le nombre de vies compte plus que la manière.',
    origin: { text: 'Dans la pièce, tu as transmis le dossier B au bloc.' },
  });
  await useT2GameStore
    .getState()
    .start({ inherited: { fromRunId: room.runId, memory } });
  expect(useT2GameStore.getState().save?.events[1]).toMatchObject({
    type: 'memory_inherited',
    fromRunId: 'production-player',
  });
});

it('prepares the Tribunal with primary exam memory and one transitive city memory', async () => {
  const exam = simulateTalkRun(contentT0, seeded(13), { at: 1 });
  const journey = simulateJourney3(content, contentT2, contentT3, seeded(13), {
    at: 1,
  });
  const target = {
    ...contentT2,
    timelineId: 't4',
    scenes: [],
    order: [],
    principles: contentT0.principles,
    inherits: {
      timelineId: 't0',
      sceneIds: contentT0.scenes.map((scene) => scene.id),
      place: 'Dans l’examen',
    },
    alsoInherits: [
      {
        timelineId: 't3',
        sceneIds: [
          ...content.scenes,
          ...contentT2.scenes,
          ...contentT3.scenes,
        ].map((scene) => scene.id),
        place: 'Dans la ville',
      },
    ],
  };
  const adapter = createLocalStorageAdapter('test:tribunal', target);
  const store = createGameStore(adapter, target);
  const primary = {
    fromRunId: 'exam-source',
    memory: buildMemory(exam.state, contentT0, 'Dans l’examen'),
  };
  const city = {
    fromTimelineId: 't3',
    fromRunId: 'city-source',
    memory: buildMemory(journey.city.state, contentT3, 'Dans la ville'),
  };
  await store.getState().start({ inherited: primary, alsoInherited: [city] });
  const saved = store.getState().save!;
  expect(saved.events.map((event) => event.type)).toEqual([
    'run_started',
    'memory_inherited',
    'memory_inherited',
  ]);
  const state = replay(saved.events, target);
  expect(state.notes).toEqual(exam.state.notes);
  expect(state.choices).toEqual({
    ...exam.state.choices,
    ...journey.city.state.choices,
  });
  expect(state.rules).toEqual(journey.city.state.rules);
  expect(state.relations).toEqual([
    ...exam.state.relations,
    ...journey.city.state.relations,
  ]);
  expect((await adapter.load())?.events).toEqual(saved.events);
  primary.memory.notes?.splice(0);
  expect(replay(saved.events, target).notes).toEqual(exam.state.notes);
  const before = localStorage.getItem('test:tribunal');
  await store.getState().start({ inherited: primary, alsoInherited: [city] });
  expect(localStorage.getItem('test:tribunal')).toBe(before);
  const invalidAdapter = createLocalStorageAdapter(
    'test:tribunal-invalid',
    target,
  );
  const invalidStore = createGameStore(invalidAdapter, target);
  await expect(
    invalidStore
      .getState()
      .start({ inherited: primary, alsoInherited: [city, city] }),
  ).rejects.toThrow();
  expect(localStorage.getItem('test:tribunal-invalid')).toBeNull();
});

it('isolates the Rebirth campaign and archives an incompatible journal before replacement', async () => {
  const old = simulateTalkRun(contentT0, seeded(7), { at: 1 });
  const raw = JSON.stringify({
    schemaVersion: 5,
    timelineId: 't0',
    contentVersion: contentT0.version,
    runId: 'legacy-exam',
    createdAt: 1,
    updatedAt: 2,
    settings: {
      simpleConfirmation: false,
      reducedMotion: 'auto',
      textSize: 'normal',
      sound: false,
    },
    events: old.events,
  });
  localStorage.setItem('thelaw:save-t0', raw);
  const key = 'thelaw:rebirth:save-t0';
  const adapter = createLocalStorageAdapter(key, rebirthContent);
  const store = createGameStore(adapter, rebirthContent);
  await store.getState().start();
  expect(localStorage.getItem('thelaw:save-t0')).toBe(raw);
  expect(store.getState().save?.events).toHaveLength(1);
  await store.getState().clear();
  localStorage.setItem(key, raw);
  await store.getState().hydrate();
  expect(store.getState().incompatible).toBe(true);
  expect(localStorage.getItem(key)).toBe(raw);
  await expect(store.getState().start()).rejects.toThrow();
  await store.getState().start({ replaceExisting: true });
  const copies = listRecoveryCopies(key);
  expect(copies).toHaveLength(1);
  expect(localStorage.getItem(copies[0]!.key)).toBe(raw);
  expect(localStorage.getItem('thelaw:save-t0')).toBe(raw);
  await store.getState().settings({ sound: true, volume: 0.25 });
  expect((await adapter.load())?.settings.volume).toBe(0.25);
});
