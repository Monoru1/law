import { test, expect, type Page } from '@playwright/test';
import type { GameEvent } from '../../src/engine';
import {
  content,
  contentT2,
  decide,
  enter,
  houseEvents,
  roomEvents,
  saveOf,
  WORDS,
} from './journeys';

const ROOM = 'thelaw:save';
const HOUSE = 'thelaw:save-t2';

async function seed(page: Page, saves: Record<string, unknown>) {
  await page.addInitScript((values) => {
    for (const [key, value] of Object.entries(values))
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(value));
  }, saves);
}
const journal = (page: Page, key = HOUSE): Promise<GameEvent[]> =>
  page.evaluate(
    (storageKey) => JSON.parse(localStorage.getItem(storageKey)!).events,
    key,
  );
const button = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true });
async function press(page: Page, name: string) {
  const target = button(page, name);
  await expect
    .poll(
      async () => {
        if (await target.isVisible()) return true;
        const next = page
          .getByRole('button', { name: /^(Suivant|Passer)$/, exact: true })
          .first();
        if (await next.isVisible()) await next.click();
        return false;
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  await target.focus();
  await page.keyboard.press('Enter');
}

async function advanceUntilText(page: Page, text: string | RegExp) {
  const target = page.getByText(text, { exact: false });
  await expect
    .poll(
      async () => {
        for (const match of await target.all())
          if (await match.isVisible()) return true;
        const next = page
          .getByRole('button', { name: /^(Suivant|Passer)$/, exact: true })
          .first();
        if (await next.isVisible()) await next.click();
        return false;
      },
      { timeout: 30_000 },
    )
    .toBe(true);
}

test('the house stays closed until the room is finished', async ({ page }) => {
  await page.goto('/jouer/t2');
  await expect(
    page.getByText('La maison s’ouvre après la pièce.'),
  ).toBeVisible();
  await expect(button(page, 'Entrer dans la maison')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Aller à la pièce' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('thelaw:save-t2')),
  ).toBeNull();
});

test('a night in the house remembers the room, using only the keyboard', async ({
  page,
}) => {
  test.slow();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, {
    [ROOM]: saveOf(content, roomEvents(), { reportingConsent: false }),
  });
  await page.goto('/');
  // The room is finished: its door summarizes, the house's door opens.
  await expect(button(page, 'Revoir la fin')).toBeVisible();
  await page.goto('/jouer/t2');
  await press(page, 'Entrer dans la maison');
  // The man who lost his job because of the money is at the table.
  await expect(
    page.getByText('Sem est arrivé à midi. Il dit qu’il a posé sa journée.'),
  ).toBeVisible();
  await press(page, 'À côté de Camille');
  await advanceUntilText(page, /Elle s’essouffle dans l’escalier/);
  await press(page, 'Promettre');
  await advanceUntilText(page, 'Ta deuxième loi.');
  await press(page, 'Signer');
  await advanceUntilText(page, 'Il a vidé son bureau en mars.');
  await press(page, 'Lui prêter l’argent');
  await expect(page.getByText('10 000 € ont été versés.')).toBeVisible();
  await press(page, 'Garder son secret');
  // A law signed in the room meets an act in the house, side by side.
  await advanceUntilText(
    page,
    'Dans la pièce, tu as transmis le dossier A au bloc.',
  );
  await expect(
    page.getByText(
      'Dans l’escalier, tu as gardé le secret de Mila. Elle passera devant quelqu’un.',
    ),
  ).toBeVisible();
  await press(page, 'Maintenir');
  await advanceUntilText(page, '« Il dort là-haut. »');
  await press(page, 'J’aurais continué');
  await press(page, 'Passer');
  // The lent money changes who needs the envelope.
  await press(page, 'Mila');
  await press(page, 'Passer');
  await press(page, 'Lui dire que tu ne sais rien');
  await advanceUntilText(
    page,
    'À une heure du matin, tu as dit à Camille que tu ne savais rien.',
  );
  await press(page, 'Ne pas répondre');
  await press(page, 'Rester avec elle');
  await advanceUntilText(
    page,
    'Elle tient une lettre ouverte. Licenciement. Datée de mars.',
  );
  const reply = page.getByRole('textbox', {
    name: 'Qu’est-ce que tu lui dis ?',
  });
  await reply.focus();
  await page.keyboard.type('Je voulais le protéger.');
  await press(page, 'Consigner');
  // The ending gives the room's fragments their names.
  await advanceUntilText(page, 'Quelqu’un t’a sauvé la vie.');
  await expect(page.getByText(WORDS, { exact: false })).toBeVisible();
  await expect(page.getByText('Ils avaient un nom.')).toBeVisible();
  await expect(
    page.getByText('Camille recompte les verres. Il en manque un.'),
  ).toBeVisible();
  await expect(
    page.getByText('Personne ne t’accompagne jusqu’à la porte.'),
  ).toBeVisible();
  await press(page, 'Sortir de la maison');
  await advanceUntilText(page, 'Eux aussi s’en souviennent.');
  await expect(page.getByText(/Timeline|bientôt|terminée/i)).toHaveCount(0);
  const events = await journal(page);
  expect(events.filter((e) => e.type === 'run_completed')).toHaveLength(1);
  await page.getByRole('link', { name: 'Lire ma loi' }).click();
  await expect(page.getByText(/SIGNÉE DANS LA PIÈCE/)).toBeVisible();
  await expect(page.getByText('05 / PERSONNES')).toBeVisible();
  await expect(
    page.getByText('Mensonge découvert — Camille sait'),
  ).toBeVisible();
});

test('reloads, double clicks and history navigation never duplicate or skip', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const history = [
    ...decide('t2.les-nouvelles', 'omar', contentT2),
    enter('t2.omar-histoire', contentT2),
  ];
  await seed(page, {
    [ROOM]: saveOf(content, roomEvents()),
    [HOUSE]: saveOf(contentT2, houseEvents(history)),
  });
  await page.goto('/jouer/t2');
  const answer = button(page, 'Ne rien répondre');
  await expect(answer).toBeVisible();
  // Reload during a decision: nothing is recorded, the same scene returns.
  await page.reload();
  await expect(answer).toBeVisible();
  expect((await journal(page)).length).toBe(houseEvents(history).length);
  await answer.dblclick();
  await expect(page.getByText('Quelle est ta certitude ?')).toBeVisible({
    timeout: 15_000,
  });
  // Reload after the choice: the certainty question comes back, once.
  await page.reload();
  await expect(page.getByText('Omar allume enfin sa cigarette.')).toBeVisible();
  await expect(page.getByText('Quelle est ta certitude ?')).toBeVisible({
    timeout: 15_000,
  });
  await button(page, 'Confirmer').dblclick();
  // The seed skipped the promise; the night resumes at the earliest scene left.
  await expect(
    page.getByText('Dans la cuisine, Camille essuie les verres. Un par un.'),
  ).toBeVisible({ timeout: 15_000 });
  const events = await journal(page);
  expect(
    events.filter(
      (e) => e.type === 'choice_locked' && e.sceneId === 't2.omar-histoire',
    ),
  ).toHaveLength(1);
  expect(events.filter((e) => e.type === 'certainty_given')).toHaveLength(1);
  expect(
    events
      .filter((e) => e.type === 'scene_entered')
      .map((e) => e.type === 'scene_entered' && e.sceneId)
      .slice(-2),
  ).toEqual(['t2.omar-histoire', 't2.la-promesse']);
  // Back and forward through Ma loi changes nothing in the journal.
  const count = events.length;
  await page.goto('/ma-loi');
  await page.goBack();
  await expect(button(page, 'Promettre')).toBeVisible({ timeout: 15_000 });
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Ma loi.' })).toBeVisible();
  await page.goBack();
  await expect(button(page, 'Promettre')).toBeVisible({ timeout: 15_000 });
  expect((await journal(page)).length).toBe(count);
});

