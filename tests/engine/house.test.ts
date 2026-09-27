import { afterEach, describe, expect, it, vi } from 'vitest';
import { content } from '../../src/content';
import { contentT2 } from '../../src/content/t2';
import {
  buildMemory,
  evaluate,
  lawStatement,
  nextScene,
  renderText,
  replay,
  resolveScene,
  resolvedBeats,
  sceneOptions,
  type GameEvent,
  type Memory,
} from '../../src/engine';
import { choice, entered, event, played } from './fixtures';

afterEach(() => vi.useRealTimers());

const room = (...events: GameEvent[]) =>
  replay(
    [
      event({ type: 'run_started', contentVersion: content.version }),
      ...events,
      ...played('t1.coda', 'sortir'),
      event({ type: 'run_completed', timelineId: 't1' }),
    ],
    content,
  );
const house = (memory: Memory, ...events: GameEvent[]) =>
  replay(
    [
      event({ type: 'run_started', contentVersion: contentT2.version }),
      event({
        type: 'memory_inherited',
        fromTimelineId: 't1',
        fromRunId: 'room',
        memory,
      }),
      ...events,
    ],
    contentT2,
  );
const signedInnocent = () =>
  room(
    ...played('t1.dix-mille', 'accepter'),
    ...played('t1.chambre-froide', 'dossier-a'),
    event({
      type: 'law_signed',
      lawNumber: 1,
      principleId: 'P_INNOCENT',
      statementId: 'innocent.default',
      statementText: 'Une personne innocente ne doit pas être sacrifiée.',
    }),
    ...played('t1.le-protocole', 'arreter'),
  );
const t2 = (sceneId: string, value: string) =>
  played(sceneId, value, contentT2);

