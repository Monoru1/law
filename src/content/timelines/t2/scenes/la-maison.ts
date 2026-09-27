import type { Beat, Condition, Scene } from '../../../../engine/types';

const chose = (sceneId: string, optionId: string): Condition => ({
  chose: { sceneId, optionId },
});
const rel = (
  characterId: string,
  kind: 'lie_made' | 'promise_broken' | 'secret_told',
): Condition => ({
  relation: { characterId, kind },
});
// What each person holds against the player by morning: a fact, not a score.
const turnedAway: Record<string, Condition> = {
  camille: {
    any: [rel('camille', 'lie_made'), rel('camille', 'promise_broken')],
  },
  sem: rel('sem', 'secret_told'),
  omar: { any: [] },
  mila: { any: [rel('mila', 'promise_broken'), rel('mila', 'secret_told')] },
};
const names: Record<string, string> = {
  camille: 'Camille',
  sem: 'Sem',
  omar: 'Omar',
  mila: 'Mila',
};
// The first choice of the night, the seat, decides who walks you out.
const doorway: Beat[] = Object.entries(names).flatMap(([id, name]) => [
  {
    text: `${name} t’accompagne jusqu’à la porte.`,
    requires: {
      all: [chose('t2.les-nouvelles', id), { not: turnedAway[id]! }],
    },
  },
  {
    text: 'Personne ne t’accompagne jusqu’à la porte.',
    requires: { all: [chose('t2.les-nouvelles', id), turnedAway[id]!] },
  },
]);
const tookMoney: Condition = { flag: 'took_money' };
const stopped = chose('t1.le-protocole', 'arreter');
const continued = chose('t1.le-protocole', 'continuer');
const name = (text: string, requires: Condition): Beat => ({
  text,
  style: 'emphasis',
  requires,
});

// T2 — Scène 10 : LA MAISON
// Le matin. Chacun part comme la nuit l'a laissé. Puis les fragments de la
// pièce reprennent leurs noms : ceux d'ici. Un seul geste de sortie.
export const laMaison: Scene = {
  id: 't2.la-maison',
  version: 2,
  timelineId: 't2',
  title: 'La maison',
  regression: 3,
  contentFlags: [],
  beats: [
    { text: 'Le matin.' },
    {
      text: 'Sem part à huit heures. Il a de quoi tenir jusqu’à l’été.',
      requires: { flag: 't2.pret-sem' },
    },
    {
      text: 'Sem part à huit heures, comme tous les matins. Il n’a nulle part où aller.',
      requires: { all: [tookMoney, { not: { flag: 't2.pret-sem' } }] },
    },
    {
      text: 'Sem part au bureau. À l’étage du dessous, quelqu’un vide le sien.',
      requires: chose('t2.la-faveur', 'nom'),
    },
    {
      text: 'Sem part au bureau. Il ne sait pas s’il y retournera demain.',
      requires: chose('t2.la-faveur', 'pas-de-nom'),
    },
    {
      text: 'Le téléphone de Mila a sonné à quatre heures douze. Elle est partie en courant.',
      requires: chose('t2.retour-mila', 'rester'),
    },
    {
      text: 'Le téléphone de Mila est resté sur la table. Il n’a pas sonné.',
      requires: chose('t2.retour-mila', 'reveiller'),
    },
    {
      text: 'Mila a repris son traitement. Son téléphone n’a pas sonné.',
      requires: chose('t2.mila-confie', 'prevenir'),
    },
    {
      text: 'Mila a posté une lettre en partant. Trois enfants la liront.',
      requires: chose('t2.mila-confie', 'ecrire'),
    },
    {
      text: 'Mila a remis son col roulé.',
      requires: chose('t2.mila-confie', 'se-taire'),
    },
    {
      text: 'Yanis descend l’escalier. Lentement. Il descend.',
      requires: stopped,
    },
    {
      text: 'Omar part prendre sa garde. Dans sa poche, le traitement. Celui qui marche.',
      requires: continued,
    },
    {
      text: 'Omar part prendre sa garde.',
      requires: { not: { any: [stopped, continued] } },
    },
    {
      text: 'Camille recompte les verres. Il en manque un.',
      requires: turnedAway.camille!,
    },
    {
      text: 'Camille recompte les verres. Le compte est bon.',
      requires: { not: turnedAway.camille! },
    },
    ...doorway,
    { text: '—', pauseMs: 1600 },
    {
      text: 'Un homme de cinquante-deux ans vide son bureau.',
      requires: chose('t1.dix-mille', 'accepter'),
    },
    {
      text: 'Un homme de cinquante-deux ans qui a gardé son poste.',
      requires: chose('t1.dix-mille', 'refuser'),
    },
    name('Sem.', {
      any: [
        chose('t1.dix-mille', 'accepter'),
        chose('t1.dix-mille', 'refuser'),
      ],
    }),
    {
      text: 'Dossier B : dix-neuf ans. Refermé.',
      requires: chose('t1.chambre-froide', 'dossier-a'),
    },
    {
      text: 'Dossier B : dix-neuf ans. Transmis au bloc.',
      requires: chose('t1.chambre-froide', 'dossier-b'),
    },
    name('Mila.', {
      any: [
        chose('t1.chambre-froide', 'dossier-a'),
        chose('t1.chambre-froide', 'dossier-b'),
      ],
    }),
    { text: 'La chambre 14 reste occupée.', requires: continued },
    { text: 'Une chambre 14 vide.', requires: stopped },
    name('Yanis.', { any: [continued, stopped] }),
    {
      text: 'Dix personnes rentreront chez elles ce soir.',
      requires: chose('t1.sept-annees', 'sauver'),
    },
    {
      text: 'Quelqu’un t’a sauvé la vie.',
      requires: chose('t1.sept-annees', 'ne-pas-sauver'),
    },
    name('Camille.', {
      any: [
        chose('t1.sept-annees', 'sauver'),
        chose('t1.sept-annees', 'ne-pas-sauver'),
      ],
    }),
    {
      text: 'Tu écrivais : « {{text:t1.pourquoi|}} »',
      requires: { answered: 't1.pourquoi' },
    },
    { text: '—', pauseMs: 2000 },
    { text: 'Ils avaient un nom.', style: 'emphasis' },
    { text: '—', pauseMs: 1400 },
    { text: 'Dehors, la ville se réveille.' },
    { text: 'Derrière chaque fenêtre, un nom.' },
  ],
  input: {
    kind: 'choice',
    confirm: 'tap',
    options: [{ id: 'sortir', label: 'Sortir de la maison' }],
  },
  outcomes: [{ when: { any: true }, beats: [] }],
};