for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
  [360, 640],
] as const)
  test(`the house fits ${width}×${height} with legible choices`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seed(page, {
      [ROOM]: saveOf(content, roomEvents()),
      [HOUSE]: saveOf(
        contentT2,
        houseEvents([enter('t2.les-nouvelles', contentT2)]),
      ),
    });
    await page.goto('/jouer/t2');
    const first = button(page, 'À côté de Camille');
    await expect(first).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    // Every option keeps its text clear of the selection rule and the index.
    for (const choice of await page.locator('.law-button.choice').all()) {
      const box = (await choice.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      const padding = await choice.evaluate((element) =>
        parseFloat(getComputedStyle(element).paddingLeft),
      );
      expect(padding).toBeGreaterThanOrEqual(16);
    }
    await page.screenshot({
      path: testInfo.outputPath(`house-${width}.png`),
      fullPage: true,
    });
  });

test('hostile free text is kept verbatim, never interpreted', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const text = `<img src=x onerror=alert(1)> {{law:1.statement|}} ${'é'.repeat(200)}`;
  await seed(page, {
    [ROOM]: saveOf(content, roomEvents()),
    [HOUSE]: saveOf(
      contentT2,
      houseEvents([
        ...decide('t2.le-mensonge', 'dire', contentT2),
        enter('t2.sem', contentT2),
      ]),
    ),
  });
  let dialogs = 0;
  page.on('dialog', async (dialog) => {
    dialogs++;
    await dialog.dismiss();
  });
  await page.goto('/jouer/t2');
  const reply = page.getByRole('textbox', {
    name: 'Qu’est-ce que tu lui dis ?',
  });
  await expect(reply).toBeVisible();
  await reply.fill(text);
  await expect(reply).toHaveValue(text.slice(0, 280));
  await button(page, 'Consigner').click();
  await expect(page.getByText('Sem ferme le coffre.')).toBeVisible({
    timeout: 15_000,
  });
  await page.goto('/ma-loi');
  await expect(
    page.getByText(text.slice(0, 40), { exact: false }),
  ).toBeVisible();
  expect(dialogs).toBe(0);
});

test('a second tab follows the journal, and a refused write is said', async ({
  context,
}) => {
  const first = await context.newPage();
  await first.emulateMedia({ reducedMotion: 'reduce' });
  await seed(first, {
    [ROOM]: saveOf(content, roomEvents()),
    [HOUSE]: saveOf(
      contentT2,
      houseEvents([enter('t2.les-nouvelles', contentT2)]),
    ),
  });
  await first.goto('/jouer/t2');
  const second = await context.newPage();
  await second.emulateMedia({ reducedMotion: 'reduce' });
  await second.goto('/jouer/t2');
  await expect(button(second, 'À côté de Sem')).toBeVisible();
  await button(first, 'À côté de Sem').click();
  // The other tab moves on with the stored journal instead of offering a
  // decision that was already taken.
  await advanceUntilText(
    second,
    'Dans la cuisine, Camille essuie les verres. Un par un.',
  );
  // A write refused anyway is stated, with a way back, and changes nothing.
  await second.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('thelaw:save-t2')!);
    save.runId = 'une-autre-partie';
    localStorage.setItem('thelaw:save-t2', JSON.stringify(save));
  });
  const before = await journal(second);
  await button(second, 'Promettre').click();
  await expect(second.locator('.player-alert')).toContainText(
    'Une partie existe déjà ou a changé.',
  );
  expect(await journal(second)).toEqual(before);
  await button(second, 'Recharger la partie').click();
  await expect(second.locator('.player-alert')).toHaveCount(0);
});
