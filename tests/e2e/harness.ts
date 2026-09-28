import { createHash } from 'node:crypto';
import {
  expect,
  type ConsoleMessage,
  type Locator,
  type Page,
  type TestInfo,
} from '@playwright/test';
import type { Content, GameEvent } from '../../src/engine';
import {
  CURRENT_SCHEMA_VERSION,
  migrateSave,
} from '../../src/persistence/migrations';
import {
  defaultSettings,
  type SaveGame,
  type Settings,
} from '../../src/persistence/SaveAdapter';

export type TimelineTarget = {
  timelineId: string;
  route: string;
  storageKey: string;
};

export const ROOM_TARGET: TimelineTarget = {
  timelineId: 't1',
  route: '/jouer',
  storageKey: 'thelaw:save',
};

export const HOUSE_TARGET: TimelineTarget = {
  timelineId: 't2',
  route: '/jouer/t2',
  storageKey: 'thelaw:save-t2',
};

export const MOBILE_VIEWPORTS = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
] as const;

export async function seedStorage(
  page: Page,
  saves: Record<string, unknown>,
): Promise<void> {
  await page.addInitScript((values) => {
    for (const [key, value] of Object.entries(values))
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(value));
  }, saves);
}

export async function readStoredSave(
  page: Page,
  target: TimelineTarget,
): Promise<SaveGame> {
  const save = await page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  }, target.storageKey);
  if (!save) throw new Error(`No save for ${target.timelineId}`);
  return save as SaveGame;
}

export async function readJournal(
  page: Page,
  target: TimelineTarget,
): Promise<GameEvent[]> {
  return (await readStoredSave(page, target)).events;
}

export const exactButton = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name, exact: typeof name === 'string' });

async function anyVisible(locator: Locator): Promise<boolean> {
  for (const match of await locator.all())
    if (await match.isVisible()) return true;
  return false;
}

