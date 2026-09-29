import { readFileSync } from 'node:fs';
import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  localStorageAdapter,
  t2LocalStorageAdapter,
  SAVE_KEY,
  SAVE_KEY_T2,
  CorruptSaveError,
  SaveConflictError,
  listRecoveryCopies,
  exportRecoveryCopy,
  exportStoredSave,
  MAX_RECOVERY_COPIES,
} from '../../src/persistence/localStorageAdapter';
import { content } from '../../src/content';
import { contentT2 } from '../../src/content/t2';
import {
  contractRegistry,
  IncompatibleSaveError,
  migrateSave,
} from '../../src/persistence/migrations';
import { canonical, registryDrift, type GameEvent } from '../../src/engine';
import legacyContent from '../../src/persistence/legacy-content-v1.json';
import {
  choice,
  entered,
  event,
  played,
  saveFixture,
  storageFixture,
} from './fixtures';

afterEach(() => vi.unstubAllGlobals());

// Exact content identities embedded by saves that shipped: era A (84db105),
// the production playtest (17c614d) and the Timeline II commit (fd2e163).
const identity = (commit: string) =>
  readFileSync(
    new URL(`../fixtures/identity-${commit}.json`, import.meta.url),
    'utf8',
  );
const legacySave = (
  schemaVersion: 2 | 3,
  commit: string,
  events: GameEvent[],
) => ({
  schemaVersion,
  contentVersion: '1.0.0',
  contentIdentity: identity(commit),
  runId: `legacy-${commit}`,
  createdAt: 1,
  updatedAt: 2,
  events: [event({ type: 'run_started', contentVersion: '1.0.0' }), ...events],
  settings: {
    simpleConfirmation: true,
    reducedMotion: 'on',
    textSize: 'large',
    sound: false,
  },
  pseudonym: 'Atlas',
  reportingConsent: true,
  reportingStatus: 'sent',
});
const at = (sceneId: string, sceneVersion: number) =>
  event({ type: 'scene_entered', sceneId, sceneVersion });
const locked = (
  sceneId: string,
  sceneVersion: number,
  input: 'binary' | 'choice',
  value: string,
) =>
  event({
    type: 'choice_locked',
    sceneId,
    sceneVersion,
    input,
    value,
    hesitationMs: 900,
    selectionChanges: 1,
  });

