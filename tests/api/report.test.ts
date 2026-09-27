import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/report/route';
import { content } from '../../src/content';

const ENV_KEYS = [
  'BREVO_API_KEY',
  'REPORT_FROM_EMAIL',
  'REPORT_FROM_NAME',
  'REPORT_TO_EMAIL',
] as const;

function stubValidEnv() {
  vi.stubEnv('BREVO_API_KEY', 'test-not-a-real-key');
  vi.stubEnv('REPORT_FROM_EMAIL', 'noreply@example.test');
  vi.stubEnv('REPORT_FROM_NAME', 'THE LAW Playtest');
  vi.stubEnv('REPORT_TO_EMAIL', 'creator@example.test');
}

let serial = 0;
function ev(draft: Record<string, unknown>) {
  return { ...draft, id: `api-test-${++serial}`, at: serial * 100 };
}

const boutonScene = content.scenes.find((s) => s.id === 't1.bouton')!;

function validSavePayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schemaVersion: 2,
    contentVersion: content.version,
    contentIdentity: 'irrelevant-for-this-endpoint',
    runId: 'run-api-test',
    createdAt: 1,
    updatedAt: 2,
    events: [
      ev({ type: 'run_started', contentVersion: content.version }),
      ev({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: boutonScene.version,
        input: 'binary',
        value: 'appuyer',
        hesitationMs: 500,
        selectionChanges: 0,
      }),
      ev({ type: 'run_completed', timelineId: 't1' }),
    ],
    settings: {
      simpleConfirmation: false,
      reducedMotion: 'auto',
      textSize: 'normal',
      sound: false,
    },
    pseudonym: 'Atlas',
    reportingConsent: true,
    ...overrides,
  };
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/report', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('GET /api/report', () => {
  it('refuse la méthode GET', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });
});

describe('POST /api/report — validation', () => {
  it('503 si une variable d’environnement obligatoire est absente', async () => {
    for (const missing of ENV_KEYS) {
      if (missing === 'REPORT_FROM_NAME') continue; // optionnelle
      vi.unstubAllEnvs();
      stubValidEnv();
      vi.stubEnv(missing, '');
      const res = await POST(postRequest(validSavePayload()));
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(JSON.stringify(json)).not.toMatch(/test-not-a-real-key/);
    }
  });

  it('400 sur un JSON invalide', async () => {
    stubValidEnv();
    const res = await POST(postRequest('{ceci n’est pas du JSON'));
    expect(res.status).toBe(400);
  });

  it('400 sur un payload qui ne respecte pas le schéma', async () => {
    stubValidEnv();
    const res = await POST(postRequest({ nope: true }));
    expect(res.status).toBe(400);
  });

  it('400 si reportingConsent n’est pas exactement true', async () => {
    stubValidEnv();
    for (const reportingConsent of [false, undefined]) {
      const res = await POST(
        postRequest(validSavePayload({ reportingConsent })),
      );
      expect(res.status).toBe(400);
    }
  });

  it('400 si le run n’est pas terminé (pas de run_completed)', async () => {
    stubValidEnv();
    const payload = validSavePayload();
    (payload.events as unknown[]) = (
      payload.events as { type: string }[]
    ).filter((e) => e.type !== 'run_completed');
    const res = await POST(postRequest(payload));
    expect(res.status).toBe(400);
  });

  it('413 si le corps dépasse la limite de taille', async () => {
    stubValidEnv();
    const huge = validSavePayload({
      pseudonym: 'A'.repeat(600 * 1024),
    });
    const res = await POST(postRequest(huge));
    expect(res.status).toBe(413);
  });
});

describe('POST /api/report — intégration Brevo (toujours simulée)', () => {
  it('200 quand Brevo répond avec succès (mock, aucun appel réseau réel)', async () => {
    stubValidEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    vi.stubGlobal('fetch', fetchMock);
    const res = await POST(postRequest(validSavePayload()));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect((init as RequestInit).headers).toMatchObject({
      'api-key': 'test-not-a-real-key',
    });
  });

  it('502 quand Brevo répond en échec (mock), sans fuite de secret dans la réponse', async () => {
    stubValidEnv();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Key not found' }),
      } as Response),
    );
    const res = await POST(postRequest(validSavePayload()));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(JSON.stringify(json)).not.toMatch(/test-not-a-real-key/);
  });

  it('502 quand le fetch vers Brevo rejette (offline/timeout simulé)', async () => {
    stubValidEnv();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    const res = await POST(postRequest(validSavePayload()));
    expect(res.status).toBe(502);
  });

  it('ne construit jamais le corps de la requête Brevo sans passer par escapeHtml (pas de <script> brut)', async () => {
    stubValidEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    vi.stubGlobal('fetch', fetchMock);
    await POST(
      postRequest(validSavePayload({ pseudonym: '<script>alert(1)</script>' })),
    );
    const [, init] = fetchMock.mock.calls[0]!;
    const sentBody = JSON.parse((init as RequestInit).body as string) as {
      htmlContent: string;
    };
    // The subject is a plain header (not HTML), so it is intentionally not
    // HTML-escaped; only htmlContent must never carry raw player-supplied markup.
    expect(sentBody.htmlContent).not.toContain('<script>alert(1)</script>');
    expect(sentBody.htmlContent).toContain(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });
});
