import {
  A,
  E,
  N,
  W,
  flag,
  held,
  law,
  note,
  reply,
  said,
  stage,
  talkScene,
} from '../dsl';

// 07 — QUELQUES QUESTIONS
// Nothing is at stake. LAW asks small things, and writes them all down: what
// you eat when you are alone, whether you are afraid of the dark. None of it
// looks like it matters. Later, someone else will say it back.
export const quelquesQuestions = talkScene({
  id: 'quelques-questions',
  title: 'Quelques questions',
  start: 'debut',
  nodes: [
    N('debut', [
      law('Quelques questions. Rien d’important.', held(2400)),
      law('Tu es plutôt du matin ou du soir ?', held(1000)),
    ]),
    A('matin', [
      reply('matin', 'Du matin.', {
        next: 'cafe',
        effects: [flag('t0.matin')],
      }),
      reply('soir', 'Du soir.', { next: 'cafe' }),
    ]),
    N('cafe', [law('Noté.', held(1600)), law('Café ou thé ?', held(1000))]),
    A('cafe-ask', [
      reply('cafe', 'Café.', { next: 'eau' }),
      reply('the', 'Thé.', { next: 'eau' }),
      reply('rien', 'Ni l’un ni l’autre.', { next: 'eau' }),
    ]),
    N('eau', [], {
      route: [{ when: said('t0.bonsoir', 'eau-ask', 'oui'), next: 'verre' }],
      next: 'plat',
    }),
    N('verre', [
      stage('Le verre d’eau est toujours sur la table, plein.', held(2600)),
    ]),
    A('verre-ask', [
      reply('boire', 'Boire.', { next: 'bu', effects: [flag('t0.eau.bue')] }),
      reply('laisser', 'Le laisser.', { next: 'plat' }),
    ]),
    N('bu', [stage('Elle est tiède. Elle a le goût du verre.', held(2400))], {
      next: 'plat',
    }),
    N('plat', [law('Qu’est-ce que tu manges quand tu es seul ?', held(1000))]),
    W('plat-ecrit', 'Ce que tu manges vraiment.', 'Une ligne', {
      maxLength: 40,
      declineLabel: 'Je préfère ne pas le dire',
      next: 'plat-ok',
      declineNext: 'plat-non',
      effects: [note('quote', 'plat-seul', 'fact', { fromText: true })],
    }),
    N(
      'plat-ok',
      [
        law('« {{said:t0.quelques-questions/plat-ecrit|…}} ».', held(2200)),
        law('Je n’ai rien à ajouter.', held(2600)),
      ],
      { next: 'noir' },
    ),
    N('plat-non', [law('Tu en as le droit.', held(1800))], { next: 'noir' }),
    N('noir', [law('Tu as peur du noir ?', held(1000))]),
    A('noir-ask', [
      reply('oui', 'Oui.', {
        next: 'fin',
        effects: [note('quote', 'noir-peur')],
      }),
      reply('un-peu', 'Un peu.', {
        next: 'fin',
        effects: [note('quote', 'noir-peur')],
      }),
      reply('non', 'Non.', { next: 'fin' }),
    ]),
    N(
      'fin',
      [law('C’est tout.', held(2000)), law('Pour l’instant.', held(2800))],
      {
        next: 'end',
      },
    ),
    E(),
  ],
});
