import { matchOutcome } from './effects';
import type { Content, GameState, Law } from './types';
export function lawStatement(law: Law, content: Content): string {
  return (
    law.customText ??
    law.statementText ??
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
/** Authored past-tense fact for the recorded choice of a scene, unrendered. */
export function choiceFact(
  sceneId: string,
  state: GameState,
  content: Content,
): string | null {
  const scene = content.scenes.find((s) => s.id === sceneId);
  if (!scene || !(sceneId in state.choices)) return null;
  const value = state.choices[sceneId]!;
  return scene.outcomes.find((o) => matchOutcome(o, value))?.fact ?? null;
}
/** The act that led to a law: frozen for inherited laws, else from its choice. */
export function lawOriginFact(
  law: Law,
  state: GameState,
  content: Content,
): string | null {
  if (!law.origin) return null;
  return law.origin.text ?? choiceFact(law.origin.sceneId, state, content);
}
