import { evaluate } from './conditions';
import { applyEffects, type EffectOrigin } from './effects';
import type {
  Effect,
  Evidence,
  GameEvent,
  GameState,
  Scene,
  TalkLine,
  TalkNode,
  TalkReply,
  TalkSpec,
  TalkState,
} from './types';

type LineChosen = Extract<GameEvent, { type: 'line_chosen' }>;

// A conversation always ends: a malformed graph cannot loop the reducer.
const MAX_STEPS = 200;

export const talkOf = (scene: Scene): TalkSpec | null =>
  scene.input.kind === 'talk' ? scene.input.talk : null;

export const talkNode = (talk: TalkSpec, id: string): TalkNode | undefined =>
  talk.nodes.find((node) => node.id === id);

/**
 * `walkTalk` silently passes through any node with no `ask`/`write`/`end` of
 * its own, folding its lines into whatever comes next — a bare narration
 * node is never, on its own, a point the player sees. A UI that only reads
 * the single node at `track.cursor` therefore drops every line that belongs
 * to a node the walk passed through on its way there, including the node
 * that finally set `track.end` (its own lines are never shown at all,
 * since no cursor ever rests on it).
 *
 * This returns every node narrated since the player's last answer — from
 * just after the last trail entry carrying a `reply`, through to the node
 * now waiting (if any) or the node the walk ended on — so a scene can chain
 * several narration-only nodes and have all of them read together, exactly
 * once, with no answer-less filler step needed to make each one visible.
 * Pure and read-only: it does not change what `walkTalk`/`applyLine` record,
 * so replay and every existing save are unaffected.
 */
export function visibleTrailNodes(
  talk: TalkSpec,
  track: TalkState,
): TalkNode[] {
  let start = 0;
  for (let i = track.trail.length - 1; i >= 0; i--) {
    if (track.trail[i]!.reply) {
      start = i + 1;
      break;
    }
  }
  const nodes: TalkNode[] = [];
  for (const item of track.trail.slice(start)) {
    const node = talkNode(talk, item.nodeId);
    if (node) nodes.push(node);
  }
  return nodes;
}

/**
 * When the scene's clock started, and whether it has run out by the time of an
 * event. Both are read from the journal like everything else.
 */
export function clockStart(state: GameState, scene: Scene): number | null {
  const clock = talkOf(scene)?.clock;
  if (!clock) return null;
  return (
    state.lines.find(
      (l) =>
        l.sceneId === scene.id &&
        l.nodeId === clock.startsOn.nodeId &&
        l.optionId === clock.startsOn.optionId,
    )?.at ?? null
  );
}

export function clockExpired(
  state: GameState,
  scene: Scene,
  at: number,
): boolean {
  const clock = talkOf(scene)?.clock;
  const started = clockStart(state, scene);
  return Boolean(clock && started !== null && at - started >= clock.ms - 2500);
}

/** The node that follows in authored order, used when nothing else is named. */
const following = (talk: TalkSpec, node: TalkNode) =>
  talk.nodes[talk.nodes.findIndex((n) => n.id === node.id) + 1]?.id;

/**
 * Walks the conversation from a node through everything that needs no answer,
 * until it reaches a node waiting for the player or an end. The walk reads
 * only the state the journal has already built, so replay is exact.
 */
export function walkTalk(
  state: GameState,
  scene: Scene,
  from: string | undefined,
  origin: EffectOrigin,
): void {
  const talk = talkOf(scene);
  const track = state.talk[scene.id];
  if (!talk || !track) return;
  let id = from;
  for (let step = 0; step < MAX_STEPS; step++) {
    const node = id === undefined ? undefined : talkNode(talk, id);
    if (!node) break;
    track.trail.push({ nodeId: node.id });
    if (node.effects) applyEffects(state, node.effects, state.choices, origin);
    if (node.end !== undefined) {
      track.cursor = null;
      track.end = node.end;
      return;
    }
    if (node.ask || node.write) {
      track.cursor = node.id;
      return;
    }
    id =
      node.route?.find((r) => evaluate(r.when, state))?.next ??
      node.next ??
      following(talk, node);
  }
  track.cursor = null;
}

