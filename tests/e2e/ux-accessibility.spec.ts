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
  test(`single-click choice, pause and touch-sized navigation ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await seed(page, 't1.dix-mille');
    await expect(
      page.getByRole('button', {
        name: /Afficher la suite|Voir la suite|Suivant/,
      }),
    ).toHaveCount(0);
    const accept = page.getByRole('button', { name: 'Accepter', exact: true });
    await expect(accept).toBeVisible();
    // Nothing is recorded before the player acts.
    expect(
      (await events(page)).filter((event) => event.type === 'choice_locked'),
    ).toHaveLength(0);
    // Pause + full keyboard navigation of the dialog and settings.
    await page.getByRole('button', { name: 'Quitter' }).focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Pause' });
    await expect(
      dialog.getByRole('button', { name: 'Reprendre', exact: true }),
    ).toBeFocused();
    await expect(page.locator('main')).toHaveAttribute('inert', '');
    await page.keyboard.press('Shift+Tab');
    await expect(
      dialog.getByRole('button', { name: 'Retour à l’accueil' }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('button', { name: 'Reprendre', exact: true }),
    ).toBeFocused();
    for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    const settings = page.getByRole('dialog', { name: 'Paramètres' });
    await expect(settings).toBeVisible();
    // First control in settings is the reduce-motion select (no hold setting).
    await expect(settings.getByRole('combobox').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // A single click on a choice commits it immediately — no hold, no wait.
    await accept.click();
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

  test(`reduced motion keeps choices operable ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seed(page, 't1.dix-mille');
    const accept = page.getByRole('button', { name: 'Accepter', exact: true });
    const refuse = page.getByRole('button', { name: 'Refuser', exact: true });
    // With reduced motion the beats resolve instantly and both choices are
    // present and distinct without any hold gesture.
    await expect(accept).toBeVisible();
    await expect(refuse).toBeVisible();
    await expect(page.locator('.stage')).toHaveAttribute('data-reduce', 'true');
    await page.screenshot({
      path: testInfo.outputPath('reduced.png'),
      fullPage: true,
    });
    await accept.focus();
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

test('touch can reveal text and commit a choice with a single tap', async ({
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
  await expect(
    page.getByRole('button', {
      name: /Afficher la suite|Voir la suite|Suivant/,
    }),
  ).toHaveCount(0);
  const refuse = page.getByRole('button', { name: 'Refuser', exact: true });
  await expect(refuse).toBeVisible();
  await refuse.tap();
  await expect
    .poll(
      async () =>
        (await events(page)).filter((event) => event.type === 'choice_locked')
          .length,
    )
    .toBe(1);
  await context.close();
});

test('a consequence flows into the next decision without a progress control', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, 't1.dix-mille');
  const accept = page.getByRole('button', { name: 'Accepter', exact: true });
  await expect(accept).toBeVisible();
  await accept.click();
  await expect(
    page.getByText('10 000 € ont été versés.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Continuer', exact: true }),
  ).toHaveCount(0);
  await page.waitForTimeout(500);
  await page.screenshot({
    path: testInfo.outputPath('automatic-outcome-mobile.png'),
    fullPage: true,
  });
  await expect(
    page.getByRole('button', { name: 'Appuyer', exact: true }),
  ).toBeVisible({ timeout: 15_000 });
});

test('the room carries factual decision traces into a later scene', async ({
  page,
}, testInfo) => {
  const choices: GameEvent[] = [
    ['t1.bouton', 'appuyer'],
    ['t1.dix-mille', 'refuser'],
    ['t1.sept-annees', 'sauver'],
  ].flatMap(([sceneId, value], index) => [
    {
      type: 'scene_entered' as const,
      id: `remembered-visit-${index}`,
      at: 10 + index * 2,
      sceneId: sceneId!,
      sceneVersion: 1,
    },
    {
      type: 'choice_locked' as const,
      id: `remembered-${index}`,
      at: 11 + index * 2,
      sceneId: sceneId!,
      sceneVersion: 1,
      input: 'binary' as const,
      value: value!,
      hesitationMs: 0,
      selectionChanges: 0,
    },
  ]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed(page, 't1.le-protocole', choices);
  const room = page.locator('.room');
  await expect(room).toHaveAttribute('data-memory', '3');
  await expect(room).toHaveAttribute('data-regression', '2');
  await expect(room.locator('.room-trace')).toHaveCount(3);
  const positions = await room
    .locator('.room-trace')
    .evaluateAll((traces) =>
      traces.map((trace) =>
        (trace as HTMLElement).style.getPropertyValue('--trace-x'),
      ),
    );
  expect(new Set(positions).size).toBeGreaterThan(1);
  await page.screenshot({
    path: testInfo.outputPath('remembered-room-desktop.png'),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(room.locator('.room-trace')).toHaveCount(3);
  await page.screenshot({
    path: testInfo.outputPath('remembered-room-mobile.png'),
    fullPage: true,
  });
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
    // Both "Signer" and "Non" commit with a single click — no hold gesture.
    await page.getByRole('button', { name: action, exact: true }).click();
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
  await page
    .getByRole('textbox', { name: 'Ton nom ou pseudonyme' })
    .fill('Testeur');
  await page.getByRole('button', { name: 'Entrer', exact: true }).click();
  await page.getByRole('button', { name: 'J’accepte et je commence' }).click();
  expect(await page.evaluate(() => localStorage.getItem('thelaw:save'))).toBe(
    '{broken',
  );
  // The failed attempt leaves onboarding on the consent step; step back to
  // the intro step, where the home link lives.
  await page.getByRole('button', { name: 'Retour', exact: true }).click();
  await page.getByRole('link', { name: 'Retour à l’accueil' }).click();
  await expect(page).toHaveURL('/');
});
