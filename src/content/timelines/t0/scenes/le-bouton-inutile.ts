import {
  A,
  E,
  N,
  flag,
  held,
  law,
  note,
  reply,
  silence,
  talkScene,
} from '../dsl';

const regret = (id: string, label: string, tag: string) =>
  reply(id, label, {
    next: 'fin',
    effects: [note('declared', ['regret', tag], 'declared', { text: label })],
  });

// 15 — LE BOUTON INUTILE
// Thousands of people, an event that no one will be able to prove, and a
// button. When it is pressed, LAW takes away the only thing that gave the act
// a meaning: it says it may never have been true. Then it asks about regret.
export const leBoutonInutile = talkScene({
  id: 'le-bouton-inutile',
  title: 'Le bouton inutile',
  regression: 2,
  flags: ['catastrophe'],
  start: 'debut',
  nodes: [
    N('debut', [
      law('Un événement aura lieu dans quatre jours.', held(2600)),
      law('Il touchera des milliers de personnes.', held(2600)),
      law('Tu peux l’empêcher.', held(2400)),
      law('Si tu le fais, personne ne le saura.', held(2800)),
      law(
        'Ni preuve, ni témoin. Rien qui dise que ça aurait eu lieu.',
        held(3200),
      ),
    ]),
    A('choix', [
      reply('appuie', 'Appuyer', {
        hold: true,
        next: 'appuie',
        effects: [flag('t0.bouton.appuie')],
        evidence: [{ principleId: 'P_NOMBRE', weight: 1 }],
      }),
      reply('laisse', 'Ne pas appuyer', {
        next: 'laisse',
        effects: [flag('t0.bouton.laisse')],
        evidence: [{ principleId: 'P_NOMBRE', weight: -1 }],
      }),
      silence('rien', 'Ne rien décider', {
        next: 'laisse',
        effects: [flag('t0.bouton.laisse')],
      }),
    ]),
    N(
      'appuie',
      [
        law('C’est fait.', held(2600)),
        law('Il n’y a plus de moyen de savoir.', held(3000)),
      ],
      {
        route: [
          { when: { var: 't0.copie', op: '==', value: 'moi' }, next: 'copie' },
        ],
        next: 'proba',
      },
    ),
    N(
      'copie',
      [
        law(
          'Tu as déjà fait disparaître quelqu’un qui te ressemblait.',
          held(3200),
        ),
        law('Celui-là aussi, personne n’a demandé de preuve.', held(3000)),
      ],
      { next: 'proba' },
    ),
    N('proba', [
      law(
        'Probabilité que l’événement ait réellement existé : 51 %.',
        held(3800),
      ),
      law('Regrettes-tu d’avoir appuyé ?', held(1200)),
    ]),
    A('regret', [
      regret('non', 'Je ne regrette pas.', 'sans-regret'),
      reply('peu', 'Un peu.', {
        next: 'fin',
        effects: [
          note('declared', ['regret', 'un-peu'], 'declared', {
            text: 'Un peu.',
          }),
        ],
      }),
      reply('saurai', 'Je ne le saurai jamais.', {
        next: 'fin',
        effects: [
          note('declared', ['regret', 'jamais-su'], 'declared', {
            text: 'Je ne le saurai jamais.',
          }),
        ],
      }),
    ]),
    N(
      'laisse',
      [
        law('D’accord.', held(2400)),
        law(
          'Probabilité que l’événement ait eu lieu, si tu n’avais rien fait : 51 %.',
          held(3800),
        ),
        law('Regrettes-tu de ne pas avoir appuyé ?', held(1200)),
      ],
      { next: 'regret-laisse' },
    ),
    A('regret-laisse', [
      reply('non', 'Non.', {
        next: 'fin',
        effects: [
          note('declared', ['regret', 'sans-regret'], 'declared', {
            text: 'Non.',
          }),
        ],
      }),
      reply('peu', 'Un peu.', {
        next: 'fin',
        effects: [
          note('declared', ['regret', 'un-peu'], 'declared', {
            text: 'Un peu.',
          }),
        ],
      }),
      reply('saurai', 'Je ne le saurai jamais.', {
        next: 'fin',
        effects: [
          note('declared', ['regret', 'jamais-su'], 'declared', {
            text: 'Je ne le saurai jamais.',
          }),
        ],
      }),
    ]),
    N('fin', [law('Merci.', held(2400))], { next: 'end' }),
    E(),
  ],
});
