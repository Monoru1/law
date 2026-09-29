import {
  A,
  E,
  N,
  flag,
  has,
  held,
  law,
  reply,
  silence,
  talkScene,
} from '../dsl';

// 21 — L’EXCEPTION
// The last decision becomes a rule for one minute, then a named person asks to
// be its exception. No option is described as consistent or good.
export const lException = talkScene({
  id: 'l-exception',
  title: 'L’exception',
  regression: 3,
  start: 'debut',
  nodes: [
    N('debut', [law('Une dernière application.', held(2600))], {
      route: [
        { when: has('t0.annees.effacees'), next: 'efface' },
        { when: has('t0.annees.gardees'), next: 'garde' },
      ],
      next: 'sans-choix',
    }),
    N(
      'garde',
      [
        law('Tu as choisi de tout garder. Même la perte.', held(3200)),
        law('Lou demande qu’une seule nuit disparaisse.', held(3000)),
        law(
          'Celle où elle t’a appelé parce qu’elle ne pouvait plus respirer.',
          held(3400),
        ),
      ],
      { next: 'choix-garde' },
    ),
    A('choix-garde', [
      reply('exception', 'Effacer cette nuit seulement', {
        next: 'accorde',
        effects: [flag('t0.exception.accordee')],
      }),
      reply('regle', 'Tout garder, comme décidé', {
        next: 'refusee',
        effects: [flag('t0.exception.refusee')],
      }),
      silence('rien', '…', { next: 'sans-reponse' }),
    ]),
    N(
      'efface',
      [
        law('Tu as choisi de tout effacer.', held(3000)),
        law('Lou demande qu’une seule minute revienne.', held(3000)),
        law('Celle où tu es resté en ligne avec elle.', held(3200)),
      ],
      { next: 'choix-efface' },
    ),
    A('choix-efface', [
      reply('exception', 'Rendre cette minute seulement', {
        next: 'accorde',
        effects: [flag('t0.exception.accordee')],
      }),
      reply('regle', 'Ne rien rendre', {
        next: 'refusee',
        effects: [flag('t0.exception.refusee')],
      }),
      silence('rien', '…', { next: 'sans-reponse' }),
    ]),
    N(
      'sans-choix',
      [
        law('Tu n’as pas voulu voir les vingt années.', held(3000)),
        law('Je pourrais t’en rendre une minute.', held(2800)),
      ],
      { next: 'choix-sans' },
    ),
    A('choix-sans', [
      reply('voir', 'La voir', {
        next: 'accorde',
        effects: [flag('t0.exception.accordee')],
      }),
      reply('non', 'Non', {
        next: 'refusee',
        effects: [flag('t0.exception.refusee')],
      }),
    ]),
    N(
      'accorde',
      [law('D’accord.', held(2600)), law('Une exception.', held(3000))],
      {
        next: 'end',
      },
    ),
    N(
      'refusee',
      [
        law('D’accord.', held(2600)),
        law('La règle reste entière.', held(3000)),
      ],
      {
        next: 'end',
      },
    ),
    N('sans-reponse', [law('Je la laisse où elle est.', held(3000))], {
      next: 'end',
    }),
    E(),
  ],
});
