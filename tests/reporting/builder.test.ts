import { describe, expect, it } from 'vitest';
import { content } from '../../src/content';
import { buildReport } from '../../src/reporting/builder';
import {
  contentIdentity,
  CURRENT_SCHEMA_VERSION,
} from '../../src/persistence/migrations';
import {
  defaultSettings,
  type SaveGame,
} from '../../src/persistence/SaveAdapter';
import type { GameEvent } from '../../src/engine/types';

let serial = 0;
type Draft = GameEvent extends infer E
  ? E extends GameEvent
    ? Omit<E, 'id' | 'at'>
    : never
  : never;
const event = (draft: Draft): GameEvent =>
  ({ ...draft, id: `t-${++serial}`, at: serial * 100 }) as unknown as GameEvent;

function makeSave(
  events: GameEvent[],
  overrides: Partial<SaveGame> = {},
): SaveGame {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    contentVersion: content.version,
    contentIdentity: contentIdentity(content),
    runId: 'run-test',
    createdAt: 1,
    updatedAt: 1,
    events: [
      event({ type: 'run_started', contentVersion: content.version }),
      ...events,
    ],
    settings: { ...defaultSettings },
    reportingConsent: true,
    pseudonym: 'Atlas',
    ...overrides,
  };
}

const boutonScene = content.scenes.find((s) => s.id === 't1.bouton')!;

const baseEvents: GameEvent[] = [
  event({
    type: 'choice_locked',
    sceneId: 't1.bouton',
    sceneVersion: boutonScene.version,
    input: 'binary',
    value: 'appuyer',
    hesitationMs: 3000,
    selectionChanges: 1,
  }),
  event({ type: 'run_completed', timelineId: 't1' }),
];

