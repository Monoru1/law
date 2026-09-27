import { afterEach, it, expect, vi } from 'vitest';
import {
  localStorageAdapter,
  SAVE_KEY,
  CorruptSaveError,
  SaveConflictError,
  listRecoveryCopies,
  exportRecoveryCopy,
  exportStoredSave,
  MAX_RECOVERY_COPIES,
} from '../../src/persistence/localStorageAdapter';
import { content } from '../../src/content';
import {
  contentIdentity,
  IncompatibleSaveError,
  migrateSave,
} from '../../src/persistence/migrations';
import legacyContent from '../../src/persistence/legacy-content-v1.json';
import { choice, event, saveFixture, storageFixture } from './fixtures';

afterEach(() => vi.unstubAllGlobals());

it('parses a legacy save with no pseudonym, reportingConsent or reportingStatus', () => {
  const legacy = saveFixture([choice('t1.bouton', 'appuyer')]);
  expect(migrateSave(legacy)).toEqual(legacy);
  expect(migrateSave(legacy).pseudonym).toBeUndefined();
  expect(migrateSave(legacy).reportingConsent).toBeUndefined();
  expect(migrateSave(legacy).reportingStatus).toBeUndefined();
});

it('migrates v1 without changing events, settings, timestamps or run identity', () => {
  const current = saveFixture([choice('t1.bouton', 'appuyer')]);
  const { contentIdentity: omitted, ...legacy } = current;
  expect(omitted).toBe(contentIdentity(content));
  expect(contentIdentity(legacyContent as typeof content)).toBe(
    contentIdentity(content),
  );
  expect(migrateSave({ ...legacy, schemaVersion: 1 })).toEqual(current);
});

it.each([0, 3, -1, '2'])(
  'retains unsupported schema %s without calling it corruption',
  async (schemaVersion) => {
    const { map } = storageFixture();
    const raw = JSON.stringify({ ...saveFixture(), schemaVersion });
    map.set(SAVE_KEY, raw);
    await expect(localStorageAdapter.load()).rejects.toBeInstanceOf(
      IncompatibleSaveError,
    );
    expect(map.get(SAVE_KEY)).toBe(raw);
    expect(listRecoveryCopies()).toHaveLength(0);
  },
);

it('rejects changed content, including same-version edits', () => {
  const save = saveFixture();
  expect(() =>
    migrateSave({ ...save, contentVersion: '0.0.1-jamais-publiee' }),
  ).toThrow(IncompatibleSaveError);
  const edited = structuredClone(content);
  edited.principles[0]!.statements[0]!.text = 'Autre formulation.';
  expect(() => migrateSave(save, edited)).toThrow(IncompatibleSaveError);
  const { contentIdentity: omitted, ...legacy } = save;
  expect(omitted).toBeTruthy();
  expect(() => migrateSave({ ...legacy, schemaVersion: 1 }, edited)).toThrow(
    IncompatibleSaveError,
  );
});

it('rejects missing scenes, wrong options, input kinds, versions and duplicate IDs', () => {
  const valid = choice('t1.bouton', 'appuyer');
  for (const changed of [
    { ...valid, sceneId: 't1.scene-disparue' },
    { ...valid, value: 'option-qui-nexiste-pas' },
    { ...valid, input: 'glyph' },
    { ...valid, sceneVersion: 99 },
  ])
    expect(() => migrateSave(saveFixture([changed as typeof valid]))).toThrow();
  expect(() => migrateSave(saveFixture([valid, valid]))).toThrow();
  expect(() =>
    migrateSave(saveFixture([valid, choice('t1.bouton', 'appuyer')])),
  ).toThrow();
  expect(() =>
    migrateSave(
      saveFixture([
        event({
          type: 'confrontation_answered',
          lawNumber: null,
          answer: 'silence',
        }),
      ]),
    ),
  ).toThrow();
  expect(() => migrateSave(saveFixture([choice('t1.combien', 100)]))).toThrow();
  expect(() =>
    migrateSave(
      saveFixture([
        event({
          type: 'law_signed',
          lawNumber: 1,
          principleId: 'P_NOMBRE',
          statementId: 'inexistant',
        }),
      ]),
    ),
  ).toThrow();
});

it('keeps corrupt originals and deduplicates recovery copies on reload', async () => {
  const { map } = storageFixture();
  map.set(SAVE_KEY, '{broken');
  for (let i = 0; i < 3; i++)
    await expect(localStorageAdapter.load()).rejects.toBeInstanceOf(
      CorruptSaveError,
    );
  expect(map.get(SAVE_KEY)).toBe('{broken');
  expect(exportStoredSave()).toBe('{broken');
  expect(listRecoveryCopies()).toHaveLength(1);
  expect(exportRecoveryCopy(listRecoveryCopies()[0]!.key)).toBe('{broken');
  await expect(
    localStorageAdapter.restore(listRecoveryCopies()[0]!.key),
  ).rejects.toThrow();
  expect(map.get(SAVE_KEY)).toBe('{broken');
});

it('preserves the original when backup or replacement exceeds storage quota', async () => {
  const { map, storage } = storageFixture();
  map.set(SAVE_KEY, '{broken');
  storage.setItem.mockImplementation(() => {
    throw new Error('QuotaExceededError');
  });
  await expect(localStorageAdapter.load()).rejects.toBeInstanceOf(
    CorruptSaveError,
  );
  await expect(localStorageAdapter.replace(saveFixture())).rejects.toThrow(
    'QuotaExceededError',
  );
  expect(map.get(SAVE_KEY)).toBe('{broken');
});

it('bounds copies, restores valid copies and clears all player data explicitly', async () => {
  const { map } = storageFixture();
  for (let i = 0; i < 8; i++) {
    map.set(SAVE_KEY, `broken-${i}`);
    await expect(localStorageAdapter.load()).rejects.toThrow();
  }
  expect(listRecoveryCopies()).toHaveLength(MAX_RECOVERY_COPIES);
  map.delete(SAVE_KEY);
  const save = saveFixture();
  await localStorageAdapter.save(save);
  expect(await localStorageAdapter.load()).toEqual(save);
  await localStorageAdapter.replace({ ...saveFixture(), runId: 'replacement' });
  const backup = listRecoveryCopies()[0]!;
  expect(backup.reason).toBe('replaced');
  expect(await localStorageAdapter.restore(backup.key)).toEqual(save);
  expect(await localStorageAdapter.load()).toEqual(save);
  map.set('unrelated', 'retained');
  await localStorageAdapter.clear();
  expect([...map.entries()]).toEqual([['unrelated', 'retained']]);
});

it('refuses implicit replacement, event tampering and stale journal writes', async () => {
  storageFixture();
  const save = saveFixture();
  await localStorageAdapter.save(save);
  await expect(
    localStorageAdapter.save({ ...save, runId: 'other' }),
  ).rejects.toBeInstanceOf(SaveConflictError);
  const next = {
    ...save,
    events: [...save.events, choice('t1.bouton', 'appuyer')],
  };
  await localStorageAdapter.save(next);
  await expect(localStorageAdapter.save(save)).rejects.toBeInstanceOf(
    SaveConflictError,
  );
  await expect(
    localStorageAdapter.save({
      ...next,
      events: [save.events[0]!, choice('t1.bouton', 'ne-pas-appuyer')],
    }),
  ).rejects.toThrow();
  expect(await localStorageAdapter.load()).toEqual(next);
});
