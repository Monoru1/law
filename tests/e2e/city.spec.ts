import { test, expect, type Page } from '@playwright/test';
import type { GameEvent } from '../../src/engine';
import { cityEvents, contentT3, fullHouseEvents, saveOf } from './journeys';
import { content, contentT2, roomEvents } from './journeys';

const ROOM = 'thelaw:save';
const HOUSE = 'thelaw:save-t2';
const CITY = 'thelaw:save-t3';

async function seed(page: Page, saves: Record<string, unknown>) {
  await page.addInitScript((values) => {
    for (const [key, value] of Object.entries(values))
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(value));
  }, saves);
}
const journal = (page: Page, key = CITY): Promise<GameEvent[]> =>
  page.evaluate(
    (storageKey) => JSON.parse(localStorage.getItem(storageKey)!).events,
    key,
  );
const button = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true });

test('the city stays closed until the house is finished', async ({ page }) => {
  await page.goto('/jouer/t3');
  await expect(
    page.getByText('La ville s’ouvre après la maison.'),
  ).toBeVisible();
  await expect(button(page, 'Entrer dans la ville')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Aller à la maison' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('thelaw:save-t3')),
  ).toBeNull();
});

test('a decision in the city rests on its consequence, whatever the player picks, until they move on', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, {
    [ROOM]: saveOf(content, roomEvents(), { reportingConsent: false }),
    [HOUSE]: saveOf(contentT2, fullHouseEvents(), { reportingConsent: false }),
  });
  await page.goto('/jouer/t3');
  await button(page, 'Entrer dans la ville').click();
  await expect(
    page.getByText('Ton badge ne fonctionne pas du premier coup.'),
  ).toBeVisible({ timeout: 15_000 });
  // A narrative passage reveals its beats automatically, but never decides
  // that the player has finished reading them.
  await expect(page.getByText('Il y en a beaucoup.')).toBeVisible({
    timeout: 15_000,
  });
  const passageNext = button(page, 'Suivant');
  await expect(passageNext).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(2_000);
  await expect(page.getByText('Il y en a beaucoup.')).toBeVisible();
  await passageNext.click();
  // First real decision: whichever request is picked, its consequence rests.
  await expect(page.getByText('Deux dossiers.')).toBeVisible({
    timeout: 20_000,
  });
  await button(page, 'La première demande').click();
  await expect(page.locator('.lock-trace')).toHaveText('La première demande');
  await expect(
    page.getByText('Huit mois, ça compte pour quelque chose.'),
  ).toBeVisible({ timeout: 15_000 });
  const next = button(page, 'Suivant');
  await expect(next).toBeVisible();
  // No timer moves the game on, however long the player stays.
  const beforeHold = await journal(page);
  await page.waitForTimeout(8_000);
  await expect(next).toBeVisible();
  const afterHold = await journal(page);
  expect(afterHold).toEqual(beforeHold);
  await expect(page.getByText('La machine à café')).toHaveCount(0);
  await next.click();
  await expect(page.getByText('La machine à café')).toBeVisible({
    timeout: 15_000,
  });
});

test('the rule is enacted without confirmation, rests, and its criterion is never overwritten by a later act', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, {
    [ROOM]: saveOf(content, roomEvents(), { reportingConsent: false }),
    [HOUSE]: saveOf(contentT2, fullHouseEvents(), { reportingConsent: false }),
    [CITY]: saveOf(contentT3, cityEvents([]), { reportingConsent: false }),
  });
  await page.goto('/jouer/t3');
  const advancePassage = async () => {
    const next = button(page, 'Suivant');
    await expect(next).toBeVisible({ timeout: 20_000 });
    await next.click();
  };
  const advance = async (name: string) => {
    const target = button(page, name);
    await expect(target).toBeVisible({ timeout: 20_000 });
    await target.click();
    // Every real decision rests: wait for the way on, then take it.
    const next = button(page, 'Suivant');
    await expect(next).toBeVisible({ timeout: 15_000 });
    await next.click();
  };
  await advancePassage();
  await advance('La première demande');
  await advancePassage();
  await advance('Respecter l’ordre d’arrivée');
  await advancePassage();
  await expect(page.getByText('Une seule case à remplir.')).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByRole('button', { name: 'Êtes-vous sûr', exact: false }),
  ).toHaveCount(0);
  await button(page, 'Par degré d’urgence').click();
  await expect(page.locator('.lock-trace')).toHaveText('Par degré d’urgence');
  await expect(page.getByText('Enregistré.')).toBeVisible({ timeout: 15_000 });
  // Certainty is asked under the resting consequence, not instead of it.
  await expect(page.getByText('Quelle est ta certitude ?')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmer', exact: true }).click();
  await expect(page.getByText('La ville a beaucoup de fenêtres.')).toBeVisible({
    timeout: 15_000,
  });
  const events = await journal(page);
  const rule = events.find(
    (e) =>
      e.type === 'choice_locked' &&
      e.sceneId === 't3.la-regle' &&
      e.value === 'urgence',
  );
  expect(rule).toBeDefined();
  expect(
    events.filter(
      (e) => e.type === 'choice_locked' && e.sceneId === 't3.la-regle',
    ),
  ).toHaveLength(1);
});

test('a night — a day — in the city keeps mute persistent and works on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, {
    [ROOM]: saveOf(content, roomEvents(), { reportingConsent: false }),
    [HOUSE]: saveOf(contentT2, fullHouseEvents(), { reportingConsent: false }),
  });
  await page.goto('/jouer/t3');
  await button(page, 'Entrer dans la ville').click();
  await expect(
    page.getByText('Ton badge ne fonctionne pas du premier coup.'),
  ).toBeVisible({ timeout: 15_000 });
  // Sound is off by default; toggling it and reloading keeps the setting.
  await page.getByRole('button', { name: 'Quitter', exact: true }).click();
  await page.getByRole('button', { name: 'Paramètres', exact: true }).click();
  const soundToggle = page.getByRole('checkbox');
  await expect(soundToggle).not.toBeChecked();
  await soundToggle.check();
  await page.reload();
  await expect(
    page.getByText('Ton badge ne fonctionne pas du premier coup.'),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Quitter', exact: true }).click();
  await page.getByRole('button', { name: 'Paramètres', exact: true }).click();
  await expect(page.getByRole('checkbox')).toBeChecked({ timeout: 15_000 });
});
