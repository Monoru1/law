import { eventSchema } from './schema';
import { resolveScene } from './flow';
import type { Content, GameEvent, GameState } from './types';

// Events that can only be recorded while the player is inside that scene.
const IN_SCENE = new Set<GameEvent['type']>([
  'choice_locked',
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
    if (!content.inherits || state.events.length !== 1) invalid();
    const known = new Set(content.inherits?.sceneIds ?? []);
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
