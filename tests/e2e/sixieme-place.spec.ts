import { test, expect } from '@playwright/test';
import { familyContent } from '../../src/content/sixieme-place';
import { replay } from '../../src/engine';

const FAMILY_KEY = 'thelaw:tribunal:family-save-t0';

for (const route of ['public', 'observe', 'private'] as const)
  test(`the complete first chapter preserves the ${route} decision, evidence and resume`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Netlify's injected collaboration drawer conflicts with the game's CSP.
    // Its documented opt-out preserves strict console assertions on previews.
    await page.goto('/jouer/sixieme-place?ntl-drawer-state=hidden');
    const choose = async (id: string) => {
      const button = page
        .getByRole('list', { name: 'Actions disponibles' })
        .locator(`[data-reply="${id}"]`);
      await button.focus();
      await page.keyboard.press('Enter');
    };
    await choose('entrer');
    await choose('laisser');
    await choose('aider');
    await page.getByRole('button', { name: 'Continuer', exact: true }).click();
    await page
      .getByRole('button', { name: 'Accès aux objets au clavier', exact: true })
      .click();
    await page
      .getByRole('navigation', { name: 'Explorer le lieu' })
      .getByRole('button', { name: 'Examiner la sixième place' })
      .click();
    await choose(route);
    await page.getByRole('button', { name: 'Continuer', exact: true }).click();
    await choose('album');
    await choose('negatif');
    await page.getByRole('button', { name: 'Carnet', exact: true }).click();
    const ledger = page.getByRole('dialog', { name: 'Carnet du dossier I' });
    await expect(ledger.getByText(/FAM-01 —/)).toBeVisible();
    await expect(ledger.getByText(/FAM-02 —/)).toBeVisible();
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      ),
    ).toBe(true);
    await page.keyboard.press('Escape');
    await page.reload();
    await choose('retour');
    await choose(
      route === 'public'
        ? 'thomas'
        : route === 'private'
          ? 'sarah'
          : 'mireille',
    );
    await choose('retour');
    await page.screenshot({
      path: testInfo.outputPath(`hall-${route}.png`),
      fullPage: true,
    });
    await choose('arreter');
    await page.getByRole('button', { name: 'Consigner ce chapitre' }).click();
    await expect(
      page.getByRole('heading', { name: 'Le dossier reste ouvert.' }),
    ).toBeVisible();
    const raw = await page.evaluate(
      (key) => localStorage.getItem(key)!,
      FAMILY_KEY,
    );
    const state = replay(JSON.parse(raw).events, familyContent);
    expect(state.completed).toBe(true);
    expect(state.flags).toContain(`family.${route}`);
    const tag =
      route === 'public'
        ? 'family.thomas-offer'
        : route === 'private'
          ? 'family.sarah-key'
          : 'family.mireille-stays';
    expect(state.notes.some((note) => note.tags.includes(tag))).toBe(true);
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Le dossier reste ouvert.' }),
    ).toBeVisible();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), FAMILY_KEY),
    ).toBe(raw);
    expect(errors).toEqual([]);
  });

test('dossier audio activates, mutes and fails without blocking play', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const counters = { contexts: 0, starts: 0 };
    (window as unknown as { familyAudio: typeof counters }).familyAudio =
      counters;
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
  await page.goto('/jouer/sixieme-place');
  await expect(
    page.getByRole('heading', { name: 'La maison Delcourt' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { familyAudio: { contexts: number } }).familyAudio
          .contexts,
    ),
  ).toBe(0);
  await page
    .getByRole('button', { name: 'Activer le son', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Couper le son', exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { familyAudio: { starts: number } }).familyAudio
            .starts,
      ),
    )
    .toBeGreaterThanOrEqual(2);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Réglages', exact: true }).click();
  await page.getByRole('slider', { name: 'Volume' }).fill('0.25');
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).settings.volume,
        FAMILY_KEY,
      ),
    )
    .toBe(0.25);
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).settings.sound,
        FAMILY_KEY,
      ),
    )
    .toBe(true);
  await page
    .getByRole('button', { name: 'Couper le son', exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).settings.sound,
        FAMILY_KEY,
      ),
    )
    .toBe(false);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      value: class {
        constructor() {
          throw new Error('Unavailable');
        }
      },
    });
  });
  await page.reload();
  await page
    .getByRole('button', { name: 'Activer le son', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Le son est indisponible' }),
  ).toContainText('Le son est indisponible');
  await page
    .getByRole('list', { name: 'Actions disponibles' })
    .getByRole('button', { name: 'Traverser le gravier et entrer' })
    .click();
  await expect(page.getByText('Alex. Tu as trouvé la route.')).toBeVisible();
});

test('skipping all dossier scenes records no invented evidence', async ({
  page,
}) => {
  await page.goto('/jouer/sixieme-place');
  await expect(
    page.getByRole('heading', { name: 'La maison Delcourt' }),
  ).toBeVisible();
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page
      .getByRole('button', {
        name: 'Passer cette scène sans en tirer de conclusion',
      })
      .click();
  }
  await expect(
    page.getByRole('heading', { name: 'Le dossier reste ouvert.' }),
  ).toBeVisible();
  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    FAMILY_KEY,
  );
  const state = replay(save.events, familyContent);
  expect(state.notes).toEqual([]);
  expect(
    state.events.filter((event) => event.type === 'scene_skipped'),
  ).toHaveLength(3);
});

test('La Sixième Place is reachable, keyboard-operable, and does not duplicate the sound toggle', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/jouer/sixieme-place');
  await expect(
    page.getByRole('heading', { name: 'La maison Delcourt' }),
  ).toBeVisible();
  // The dossier mounts its own dedicated audio engine
  // (src/ui/player/AudioDirector.tsx); the global ambient soundscape
  // (src/ui/audio/HorrorAudio.tsx) must not also mount here, or the player
  // would see two independent "Activer le son" controls.
  await expect(
    page.getByRole('button', { name: 'Activer le son', exact: true }),
  ).toHaveCount(1);

  // Decor hotspots (nav "Explorer le lieu") can repeat a reply's own label;
  // the real choice list ("Actions disponibles") is the one source of truth
  // for what the player actually said.
  const replies = page.getByRole('list', { name: 'Actions disponibles' });
  const activate = async (name: string) => {
    const button = replies.getByRole('button', { name, exact: true });
    await button.focus();
    await page.keyboard.press('Enter');
  };
  await activate('Traverser le gravier et entrer');
  await expect(page.getByText('Alex. Tu as trouvé la route.')).toBeVisible();

  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    FAMILY_KEY,
  );
  const state = replay(save.events, familyContent);
  expect(state.completed).toBe(false);
  expect(state.events.length).toBeGreaterThan(0);
  // The journal replays to the exact same state the save was built from:
  // the usual determinism guarantee, exercised through the real UI here
  // rather than a seeded simulation.
  expect(replay(save.events, familyContent)).toEqual(state);
});

test('La Sixième Place fits mobile viewports with no horizontal overflow', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/jouer/sixieme-place');
  await expect(
    page.getByRole('heading', { name: 'La maison Delcourt' }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(360);
  await page.screenshot({
    path: testInfo.outputPath('house-mobile.png'),
    fullPage: true,
  });
});
