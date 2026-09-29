import { eventSchema } from './schema';
import { resolveScene } from './flow';
import { clockExpired, talkNode, talkOf, visibleReplies } from './talk';
import type { Content, GameEvent, GameState } from './types';

// Events that can only be recorded while the player is inside that scene.
const IN_SCENE = new Set<GameEvent['type']>([
  'choice_locked',
  'line_chosen',
  'certainty_given',
  'justification_given',
  'justification_declined',
  'scene_skipped',
]);

// Zod at boundaries: structural validation is followed by content validation.
export function validateEvent(
  event: GameEvent,
  state: GameState,
  content: Content,
): void {
  eventSchema.parse(event);
  const invalid = () => {
    throw new Error(`Invalid historical event ${event.id}`);
  };
  if (state.events.some((e) => e.id === event.id)) invalid();
  if (state.completed) invalid();
  // A journal starts exactly once; nothing is recorded before it starts.
  if ((event.type === 'run_started') !== (state.events.length === 0)) invalid();
  // A timeline built on an earlier one records that memory before anything else.
  if (content.inherits && state.events.length === 1)
    if (
      event.type !== 'memory_inherited' ||
      event.fromTimelineId !== content.inherits.timelineId
    )
      invalid();
  if (event.type === 'memory_inherited') {
    const primary = content.inherits;
    const source = [primary, ...(content.alsoInherits ?? [])].find(
      (s) => s?.timelineId === event.fromTimelineId,
    );
    const inherited = state.events.filter((e) => e.type === 'memory_inherited');
    // Memories are copied in before the first scene, once per source, the
    // primary one first.
    if (
      !source ||
      state.events.length < 1 ||
      !state.events.every(
        (e) => e.type === 'run_started' || e.type === 'memory_inherited',
      ) ||
      inherited.some((e) => e.fromTimelineId === event.fromTimelineId) ||
      (source !== primary && primary && inherited.length === 0)
    )
      invalid();
    const known = new Set(source?.sceneIds ?? []);
    const memory = event.memory;
    if (
      Object.keys(memory.choices).some((id) => !known.has(id)) ||
      Object.keys(memory.justifications).some((id) => !known.has(id))
    )
      invalid();
    for (const law of memory.laws) {
      const principle = content.principles.find(
        (p) => p.id === law.principleId,
      );
      if (
        !principle ||
        (law.statementId !== null &&
          !principle.statements.some((s) => s.id === law.statementId))
      )
        invalid();
    }
    if (
      new Set(memory.laws.map((law) => law.number)).size !== memory.laws.length
    )
      invalid();
  }
  if (IN_SCENE.has(event.type) && 'sceneId' in event)
    if (state.currentSceneId !== event.sceneId) invalid();
  if (event.type === 'run_completed') {
    // Completion follows the final gesture; it is never inferred earlier.
    if (
      event.timelineId !== content.timelineId ||
      !state.visited.includes(content.flow.codaSceneId)
    )
      invalid();
  }
  if ('sceneId' in event) {
    const raw = content.scenes.find((s) => s.id === event.sceneId);
    if (!raw) return invalid();
    if ('sceneVersion' in event && event.sceneVersion !== raw.version)
      invalid();
    if (event.type === 'choice_locked') {
      if (event.sceneId in state.choices) invalid();
      const { input } = resolveScene(raw, state);
      if (event.input !== input.kind) invalid();
      if (
        'options' in input &&
        !input.options.some((o) => o.id === event.value)
      )
        invalid();
      if (input.kind === 'slider') {
        const steps = (Number(event.value) - input.min) / input.step;
        if (
          typeof event.value !== 'number' ||
          event.value < input.min ||
          event.value > input.max ||
          Math.abs(steps - Math.round(steps)) > 1e-8
        )
          invalid();
      }
      if (
        input.kind === 'freeText' &&
        !['written', 'declined'].includes(String(event.value))
      )
        invalid();
      if (
        input.kind === 'confrontation' &&
        !['maintain', 'nuance', 'abandon', 'silence'].includes(
          String(event.value),
        )
      )
        invalid();
      if (
        input.kind === 'lawProposal' &&
        !['no', 'silence', 'signed'].includes(String(event.value))
      )
        invalid();
      if (input.kind === 'passage') invalid();
      if (input.kind === 'talk') {
        const track = state.talk[event.sceneId];
        // A conversation is locked only once it has reached an end, and on
        // exactly the outcome it ended on.
        if (!track || track.cursor !== null || track.end !== event.value)
          invalid();
      }
    }
    if (event.type === 'line_chosen') {
      const scene = resolveScene(raw, state);
      const talk = talkOf(scene);
      const track = state.talk[event.sceneId];
      const node =
        talk && track?.cursor ? talkNode(talk, track.cursor) : undefined;
      if (!talk || !track || !node || node.id !== event.nodeId)
        return invalid();
      if (event.sceneId in state.choices) invalid();
      if (event.mode === 'written' || event.mode === 'declined') {
        if (!node.write) invalid();
        if (
          event.mode === 'declined' &&
          (event.text || event.optionId !== 'declined')
        )
          invalid();
        if (event.mode === 'written') {
          const text = event.text?.trim() ?? '';
          if (
            event.optionId !== 'written' ||
            !text ||
            text !== event.text ||
            text.length > (node.write?.maxLength ?? 0)
          )
            invalid();
        }
      } else if (event.mode === 'timeout') {
        if (
          !(node.ask?.timeoutMs || clockExpired(state, scene, event.at)) ||
          event.optionId !== 'timeout' ||
          event.text
        )
          invalid();
      } else {
        // 'reply' or 'silence': a visible reply of the node, of matching kind.
        const reply = visibleReplies(state, scene, node).find(
          (r) => r.id === event.optionId,
        );
        if (
          !reply ||
          Boolean(reply.silent) !== (event.mode === 'silence') ||
          event.text
        )
          invalid();
      }
    }
  }
  if ('principleId' in event) {
    const principle = content.principles.find(
      (p) => p.id === event.principleId,
    );
    if (!principle) return invalid();
    if (
      'statementId' in event &&
      !principle.statements.some((s) => s.id === event.statementId)
    )
      invalid();
  }
  if (event.type === 'law_signed') {
    if (
      !Number.isInteger(event.lawNumber) ||
      event.lawNumber < 1 ||
      state.laws.some((l) => l.number === event.lawNumber)
    )
      invalid();
  }
  if (event.type === 'law_revised' || event.type === 'law_abandoned') {
    const law = state.laws.find((l) => l.number === event.lawNumber);
    if (!law) return invalid();
    if (
      event.type === 'law_revised' &&
      !(
        event.customText?.trim() ||
        content.principles
          .find((p) => p.id === law.principleId)
          ?.statements.some((s) => s.id === event.newStatementId)
      )
    )
      invalid();
  }
  if (
    event.type === 'confrontation_answered' &&
    (state.currentSceneId !== content.flow.confrontationSceneId ||
      !state.pendingConfrontations.length ||
      state.pendingConfrontations[0]?.lawNumber !== event.lawNumber)
  )
    invalid();
}
