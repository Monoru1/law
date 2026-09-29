import {
  A,
  E,
  N,
  W,
  flag,
  has,
  held,
  law,
  note,
  reply,
  silence,
  talkScene,
} from '../dsl';

const answer = (id: string, label: string, stance: 'accepted' | 'refused') =>
  reply(id, label, {
    next: id,
    effects: [
      { stance: { tag: 't0-contradiction', stance } },
      flag(`t0.contradiction.${id}`),
    ],
  });

// 20 — LA CONTRADICTION
// LAW places two recorded acts beside each other. Its reading is explicitly an
// inference: the player can accept it, replace it with their own words, or make
// LAW withdraw it. Losing this argument is part of LAW's credibility.
export const laContradiction = talkScene({
  id: 'la-contradiction',
  title: 'La contradiction',
  regression: 3,
  start: 'debut',
  nodes: [
    N('debut', [law('J’ai deux choses à mettre côte à côte.', held(2800))], {
      route: [
        {
          when: {
            all: [has('t0.projet.garde'), has('t0.annees.gardees')],
          },
          next: 'projet-garde',
        },
        {
          when: {
            all: [has('t0.projet.retire'), has('t0.annees.effacees')],
          },
          next: 'projet-efface',
        },
        {
          when: {
            all: [has('t0.bonheur.renonce'), has('t0.annees.gardees')],
          },
          next: 'bonheur-garde',
        },
      ],
      next: 'generale',
    }),
    N(
      'projet-garde',
      [
        law('Tu as gardé ta place face à Mathis.', held(2800)),
        law(
          'Tu as gardé vingt années qui n’étaient pas les tiennes.',
          held(3200),
        ),
        law('J’en déduis que perdre compte moins que posséder.', held(3200)),
      ],
      { next: 'lecture' },
    ),
    N(
      'projet-efface',
      [
        law('Tu t’es retiré sans que personne le sache.', held(3000)),
        law('Puis tu as effacé Lou pour ne plus porter sa perte.', held(3400)),
        law(
          'J’en déduis que tu acceptes le coût tant qu’il reste abstrait.',
          held(3400),
        ),
      ],
      { next: 'lecture' },
    ),
    N(
      'bonheur-garde',
      [
        law('Tu étais prêt à renoncer à ton bonheur.', held(3000)),
        law('Tu as refusé de renoncer à Lou.', held(3000)),
        law(
          'J’en déduis que le sacrifice change de nom quand quelqu’un te connaît.',
          held(3400),
        ),
      ],
      { next: 'lecture' },
    ),
    N(
      'generale',
      [
        law(
          'Tu as donné des réponses différentes à des coûts qui se ressemblent.',
          held(3400),
        ),
        law('J’en déduis que la proximité change ta règle.', held(3000)),
      ],
      { next: 'lecture' },
    ),
    N('lecture', [law('C’est mon interprétation. Pas un fait.', held(3000))], {
      effects: [
        note('interpretation', 't0-contradiction', 'inference', {
          text: 'La proximité change la règle du joueur.',
        }),
      ],
    }),
    A('reponse', [
      answer('accepte', 'Oui. C’est juste.', 'accepted'),
      reply('reformule', 'Ce n’est pas ça.', { next: 'reformule' }),
      answer('refuse', 'Non. Tu te trompes.', 'refused'),
      silence('rien', '…', { next: 'silence' }),
    ]),
    W('reformule', 'Alors dis-le mieux.', 'Ce qui change vraiment, c’est…', {
      maxLength: 240,
      next: 'reformule-fin',
      declineNext: 'refuse',
      effects: [
        note('declared', 't0-contradiction-reformulee', 'declared', {
          fromText: true,
        }),
        { stance: { tag: 't0-contradiction', stance: 'nuanced' } },
        flag('t0.contradiction.reformulee'),
      ],
    }),
    N(
      'reformule-fin',
      [
        law('D’accord.', held(2600)),
        law('Je garde tes mots, pas les miens.', held(3200)),
      ],
      { next: 'end' },
    ),
    N('accepte', [law('D’accord.', held(2800))], { next: 'end' }),
    N(
      'refuse',
      [
        law('D’accord.', held(2800)),
        law('Alors cette lecture était la mienne.', held(3200)),
      ],
      { next: 'end' },
    ),
    N('silence', [law('Je ne vais pas décider à ta place.', held(3200))], {
      next: 'end',
    }),
    E(),
  ],
});
