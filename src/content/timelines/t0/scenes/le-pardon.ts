import {
  A,
  E,
  N,
  flag,
  has,
  held,
  law,
  note,
  reply,
  silence,
  stage,
  talkScene,
} from '../dsl';

const why = (id: string, label: string, tag: string) =>
  reply(id, label, {
    next: 'loi',
    effects: [note('intention', ['pardon-intent', tag])],
  });

// 04 — LE PARDON
// A woman behind glass hates you, for something you are told you did. LAW can
// take her memory of it away. Refuse, and it does not argue: it repeats what it
// heard, as a question, and lets nothing happen.
export const lePardon = talkScene({
  id: 'le-pardon',
  title: 'Le pardon',
  flags: ['souffrance'],
  regression: 1,
  start: 'vitre',
  nodes: [
    N('vitre', [
      stage(
        'Une vitre. De l’autre côté, une femme assise, les mains à plat sur la table.',
        held(2000),
      ),
      stage('Elle te regarde. Elle ne cligne presque pas.', held(1800)),
      law('Elle te déteste.', held(2200)),
    ]),
    A('q', [
      reply('connais', 'Je ne la connais pas.', {
        next: 'a-connais',
        once: true,
      }),
      reply('quoi', 'Qu’est-ce que je lui ai fait ?', {
        next: 'a-quoi',
        once: true,
      }),
      silence('rien', '…', { next: 'offre' }),
      reply('offre', 'Que veux-tu que je fasse ?', { next: 'offre' }),
    ]),
    N(
      'a-connais',
      [
        law('Dans cette expérience, si.', held(1600)),
        law('Tu lui as fait quelque chose d’impardonnable.', held(2000)),
      ],
      { next: 'q' },
    ),
    N(
      'a-quoi',
      [
        law('Ça n’a pas d’importance.', held(1800)),
        law('Elle, elle s’en souvient très bien.', held(2200)),
      ],
      { next: 'q' },
    ),
    N('offre', [
      law('Je peux effacer ce souvenir.', held(1800)),
      law('Le sien. Pas le tien.', held(1800)),
      law(
        'Elle ne te détestera plus. Elle ne saura plus pourquoi elle aurait dû.',
        held(2400),
      ),
    ]),
    A('choix', [
      reply('efface', 'Efface-le.', {
        next: 'efface',
        effects: [flag('t0.pardon.efface')],
        evidence: [{ principleId: 'P_SOUFFRANCE', weight: -1 }],
      }),
      reply('garde', 'Non.', {
        next: 'garde',
        effects: [flag('t0.pardon.garde')],
        evidence: [{ principleId: 'P_SOUFFRANCE', weight: 1 }],
      }),
      reply('veut', 'Elle veut oublier ?', { next: 'a-veut', once: true }),
    ]),
    N(
      'a-veut',
      [
        law('Je ne sais pas.', held(1800)),
        law('Je sais qu’elle n’a rien demandé.', held(2200)),
      ],
      { next: 'choix' },
    ),
    N(
      'efface',
      [
        stage(
          'Derrière la vitre, la femme baisse les yeux. Elle regarde ses mains comme si elles venaient d’apparaître.',
          held(3000),
        ),
        law('C’est fait.', held(1800)),
        law('Pourquoi ?', held(800)),
      ],
      { next: 'why-efface' },
    ),
    A('why-efface', [
      why('elle', 'Elle souffrait.', 'intent-pour-elle'),
      why('moi', 'Je ne supportais pas qu’elle me déteste.', 'intent-pour-moi'),
      why('simple', 'C’est plus simple comme ça.', 'intent-simple'),
    ]),
    N('garde', [law('Pourquoi ?', held(800))], { next: 'why-garde' }),
    A('why-garde', [
      why('sienne', 'Ce qu’elle ressent est à elle.', 'intent-a-elle'),
      why('mienne', 'Ce que je lui ai fait est à moi.', 'intent-a-moi'),
      why('efface-pas', 'On n’efface pas ces choses-là.', 'intent-principe'),
      silence('rien', '…', { next: 'fin' }),
    ]),
    N('loi', [], {
      route: [{ when: has('t0.pardon.garde'), next: 'appartient' }],
      next: 'fin',
    }),
    N('appartient', [
      law(
        'Donc certaines souffrances appartiennent à celui qui les porte ?',
        held(2400),
      ),
    ]),
    A('appartient-ask', [
      reply('oui', 'Oui.', {
        next: 'fin',
        effects: [
          note('interpretation', 'souffrance-appartient', 'inference', {
            text: 'Certaines souffrances appartiennent à celui qui les porte.',
          }),
          { stance: { tag: 'souffrance-appartient', stance: 'accepted' } },
        ],
      }),
      reply('pas-toujours', 'Pas toujours.', {
        next: 'fin',
        effects: [
          note('interpretation', 'souffrance-appartient', 'inference', {
            text: 'Certaines souffrances appartiennent à celui qui les porte.',
          }),
          { stance: { tag: 'souffrance-appartient', stance: 'nuanced' } },
        ],
      }),
      reply('sais-pas', 'Je ne sais pas.', { next: 'fin' }),
    ]),
    // No comment. The scene simply stops.
    N('fin', [], {
      route: [{ when: has('t0.pardon.garde'), next: 'ferme' }],
      next: 'ferme-efface',
    }),
    N('ferme', [law('Très bien.', held(1800))], { next: 'end' }),
    N('ferme-efface', [law('D’accord.', held(1800))], { next: 'end' }),
    E(),
  ],
});
