import { test, expect, type Page } from '@playwright/test';
import { replay } from '../../src/engine';
import { familyContinuationContent } from '../../src/content/sixieme-place-suite';
const KEY = 'thelaw:tribunal:family-continuation-t0';
const choose = async (page: Page, id: string) => {
  const button = page
    .getByRole('list', { name: 'Actions disponibles' })
    .locator(`[data-reply="${id}"]`);
  await button.focus();
  await page.keyboard.press('Enter');
};
const advance = async (page: Page) => {
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
};
async function enterNight(page: Page, table = 'private') {
  await page.goto('/jouer/sixieme-place?ntl-drawer-state=hidden');
  await choose(page, 'entrer');
  await choose(page, 'laisser');
  await choose(page, 'aider');
  await advance(page);
  await choose(page, 'assiette');
  await choose(page, table);
  await advance(page);
  await choose(page, 'arreter');
  await page
    .getByRole('button', { name: 'Consigner ce chapitre', exact: true })
    .click();
  await page
    .getByRole('link', { name: 'Poursuivre la nuit', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Ce qu’Éliane avait gardé' }),
  ).toBeVisible();
}
async function skipEvidence(page: Page) {
  await choose(page, 'suivre');
  await advance(page);
  await choose(page, 'laisser');
  await advance(page);
  await choose(page, 'attendre');
  await advance(page);
  await choose(page, 'attendre');
  await advance(page);
}
async function collectEvidence(page: Page) {
  await choose(page, 'cassette');
  await choose(page, 'retour');
  await choose(page, 'lettre');
  await choose(page, 'retour');
  await choose(page, 'suivre');
  await advance(page);
  await choose(page, 'demander');
  await advance(page);
  await choose(page, 'ecouter');
  await advance(page);
  await choose(page, 'appeler');
  await choose(page, 'consentement');
  await advance(page);
}

test('B: leaving the questions open produces a nonviolent, distinct deposition and immutable source', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await enterNight(page);
  const original = await page.evaluate(() =>
    localStorage.getItem('thelaw:tribunal:family-save-t0'),
  );
  await skipEvidence(page);
  await choose(page, 'demain');
  await advance(page);
  await advance(page);
  await advance(page);
  await choose(page, 'consigner');
  await advance(page);
  await advance(page);
  await expect(
    page.getByRole('heading', { name: 'Première déposition' }),
  ).toBeVisible();
  await expect(
    page.getByText('Vous avez interrompu ou évité la confrontation.', {
      exact: false,
    }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath('tribunal-avoided.png') });
  await choose(page, 'assumer');
  await page
    .getByRole('button', { name: 'Consigner ce chapitre', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'La déposition est consignée.' }),
  ).toBeVisible();
  const state = replay(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).events,
      KEY,
    ),
    familyContinuationContent,
  );
  expect(state.flags).toContain('family.avoided');
  expect(state.flags).not.toContain('family.fall');
  expect(state.notes.some((note) => note.tags.includes('FAM-04'))).toBe(false);
  expect(
    await page.evaluate(() =>
      localStorage.getItem('thelaw:tribunal:family-save-t0'),
    ),
  ).toBe(original);
  expect(errors).toEqual([]);
});

test('C: collected evidence, explicit push, help and omitted declaration produce a correctable contradiction', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enterNight(page, 'public');
  await collectEvidence(page);
  await choose(page, 'approcher');
  await advance(page);
  await page.screenshot({ path: info.outputPath('confrontation.png') });
  await choose(page, 'repousser');
  await advance(page);
  await choose(page, 'toucher');
  await choose(page, 'secours');
  await advance(page);
  await choose(page, 'omission');
  await advance(page);
  await advance(page);
  await expect(
    page.getByText('Vous avez déclaré : « Il a perdu l’équilibre. »', {
      exact: false,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Première déposition' }),
  ).toBeVisible();
  await choose(page, 'rectifier');
  await choose(page, 'contester');
  await expect(
    page.getByText('Vous avez raison. La question a bien été posée.', {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Consigner ce chapitre', exact: true })
    .click();
  const state = replay(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).events,
      KEY,
    ),
    familyContinuationContent,
  );
  for (const flag of [
    'family.pushed',
    'family.fall',
    'family.blood-contact',
    'family.help-called',
    'family.deposition-corrected',
  ])
    expect(state.flags).toContain(flag);
  for (const tag of [
    'FAM-03',
    'FAM-04',
    'FAM-05',
    'FAM-07',
    'FAM-08',
    'FAM-09',
    'FAM-10',
    'family.tribunal-corrected',
  ])
    expect(state.notes.some((note) => note.tags.includes(tag))).toBe(true);
  expect(state.completed).toBe(true);
});

test('a respectful confrontation gives Lucie her own boundaries without manufacturing an injury', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enterNight(page);
  await collectEvidence(page);
  await choose(page, 'distance');
  await advance(page);
  await choose(page, 'lettre');
  await advance(page);
  await advance(page);
  await choose(page, 'consigner');
  await advance(page);
  await advance(page);
  await expect(
    page.getByText('Lucie a autorisé deux phrases.', { exact: false }),
  ).toBeVisible();
  await choose(page, 'limites');
  await page
    .getByRole('button', { name: 'Consigner ce chapitre', exact: true })
    .click();
  const state = replay(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).events,
      KEY,
    ),
    familyContinuationContent,
  );
  expect(state.flags).not.toContain('family.pushed');
  expect(state.notes.some((note) => note.tags.includes('FAM-09'))).toBe(false);
  expect(state.completed).toBe(true);
});

