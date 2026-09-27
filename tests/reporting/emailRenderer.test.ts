import { describe, expect, it } from 'vitest';
import {
  emailSubject,
  escapeHtml,
  renderEmailHtml,
  renderEmailText,
} from '../../src/reporting/emailRenderer';
import type { PlaytestReport } from '../../src/reporting/report';

function makeReport(overrides: Partial<PlaytestReport> = {}): PlaytestReport {
  return {
    reportVersion: '1',
    contentVersion: '1.0.0',
    runId: 'run-xyz',
    pseudonym: 'Atlas',
    consentGiven: true,
    startedAt: 0,
    completedAt: 120_000,
    durationMs: 120_000,
    timelineId: 't1',
    decisions: [],
    laws: [],
    confrontations: [],
    factualSummary: [],
    ...overrides,
  };
}

describe('escapeHtml', () => {
  it('échappe les cinq caractères sensibles', () => {
    expect(escapeHtml('<script>alert("x")</script> & \'x\'')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#x27;x&#x27;',
    );
  });

  it('laisse le texte normal intact', () => {
    expect(escapeHtml('Parce que je le pense.')).toBe('Parce que je le pense.');
  });
});

describe('emailSubject', () => {
  it('suit le format THE LAW — Playtest — {pseudo} — {date}', () => {
    const report = makeReport({ pseudonym: 'Atlas', completedAt: 0 });
    expect(emailSubject(report)).toBe(
      `THE LAW — Playtest — Atlas — ${new Date(0).toISOString().slice(0, 10)}`,
    );
  });
});

describe('renderEmailHtml', () => {
  it('échappe un pseudonyme et une justification malveillants', () => {
    const report = makeReport({
      pseudonym: '<img src=x onerror=alert(1)>',
      decisions: [
        {
          order: 1,
          sceneId: 't1.bouton',
          sceneTitle: 'Le bouton',
          inputKind: 'binary',
          rawValue: 'appuyer',
          displayValue: 'Appuyer',
          hesitationMs: 100,
          selectionChanges: 0,
          justification: '<script>document.cookie</script>',
        },
      ],
    });
    const html = renderEmailHtml(report);
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script>document.cookie</script>');
    expect(html).toContain('&lt;script&gt;document.cookie&lt;/script&gt;');
  });

  it('affiche un message neutre sans loi ni confrontation', () => {
    const html = renderEmailHtml(makeReport());
    expect(html).toContain('Aucune loi signée.');
    expect(html).toContain('Aucune confrontation.');
    expect(html).toContain('Aucune justification écrite.');
  });

  it('distingue une proposition déclinée d’une loi signée', () => {
    const html = renderEmailHtml(
      makeReport({
        laws: [
          {
            number: null,
            principleId: 'P_TEST',
            currentStatement: '',
            status: 'declined',
            signedAt: null,
            declinedAt: 100,
            revisions: [],
          },
        ],
      }),
    );
    expect(html).toContain('Proposition déclinée');
    expect(html).not.toContain('nullnull');
  });

  it('ne contient jamais de contenu lié à Brevo ou une clé API', () => {
    const html = renderEmailHtml(makeReport());
    expect(html).not.toMatch(/brevo|api.key/i);
  });
});

describe('renderEmailText', () => {
  it('ne contient aucune balise HTML', () => {
    const report = makeReport({
      decisions: [
        {
          order: 1,
          sceneId: 't1.bouton',
          sceneTitle: 'Le bouton',
          inputKind: 'binary',
          rawValue: 'appuyer',
          displayValue: 'Appuyer',
          hesitationMs: 100,
          selectionChanges: 0,
          justification: 'Une raison.',
        },
      ],
    });
    const text = renderEmailText(report);
    expect(text).not.toContain('<');
    expect(text).toContain('Une raison.');
  });

  it('représente une proposition déclinée sans numéro de loi', () => {
    const text = renderEmailText(
      makeReport({
        laws: [
          {
            number: null,
            principleId: 'P_TEST',
            currentStatement: '',
            status: 'declined',
            signedAt: null,
            declinedAt: 100,
            revisions: [],
          },
        ],
      }),
    );
    expect(text).toContain('Proposition déclinée [P_TEST]');
  });
});
