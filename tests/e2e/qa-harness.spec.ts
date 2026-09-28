import { test, expect } from '@playwright/test';
import { defaultSettings } from '../../src/persistence/SaveAdapter';
import {
  assertDoubleClickNextIsSingleTransition,
  accelerateAnimations,
  assertMotionAndMuteAreIndependent,
  assertMutePersistsAcrossReload,
  assertNoAutoAdvanceAfterTrueDecision,
  assertNoHorizontalOverflow,
  assertReadingHoldSurvives,
  assertTouchTarget,
  captureCheckpoint,
  capturePageErrors,
  exactButton,
  goOffline,
  goOnline,
  installLongSessionClock,
  installUnavailableAudioContext,
  MOBILE_VIEWPORTS,
  mockReportFailure,
  readJournal,
  reloadAfterTransition,
  reloadDuringConsequence,
  reloadDuringDecision,
  reloadWhileWaitingForNext,
  ROOM_TARGET,
  seedStorage,
  takeDecision,
  timelineSnapshot,
  waitForConsequence,
  withTimelineDiagnostics,
} from './harness';
import { content, enter, saveOf } from './journeys';

function roomAtDecision(
  settings: typeof defaultSettings = {
    ...defaultSettings,
    reducedMotion: 'on',
  },
) {
  return saveOf(
    content,
    [
      {
        type: 'run_started',
        id: 'qa-run-started',
        at: 1,
        contentVersion: content.version,
      },
      enter('t1.dix-mille'),
    ],
    { settings, reportingConsent: false },
  );
}

test('the generic harness tortures a true decision hold and one transition', async ({
  page,
}, testInfo) => {
  await withTimelineDiagnostics(page, testInfo, ROOM_TARGET, async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedStorage(page, {
      [ROOM_TARGET.storageKey]: roomAtDecision(),
    });
    await page.goto(ROOM_TARGET.route);

    const refuse = exactButton(page, 'Refuser');
    await expect(refuse).toBeVisible();
    await reloadDuringDecision(page, ROOM_TARGET, refuse);
    await takeDecision(page, ROOM_TARGET, 'Refuser');
    const consequence = await waitForConsequence(page, 'Tu as refusé.');

    await assertNoAutoAdvanceAfterTrueDecision({
      page,
      target: ROOM_TARGET,
      consequence,
    });
    await reloadDuringConsequence(page, ROOM_TARGET, consequence);
    await reloadWhileWaitingForNext(page, ROOM_TARGET);

    await installLongSessionClock(page);
    await accelerateAnimations(page);
    await assertReadingHoldSurvives({
      page,
      target: ROOM_TARGET,
      consequence,
      minutes: 90,
    });
    await captureCheckpoint(page, testInfo, 't1-consequence-after-90m');

    await assertDoubleClickNextIsSingleTransition(page, ROOM_TARGET);
    const nextDecision = exactButton(page, 'Appuyer');
    await expect(nextDecision).toBeVisible({ timeout: 15_000 });
    await reloadAfterTransition(page, ROOM_TARGET, nextDecision);
  });
});

test('audio capability failure, mute and reduced motion stay independent', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installUnavailableAudioContext(page);
  await seedStorage(page, {
    [ROOM_TARGET.storageKey]: roomAtDecision({
      ...defaultSettings,
      reducedMotion: 'on',
      sound: true,
    }),
  });
  const captured = capturePageErrors(page);
  await page.goto(ROOM_TARGET.route);
  await assertMotionAndMuteAreIndependent(page, ROOM_TARGET, {
    reducedMotion: 'on',
    sound: true,
  });
  await assertMutePersistsAcrossReload(page, ROOM_TARGET);
  await assertMotionAndMuteAreIndependent(page, ROOM_TARGET, {
    reducedMotion: 'on',
    sound: false,
  });
  await takeDecision(page, ROOM_TARGET, 'Refuser');
  await waitForConsequence(page, 'Tu as refusé.');
  captured.stop();
  expect(captured.errors).toEqual([]);
});

test('offline play and report failure leave the local journal usable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedStorage(page, {
    [ROOM_TARGET.storageKey]: roomAtDecision(),
  });
  await page.goto(ROOM_TARGET.route);
  const before = await readJournal(page, ROOM_TARGET);
  await goOffline(page);
  await takeDecision(page, ROOM_TARGET, 'Refuser');
  await waitForConsequence(page, 'Tu as refusé.');
  expect((await readJournal(page, ROOM_TARGET)).length).toBeGreaterThan(
    before.length,
  );
  await goOnline(page);

  await mockReportFailure(page);
  const beforeReport = await timelineSnapshot(page, ROOM_TARGET);
  const reportStatus = await page.evaluate(async () =>
    fetch('/api/report', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }).then((response) => response.status),
  );
  expect(reportStatus).toBe(503);
  const afterReport = await timelineSnapshot(page, ROOM_TARGET);
  expect(afterReport.eventCount).toBe(beforeReport.eventCount);
  expect(afterReport.journalDigest).toBe(beforeReport.journalDigest);
});

for (const viewport of MOBILE_VIEWPORTS) {
  test(`generic mobile guard ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedStorage(page, {
      [ROOM_TARGET.storageKey]: roomAtDecision(),
    });
    await page.goto(ROOM_TARGET.route);
    const decision = exactButton(page, 'Refuser');
    await expect(decision).toBeVisible();
    await assertNoHorizontalOverflow(page, viewport.width);
    await assertTouchTarget(decision);
    await captureCheckpoint(
      page,
      testInfo,
      `mobile-${viewport.width}x${viewport.height}`,
    );
  });
}
