import { test, expect, type Page } from '@playwright/test';
import { familyContent } from '../../src/content/sixieme-place';
import { replay } from '../../src/engine';
import { writeFile } from 'node:fs/promises';

test.use({ video: 'on' });
const key = 'thelaw:tribunal:family-save-t0';
const choose = (page: Page, id: string) =>
  page
    .getByRole('list', { name: 'Actions disponibles' })
    .locator(`[data-reply="${id}"]`)
    .click();
async function hit(page: Page, id: string) {
  const canvas = page.locator('canvas');
  await expect(page.locator(`[data-object="${id}"]`)).toBeEnabled();
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute(`data-hit-${id}`, /\[/);
  const [x, y, z] = JSON.parse(
    (await canvas.getAttribute(`data-hit-${id}`))!,
  ) as number[];
  expect(z).toBeLessThan(1);
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(
    box.x + ((x! + 1) * box.width) / 2,
    box.y + ((1 - y!) * box.height) / 2,
  );
}

test('real raycasts carry the player from the Tribunal dossier to the sixth plate and persist its reaction', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/jouer/tribunal?ntl-drawer-state=hidden');
  await page
    .getByRole('button', { name: 'Rester immobile', exact: true })
    .click();
  await expect(page.locator('[data-renderer="3d"]')).toHaveAttribute(
    'data-ready',
    'true',
  );
  expect(
    await page
      .locator('canvas')
      .evaluate(
        (canvas) => !!(canvas as HTMLCanvasElement).getContext('webgl2'),
      ),
  ).toBe(true);
  await page
    .locator('canvas')
    .screenshot({ path: info.outputPath('tribunal.png') });
  await hit(page, 'bench');
  await expect(
    page.getByText(
      'Le bois porte des marques anciennes. Personne n’est assis sur ce banc.',
    ),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Revenir à la vue d’ensemble' })
    .click();
  await page
    .getByRole('button', { name: 'Ouvrir les yeux', exact: true })
    .click();
  await page.getByRole('button', { name: '…', exact: true }).click();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page
    .getByRole('button', { name: 'Clore l’audience', exact: true })
    .click();
  await hit(page, 'dossier');
  await expect(page).toHaveURL(/sixieme-place/);
  await expect(page.locator('[data-renderer="3d"]')).toHaveAttribute(
    'data-ready',
    'true',
  );
  await choose(page, 'entrer');
  await choose(page, 'laisser');
  await choose(page, 'aider');
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Six couverts' }),
  ).toBeVisible();
  await page
    .locator('canvas')
    .screenshot({ path: info.outputPath('six-settings.png') });
  await hit(page, 'sixth-plate');
  await expect(page.getByText('Laisse-la.', { exact: true })).toBeVisible();
  await choose(page, 'private');
  let save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(replay(save.events, familyContent).flags).toContain('family.private');
  await page.reload();
  save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(replay(save.events, familyContent).flags).toContain('family.private');
  expect(errors).toEqual([]);
});

