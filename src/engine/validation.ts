import { eventSchema } from './schema';
import { resolveScene } from './flow';
import type { Content, GameEvent, GameState } from './types';

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
  if (
    event.type === 'run_started' &&
    (event.contentVersion !== content.version || state.events.length)
  )
    invalid();
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
    (!state.pendingConfrontations.length ||
      state.pendingConfrontations[0]?.lawNumber !== event.lawNumber)
  )
    invalid();
}
