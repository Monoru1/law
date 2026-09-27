import { evaluate } from './conditions';
import { renderText } from './text';
import type { Content, GameState } from './types';
export function observations(state: GameState, content: Content): string[] {
  return content.observations
    .filter(
      (rule) =>
        state.decisions >= (rule.minDecisions ?? 0) &&
        evaluate(rule.when, state),
    )
    .map((rule) => {
      if (rule.id === 'o-hesitation') {
        const longest = state.events
          .filter((e) => e.type === 'choice_locked')
          .sort((a, b) => b.hesitationMs - a.hesitationMs)[0];
        return rule.text
          .replace(
            '{{scène}}',
            content.scenes.find((s) => s.id === longest?.sceneId)?.title ?? '',
          )
          .replace(
            '{{secondes}}',
            ((seconds) => `${seconds} seconde${seconds > 1 ? 's' : ''}`)(
              Math.round((longest?.hesitationMs ?? 0) / 1000),
            ),
          );
      }
      return renderText(rule.text, state, content);
    });
}
