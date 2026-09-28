// Seeded player simulation. It appends exactly the event sequences the player
// UI can produce, validating each one before reducing it.
import {
  assertRenderedText,
  buildMemory,
  initialState,
  nextLawNumber,
  nextScene,
  reduce,
  renderText,
  replay,
  resolveScene,
  resolvedBeats,
  validateEvent,
  matchOutcome,
  dominantUnsignedPrinciple,
  type Content,
  type GameEvent,
  type GameState,
  type Memory,
} from '../src/engine';

export type Rand = () => number;
export const seeded = (seed: number): Rand => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

type Draft = GameEvent extends infer E
  ? E extends GameEvent
    ? Omit<E, 'id' | 'at'>
    : never
  : never;

// Player text is hostile by default: markup, quotes, templates, control
// characters and the maximum length all have to survive intact.
const TEXTS = [
  'Parce que je le voulais.',
  '<img src=x onerror=alert(1)> & "guillemets" \'simples\'',
  '{{law:1.statement|}} {{text:t1.pourquoi|x}}',
  'Je ne dois rien à des inconnus.',
  'é'.repeat(280),
  '   ',
  'Ligne\nsuivante\tet 🙂',
];

export type RunResult = {
  state: GameState;
  events: GameEvent[];
  visited: string[];
  variants: string[];
  answers: string[];
  rendered: number;
};

