import { describe, expect, it } from 'vitest';
import { content } from '../../src/content';
import {
  assertRenderedText,
  initialState,
  nextScene,
  observations,
  reduce,
  renderText,
  replay,
  type GameEvent,
} from '../../src/engine';
import { choice, event } from './fixtures';

const signature = () =>
  event({
    type: 'law_signed',
    lawNumber: 1,
    principleId: 'P_NOMBRE',
    statementId: 'nombre.default',
  });
const entered = (sceneId: string) =>
  event({ type: 'scene_entered', sceneId, sceneVersion: 1 });

describe('historical truth and finality', () => {
  it('resolves dotted law tokens and elapsed decisions with a dynamic or numeric reference', () => {
    const state = replay(
      [
        choice('t1.levier', 'tirer'),
        signature(),
        choice('t1.combien', 7),
        choice('t1.chirurgien', 'refuser'),
      ],
      content,
    );
    for (const reference of ['N', '1']) {
      expect(
        renderText(`{{law:${reference}.number|99}}`, state, content, 1),
      ).toBe('01');
      expect(
        renderText(`{{law:${reference}.statement|}}`, state, content, 1),
      ).toBe(content.principles[1]!.statements[0]!.text);
      expect(
        renderText(`{{since:law:${reference}|99}}`, state, content, 1),
      ).toBe('2');
    }
    expect(renderText('{{law:99.statement|Absente}}', state, content)).toBe(
      'Absente',
    );
    expect(renderText('{{since:law:99|0}}', state, content)).toBe('0');
    expect(renderText('{{law:N.number|99}}', state, content)).toBe('99');
    const revised = reduce(
      state,
      event({
        type: 'law_revised',
        lawNumber: 1,
        newStatementId: null,
        customText: 'Ma formulation.',
      }),
      content,
    );
    expect(renderText('{{law:1.statement|}}', revised, content)).toBe(
      'Ma formulation.',
    );
  });

  it('detects empty embedded tokens even when the rest of the beat is nonempty', () => {
    expect(() =>
      assertRenderedText('« {{law:N.statement|}} »', initialState(), content),
    ).toThrow('Empty');
    expect(() =>
      assertRenderedText('Valeur {{var:missing|0}}.', initialState(), content),
    ).not.toThrow();
  });

  it('preserves a second contradiction in the coda without reopening the room', () => {
    const signed = signature();
    const first = choice('t1.chirurgien', 'refuser');
    const answer = event({
      type: 'confrontation_answered',
      lawNumber: 1,
      answer: 'maintain',
    });
    const final = choice('t1.coda', 'un');
    const events = [
      choice('t1.levier', 'tirer'),
      signed,
      first,
      entered('t1.confrontation'),
      answer,
      choice('t1.confrontation', 'maintain'),
      entered('t1.coda'),
      final,
    ];
    const state = replay(events, content);
    expect(state.contradictions).toEqual([
      {
        lawNumber: 1,
        principleId: 'P_NOMBRE',
        sceneId: 't1.chirurgien',
        choiceEventId: first.id,
        lawEventId: signed.id,
        answerEventId: answer.id,
      },
      {
        lawNumber: 1,
        principleId: 'P_NOMBRE',
        sceneId: 't1.coda',
        choiceEventId: final.id,
        lawEventId: signed.id,
      },
    ]);
    expect(state.pendingConfrontations).toEqual([]);
    expect(nextScene(state, content)).toBeNull();
    expect(replay(events, content)).toEqual(state);
    expect(replay([first, final], content).contradictions).toEqual([]);
  });

  it('keeps coda final for a coherent surgeon choice followed by a contradictory coda', () => {
    const state = replay(
      [
        signature(),
        choice('t1.chirurgien', 'autoriser'),
        entered('t1.coda'),
        choice('t1.coda', 'un'),
      ],
      content,
    );
    expect(state.contradictions).toHaveLength(1);
    expect(nextScene(state, content)).toBeNull();
  });

  it('drains multiple confrontations before the coda and allows each repeated scene to be answered or skipped', () => {
    // A bounded fixture exercises a queue longer than the current authored content produces.
    const expanded = structuredClone(content);
    const surgeon = expanded.scenes.find((s) => s.id === 't1.chirurgien')!;
    if (surgeon.input.kind !== 'binary')
      throw new Error('Expected binary input');
    surgeon.input.options[1].evidence!.push({
      principleId: 'P_ARGENT',
      weight: -1,
    });
    const events: GameEvent[] = [
      signature(),
      event({
        type: 'law_signed',
        lawNumber: 2,
        principleId: 'P_ARGENT',
        statementId: 'argent.default',
      }),
      choice('t1.chirurgien', 'refuser'),
    ];
    let state = replay(events, expanded);
    expect(state.pendingConfrontations).toHaveLength(2);
    state = reduce(state, entered('t1.confrontation'), expanded);
    state = reduce(
      state,
      event({
        type: 'confrontation_answered',
        lawNumber: 1,
        answer: 'maintain',
      }),
      expanded,
    );
    state = reduce(state, choice('t1.confrontation', 'maintain'), expanded);
    expect(nextScene(state, expanded)?.id).toBe('t1.confrontation');
    state = reduce(state, entered('t1.confrontation'), expanded);
    expect(state.choices['t1.confrontation']).toBeUndefined();
    state = reduce(
      state,
      event({ type: 'scene_skipped', sceneId: 't1.confrontation' }),
      expanded,
    );
    expect(state.pendingConfrontations).toEqual([]);
    expect(state.contradictions).toHaveLength(2);
    expect(nextScene(state, expanded)?.id).not.toBe('t1.confrontation');
  });

  it('does not consume a different law or mutate earlier states', () => {
    const state = replay(
      [signature(), choice('t1.chirurgien', 'refuser')],
      content,
    );
    const original = structuredClone(state);
    const ignored = reduce(
      state,
      event({
        type: 'confrontation_answered',
        lawNumber: 99,
        answer: 'maintain',
      }),
      content,
    );
    expect(ignored.pendingConfrontations).toEqual(state.pendingConfrontations);
    expect(state).toEqual(original);
    expect(state.contradictions[0]?.answerEventId).toBeUndefined();
  });

  it('never describes an initial custom formulation as a revision after confrontation', () => {
    const state = replay(
      [
        signature(),
        event({
          type: 'law_revised',
          lawNumber: 1,
          newStatementId: null,
          customText: 'Ma loi.',
        }),
      ],
      content,
    );
    expect(observations(state, content)).not.toContain(
      'Tu as modifié une loi après avoir été confronté à ses conséquences.',
    );
    expect(observations(initialState(), content)).toEqual([]);
  });
});
