import { NextRequest, NextResponse } from 'next/server';
import { content } from '../../../src/content';
import { contentT2 } from '../../../src/content/t2';
import type { Content } from '../../../src/engine';
import { migrateSave } from '../../../src/persistence/migrations';
import { buildReport } from '../../../src/reporting/builder';
import { createSendLimiter } from '../../../src/reporting/sendLimiter';
import {
  emailSubject,
  renderEmailHtml,
  renderEmailText,
} from '../../../src/reporting/emailRenderer';
import type { SaveGame } from '../../../src/persistence/SaveAdapter';

const MAX_BODY_BYTES = 512 * 1024; // 512 KB
const JSON_CONTENT_TYPE = /^application\/(?:[a-z0-9.+-]+\+)?json(?:\s*;|$)/i;
const SAVE_FIELDS = new Set([
  'schemaVersion',
  'timelineId',
  'contentVersion',
  'runId',
  'createdAt',
  'updatedAt',
  'events',
  'settings',
  'pseudonym',
  'reportingConsent',
  'reportingStatus',
]);

function err(status: number, message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}

const timelines: Record<string, Content> = { t1: content, t2: contentT2 };
const limiter = createSendLimiter();

function validatePayload(
  body: unknown,
): { save: SaveGame; content: Content } | null {
  if (typeof body !== 'object' || body === null) return null;
  if (Object.keys(body).some((key) => !SAVE_FIELDS.has(key))) return null;
  const timeline =
    timelines[String((body as { timelineId?: unknown }).timelineId ?? 't1')];
  if (!timeline) return null;
  // The same boundary as a local load: schema, contracts and every event
  // replayed against the content of its own timeline.
  let save: SaveGame;
  try {
    save = migrateSave(body, timeline);
  } catch {
    return null;
  }

  // Strict checks the schema can't express
  if (!save.runId) return null;
  if (save.reportingConsent !== true) return null;
  if (!save.events.some((e) => e.type === 'run_completed')) return null;
  if (!save.events.some((e) => e.type === 'run_started')) return null;

  return { save, content: timeline };
}

async function sendViaBrevo(
  apiKey: string,
  from: { name: string; email: string },
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string,
): Promise<void> {
  const body = JSON.stringify({
    sender: { name: from.name, email: from.email },
    to: [{ email: to }],
    subject,
    htmlContent,
    textContent,
  });

  const signal = AbortSignal.timeout(10_000);
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body,
    signal,
  });

  if (!response.ok) {
    let brevoMsg = 'Erreur Brevo non spécifiée.';
    try {
      const json = (await response.json()) as { message?: string };
      if (typeof json.message === 'string') brevoMsg = json.message;
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(`Brevo ${response.status}: ${brevoMsg}`);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Check env vars early — fail fast, no secret in response
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.REPORT_FROM_EMAIL;
  const fromName = process.env.REPORT_FROM_NAME ?? 'THE LAW Playtest';
  const toEmail = process.env.REPORT_TO_EMAIL;

  if (!apiKey || !fromEmail || !toEmail) {
    return err(503, 'Service de rapport non configuré.');
  }

  // Requiring JSON prevents a third-party page from issuing a CORS "simple"
  // form POST with the player's browser. This endpoint never accepts forms.
  if (!JSON_CONTENT_TYPE.test(req.headers.get('content-type') ?? ''))
    return err(415, 'Type de contenu non pris en charge.');

  // Limit body size
  const contentLength = req.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return err(413, 'Corps trop volumineux.');
  }

  let rawBody: unknown;
  try {
    const text = await req.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES)
      return err(413, 'Corps trop volumineux.');
    rawBody = JSON.parse(text);
  } catch {
    return err(400, 'JSON invalide.');
  }

  // Validate payload
  const valid = validatePayload(rawBody);
  if (!valid) {
    return err(400, 'Payload invalide.');
  }
  const { save } = valid;

  const key = `${save.timelineId}:${save.runId}`;
  const decision = limiter.check(key);
  if (decision === 'duplicate')
    return NextResponse.json(
      { ok: true, duplicate: true },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  if (decision === 'limited')
    return err(429, 'Trop de rapports envoyés. Réessaie plus tard.');

  // Build report server-side
  const report = buildReport(save, valid.content);
  if (!report) {
    return err(400, 'Rapport non constructible.');
  }

  // Render email server-side
  const subject = emailSubject(report);
  const htmlContent = renderEmailHtml(report);
  const textContent = renderEmailText(report);

  try {
    await sendViaBrevo(
      apiKey,
      { name: fromName, email: fromEmail },
      toEmail,
      subject,
      htmlContent,
      textContent,
    );
  } catch (error) {
    // Log server-side only — the thrown message never contains the API key.
    console.error(
      '[api/report] Brevo send failed:',
      error instanceof Error ? error.message : 'erreur inconnue',
    );
    return err(502, 'Échec de l\u2019envoi du rapport.');
  }

  limiter.delivered(key);
  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { 'cache-control': 'no-store' } },
  );
}

export async function GET(): Promise<NextResponse> {
  return err(405, 'Méthode non autorisée.');
}
