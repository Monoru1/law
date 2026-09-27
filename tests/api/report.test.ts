import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/report/route';
import { content } from '../../src/content';
import { contentT2 } from '../../src/content/t2';

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

const version = (sceneId: string) =>
  content.scenes.find((s) => s.id === sceneId)!.version;

let runs = 0;
function validSavePayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schemaVersion: 4,
    timelineId: 't1',
    contentVersion: content.version,
    runId: `run-api-test-${++runs}`,
    createdAt: 1,
    updatedAt: 2,
    events: [
      ev({ type: 'run_started', contentVersion: content.version }),
      ev({
        type: 'scene_entered',
        sceneId: 't1.bouton',
        sceneVersion: version('t1.bouton'),
      }),
      ev({
        type: 'choice_locked',
        sceneId: 't1.bouton',
        sceneVersion: version('t1.bouton'),
        input: 'binary',
        value: 'appuyer',
        hesitationMs: 500,
        selectionChanges: 0,
      }),
      ev({
        type: 'scene_entered',
        sceneId: 't1.coda',
        sceneVersion: version('t1.coda'),
      }),
      ev({
        type: 'choice_locked',
        sceneId: 't1.coda',
        sceneVersion: version('t1.coda'),
        input: 'choice',
        value: 'sortir',
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

function postWithContentType(body: unknown, contentType: string): NextRequest {
  return new NextRequest('http://localhost/api/report', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: JSON.stringify(body),
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
  it('refuse les POST de formulaire cross-site et interdit la mise en cache', async () => {
    stubValidEnv();
    const res = await POST(
      postWithContentType(validSavePayload(), 'text/plain;charset=UTF-8'),
    );
    expect(res.status).toBe(415);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

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

  it('mesure la limite en octets UTF-8 et non en caractères JavaScript', async () => {
    stubValidEnv();
    const huge = validSavePayload({ pseudonym: 'é'.repeat(300 * 1024) });
    const res = await POST(postRequest(huge));
    expect(res.status).toBe(413);
  });

  it('refuse les champs racine inconnus au lieu de les ignorer', async () => {
    stubValidEnv();
    const res = await POST(
      postRequest(validSavePayload({ recipient: 'attacker@example.test' })),
    );
    expect(res.status).toBe(400);
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

describe('POST /api/report — frontière de confiance', () => {
  const okFetch = () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  it('400 pour une histoire impossible, même bien formée', async () => {
    stubValidEnv();
    const fetchMock = okFetch();
    const payload = validSavePayload();
    // A decision for a scene the player never entered.
    (payload.events as Record<string, unknown>[]).splice(1, 1);
    const res = await POST(postRequest(payload));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('construit un rapport de La Maison avec le contenu de La Maison', async () => {
    stubValidEnv();
    const fetchMock = okFetch();
    const scene = (id: string) =>
      contentT2.scenes.find((s) => s.id === id)!.version;
    const payload = {
      ...validSavePayload(),
      timelineId: 't2',
      contentVersion: contentT2.version,
      events: [
        ev({ type: 'run_started', contentVersion: contentT2.version }),
        ev({
          type: 'memory_inherited',
          fromTimelineId: 't1',
          fromRunId: 'room-run',
          memory: {
            completedAt: 1,
            decisions: 1,
            choices: { 't1.dix-mille': 'accepter' },
            justifications: {},
            flags: ['took_money'],
            vars: {},
            evidence: {},
            laws: [],
            declinedLaws: [],
          },
        }),
        ev({
          type: 'scene_entered',
          sceneId: 't2.la-faveur',
          sceneVersion: scene('t2.la-faveur'),
        }),
        ev({
          type: 'choice_locked',
          sceneId: 't2.la-faveur',
          sceneVersion: scene('t2.la-faveur'),
          input: 'binary',
          value: 'preter',
          hesitationMs: 800,
          selectionChanges: 0,
        }),
        ev({
          type: 'scene_entered',
          sceneId: 't2.la-maison',
          sceneVersion: scene('t2.la-maison'),
        }),
        ev({
          type: 'choice_locked',
          sceneId: 't2.la-maison',
          sceneVersion: scene('t2.la-maison'),
          input: 'choice',
          value: 'sortir',
          hesitationMs: 800,
          selectionChanges: 0,
        }),
        ev({ type: 'run_completed', timelineId: 't2' }),
      ],
    };
    const res = await POST(postRequest(payload));
    expect(res.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0]!;
    const sent = JSON.parse((init as RequestInit).body as string) as {
      textContent: string;
    };
    expect(sent.textContent).toContain('Lui prêter l’argent');
    expect(sent.textContent).toContain('Sem');
    expect(sent.textContent).toContain('Suite de : room-run');
  });

  it('n’envoie pas deux fois le même rapport livré, et retire les caractères de contrôle du sujet', async () => {
    stubValidEnv();
    const fetchMock = okFetch();
    const payload = validSavePayload({ pseudonym: 'Atlas\r\nBcc: x' });
    expect((await POST(postRequest(payload))).status).toBe(200);
    const again = await POST(postRequest(payload));
    expect(again.status).toBe(200);
    expect(await again.json()).toMatchObject({ duplicate: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    const sent = JSON.parse((init as RequestInit).body as string) as {
      subject: string;
    };
    expect(sent.subject).not.toMatch(/[\r\n]/);
  });
});
