import { expect, test } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  captureCheckpoint,
  exactButton,
  HOUSE_TARGET,
  MOBILE_VIEWPORTS,
  ROOM_TARGET,
  seedStorage,
} from './harness';
import {
  cityEvents,
  content,
  contentT2,
  contentT3,
  enter,
  houseEvents,
  saveOf,
} from './journeys';

function roomScene(sceneId = 't1.dix-mille') {
  return saveOf(
    content,
    [
      {
        type: 'run_started',
        id: 'world-t1-start',
        at: 1,
        contentVersion: content.version,
      },
      enter(sceneId),
    ],
    { reportingConsent: false },
  );
}

function houseScene(sceneId = 't2.le-mensonge') {
  return saveOf(contentT2, houseEvents([enter(sceneId, contentT2)]), {
    reportingConsent: false,
  });
}

function cityScene(sceneId = 't3.la-fenetre') {
  return saveOf(contentT3, cityEvents([enter(sceneId, contentT3)]), {
    reportingConsent: false,
  });
}

async function expectReadingFrameStable(page: import('@playwright/test').Page) {
  const frame = page.locator('.player-main');
  // Choice reveal may intentionally scroll the reading frame into view. Measure
  // only after that authored movement has settled, then reject later shifts.
  await page.waitForTimeout(800);
  const before = await frame.boundingBox();
  await new Promise<void>((resolve) => setTimeout(resolve, 1_200));
  const after = await frame.boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(Math.abs(after!.x - before!.x)).toBeLessThanOrEqual(4);
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(4);
  expect(Math.abs(after!.width - before!.width)).toBeLessThanOrEqual(4);
  expect(Math.abs(after!.height - before!.height)).toBeLessThanOrEqual(4);
}

test('La Pièce remains readable inside a real architectural frame', async ({
  page,
}, testInfo) => {
  await seedStorage(page, { [ROOM_TARGET.storageKey]: roomScene() });
  await page.goto(ROOM_TARGET.route);
  await expect(exactButton(page, 'Refuser')).toBeVisible();
  const room = page.locator('[data-world="room"]');
  await expect(room).toBeVisible();
  await expect(room).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('[data-primitive="door"]')).toHaveCount(1);
  await expect(page.locator('[data-primitive="corridor"]')).toHaveCount(1);
  await expectReadingFrameStable(page);
  const narrative = page.locator('.beat').first();
  await expect(narrative).toBeVisible();
  expect(
    await narrative.evaluate((node) => getComputedStyle(node).userSelect),
  ).not.toBe('none');
  await captureCheckpoint(page, testInfo, 'world-t1-room');
});

test('La Maison exposes an inhabited night without covering its choices', async ({
  page,
}, testInfo) => {
  await seedStorage(page, { [HOUSE_TARGET.storageKey]: houseScene() });
  await page.goto(HOUSE_TARGET.route);
  await expect(exactButton(page, 'Lui dire ce que Sem cache')).toBeVisible();
  const house = page.locator('[data-world="house"]');
  await expect(house).toBeVisible();
  await expect(house).toHaveAttribute('data-location', 'kitchen');
  await expect(house).toHaveAttribute('data-light', 'night');
  await expect(page.locator('[data-primitive="window"]')).toHaveCount(1);
  await expectReadingFrameStable(page);
  await captureCheckpoint(page, testInfo, 'world-t2-house-night');
});

test('World separates the cold room, garden and balcony', async ({
  browser,
}, testInfo) => {
  for (const checkpoint of [
    {
      route: ROOM_TARGET.route,
      key: ROOM_TARGET.storageKey,
      save: roomScene('t1.chambre-froide'),
      location: 'clinical',
    },
    {
      route: HOUSE_TARGET.route,
      key: HOUSE_TARGET.storageKey,
      save: houseScene('t2.la-faveur'),
      location: 'garden',
    },
    {
      route: HOUSE_TARGET.route,
      key: HOUSE_TARGET.storageKey,
      save: houseScene('t2.omar-histoire'),
      location: 'balcony',
    },
  ] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await seedStorage(page, { [checkpoint.key]: checkpoint.save });
    await page.goto(checkpoint.route);
    const world = page.locator(`[data-location="${checkpoint.location}"]`);
    await expect(world).toBeVisible();
    if (checkpoint.location === 'garden' || checkpoint.location === 'balcony')
      await expect(page.locator('[data-primitive="exterior"]')).toBeVisible();
    await page.waitForTimeout(1_200);
    await captureCheckpoint(page, testInfo, `world-${checkpoint.location}`);
    await context.close();
  }
});