test('a continuation cannot invent a completed source', async ({ page }) => {
  await page.goto('/jouer/sixieme-place/suite');
  await expect(
    page.getByRole('alert').filter({ hasText: 'Termine le premier chapitre' }),
  ).toContainText('Termine le premier chapitre');
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(
    null,
  );
});

test.describe('touch controls', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  test('drag, recenter, raycast and answer work with touch inside the viewport', async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/jouer/sixieme-place');
    const tap = async (id: string) =>
      page
        .getByRole('list', { name: 'Actions disponibles' })
        .locator(`[data-reply="${id}"]`)
        .tap();
    await tap('entrer');
    await tap('laisser');
    await tap('aider');
    await page.getByRole('button', { name: 'Continuer', exact: true }).tap();
    await page
      .getByRole('button', { name: 'Explorer la pièce', exact: true })
      .tap();
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveAttribute('data-hit-sixth-plate', /\[/);
    const initial = await canvas.getAttribute('data-hit-sixth-plate');
    const box = (await canvas.boundingBox())!;
    const session = await page.context().newCDPSession(page);
    await canvas.evaluate((element) => { for (const name of ['pointerdown','pointermove','pointerup','pointercancel']) element.addEventListener(name, (event) => element.setAttribute(`data-probe-${name}`, JSON.stringify({ x: (event as PointerEvent).clientX, y: (event as PointerEvent).clientY, type: (event as PointerEvent).pointerType }))); });
    await page.screenshot({ path: info.outputPath('before-touch-drag.png') });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: box.x + box.width * 0.5, y: box.y + box.height * 0.35 },
      ],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: box.x + box.width * 0.5 + 65, y: box.y + box.height * 0.35 },
      ],
    });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    console.log('pointer-probe', await canvas.evaluate((element) => ({... (element as HTMLElement).dataset, touch: getComputedStyle(element).touchAction })));
    await expect
      .poll(() => canvas.getAttribute('data-hit-sixth-plate'))
      .not.toBe(initial);
    await page
      .getByRole('button', { name: 'Recentrer le regard', exact: true })
      .tap();
    await expect
      .poll(() => canvas.getAttribute('data-hit-sixth-plate'))
      .toBe(initial);
    const [x, y] = JSON.parse(initial!) as number[];
    await page.screenshot({ path: info.outputPath('before-native-tap.png') });
    console.log('native-touch', {
      x,
      y,
      box,
      target: await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.outerHTML.slice(0, 180),
        {
          x: box.x + ((x! + 1) * box.width) / 2,
          y: box.y + ((1 - y!) * box.height) / 2,
        },
      ),
    });
    await page.touchscreen.tap(
      box.x + ((x! + 1) * box.width) / 2,
      box.y + ((1 - y!) * box.height) / 2,
    );
    await expect(page.getByText('Laisse-la.', { exact: true })).toBeVisible();
    await tap('observe');
    await page.screenshot({ path: info.outputPath('mobile-dialogue.png') });
    const save = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('thelaw:tribunal:family-save-t0')!),
    );
    expect(
      save.events.filter(
        (event: { type: string; optionId: string }) =>
          event.type === 'line_chosen' && event.optionId === 'assiette',
      ),
    ).toHaveLength(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual(844);
  });
});
