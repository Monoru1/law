import { describe, expect, it } from 'vitest';
import {
  beatDelay,
  completionDelay,
  outcomeCadence,
  REST_SETTLE_MS,
  replay,
  transitionHold,
  visitStage,
  type GameEvent,
} from '../../src/engine';
import { content } from '../../src/content';
import { contentT2 } from '../../src/content/t2';

describe('narrative pacing', () => {
  it('keeps ordinary beat progression brisk and bounded', () => {
    expect(beatDelay({ text: 'Court.' })).toBeGreaterThanOrEqual(420);
    expect(beatDelay({ text: 'x'.repeat(400) })).toBeLessThanOrEqual(1150);
  });

  it('honours an authored pause without creating an unbounded wait', () => {
    expect(beatDelay({ text: '—', pauseMs: 2400 })).toBe(2400);
    expect(beatDelay({ text: '—', pauseMs: 20_000 })).toBe(3000);
  });

  it('only adds a reading hold to automatically transitioning passages', () => {
    expect(completionDelay([], 'decision')).toBe(0);
    expect(completionDelay([{ text: 'Conséquence.' }], 'transition')).toBe(
      1200,
    );
    expect(
      completionDelay([{ text: 'x'.repeat(400) }], 'transition'),
    ).toBeLessThanOrEqual(2600);
  });

  it('keeps the reading time of a consequence when reduced motion shows it at once', () => {
    const beats = [
      { text: '10 000 € ont été versés.' },
      { text: '—', pauseMs: 1200 },
      { text: 'Un homme de cinquante-deux ans vide son bureau.' },
    ];
    const staggered =
      180 +
      beatDelay(beats[0]!) +
      beatDelay(beats[1]!) +
      completionDelay(beats, 'transition');
    expect(transitionHold(beats, 'transition', true)).toBe(staggered);
    expect(transitionHold(beats, 'transition', false)).toBe(
      completionDelay(beats, 'transition'),
    );
    // A decision never waits: the player reads at their own pace.
    expect(transitionHold(beats, 'decision', true)).toBe(0);
  });
});

describe('decision cadence', () => {
  const scene = (id: string) =>
    [...content.scenes, ...contentT2.scenes].find((s) => s.id === id)!;

  it('lets every real decision rest on its consequence', () => {
    expect(outcomeCadence(scene('t1.bouton').input)).toBe('rest');
    expect(outcomeCadence(scene('t1.pourquoi').input)).toBe('rest');
    expect(outcomeCadence(scene('t1.combien').input)).toBe('rest');
    expect(outcomeCadence(scene('t1.le-retour').input)).toBe('rest');
    expect(outcomeCadence(scene('t1.confrontation').input)).toBe('rest');
    expect(outcomeCadence(scene('t2.camille-sait').input)).toBe('rest');
  });

  it('lets a way out and a passage flow on without a second act', () => {
    expect(outcomeCadence(scene('t1.coda').input)).toBe('flow');
    expect(outcomeCadence(scene('t2.la-maison').input)).toBe('flow');
    expect(outcomeCadence(scene('t1.pas-encore').input)).toBe('flow');
  });

  it('never moves a resting consequence on by itself', () => {
    const beats = [
      { text: 'Il ne s’est rien passé.' },
      { text: 'Cette fois.' },
    ];
    // The rest only waits for a settle, then for the player.
    expect(transitionHold(beats, 'rest', true)).toBe(REST_SETTLE_MS);
    expect(transitionHold(beats, 'rest', false)).toBe(REST_SETTLE_MS);
    expect(REST_SETTLE_MS).toBeLessThan(1000);
  });

  let serial = 0;
  const ev = (e: Record<string, unknown>) =>
    ({ id: `p${++serial}`, at: serial, ...e }) as GameEvent;
  const entered = (sceneId: string) =>
    ev({ type: 'scene_entered', sceneId, sceneVersion: 1 });
  const locked = (sceneId: string, value: string) =>
    ev({
      type: 'choice_locked',
      sceneId,
      sceneVersion: 1,
      input: 'binary',
      value,
      hesitationMs: 1,
      selectionChanges: 0,
    });

  it('reads the stage of a visit from the journal alone', () => {
    const start = ev({ type: 'run_started', contentVersion: content.version });
    const deciding = [start, entered('t1.bouton')];
    expect(visitStage(deciding, 't1.bouton')).toBe('deciding');
    const consequence = [...deciding, locked('t1.bouton', 'appuyer')];
    expect(visitStage(consequence, 't1.bouton')).toBe('consequence');
    // A choice from the previous visit does not count for the next one.
    expect(
      visitStage([...consequence, entered('t1.dix-mille')], 't1.dix-mille'),
    ).toBe('deciding');
    const sealed = [
      ...deciding,
      locked('t1.chambre-froide', 'dossier-a'),
      ev({
        type: 'law_signed',
        lawNumber: 1,
        principleId: 'P_INNOCENT',
        statementId: 'innocent.default',
      }),
    ];
    expect(visitStage(sealed, 't1.chambre-froide')).toBe('sealed');
  });

  it('writes no choice while resting: the rest itself is never an event', () => {
    const events = [
      ev({ type: 'run_started', contentVersion: content.version }),
      entered('t1.bouton'),
      locked('t1.bouton', 'appuyer'),
    ];
    const state = replay(events, content);
    expect(visitStage(state.events, 't1.bouton')).toBe('consequence');
    expect(state.events.filter((e) => e.type === 'choice_locked')).toHaveLength(
      1,
    );
  });
});
