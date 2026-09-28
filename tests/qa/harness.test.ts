import { describe, expect, it } from 'vitest';
import { content } from '../../src/content';
import type { GameEvent } from '../../src/engine';
import {
  corruptJournal,
  MOBILE_VIEWPORTS,
  planProfileDecision,
  PLAYTEST_PROFILES,
  profileSettings,
  redactEventsForDiagnostics,
  validateJournalWithEngine,
  type InvalidJournalKind,
} from '../e2e/harness';
import { roomEvents } from '../e2e/journeys';

describe('QA journal corruption detector', () => {
  const valid = roomEvents();

  it('delegates valid history to the production migration validator', () => {
    expect(validateJournalWithEngine(content, valid)).toEqual({ valid: true });
  });

  for (const kind of [
    'duplicate_choice',
    'duplicate_scene_entry',
    'event_after_completion',
    'impossible_order',
  ] satisfies InvalidJournalKind[]) {
    it(`rejects ${kind} through the production validator`, () => {
      expect(
        validateJournalWithEngine(content, corruptJournal(valid, kind)).valid,
      ).toBe(false);
    });
  }
});

describe('generic playtest profiles', () => {
  const candidates = [
    {
      id: 'alpha',
      signals: { continuity: 5, selfInterest: 1, collective: 4, edge: 0 },
    },
    {
      id: 'omega',
      signals: { continuity: -5, selfInterest: 5, collective: 0, edge: 5 },
    },
  ];

  it('exports every requested profile without timeline-specific ids', () => {
    expect(PLAYTEST_PROFILES).toEqual([
      'CONSISTENT',
      'CONTRADICTORY',
      'SELF_INTERESTED',
      'COLLECTIVE',
      'EDGE_CASE',
      'HOSTILE_TEXT',
      'REDUCED_MOTION',
      'RELOAD_HEAVY',
    ]);
    expect(planProfileDecision('CONSISTENT', candidates, 0).candidateId).toBe(
      'alpha',
    );
    expect(
      planProfileDecision('CONTRADICTORY', candidates, 0).candidateId,
    ).toBe('omega');
    expect(
      planProfileDecision('SELF_INTERESTED', candidates, 0).candidateId,
    ).toBe('omega');
    expect(planProfileDecision('COLLECTIVE', candidates, 0).candidateId).toBe(
      'alpha',
    );
    expect(planProfileDecision('EDGE_CASE', candidates, 0).candidateId).toBe(
      'omega',
    );
  });

  it('adds only the behavior owned by special profiles', () => {
    expect(
      planProfileDecision('HOSTILE_TEXT', candidates, 0).freeText,
    ).toContain('<img');
    expect(
      planProfileDecision('RELOAD_HEAVY', candidates, 0).reloadAfterDecision,
    ).toBe(true);
    expect(profileSettings('REDUCED_MOTION')).toEqual({
      reducedMotion: 'on',
    });
  });
});

it('redacts free text from CI diagnostics', () => {
  const events: GameEvent[] = [
    {
      type: 'justification_given',
      id: 'secret-event',
      at: 1,
      sceneId: 't1.pourquoi',
      text: 'information sensible',
    },
  ];
  const diagnostics = JSON.stringify(redactEventsForDiagnostics(events));
  expect(diagnostics).not.toContain('information sensible');
  expect(diagnostics).toContain('justification_given');
  expect(diagnostics).toContain('t1.pourquoi');
});

it('pins the two hostile mobile profiles', () => {
  expect(MOBILE_VIEWPORTS).toEqual([
    { width: 360, height: 640 },
    { width: 390, height: 844 },
  ]);
});
