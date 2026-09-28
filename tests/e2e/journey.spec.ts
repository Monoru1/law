import { test, expect } from '@playwright/test';
import { content } from '../../src/content';
import { lawStatement, replay } from '../../src/engine';
import {
  activateWithKeyboard,
  advanceToAction,
  advanceToText,
  exactButton,
} from './harness';
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
  await advanceToAction(page, 'Appuyer');
  await exactButton(page, 'Appuyer').click();
  await advanceToAction(page, 'Refuser');
  await exactButton(page, 'Refuser').click();
  await advanceToAction(page, 'Les sauver');
  await exactButton(page, 'Les sauver').click();
  await advanceToAction(page, 'Passer');
  await page.getByRole('button', { name: 'Passer' }).click();
  await expect(page.getByRole('textbox', { name: 'Pourquoi ?' })).toBeVisible({
    timeout: 15_000,
  });
  await page
    .getByRole('textbox', { name: 'Pourquoi ?' })
    .fill('Pour rentrer chez moi.');
  await page.getByRole('button', { name: 'Consigner' }).click();
  await advanceToAction(page, 'Dossier B');
  await exactButton(page, 'Dossier B').click();
  await advanceToAction(page, 'Signer');
  await exactButton(page, 'Signer').click();
  await advanceToAction(page, 'Ne rien donner');
  await exactButton(page, 'Ne rien donner').click();
  await advanceToAction(page, 'Arrêter le protocole');
  await exactButton(page, 'Arr\u00eater le protocole').click();
  await advanceToText(page, 'Tu l\u2019as sign\u00e9e.');
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
  await advanceToAction(page, 'Oui');
  await expect(page.getByText(/Pour rentrer chez moi/)).toBeVisible();
  await page.getByRole('button', { name: 'Oui' }).click();
  await advanceToAction(page, 'Sortir de la pi\u00e8ce');
  await page.getByRole('button', { name: 'Sortir de la pi\u00e8ce' }).click();
  await advanceToText(page, 'Elles \u00e9taient toutes les tiennes.');
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
  await advanceToAction(page, 'Ne pas appuyer');
  await page.getByRole('button', { name: 'Ne pas appuyer' }).focus();
  await page.keyboard.press('Enter');
  await page.reload();
  await expect(page.getByText('Tu ne sauras jamais.')).toBeVisible();
  await advanceToAction(page, 'Refuser');
  await exactButton(page, 'Refuser').click();
  await expect(page.getByText('Tu as refus\u00e9.')).toBeVisible();
});
test('the complete story is playable using only the keyboard', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const activate = (name: string) => activateWithKeyboard(page, name);
  await page.goto('/');
  await activate('Commencer');
  await page.getByRole('textbox', { name: 'Ton nom ou pseudonyme' }).focus();
  await page.keyboard.type('Testeur');
  await activate('Entrer');
  await activate('J’accepte et je commence');
  await advanceToAction(page, 'Appuyer');
  await activate('Appuyer');
  await advanceToAction(page, 'Refuser');
  await activate('Refuser');
  await advanceToAction(page, 'Les sauver');
  await activate('Les sauver');
  await advanceToAction(page, 'Passer');
  await activate('Passer');
  await advanceToAction(page, 'Je pr\u00e9f\u00e8re ne pas r\u00e9pondre');
  await activate('Je pr\u00e9f\u00e8re ne pas r\u00e9pondre');
  await advanceToAction(page, 'Dossier A');
  await activate('Dossier A');
  await advanceToAction(page, 'Ne pas signer');
  await activate('Ne pas signer');
  await advanceToAction(page, 'Ne rien donner');
  await activate('Ne rien donner');
  await advanceToAction(page, 'Continuer le protocole');
  await activate('Continuer le protocole');
  await advanceToAction(page, 'Oui');
  await activate('Oui');
  await advanceToAction(page, 'Sortir de la pi\u00e8ce');
  await activate('Sortir de la pi\u00e8ce');
  await advanceToText(page, 'Elles \u00e9taient toutes les tiennes.');
  await expect(
    page.getByText('Elles \u00e9taient toutes les tiennes.'),
  ).toBeVisible();
});
