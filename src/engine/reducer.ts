import { applyEffects, choiceEvidence, matchOutcome } from './effects';
import { resolveScene } from './flow';
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
  support: {},
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
  const flow = content.flow;
  switch (event.type) {
    case 'run_started':
      return { ...initialState(), events: [event] };
    case 'memory_inherited': {
      // The earlier timeline is copied, not referenced: this journal keeps
      // what the player did even if the earlier save is later erased.
      const memory = event.memory;
      Object.assign(next.choices, memory.choices);
      Object.assign(next.justifications, memory.justifications);
      for (const flag of memory.flags)
        if (!next.flags.includes(flag)) next.flags.push(flag);
      Object.assign(next.vars, memory.vars);
      Object.assign(next.evidence, memory.evidence);
      for (const principleId of memory.declinedLaws)
        if (!next.declinedLaws.includes(principleId))
          next.declinedLaws.push(principleId);
      for (const law of memory.laws)
        next.laws.push({
          number: law.number,
          principleId: law.principleId,
          statementId: law.statementId,
          statementText: law.statementText,
          customText: law.customText,
          status: law.status,
          revisions: structuredClone(law.revisions),
          signedAtDecision: 0,
          sourceEventId: event.id,
          inheritedFrom: event.fromTimelineId,
          origin: law.origin ? { ...law.origin, eventId: event.id } : undefined,
        });
      break;
    }
    case 'scene_entered':
      if (!next.visited.includes(event.sceneId))
        next.visited.push(event.sceneId);
      next.currentSceneId = event.sceneId;
      // A confrontation can be visited again; only its current answer resets.
      if (event.sceneId === flow.confrontationSceneId)
        delete next.choices[event.sceneId];
      break;
    case 'choice_locked': {
      if (event.sceneId in next.choices) break;
      const raw = content.scenes.find((s) => s.id === event.sceneId);
      const scene = raw ? resolveScene(raw, state) : undefined;
      // Evidence reads the state before this choice changes it.
      const evidence = scene ? choiceEvidence(scene, event.value, state) : [];
      next.choices[event.sceneId] = event.value;
      next.decisions++;
      if (!scene) break; // Deleted content must never destroy an existing save.
      const outcome = scene.outcomes.find((o) => matchOutcome(o, event.value));
      if (outcome)
        applyEffects(next, outcome.effects ?? [], next.choices, {
          sceneId: event.sceneId,
          eventId: event.id,
          at: event.at,
        });
      for (const item of evidence) {
        next.evidence[item.principleId] =
          (next.evidence[item.principleId] ?? 0) + item.weight;
        if (item.weight > 0)
          next.support[item.principleId] = {
            sceneId: event.sceneId,
            eventId: event.id,
          };
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
          if (!law.sourceEventId) continue;
          // The coda is final; its evidence remains available in the history.
          // A law already raised in this journal is not raised again: the
          // contradiction is kept, the player is not interrupted twice.
          const raised =
            event.sceneId !== flow.codaSceneId &&
            !next.contradictions.some(
              (c) => c.lawNumber === law.number && c.raised,
            );
          next.contradictions.push({
            ...pending,
            choiceEventId: event.id,
            lawEventId: law.sourceEventId,
            raised,
          });
          if (raised) next.pendingConfrontations.push(pending);
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
    case 'law_signed': {
      const support = next.support[event.principleId];
      next.laws.push({
        number: event.lawNumber,
        principleId: event.principleId,
        statementId: event.statementId,
        statementText: event.statementText,
        status: 'signed',
        revisions: [
          {
            at: event.at,
            statementId: event.statementId,
            statementText: event.statementText,
            status: 'signed',
          },
        ],
        signedAtDecision: next.decisions,
        sourceEventId: event.id,
        origin: support ? { ...support } : undefined,
      });
      next.pendingLaws = next.pendingLaws.filter(
        (l) => l.principleId !== event.principleId,
      );
      break;
    }
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
        law.statementText = event.statementText;
        law.customText = event.customText;
        law.revisions.push({
          at: event.at,
          statementId: event.newStatementId,
          statementText: event.statementText,
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
          statementText: law.statementText,
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
      if (event.sceneId === flow.confrontationSceneId)
        next.pendingConfrontations.shift();
      break;
    case 'run_completed':
      next.completed = true;
      next.currentSceneId = null;
      break;
  }
  return next;
}