test('keyboard, quality levels and 2D mode preserve the same journal', async ({
  page,
}, info) => {
  await page.goto('/jouer/sixieme-place');
  await expect(page.locator('[data-renderer="3d"]')).toHaveAttribute(
    'data-ready',
    'true',
  );
  const original = await page.evaluate((key) => localStorage.getItem(key), key);
  for (const quality of ['economy', 'standard', 'high']) {
    await page
      .getByRole('combobox', { name: 'Qualité du décor' })
      .selectOption(quality);
    await expect(page.locator('canvas')).toBeVisible();
  }
  const canvas = page.getByRole('img', { name: 'Regarder autour de soi' });
  await canvas.focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Home');
  await page.getByRole('button', { name: 'Utiliser le décor 2D' }).click();
  await expect(page.locator('[data-renderer="2d"]')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    original,
  );
  const entrance = page
    .getByRole('navigation', { name: 'Explorer le lieu' })
    .getByRole('button', { name: 'Traverser le gravier et entrer' });
  await entrance.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Alex. Tu as trouvé la route.')).toBeVisible();
  await page.getByRole('button', { name: 'Revenir au décor 3D' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.screenshot({ path: info.outputPath('hall.png'), fullPage: true });
});

test('losing the GPU context falls back without losing an observation', async ({
  page,
}) => {
  await page.goto('/jouer/sixieme-place');
  await expect(page.locator('[data-renderer="3d"]')).toHaveAttribute(
    'data-ready',
    'true',
  );
  await choose(page, 'fenetre');
  const save = await page.evaluate((key) => localStorage.getItem(key), key);
  await page.locator('canvas').evaluate((canvas) => {
    (canvas as HTMLCanvasElement)
      .getContext('webgl2')!
      .getExtension('WEBGL_lose_context')!
      .loseContext();
  });
  await expect(page.locator('[data-renderer="2d"]')).toBeVisible();
  await expect(
    page.getByText(
      'Le décor 3D est indisponible. Le décor 2D et toutes les actions restent accessibles.',
    ),
  ).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    save,
  );
  await choose(page, 'revenir');
  await choose(page, 'entrer');
  await expect(page.getByText('Alex. Tu as trouvé la route.')).toBeVisible();
});

test('a device without WebGL can immediately continue in 2D', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith('webgl')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/jouer/sixieme-place');
  await expect(page.locator('[data-renderer="2d"]')).toBeVisible({
    timeout: 20000,
  });
  await choose(page, 'entrer');
  await expect(page.getByText('Alex. Tu as trouvé la route.')).toBeVisible();
});

test('mobile 3D has accessible controls and records actual rendering costs', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/jouer/sixieme-place');
  await expect(page.locator('[data-renderer="3d"]')).toHaveAttribute(
    'data-ready',
    'true',
  );
  await page
    .getByRole('combobox', { name: 'Qualité du décor' })
    .selectOption('economy');
  const canvas = page.locator('canvas');
  await canvas.focus();
  for (let index = 0; index < 12; index++)
    await page.keyboard.press(index % 2 ? 'ArrowLeft' : 'ArrowRight');
  await page.screenshot({
    path: info.outputPath('mobile-3d.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  const metrics = await canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('webgl2')!;
    const debug = context.getExtension('WEBGL_debug_renderer_info');
    return {
      ...element.dataset,
      width: (element as HTMLCanvasElement).width,
      height: (element as HTMLCanvasElement).height,
      calls: element.getAttribute('data-calls'),
      renderer: debug
        ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : context.getParameter(context.RENDERER),
    };
  });
  await info.attach('render-metrics.json', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  });
  await writeFile(
    info.outputPath('render-metrics.json'),
    JSON.stringify(metrics, null, 2),
  );
  expect(Number(metrics.calls)).toBeLessThan(350);
  expect(Number(metrics.calls)).toBeGreaterThan(0);
});

test('spatial ambience stays opt-in and follows the real camera', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let listener: AudioListener | undefined;
    const state = {
      contexts: 0,
      panners: 0,
      get x() {
        return listener?.positionX.value ?? 0;
      },
    };
    (window as unknown as { spatialAudio: typeof state }).spatialAudio = state;
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor() {
        super();
        listener = this.listener;
        state.contexts++;
      }
      createPanner() {
        state.panners++;
        return super.createPanner();
      }
    };
  });
  await page.goto('/jouer/sixieme-place');
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { spatialAudio: { contexts: number } })
          .spatialAudio.contexts,
    ),
  ).toBe(0);
  await page
    .getByRole('button', { name: 'Activer le son', exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { spatialAudio: { panners: number } })
            .spatialAudio.panners,
      ),
    )
    .toBeGreaterThan(0);
  await page.locator('canvas').scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { spatialAudio: { x: number } }).spatialAudio.x,
      ),
    )
    .toBeGreaterThan(3);
  await choose(page, 'entrer');
  await expect(page.getByText('Alex. Tu as trouvé la route.')).toBeVisible();
  await page.locator('canvas').scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { spatialAudio: { x: number } }).spatialAudio.x,
      ),
    )
    .toBeLessThan(2);
  await page
    .getByRole('button', { name: 'Couper le son', exact: true })
    .click();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).settings.sound,
      key,
    ),
  ).toBe(false);
});
