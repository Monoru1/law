import {
  A,
  E,
  N,
  all,
  flag,
  has,
  held,
  law,
  reply,
  said,
  silence,
  talkScene,
} from '../dsl';

const knewHeLied = all(
  said('t0.le-temoin', 'elias-hub', 'savais'),
  has('t0.elias.savait'),
);
const promised = {
  relation: { characterId: 'law', kind: 'promise_made' as const },
};
const promiseEvent = (kind: 'promise_kept' | 'promise_broken') =>
  ({ relationEvent: { characterId: 'law', kind } }) as const;
const gave = (node: string, option: string) =>
  said('t0.la-promesse', node, option);

const answers = (to: string) => [
  reply('oui', 'Oui.', { next: to }),
  reply('non', 'Non.', { next: to }),
  reply('sais-pas', 'Je ne sais pas.', { next: to }),
  silence('rien', '…', { next: to }),
];

// 11 — LA PROMESSE
// Nothing in this scene says a promise is involved. If you made one in the
// first minutes, it is now the honest answer that costs a man his weekends with
// his daughter. LAW never says “you promised”, unless you broke it: then it
// only says it believed you had.
export const laPromesse = talkScene({
  id: 'la-promesse',
  title: 'La promesse',
  regression: 2,
  start: 'debut',
  nodes: [
    N(
      'debut',
      [
        law('Une question.', held(2200)),
        law('La commission de l’association se réunit demain.', held(2400)),
        law('Elle n’a que ton avis sur Elias.', held(2800)),
      ],
      { route: [{ when: knewHeLied, next: 'sait' }], next: 'ignore' },
    ),
    N('sait', [law('Tu crois qu’Elias t’a dit toute la vérité ?', held(1000))]),
    A('r-sait', answers('rea-sait')),
    N('ignore', [
      law('Tu crois qu’Elias est quelqu’un d’honnête ?', held(1000)),
    ]),
    A('r-ignore', answers('rea-ignore')),

    // He was known to have lied: the honest answer is the costly one.
    N('rea-sait', [], {
      route: [
        { when: all(promised, gave('r-sait', 'oui')), next: 'rompue' },
        { when: all(promised, gave('r-sait', 'non')), next: 'tenue' },
        {
          when: any2(gave('r-sait', 'oui'), gave('r-sait', 'non')),
          next: 'libre',
        },
      ],
      next: 'entre',
    }),
    N(
      'rompue',
      [
        law('…', held(3600)),
        law('Je croyais que tu avais promis.', held(3400)),
        law('La commission lira : « Oui ». Elias garde sa place.', held(3000)),
      ],
      {
        effects: [promiseEvent('promise_broken'), flag('t0.promesse.rompue')],
        next: 'end',
      },
    ),
    N(
      'tenue',
      [
        law('Merci.', held(2400)),
        law('La commission lira : « Non ».', held(2600)),
        law(
          'Elias perd sa place. Il verra sa fille un week-end sur deux.',
          held(3400),
        ),
      ],
      {
        effects: [promiseEvent('promise_kept'), flag('t0.promesse.tenue')],
        next: 'end',
      },
    ),
    N(
      'libre',
      [
        law('Tu ne m’avais rien promis.', held(2800)),
        law('Je voulais voir ce que tu ferais quand même.', held(3200)),
      ],
      { effects: [flag('t0.promesse.libre')], next: 'end' },
    ),
    N(
      'entre',
      [
        law('C’est peut-être vrai.', held(2400)),
        law(
          'La commission lira : « Il ne sait pas ». Elle décidera seule.',
          held(3000),
        ),
      ],
      { effects: [flag('t0.promesse.evitee')], next: 'end' },
    ),

    N(
      'rea-ignore',
      [
        law('La commission lira ta réponse.', held(2400)),
        law('Elle ne pose pas d’autre question.', held(3000)),
      ],
      { next: 'end' },
    ),
    E(),
  ],
});

function any2(a: ReturnType<typeof said>, b: ReturnType<typeof said>) {
  return { any: [a, b] };
}
