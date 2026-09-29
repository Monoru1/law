import { lawOriginFact, lawStatement } from './laws';
import { renderText } from './text';
import type { Content, GameEvent, GameState, Memory } from './types';
type ConfrontationAnswered = Extract<
  GameEvent,
  { type: 'confrontation_answered' }
>;

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
    relations: state.relations.map((record) => ({
      characterId: record.characterId,
      events: record.events.map((event) => ({ ...event })),
    })),
    rules: state.rules.map((record) => ({
      ruleId: record.ruleId,
      events: record.events.map((event) => ({ ...event })),
    })),
    certainty: { ...state.certainty },
    notes: state.notes.map((note) => structuredClone(note)),
    lines: state.lines.map((line) => structuredClone(line)),
    // Every contradiction this run closed, plus whatever it had already
    // inherited: the chain composes without this timeline knowing where an
    // earlier one came from.
    contradictions: [
      ...state.inheritedContradictions,
      ...state.contradictions.map((c) => {
        const answered = c.answerEventId
          ? state.events.find(
              (e): e is ConfrontationAnswered =>
                e.id === c.answerEventId && e.type === 'confrontation_answered',
            )
          : undefined;
        return {
          lawNumber: c.lawNumber,
          principleId: c.principleId,
          sceneId: c.sceneId,
          raised: c.raised,
          ...(answered ? { answer: answered.answer } : {}),
        };
      }),
    ],
  };
}
