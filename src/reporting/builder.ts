import { lawStatement } from '../engine/laws';
import type { Content, GameEvent, Law } from '../engine/types';
import type { SaveGame } from '../persistence/SaveAdapter';
import type {
  ConfrontationRecord,
  DecisionRecord,
  LawRecord,
  PlaytestReport,
} from './report';

const ANONYMOUS = 'Joueur anonyme';

// Confrontation answer labels mirror copy.confrontation
const ANSWER_LABELS: Record<string, string> = {
  maintain: 'Maintenir',
  nuance: 'Nuancer',
  abandon: 'Abandonner',
  silence: 'Ne pas répondre',
};

function resolveDisplayValue(
  sceneId: string,
  rawValue: string | number,
  inputKind: string,
  content: Content,
): string {
  const scene = content.scenes.find((s) => s.id === sceneId);
  if (!scene) return String(rawValue);

  const input = scene.input;
  if (
    (input.kind === 'binary' ||
      input.kind === 'choice' ||
      input.kind === 'glyph') &&
    typeof rawValue === 'string'
  ) {
    const option = input.options.find((o) => o.id === rawValue);
    if (option) return option.label;
  }
  if (input.kind === 'slider' && typeof rawValue === 'number') {
    if (rawValue === 0 && input.zeroLabel) return input.zeroLabel;
    return input.labelTemplate.replace('{{n}}', String(rawValue));
  }
  return String(rawValue);
}

// Scenes that are meta-inputs (not narrative decisions)
const SKIP_INPUT_KINDS = new Set(['confrontation', 'lawProposal']);

export function buildReport(
  save: SaveGame,
  content: Content,
): PlaytestReport | null {
  if (save.reportingConsent !== true) return null;

  const events = save.events;
  const completedEvent = events.find(
    (e): e is Extract<GameEvent, { type: 'run_completed' }> =>
      e.type === 'run_completed',
  );
  if (!completedEvent) return null;

  const startedEvent = events.find(
    (e): e is Extract<GameEvent, { type: 'run_started' }> =>
      e.type === 'run_started',
  );
  if (!startedEvent) return null;

  const pseudonym = (save.pseudonym ?? '').trim() || ANONYMOUS;

  // Build decisions
  const decisionEvents = events.filter(
    (e): e is Extract<GameEvent, { type: 'choice_locked' }> =>
      e.type === 'choice_locked',
  );

  let order = 0;
  const decisions: DecisionRecord[] = [];

  for (const ev of decisionEvents) {
    // Skip meta inputs
    if (SKIP_INPUT_KINDS.has(ev.input)) continue;

    const scene = content.scenes.find((s) => s.id === ev.sceneId);
    if (!scene) continue;

    order++;
    const certaintyEv = events.find(
      (e): e is Extract<GameEvent, { type: 'certainty_given' }> =>
        e.type === 'certainty_given' && e.sceneId === ev.sceneId,
    );
    const justificationEv = events.find(
      (e): e is Extract<GameEvent, { type: 'justification_given' }> =>
        e.type === 'justification_given' && e.sceneId === ev.sceneId,
    );

    decisions.push({
      order,
      sceneId: ev.sceneId,
      sceneTitle: scene.title,
      inputKind: ev.input,
      rawValue: ev.value,
      displayValue: resolveDisplayValue(
        ev.sceneId,
        ev.value,
        ev.input,
        content,
      ),
      hesitationMs: ev.hesitationMs,
      selectionChanges: ev.selectionChanges,
      ...(certaintyEv !== undefined ? { certainty: certaintyEv.value } : {}),
      ...(justificationEv !== undefined
        ? { justification: justificationEv.text }
        : {}),
    });
  }

  // Build laws from replay state
  // We reconstruct from events directly to avoid importing full replay
  const lawSignedEvents = events.filter(
    (e): e is Extract<GameEvent, { type: 'law_signed' }> =>
      e.type === 'law_signed',
  );
  const lawRevisedEvents = events.filter(
    (e): e is Extract<GameEvent, { type: 'law_revised' }> =>
      e.type === 'law_revised',
  );
  const lawAbandonedEvents = events.filter(
    (e): e is Extract<GameEvent, { type: 'law_abandoned' }> =>
      e.type === 'law_abandoned',
  );

  const laws: LawRecord[] = lawSignedEvents.map((signEv) => {
    const revisions = lawRevisedEvents
      .filter((r) => r.lawNumber === signEv.lawNumber)
      .map((r) => {
        const principle = content.principles.find(
          (p) => p.id === signEv.principleId,
        );
        const text =
          r.customText ??
          principle?.statements.find((s) => s.id === r.newStatementId)?.text ??
          '';
        return { text, at: r.at };
      });

    const isAbandoned = lawAbandonedEvents.some(
      (a) => a.lawNumber === signEv.lawNumber,
    );

    // Build a mock Law object to use lawStatement
    const mockLaw: Law = {
      number: signEv.lawNumber,
      principleId: signEv.principleId,
      statementId: signEv.statementId,
      status: isAbandoned ? 'abandoned' : 'signed',
      revisions: revisions.map((r) => ({
        at: r.at,
        statementId: null,
        customText: r.text,
        status: 'signed' as const,
      })),
      signedAtDecision: 0,
    };

    // Apply last revision
    const lastRevision = lawRevisedEvents
      .filter((r) => r.lawNumber === signEv.lawNumber)
      .at(-1);
    if (lastRevision) {
      mockLaw.statementId = lastRevision.newStatementId;
      mockLaw.customText = lastRevision.customText;
    }

    const currentStatement = lawStatement(mockLaw, content);

    const status: LawRecord['status'] = isAbandoned
      ? 'abandoned'
      : revisions.length > 0
        ? 'revised'
        : 'active';

    return {
      number: signEv.lawNumber,
      principleId: signEv.principleId,
      currentStatement,
      status,
      signedAt: signEv.at,
      revisions,
    };
  });

  // Build confrontations
  const confrontations: ConfrontationRecord[] = events
    .filter(
      (e): e is Extract<GameEvent, { type: 'confrontation_answered' }> =>
        e.type === 'confrontation_answered',
    )
    .map((ev) => ({
      lawNumber: ev.lawNumber,
      answer: ev.answer,
      displayAnswer: ANSWER_LABELS[ev.answer] ?? ev.answer,
      at: ev.at,
    }));

  // Factual summary
  const factualSummary = buildFactualSummary(
    decisions,
    laws,
    confrontations,
    events,
  );

  return {
    reportVersion: '1',
    contentVersion: save.contentVersion,
    runId: save.runId,
    pseudonym,
    consentGiven: true,
    startedAt: startedEvent.at,
    completedAt: completedEvent.at,
    durationMs: completedEvent.at - startedEvent.at,
    timelineId: completedEvent.timelineId,
    decisions,
    laws,
    confrontations,
    factualSummary,
  };
}

