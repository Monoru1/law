import { NextRequest, NextResponse } from 'next/server';
import { content } from '../../../src/content';
import { buildReport } from '../../../src/reporting/builder';
import {
  emailSubject,
  renderEmailHtml,
  renderEmailText,
} from '../../../src/reporting/emailRenderer';
import type { SaveGame } from '../../../src/persistence/SaveAdapter';
import { saveSchema } from '../../../src/engine/schema';

const MAX_BODY_BYTES = 512 * 1024; // 512 KB

function err(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function validatePayload(body: unknown): SaveGame | null {
  if (typeof body !== 'object' || body === null) return null;

  // Parse via Zod schema — rejects unknown shapes
  const result = saveSchema.safeParse(body);
  if (!result.success) return null;
  const save = result.data as SaveGame;

  // Strict checks the schema can't express
  if (!save.runId) return null;
  if (save.reportingConsent !== true) return null;
  if (!save.events.some((e) => e.type === 'run_completed')) return null;
  if (!save.events.some((e) => e.type === 'run_started')) return null;

  return save;
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

  // Limit body size
  const contentLength = req.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return err(413, 'Corps trop volumineux.');
  }

  let rawBody: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return err(413, 'Corps trop volumineux.');
    rawBody = JSON.parse(text);
  } catch {
    return err(400, 'JSON invalide.');
  }

  // Validate payload
  const save = validatePayload(rawBody);
  if (!save) {
    return err(400, 'Payload invalide.');
  }

  // Build report server-side
  const report = buildReport(save, content);
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
  } catch {
    // Log server-side only — no secret, no stack trace in response
    return err(502, 'Échec de l\u2019envoi du rapport.');
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET(): Promise<NextResponse> {
  return err(405, 'Méthode non autorisée.');
}
