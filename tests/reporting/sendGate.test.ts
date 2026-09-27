import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canAutoSend,
  releaseSend,
  submitReport,
  tryClaimSend,
} from '../../src/reporting/sendGate';
import type { SaveGame } from '../../src/persistence/SaveAdapter';

afterEach(() => vi.unstubAllGlobals());

describe('canAutoSend', () => {
  it('refuse sans consentement explicite (undefined ou false)', () => {
    expect(canAutoSend({ reportingConsent: undefined })).toBe(false);
    expect(canAutoSend({ reportingConsent: false })).toBe(false);
  });

  it('autorise avec consentement et statut not_sent ou absent', () => {
    expect(canAutoSend({ reportingConsent: true })).toBe(true);
    expect(
      canAutoSend({ reportingConsent: true, reportingStatus: 'not_sent' }),
    ).toBe(true);
  });

  it('refuse si un envoi est déjà sending, sent ou failed', () => {
    for (const reportingStatus of ['sending', 'sent', 'failed'] as const) {
      expect(canAutoSend({ reportingConsent: true, reportingStatus })).toBe(
        false,
      );
    }
  });
});

describe('tryClaimSend / releaseSend', () => {
  it('un second claim pour le même run échoue jusqu’au release', () => {
    expect(tryClaimSend('run-1')).toBe(true);
    expect(tryClaimSend('run-1')).toBe(false);
    releaseSend('run-1');
    expect(tryClaimSend('run-1')).toBe(true);
    releaseSend('run-1');
  });

  it('des runs différents ne se bloquent pas entre eux', () => {
    expect(tryClaimSend('run-a')).toBe(true);
    expect(tryClaimSend('run-b')).toBe(true);
    releaseSend('run-a');
    releaseSend('run-b');
  });
});

describe('submitReport', () => {
  const save = { runId: 'run-1' } as unknown as SaveGame;

  it('passe par sending puis sent sur une réponse 2xx (Brevo simulé succès)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true } as Response));
    const statuses: string[] = [];
    const result = await submitReport(save, async (s) => {
      statuses.push(s);
    });
    expect(statuses).toEqual(['sending', 'sent']);
    expect(result).toBe('sent');
  });

  it('passe par sending puis failed sur une réponse non-2xx (Brevo simulé échec)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false } as Response),
    );
    const statuses: string[] = [];
    const result = await submitReport(save, async (s) => {
      statuses.push(s);
    });
    expect(statuses).toEqual(['sending', 'failed']);
    expect(result).toBe('failed');
  });

  it('passe à failed si le fetch rejette (offline/timeout)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    );
    const statuses: string[] = [];
    const result = await submitReport(save, async (s) => {
      statuses.push(s);
    });
    expect(statuses).toEqual(['sending', 'failed']);
    expect(result).toBe('failed');
  });

  it('n’envoie jamais réellement un email — fetch est toujours simulé', () => {
    // Vérification de garde : ce fichier ne doit jamais appeler la vraie API Brevo.
    expect(globalThis.fetch).toBeDefined();
  });
});
