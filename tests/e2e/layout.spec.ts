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
