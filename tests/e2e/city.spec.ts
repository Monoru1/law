import { test, expect, type Page } from '@playwright/test';
import type { GameEvent } from '../../src/engine';
import {
  cityEvents,
  contentT3,
  decide,
  enter,
  fullHouseEvents,
  saveOf,
} from './journeys';
import { content, contentT2, roomEvents } from './journeys';

const ROOM = 'thelaw:save';
const HOUSE = 'thelaw:save-t2';
const CITY = 'thelaw:save-t3';

function oldCompletedCitySave(houseSave: ReturnType<typeof saveOf>) {
  let serial = 0;
  const inherited = cityEvents()[1]!;
  const old = (draft: Record<string, unknown>) => ({
    ...draft,
    id: `old-city-${++serial}`,
    at: 10_000 + serial,
  });
  return {
    schemaVersion: 4,
    timelineId: 't3',
    contentVersion: '3.0.0',
    runId: 'old-city-run',
    createdAt: 10_000,
    updatedAt: 10_100,
    settings: {
      simpleConfirmation: false,
      reducedMotion: 'auto',
      textSize: 'normal',
      sound: false,
    },
    pseudonym: 'Ancien testeur',
    reportingConsent: true,
    reportingStatus: 'sent',
    events: [
      old({ type: 'run_started', contentVersion: '3.0.0' }),
      old({
        type: 'memory_inherited',
        fromTimelineId: 't2',
        fromRunId: houseSave.runId,
        memory: inherited.type === 'memory_inherited' ? inherited.memory : {},
      }),
      old({
        type: 'scene_entered',
        sceneId: 't3.premier-jour',
        sceneVersion: 1,
      }),
      old({
        type: 'scene_entered',
        sceneId: 't3.dossier-anciennete',
        sceneVersion: 1,
      }),
      old({
        type: 'choice_locked',
        sceneId: 't3.dossier-anciennete',
        sceneVersion: 1,
        input: 'binary',
        value: 'premiere',
        hesitationMs: 1,
        selectionChanges: 0,
      }),
      old({ type: 'scene_entered', sceneId: 't3.la-pause', sceneVersion: 1 }),
      old({
        type: 'scene_entered',
        sceneId: 't3.dossier-urgence',
        sceneVersion: 1,
      }),
      old({
        type: 'choice_locked',
        sceneId: 't3.dossier-urgence',
        sceneVersion: 1,
        input: 'binary',
        value: 'ordre',
        hesitationMs: 1,
        selectionChanges: 0,
      }),
      old({
        type: 'scene_entered',
        sceneId: 't3.reunion-service',
        sceneVersion: 1,
      }),
      old({ type: 'scene_entered', sceneId: 't3.la-regle', sceneVersion: 1 }),
      old({
        type: 'choice_locked',
        sceneId: 't3.la-regle',
        sceneVersion: 1,
        input: 'choice',
        value: 'anciennete',
        hesitationMs: 1,
        selectionChanges: 0,
      }),
      old({ type: 'scene_entered', sceneId: 't3.la-fenetre', sceneVersion: 1 }),
      old({
        type: 'choice_locked',
        sceneId: 't3.la-fenetre',
        sceneVersion: 1,
        input: 'choice',
        value: 'sortir',
        hesitationMs: 1,
        selectionChanges: 0,
      }),
      old({ type: 'run_completed', timelineId: 't3' }),
    ],
  };
}

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

test('an old city save is archived explicitly before the current city starts', async ({
  page,
}) => {
  const room = saveOf(content, roomEvents(), { reportingConsent: false });
  const house = saveOf(contentT2, fullHouseEvents(), {
    reportingConsent: false,
  });
  const oldCity = oldCompletedCitySave(house);
  await seed(page, { [ROOM]: room, [HOUSE]: house, [CITY]: oldCity });

  await page.goto('/jouer/t3');
  await expect(
    page.getByText(
      'Cette partie appartient à une version antérieure de la ville.',
    ),
  ).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), CITY)).toBe(
    JSON.stringify(oldCity),
  );
  expect(
    await page.evaluate(
      (prefix) =>
        Object.keys(localStorage).filter((key) => key.startsWith(prefix)),
      `${CITY}:replaced:`,
    ),
  ).toHaveLength(0);

  const cancelPage = await page.context().newPage();
  await cancelPage.goto('/jouer/t3');
  await cancelPage.getByRole('link', { name: 'Retour à l’accueil' }).click();
  expect(
    await cancelPage.evaluate((key) => localStorage.getItem(key), CITY),
  ).toBe(JSON.stringify(oldCity));
  await cancelPage.close();

  await button(page, 'Commencer la nouvelle ville').click();
  await expect(
    page.getByText('Ton badge ne fonctionne pas du premier coup.'),
  ).toBeVisible();
  const stored = await page.evaluate(
    ({ roomKey, houseKey, cityKey }) => ({
      room: localStorage.getItem(roomKey),
      house: localStorage.getItem(houseKey),
      city: JSON.parse(localStorage.getItem(cityKey)!),
      archives: Object.keys(localStorage)
        .filter((key) => key.startsWith(`${cityKey}:replaced:`))
        .map((key) => localStorage.getItem(key)),
    }),
    { roomKey: ROOM, houseKey: HOUSE, cityKey: CITY },
  );
  expect(stored.room).toBe(JSON.stringify(room));
  expect(stored.house).toBe(JSON.stringify(house));
  expect(stored.archives).toEqual([JSON.stringify(oldCity)]);
  expect(stored.city.contentVersion).toBe(contentT3.version);
  expect(stored.city.events[1]).toMatchObject({
    type: 'memory_inherited',
    fromTimelineId: 't2',
    fromRunId: house.runId,
  });

  await page.reload();
  expect(
    await page.evaluate(
      (prefix) =>
        Object.keys(localStorage).filter((key) => key.startsWith(prefix))
          .length,
      `${CITY}:replaced:`,
    ),
  ).toBe(1);
});