/** Deliberately activates authored navigation; never use this to prove a hold. */
export async function advanceToAction(
  page: Page,
  name: string | RegExp,
): Promise<Locator> {
  const target = exactButton(page, name);
  await expect
    .poll(
      async () => {
        if (await anyVisible(target)) return true;
        const navigation = page
          .getByRole('button', { name: /^(Suivant|Passer)$/, exact: true })
          .first();
        if (await navigation.isVisible()) await navigation.click();
        return false;
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  return target;
}

/** Deliberately activates authored navigation; never use this to prove a hold. */
export async function advanceToText(
  page: Page,
  text: string | RegExp,
): Promise<Locator> {
  const target = page.getByText(text, { exact: false });
  await expect
    .poll(
      async () => {
        if (await anyVisible(target)) return true;
        const navigation = page
          .getByRole('button', { name: /^(Suivant|Passer)$/, exact: true })
          .first();
        if (await navigation.isVisible()) await navigation.click();
        return false;
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  return target;
}

export async function activateWithKeyboard(
  page: Page,
  name: string,
): Promise<void> {
  const target = exactButton(page, name);
  await target.focus();
  await page.keyboard.press('Enter');
}

export async function advanceAndActivateWithKeyboard(
  page: Page,
  name: string,
): Promise<void> {
  await advanceToAction(page, name);
  await activateWithKeyboard(page, name);
}

function journalDigest(events: GameEvent[]): string {
  return createHash('sha256').update(JSON.stringify(events)).digest('hex');
}

function safeEvent(event: GameEvent): Record<string, unknown> {
  const safe: Record<string, unknown> = {
    id: event.id,
    type: event.type,
    at: event.at,
  };
  if ('sceneId' in event) safe.sceneId = event.sceneId;
  if ('timelineId' in event) safe.timelineId = event.timelineId;
  if (event.type === 'choice_locked') safe.input = event.input;
  if ('lawNumber' in event) safe.lawNumber = event.lawNumber;
  return safe;
}

export const redactEventsForDiagnostics = (events: readonly GameEvent[]) =>
  events.map(safeEvent);

export type TimelineSnapshot = {
  timelineId: string;
  pathname: string;
  sceneId: string | null;
  phase: string;
  eventCount: number;
  eventIds: string[];
  journalDigest: string;
  lastDecision: { sceneId: string; input: string } | null;
  lastEvents: Record<string, unknown>[];
};

export async function timelineSnapshot(
  page: Page,
  target: TimelineTarget,
): Promise<TimelineSnapshot> {
  const events = await readJournal(page, target);
  const scene = events.findLast((event) => event.type === 'scene_entered');
  const decision = events.findLast((event) => event.type === 'choice_locked');
  const stage = page.locator('.stage');
  const phase = (await stage.count())
    ? ((await stage.getAttribute('data-phase')) ?? 'unknown')
    : events.some((event) => event.type === 'run_completed')
      ? 'completed'
      : 'no-stage';
  return {
    timelineId: target.timelineId,
    pathname: new URL(page.url()).pathname,
    sceneId: scene?.type === 'scene_entered' ? scene.sceneId : null,
    phase,
    eventCount: events.length,
    eventIds: events.map((event) => event.id),
    journalDigest: journalDigest(events),
    lastDecision:
      decision?.type === 'choice_locked'
        ? { sceneId: decision.sceneId, input: decision.input }
        : null,
    lastEvents: redactEventsForDiagnostics(events.slice(-8)),
  };
}

function stableMismatch(
  before: TimelineSnapshot,
  after: TimelineSnapshot,
): string[] {
  const mismatches: string[] = [];
  if (after.pathname !== before.pathname) mismatches.push('URL changed');
  if (after.sceneId !== before.sceneId) mismatches.push('scene changed');
  if (after.eventCount !== before.eventCount)
    mismatches.push('event count changed');
  if (after.journalDigest !== before.journalDigest)
    mismatches.push('journal changed');
  return mismatches;
}

function assertStable(
  label: string,
  before: TimelineSnapshot,
  after: TimelineSnapshot,
): void {
  const mismatches = stableMismatch(before, after);
  if (mismatches.length)
    throw new Error(
      `${label}: ${mismatches.join(', ')}\n${JSON.stringify(after, null, 2)}`,
    );
}

export async function takeDecision(
  page: Page,
  target: TimelineTarget,
  label: string,
): Promise<void> {
  const before = await readJournal(page, target);
  const choicesBefore = before.filter(
    (event) => event.type === 'choice_locked',
  ).length;
  await exactButton(page, label).click();
  await expect
    .poll(
      async () =>
        (await readJournal(page, target)).filter(
          (event) => event.type === 'choice_locked',
        ).length,
    )
    .toBe(choicesBefore + 1);
}

export async function waitForConsequence(
  page: Page,
  text: string | RegExp,
): Promise<Locator> {
  const consequence = page.getByText(text, { exact: false });
  await expect(consequence).toBeVisible({ timeout: 15_000 });
  return consequence;
}

/** NO AUTO ADVANCE AFTER TRUE DECISION. Uses real elapsed time. */
export async function assertNoAutoAdvanceAfterTrueDecision({
  page,
  target,
  consequence,
  waitMs = 3_500,
}: {
  page: Page;
  target: TimelineTarget;
  consequence: Locator;
  waitMs?: number;
}): Promise<void> {
  await expect(consequence).toBeVisible();
  const before = await timelineSnapshot(page, target);
  await page.waitForTimeout(waitMs);
  await expect(consequence).toBeVisible();
  const after = await timelineSnapshot(page, target);
  assertStable('NO AUTO ADVANCE AFTER TRUE DECISION', before, after);
}

export async function installLongSessionClock(page: Page): Promise<void> {
  await page.clock.install();
}

/** Advances animation timers only; callers must still activate player holds. */
export async function accelerateAnimations(
  page: Page,
  milliseconds = 10_000,
): Promise<void> {
  await page.clock.fastForward(milliseconds);
}

export async function assertReadingHoldSurvives({
  page,
  target,
  consequence,
  minutes = 90,
}: {
  page: Page;
  target: TimelineTarget;
  consequence: Locator;
  minutes?: number;
}): Promise<void> {
  const before = await timelineSnapshot(page, target);
  await page.clock.fastForward(minutes * 60_000);
  await expect(consequence).toBeVisible();
  const after = await timelineSnapshot(page, target);
  assertStable(
    `reading hold resolved during simulated ${minutes}m`,
    before,
    after,
  );
}

function assertSingleSceneTransition(
  before: TimelineSnapshot,
  after: TimelineSnapshot,
): void {
  const beforeIds = new Set(before.eventIds);
  const added = after.lastEvents.filter(
    (event) => !beforeIds.has(String(event.id)),
  );
  const entries = added.filter((event) => event.type === 'scene_entered');
  if (entries.length !== 1 || before.sceneId === after.sceneId)
    throw new Error(
      `Expected one scene transition\n${JSON.stringify(after, null, 2)}`,
    );
  if (new Set(after.eventIds).size !== after.eventIds.length)
    throw new Error(`Duplicate event id\n${JSON.stringify(after, null, 2)}`);
}

export async function activateNextExactlyOnce(
  page: Page,
  target: TimelineTarget,
): Promise<void> {
  const before = await timelineSnapshot(page, target);
  await exactButton(page, 'Suivant').click();
  await expect
    .poll(async () => (await timelineSnapshot(page, target)).sceneId)
    .not.toBe(before.sceneId);
  assertSingleSceneTransition(before, await timelineSnapshot(page, target));
}

export async function assertDoubleClickNextIsSingleTransition(
  page: Page,
  target: TimelineTarget,
): Promise<void> {
  const before = await timelineSnapshot(page, target);
  await exactButton(page, 'Suivant').dblclick();
  await expect
    .poll(async () => (await timelineSnapshot(page, target)).sceneId)
    .not.toBe(before.sceneId);
  await new Promise<void>((resolve) => setTimeout(resolve, 1_000));
  const after = await timelineSnapshot(page, target);
  assertSingleSceneTransition(before, after);
  const selection = await page.evaluate(() => {
    const selected = window.getSelection();
    const isInteractive = (node: Node | null) => {
      const element =
        node instanceof Element ? node : (node?.parentElement ?? null);
      return Boolean(
        element?.closest('button, a, input, textarea, select, [role="button"]'),
      );
    };
    return {
      text: selected?.toString().trim() ?? '',
      interactive:
        isInteractive(selected?.anchorNode ?? null) ||
        isInteractive(selected?.focusNode ?? null),
    };
  });
  expect(selection.text).toBe('');
  expect(selection.interactive).toBe(false);
}

async function reloadStable(
  page: Page,
  target: TimelineTarget,
  visible: Locator,
  label: string,
): Promise<void> {
  const before = await timelineSnapshot(page, target);
  await page.reload();
  await expect(visible).toBeVisible({ timeout: 15_000 });
  const after = await timelineSnapshot(page, target);
  assertStable(label, before, after);
}

export const reloadDuringDecision = (
  page: Page,
  target: TimelineTarget,
  decision: Locator,
) => reloadStable(page, target, decision, 'reload during decision');

export const reloadDuringConsequence = (
  page: Page,
  target: TimelineTarget,
  consequence: Locator,
) => reloadStable(page, target, consequence, 'reload during consequence');

export const reloadWhileWaitingForNext = (page: Page, target: TimelineTarget) =>
  reloadStable(
    page,
    target,
    exactButton(page, 'Suivant'),
    'reload while waiting for Suivant',
  );

export const reloadAfterTransition = (
  page: Page,
  target: TimelineTarget,
  nextDecision: Locator,
) => reloadStable(page, target, nextDecision, 'reload after transition');

export type InvalidJournalKind =
  | 'duplicate_choice'
  | 'duplicate_scene_entry'
  | 'event_after_completion'
  | 'impossible_order';

export function corruptJournal(
  source: GameEvent[],
  kind: InvalidJournalKind,
): GameEvent[] {
  const events = structuredClone(source);
  const choiceIndex = events.findIndex(
    (event) => event.type === 'choice_locked',
  );
  const sceneIndex = events.findIndex(
    (event) => event.type === 'scene_entered',
  );
  const completionIndex = events.findIndex(
    (event) => event.type === 'run_completed',
  );
  if (choiceIndex < 0 || sceneIndex < 0)
    throw new Error('The valid source journal needs a scene and a choice.');
  if (kind === 'duplicate_choice') {
    const duplicate = {
      ...events[choiceIndex]!,
      id: `${events[choiceIndex]!.id}-qa-duplicate`,
      at: events[choiceIndex]!.at + 1,
    } as GameEvent;
    events.splice(choiceIndex + 1, 0, duplicate);
  } else if (kind === 'duplicate_scene_entry') {
    events.splice(sceneIndex + 1, 0, structuredClone(events[sceneIndex]!));
  } else if (kind === 'event_after_completion') {
    if (completionIndex < 0)
      throw new Error('The source journal must be complete.');
    events.push({
      ...events[sceneIndex]!,
      id: `${events[sceneIndex]!.id}-qa-after-completion`,
      at: events[completionIndex]!.at + 1,
    } as GameEvent);
  } else {
    const [choice] = events.splice(choiceIndex, 1);
    const matchingScene = events.findIndex(
      (event) =>
        event.type === 'scene_entered' &&
        choice?.type === 'choice_locked' &&
        event.sceneId === choice.sceneId,
    );
    events.splice(Math.max(1, matchingScene), 0, choice!);
  }
  return events;
}

export function validateJournalWithEngine(
  content: Content,
  events: GameEvent[],
): { valid: true } | { valid: false; error: string } {
  try {
    migrateSave(
      {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        timelineId: content.timelineId,
        contentVersion: content.version,
        runId: 'qa-validation',
        createdAt: 1,
        updatedAt: 2,
        events,
        settings: defaultSettings,
      },
      content,
    );
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.name : 'UnknownError',
    };
  }
}

export type PlaytestProfile =
  | 'CONSISTENT'
  | 'CONTRADICTORY'
  | 'SELF_INTERESTED'
  | 'COLLECTIVE'
  | 'EDGE_CASE'
  | 'HOSTILE_TEXT'
  | 'REDUCED_MOTION'
  | 'RELOAD_HEAVY';

export const PLAYTEST_PROFILES: readonly PlaytestProfile[] = [
  'CONSISTENT',
  'CONTRADICTORY',
  'SELF_INTERESTED',
  'COLLECTIVE',
  'EDGE_CASE',
  'HOSTILE_TEXT',
  'REDUCED_MOTION',
  'RELOAD_HEAVY',
];

export type ProfileCandidate = {
  id: string;
  signals?: {
    continuity?: number;
    selfInterest?: number;
    collective?: number;
    edge?: number;
  };
};

export type ProfileDecision = {
  candidateId: string;
  freeText?: string;
  reducedMotion: boolean;
  reloadAfterDecision: boolean;
};

function ranked(
  candidates: readonly ProfileCandidate[],
  signal: keyof NonNullable<ProfileCandidate['signals']>,
  direction: 1 | -1,
): ProfileCandidate {
  return [...candidates].sort(
    (left, right) =>
      direction *
      ((right.signals?.[signal] ?? 0) - (left.signals?.[signal] ?? 0)),
  )[0]!;
}

export function planProfileDecision(
  profile: PlaytestProfile,
  candidates: readonly ProfileCandidate[],
  decisionIndex: number,
): ProfileDecision {
  if (!candidates.length)
    throw new Error('A profile needs at least one candidate.');
  let candidate = candidates[decisionIndex % candidates.length]!;
  if (profile === 'CONSISTENT') candidate = ranked(candidates, 'continuity', 1);
  if (profile === 'CONTRADICTORY')
    candidate = ranked(candidates, 'continuity', -1);
  if (profile === 'SELF_INTERESTED')
    candidate = ranked(candidates, 'selfInterest', 1);
  if (profile === 'COLLECTIVE') candidate = ranked(candidates, 'collective', 1);
  if (profile === 'EDGE_CASE') candidate = ranked(candidates, 'edge', 1);
  return {
    candidateId: candidate.id,
    ...(profile === 'HOSTILE_TEXT'
      ? {
          freeText: `<img src=x onerror=alert(1)> {{law:1.statement|}} ${'é'.repeat(300)}`,
        }
      : {}),
    reducedMotion: profile === 'REDUCED_MOTION',
    reloadAfterDecision: profile === 'RELOAD_HEAVY',
  };
}

export function profileSettings(profile: PlaytestProfile): Partial<Settings> {
  return profile === 'REDUCED_MOTION' ? { reducedMotion: 'on' } : {};
}

export async function installUnavailableAudioContext(
  page: Page,
): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: undefined,
    });
  });
}

