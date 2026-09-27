import { test, expect, type Page } from '@playwright/test';
import { content } from '../../src/content';
import { lawStatement, replay } from '../../src/engine';
// A committed choice is now a single deliberate click — no hold gesture.
async function commit(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
}
// Narrative and consequences advance on their own. Tests wait for the next
// meaningful action instead of manufacturing progress clicks.
async function advanceUntil(page: Page, name: string) {
  const target = page.getByRole('button', { name, exact: true });
  await expect(target).toBeVisible({ timeout: 15_000 });
}
// Advance through the final outcome screens until a narrative text is shown
// (e.g. the ending, reached after the coda's outcome resolves).
async function advanceUntilText(page: Page, text: string) {
  const target = page.getByText(text);
  await expect(target).toBeVisible({ timeout: 15_000 });
}
test('a full run records a signed law, contradicts it and remembers the written answer', async ({
  page,
}) => {
  test.slow();
  // The written answer must never leak to a third party. The consented
  // first-party report endpoint (/api/report) is its only legitimate
  // recipient, so it is excluded from the leak set.
  const leaked: string[] = [];
  page.on('request', (request) => {
    if (
      request.postData()?.includes('Pour rentrer chez moi') &&
      !request.url().includes('/api/report')
    )
      leaked.push(request.url());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page
    .getByRole('textbox', { name: 'Ton nom ou pseudonyme' })
    .fill('Testeur');
  await page.getByRole('button', { name: 'Entrer' }).click();
  await page.getByRole('button', { name: 'J’accepte et je commence' }).click();
  await advanceUntil(page, 'Appuyer');
  await page.getByRole('button', { name: 'Appuyer', exact: true }).click();
  await advanceUntil(page, 'Refuser');
  await commit(page, 'Refuser');
  await advanceUntil(page, 'Les sauver');
  await commit(page, 'Les sauver');
  await advanceUntil(page, 'Passer');
  await page.getByRole('button', { name: 'Passer' }).click();
  await expect(page.getByRole('textbox', { name: 'Pourquoi ?' })).toBeVisible({
    timeout: 15_000,
  });
  await page
    .getByRole('textbox', { name: 'Pourquoi ?' })
    .fill('Pour rentrer chez moi.');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await advanceUntil(page, 'Dossier B');
  await commit(page, 'Dossier B');
  await advanceUntil(page, 'Signer');
  await commit(page, 'Signer');
  await advanceUntil(page, 'Ne rien donner');
  await commit(page, 'Ne rien donner');
  await advanceUntil(page, 'Arrêter le protocole');
  await commit(page, 'Arr\u00eater le protocole');
  await expect(page.getByText('Tu l\u2019as sign\u00e9e.')).toBeVisible({
    timeout: 15_000,
  });
  const recorded = await page.evaluate(
    () => JSON.parse(localStorage.getItem('thelaw:save')!).events,
  );
  const recordedState = replay(recorded, content);
  const signedLaw = recordedState.laws[0];
  expect(signedLaw).toBeDefined();
  if (!signedLaw) throw new Error('Expected a signed law in the saved journey');
  const statement = lawStatement(signedLaw, content);
  expect(statement.trim().length).toBeGreaterThan(0);
  await expect(
    page.getByText(`\u00ab\u00a0${statement}\u00a0\u00bb`, { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Abandonner' }).click();
  await advanceUntil(page, 'Oui');
  await expect(page.getByText(/Pour rentrer chez moi/)).toBeVisible();
  await page.getByRole('button', { name: 'Oui' }).click();
  await advanceUntil(page, 'Sortir de la pi\u00e8ce');
  await page.getByRole('button', { name: 'Sortir de la pi\u00e8ce' }).click();
  await advanceUntilText(page, 'Elles \u00e9taient toutes les tiennes.');
  await expect(
    page.getByText('Elles \u00e9taient toutes les tiennes.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Lire ma loi' }).click();
  await expect(page.getByText('Abrog\u00e9e', { exact: true })).toBeVisible();
  expect(leaked).toEqual([]);
});
test('keyboard operation and resume from a saved scene', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Commencer' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('textbox', { name: 'Ton nom ou pseudonyme' }).focus();
  await page.keyboard.type('Testeur');
  await page.getByRole('button', { name: 'Entrer' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'J’accepte et je commence' }).focus();
  await page.keyboard.press('Enter');
  await advanceUntil(page, 'Ne pas appuyer');
  await page.getByRole('button', { name: 'Ne pas appuyer' }).focus();
  await page.keyboard.press('Enter');
  await page.reload();
  await expect(page.getByText('Tu ne sauras jamais.')).toBeVisible();
  await advanceUntil(page, 'Refuser');
  await commit(page, 'Refuser');
  await expect(page.getByText('Tu as refus\u00e9.')).toBeVisible();
});
test('the complete story is playable using only the keyboard', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const activate = async (name: string) => {
    const button = page.getByRole('button', { name, exact: true });
    await button.focus();
    await page.keyboard.press('Enter');
  };
  await page.goto('/');
  await activate('Commencer');
  await page.getByRole('textbox', { name: 'Ton nom ou pseudonyme' }).focus();
  await page.keyboard.type('Testeur');
  await activate('Entrer');
  await activate('J’accepte et je commence');
  await advanceUntil(page, 'Appuyer');
  await activate('Appuyer');
  await advanceUntil(page, 'Refuser');
  await activate('Refuser');
  await advanceUntil(page, 'Les sauver');
  await activate('Les sauver');
  await advanceUntil(page, 'Passer');
  await activate('Passer');
  await advanceUntil(page, 'Je pr\u00e9f\u00e8re ne pas r\u00e9pondre');
  await activate('Je pr\u00e9f\u00e8re ne pas r\u00e9pondre');
  await advanceUntil(page, 'Dossier A');
  await activate('Dossier A');
  await advanceUntil(page, 'Ne pas signer');
  await activate('Ne pas signer');
  await advanceUntil(page, 'Ne rien donner');
  await activate('Ne rien donner');
  await advanceUntil(page, 'Continuer le protocole');
  await activate('Continuer le protocole');
  await advanceUntil(page, 'Oui');
  await activate('Oui');
  await advanceUntil(page, 'Sortir de la pi\u00e8ce');
  await activate('Sortir de la pi\u00e8ce');
  await advanceUntilText(page, 'Elles \u00e9taient toutes les tiennes.');
  await expect(
    page.getByText('Elles \u00e9taient toutes les tiennes.'),
  ).toBeVisible();
});