export function enterTalk(
  state: GameState,
  scene: Scene,
  origin: EffectOrigin,
): void {
  const talk = talkOf(scene);
  if (!talk) return;
  state.talk[scene.id] = { cursor: null, end: null, trail: [] };
  walkTalk(state, scene, talk.start, origin);
}

/** Replies the player may give now: conditions met, one-time ones unused. */
export function visibleReplies(
  state: GameState,
  scene: Scene,
  node: TalkNode,
): TalkReply[] {
  const trail = state.talk[scene.id]?.trail ?? [];
  return (node.ask?.replies ?? []).filter(
    (reply) =>
      (!reply.requires || evaluate(reply.requires, state)) &&
      !(
        reply.once &&
        trail.some(
          (item) =>
            item.nodeId === node.id && item.reply?.optionId === reply.id,
        )
      ),
  );
}

/**
 * Every line on screen right now, in order, across every node narrated
 * since the player's last answer (see `visibleTrailNodes`) — the lines a
 * UI should render instead of only `talkNode(talk, track.cursor)?.lines`.
 */
export function visibleLines(state: GameState, scene: Scene): TalkLine[] {
  const talk = talkOf(scene);
  const track = state.talk[scene.id];
  if (!talk || !track) return [];
  return visibleTrailNodes(talk, track).flatMap((node) =>
    (node.lines ?? []).filter(
      (line) => !line.requires || evaluate(line.requires, state),
    ),
  );
}

/** Applies a recorded line: what was said, its consequences, then onward. */
export function applyLine(
  state: GameState,
  scene: Scene,
  event: LineChosen,
): void {
  const talk = talkOf(scene);
  const track = state.talk[scene.id];
  const node = talk ? talkNode(talk, event.nodeId) : undefined;
  if (!talk || !track || !node) return;
  const origin: EffectOrigin = {
    sceneId: scene.id,
    eventId: event.id,
    at: event.at,
    ...(event.text ? { text: event.text } : {}),
  };
  let next: string | undefined;
  let effects: Effect[] = [];
  let evidence: Evidence[] = [];
  if (event.mode === 'timeout' && clockExpired(state, scene, event.at)) {
    next = talk.clock!.onEnd;
  } else if (node.ask) {
    if (event.mode === 'timeout') next = node.ask.onTimeout;
    else {
      const reply = node.ask.replies.find((r) => r.id === event.optionId);
      next = reply?.next;
      effects = reply?.effects ?? [];
      evidence = reply?.evidence ?? [];
    }
  } else if (node.write) {
    next =
      event.mode === 'declined'
        ? (node.write.declineNext ?? node.write.next)
        : node.write.next;
    if (event.mode === 'written') effects = node.write.effects ?? [];
  }
  const item = track.trail.findLast((t) => t.nodeId === node.id && !t.reply);
  if (item)
    item.reply = {
      optionId: event.optionId,
      mode: event.mode,
      ...(event.text ? { text: event.text } : {}),
    };
  state.lines.push({
    sceneId: scene.id,
    nodeId: event.nodeId,
    optionId: event.optionId,
    mode: event.mode,
    ...(event.text ? { text: event.text } : {}),
    eventId: event.id,
    at: event.at,
    hesitationMs: event.hesitationMs,
  });
  // Evidence and effects read the state as the line leaves it, like a choice.
  for (const item of evidence) {
    state.evidence[item.principleId] =
      (state.evidence[item.principleId] ?? 0) + item.weight;
    if (item.weight > 0)
      state.support[item.principleId] = {
        sceneId: scene.id,
        eventId: event.id,
      };
  }
  applyEffects(state, effects, state.choices, origin);
  walkTalk(state, scene, next ?? following(talk, node), origin);
}
