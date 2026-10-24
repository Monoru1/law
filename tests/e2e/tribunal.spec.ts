import { test, expect } from '@playwright/test';
import { tribunalContent } from '../../src/content/tribunal';
import { replay } from '../../src/engine';

const TRIBUNAL_KEY = 'thelaw:tribunal:save-t0';

test('the Tribunal opening is reachable, keyboard-operable, records silence and resumes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/jouer/tribunal');
  await expect(
    page.getByRole('heading', { name: 'L’audience est ouverte' }),
  ).toBeVisible();
  await expect(page.getByText('Noir complet.')).toBeVisible();

  // Keyboard only: focus and activate each visible reply with Enter.
  const activate = async (name: string) => {
    const button = page.getByRole('button', { name, exact: true });
    await button.focus();
    await page.keyboard.press('Enter');
  };
  await activate('Rester immobile');
  await expect(page.getByText('Vous pouvez ouvrir les yeux.')).toBeVisible();
  await activate('Ouvrir les yeux');
  await expect(
    page.getByText('Nous n’allons pas vous demander ce que vous auriez fait.'),
  ).toBeVisible();

  // The explicit silence reply, not a timeout: an intentional "…".
  await activate('…');
  await expect(page.getByText('Rien ne vient.')).toBeVisible();
  await activate('Continuer');
  await expect(page.getByText('LA SIXIÈME PLACE.')).toBeVisible();
  await activate('Continuer'); // dossier's own reply
  await activate('Continuer'); // advances to the next scene

  await expect(
    page.getByRole('heading', { name: 'L’audience est suspendue' }),
  ).toBeVisible();
  await expect(
    page.getByText('Trois dossiers reposent sur le pupitre, chacun scellé.'),
  ).toBeVisible();
  await activate('Continuer'); // registre's own reply
  await activate('Clore l’audience'); // completes the run
  await expect(
    page.getByRole('heading', { name: 'L’audience est suspendue.' }),
  ).toBeVisible();

  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    TRIBUNAL_KEY,
  );
  const state = replay(save.events, tribunalContent);
  expect(state.completed).toBe(true);
  expect(
    state.notes.some(
      (note) =>
        note.kind === 'silence' && note.tags.includes('tribunal-ouverture'),
    ),
  ).toBe(true);
  expect(
    state.events.filter((event) => event.type === 'run_completed'),
  ).toHaveLength(1);

  // Reload: the completed run is shown again, not replayed from the start.
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'L’audience est suspendue.' }),
  ).toBeVisible();
});

test('contesting the opening is recorded as a distinct fact, not profiled', async ({
  page,
}) => {
  await page.goto('/jouer/tribunal');
  const click = async (name: string) =>
    page.getByRole('button', { name, exact: true }).click();
  await click('Rester immobile');
  await click('Ouvrir les yeux');
  await click('Contester : « Je n’ai rien à faire ici »');
  await expect(page.getByText('Peut-être.')).toBeVisible();
  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    TRIBUNAL_KEY,
  );
  const state = replay(save.events, tribunalContent);
  expect(
    state.notes.some(
      (note) =>
        note.kind === 'refusal' && note.tags.includes('tribunal-ouverture'),
    ),
  ).toBe(true);
});
