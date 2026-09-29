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

const cited = { noted: { tag: 'innocent-why' } } as const;

// 14 — LE SACRIFICE INVISIBLE
// Four years of work against a colleague’s, and only one will be funded. If you
// step aside, nobody will ever know you would have won. Before the choice LAW
// reads back what you wrote, an hour ago, in another room. It does not say why.
export const leSacrificeInvisible = talkScene({
  id: 'le-sacrifice-invisible',
  title: 'Le sacrifice invisible',
  regression: 1,
  start: 'debut',
  nodes: [
    N(
      'debut',
      [
        law('Tu as un projet.', held(2200)),
        law('Quatre ans de travail. C’est le tien.', held(2400)),
        law('Mathis a le même. Le sien est moins bon.', held(2600)),
        law('Un seul des deux sera financé.', held(2600)),
      ],
      { route: [{ when: cited, next: 'cite' }], next: 'regle' },
    ),
    N('cite', [
      law('Tout à l’heure, tu m’as dit :', held(2200)),
      law('« {{note:innocent-why|…}} »', held(3000)),
      law('Est-ce toujours vrai ?', held(1200)),
    ]),
    A('cite-ask', [
      reply('oui', 'Oui.', { next: 'regle' }),
      reply('rien', 'Ça n’a rien à voir.', {
        next: 'r-rien',
        effects: [note('reversal', 'citation-projet')],
      }),
      silence('silence', '…', { next: 'r-silence' }),
    ]),
    N('r-rien', [law('Peut-être.', held(2600))], { next: 'regle' }),
    N('r-silence', [law('D’accord.', held(2200))], { next: 'regle' }),
    N('regle', [
      law(
        'Si tu te retires, personne ne saura que tu aurais gagné.',
        held(3200),
      ),
    ]),
    A('choix', [
      reply('retire', 'Me retirer, sans rien dire', {
        hold: true,
        next: 'retire',
        effects: [flag('t0.projet.retire')],
        evidence: [{ principleId: 'P_SACRIFICE_SOI', weight: 1 }],
      }),
      reply('credit', 'Me retirer, mais que ça se sache', {
        next: 'credit',
        effects: [flag('t0.projet.credit')],
      }),
      reply('garde', 'Garder ma place', {
        next: 'garde',
        effects: [flag('t0.projet.garde')],
        evidence: [{ principleId: 'P_SACRIFICE_SOI', weight: -0.5 }],
      }),
    ]),
    N('retire', [law('D’accord.', held(3000))], { next: 'end' }),
    N('garde', [law('D’accord.', held(3000))], { next: 'end' }),
    N('credit', [law('Alors ce n’était pas invisible.', held(3200))]),
    A('credit-ask', [
      reply('non', 'Non.', { next: 'fin-credit' }),
      reply('compter', 'Ça aurait dû compter.', { next: 'fin-credit' }),
      reply('vrai', 'C’est vrai.', { next: 'fin-credit' }),
    ]),
    N(
      'fin-credit',
      [
        law('Je ne juge pas.', held(2600)),
        law('Je note la différence.', held(3200)),
      ],
      { next: 'end' },
    ),
    E(),
  ],
});
