import { applyEffects, matchOutcome } from './effects';
import type {
  Content,
  GameEvent,
  GameState,
  PendingConfrontation,
} from './types';
export const initialState = (): GameState => ({
  events: [],
  flags: [],
  vars: {},
  visited: [],
  choices: {},
  certainty: {},
  justifications: {},
  laws: [],
  declinedLaws: [],
  pendingLaws: [],
  schedules: [],
  pendingConfrontations: [],
  contradictions: [],
  confronted: [],
  evidence: {},
  relations: [],
  completed: false,
  currentSceneId: null,
  decisions: 0,
});
export function reduce(
  state: GameState,
  event: GameEvent,
  content: Content,
): GameState {
  const next: GameState = structuredClone(state);
  next.events.push(event);
  switch (event.type) {
    case 'run_started':
      return { ...initialState(), events: [event] };
    case 'scene_entered':
      if (!next.visited.includes(event.sceneId))
        next.visited.push(event.sceneId);
      next.currentSceneId = event.sceneId;
      if (event.sceneId === 't1.confrontation')
        delete next.choices[event.sceneId];
      break;
    case 'choice_locked': {
      if (event.sceneId in next.choices) break;
      next.choices[event.sceneId] = event.value;
      next.decisions++;
      const scene = content.scenes.find((s) => s.id === event.sceneId);
      if (!scene) break; // Deleted content must never destroy an existing save.
      const outcome = scene.outcomes.find((o) => matchOutcome(o, event.value));
      if (outcome) applyEffects(next, outcome.effects ?? [], next.choices);
      let evidence =
        scene.input.kind === 'binary' ||
        scene.input.kind === 'choice' ||
        scene.input.kind === 'glyph'
          ? (scene.input.options.find((o) => o.id === event.value)?.evidence ??
            [])
          : [];
      if (scene.input.kind === 'slider' && scene.id === 't1.combien')
        evidence = [
          {
            principleId: 'P_SACRIFICE_SOI',
            weight:
              Number(event.value) >= 7
                ? 1
                : Number(event.value) === 0
                  ? -0.5
                  : 0,
          },
        ];
      for (const item of evidence) {
        next.evidence[item.principleId] =
          (next.evidence[item.principleId] ?? 0) + item.weight;
        const law = next.laws.find(
          (l) => l.principleId === item.principleId && l.status === 'signed',
        );
        if (
          law &&
          item.weight <= -0.5 &&
          !next.confronted.includes(`${law.number}:${event.sceneId}`)
        ) {
          const pending: PendingConfrontation = {
            lawNumber: law.number,
            principleId: item.principleId,
            sceneId: event.sceneId,
          };
          const signature = next.events.find(
            (e) => e.type === 'law_signed' && e.lawNumber === law.number,
          );
          if (!signature) continue;
          next.contradictions.push({
            ...pending,
            choiceEventId: event.id,
            lawEventId: signature.id,
          });
          // The coda is final; its evidence remains available in the history.
          if (event.sceneId !== 't1.coda')
            next.pendingConfrontations.push(pending);
        }
      }
      break;
    }
    case 'certainty_given':
      next.certainty[event.sceneId] = event.value;
      break;
    case 'justification_given':
      next.justifications[event.sceneId] = event.text;
      break;
    case 'justification_declined':
      break;
    case 'law_proposed':
      if (!next.pendingLaws.some((l) => l.principleId === event.principleId))
        next.pendingLaws.push({
          principleId: event.principleId,
          statementId: event.statementId,
        });
      break;
    case 'law_signed':
      next.laws.push({
        number: event.lawNumber,
        principleId: event.principleId,
        statementId: event.statementId,
        status: 'signed',
        revisions: [
          { at: event.at, statementId: event.statementId, status: 'signed' },
        ],
        signedAtDecision: next.decisions,
      });
      next.pendingLaws = next.pendingLaws.filter(
        (l) => l.principleId !== event.principleId,
      );
      break;
    case 'law_declined':
      next.declinedLaws.push(event.principleId);
      next.pendingLaws = next.pendingLaws.filter(
        (l) => l.principleId !== event.principleId,
      );
      break;
    case 'law_revised': {
      const law = next.laws.find((l) => l.number === event.lawNumber);
      if (law) {
        law.statementId = event.newStatementId;
        law.customText = event.customText;
        law.revisions.push({
          at: event.at,
          statementId: event.newStatementId,
          customText: event.customText,
          status: 'signed',
        });
        if (
          next.pendingConfrontations.some((c) => c.lawNumber === law.number) &&
          !next.flags.includes('law_changed')
        )
          next.flags.push('law_changed');
      }
      break;
    }
    case 'law_abandoned': {
      const law = next.laws.find((l) => l.number === event.lawNumber);
      if (law) {
        law.status = 'abandoned';
        law.revisions.push({
          at: event.at,
          statementId: law.statementId,
          customText: law.customText,
          status: 'abandoned',
        });
        if (
          next.pendingConfrontations.some((c) => c.lawNumber === law.number) &&
          !next.flags.includes('law_changed')
        )
          next.flags.push('law_changed');
      }
      break;
    }
    case 'confrontation_answered': {
      const pending = next.pendingConfrontations[0];
      if (pending && pending.lawNumber === event.lawNumber) {
        next.pendingConfrontations.shift();
        next.confronted.push(`${pending.lawNumber}:${pending.sceneId}`);
        const contradiction = next.contradictions.find(
          (c) =>
            c.lawNumber === pending.lawNumber && c.sceneId === pending.sceneId,
        );
        if (contradiction) contradiction.answerEventId = event.id;
      }
      break;
    }
    case 'scene_skipped':
      if (!next.visited.includes(event.sceneId))
        next.visited.push(event.sceneId);
      if (event.sceneId === 't1.confrontation')
        next.pendingConfrontations.shift();
      break;
    case 'run_completed':
      next.completed = true;
      next.currentSceneId = null;
      break;
    case 'relation_event': {
      let record = next.relations.find(
        (r) => r.characterId === event.characterId,
      );
      if (!record) {
        record = { characterId: event.characterId, events: [] };
        next.relations.push(record);
      }
      record.events.push({
        kind: event.kind,
        sceneId: event.sceneId,
        at: event.at,
      });
      break;
    }
  }
  return next;
}
