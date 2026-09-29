import { evaluate } from './conditions';
import type {
  ChoiceValue,
  Effect,
  Evidence,
  GameState,
  Outcome,
  Scene,
} from './types';
export function matchOutcome(outcome: Outcome, value: ChoiceValue): boolean {
  if ('any' in outcome.when) return true;
  if ('optionId' in outcome.when) return outcome.when.optionId === value;
  return (
    typeof value === 'number' &&
    value >= outcome.when.range[0] &&
    value <= outcome.when.range[1]
  );
}
/** The choice that produced an effect; relations inherit its identity. */
export type EffectOrigin = {
  sceneId: string;
  eventId: string;
  at: number;
  // What the player wrote at the line that produced the effect, if anything.
  text?: string;
};
export function applyEffects(
  state: GameState,
  effects: Effect[],
  choices: GameState['choices'],
  origin?: EffectOrigin,
): void {
  for (const effect of effects) {
    if ('if' in effect) {
      if (evaluate(effect.if, state))
        applyEffects(state, effect.then, choices, origin);
    } else if ('note' in effect) {
      // Notes, like relations, are consequences of a recorded line.
      if (!origin) continue;
      const spec = effect.note;
      const text = spec.fromText ? origin.text : spec.text;
      if (spec.fromText && !text) continue;
      state.notes.push({
        id: `${origin.eventId}#${state.notes.length}`,
        kind: spec.kind,
        status: spec.status ?? 'fact',
        tags: [...spec.tags],
        sceneId: origin.sceneId,
        eventId: origin.eventId,
        at: origin.at,
        ...(text ? { text } : {}),
        stance: 'open',
      });
    } else if ('stance' in effect) {
      const target = state.notes.findLast((n) =>
        n.tags.includes(effect.stance.tag),
      );
      if (target) target.stance = effect.stance.stance;
    } else if ('setFlag' in effect) {
      if (!state.flags.includes(effect.setFlag))
        state.flags.push(effect.setFlag);
    } else if ('setVar' in effect) state.vars[effect.setVar] = effect.value;
    else if ('incVar' in effect) {
      const by =
        typeof effect.by === 'number'
          ? effect.by
          : choices[effect.by.fromValueOf];
      state.vars[effect.incVar] =
        Number(state.vars[effect.incVar] ?? 0) +
        (typeof by === 'number' ? by : 0);
    } else if ('schedule' in effect) {
      if (!state.schedules.some((s) => s.sceneId === effect.schedule.sceneId))
        state.schedules.push(effect.schedule);
    } else if ('proposeLaw' in effect)
      state.pendingLaws.push(effect.proposeLaw);
    else if ('relationEvent' in effect) {
      // A relation is a consequence of a recorded choice, never of a clock.
      if (!origin) continue;
      let record = state.relations.find(
        (r) => r.characterId === effect.relationEvent.characterId,
      );
      if (!record) {
        record = { characterId: effect.relationEvent.characterId, events: [] };
        state.relations.push(record);
      }
      record.events.push({
        kind: effect.relationEvent.kind,
        sceneId: origin.sceneId,
        at: origin.at,
        eventId: origin.eventId,
      });
    } else if (
      'ruleEnacted' in effect ||
      'ruleRevised' in effect ||
      'ruleApplied' in effect ||
      'exceptionGranted' in effect
    ) {
      // A collective rule's whole history, appended fact by fact and never
      // rewritten — the same pattern as a relation, one choice at a time.
      if (!origin) continue;
      const [kind, detail] =
        'ruleEnacted' in effect
          ? (['enacted', effect.ruleEnacted] as const)
          : 'ruleRevised' in effect
            ? (['revised', effect.ruleRevised] as const)
            : 'ruleApplied' in effect
              ? (['applied', effect.ruleApplied] as const)
              : (['exception', effect.exceptionGranted] as const);
      let record = state.rules.find((r) => r.ruleId === detail.ruleId);
      if (!record) {
        record = { ruleId: detail.ruleId, events: [] };
        state.rules.push(record);
      }
      record.events.push({
        kind,
        ...('criterionId' in detail ? { criterionId: detail.criterionId } : {}),
        ...('personId' in detail ? { personId: detail.personId } : {}),
        ...('outcome' in detail ? { outcome: detail.outcome } : {}),
        sceneId: origin.sceneId,
        at: origin.at,
        eventId: origin.eventId,
      });
    }
  }
}
/** Evidence a recorded choice gives, evaluated against the state before it. */
export function choiceEvidence(
  scene: Scene,
  value: ChoiceValue,
  state: GameState,
): Evidence[] {
  const input = scene.input;
  if (
    input.kind === 'binary' ||
    input.kind === 'choice' ||
    input.kind === 'glyph'
  )
    return (input.options.find((o) => o.id === value)?.evidence ?? []).filter(
      (item) => !item.when || evaluate(item.when, state),
    );
  if (input.kind === 'slider' && scene.id === 't1.combien')
    return [
      {
        principleId: 'P_SACRIFICE_SOI',
        weight: Number(value) >= 7 ? 1 : Number(value) === 0 ? -0.5 : 0,
      },
    ];
  return [];
}
export function resolvedBeats<
  T extends { requires?: import('./types').Condition },
>(beats: T[], state: GameState): T[] {
  return beats.filter(
    (beat) => !beat.requires || evaluate(beat.requires, state),
  );
}
