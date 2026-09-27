import type { ReportingStatus, SaveGame } from '../persistence/SaveAdapter';

// Decides whether an automatic send should start, from persisted save state only.
export function canAutoSend(params: {
  reportingConsent?: boolean;
  reportingStatus?: ReportingStatus;
}): boolean {
  if (params.reportingConsent !== true) return false;
  return (
    params.reportingStatus === undefined ||
    params.reportingStatus === 'not_sent'
  );
}

// Module-level guard: survives a component remount (e.g. React Strict Mode's
// mount → unmount → remount cycle), which a per-instance ref would not.
const inFlightRuns = new Set<string>();

export function tryClaimSend(runId: string): boolean {
  if (inFlightRuns.has(runId)) return false;
  inFlightRuns.add(runId);
  return true;
}

export function releaseSend(runId: string): void {
  inFlightRuns.delete(runId);
}

export async function submitReport(
  save: SaveGame,
  setStatus: (status: ReportingStatus) => Promise<void>,
): Promise<ReportingStatus> {
  await setStatus('sending');
  try {
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(save),
    });
    const status: ReportingStatus = res.ok ? 'sent' : 'failed';
    await setStatus(status);
    return status;
  } catch {
    await setStatus('failed');
    return 'failed';
  }
}
