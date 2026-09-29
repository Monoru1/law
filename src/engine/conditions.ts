import type { Condition, GameState, Scalar } from './types';
function compare(a: Scalar | undefined, op: string, b: Scalar): boolean {
  if (a === undefined) return false;
  switch (op) {
    case '==':
      return a === b;
    case '!=':
      return a !== b;
    case '>':
      return a > b;
    case '>=':
      return a >= b;
    case '<':
      return a < b;
    case '<=':
      return a <= b;
    default:
      return false;
  }
}
export function evaluate(condition: Condition, state: GameState): boolean {
  if ('all' in condition) return condition.all.every((c) => evaluate(c, state));
  if ('any' in condition) return condition.any.some((c) => evaluate(c, state));
  if ('not' in condition) return !evaluate(condition.not, state);
  if ('flag' in condition) return state.flags.includes(condition.flag);
  if ('var' in condition)
    return compare(state.vars[condition.var], condition.op, condition.value);
  if ('chose' in condition)
    return state.choices[condition.chose.sceneId] === condition.chose.optionId;
  if ('value' in condition)
    return compare(
      state.choices[condition.value.sceneId],
      condition.value.op,
      condition.value.value,
    );
  if ('answered' in condition)
    return condition.answered in state.justifications;
  if ('visited' in condition) return state.visited.includes(condition.visited);
  if ('relation' in condition)
    return state.relations.some(
      (record) =>
        record.characterId === condition.relation.characterId &&
        record.events.some((event) => event.kind === condition.relation.kind),
    );
  if ('contradiction' in condition)
    return condition.contradiction === 'pending'
      ? state.pendingConfrontations.length > 0
      : state.pendingConfrontations.length === 0;
  if ('noted' in condition) {
    const { tag, status, stance } = condition.noted;
    return state.notes.some(
      (n) =>
        n.tags.includes(tag) &&
        (!status || n.status === status) &&
        (!stance || n.stance === stance),
    );
  }
  if ('said' in condition) {
    const { sceneId, nodeId, optionId, mode } = condition.said;
    return state.lines.some(
      (l) =>
        l.sceneId === sceneId &&
        l.nodeId === nodeId &&
        (!optionId || l.optionId === optionId) &&
        (!mode || l.mode === mode),
    );
  }
  if ('rule' in condition) {
    const record = state.rules.find((r) => r.ruleId === condition.rule.ruleId);
    const current = record?.events.findLast(
      (event) => event.kind === 'enacted' || event.kind === 'revised',
    );
    return current?.criterionId === condition.rule.criterionId;
  }
  const law = state.laws.find(
    (l) => l.principleId === condition.law.principleId,
  );
  const status =
    law?.status ??
    (state.declinedLaws.includes(condition.law.principleId)
      ? 'declined'
      : 'none');
  return status === condition.law.status;
}