test('La Ville turns its declared act into architecture without 417 DOM nodes', async ({
  page,
}, testInfo) => {
  await seedStorage(page, { 'thelaw:save-t3': cityScene() });
  await page.goto('/jouer/t3');
  await expect(
    page.getByText('La ville a beaucoup de fenêtres.'),
  ).toBeVisible();
  await expect(exactButton(page, 'Sortir du bureau')).toBeVisible({
    timeout: 15_000,
  });
  const city = page.locator('[data-world="city"]');
  await expect(city).toHaveAttribute('data-act', '2');
  await expect(city).toHaveAttribute('data-focus', 'windows');
  await expect(page.locator('[data-primitive="door"]')).toHaveCount(1);
  const windows = page.locator('[data-primitive="city-windows"]');
  await expect(windows).toHaveAttribute('data-window-count', '417');
  expect(await windows.locator('rect').count()).toBeLessThan(20);
  await expectReadingFrameStable(page);
  await captureCheckpoint(page, testInfo, 'world-t3-city-windows');
});

test('La Ville gives its late scenes distinct physical states', async ({
  browser,
}, testInfo) => {
  const checkpoints = [
    ['t3.le-cafe', 'break-room'],
    ['t3.la-routine', 'archive'],
    ['t3.le-rapport', 'report-desk'],
    ['t3.nadia', 'waiting-room'],
    ['t3.nadia-dossier', 'case-desk'],
    ['t3.exception', 'exception-desk'],
    ['t3.farid-le-sait', 'private-office'],
    ['t3.la-pression', 'pressure-office'],
    ['t3.fausse-accalmie', 'quiet-office'],
    ['t3.la-greve', 'strike-hall'],
    ['t3.la-liste', 'register'],
    ['t3.apres-la-liste', 'quiet-office'],
    ['t3.quatre-cent-dix-sept', 'city'],
    ['t3.le-registre', 'register'],
    ['t3.sortie', 'exit'],
  ] as const;

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  for (const [sceneId, location] of checkpoints) {
    const save = cityScene(sceneId);
    if (page.url() === 'about:blank') {
      await seedStorage(page, { 'thelaw:save-t3': save });
      await page.goto('/jouer/t3');
    } else {
      await page.evaluate(
        ([key, value]) => localStorage.setItem(key, JSON.stringify(value)),
        ['thelaw:save-t3', save] as const,
      );
      await page.reload();
    }
    const world = page.locator(`[data-location="${location}"]`);
    await expect(world).toBeVisible();
    await expect(
      page.locator('[data-primitive="administration"]'),
    ).toBeVisible();
    if (sceneId === 't3.quatre-cent-dix-sept')
      await expect(world).toHaveAttribute('data-focus', '417');
    if (sceneId === 't3.sortie') {
      await expect(world).toHaveAttribute('data-focus', 'exit');
      await expect(page.locator('[data-primitive="door"]')).toHaveAttribute(
        'data-open',
        'true',
      );
    }
    await captureCheckpoint(page, testInfo, `world-${sceneId.slice(3)}`);
  }
  await context.close();
});

for (const viewport of MOBILE_VIEWPORTS) {
  test(`world composition fits ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedStorage(page, { [HOUSE_TARGET.storageKey]: houseScene() });
    await page.goto(HOUSE_TARGET.route);
    const choice = exactButton(page, 'Lui dire ce que Sem cache');
    await expect(choice).toBeVisible();
    await assertNoHorizontalOverflow(page, viewport.width);
    const panel = page.locator('[data-primitive="scene-panels"] span').first();
    await expect
      .poll(async () =>
        Number.parseFloat(
          await panel.evaluate(
            (node) => getComputedStyle(node).animationDuration,
          ),
        ),
      )
      .toBeLessThanOrEqual(0.001);
    await captureCheckpoint(
      page,
      testInfo,
      `world-t2-${viewport.width}x${viewport.height}-reduced`,
    );
  });

  test(`city architecture fits ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    const lateScene =
      viewport.width === 360 ? 't3.quatre-cent-dix-sept' : 't3.sortie';
    const focus = viewport.width === 360 ? '417' : 'exit';
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedStorage(page, { 'thelaw:save-t3': cityScene(lateScene) });
    await page.goto('/jouer/t3');
    await expect(page.locator('.beat').first()).toBeVisible({
      timeout: 15_000,
    });
    await assertNoHorizontalOverflow(page, viewport.width);
    await expect(page.locator('[data-world="city"]')).toHaveAttribute(
      'data-focus',
      focus,
    );
    await captureCheckpoint(
      page,
      testInfo,
      `world-t3-${viewport.width}x${viewport.height}-reduced`,
    );
  });
}
