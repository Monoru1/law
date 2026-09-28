import { test, expect } from '@playwright/test';
const viewports: readonly [width: number, height: number][] = [
  [1440, 900],
  [768, 1024],
  [390, 844],
  [360, 640],
];
for (const [width, height] of viewports)
  test(`home and first scene fit ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'THE LAW' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    await page.screenshot({
      path: testInfo.outputPath(`law-home-${width}.png`),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Commencer' }).click();
    await page
      .getByRole('textbox', { name: 'Ton nom ou pseudonyme' })
      .fill('Testeur');
    await page.getByRole('button', { name: 'Entrer' }).click();
    await page
      .getByRole('button', { name: 'J\u2019accepte et je commence' })
      .click();
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
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page
    .getByRole('textbox', { name: 'Ton nom ou pseudonyme' })
    .fill('Testeur');
  await page.getByRole('button', { name: 'Entrer' }).click();
  await page
    .getByRole('button', { name: 'J\u2019accepte et je commence' })
    .click();
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
  await expect(page).toHaveTitle('THE LAW');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#0d0d10',
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'THE LAW',
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
    name: 'THE LAW',
    short_name: 'THE LAW',
    display: 'standalone',
    start_url: '/',
    theme_color: '#0d0d10',
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
  await expect(page.getByRole('heading', { name: 'THE LAW' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Commencer' })).toBeVisible();
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
