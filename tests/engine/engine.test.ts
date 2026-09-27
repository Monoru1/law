import { describe, it, expect } from 'vitest';
import { content } from '../../src/content';
import {
  applyEffects,
  evaluate,
  initialState,
  nextScene,
  replay,
  reduce,
  renderText,
  applyFrenchTypography,
  summarizeChoicesForStats,
  type GameEvent,
} from '../../src/engine';
const event = (type: GameEvent['type'], props: Record<string, unknown> = {}) =>
  ({
    id: `${type}-${JSON.stringify(props)}`,
    at: 1,
    type,
    ...props,
  }) as GameEvent;
const played = (
  sceneId: string,
  value: string | number,
  events: GameEvent[] = [],
) => [
  ...events,
  event('scene_entered', { sceneId, sceneVersion: 1 }),
  event('choice_locked', {
    sceneId,
    sceneVersion: 1,
    input: 'binary',
    value,
    hesitationMs: 3200,
    selectionChanges: 1,
  }),
];
describe('pure narrative engine', () => {
  it('evaluates each condition form', () => {
    const s = replay(
      [
        ...played('t1.bouton', 'appuyer'),
        event('justification_given', {
          sceneId: 't1.pourquoi',
          text: 'Pourquoi',
        }),
      ],
      content,
    );
    s.vars.test = 8;
    s.laws.push({
      number: 1,
      principleId: 'P_ARGENT',
      statementId: 'argent.default',
      status: 'signed',
      revisions: [],
      signedAtDecision: 0,
    });
    const cases = [
      { flag: 'pressed_button' },
      { var: 'test', op: '>=', value: 8 },
      { chose: { sceneId: 't1.bouton', optionId: 'appuyer' } },
      { value: { sceneId: 't1.bouton', op: '==', value: 1 } },
      { answered: 't1.pourquoi' },
      { law: { principleId: 'P_ARGENT', status: 'signed' } },
      { contradiction: 'none' },
      { visited: 't1.bouton' },
    ] as const;
    for (const c of cases.filter((_, i) => i !== 3))
      expect(evaluate(c, s)).toBe(true);
    expect(evaluate({ not: { flag: 'missing' } }, s)).toBe(true);
    expect(
      evaluate(
        { all: [{ flag: 'pressed_button' }, { visited: 't1.bouton' }] },
        s,
      ),
    ).toBe(true);
    expect(
      evaluate({ any: [{ flag: 'missing' }, { flag: 'pressed_button' }] }, s),
    ).toBe(true);
    s.choices.test = 7;
    expect(
      evaluate({ value: { sceneId: 'test', op: '>=', value: 7 } }, s),
    ).toBe(true);
    s.pendingConfrontations.push({
      lawNumber: 1,
      principleId: 'P_ARGENT',
      sceneId: 't1.dix-mille',
    });
    expect(evaluate({ contradiction: 'pending' }, s)).toBe(true);
  });
  it('applies every effect without recording synthetic events', () => {
    const s = initialState();
    applyEffects(
      s,
      [
        { setFlag: 'seen' },
        { setVar: 'total', value: 2 },
        { incVar: 'total', by: 3 },
        { incVar: 'total', by: { fromValueOf: 'test' } },
        { schedule: { sceneId: 't1.le-retour' } },
        {
          proposeLaw: {
            principleId: 'P_NOMBRE',
            statementId: 'nombre.default',
          },
        },
      ],
      { test: 4 },
    );
    expect(s.vars.total).toBe(9);
    expect(s.flags).toEqual(['seen']);
    expect(s.schedules).toHaveLength(1);
    expect(s.pendingLaws).toHaveLength(1);
    expect(s.events).toHaveLength(0);
  });
  it('replays deterministically and tolerates orphan scenes', () => {
    const events = [
      event('run_started', { contentVersion: content.version }),
      ...played('t1.bouton', 'appuyer'),
      ...played('t1.removed', 'value'),
    ];
    expect(replay(events, content)).toEqual(replay(events, content));
    expect(replay(events, content).flags).toContain('pressed_button');
    expect(replay(events, content).choices['t1.removed']).toBe('value');
  });
  it('prioritizes confrontation, then deferred return, then order', () => {
    const s = replay(
      [
        ...played('t1.sept-annees', 'sauver'),
        ...played('t1.le-protocole', 'continuer'),
      ],
      content,
    );
    expect(nextScene(s, content)?.id).toBe('t1.le-retour');
    s.pendingConfrontations.push({
      lawNumber: 1,
      principleId: 'P_NOMBRE',
      sceneId: 't1.le-protocole',
    });
    expect(nextScene(s, content)?.id).toBe('t1.confrontation');
    s.pendingConfrontations = [];
    s.visited.push('t1.le-retour', ...content.order);
    expect(nextScene(s, content)).toBeNull();
  });
  it('confronts signed laws after contradictory choices and preserves revisions', () => {
    let events = [
      event('run_started', { contentVersion: content.version }),
      ...played('t1.chambre-froide', 'dossier-b'),
      event('law_signed', {
        lawNumber: 1,
        principleId: 'P_NOMBRE',
        statementId: 'nombre.default',
      }),
      ...played('t1.le-protocole', 'arreter'),
    ];
    let s = replay(events, content);
    expect(s.pendingConfrontations[0]?.lawNumber).toBe(1);
    events = [
      ...events,
      event('law_revised', { lawNumber: 1, newStatementId: 'nombre.mains' }),
      event('confrontation_answered', { lawNumber: 1, answer: 'nuance' }),
    ];
    s = replay(events, content);
    expect(s.laws[0]?.revisions).toHaveLength(2);
    expect(s.pendingConfrontations).toHaveLength(0);
    expect(s.flags).toContain('law_changed');
    s = reduce(s, event('law_abandoned', { lawNumber: 1 }), content);
    expect(s.laws[0]?.status).toBe('abandoned');
    expect(s.laws[0]?.revisions).toHaveLength(3);
  });
  it('escapes player text, resolves fallbacks and French typography', () => {
    const s = initialState();
    s.justifications['t1.pourquoi'] = '<img onerror="x">';
    expect(
      renderText('« {{text:t1.pourquoi|}} » {{var:nope|0}}', s, content),
    ).toContain('<img');
    expect(renderText('{{var:nope|0}}', s, content)).toBe('0');
    expect(applyFrenchTypography('« Bonjour ! »')).toBe('« Bonjour ! »');
  });
  it('only summarizes option IDs for statistics', () => {
    const events = [
      ...played('t1.bouton', 'appuyer'),
      event('justification_given', { sceneId: 't1.pourquoi', text: 'private' }),
    ];
    expect(JSON.stringify(summarizeChoicesForStats(events))).not.toContain(
      'private',
    );
  });
});
