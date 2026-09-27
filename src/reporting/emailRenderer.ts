// Server-only — ne pas importer depuis le bundle client.
import type { PlaytestReport } from './report';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function formatDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h${String(m % 60).padStart(2, '0')}m`;
  if (m > 0) return `${m}m${String(s % 60).padStart(2, '0')}s`;
  return `${s}s`;
}

export function emailSubject(report: PlaytestReport): string {
  return `THE LAW — Playtest — ${report.pseudonym} — ${formatDate(report.completedAt)}`;
}

export function renderEmailHtml(report: PlaytestReport): string {
  const pseudo = escapeHtml(report.pseudonym);
  const date = formatDate(report.completedAt);

  const decisionsRows = report.decisions
    .map(
      (d) => `
    <tr>
      <td style="padding:4px 8px;border-bottom:1px solid #e0e0e0;font-family:monospace;font-size:12px;">${d.order}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e0e0e0;font-size:13px;">${escapeHtml(d.sceneTitle)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e0e0e0;font-size:13px;">${escapeHtml(d.displayValue)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e0e0e0;font-family:monospace;font-size:12px;">${d.hesitationMs} ms</td>
      <td style="padding:4px 8px;border-bottom:1px solid #e0e0e0;font-family:monospace;font-size:12px;">${d.certainty !== undefined ? d.certainty : '—'}</td>
    </tr>`,
    )
    .join('');

  const justificationsSection =
    report.decisions.filter((d) => d.justification).length === 0
      ? '<p style="color:#666;font-size:13px;">Aucune justification écrite.</p>'
      : report.decisions
          .filter((d) => d.justification)
          .map(
            (d) => `
    <div style="margin-bottom:16px;">
      <p style="margin:0 0 4px;font-family:monospace;font-size:12px;color:#666;">${escapeHtml(d.sceneTitle)} — décision ${d.order}</p>
      <p style="margin:0;font-size:14px;font-style:italic;">&ldquo;${escapeHtml(d.justification!)}&rdquo;</p>
    </div>`,
          )
          .join('');

  const lawsSection =
    report.laws.length === 0
      ? '<p style="color:#666;font-size:13px;">Aucune loi signée.</p>'
      : report.laws
          .map(
            (l) => `
    <div style="margin-bottom:16px;padding:12px;border-left:3px solid #000;">
      <p style="margin:0 0 4px;font-family:monospace;font-size:12px;text-transform:uppercase;">Loi ${String(l.number).padStart(2, '0')} — ${escapeHtml(l.principleId)} — ${l.status}</p>
      <p style="margin:0;font-size:14px;">${escapeHtml(l.currentStatement)}</p>
      ${
        l.revisions.length > 0
          ? `<p style="margin:8px 0 0;font-family:monospace;font-size:11px;color:#666;">${l.revisions.length} révision(s)</p>`
          : ''
      }
    </div>`,
          )
          .join('');

  const confrontationsSection =
    report.confrontations.length === 0
      ? '<p style="color:#666;font-size:13px;">Aucune confrontation.</p>'
      : report.confrontations
          .map(
            (c) => `
    <div style="margin-bottom:8px;font-size:13px;">
      <span style="font-family:monospace;">Loi ${c.lawNumber !== null ? String(c.lawNumber).padStart(2, '0') : '??'}</span>
      &nbsp;→&nbsp;
      <strong>${escapeHtml(c.displayAnswer)}</strong>
    </div>`,
          )
          .join('');

  const summarySection = report.factualSummary
    .map(
      (line) =>
        `<li style="margin-bottom:4px;font-size:13px;">${escapeHtml(line)}</li>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>THE LAW — Playtest — ${pseudo}</title>
</head>
<body style="margin:0;padding:0;background:#fff;color:#000;font-family:Georgia,serif;">
<div style="max-width:680px;margin:0 auto;padding:40px 24px;">

  <div style="border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:32px;">
    <p style="font-family:monospace;font-size:11px;text-transform:uppercase;margin:0 0 4px;">THE LAW — RAPPORT DE PLAYTEST</p>
    <h1 style="font-size:22px;font-weight:normal;margin:0 0 8px;">${pseudo}</h1>
    <p style="font-family:monospace;font-size:12px;color:#666;margin:0;">${date} · ${formatMs(report.durationMs)} · ${report.timelineId.toUpperCase()} · v${escapeHtml(report.contentVersion)}</p>
  </div>

  <h2 style="font-family:monospace;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Décisions</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
    <thead>
      <tr style="border-bottom:2px solid #000;">
        <th style="text-align:left;padding:4px 8px;font-family:monospace;font-size:11px;">#</th>
        <th style="text-align:left;padding:4px 8px;font-family:monospace;font-size:11px;">Scène</th>
        <th style="text-align:left;padding:4px 8px;font-family:monospace;font-size:11px;">Choix</th>
        <th style="text-align:left;padding:4px 8px;font-family:monospace;font-size:11px;">Hésitation</th>
        <th style="text-align:left;padding:4px 8px;font-family:monospace;font-size:11px;">Certitude</th>
      </tr>
    </thead>
    <tbody>${decisionsRows}</tbody>
  </table>

  <h2 style="font-family:monospace;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Justifications</h2>
  <div style="margin-bottom:32px;">${justificationsSection}</div>

  <h2 style="font-family:monospace;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Lois</h2>
  <div style="margin-bottom:32px;">${lawsSection}</div>

  <h2 style="font-family:monospace;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Confrontations</h2>
  <div style="margin-bottom:32px;">${confrontationsSection}</div>

  <h2 style="font-family:monospace;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Synthèse factuelle</h2>
  <ul style="padding-left:20px;margin-bottom:32px;">${summarySection}</ul>

  <div style="border-top:1px solid #ccc;padding-top:16px;font-family:monospace;font-size:11px;color:#666;">
    <p style="margin:0 0 4px;">Run ID : ${escapeHtml(report.runId)}</p>
    <p style="margin:0 0 4px;">Content : v${escapeHtml(report.contentVersion)}</p>
    <p style="margin:0;">Report version : ${escapeHtml(report.reportVersion)}</p>
  </div>

</div>
</body>
</html>`;
}

export function renderEmailText(report: PlaytestReport): string {
  const lines: string[] = [];

  lines.push('THE LAW — RAPPORT DE PLAYTEST');
  lines.push('='.repeat(40));
  lines.push(`Pseudonyme : ${report.pseudonym}`);
  lines.push(`Date : ${formatDate(report.completedAt)}`);
  lines.push(`Durée : ${formatMs(report.durationMs)}`);
  lines.push(`Timeline : ${report.timelineId}`);
  lines.push(`Run : ${report.runId}`);
  lines.push('');

  lines.push('DÉCISIONS');
  lines.push('-'.repeat(20));
  for (const d of report.decisions) {
    lines.push(
      `${d.order}. [${d.sceneId}] ${d.displayValue} (${d.hesitationMs}ms)`,
    );
    if (d.certainty !== undefined) lines.push(`   Certitude : ${d.certainty}`);
    if (d.justification) lines.push(`   "${d.justification}"`);
  }
  lines.push('');

  lines.push('LOIS');
  lines.push('-'.repeat(20));
  if (report.laws.length === 0) {
    lines.push('Aucune loi signée.');
  } else {
    for (const l of report.laws) {
      lines.push(
        `Loi ${String(l.number).padStart(2, '0')} [${l.status}] : ${l.currentStatement}`,
      );
      for (const r of l.revisions) {
        lines.push(`  Révision : ${r.text}`);
      }
    }
  }
  lines.push('');

  lines.push('CONFRONTATIONS');
  lines.push('-'.repeat(20));
  if (report.confrontations.length === 0) {
    lines.push('Aucune confrontation.');
  } else {
    for (const c of report.confrontations) {
      lines.push(
        `Loi ${c.lawNumber !== null ? String(c.lawNumber).padStart(2, '0') : '??'} → ${c.displayAnswer}`,
      );
    }
  }
  lines.push('');

  lines.push('SYNTHÈSE FACTUELLE');
  lines.push('-'.repeat(20));
  for (const s of report.factualSummary) {
    lines.push(`- ${s}`);
  }
  lines.push('');

  lines.push('TECHNIQUE');
  lines.push('-'.repeat(20));
  lines.push(`Content version : ${report.contentVersion}`);
  lines.push(`Report version : ${report.reportVersion}`);

  return lines.join('\n');
}
