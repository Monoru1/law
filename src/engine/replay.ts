import { initialState, reduce } from './reducer';
import type { Content, GameEvent } from './types';
export function replay(events: GameEvent[], content: Content) { return events.reduce((state, event) => reduce(state, event, content), initialState()); }
export function summarizeChoicesForStats(events: GameEvent[]) { return events.filter((e): e is Extract<GameEvent, {type:'choice_locked'}> => e.type === 'choice_locked').filter(e => typeof e.value === 'string').map(e => ({ sceneId: e.sceneId, optionId: String(e.value) })); }