describe('save compatibility is decided per scene contract', () => {
  it.each(['84db105', '17c614d', 'fd2e163'])(
    'keeps the %s identity byte-exact, as the shipped app wrote it',
    (commit) => {
      expect(identity(commit)).toBe(canonical(JSON.parse(identity(commit))));
    },
  );

  it('parses a current save with no pseudonym, reportingConsent or reportingStatus', () => {
    const save = saveFixture(played('t1.bouton', 'appuyer'));
    expect(migrateSave(save, content)).toEqual(save);
    expect(migrateSave(save, content).pseudonym).toBeUndefined();
    expect(migrateSave(save, content).reportingConsent).toBeUndefined();
    expect(migrateSave(save, content).reportingStatus).toBeUndefined();
  });

  it('keeps a save playable after a pure text edit of the content', () => {
    // Regression: every wording change used to make every save incompatible.
    const save = saveFixture(played('t1.bouton', 'appuyer'));
    const edited = structuredClone(content);
    edited.scenes[0]!.beats[0]!.text = 'Une autre pièce.';
    edited.scenes[0]!.title = 'Un autre titre';
    edited.principles[0]!.statements[0]!.text = 'Autre formulation.';
    expect(migrateSave(save, edited)).toEqual(save);
  });

  it('refuses a changed rule under an unchanged scene version', () => {
    const edited = structuredClone(content);
    const bouton = edited.scenes.find((s) => s.id === 't1.bouton')!;
    bouton.outcomes[0]!.effects = [{ setFlag: 'invented_consequence' }];
    expect(registryDrift(contractRegistry, [edited]).changed).toEqual([
      't1.bouton@1',
    ]);
    expect(registryDrift(contractRegistry, [content, contentT2])).toEqual({
      missing: [],
      changed: [],
    });
  });

  it('keeps a save recorded under a superseded scene version as incompatible, not corrupt', async () => {
    const { map } = storageFixture();
    const bumped = structuredClone(content);
    bumped.scenes.find((s) => s.id === 't1.bouton')!.version = 9;
    const save = saveFixture(played('t1.bouton', 'appuyer'));
    expect(() => migrateSave(save, bumped)).toThrow(IncompatibleSaveError);
    const removed = event({
      type: 'scene_entered',
      sceneId: 't1.scene-retiree',
      sceneVersion: 1,
    });
    const raw = JSON.stringify({ ...save, events: [...save.events, removed] });
    map.set(SAVE_KEY, raw);
    await expect(localStorageAdapter.load()).rejects.toBeInstanceOf(
      IncompatibleSaveError,
    );
    expect(map.get(SAVE_KEY)).toBe(raw);
    expect(listRecoveryCopies()).toHaveLength(0);
  });

  it('migrates schema 1 without changing events, settings, timestamps or run identity', () => {
    const events = [
      event({ type: 'run_started', contentVersion: '1.0.0' }),
      at('t1.bouton', 1),
      locked('t1.bouton', 1, 'binary', 'appuyer'),
    ];
    const v1 = {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      runId: 'v1-run',
      createdAt: 5,
      updatedAt: 6,
      events,
      settings: {
        simpleConfirmation: false,
        reducedMotion: 'auto',
        textSize: 'normal',
        sound: true,
      },
    };
    const migrated = migrateSave(v1, content);
    expect(migrated).toEqual({
      ...v1,
      schemaVersion: 4,
      timelineId: 't1',
    });
    expect(legacyContent.version).toBe('1.0.0');
  });

  it('migrates a production save (schema 2) and drops only the former passive decision', () => {
    const visit = at('t1.pas-encore', 1);
    const passive = locked('t1.pas-encore', 1, 'choice', 'continuer');
    const kept = [
      at('t1.bouton', 1),
      locked('t1.bouton', 1, 'binary', 'ne-pas-appuyer'),
      at('t1.le-protocole', 1),
      locked('t1.le-protocole', 1, 'binary', 'continuer'),
    ];
    const legacy = legacySave(2, '17c614d', [...kept, visit, passive]);
    const migrated = migrateSave(legacy, content);
    expect(migrated.events).not.toContainEqual(passive);
    expect(migrated.events).toContainEqual({ ...visit, sceneVersion: 2 });
    for (const item of kept) expect(migrated.events).toContainEqual(item);
    expect(migrated).toMatchObject({
      schemaVersion: 4,
      timelineId: 't1',
      runId: 'legacy-17c614d',
      createdAt: 1,
      updatedAt: 2,
      pseudonym: 'Atlas',
      reportingConsent: true,
      reportingStatus: 'sent',
      settings: { reducedMotion: 'on', textSize: 'large' },
    });
    expect(migrated).not.toHaveProperty('contentIdentity');
  });

  it('migrates a schema 3 save recorded by the Timeline II commit, now that its text changed', () => {
    const history = [
      ...[at('t1.bouton', 1), locked('t1.bouton', 1, 'binary', 'appuyer')],
      at('t1.pas-encore', 2),
      at('t1.coda', 2),
      locked('t1.coda', 2, 'choice', 'sortir'),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const migrated = migrateSave(legacySave(3, 'fd2e163', history), content);
    expect(migrated.events.slice(1)).toEqual(history);
  });

  it('resumes an early era-A save but refuses one whose scene rules changed without a version bump', () => {
    const early = legacySave(2, '84db105', [
      at('t1.bouton', 1),
      locked('t1.bouton', 1, 'binary', 'appuyer'),
      at('t1.dix-mille', 1),
    ]);
    expect(migrateSave(early, content).events).toEqual(early.events);
    // Era A scheduled le-retour after a scene that no longer exists.
    const reinterpreted = legacySave(2, '84db105', [
      at('t1.sept-annees', 1),
      locked('t1.sept-annees', 1, 'binary', 'sauver'),
    ]);
    expect(() => migrateSave(reinterpreted, content)).toThrow(
      IncompatibleSaveError,
    );
    const removed = legacySave(2, '84db105', [at('t1.levier', 1)]);
    expect(() => migrateSave(removed, content)).toThrow(IncompatibleSaveError);
    const unreadable = { ...early, contentIdentity: '{broken' };
    expect(() => migrateSave(unreadable, content)).toThrow(
      IncompatibleSaveError,
    );
  });

  it.each([0, 5, -1, '4'])(
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
});

describe('Timeline II persistence', () => {
  const memory = {
    completedAt: 1,
    decisions: 0,
    choices: {},
    justifications: {},
    flags: [],
    vars: {},
    evidence: {},
    laws: [],
    declinedLaws: [],
    relations: [],
    rules: [],
    certainty: {},
    contradictions: [],
  };
  const houseSave = () =>
    saveFixture(
      [
        event({
          type: 'memory_inherited',
          fromTimelineId: 't1',
          fromRunId: 'room',
          memory,
        }),
        ...played('t2.les-nouvelles', 'sem', contentT2),
      ],
      contentT2,
    );

  it('saves, reloads and extends a house journal with its own content', async () => {
    // Regression: the T2 adapter validated every T2 save against T1 content,
    // so Timeline II could never start ("Cette sauvegarde utilise une autre version").
    const { map } = storageFixture();
    const save = houseSave();
    await t2LocalStorageAdapter.save(save);
    expect(await t2LocalStorageAdapter.load()).toEqual(save);
    const next = {
      ...save,
      events: [...save.events, entered('t2.la-promesse', contentT2)],
    };
    await t2LocalStorageAdapter.save(next);
    expect(await t2LocalStorageAdapter.load()).toEqual(next);
    expect(map.has(SAVE_KEY)).toBe(false);
  });

  it('never reads one timeline journal as the other', async () => {
    const { map } = storageFixture();
    map.set(SAVE_KEY, JSON.stringify(houseSave()));
    await expect(localStorageAdapter.load()).rejects.toBeInstanceOf(
      IncompatibleSaveError,
    );
    map.set(SAVE_KEY_T2, JSON.stringify(saveFixture()));
    await expect(t2LocalStorageAdapter.load()).rejects.toBeInstanceOf(
      IncompatibleSaveError,
    );
  });

  it('requires the inherited memory first, once, and only known room scenes', () => {
    const save = houseSave();
    expect(() =>
      migrateSave(
        { ...save, events: [save.events[0]!, ...save.events.slice(2)] },
        contentT2,
      ),
    ).toThrow();
    expect(() =>
      migrateSave(
        { ...save, events: [...save.events.slice(0, 2), save.events[1]!] },
        contentT2,
      ),
    ).toThrow();
    const forged = structuredClone(save);
    (
      forged.events[1] as Extract<GameEvent, { type: 'memory_inherited' }>
    ).memory.choices['t2.les-nouvelles'] = 'sem';
    expect(() => migrateSave(forged, contentT2)).toThrow();
    const room = saveFixture([
      event({
        type: 'memory_inherited',
        fromTimelineId: 't1',
        fromRunId: 'room',
        memory,
      }),
    ]);
    expect(() => migrateSave(room, content)).toThrow();
  });
});

describe('historical truth at the load boundary', () => {
  it('rejects missing scenes, wrong options, input kinds, versions and duplicate IDs', () => {
    const valid = choice('t1.bouton', 'appuyer');
    for (const changed of [
      { ...valid, sceneId: 't1.scene-disparue' },
      { ...valid, value: 'option-qui-nexiste-pas' },
      { ...valid, input: 'glyph' },
      { ...valid, sceneVersion: 99 },
    ])
      expect(() =>
        migrateSave(
          saveFixture([entered('t1.bouton'), changed as typeof valid]),
          content,
        ),
      ).toThrow();
    expect(() =>
      migrateSave(saveFixture([entered('t1.bouton'), valid, valid]), content),
    ).toThrow();
    expect(() =>
      migrateSave(
        saveFixture([
          entered('t1.bouton'),
          valid,
          choice('t1.bouton', 'appuyer'),
        ]),
        content,
      ),
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
        content,
      ),
    ).toThrow();
    expect(() =>
      migrateSave(saveFixture(played('t1.combien', 100)), content),
    ).toThrow();
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
        content,
      ),
    ).toThrow();
  });

  it('refuses decisions outside their scene, premature completion and a second start', () => {
    // A choice for a scene the player never entered is impossible history.
    expect(() =>
      migrateSave(saveFixture([choice('t1.bouton', 'appuyer')]), content),
    ).toThrow();
    expect(() =>
      migrateSave(
        saveFixture([entered('t1.dix-mille'), choice('t1.bouton', 'appuyer')]),
        content,
      ),
    ).toThrow();
    // Completion only follows the final gesture.
    expect(() =>
      migrateSave(
        saveFixture([
          ...played('t1.bouton', 'appuyer'),
          event({ type: 'run_completed', timelineId: 't1' }),
        ]),
        content,
      ),
    ).toThrow();
    expect(() =>
      migrateSave(
        saveFixture([
          ...played('t1.coda', 'sortir'),
          event({ type: 'run_completed', timelineId: 't2' }),
        ]),
        content,
      ),
    ).toThrow();
    expect(() =>
      migrateSave(
        saveFixture([
          event({ type: 'run_started', contentVersion: content.version }),
        ]),
        content,
      ),
    ).toThrow();
    expect(() =>
      migrateSave(
        saveFixture([
          ...played('t1.coda', 'sortir'),
          event({ type: 'run_completed', timelineId: 't1' }),
          entered('t1.bouton'),
        ]),
        content,
      ),
    ).toThrow();
    expect(() =>
      migrateSave(
        saveFixture([
          ...played('t1.coda', 'sortir'),
          event({ type: 'run_completed', timelineId: 't1' }),
        ]),
        content,
      ),
    ).not.toThrow();
  });

  it('rejects unknown event types and unknown fields at the boundary', () => {
    const save = saveFixture();
    expect(() =>
      migrateSave(
        {
          ...save,
          events: [...save.events, { type: 'relation_event', id: 'x', at: 2 }],
        },
        content,
      ),
    ).toThrow();
  });
});

