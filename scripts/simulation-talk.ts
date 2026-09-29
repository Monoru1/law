// Seeded player for conversations. It records exactly the events the player
// interface records, validating each before reducing it, so a journal it makes
// is one the real game could have made.
import {
  clockStart,
  initialState,
  nextScene,
  reduce,
  resolveScene,
  talkNode,
  talkOf,
  validateEvent,
  visibleReplies,
  type Content,
  type GameEvent,
  type GameState,
} from '../src/engine';
import type { Rand } from './simulation';

type Draft = GameEvent extends infer E
  ? E extends GameEvent
    ? Omit<E, 'id' | 'at'>
    : never
  : never;

const TEXTS = [
  'Parce que je le voulais.',
  '<img src=x onerror=alert(1)> & "guillemets"',
  '{{law:1.statement|}} {{note:innocent-why|x}}',
  'é'.repeat(280),
  'Ligne\nsuivante 🙂',
];

export type TalkRun = {
  state: GameState;
  events: GameEvent[];
  visited: string[];
  nodes: Set<string>;
};

export function simulateTalkRun(
  content: Content,
  rand: Rand,
  clock: { at: number },
  options: {
    // Chance of letting a timed question run out rather than answering.
    timeoutRate?: number;
    // Chance of picking an explicit silence when one is offered.
    silenceRate?: number;
    // Chance, at each step of a timed conversation, that its clock runs out.
    clockRate?: number;
    // Nodes already reached by earlier runs: a curious player prefers a reply
    // that leads somewhere new, so coverage does not depend on luck.
    seen?: Set<string>;
    // Chance that a scene is left through the pause menu instead of played.
    skipRate?: number;
    inherit?: { timelineId: string; memory: never };
  } = {},
): TalkRun {
  const events: GameEvent[] = [];
  let state = initialState();
  const push = (draft: Draft) => {
    const event = {
      ...draft,
      id: `e${events.length + 1}`,
      at: ++clock.at,
    } as GameEvent;
    validateEvent(event, state, content);
    state = reduce(state, event, content);
    events.push(event);
  };
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)]!;
  const nodes = new Set<string>();
  push({ type: 'run_started', contentVersion: content.version });
  for (let scenes = 0; scenes < 80; scenes++) {
    const scene = nextScene(state, content);
    if (!scene) break;
    push({
      type: 'scene_entered',
      sceneId: scene.id,
      sceneVersion: scene.version,
    });
    if (rand() < (options.skipRate ?? 0)) {
      push({ type: 'scene_skipped', sceneId: scene.id });
      continue;
    }
    const raw = content.scenes.find((s) => s.id === scene.id)!;
    for (let step = 0; step < 400; step++) {
      const resolved = resolveScene(raw, state);
      const talk = talkOf(resolved);
      if (!talk) break;
      const track = state.talk[scene.id]!;
      for (const item of track.trail) {
        nodes.add(`${scene.id}/${item.nodeId}`);
        options.seen?.add(`${scene.id}/${item.nodeId}`);
      }
      if (track.cursor === null) {
        if (track.end === null) throw new Error(`${scene.id} ended nowhere`);
        push({
          type: 'choice_locked',
          sceneId: scene.id,
          sceneVersion: scene.version,
          input: 'talk',
          value: track.end,
          hesitationMs: 0,
          selectionChanges: 0,
        });
        break;
      }
      const node = talkNode(talk, track.cursor)!;
      // A clock that has run out: the journal records the wait as it happened.
      if (
        talk.clock &&
        clockStart(state, resolved) !== null &&
        rand() < (options.clockRate ?? 0.12)
      ) {
        clock.at += talk.clock.ms;
        push({
          type: 'line_chosen',
          sceneId: scene.id,
          sceneVersion: scene.version,
          nodeId: node.id,
          optionId: 'timeout',
          mode: 'timeout',
          hesitationMs: 0,
        });
        continue;
      }
      const base = {
        type: 'line_chosen' as const,
        sceneId: scene.id,
        sceneVersion: scene.version,
        nodeId: node.id,
        hesitationMs: Math.floor(rand() * 5000),
      };
      if (node.write) {
        if (rand() < 0.35)
          push({ ...base, optionId: 'declined', mode: 'declined' });
        else
          push({
            ...base,
            optionId: 'written',
            mode: 'written',
            text: pick(TEXTS).slice(0, node.write.maxLength),
          });
      } else if (
        node.ask?.timeoutMs &&
        rand() < (options.timeoutRate ?? 0.15)
      ) {
        push({ ...base, optionId: 'timeout', mode: 'timeout' });
      } else {
        const replies = visibleReplies(state, resolved, node);
        if (!replies.length)
          throw new Error(`${scene.id}/${node.id} offers no reply`);
        const silent = replies.filter((r) => r.silent);
        const fresh = replies.filter(
          (r) =>
            options.seen &&
            r.next &&
            !options.seen.has(`${scene.id}/${r.next}`),
        );
        const chosen =
          silent.length && rand() < (options.silenceRate ?? 0.2)
            ? pick(silent)
            : fresh.length && rand() < 0.85
              ? pick(fresh)
              : pick(replies);
        push({
          ...base,
          optionId: chosen.id,
          mode: chosen.silent ? 'silence' : 'reply',
        });
      }
    }
  }
  if (!state.completed) {
    if (!state.visited.includes(content.flow.codaSceneId))
      throw new Error('The conversation never reached the coda');
    push({ type: 'run_completed', timelineId: content.timelineId });
  }
  return { state, events, visited: state.visited, nodes };
}
