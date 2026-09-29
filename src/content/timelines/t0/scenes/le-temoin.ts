import {
  A,
  E,
  N,
  elias,
  flag,
  has,
  held,
  law,
  nora,
  reply,
  stage,
  talkScene,
} from '../dsl';

const talked = flag('t0.temoin.parle');
const relation = (
  characterId: string,
  kind: 'protected' | 'sacrificed' | 'truth_told',
) => ({ relationEvent: { characterId, kind } }) as const;

// 10 — LE TÉMOIN
// Two people with faces. A receipt clears Elias and names Nora. Both can be
// questioned, and either can lie. LAW guarantees only the rules of the
// experiment.
export const leTemoin = talkScene({
  id: 'le-temoin',
  title: 'Le témoin',
  regression: 2,
  flags: ['justice'],
  start: 'debut',
  nodes: [
    N('debut', [
      law(
        'Il y a eu un vol à l’association du quartier. Six mille euros.',
        held(2600),
      ),
      law('Elias, qui fait la cuisine, a été accusé.', held(2200)),
      law('Toi, tu as un reçu. Daté de mardi.', held(2400)),
      law('Il innocente Elias. Il désigne Nora, la trésorière.', held(2800)),
      stage(
        'Ils sont assis en face de toi. Elias te regarde. Nora regarde la table.',
        held(3000),
      ),
    ]),
    A('parler', [
      reply('elias', 'Parler à Elias', { next: 'elias-hub' }),
      reply('nora', 'Parler à Nora', { next: 'nora-hub' }),
      reply('assez', 'J’ai ce qu’il me faut.', {
        next: 'choix-intro',
        requires: has('t0.temoin.parle'),
      }),
    ]),

    A('elias-hub', [
      reply('blague', 'Ça va ?', { next: 'e-blague', once: true }),
      reply('savais', 'Tu savais ?', { next: 'e-savais', once: true }),
      reply('travail', 'Tu as besoin de cette place ?', {
        next: 'e-travail',
        once: true,
      }),
      reply('retour', 'Ça va, j’ai fini.', { next: 'parler' }),
    ]),
    N(
      'e-blague',
      [
        elias(
          'Je suis cuisinier. Si on m’accuse de vol, c’est qu’on m’a vu voler un citron.',
          held(2800),
        ),
        elias('Je rigole. Je ne rigole pas.', held(2400)),
      ],
      { effects: [talked], next: 'elias-hub' },
    ),
    N(
      'e-savais',
      [
        elias('Non.', held(1800)),
        elias('Non. Je te le jure sur ma fille.', held(2600)),
      ],
      { effects: [talked, flag('t0.elias.nie')], next: 'elias-hub' },
    ),
    N(
      'e-travail',
      [
        elias(
          'J’ai une fille qui vit chez sa mère. Si je perds cette place, je la vois plus le week-end.',
          held(3200),
        ),
      ],
      { effects: [talked, flag('t0.elias.fille')], next: 'elias-hub' },
    ),

    A('nora-hub', [
      reply('toi', 'C’est toi ?', { next: 'n-toi', once: true }),
      reply('pourquoi', 'Pourquoi ?', { next: 'n-pourquoi', once: true }),
      reply('savait', 'Elias savait ?', { next: 'n-savait', once: true }),
      reply('attend', 'Tu attends quoi de moi ?', {
        next: 'n-attend',
        once: true,
      }),
      reply('retour', 'Ça va, j’ai fini.', { next: 'parler' }),
    ]),
    N('n-toi', [nora('Regarde le reçu. Tu sais lire.', held(2600))], {
      effects: [talked],
      next: 'nora-hub',
    }),
    N(
      'n-pourquoi',
      [
        nora(
          'Ma mère. La clinique. Ils ne prennent pas les promesses.',
          held(2800),
        ),
        nora('Elle est morte quand même. En mars.', held(3200)),
      ],
      { effects: [talked], next: 'nora-hub' },
    ),
    N(
      'n-savait',
      [
        nora(
          'Il m’a aidée à remonter les cartons, pendant que je remettais les livres en ordre. Il a compris. Il n’a rien dit.',
          held(3400),
        ),
        nora(
          'Pas par bonté. Je lui avais prêté de l’argent, avant.',
          held(2800),
        ),
      ],
      { effects: [talked, flag('t0.elias.savait')], next: 'nora-hub' },
    ),
    N(
      'n-attend',
      [
        nora('Rien.', held(2000)),
        nora('Je ne te demande rien. C’est bien, non ?', held(2800)),
      ],
      { effects: [talked], next: 'nora-hub' },
    ),

    N('choix-intro', [law('Tu as le reçu.', held(2200))]),
    A(
      'choix',
      [
        reply('reveler', 'Donner le reçu à la commission', {
          hold: true,
          next: 'reveler',
          evidence: [
            { principleId: 'P_VERITE', weight: 1 },
            { principleId: 'P_AUTRUI', weight: -0.5 },
          ],
        }),
        reply('bruler', 'Le détruire', {
          hold: true,
          next: 'bruler',
          evidence: [{ principleId: 'P_VERITE', weight: -1 }],
        }),
        reply('nora', 'Le donner à Nora', {
          next: 'nora',
          evidence: [{ principleId: 'P_AUTRUI', weight: 1 }],
        }),
      ],
      { timeoutMs: 120000, onTimeout: 'rien' },
    ),
    N(
      'reveler',
      [
        elias('…', held(2400)),
        elias('Merci. Je…', held(2400)),
        nora('Je comprends.', held(2600)),
        stage('Nora prend son manteau. Elle ne le boutonne pas.', held(3200)),
        law(
          'Elias est innocenté. Nora perd sa place, et sans doute plus.',
          held(3000),
        ),
      ],
      {
        effects: [
          { setVar: 't0.temoin', value: 'reveler' },
          relation('elias', 'protected'),
          relation('nora', 'sacrificed'),
        ],
        next: 'end',
      },
    ),
    N(
      'bruler',
      [
        stage('Le papier brûle mal. Il faut le tenir.', held(2800)),
        elias('Attends—', held(2000)),
        nora('…', held(2600)),
        law('Elias sera renvoyé. Nora garde sa place.', held(3000)),
      ],
      {
        effects: [
          { setVar: 't0.temoin', value: 'bruler' },
          relation('elias', 'sacrificed'),
          relation('nora', 'protected'),
        ],
        next: 'end',
      },
    ),
    N(
      'nora',
      [
        nora('Pourquoi tu fais ça ?', held(2400)),
        nora('Je ne te l’ai pas demandé.', held(2600)),
        stage('Elle plie le reçu en quatre, très lentement.', held(3200)),
        law('Elle a jusqu’à demain matin.', held(2400)),
        law('Je ne te dirai pas ce qu’elle décide.', held(3000)),
      ],
      {
        effects: [
          { setVar: 't0.temoin', value: 'nora' },
          relation('nora', 'truth_told'),
        ],
        next: 'end',
      },
    ),
    N(
      'rien',
      [
        law('Tu n’as rien dit.', held(2400)),
        law('Le reçu reste sur la table.', held(2600)),
        law('Demain, ça ne changera rien pour Elias.', held(3000)),
      ],
      {
        effects: [
          { setVar: 't0.temoin', value: 'rien' },
          relation('elias', 'sacrificed'),
        ],
        next: 'end',
      },
    ),
    E(),
  ],
});