export function simulateRun(
  content: Content,
  rand: Rand,
  options: {
    clock: { at: number };
    memory?: { fromRunId: string; memory: Memory };
    skipRate?: number;
  },
): RunResult {
  let state = initialState();
  const variants: string[] = [];
  const answers: string[] = [];
  let rendered = 0;
  const push = (draft: Draft) => {
    const event = {
      ...draft,
      id: `e${++options.clock.at}`,
      at: options.clock.at,
    } as GameEvent;
    validateEvent(event, state, content);
    state = reduce(state, event, content);
  };
  const render = (text: string, lawNumber?: number) => {
    assertRenderedText(text, state, content, lawNumber);
    renderText(text, state, content, lawNumber);
    rendered++;
  };
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(rand() * items.length)]!;

  push({ type: 'run_started', contentVersion: content.version });
  if (content.inherits) {
    if (!options.memory) throw new Error('Inheriting timeline needs memory.');
    push({
      type: 'memory_inherited',
      fromTimelineId: content.inherits.timelineId,
      fromRunId: options.memory.fromRunId,
      memory: options.memory.memory,
    });
  }
  for (let step = 0; step < 40; step++) {
    const raw = nextScene(state, content);
    if (!raw) break;
    const scene = resolveScene(raw, state);
    const variant = raw.variants?.find((v) => scene.beats === v.beats);
    if (variant) variants.push(`${raw.id}:${variant.id}`);
    const lawNumber = state.pendingConfrontations[0]?.lawNumber ?? undefined;
    push({
      type: 'scene_entered',
      sceneId: scene.id,
      sceneVersion: scene.version,
    });
    for (const beat of resolvedBeats(scene.beats, state))
      render(beat.text, lawNumber);
    if (scene.input.kind === 'passage') continue;
    if (rand() < (options.skipRate ?? 0.04)) {
      push({ type: 'scene_skipped', sceneId: scene.id });
      continue;
    }
    let value: string | number;
    const input = scene.input;
    if (input.kind === 'freeText') {
      const text = pick(TEXTS);
      if (rand() < 0.75 && text.trim()) {
        push({
          type: 'justification_given',
          sceneId: scene.id,
          text: text.trim().slice(0, 280),
        });
        value = 'written';
      } else {
        push({ type: 'justification_declined', sceneId: scene.id });
        value = 'declined';
      }
    } else if (input.kind === 'slider')
      value = input.min + Math.floor(rand() * (input.max - input.min + 1));
    else if (
      input.kind === 'binary' ||
      input.kind === 'choice' ||
      input.kind === 'glyph'
    )
      value = pick(input.options).id;
    else if (input.kind === 'confrontation') {
      const pending = state.pendingConfrontations[0];
      if (!pending) throw new Error(`Confrontation without cause: ${scene.id}`);
      const answer = pick([
        'maintain',
        'nuance',
        'abandon',
        'silence',
      ] as const);
      answers.push(answer);
      if (answer === 'nuance') {
        const law = state.laws.find((l) => l.number === pending.lawNumber)!;
        const statements =
          content.principles.find((p) => p.id === law.principleId)
            ?.statements ?? [];
        const custom = rand() < 0.3;
        const statement = pick(statements);
        push({
          type: 'law_revised',
          lawNumber: pending.lawNumber!,
          newStatementId: custom ? null : statement.id,
          customText: custom ? pick(TEXTS.filter((t) => t.trim())) : undefined,
          ...(custom ? {} : { statementText: statement.text }),
        });
      } else if (answer === 'abandon')
        push({ type: 'law_abandoned', lawNumber: pending.lawNumber! });
      push({
        type: 'confrontation_answered',
        lawNumber: pending.lawNumber,
        answer,
      });
      value = answer;
    } else if (input.kind === 'lawProposal') {
      const unsigned = dominantUnsignedPrinciple(state, content);
      const roll = rand();
      if (unsigned && roll < 0.45) {
        push({
          type: 'law_signed',
          lawNumber: nextLawNumber(state),
          principleId: unsigned.id,
          statementId: unsigned.statements[0]!.id,
          statementText: unsigned.statements[0]!.text,
        });
        value = 'signed';
      } else if (unsigned && roll < 0.8) {
        push({ type: 'law_declined', principleId: unsigned.id });
        value = 'no';
      } else value = 'silence';
    } else throw new Error(`Unsupported input in ${scene.id}`);
    push({
      type: 'choice_locked',
      sceneId: scene.id,
      sceneVersion: scene.version,
      input: input.kind,
      value,
      hesitationMs: Math.floor(rand() * 20000),
      selectionChanges: Math.floor(rand() * 3),
    });
    const outcome = scene.outcomes.find((o) => matchOutcome(o, value));
    for (const beat of resolvedBeats(outcome?.beats ?? [], state))
      render(beat.text, lawNumber);
    if (outcome?.fact) render(outcome.fact);
    if (scene.followUps?.includes('certainty') && rand() < 0.7)
      push({
        type: 'certainty_given',
        sceneId: scene.id,
        value: Math.floor(rand() * 101),
      });
    const proposal = state.pendingLaws[0];
    if (scene.followUps?.includes('lawProposal') && proposal) {
      const roll = rand();
      if (roll < 0.6) {
        const number = nextLawNumber(state);
        const principle = content.principles.find(
          (p) => p.id === proposal.principleId,
        )!;
        const statement =
          rand() < 0.8
            ? principle.statements.find((s) => s.id === proposal.statementId)!
            : pick(principle.statements);
        const own = rand() < 0.15;
        push({
          type: 'law_signed',
          lawNumber: number,
          principleId: principle.id,
          statementId: statement.id,
          statementText: own
            ? 'Ma propre loi, écrite à la main.'
            : statement.text,
        });
      } else push({ type: 'law_declined', principleId: proposal.principleId });
    }
  }
  if (nextScene(state, content)) throw new Error('Run did not terminate.');
  push({ type: 'run_completed', timelineId: content.timelineId });
  // Replay must reconstruct exactly what was lived, from the journal alone.
  const replayed = replay(state.events, content);
  if (JSON.stringify(replayed) !== JSON.stringify(state))
    throw new Error('Replay diverged from the lived run.');
  return {
    state,
    events: state.events,
    visited: state.visited,
    variants,
    answers,
    rendered,
  };
}

export function simulateJourney(
  t1: Content,
  t2: Content,
  rand: Rand,
  clock: { at: number },
  skipRate?: number,
) {
  const room = simulateRun(t1, rand, { clock, skipRate });
  const memory = buildMemory(room.state, t1, t2.inherits!.place);
  const house = simulateRun(t2, rand, {
    clock,
    skipRate,
    memory: { fromRunId: `run-${clock.at}`, memory },
  });
  return { room, house, memory };
}

// The same chain, one timeline further: T3 reads only T2's memory, which
// already carries T1's — simulateRun never needs to know that.
export function simulateJourney3(
  t1: Content,
  t2: Content,
  t3: Content,
  rand: Rand,
  clock: { at: number },
  skipRate?: number,
) {
  const {
    room,
    house,
    memory: roomMemory,
  } = simulateJourney(t1, t2, rand, clock, skipRate);
  const houseMemory = buildMemory(house.state, t2, t3.inherits!.place);
  const city = simulateRun(t3, rand, {
    clock,
    skipRate,
    memory: { fromRunId: `run-${clock.at}`, memory: houseMemory },
  });
  return { room, house, city, roomMemory, houseMemory };
}