describe('buildReport', () => {
  it('retourne null si reportingConsent absent', () => {
    const save = makeSave(baseEvents, { reportingConsent: undefined });
    expect(buildReport(save, content)).toBeNull();
  });

  it('retourne null si reportingConsent === false', () => {
    const save = makeSave(baseEvents, { reportingConsent: false });
    expect(buildReport(save, content)).toBeNull();
  });

  it('retourne null si run non terminé', () => {
    const save = makeSave(
      [
        event({
          type: 'choice_locked',
          sceneId: 't1.bouton',
          sceneVersion: boutonScene.version,
          input: 'binary',
          value: 'appuyer',
          hesitationMs: 1000,
          selectionChanges: 0,
        }),
      ],
      {},
    );
    expect(buildReport(save, content)).toBeNull();
  });

  it('construit un rapport complet', () => {
    const save = makeSave(baseEvents);
    const report = buildReport(save, content);
    expect(report).not.toBeNull();
    expect(report!.pseudonym).toBe('Atlas');
    expect(report!.consentGiven).toBe(true);
    expect(report!.runId).toBe('run-test');
    expect(report!.reportVersion).toBe('1');
  });

  it('ancienne save sans pseudo → "Joueur anonyme"', () => {
    const save = makeSave(baseEvents, { pseudonym: undefined });
    const report = buildReport(save, content);
    expect(report!.pseudonym).toBe('Joueur anonyme');
  });

  it('pseudo whitespace-only → "Joueur anonyme"', () => {
    const save = makeSave(baseEvents, { pseudonym: '   ' });
    const report = buildReport(save, content);
    expect(report!.pseudonym).toBe('Joueur anonyme');
  });

  it('décision avec label humain correct', () => {
    const save = makeSave(baseEvents);
    const report = buildReport(save, content);
    expect(report!.decisions).toHaveLength(1);
    const d = report!.decisions[0]!;
    expect(d.sceneId).toBe('t1.bouton');
    expect(d.displayValue).toBe('Appuyer');
    expect(d.rawValue).toBe('appuyer');
    expect(d.inputKind).toBe('binary');
  });

  it('hesitation et selectionChanges transmis', () => {
    const save = makeSave(baseEvents);
    const report = buildReport(save, content);
    expect(report!.decisions[0]!.hesitationMs).toBe(3000);
    expect(report!.decisions[0]!.selectionChanges).toBe(1);
  });

  it('certainty transmise si présente', () => {
    const events: GameEvent[] = [
      event({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: boutonScene.version,
        input: 'binary',
        value: 'appuyer',
        hesitationMs: 500,
        selectionChanges: 0,
      }),
      event({ type: 'certainty_given', sceneId: 't1.bouton', value: 75 }),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const save = makeSave(events);
    const report = buildReport(save, content);
    expect(report!.decisions[0]!.certainty).toBe(75);
  });

  it('justification transmise si présente', () => {
    const events: GameEvent[] = [
      event({
        type: 'justification_given',
        sceneId: 't1.bouton',
        text: 'Parce que.',
      }),
      event({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: boutonScene.version,
        input: 'binary',
        value: 'appuyer',
        hesitationMs: 500,
        selectionChanges: 0,
      }),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const save = makeSave(events);
    const report = buildReport(save, content);
    expect(report!.decisions[0]!.justification).toBe('Parce que.');
  });

  it('loi signée apparaît dans laws avec status active', () => {
    const events: GameEvent[] = [
      event({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: boutonScene.version,
        input: 'binary',
        value: 'appuyer',
        hesitationMs: 100,
        selectionChanges: 0,
      }),
      event({
        type: 'law_signed',
        lawNumber: 1,
        principleId: content.principles[0]!.id,
        statementId: content.principles[0]!.statements[0]!.id,
      }),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const save = makeSave(events);
    const report = buildReport(save, content);
    expect(report!.laws).toHaveLength(1);
    expect(report!.laws[0]!.status).toBe('active');
    expect(report!.laws[0]!.number).toBe(1);
  });

  it('loi révisée → status revised', () => {
    const principleId = content.principles[0]!.id;
    const statementId = content.principles[0]!.statements[0]!.id;
    const events: GameEvent[] = [
      event({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: boutonScene.version,
        input: 'binary',
        value: 'appuyer',
        hesitationMs: 100,
        selectionChanges: 0,
      }),
      event({ type: 'law_signed', lawNumber: 1, principleId, statementId }),
      event({
        type: 'law_revised',
        lawNumber: 1,
        newStatementId: null,
        customText: 'Ma propre loi.',
      }),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const save = makeSave(events);
    const report = buildReport(save, content);
    expect(report!.laws[0]!.status).toBe('revised');
    expect(report!.laws[0]!.revisions).toHaveLength(1);
    expect(report!.laws[0]!.revisions[0]!.text).toBe('Ma propre loi.');
  });

  it('loi abandonnée → status abandoned', () => {
    const principleId = content.principles[0]!.id;
    const statementId = content.principles[0]!.statements[0]!.id;
    const events: GameEvent[] = [
      event({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: boutonScene.version,
        input: 'binary',
        value: 'appuyer',
        hesitationMs: 100,
        selectionChanges: 0,
      }),
      event({ type: 'law_signed', lawNumber: 1, principleId, statementId }),
      event({ type: 'law_abandoned', lawNumber: 1 }),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const save = makeSave(events);
    const report = buildReport(save, content);
    expect(report!.laws[0]!.status).toBe('abandoned');
  });

  it('confrontation_answered apparaît dans confrontations', () => {
    const events: GameEvent[] = [
      event({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: boutonScene.version,
        input: 'binary',
        value: 'appuyer',
        hesitationMs: 100,
        selectionChanges: 0,
      }),
      event({
        type: 'confrontation_answered',
        lawNumber: 1,
        answer: 'maintain',
      }),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const save = makeSave(events);
    const report = buildReport(save, content);
    expect(report!.confrontations).toHaveLength(1);
    expect(report!.confrontations[0]!.answer).toBe('maintain');
    expect(report!.confrontations[0]!.displayAnswer).toBe('Maintenir');
    expect(report!.confrontations[0]!.lawNumber).toBe(1);
  });

  it('confrontation liée à sa scène via le choice_locked qui suit', () => {
    const confrontationScene = content.scenes.find(
      (s) => s.id === 't1.confrontation',
    )!;
    const events: GameEvent[] = [
      event({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: boutonScene.version,
        input: 'binary',
        value: 'appuyer',
        hesitationMs: 100,
        selectionChanges: 0,
      }),
      event({
        type: 'confrontation_answered',
        lawNumber: 1,
        answer: 'maintain',
      }),
      event({
        type: 'choice_locked',
        sceneId: 't1.confrontation',
        sceneVersion: confrontationScene.version,
        input: 'confrontation',
        value: 'maintain',
        hesitationMs: 200,
        selectionChanges: 0,
      }),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const save = makeSave(events);
    const report = buildReport(save, content);
    expect(report!.confrontations[0]!.sceneId).toBe('t1.confrontation');
    expect(report!.confrontations[0]!.sceneTitle).toBe(
      confrontationScene.title,
    );
    // Le lock 'confrontation' ne doit pas apparaître comme une décision narrative distincte.
    expect(
      report!.decisions.some((d) => d.sceneId === 't1.confrontation'),
    ).toBe(false);
  });

  it('proposition de loi déclinée apparaît avec number: null et status declined', () => {
    const principleId = content.principles[0]!.id;
    const events: GameEvent[] = [
      event({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: boutonScene.version,
        input: 'binary',
        value: 'appuyer',
        hesitationMs: 100,
        selectionChanges: 0,
      }),
      event({ type: 'law_declined', principleId }),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const save = makeSave(events);
    const report = buildReport(save, content);
    const declined = report!.laws.find((l) => l.status === 'declined');
    expect(declined).toBeDefined();
    expect(declined!.number).toBeNull();
    expect(declined!.principleId).toBe(principleId);
    expect(report!.factualSummary.some((s) => s.includes('déclinée'))).toBe(
      true,
    );
  });

  it('une loi déclinée puis signée pour le même principe n’apparaît pas comme déclinée', () => {
    const principleId = content.principles[0]!.id;
    const statementId = content.principles[0]!.statements[0]!.id;
    const events: GameEvent[] = [
      event({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: boutonScene.version,
        input: 'binary',
        value: 'appuyer',
        hesitationMs: 100,
        selectionChanges: 0,
      }),
      event({ type: 'law_declined', principleId }),
      event({ type: 'law_signed', lawNumber: 1, principleId, statementId }),
      event({ type: 'run_completed', timelineId: 't1' }),
    ];
    const save = makeSave(events);
    const report = buildReport(save, content);
    expect(report!.laws).toHaveLength(1);
    expect(report!.laws[0]!.status).toBe('active');
  });

  it('factualSummary contient le nombre de décisions', () => {
    const save = makeSave(baseEvents);
    const report = buildReport(save, content);
    expect(report!.factualSummary.some((s) => s.includes('1 décision'))).toBe(
      true,
    );
  });

  it('aucune vraie clé Brevo dans les données de test', () => {
    // Vérification que le fichier de test ne contient pas de secrets
    const save = makeSave(baseEvents);
    const report = buildReport(save, content);
    const serialized = JSON.stringify(report);
    expect(serialized).not.toMatch(/brevo|api.key|BREVO/i);
  });
});
