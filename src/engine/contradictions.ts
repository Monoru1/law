import type { GameState } from './types';
export function pendingContradiction(state: GameState) { return state.pendingConfrontations[0] ?? null; }
