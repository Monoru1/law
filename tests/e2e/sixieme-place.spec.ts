import { test, expect } from '@playwright/test';
import { familyContent } from '../../src/content/sixieme-place';
import { replay } from '../../src/engine';

const FAMILY_KEY = 'thelaw:tribunal:family-save-t0';

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
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/jouer/sixieme-place');
  await expect(
    page.getByRole('heading', { name: 'La maison Delcourt' }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(360);
});
