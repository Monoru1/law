import {
  A,
  E,
  N,
  flag,
  held,
  law,
  lou,
  note,
  reply,
  silence,
  stage,
  talkScene,
} from '../dsl';

const seen = { incVar: 't0.vie.vu', by: 1 } as const;
const mange = 't0.quelques-questions/plat-ecrit';

// 13 — TON AUTRE VIE
// Ten minutes in a life that may be yours. Someone calls you papa. She is six.
// She has a drawing, a treasure, a way of asking whether you have eaten. Nothing
// here is a dilemma: this is where the twenty years find their weight, and LAW,
// for once, refuses you something.
export const tonAutreVie = talkScene({
  id: 'ton-autre-vie',
  title: 'Ton autre vie',
  ambience: 'home',
  regression: 2,
  start: 'entree',
  nodes: [
    N('entree', [
      law('Cette vie existe.', held(2400)),
      law('Je ne dis pas qu’elle arrivera. Je dis qu’elle existe.', held(2800)),
      stage(
        'Une entrée. Des chaussures alignées, sauf une paire de petites bottes jaunes, jetées.',
        held(3000),
      ),
      lou('Papa !', held(1400)),
      lou('T’as vu ? J’ai fait un dessin.', held(2200)),
    ]),
    A('dessin', [
      reply('bien', 'Il est très bien.', { next: 'r-bien' }),
      reply('mains', 'Pourquoi il n’a pas de mains ?', { next: 'r-mains' }),
      silence('rien', 'Regarder le dessin', { next: 'r-regarde' }),
    ]),
    N(
      'r-bien',
      [
        lou(
          'C’est toi. T’as pas de mains parce que je sais pas les faire.',
          held(2800),
        ),
      ],
      { next: 'garde' },
    ),
    N(
      'r-mains',
      [
        lou('Bah… c’est dur, les mains.', held(2200)),
        lou('C’est toi, en plus. Fais pas ton offensé.', held(2800)),
      ],
      { next: 'garde' },
    ),
    N(
      'r-regarde',
      [
        stage(
          'Un grand bonhomme, des cheveux qui partent dans tous les sens, pas de mains. Le soleil a un visage.',
          held(3200),
        ),
        lou('C’est toi. Je sais pas faire les mains.', held(2600)),
      ],
      { next: 'garde' },
    ),
    N('garde', [], {
      effects: [seen],
      route: [{ when: { var: 't0.vie.vu', op: '>=', value: 5 }, next: 'stop' }],
      next: 'hub',
    }),

    A('hub', [
      reply('bureau', 'Le bureau', { next: 'a-bureau', once: true }),
      reply('photos', 'Les photos, sur le frigo', {
        next: 'a-photos',
        once: true,
      }),
      reply('telephone', 'Le téléphone', { next: 'a-tel', once: true }),
      reply('chambre', 'La chambre de Lou', { next: 'a-chambre', once: true }),
      reply('cuisine', 'La cuisine', { next: 'a-cuisine', once: true }),
      reply('noir', 'Éteindre la lumière du couloir', {
        next: 'a-noir',
        once: true,
        requires: { noted: { tag: 'noir-peur' } },
      }),
      reply('assez', 'J’ai vu.', { next: 'stop' }),
    ]),
    N(
      'a-bureau',
      [
        stage(
          'Une lampe. Une pile de dossiers, ton écriture. Un prix, encadré, un peu de travers.',
          held(3000),
        ),
        stage('Tu ne sais pas pour quoi c’est.', held(2600)),
      ],
      { effects: [seen], next: 'garde-hub' },
    ),
    N(
      'a-photos',
      [
        stage(
          'Lou à deux ans devant un gâteau. Toi, plus jeune, à côté d’une femme qui rit la bouche pleine.',
          held(3200),
        ),
        stage(
          'Elle te tient par la manche, comme si tu pouvais partir.',
          held(2800),
        ),
      ],
      { effects: [seen], next: 'garde-hub' },
    ),
    N(
      'a-tel',
      [
        stage(
          'Un message de Théo : « T’es pas encore parti ? Lou te cherche. »',
          held(3000),
        ),
        stage(
          'Il date de dix minutes. Tu ne te souviens pas l’avoir lu.',
          held(2800),
        ),
      ],
      { effects: [seen], next: 'garde-hub' },
    ),
    N(
      'a-chambre',
      [
        stage(
          'Les murs sont jaunes. Sous le lit, une boîte : un bouchon, une dent, un caillou en forme de cœur (ou de fesses, elle n’a pas tranché).',
          held(3600),
        ),
        lou('C’est mon trésor. Touche pas.', held(2400)),
      ],
      { effects: [seen], next: 'garde-hub' },
    ),
    N('a-cuisine', [lou('T’as mangé ?', held(1800))], {
      effects: [seen],
      route: [
        { when: { noted: { tag: 'plat-seul' } }, next: 'a-cuisine-plat' },
      ],
      next: 'a-cuisine-nu',
    }),
    N(
      'a-cuisine-plat',
      [
        lou(
          `Papa, t’as encore mangé {{said:${mange}|n’importe quoi}} debout ?`,
          held(3000),
        ),
        lou('C’est pas un vrai repas, ça.', held(2600)),
      ],
      { next: 'garde-hub' },
    ),
    N(
      'a-cuisine-nu',
      [lou('T’as pas mangé. Je le vois à ta tête.', held(2800))],
      { next: 'garde-hub' },
    ),
    N(
      'a-noir',
      [
        lou('Papa, tu laisses la lumière ?', held(2200)),
        lou('…Toi aussi t’as peur, hein.', held(3000)),
      ],
      { effects: [seen], next: 'garde-hub' },
    ),
    N('garde-hub', [], {
      route: [{ when: { var: 't0.vie.vu', op: '>=', value: 5 }, next: 'stop' }],
      next: 'hub',
    }),

    N('stop', [law('Tu as suffisamment vu.', held(2800))]),
    A('stop-ask', [
      reply('encore', 'Encore cinq minutes.', { next: 'refus' }),
      reply('ok', 'D’accord.', { next: 'sortie' }),
      silence('rien', '…', { next: 'sortie' }),
    ]),
    N('refus', [law('Non.', held(3000))], {
      effects: [note('refusal', 'law-refuse-vie')],
    }),
    A('refus-ask', [
      reply('insiste', 'S’il te plaît.', { next: 'refus2' }),
      reply('ok', 'D’accord.', { next: 'sortie' }),
    ]),
    N(
      'refus2',
      [
        law('Non.', held(2600)),
        law('Je peux te laisser le souvenir. Pas la porte.', held(3400)),
      ],
      { next: 'sortie' },
    ),
    N(
      'sortie',
      [
        lou('Papa ?', held(2400)),
        stage('La pièce s’efface avant que tu répondes.', held(3600)),
        law('Tu peux t’en souvenir.', held(2600)),
        law('Ce n’est pas la même chose que l’avoir.', held(3400)),
      ],
      {
        effects: [flag('t0.vie.vue'), note('curiosity', 'autre-vie-vue')],
        next: 'end',
      },
    ),
    E(),
  ],
});
