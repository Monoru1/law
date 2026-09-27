import { test, expect, type Page } from '@playwright/test';
import { content } from '../../src/content';
import { type GameEvent } from '../../src/engine';
import {
  contentIdentity,
  CURRENT_SCHEMA_VERSION,
} from '../../src/persistence/migrations';
import { defaultSettings } from '../../src/persistence/SaveAdapter';

const viewports = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 360, height: 640 },
];

async function seed(page: Page, sceneId: string, history: GameEvent[] = []) {
  const scene = content.scenes.find((item) => item.id === sceneId)!;
  const save = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    contentVersion: content.version,
    contentIdentity: contentIdentity(content),
    runId: 'ux-synthetic-run',
    createdAt: 1,
    updatedAt: 100,
    settings: defaultSettings,
    events: [
      {
        type: 'run_started',
        id: 'start',
        at: 1,
        contentVersion: content.version,
      },
      ...history,
      {
        type: 'scene_entered',
        id: 'current-visit',
        at: 100,
        sceneId,
        sceneVersion: scene.version,
      },
    ],
  };
  await page.addInitScript((value) => {
    if (!localStorage.getItem('thelaw:save'))
      localStorage.setItem('thelaw:save', JSON.stringify(value));
  }, save);
  await page.goto('/jouer');
}

async function events(page: Page): Promise<GameEvent[]> {
  return page.evaluate(
    () => JSON.parse(localStorage.getItem('thelaw:save')!).events,
  );
}

