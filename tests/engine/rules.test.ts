import { describe, expect, it } from 'vitest';
import { content } from '../../src/content';
import { contentT2 } from '../../src/content/t2';
import {
  buildMemory,
  evaluate,
  reduce,
  replay,
  initialState,
  type Content,
} from '../../src/engine';
import { entered, event, played } from './fixtures';

// A minimal timeline used only to exercise the new rule/relation/contradiction
// primitives without depending on real T1/T2/T3 content.
const timeline: Content = {
  timelineId: 't1',
  version: '0.0.0-test',
  scenes: [
    {
      id: 't1.rule-scene',
      version: 1,
      timelineId: 't1',
      title: 'Test',
      regression: 0,
      contentFlags: [],
      beats: [],
      input: {
        kind: 'binary',
        confirm: 'tap',
        options: [
          { id: 'ancien', label: 'Ancien' },
          { id: 'urgent', label: 'Urgent' },
        ],
      },
      outcomes: [
        {
          when: { optionId: 'ancien' },
          beats: [],
          effects: [
            {
              ruleEnacted: { ruleId: 'attribution', criterionId: 'anciennete' },
            },
          ],
        },
        {
          when: { optionId: 'urgent' },
          beats: [],
          effects: [
            { ruleEnacted: { ruleId: 'attribution', criterionId: 'urgence' } },
          ],
        },
      ],
    },
    {
      id: 't1.revise-scene',
      version: 1,
      timelineId: 't1',
      title: 'Révision',
      regression: 0,
      contentFlags: [],
      beats: [],
      input: {
        kind: 'choice',
        confirm: 'tap',
        options: [{ id: 'ok', label: 'OK' }],
      },
      outcomes: [
        {
          when: { any: true },
          beats: [],
          effects: [
            { ruleRevised: { ruleId: 'attribution', criterionId: 'urgence' } },
          ],
        },
      ],
    },
  ],
  principles: [],
  observations: [],
  order: ['t1.rule-scene', 't1.revise-scene'],
  flow: {
    confrontationSceneId: '',
    pasEncoreSceneId: '',
    confrontationUnsignedSceneId: '',
    checkpointSceneId: '',
    codaSceneId: 't1.revise-scene',
  },
};

describe('collective rules', () => {
  it('records enactment as a fact the "rule" condition can read', () => {
    const state = replay(
      [
        event({ type: 'run_started', contentVersion: timeline.version }),
        ...played('t1.rule-scene', 'ancien', timeline),
      ],
      timeline,
    );
    expect(
      evaluate(
        { rule: { ruleId: 'attribution', criterionId: 'anciennete' } },
        state,
      ),
    ).toBe(true);
    expect(
      evaluate(
        { rule: { ruleId: 'attribution', criterionId: 'urgence' } },
        state,
      ),
    ).toBe(false);
    expect(state.rules).toEqual([
      {
        ruleId: 'attribution',
        events: [
          expect.objectContaining({
            kind: 'enacted',
            criterionId: 'anciennete',
            sceneId: 't1.rule-scene',
          }),
        ],
      },
    ]);
  });

  it('never overwrites the enactment: a revision is a new fact beside it', () => {
    const state = replay(
      [
        event({ type: 'run_started', contentVersion: timeline.version }),
        ...played('t1.rule-scene', 'ancien', timeline),
        ...played('t1.revise-scene', 'ok', timeline),
      ],
      timeline,
    );
    // The condition reads the *current* criterion...
    expect(
      evaluate(
        { rule: { ruleId: 'attribution', criterionId: 'urgence' } },
        state,
      ),
    ).toBe(true);
    // ...but the original enactment is still on record, untouched.
    const record = state.rules.find((r) => r.ruleId === 'attribution')!;
    expect(record.events.map((e) => [e.kind, e.criterionId])).toEqual([
      ['enacted', 'anciennete'],
      ['revised', 'urgence'],
    ]);
  });
});

describe('memory composes transitively across timelines', () => {
  it('carries T1 relations, rules and certainty into T2, unchanged', () => {
    const events = [
      event({ type: 'run_started', contentVersion: timeline.version }),
      ...played('t1.rule-scene', 'ancien', timeline),
      ...played('t1.revise-scene', 'ok', timeline),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const finished = replay(events, timeline);
    const memory = buildMemory(finished, timeline, 'Quelque part');
    expect(memory.rules).toHaveLength(1);
    expect(memory.rules[0]!.events).toHaveLength(2);

    // A second timeline inheriting this memory sees the same facts, without
    // ever reading the first timeline's own content.
    const inherited = reduce(
      initialState(),
      event({
        type: 'memory_inherited',
        fromTimelineId: 't1',
        fromRunId: 'room-run',
        memory,
      }),
      content,
    );
    expect(inherited.rules).toEqual(memory.rules);
    expect(
      evaluate(
        { rule: { ruleId: 'attribution', criterionId: 'urgence' } },
        inherited,
      ),
    ).toBe(true);
  });

  it('keeps a resolved contradiction as a fact, not an open question, for the next timeline', () => {
    const events = [
      event({ type: 'run_started', contentVersion: content.version }),
      ...played('t1.dix-mille', 'accepter'),
      ...played('t1.chambre-froide', 'dossier-a'),
      event({
        type: 'law_signed',
        lawNumber: 1,
        principleId: 'P_INNOCENT',
        statementId: 'innocent.default',
        statementText: 'Une personne innocente ne doit pas être sacrifiée.',
      }),
      ...played('t1.le-protocole', 'continuer'),
      entered('t1.confrontation'),
      event({
        type: 'confrontation_answered',
        lawNumber: 1,
        answer: 'maintain',
      }),
      ...played('t1.confrontation', 'maintain'),
      ...played('t1.combien', 0),
      entered('t1.pas-encore'),
      ...played('t1.le-retour', 'non'),
      ...played('t1.coda', 'sortir'),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const finished = replay(events, content);
    expect(finished.contradictions).toHaveLength(1);
    const memory = buildMemory(finished, content, 'Dans la pièce');
    expect(memory.contradictions).toEqual([
      expect.objectContaining({
        lawNumber: 1,
        principleId: 'P_INNOCENT',
        sceneId: 't1.le-protocole',
        raised: true,
        answer: 'maintain',
      }),
    ]);
    // A run that inherits this memory carries the closed contradiction
    // forward as a fact — never as a pending confrontation of its own.
    const inheritedState = reduce(
      initialState(),
      event({
        type: 'memory_inherited',
        fromTimelineId: 't1',
        fromRunId: 'room-run',
        memory,
      }),
      contentT2,
    );
    expect(inheritedState.inheritedContradictions).toEqual(
      memory.contradictions,
    );
    expect(inheritedState.pendingConfrontations).toEqual([]);
  });
});
