import { evaluate } from './conditions';
import type { ChoiceValue, Effect, GameState, Outcome } from './types';
export function matchOutcome(outcome: Outcome, value: ChoiceValue): boolean {
  if ('any' in outcome.when) return true;
  if ('optionId' in outcome.when) return outcome.when.optionId === value;
  return (
    typeof value === 'number' &&
    value >= outcome.when.range[0] &&
    value <= outcome.when.range[1]
  );
}
export function applyEffects(
  state: GameState,
  effects: Effect[],
  choices: GameState['choices'],
): void {
  for (const effect of effects) {
    if ('setFlag' in effect && !state.flags.includes(effect.setFlag))
      state.flags.push(effect.setFlag);
    else if ('setVar' in effect) state.vars[effect.setVar] = effect.value;
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
  }
}
export function resolvedBeats<
  T extends { requires?: import('./types').Condition },
>(beats: T[], state: GameState): T[] {
  return beats.filter(
    (beat) => !beat.requires || evaluate(beat.requires, state),
  );
}
