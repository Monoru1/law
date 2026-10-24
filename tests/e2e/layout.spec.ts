import { test, expect } from '@playwright/test';
import { contentT0 } from '../../src/content/t0';
import { simulateTalkRun } from '../../scripts/simulation-talk';
import { seeded } from '../../scripts/simulation';
import { content, roomEvents, saveOf } from './journeys';
import { seedStorage } from './harness';
const viewports: readonly [width: number, height: number][] = [
  [1440, 900],
  [768, 1024],
  [390, 844],
  [360, 640],
  [320, 568],
  [667, 375],
];
for (const [width, height] of viewports)
  test(`home and first scene fit ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Vous avez été convoqué.' }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    await page.screenshot({
      path: testInfo.outputPath(`law-home-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole('button', { name: 'Commencer — LA PIÈCE', exact: true })
      .click();
    await page
      .getByRole('textbox', { name: 'Ton nom ou pseudonyme' })
      .fill('Testeur');
    await page.getByRole('button', { name: 'Entrer' }).click();
    await page.locator('body').press('Space');
    await expect(
      page.getByRole('button', { name: 'Appuyer', exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    await page.screenshot({
      path: testInfo.outputPath(`law-scene-${width}.png`),
      fullPage: true,
    });
  });
test('reduced motion reveals text without movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Commencer — LA PIÈCE', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Ton nom ou pseudonyme' })
    .fill('Testeur');
  await page.getByRole('button', { name: 'Entrer' }).click();
  await expect(
    page.getByRole('button', { name: 'Appuyer', exact: true }),
  ).toBeVisible();
  const style = await page
    .locator('.beat')
    .first()
    .evaluate((element) => ({
      transform: getComputedStyle(element).transform,
      transition: getComputedStyle(element).transitionDuration,
    }));
  expect(style.transform).toBe('none');
  expect(parseFloat(style.transition)).toBeLessThan(0.001);
});

test('production metadata, manifest and social preview are exposed', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(page).toHaveTitle('THE LAW: REBIRTH');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#090809',
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'THE LAW: REBIRTH',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/opengraph-image/,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );

  const manifestResponse = await request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBe(true);
  expect(manifestResponse.headers()['content-type']).toContain(
    'application/manifest+json',
  );
  expect(await manifestResponse.json()).toMatchObject({
    name: 'THE LAW: REBIRTH',
    short_name: 'THE LAW: REBIRTH',
    display: 'standalone',
    start_url: '/',
    theme_color: '#090809',
  });

  const image = await request.get('/opengraph-image');
  expect(image.ok()).toBe(true);
  expect(image.headers()['content-type']).toContain('image/png');
});

test('connectivity loss is explicit and clears after reconnection', async ({
  context,
  page,
}) => {
  await page.goto('/');
  const status = page.getByRole('status');
  await expect(status).toHaveCount(0);
  await context.setOffline(true);
  await expect(status).toContainText('Connexion interrompue');
  await context.setOffline(false);
  await expect(status).toHaveCount(0);
});

for (const [width, height] of viewports) {
  test(`shell routes fit ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const route of ['/', '/ma-loi', '/adresse-absente']) {
      const response = await page.goto(route);
      if (route === '/adresse-absente') expect(response?.status()).toBe(404);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    }
  });
}

test('the shell stays usable at a 200% zoom equivalent', async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 450 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Vous avez été convoqué.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Commencer — LA PIÈCE', exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(720);
});

test('shell routes emit no runtime or hydration error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  for (const route of ['/', '/ma-loi']) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('the registry reflects recorded visits without mutating the journal', async ({
  page,
}) => {
  const save = saveOf(content, roomEvents());
  await seedStorage(page, { 'thelaw:save': save });
  await page.goto('/');
  const dossier = page
    .locator('article')
    .filter({ hasText: 'I / LA PIÈCE' })
    .first();
  await expect(dossier.getByText('Clos', { exact: true })).toBeVisible();
  await expect(dossier.getByText(/scènes consignées/)).toBeVisible();
  await expect(
    dossier.getByRole('button', { name: 'Revoir la fin — LA PIÈCE' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('thelaw:save')!).events,
    ),
  ).toEqual(save.events);
});

test('exam notes remain factual, local and readable after reload and can be exported', async ({
  page,
}) => {
  const run = simulateTalkRun(contentT0, seeded(41), { at: 1000 });
  const save = saveOf(contentT0, run.events, { reportingConsent: false });
  await seedStorage(page, { 'thelaw:save-t0': save });
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/report')) requests.push(request.url());
  });
  await page.goto('/ma-loi');
  const notes = page.getByRole('region', { name: 'Ce que LAW a noté' });
  await expect(notes.getByRole('listitem')).toHaveCount(run.state.notes.length);
  const recorded = run.state.notes.find((note) => note.text);
  if (recorded?.text)
    await expect(
      notes.getByText(recorded.text, { exact: true }).first(),
    ).toBeVisible();
  await expect(notes.locator('img')).toHaveCount(0);
  await page.reload();
  await expect(notes.getByRole('listitem')).toHaveCount(run.state.notes.length);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter L’Examen' }).click();
  expect((await download).suggestedFilename()).toContain('the-law-t0-');
  expect(requests).toEqual([]);
  await page
    .getByRole('button', { name: 'Effacer ma partie', exact: true })
    .click();
  await page
    .getByRole('button', {
      name: /Confirmer l’effacement|Confirmer l'effacement/,
    })
    .click();
  await expect(page.getByText('Aucune partie enregistrée.')).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('thelaw:save-t0')),
  ).toBeNull();
});

test('a completed legacy consented run never triggers remote reporting', async ({
  page,
  request,
}) => {
  const save = saveOf(content, roomEvents(), {
    reportingConsent: true,
    reportingStatus: 'not_sent',
  });
  await seedStorage(page, { 'thelaw:save': save });
  const reports: string[] = [];
  page.on('request', (entry) => {
    if (entry.url().includes('/api/report')) reports.push(entry.url());
  });
  await page.goto('/jouer');
  await expect(
    page.getByRole('heading', { name: 'THE LAW: REBIRTH' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Lire ma loi' })).toBeVisible();
  expect(reports).toEqual([]);
  const retired = await request.post('/api/report', { data: save });
  expect(retired.status()).toBe(410);
  expect(retired.headers()['cache-control']).toBe('no-store');
});

test('the entrance resumes an existing journal without replacing it', async ({
  page,
}) => {
  const save = saveOf(content, roomEvents().slice(0, 3));
  await seedStorage(page, { 'thelaw:save': save });
  await page.goto('/');
  await page
    .getByRole('link', { name: 'Reprendre la dernière partie' })
    .click();
  await expect(page).toHaveURL('/jouer');
  await expect(
    page.getByRole('button', { name: 'Quitter', exact: true }),
  ).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('thelaw:save')!),
  );
  expect(stored.runId).toBe(save.runId);
  expect(stored.events.slice(0, save.events.length)).toEqual(save.events);
});
