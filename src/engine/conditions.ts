import type { Condition, GameState, Scalar } from './types';
function compare(a: Scalar | undefined, op: string, b: Scalar): boolean {
  if (a === undefined) return false;
  switch (op) { case '==': return a === b; case '!=': return a !== b; case '>': return a > b; case '>=': return a >= b; case '<': return a < b; case '<=': return a <= b; default: return false; }
}
export function evaluate(condition: Condition, state: GameState): boolean {
  if ('all' in condition) return condition.all.every(c => evaluate(c, state));
  if ('any' in condition) return condition.any.some(c => evaluate(c, state));
  if ('not' in condition) return !evaluate(condition.not, state);
  if ('flag' in condition) return state.flags.includes(condition.flag);
  if ('var' in condition) return compare(state.vars[condition.var], condition.op, condition.value);
  if ('chose' in condition) return state.choices[condition.chose.sceneId] === condition.chose.optionId;
  if ('value' in condition) return compare(state.choices[condition.value.sceneId], condition.value.op, condition.value.value);
  if ('answered' in condition) return condition.answered in state.justifications;
  if ('visited' in condition) return state.visited.includes(condition.visited);
  if ('contradiction' in condition) return condition.contradiction === 'pending' ? state.pendingConfrontations.length > 0 : state.pendingConfrontations.length === 0;
  const law = state.laws.find(l => l.principleId === condition.law.principleId);
  const status = law?.status ?? (state.declinedLaws.includes(condition.law.principleId) ? 'declined' : 'none');
  return status === condition.law.status;
}
