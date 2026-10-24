import {
  rebirthContent,
  collectedDocuments,
  prologueConclusion,
} from '../../src/content/rebirth';
import { auditContent, replay } from '../../src/engine';
import { simulateTalkRun } from '../../scripts/simulation-talk';
import { seeded } from '../../scripts/simulation';
import { migrateSave } from '../../src/persistence/migrations';
import { defaultSettings } from '../../src/persistence/SaveAdapter';
import { readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
import { content } from '../../src/content';
import { sceneSchema } from '../../src/engine/schema';
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
