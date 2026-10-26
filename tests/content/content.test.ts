import {
  rebirthContent,
  collectedDocuments,
  prologueConclusion,
} from '../../src/content/rebirth';
import { tribunalContent } from '../../src/content/tribunal';
import { familyContent } from '../../src/content/sixieme-place';
import { auditContent, replay } from '../../src/engine';
import { simulateTalkRun } from '../../scripts/simulation-talk';
import { seeded } from '../../scripts/simulation';
import { migrateSave } from '../../src/persistence/migrations';
import { defaultSettings } from '../../src/persistence/SaveAdapter';
import { readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
import { content } from '../../src/content';
import { sceneSchema } from '../../src/engine/schema';
import { stageActions } from '../../src/content/environments';
it('physical interactions expose only replies already allowed by the engine', () => {
  expect(stageActions('table', [], false)).toEqual([]);
  expect(
    stageActions(
      'table',
      [{ id: 'assiette', label: 'Examiner', next: 'place' }],
      false,
    ),
  ).toMatchObject([
    { id: 'sixth-plate', label: 'Examiner', replyId: 'assiette' },
  ]);
  expect(
    stageActions('tribunal', [], false).some((action) => action.href),
  ).toBe(false);
  expect(
    stageActions('tribunal', [], true).find((action) => action.id === 'dossier')
      ?.href,
  ).toBe('/jouer/sixieme-place');
});
it('validates all scene contracts and stable IDs', () => {
  expect(new Set(content.scenes.map((s) => s.id)).size).toBe(
    content.scenes.length,
  );
  content.scenes.forEach((scene) =>
    expect(sceneSchema.safeParse(scene).success).toBe(true),
  );
  expect(content.order).toHaveLength(8);
});

it('never models passive narrative progression as a one-option decision', () => {
  const passiveLabels =
    /^(afficher la suite|continuer|suivant|voir la suite)$/i;
  const passiveChoices = content.scenes.filter(
    (scene) =>
      scene.input.kind === 'choice' &&
      scene.input.options.length === 1 &&
      passiveLabels.test(scene.input.options[0]?.label.trim() ?? ''),
  );

  expect(passiveChoices.map((scene) => scene.id)).toEqual([]);
});

it('the new prologue has isolated scene IDs and a resolvable, deterministic investigation', () => {
  expect(auditContent(rebirthContent)).toEqual([]);
  rebirthContent.scenes.forEach((scene) =>
    expect(sceneSchema.safeParse(scene).success).toBe(true),
  );
  expect(
    rebirthContent.scenes.every((scene) => scene.id.startsWith('rebirth.')),
  ).toBe(true);
  const contacts = new Set<string>();
  const clock = { at: 0 };
  for (let seed = 1; seed <= 150; seed++) {
    const run = simulateTalkRun(rebirthContent, seeded(seed), clock, {
      skipRate: seed % 7 === 0 ? 0.3 : 0,
    });
    const save = migrateSave(
      {
        schemaVersion: 5,
        timelineId: 't0',
        contentVersion: rebirthContent.version,
        runId: `rb-${seed}`,
        createdAt: 0,
        updatedAt: 1,
        settings: defaultSettings,
        events: run.events,
      },
      rebirthContent,
    );
    expect(replay(save.events, rebirthContent)).toEqual(run.state);
    expect(run.state.completed).toBe(true);
    for (const contact of ['nora', 'keller', 'alone'])
      if (run.state.flags.includes(`rebirth.contact.${contact}`))
        contacts.add(contact);
    for (const document of collectedDocuments(run.state))
      expect(
        run.state.notes.some(
          (note) => note.tags.includes(document.id) && note.status === 'fact',
        ),
      ).toBe(true);
    if (!run.state.flags.includes('rebirth.altered'))
      expect(prologueConclusion(run.state)[0]).toContain('reste à établir');
    if (run.state.flags.includes('rebirth.hypothesis.elise'))
      expect(
        run.state.notes.find((note) =>
          note.tags.includes('rebirth.hypothesis.elise'),
        )?.status,
      ).toBe('inference');
  }
  expect([...contacts].sort()).toEqual(['alone', 'keller', 'nora']);
});

it('the tribunal opening has isolated scene IDs and a resolvable, deterministic first audience', () => {
  expect(auditContent(tribunalContent)).toEqual([]);
  tribunalContent.scenes.forEach((scene) =>
    expect(sceneSchema.safeParse(scene).success).toBe(true),
  );
  expect(
    tribunalContent.scenes.every((scene) => scene.id.startsWith('tribunal.')),
  ).toBe(true);
  // No scene from this new campaign shares an ID with the rebirth prologue
  // or the historical t0-t3 timelines: three independent journals, never one
  // silently overwriting another.
  const other = new Set([...rebirthContent.scenes.map((s) => s.id)]);
  expect(tribunalContent.scenes.some((scene) => other.has(scene.id))).toBe(
    false,
  );
  const stances = new Set<string>();
  for (let seed = 1; seed <= 150; seed++) {
    const run = simulateTalkRun(
      tribunalContent,
      seeded(seed),
      { at: 0 },
      { skipRate: seed % 7 === 0 ? 0.3 : 0 },
    );
    const save = migrateSave(
      {
        schemaVersion: 5,
        timelineId: 't0',
        contentVersion: tribunalContent.version,
        runId: `tr-${seed}`,
        createdAt: 0,
        updatedAt: 1,
        settings: defaultSettings,
        events: run.events,
      },
      tribunalContent,
    );
    expect(replay(save.events, tribunalContent)).toEqual(run.state);
    expect(run.state.completed).toBe(true);
    for (const note of run.state.notes)
      if (note.tags.includes('tribunal-ouverture')) stances.add(note.kind);
  }
  // Every one of the opening's three answers (ask, contest, silence) is
  // actually reachable across seeded runs, each recorded as its own fact —
  // never interpreted into a profile.
  expect([...stances].sort()).toEqual(['question', 'refusal', 'silence']);
});

it('La Sixième Place (chapter one) is resolvable, deterministic and isolated from the Tribunal opening', () => {
  expect(auditContent(familyContent)).toEqual([]);
  familyContent.scenes.forEach((scene) =>
    expect(sceneSchema.safeParse(scene).success).toBe(true),
  );
  // Both campaigns share the tribunal.t0.* namespace (see
  // src/content/sixieme-place.ts and src/content/tribunal.ts) and the same
  // contract registry file; nothing here may collide with the opening's own
  // scene IDs.
  const openingIds = new Set(tribunalContent.scenes.map((s) => s.id));
  expect(familyContent.scenes.some((scene) => openingIds.has(scene.id))).toBe(
    false,
  );
  for (let seed = 1; seed <= 150; seed++) {
    const run = simulateTalkRun(
      familyContent,
      seeded(seed),
      { at: 0 },
      { skipRate: seed % 7 === 0 ? 0.3 : 0 },
    );
    const save = migrateSave(
      {
        schemaVersion: 5,
        timelineId: 't0',
        contentVersion: familyContent.version,
        runId: `fam-${seed}`,
        createdAt: 0,
        updatedAt: 1,
        settings: defaultSettings,
        events: run.events,
      },
      familyContent,
    );
    expect(replay(save.events, familyContent)).toEqual(run.state);
    expect(run.state.completed).toBe(true);
  }
});

it('ships distinct visible environments and non-silent, locally authored sound assets', () => {
  const root = new URL('../../public/rebirth/', import.meta.url);
  const apartment = readFileSync(new URL('apartment.webp', root));
  const school = readFileSync(new URL('school.webp', root));
  expect(apartment.equals(school)).toBe(false);
  for (const name of [
    'rain',
    'school-air',
    'score',
    'paper',
    'door',
    'steps',
    'phone',
    'electric',
    'clock',
    'message',
    'message-intro',
  ]) {
    const file = readFileSync(new URL(`${name}.wav`, root));
    expect(file.toString('ascii', 0, 4)).toBe('RIFF');
    const data = file.indexOf(Buffer.from('data'));
    expect(data).toBeGreaterThan(0);
    let energy = 0;
    const end = Math.min(file.length, data + 8 + file.readUInt32LE(data + 4));
    for (let cursor = data + 8; cursor + 1 < end; cursor += 2)
      energy += Math.abs(file.readInt16LE(cursor));
    expect(energy / ((end - data - 8) / 2), name).toBeGreaterThan(15);
    expect(file.length).toBeLessThan(1_000_000);
  }
});
