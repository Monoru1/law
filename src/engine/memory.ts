import { lawOriginFact, lawStatement } from './laws';
import { renderText } from './text';
import type { Content, GameState, Memory } from './types';

const lowerFirst = (text: string) =>
  text.charAt(0).toLocaleLowerCase('fr-FR') + text.slice(1);

/**
 * Freezes what a completed timeline leaves behind. Text the player saw or
 * signed is copied verbatim so later content edits cannot rewrite it.
 */
export function buildMemory(
  state: GameState,
  content: Content,
  place: string,
): Memory {
  const completed = state.events.findLast((e) => e.type === 'run_completed');
  if (!state.completed || !completed)
    throw new Error('Only a completed timeline can be remembered.');
  return {
    completedAt: completed.at,
    decisions: state.decisions,
    choices: { ...state.choices },
    justifications: { ...state.justifications },
    flags: [...state.flags],
    vars: { ...state.vars },
    evidence: { ...state.evidence },
    declinedLaws: [...state.declinedLaws],
    laws: state.laws.map((law) => {
      const fact = lawOriginFact(law, state, content);
      return {
        number: law.number,
        principleId: law.principleId,
        statementId: law.statementId,
        statementText:
          law.statementText ??
          lawStatement({ ...law, customText: undefined }, content),
        ...(law.customText !== undefined ? { customText: law.customText } : {}),
        status: law.status,
        revisions: law.revisions.map((revision) => ({
          ...revision,
          statementText:
            revision.statementText ??
            content.principles
              .find((p) => p.id === law.principleId)
              ?.statements.find((s) => s.id === revision.statementId)?.text,
        })),
        ...(law.origin && fact
          ? {
              origin: {
                sceneId: law.origin.sceneId,
                text: `${place}, ${lowerFirst(renderText(fact, state, content))}`,
              },
            }
          : {}),
      };
    }),
  };
}