export function capturePageErrors(page: Page) {
  const errors: string[] = [];
  const onPageError = (error: Error) => errors.push(error.name);
  const onConsole = (message: ConsoleMessage) => {
    if (message.type() === 'error') errors.push(message.text());
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  return {
    errors,
    stop() {
      page.off('pageerror', onPageError);
      page.off('console', onConsole);
    },
  };
}

export async function setSoundEnabled(
  page: Page,
  enabled: boolean,
): Promise<void> {
  await exactButton(page, 'Quitter').click();
  await page
    .getByRole('dialog', { name: 'Pause' })
    .getByRole('button', {
      name: 'Paramètres',
    })
    .click();
  const settings = page.getByRole('dialog', { name: 'Paramètres' });
  const sound = settings.getByRole('checkbox', { name: 'Son' });
  if (enabled) await sound.check();
  else await sound.uncheck();
  await settings.getByRole('button', { name: 'Reprendre' }).click();
}

export async function assertMutePersistsAcrossReload(
  page: Page,
  target: TimelineTarget,
): Promise<void> {
  await setSoundEnabled(page, false);
  await expect
    .poll(async () => (await readStoredSave(page, target)).settings.sound)
    .toBe(false);
  await page.reload();
  expect((await readStoredSave(page, target)).settings.sound).toBe(false);
}

export async function assertMotionAndMuteAreIndependent(
  page: Page,
  target: TimelineTarget,
  expected: Pick<Settings, 'reducedMotion' | 'sound'>,
): Promise<void> {
  const settings = (await readStoredSave(page, target)).settings;
  expect(settings.reducedMotion).toBe(expected.reducedMotion);
  expect(settings.sound).toBe(expected.sound);
}

export async function goOffline(page: Page): Promise<void> {
  await page.context().setOffline(true);
  await expect(page.getByRole('status')).toContainText('Connexion interrompue');
}

export async function goOnline(page: Page): Promise<void> {
  await page.context().setOffline(false);
  await expect(page.getByRole('status')).toHaveCount(0);
}

export async function mockReportFailure(
  page: Page,
  status = 503,
): Promise<void> {
  await page.route('**/api/report', (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Reporting unavailable in QA.' }),
      headers: { 'cache-control': 'no-store' },
    }),
  );
}

export async function assertNoHorizontalOverflow(
  page: Page,
  width: number,
): Promise<void> {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width);
}

export async function assertTouchTarget(locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.width).toBeGreaterThanOrEqual(44);
}

export async function captureCheckpoint(
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> {
  const safeName = name.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  await page.screenshot({
    path: testInfo.outputPath(`${safeName}.png`),
    fullPage: true,
  });
}

export async function attachTimelineDiagnostics(
  page: Page,
  testInfo: TestInfo,
  target: TimelineTarget,
): Promise<void> {
  const snapshot = await timelineSnapshot(page, target);
  await testInfo.attach(`timeline-${target.timelineId}`, {
    body: Buffer.from(JSON.stringify(snapshot, null, 2)),
    contentType: 'application/json',
  });
}

export async function withTimelineDiagnostics<T>(
  page: Page,
  testInfo: TestInfo,
  target: TimelineTarget,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    await attachTimelineDiagnostics(page, testInfo, target);
    throw error;
  }
}
