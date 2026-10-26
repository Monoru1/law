import { test, expect } from '@playwright/test';
import { REBIRTH_KEY, rebirthAction } from './harness';

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [667, 375],
  [768, 1024],
  [1440, 900],
] as const)
  test(`the new investigation is readable at ${width}×${height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // The home page now leads with the Tribunal (see app/page.tsx); Les
    // Archives du silence is reached from its own secondary link there, but
    // this test is about the investigation screen itself.
    await page.goto('/jouer/t0');
    await expect(
      page.getByRole('heading', { name: '23 h 46 — Le retour' }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    await expect(page.locator('[data-location="apartment"] img')).toBeVisible();
    const box = await page
      .getByRole('button', { name: 'Ramasser l’enveloppe', exact: true })
      .boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({
      path: testInfo.outputPath(`rebirth-apartment-${width}.png`),
      fullPage: true,
    });
    // /ma-loi is now the Tribunal's own registry (see app/ma-loi/page.tsx);
    // it no longer shows Les Archives du silence's carnet, but it must still
    // render and fit at this width regardless of what's been played.
    await page.goto('/ma-loi');
    await expect(
      page.getByRole('heading', { name: 'Le registre du Tribunal' }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
  });

test('legacy data remains byte-exact and the Tribunal exports and erases only its own journal', async ({
  page,
}) => {
  // Two older editions' saves, seeded exactly as a real browser would hold
  // them: neither this test, nor the Tribunal's export/erase actions below,
  // may read, convert or touch either one.
  const legacyRoom =
    '{"ancienneEdition":"ne pas convertir","texte":"Mes anciennes réponses"}';
  const legacyArchives = '{"gabriel":"ne pas convertir"}';
  await page.addInitScript(
    ({ room, archives }) => {
      if (!localStorage.getItem('thelaw:save-t0'))
        localStorage.setItem('thelaw:save-t0', room);
      if (!localStorage.getItem('thelaw:rebirth:save-t0'))
        localStorage.setItem('thelaw:rebirth:save-t0', archives);
    },
    { room: legacyRoom, archives: legacyArchives },
  );
  await page.goto('/jouer/tribunal');
  const activate = async (name: string) => {
    const button = page.getByRole('button', { name, exact: true });
    await button.focus();
    await page.keyboard.press('Enter');
  };
  await activate('Rester immobile');
  await page.goto('/ma-loi');
  const file = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter mon audience' }).click();
  expect((await file).suggestedFilename()).toBe('the-law-tribunal.json');
  await page.getByRole('button', { name: 'Effacer cette audience' }).click();
  await page.getByRole('button', { name: 'Confirmer l’effacement' }).click();
  expect(
    await page.evaluate(() => localStorage.getItem('thelaw:tribunal:save-t0')),
  ).toBeNull();
  expect(
    await page.evaluate(() => localStorage.getItem('thelaw:save-t0')),
  ).toBe(legacyRoom);
  expect(
    await page.evaluate(() => localStorage.getItem('thelaw:rebirth:save-t0')),
  ).toBe(legacyArchives);
  await expect(
    page.getByText('Aucune audience enregistrée sur cet appareil.'),
  ).toBeVisible();
});

test('sound is opt-in, volume persists, mute works and reload never creates an unsolicited context', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const counters = { contexts: 0, starts: 0 };
    (window as unknown as { rbAudio: typeof counters }).rbAudio = counters;
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor() {
        super();
        counters.contexts++;
      }
      createBufferSource() {
        const source = super.createBufferSource();
        const start = source.start.bind(source);
        source.start = ((...args: Parameters<typeof source.start>) => {
          counters.starts++;
          start(...args);
        }) as typeof source.start;
        return source;
      }
    };
  });
  await page.goto('/jouer/t0');
  await expect(
    page.getByRole('heading', { name: '23 h 46 — Le retour' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { rbAudio: { contexts: number } }).rbAudio
          .contexts,
    ),
  ).toBe(0);
  await rebirthAction(page, 'Activer le son');
  await expect(
    page.getByRole('button', { name: 'Couper le son' }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { rbAudio: { starts: number } }).rbAudio.starts,
      ),
    )
    .toBeGreaterThanOrEqual(2);
  await rebirthAction(page, 'Pause');
  await rebirthAction(page, 'Réglages');
  await page.getByRole('slider', { name: 'Volume' }).fill('0.25');
  await rebirthAction(page, 'Reprendre');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Activer le son' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { rbAudio: { contexts: number } }).rbAudio
          .contexts,
    ),
  ).toBe(0);
  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    REBIRTH_KEY,
  );
  expect(save.settings.volume).toBe(0.25);
  await rebirthAction(page, 'Activer le son');
  await rebirthAction(page, 'Couper le son');
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).settings.sound,
      REBIRTH_KEY,
    ),
  ).toBe(false);
});

test('an unavailable audio device never prevents investigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      value: class {
        constructor() {
          throw new Error('Unavailable in test');
        }
      },
    });
  });
  await page.goto('/jouer/t0');
  await rebirthAction(page, 'Activer le son');
  await expect(page.getByRole('status')).toContainText(
    'Le son est indisponible',
  );
  await rebirthAction(page, 'Ramasser l’enveloppe');
  await expect(
    page.getByText('Pas de timbre.', { exact: false }),
  ).toBeVisible();
});

test('former public story routes redirect to Rebirth', async ({ page }) => {
  for (const route of ['/jouer', '/jouer/t2', '/jouer/t3']) {
    await page.goto(route);
    await expect(page).toHaveURL('/jouer/t0');
    await expect(
      page.getByRole('heading', { name: '23 h 46 — Le retour' }),
    ).toBeVisible();
  }
});
