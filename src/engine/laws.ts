import type { Content, GameState, Law } from './types';
export function lawStatement(law: Law, content: Content): string {
  return (
    law.customText ??
    content.principles
      .find((p) => p.id === law.principleId)
      ?.statements.find((s) => s.id === law.statementId)?.text ??
    ''
  );
}
export function nextLawNumber(state: GameState): number {
  return Math.max(0, ...state.laws.map((l) => l.number)) + 1;
}
export function dominantUnsignedPrinciple(state: GameState, content: Content) {
  return (
    content.principles
      .filter((p) => !state.laws.some((l) => l.principleId === p.id))
      .sort((a, b) => (state.evidence[b.id] ?? 0) - (state.evidence[a.id] ?? 0))
      .find((p) => (state.evidence[p.id] ?? 0) >= 1.5) ?? null
  );
}
