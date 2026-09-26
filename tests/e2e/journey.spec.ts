import { test, expect, type Page } from '@playwright/test';
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
  await page.getByRole('button', { name: 'Entrer' }).click();
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
    .getByRole('textbox', { name: 'Pourquoi ?' })
    .fill('Pour rentrer chez moi.');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await reveal(page);
  await hold(page, 'Tirer le levier');
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await hold(page, 'Signer');
  await reveal(page);
  await hold(page, 'Ne rien donner');
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await reveal(page);
  await hold(page, 'Refuser');
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(
    page.getByText('Tout à l’heure, tu as fait l’inverse.'),
  ).toBeVisible();
  await reveal(page);
  await page.getByRole('button', { name: 'Abandonner' }).click();
  await reveal(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await reveal(page);
  await expect(page.getByText(/Pour rentrer chez moi/)).toBeVisible();
  await page.getByRole('button', { name: 'Oui' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await reveal(page);
  await page.getByRole('button', { name: 'Sauver une personne' }).click();
  await hold(page, 'Confirmer');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(
    page.getByText('Elles étaient toutes les tiennes.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Lire ma loi' }).click();
  await expect(page.getByText('Abrogée', { exact: true })).toBeVisible();
  expect(leaked).toEqual([]);
});
test('keyboard operation and resume from a saved scene', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Commencer' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Entrer' }).focus();
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
  await expect(page.getByText('Tu as refusé.')).toBeVisible();
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
  await activate('Entrer');
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
  await activate('Je préfère ne pas répondre');
  await activate('Continuer');
  await reveal(page);
  await hold(page, 'Tirer le levier');
  await reveal(page);
  await activate('Continuer');
  await hold(page, 'Signer');
  await reveal(page);
  await hold(page, 'Ne rien donner');
  await reveal(page);
  await activate('Continuer');
  await reveal(page);
  await hold(page, 'Autoriser');
  await reveal(page);
  await activate('Continuer');
  await reveal(page);
  await activate('Continuer');
  await activate('Continuer');
  await reveal(page);
  await activate('Oui');
  await activate('Continuer');
  await reveal(page);
  await activate('Sauver cinq personnes');
  await hold(page, 'Confirmer');
  await activate('Continuer');
  await expect(
    page.getByText('Elles étaient toutes les tiennes.'),
  ).toBeVisible();
});