describe('local storage adapter', () => {
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

  it('verifies an archive before replacing an incompatible active save and deduplicates a retry', async () => {
    const { map, storage } = storageFixture();
    const oldRaw = JSON.stringify({ schemaVersion: 99, runId: 'old-city' });
    map.set(SAVE_KEY, oldRaw);
    const replacement = saveFixture();
    let refuseActiveWrite = true;
    storage.setItem.mockImplementation((key: string, value: string) => {
      if (key === SAVE_KEY && refuseActiveWrite)
        throw new Error('QuotaExceededError');
      map.set(key, value);
    });

    await expect(localStorageAdapter.replace(replacement)).rejects.toThrow(
      'QuotaExceededError',
    );
    expect(map.get(SAVE_KEY)).toBe(oldRaw);
    expect(listRecoveryCopies()).toHaveLength(1);
    expect(exportRecoveryCopy(listRecoveryCopies()[0]!.key)).toBe(oldRaw);

    refuseActiveWrite = false;
    await localStorageAdapter.replace(replacement);
    expect(listRecoveryCopies()).toHaveLength(1);
    expect(await localStorageAdapter.load()).toEqual(replacement);
  });

  it('keeps the active save when storage does not retain its archive', async () => {
    const { map, storage } = storageFixture();
    const oldRaw = JSON.stringify({ schemaVersion: 99, runId: 'old-city' });
    map.set(SAVE_KEY, oldRaw);
    storage.setItem.mockImplementation((key: string, value: string) => {
      if (key === SAVE_KEY) map.set(key, value);
    });

    await expect(localStorageAdapter.replace(saveFixture())).rejects.toThrow(
      'archive',
    );
    expect(map.get(SAVE_KEY)).toBe(oldRaw);
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
    await localStorageAdapter.replace({
      ...saveFixture(),
      runId: 'replacement',
    });
    const backup = listRecoveryCopies()[0]!;
    expect(backup.reason).toBe('replaced');
    expect(await localStorageAdapter.restore(backup.key)).toEqual(save);
    expect(await localStorageAdapter.load()).toEqual(save);
    map.set('unrelated', 'retained');
    map.set(SAVE_KEY_T2, 'house');
    await localStorageAdapter.clear();
    expect([...map.entries()]).toEqual([
      ['unrelated', 'retained'],
      [SAVE_KEY_T2, 'house'],
    ]);
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
      events: [...save.events, ...played('t1.bouton', 'appuyer')],
    };
    await localStorageAdapter.save(next);
    await expect(localStorageAdapter.save(save)).rejects.toBeInstanceOf(
      SaveConflictError,
    );
    await expect(
      localStorageAdapter.save({
        ...next,
        events: [
          save.events[0]!,
          entered('t1.bouton'),
          choice('t1.bouton', 'ne-pas-appuyer'),
        ],
      }),
    ).rejects.toThrow();
    expect(await localStorageAdapter.load()).toEqual(next);
  });
});
