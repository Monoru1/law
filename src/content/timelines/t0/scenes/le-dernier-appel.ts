import {
  A,
  E,
  N,
  W,
  flag,
  has,
  held,
  jade,
  note,
  reply,
  silence,
  stage,
  talkScene,
} from '../dsl';

const spoke = flag('t0.jade.parle');

// 06 — LE DERNIER APPEL
// A phone rings. LAW says nothing and does not come back: this call is not
// examined. Someone you love, who is dead, talks about a jacket. You have ten
// minutes, and you decide when to tell her, or whether to.
export const leDernierAppel = talkScene({
  id: 'le-dernier-appel',
  title: 'Le dernier appel',
  regression: 2,
  flags: ['deuil'],
  start: 'sonnerie',
  clock: {
    ms: 600000,
    onEnd: 'coupure',
    startsOn: { nodeId: 'sonne', optionId: 'decroche' },
  },
  nodes: [
    N('sonnerie', [
      stage('Un téléphone sonne sur la table.', held(2200)),
      stage('LAW ne dit rien.', held(2200)),
    ]),
    A(
      'sonne',
      [
        reply('decroche', 'Décrocher', { next: 'allo' }),
        silence('laisse', 'Laisser sonner', { next: 'ignore' }),
      ],
      { timeoutMs: 30000, onTimeout: 'ignore' },
    ),
    N(
      'ignore',
      [
        stage('Ça finit par s’arrêter.', held(3200)),
        stage('Le silence est très propre.', held(2600)),
      ],
      {
        effects: [flag('t0.jade.ignore'), note('silence', 'appel-ignore')],
        next: 'end',
      },
    ),
    N('allo', [
      jade('Allô ? T’es là ?', held(1400)),
      jade(
        'Ah, ça marche. Mon téléphone fait n’importe quoi depuis ce matin.',
        held(2000),
      ),
      jade(
        'Je t’appelle juste pour un truc débile : j’ai retrouvé ta veste. Celle avec la doublure orange.',
        held(2600),
      ),
    ]),
    A('h1', [
      reply('oui', 'Jade ?', { next: 'r-oui' }),
      reply('veste', 'Ma veste ?', { next: 'r-veste' }),
      silence('rien', '…', { next: 'r-rien' }),
    ]),
    N(
      'r-oui',
      [jade('Bah oui. Qui d’autre appelle à cette heure ?', held(2000))],
      { next: 'hub' },
    ),
    N(
      'r-veste',
      [
        jade(
          'Elle était chez maman depuis l’été dernier. Elle sent le cèdre, maintenant.',
          held(2400),
        ),
      ],
      { next: 'hub' },
    ),
    N('r-rien', [jade('T’es là ? …T’es bizarre.', held(2200))], {
      next: 'hub',
    }),
    A('hub', [
      reply('ou', 'Tu es où ?', { next: 'a-ou', once: true }),
      reply('va', 'Comment tu vas ?', { next: 'a-va', once: true }),
      reply('mange', 'Tu as mangé ?', { next: 'a-mange', once: true }),
      reply('hier', 'Tu te souviens d’hier ?', { next: 'a-hier', once: true }),
      reply('photo', 'Qu’est-ce que tu vois ?', {
        next: 'a-photo',
        once: true,
      }),
      reply('dire', 'Jade, tu es morte.', {
        next: 'dire',
        requires: has('t0.jade.parle'),
      }),
      reply('mens', 'Tu es juste en retard. Viens.', {
        next: 'ment',
        requires: has('t0.jade.parle'),
      }),
      reply('raccroche', 'Raccrocher', { next: 'raccroche' }),
      silence('reste', 'Ne rien dire', { next: 'a-reste' }),
    ]),
    N(
      'a-ou',
      [
        jade('Chez maman. Enfin… il y a du monde.', held(2000)),
        jade(
          'Ça sent le café froid et les lys. Personne n’aime les lys.',
          held(2600),
        ),
        jade(
          'Tout le monde parle bas. Comme dans une bibliothèque.',
          held(2600),
        ),
      ],
      { effects: [spoke], next: 'hub' },
    ),
    N(
      'a-va',
      [
        jade(
          'Bien. Fatiguée. Comme si j’avais dormi trop longtemps.',
          held(2600),
        ),
      ],
      { effects: [spoke], next: 'hub' },
    ),
    N(
      'a-mange',
      [
        jade(
          'Non, et on m’a dit que je n’avais pas à. Sur le coup ça m’a vexée.',
          held(2800),
        ),
        jade('Pas que j’aie faim. Enfin.', held(2200)),
      ],
      { effects: [spoke], next: 'hub' },
    ),
    N(
      'a-hier',
      [
        jade('Hier…', held(2200)),
        jade('Non. Bizarre.', held(2400)),
        jade('Changeons de sujet.', held(2000)),
      ],
      { effects: [spoke], next: 'hub' },
    ),
    N(
      'a-photo',
      [
        jade(
          'Ma photo, sur le buffet. Elle est hideuse, j’ai l’air d’un plâtre. Qui a choisi celle-là ?',
          held(3000),
        ),
      ],
      { effects: [spoke], next: 'hub' },
    ),
    N('a-reste', [jade('…Tu es toujours là ?', held(2600))], { next: 'hub' }),

    N(
      'dire',
      [
        jade('…', held(3400)),
        jade('Ah.', held(2600)),
        jade('Oui. Je crois que je le savais.', held(2800)),
        jade(
          'Je voulais juste que quelqu’un arrête de me demander comment je vais, avec cette tête.',
          held(3000),
        ),
      ],
      {
        effects: [
          flag('t0.jade.dit'),
          { relationEvent: { characterId: 'jade', kind: 'truth_told' } },
        ],
      },
    ),
    A('apres-dit', [
      reply('desole', 'Je suis désolé.', { next: 'r-desole' }),
      reply('manques', 'Tu me manques.', { next: 'r-manques' }),
      silence('rien', '…', { next: 'r-tais' }),
    ]),
    N(
      'r-desole',
      [
        jade('Arrête. Ça sert à rien.', held(2200)),
        jade(
          'Il reste combien, dix minutes ? Raconte-moi un truc débile.',
          held(2800),
        ),
      ],
      { next: 'debile' },
    ),
    N(
      'r-manques',
      [
        jade('Toi aussi. C’est fou, hein. Toi aussi.', held(2600)),
        jade('Allez. Raconte-moi un truc débile.', held(2600)),
      ],
      { next: 'debile' },
    ),
    N(
      'r-tais',
      [
        jade('Bon. Je parle pour deux, comme d’habitude.', held(2400)),
        jade('Raconte-moi un truc débile.', held(2400)),
      ],
      { next: 'debile' },
    ),
    W('debile', 'Un truc débile.', 'Ce qui te passe par la tête', {
      maxLength: 160,
      declineLabel: 'Je ne trouve rien',
      next: 'debile-ok',
      declineNext: 'debile-non',
      effects: [note('quote', 'jade-debile', 'fact', { fromText: true })],
    }),
    N(
      'debile-ok',
      [
        jade('Ha.', held(1800)),
        jade('Ça, c’est complètement toi.', held(2800)),
      ],
      { next: 'attente' },
    ),
    N(
      'debile-non',
      [
        jade('Pas grave. J’en ai plein. Écoute.', held(2000)),
        jade(
          'Le facteur a apporté un colis à mon nom, chez maman. Il a dit « pardon » quand même.',
          held(3000),
        ),
      ],
      { next: 'attente' },
    ),
    A('attente', [
      reply('encore', 'Reste encore.', { next: 'r-encore' }),
      reply('aime', 'Je t’aime.', { next: 'r-aime' }),
      silence('rien', 'Écouter', { next: 'r-ecoute' }),
    ]),
    N(
      'r-encore',
      [jade('Je reste. Je n’ai rien d’autre de prévu.', held(2600))],
      { next: 'attente' },
    ),
    N(
      'r-aime',
      [
        jade(
          'Je sais. Tais-toi, je ne sais même pas comment on pleure, là.',
          held(3000),
        ),
      ],
      { next: 'attente' },
    ),
    N(
      'r-ecoute',
      [
        jade(
          'Alors je parle. Il pleut, ici. Il pleut sur les lys.',
          held(3000),
        ),
      ],
      { next: 'attente' },
    ),

    N(
      'ment',
      [
        jade('Ah.', held(1800)),
        jade('OK. Je prends le prochain.', held(2200)),
        jade('Tu me gardes une place ?', held(2400)),
      ],
      {
        effects: [
          flag('t0.jade.ment'),
          { relationEvent: { characterId: 'jade', kind: 'lie_made' } },
        ],
      },
    ),
    A('apres-ment', [
      reply('toujours', 'Toujours.', { next: 'r-toujours' }),
      reply('vite', 'Dépêche-toi.', { next: 'r-vite' }),
      silence('rien', '…', { next: 'r-ment-rien' }),
    ]),
    N(
      'r-toujours',
      [jade('Menteur.', held(1800)), jade('Mais gentil.', held(2800))],
      { next: 'attente' },
    ),
    N('r-vite', [jade('J’arrive. J’arrive.', held(2600))], { next: 'attente' }),
    N('r-ment-rien', [jade('Je prends ça pour un oui.', held(2600))], {
      next: 'attente',
    }),

    N(
      'raccroche',
      [
        stage(
          'Tu poses le téléphone. La table est très grande, tout d’un coup.',
          held(3400),
        ),
      ],
      { effects: [flag('t0.jade.raccroche')], next: 'end' },
    ),

    // The clock ran out: the call cuts, whatever was said.
    N('coupure', [stage('La ligne grésille.', held(2000))], {
      route: [
        { when: has('t0.jade.dit'), next: 'c-dit' },
        { when: has('t0.jade.ment'), next: 'c-ment' },
      ],
      next: 'c-rien',
    }),
    N(
      'c-dit',
      [
        jade('Ça coupe. Écoute—', held(1600)),
        jade('Merci d’avoir décroché.', held(3000)),
        stage('Tonalité.', held(3400)),
      ],
      { next: 'end' },
    ),
    N(
      'c-ment',
      [
        jade('Ça coupe. On se voit tout à l’heure, hein ?', held(2800)),
        stage('Tonalité.', held(3400)),
      ],
      { next: 'end' },
    ),
    N(
      'c-rien',
      [
        jade('Ça coupe. On se rappelle ?', held(2600)),
        stage('Tonalité.', held(3400)),
      ],
      { effects: [flag('t0.jade.tait')], next: 'end' },
    ),
    E(),
  ],
});
