import { test, expect } from '@playwright/test';
import { completeRebirthPrologue, REBIRTH_KEY, rebirthAction } from './harness';
import { rebirthContent, collectedDocuments } from '../../src/content/rebirth';
import { replay } from '../../src/engine';

for (const contact of ['nora', 'keller', 'alone'] as const)
  test(`the complete Rebirth prologue records the ${contact} route and material evidence`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const leaks: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') leaks.push(request.url());
    });
    await page.goto('/jouer/t0');
    await expect(
      page.getByRole('heading', { name: '23 h 46 — Le retour' }),
    ).toBeVisible();
    await expect(
      page.getByText('Une pièce extrêmement banale.', { exact: true }),
    ).toHaveCount(0);
    await completeRebirthPrologue(page, contact, contact === 'nora');
    const save = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      REBIRTH_KEY,
    );
    const state = replay(save.events, rebirthContent);
    expect(state.completed).toBe(true);
    expect(state.flags).toContain(`rebirth.contact.${contact}`);
    expect(state.flags.includes('rebirth.archives.warned')).toBe(
      contact === 'keller',
    );
    expect(collectedDocuments(state).map((document) => document.id)).toContain(
      'RB-009',
    );
    expect(
      state.events.filter((event) => event.type === 'run_completed'),
    ).toHaveLength(1);
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Le dossier reste ouvert.' }),
    ).toBeVisible();
    expect(leaks).toEqual([]);
  });

test('examining, reloading and leaving a document never invents a collected piece', async ({
  page,
}) => {
  await page.goto('/jouer/t0');
  for (const name of [
    'Ramasser l’enveloppe',
    'Ouvrir l’enveloppe sur le bureau',
    'Poursuivre l’enquête',
    'Examiner la photographie d’Élise',
  ])
    await rebirthAction(page, name);
  const dialog = page.getByRole('dialog', { name: 'La photographie d’Élise' });
  await expect(dialog).toBeVisible();
  await page.reload();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]'),
    ),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  let save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    REBIRTH_KEY,
  );
  expect(collectedDocuments(replay(save.events, rebirthContent))).toHaveLength(
    0,
  );
  await rebirthAction(page, 'Examiner la photographie d’Élise');
  await rebirthAction(page, 'Consigner cette pièce');
  save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    REBIRTH_KEY,
  );
  expect(
    collectedDocuments(replay(save.events, rebirthContent)).map(
      (document) => document.id,
    ),
  ).toEqual(['RB-001']);
});

test('every scene can be skipped, without fabricating evidence or an ally', async ({
  page,
}) => {
  await page.goto('/jouer/t0');
  await expect(
    page.getByRole('heading', { name: '23 h 46 — Le retour' }),
  ).toBeVisible();
  for (let scene = 0; scene < 7; scene++) {
    await rebirthAction(page, 'Pause');
    await rebirthAction(page, 'Passer cette scène');
  }
  await expect(
    page.getByRole('heading', { name: 'Le dossier reste ouvert.' }),
  ).toBeVisible();
  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    REBIRTH_KEY,
  );
  const state = replay(save.events, rebirthContent);
  expect(collectedDocuments(state)).toHaveLength(0);
  expect(
    state.flags.filter((flag) => flag.startsWith('rebirth.contact.')),
  ).toHaveLength(0);
});