function buildFactualSummary(
  decisions: DecisionRecord[],
  laws: LawRecord[],
  confrontations: ConfrontationRecord[],
  events: GameEvent[],
): string[] {
  const summary: string[] = [];

  summary.push(`${decisions.length} décision(s) enregistrée(s).`);

  const avgHesitation =
    decisions.length > 0
      ? Math.round(
          decisions.reduce((acc, d) => acc + d.hesitationMs, 0) /
            decisions.length,
        )
      : 0;
  summary.push(`Temps moyen de décision : ${avgHesitation} ms.`);

  const withJustification = decisions.filter(
    (d) => d.justification !== undefined,
  );
  summary.push(
    `${withJustification.length} justification(s) écrite(s) sur ${decisions.length} décision(s).`,
  );

  if (laws.length === 0) {
    summary.push('Aucune loi signée.');
  } else {
    summary.push(`${laws.length} loi(s) signée(s).`);
    const abandoned = laws.filter((l) => l.status === 'abandoned');
    if (abandoned.length > 0)
      summary.push(`${abandoned.length} loi(s) abandonnée(s).`);
    const revised = laws.filter((l) => l.status === 'revised');
    if (revised.length > 0)
      summary.push(`${revised.length} loi(s) révisée(s).`);
  }

  if (confrontations.length > 0) {
    summary.push(`${confrontations.length} confrontation(s).`);
    const byCounts = new Map<string, number>();
    for (const c of confrontations) {
      byCounts.set(c.answer, (byCounts.get(c.answer) ?? 0) + 1);
    }
    for (const [answer, count] of byCounts.entries()) {
      summary.push(`${ANSWER_LABELS[answer] ?? answer} : ${count} fois.`);
    }
  }

  const skipped = events.filter((e) => e.type === 'scene_skipped').length;
  if (skipped > 0) summary.push(`${skipped} scène(s) passée(s).`);

  return summary;
}