describe('the house remembers the room', () => {
  it('turns the room into people through recorded choices only', () => {
    const memory = buildMemory(signedInnocent(), content, 'Dans la pièce');
    const state = house(memory);
    const faveur = resolveScene(
      contentT2.scenes.find((s) => s.id === 't2.la-faveur')!,
      state,
    );
    expect(faveur.beats.map((b) => b.text).join(' ')).toContain(
      'Il a vidé son bureau en mars.',
    );
    expect([...sceneOptions(faveur).keys()]).toContain('preter');
    const omar = resolveScene(
      contentT2.scenes.find((s) => s.id === 't2.omar-histoire')!,
      state,
    );
    expect(omar.beats.map((b) => b.text).join(' ')).toContain(
      'Il dort là-haut.',
    );
  });

  it('confronts a law signed in the room with an act in the house, side by side', () => {
    const memory = buildMemory(signedInnocent(), content, 'Dans la pièce');
    const state = house(
      memory,
      ...t2('t2.les-nouvelles', 'omar'),
      ...t2('t2.omar-histoire', 'aurais-continue'),
    );
    expect(state.pendingConfrontations[0]).toMatchObject({
      lawNumber: 1,
      sceneId: 't2.omar-histoire',
    });
    expect(nextScene(state, contentT2)?.id).toBe('t2.confrontation-proche');
    const scene = contentT2.scenes.find(
      (s) => s.id === 't2.confrontation-proche',
    )!;
    const lines = resolvedBeats(scene.beats, state).map((b) =>
      renderText(b.text, state, contentT2, 1),
    );
    expect(lines).toContain(
      'Dans la pièce, tu as transmis le dossier A au bloc.',
    );
    expect(lines).toContain(
      'Sur le balcon, tu as dit à Omar que tu aurais continué.',
    );
    // The contradiction points at real journal entries.
    const contradiction = state.contradictions[0]!;
    expect(
      state.events.find((e) => e.id === contradiction.lawEventId)?.type,
    ).toBe('memory_inherited');
    expect(
      state.events.find((e) => e.id === contradiction.choiceEventId)?.type,
    ).toBe('choice_locked');
  });

  it('keeps the exact signed sentence even if the content wording changes later', () => {
    const memory = buildMemory(signedInnocent(), content, 'Dans la pièce');
    const edited = structuredClone(contentT2);
    edited.principles.find((p) => p.id === 'P_INNOCENT')!.statements[0]!.text =
      'Une formulation corrigée plus tard.';
    const state = house(memory);
    expect(lawStatement(state.laws[0]!, edited)).toBe(
      'Une personne innocente ne doit pas être sacrifiée.',
    );
  });

  it('only counts a lie as a broken promise when the promise was made', () => {
    const memory = buildMemory(room(), content, 'Dans la pièce');
    const promised = house(
      memory,
      ...t2('t2.la-promesse', 'promettre'),
      event({
        type: 'law_signed',
        lawNumber: 1,
        principleId: 'P_PAROLE',
        statementId: 'parole.default',
      }),
      ...t2('t2.le-mensonge', 'mentir'),
    );
    expect(promised.pendingConfrontations[0]).toMatchObject({
      principleId: 'P_PAROLE',
    });
    expect(
      promised.relations.find((r) => r.characterId === 'camille')?.events,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'promise_broken' }),
      ]),
    );
    const free = house(
      memory,
      ...t2('t2.la-promesse', 'refuser'),
      ...t2('t2.le-mensonge', 'mentir'),
    );
    expect(free.pendingConfrontations).toEqual([]);
    expect(
      free.relations
        .find((r) => r.characterId === 'camille')
        ?.events.map((e) => e.kind),
    ).toEqual(['lie_made']);
  });

  it('derives relations from the choice itself, identically on every replay', () => {
    const memory = buildMemory(room(), content, 'Dans la pièce');
    const journal = [
      event({ type: 'run_started', contentVersion: contentT2.version }),
      event({
        type: 'memory_inherited',
        fromTimelineId: 't1',
        fromRunId: 'room',
        memory,
      }),
      ...t2('t2.ce-qu-on-protege', 'omar'),
    ];
    const events = journal.slice(2);
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const first = replay(journal, contentT2);
    vi.setSystemTime(9_999_999);
    const second = replay(journal, contentT2);
    expect(second).toEqual(first);
    expect(first.relations.flatMap((r) => r.events)).toEqual([
      expect.objectContaining({ at: events[1]!.at, eventId: events[1]!.id }),
      expect.objectContaining({ at: events[1]!.at, eventId: events[1]!.id }),
    ]);
  });

  it('brings back only the person the player betrayed, the next morning', () => {
    const memory = buildMemory(room(), content, 'Dans la pièce');
    const lied = house(memory, ...t2('t2.le-mensonge', 'mentir'));
    const told = house(memory, ...t2('t2.le-mensonge', 'dire'));
    const quiet = house(memory, ...t2('t2.le-mensonge', 'refuser'));
    const available = (state: typeof lied) =>
      contentT2.order.filter((id) => {
        const scene = contentT2.scenes.find((s) => s.id === id)!;
        return !scene.when || evaluate(scene.when, state);
      });
    expect(available(lied)).toContain('t2.camille-sait');
    expect(available(lied)).not.toContain('t2.sem');
    expect(available(told)).toContain('t2.sem');
    expect(available(told)).not.toContain('t2.camille-sait');
    expect(available(quiet)).not.toContain('t2.sem');
    expect(available(quiet)).not.toContain('t2.camille-sait');
  });

  it('quotes the exact words written in the room at the end of the house', () => {
    const words = 'Je ne dois rien à des inconnus.';
    const memory = buildMemory(
      room(
        ...played('t1.sept-annees', 'ne-pas-sauver'),
        event({
          type: 'scene_entered',
          sceneId: 't1.pourquoi',
          sceneVersion: 1,
        }),
        event({
          type: 'justification_given',
          sceneId: 't1.pourquoi',
          text: words,
        }),
      ),
      content,
      'Dans la pièce',
    );
    const state = house(memory, ...t2('t2.les-nouvelles', 'camille'));
    const ending = contentT2.scenes.find((s) => s.id === 't2.la-maison')!;
    const lines = resolvedBeats(ending.beats, state).map((b) =>
      renderText(b.text, state, contentT2),
    );
    const camille = lines.indexOf('Camille.');
    expect(lines[camille - 1]).toBe('Quelqu’un t’a sauvé la vie.');
    expect(lines[camille + 1]).toBe(`Tu écrivais : « ${words} »`);
    expect(lines).toContain('Camille t’accompagne jusqu’à la porte.');
    expect(lines).toContain('Ils avaient un nom.');
  });

  it('raises a law once per night, and keeps every later contradiction on record', () => {
    const memory = buildMemory(signedInnocent(), content, 'Dans la pièce');
    const state = house(
      memory,
      ...t2('t2.mila-confie', 'garder'),
      entered('t2.confrontation-proche', contentT2),
      event({
        type: 'confrontation_answered',
        lawNumber: 1,
        answer: 'maintain',
      }),
      choice('t2.confrontation-proche', 'maintain', contentT2),
      ...t2('t2.omar-histoire', 'aurais-continue'),
    );
    expect(state.pendingConfrontations).toEqual([]);
    expect(state.contradictions.map((c) => [c.sceneId, c.raised])).toEqual([
      ['t2.mila-confie', true],
      ['t2.omar-histoire', false],
    ]);
    expect(nextScene(state, contentT2)?.id).not.toBe('t2.confrontation-proche');
  });
});
