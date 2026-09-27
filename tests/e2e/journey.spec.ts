import { test, expect, type Page } from '@playwright/test';
import { content } from '../../src/content';
import { lawStatement, replay } from '../../src/engine';
async function reveal(page: Page) {
  await page.locator('body').press('Space');
}
async function hold(page: Page, name: string) {
  const button = page.getByRole('button', { name, exact: true });
  await button.focus();
  await page.keyboard.down('Enter');
  await page.waitForTimeout(1300);
  await page.keyboard.up('Enter');
}
test('a full run records a signed law, contradicts it and remembers the written answer', async ({
  page,
}) => {
  const leaked: string[] = [];
  page.on('request', (request) => {
    if (request.postData()?.includes('Pour rentrer chez moi'))
      leaked.push(request.url());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page
    .getByRole('textbox', { name: 'Ton nom ou pseudonyme' })
    .fill('Testeur');
  await page.getByRole('button', { name: 'Entrer' }).click();
  await page.getByRole('button', { name: 'J’accepte et je commence' }).click();
  await reveal(page);
  await page.getByRole('button', { name: 'Appuyer', exact: true }).click();
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await reveal(page);
  await hold(page, 'Refuser');
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await reveal(page);
  await hold(page, 'Les sauver');
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Passer' }).click();
  await reveal(page);
  await page
    .getByRole('textbox', { name: 'Pourquoi ?' })
    .fill('Pour rentrer chez moi.');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await reveal(page);
  await hold(page, 'Dossier B');
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await hold(page, 'Signer');
  await reveal(page);
  await hold(page, 'Confirmer');
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await reveal(page);
  await hold(page, 'Arr\u00eater le protocole');
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Tu l\u2019as sign\u00e9e.')).toBeVisible();
  await reveal(page);
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
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await reveal(page);
  await expect(page.getByText(/Pour rentrer chez moi/)).toBeVisible();
  await page.getByRole('button', { name: 'Oui' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await reveal(page);
  await page.getByRole('button', { name: 'Sortir de la pi\u00e8ce' }).click();
  await expect(
    page.getByText('Elles \u00e9taient toutes les tiennes.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Lire ma loi' }).click();
  await expect(page.getByText('Abrog\u00e9e', { exact: true })).toBeVisible();
  expect(leaked).toEqual([]);
});
test('keyboard operation and resume from a saved scene', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Commencer' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('textbox', { name: 'Ton nom ou pseudonyme' }).focus();
  await page.keyboard.type('Testeur');
  await page.getByRole('button', { name: 'Entrer' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'J’accepte et je commence' }).focus();
  await page.keyboard.press('Enter');
  await reveal(page);
  await page.getByRole('button', { name: 'Ne pas appuyer' }).focus();
  await page.keyboard.press('Enter');
  await page.reload();
  await expect(page.getByText('Tu ne sauras jamais.')).toBeVisible();
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).focus();
  await page.keyboard.press('Enter');
  await reveal(page);
  await hold(page, 'Refuser');
  await expect(page.getByText('Tu as refus\u00e9.')).toBeVisible();
});
test('the complete story is playable using only the keyboard', async ({
  page,
}) => {
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
  await reveal(page);
  await activate('Appuyer');
  await reveal(page);
  await activate('Continuer');
  await reveal(page);
  await hold(page, 'Refuser');
  await reveal(page);
  await activate('Continuer');
  await reveal(page);
  await hold(page, 'Les sauver');
  await reveal(page);
  await activate('Continuer');
  await activate('Passer');
  await reveal(page);
  await activate('Je pr\u00e9f\u00e8re ne pas r\u00e9pondre');
  await activate('Continuer');
  await reveal(page);
  await hold(page, 'Dossier A');
  await reveal(page);
  await activate('Continuer');
  await activate('Ne pas signer');
  await reveal(page);
  await hold(page, 'Confirmer');
  await reveal(page);
  await activate('Continuer');
  await reveal(page);
  await activate('Continuer');
  await reveal(page);
  await hold(page, 'Continuer le protocole');
  await reveal(page);
  await activate('Continuer');
  await reveal(page);
  await activate('Continuer');
  await activate('Continuer');
  await reveal(page);
  await activate('Oui');
  await activate('Continuer');
  await reveal(page);
  await activate('Sortir de la pi\u00e8ce');
  await expect(
    page.getByText('Elles \u00e9taient toutes les tiennes.'),
  ).toBeVisible();
});