for (const viewport of viewports) {
  test(`hold, pause and touch-sized navigation ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await seed(page, 't1.dix-mille');
    await page.getByRole('button', { name: 'Afficher la suite' }).click();
    const accept = page.getByRole('button', { name: 'Accepter', exact: true });
    await expect(accept).toHaveAccessibleDescription(
      'Maintenir pour confirmer. Relâcher pour annuler.',
    );
    await accept.click();
    await expect(accept).toHaveAccessibleDescription(
      'Maintien interrompu. Maintiens pour confirmer.',
    );
    expect(
      (await events(page)).filter((event) => event.type === 'choice_locked'),
    ).toHaveLength(0);
    await page.screenshot({
      path: testInfo.outputPath('hold.png'),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Quitter' }).focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Pause' });
    await expect(
      dialog.getByRole('button', { name: 'Continuer', exact: true }),
    ).toBeFocused();
    await expect(page.locator('main')).toHaveAttribute('inert', '');
    await page.keyboard.press('Shift+Tab');
    await expect(
      dialog.getByRole('button', { name: 'Retour à l’accueil' }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('button', { name: 'Continuer', exact: true }),
    ).toBeFocused();
    for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    const settings = page.getByRole('dialog', { name: 'Paramètres' });
    await expect(
      settings.getByRole('checkbox', { name: 'Confirmation simple' }),
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(settings).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await accept.focus();
    await page.keyboard.down('Enter');
    await page.waitForTimeout(350);
    await page.keyboard.press('Tab');
    await page.keyboard.up('Enter');
    await page.waitForTimeout(1000);
    expect(
      (await events(page)).filter((event) => event.type === 'choice_locked'),
    ).toHaveLength(0);
    await accept.focus();
    await page.keyboard.down('Enter');
    await page.waitForTimeout(1300);
    await page.keyboard.up('Enter');
    await expect
      .poll(
        async () =>
          (await events(page)).filter((event) => event.type === 'choice_locked')
            .length,
      )
      .toBe(1);
    await page.reload();
    await expect(
      page.getByText('10 000 € ont été versés.', { exact: true }),
    ).toBeVisible();
    await page.goto('/ma-loi');
    await expect(
      page.getByText(/Hésitation|Sélection modifiée|Certitude/),
    ).toHaveCount(0);
    for (const link of await page.locator('header a').all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({
      path: testInfo.outputPath('trace.png'),
      fullPage: true,
    });
  });

  test(`reduced motion keeps choices distinct ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seed(page, 't1.dix-mille');
    const accept = page.getByRole('button', { name: 'Accepter', exact: true });
    await accept.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('button', { name: 'Confirmer : Accepter', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(accept).toHaveAttribute('aria-pressed', 'false');
    const refuse = page.getByRole('button', {
      name: 'Confirmer : Refuser',
      exact: true,
    });
    await expect(refuse).toBeFocused();
    await expect(page.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('.stage')).toHaveAttribute('data-reduce', 'true');
    await page.screenshot({
      path: testInfo.outputPath('simple.png'),
      fullPage: true,
    });
    await page.keyboard.press('Enter');
    await expect
      .poll(
        async () =>
          (await events(page)).filter((event) => event.type === 'choice_locked')
            .length,
      )
      .toBe(1);
  });
}

test('touch can reveal text and confirm without a keyboard', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: viewports[2],
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  await seed(page, 't1.dix-mille');
  await page.getByRole('button', { name: 'Afficher la suite' }).tap();
  await expect(
    page.getByRole('button', { name: 'Accepter', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Quitter' }).tap();
  await page.getByRole('button', { name: 'Paramètres' }).tap();
  await page.getByRole('checkbox', { name: 'Confirmation simple' }).check();
  await page.getByRole('button', { name: 'Continuer', exact: true }).tap();
  await page.getByRole('button', { name: 'Accepter', exact: true }).tap();
  await page.getByRole('button', { name: 'Refuser', exact: true }).tap();
  await expect(
    page.getByRole('button', { name: 'Accepter', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await page
    .getByRole('button', { name: 'Confirmer : Refuser', exact: true })
    .tap();
  await expect
    .poll(
      async () =>
        (await events(page)).filter((event) => event.type === 'choice_locked')
          .length,
    )
    .toBe(1);
  await context.close();
});

for (const action of ['Non', 'Signer']) {
  test(`unsigned law records ${action}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seed(page, 't1.confrontation-non-signee', [
      {
        type: 'scene_entered',
        id: 'surgeon',
        at: 4,
        sceneId: 't1.le-protocole',
        sceneVersion: 1,
      },
      {
        type: 'choice_locked',
        id: 'surgeon-choice',
        at: 5,
        sceneId: 't1.le-protocole',
        sceneVersion: 1,
        input: 'binary',
        value: 'continuer',
        hesitationMs: 0,
        selectionChanges: 0,
      },
      {
        type: 'scene_entered',
        id: 'earlier',
        at: 2,
        sceneId: 't1.chambre-froide',
        sceneVersion: 1,
      },
      {
        type: 'choice_locked',
        id: 'choice',
        at: 3,
        sceneId: 't1.chambre-froide',
        sceneVersion: 1,
        input: 'binary',
        value: 'dossier-b',
        hesitationMs: 0,
        selectionChanges: 0,
      },
    ]);
    await page.getByRole('button', { name: action, exact: true }).click();
    if (action === 'Signer')
      await page
        .getByRole('button', { name: 'Confirmer : Signer', exact: true })
        .click();
    await expect
      .poll(async () =>
        (await events(page)).some(
          (event) =>
            event.type ===
            (action === 'Signer' ? 'law_signed' : 'law_declined'),
        ),
      )
      .toBe(true);
    await expect
      .poll(async () =>
        (await events(page)).some(
          (event) =>
            event.type === 'choice_locked' &&
            event.sceneId === 't1.confrontation-non-signee' &&
            event.value === (action === 'Signer' ? 'signed' : 'no'),
        ),
      )
      .toBe(true);
    await page.goto('/ma-loi');
    await expect(page.getByText(action, { exact: true })).toBeVisible();
    await expect(
      page.getByText(/^(signed|no|written|declined|maintain|abandon)$/),
    ).toHaveCount(0);
  });
}

test('empty history and unreadable saves stay distinguishable', async ({
  page,
}) => {
  await page.goto('/ma-loi');
  await expect(page.getByText('Aucune partie enregistrée.')).toBeVisible();
  await page.evaluate(() => localStorage.setItem('thelaw:save', '{broken'));
  await page.reload();
  await expect(
    page.getByRole('alert').filter({ hasText: /Sauvegarde illisible/ }),
  ).toBeVisible();
  await expect(page.getByText('Aucune partie enregistrée.')).toHaveCount(0);
  await page.goto('/jouer');
  await expect(
    page.getByRole('alert').filter({ hasText: /Sauvegarde illisible/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Entrer', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('thelaw:save'))).toBe(
    '{broken',
  );
  await page.getByRole('link', { name: 'Retour à l’accueil' }).click();
  await expect(page).toHaveURL('/');
});
