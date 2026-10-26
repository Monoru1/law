import { expect, it } from 'vitest';
import { auditContent, buildMemory, replay } from '../../src/engine';
import { sceneSchema } from '../../src/engine/schema';
import { familyContent } from '../../src/content/sixieme-place';
import { familyContinuationContent as content } from '../../src/content/sixieme-place-suite';
import { simulateTalkRun } from '../../scripts/simulation-talk';
import { seeded } from '../../scripts/simulation';
import { migrateSave } from '../../src/persistence/migrations';
import { defaultSettings } from '../../src/persistence/SaveAdapter';

it('adds ten isolated scenes without changing an opening scene contract', () => {
  expect(auditContent(content, [familyContent])).toEqual([]);
  expect(content.scenes).toHaveLength(10);
  const old = new Set(familyContent.order);
  content.scenes.forEach((scene) => {
    expect(old.has(scene.id)).toBe(false);
    expect(sceneSchema.safeParse(scene).success).toBe(true);
  });
});

it('replays inherited choices, conditional injuries, evidence and deposition across 80 seeded nights', () => {
  const endings = new Set<string>();
  for (let seed = 1; seed <= 80; seed++) {
    const clock = { at: 0 };
    const first = simulateTalkRun(familyContent, seeded(seed), clock);
    const memory = buildMemory(first.state, familyContent, 'la maison');
    const original = structuredClone(memory);
    const run = simulateTalkRun(content, seeded(seed + 200), clock, {
      inherit: { timelineId: 't0', memory },
    });
    expect(memory).toEqual(original);
    expect(run.state.completed).toBe(true);
    const flags = run.state.flags;
    if (flags.includes('family.fall')) {
      expect(flags).toContain('family.pushed');
      expect(flags).not.toContain('family.safe-distance');
      expect(flags).toContain('family.near-stairs');
      endings.add('fall');
    } else endings.add('no-fall');
    if (flags.includes('family.blood-contact'))
      expect(flags).toContain('family.fall');
    expect(run.state.notes.some((note) => note.tags.includes('FAM-10'))).toBe(
      flags.includes('family.lucie-consent'),
    );
    expect(run.state.notes.some((note) => note.tags.includes('FAM-09'))).toBe(
      flags.includes('family.help-called'),
    );
    expect(replay(run.events, content)).toEqual(run.state);
    const save = migrateSave(
      {
        schemaVersion: 5,
        timelineId: 't0',
        contentVersion: content.version,
        runId: `continuation-${seed}`,
        createdAt: 0,
        updatedAt: clock.at,
        settings: defaultSettings,
        events: run.events,
      },
      content,
    );
    expect(save.events).toEqual(run.events);
  }
  expect([...endings].sort()).toEqual(['fall', 'no-fall']);
}, 30000);

it('an evasive night and a night with consensual testimony reach different Tribunal questions', () => {
  const play = (rand: () => number) => {
    const clock = { at: 0 };
    const first = simulateTalkRun(familyContent, rand, clock);
    return simulateTalkRun(content, rand, clock, {
      inherit: {
        timelineId: 't0',
        memory: buildMemory(first.state, familyContent, 'la maison'),
      },
    });
  };
  const evasive = play(() => 0.999);
  const informed = play(() => 0);
  expect(evasive.state.flags).toContain('family.avoided');
  expect(evasive.state.notes.some((note) => note.tags.includes('FAM-04'))).toBe(
    false,
  );
  expect(
    informed.state.notes.some((note) => note.tags.includes('FAM-10')),
  ).toBe(true);
  expect(evasive.nodes.has('tribunal.t0.deposition-retour/evitement')).toBe(
    true,
  );
  expect(informed.nodes.has('tribunal.t0.deposition-retour/consentement')).toBe(
    true,
  );
});