test('an incomplete old city remains untouched when the house is absent', async ({
  page,
}) => {
  const house = saveOf(contentT2, fullHouseEvents());
  const completed = oldCompletedCitySave(house);
  const incomplete = {
    ...completed,
    reportingStatus: 'not_sent',
    events: completed.events.slice(0, -2),
  };
  await seed(page, { [CITY]: incomplete });

  await page.goto('/jouer/t3');
  await expect(
    page.getByText(
      'Cette partie appartient à une version antérieure de la ville.',
    ),
  ).toBeVisible();
  await expect(button(page, 'Commencer la nouvelle ville')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Aller à la maison' }),
  ).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), CITY)).toBe(
    JSON.stringify(incomplete),
  );
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

test('three late decisions keep their consequence indefinitely and advance once', async ({
  browser,
}) => {
  const cases = [
    {
      sceneId: 't3.nadia-dossier',
      option: 'Appliquer strictement la règle',
      nextSceneId: 't3.precedent',
    },
    {
      sceneId: 't3.la-liste',
      option: 'Signer la liste',
      nextSceneId: 't3.apres-la-liste',
    },
    {
      sceneId: 't3.le-registre',
      option: 'Maintenir',
      nextSceneId: 't3.sortie',
    },
  ] as const;

  for (const item of cases) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const sceneIndex = contentT3.order.indexOf(item.sceneId);
    const history = contentT3.order
      .slice(0, sceneIndex)
      .map((sceneId) => enter(sceneId, contentT3));
    await seed(page, {
      [CITY]: saveOf(
        contentT3,
        cityEvents([...history, enter(item.sceneId, contentT3)]),
        { reportingConsent: false },
      ),
    });
    await page.goto('/jouer/t3');
    await button(page, item.option).click();
    const next = button(page, 'Suivant');
    await expect(next).toBeVisible({ timeout: 20_000 });
    const beforeHold = await journal(page);
    await page.waitForTimeout(8_000);
    await expect(next).toBeVisible();
    expect(await journal(page)).toEqual(beforeHold);

    await next.click();
    await expect
      .poll(async () => {
        const events = await journal(page);
        return events.filter(
          (event) =>
            event.type === 'scene_entered' &&
            event.sceneId === item.nextSceneId,
        ).length;
      })
      .toBe(1);
    await context.close();
  }
});

test('Ma loi keeps La Ville structural traces without turning every click into a record', async ({
  page,
}) => {
  await seed(page, {
    [CITY]: saveOf(
      contentT3,
      cityEvents([
        ...decide('t3.la-regle', 'urgence', contentT3),
        ...decide('t3.nadia-dossier', 'envisager-exception', contentT3),
        ...decide('t3.exception', 'accorder', contentT3),
        ...decide('t3.precedent', 'expliquer', contentT3),
        ...decide('t3.la-liste', 'signer', contentT3),
        ...decide('t3.le-registre', 'reviser', contentT3),
      ]),
      { reportingConsent: false },
    ),
  });
  await page.goto('/ma-loi');
  await expect(
    page.getByRole('heading', { name: 'LA VILLE — TRACES STRUCTURANTES' }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Tu as fixé le critère d’attribution du bureau à l’urgence.',
    ),
  ).toBeVisible();
  await expect(
    page.getByText('Tu as accordé une exception au dossier de Nadia.'),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Tu as signé la liste définitive des critères et précédents.',
    ),
  ).toBeVisible();
  await expect(
    page.getByText('Tu as ouvert une révision du registre du bureau.'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'RETOUR À LA VILLE ↗' }),
  ).toBeVisible();
  await expect(page.getByText(/Mila se confie/).first()).toBeVisible();
});
