import {
  A,
  E,
  N,
  flag,
  held,
  lou,
  reply,
  silence,
  stage,
  talkScene,
} from '../dsl';

// 18 — LE TRAJET
// LAW does not speak. It is raining, you are driving, Lou is six and asks
// whether tomorrow has a contrary. No one is in danger. This is what the
// twenty years will be made of: a phrase she says, a raincoat, a red light.
export const leTrajet = talkScene({
  id: 'le-trajet',
  title: 'Le trajet',
  ambience: 'rain',
  regression: 0,
  start: 'debut',
  nodes: [
    N('debut', [
      stage(
        'Il pleut. Tu conduis. Ça sent le chien mouillé, alors que vous n’avez pas de chien.',
        held(3400),
      ),
      stage(
        'Sur la banquette arrière, Lou, six ans, pieds ballants, dans un ciré jaune trop grand.',
        held(3200),
      ),
      lou('Papa ?', held(1800)),
    ]),
    A('papa', [
      reply('oui', 'Oui ?', { next: 'contraire' }),
      reply('mm', 'Mm.', { next: 'contraire' }),
      silence('rien', 'Regarder la route', {
        next: 'contraire',
        effects: [flag('t0.lou.distrait')],
      }),
    ]),
    N('contraire', [lou('C’est quoi le contraire de demain ?', held(2400))]),
    A('contraire-ask', [
      reply('hier', 'Hier.', { next: 'r-hier' }),
      reply('aujourdhui', 'Aujourd’hui.', { next: 'r-aujourdhui' }),
      reply('sais-pas', 'Je ne sais pas.', { next: 'r-sais-pas' }),
    ]),
    N(
      'r-hier',
      [
        lou(
          'Non. Hier, c’est le contraire de demain de l’autre côté.',
          held(3000),
        ),
      ],
      { next: 'feu' },
    ),
    N(
      'r-aujourdhui',
      [
        lou('Ah oui. Aujourd’hui.', held(2200)),
        lou('Mais alors demain il est où ?', held(3000)),
      ],
      { next: 'feu' },
    ),
    N(
      'r-sais-pas',
      [
        lou('Moi non plus.', held(2400)),
        lou('On demandera à quelqu’un.', held(2800)),
      ],
      { next: 'feu' },
    ),
    N('feu', [
      stage('Le feu passe au rouge.', held(2400)),
      lou('Il passe jamais au vert, celui-là.', held(2800)),
    ]),
    A('feu-ask', [
      reply('va-passer', 'Il va passer.', { next: 'r-passer' }),
      reply('vrai', 'C’est vrai.', { next: 'r-vrai' }),
      silence('rien', '…', { next: 'r-rien' }),
    ]),
    N('r-passer', [lou('Tu dis ça tout le temps.', held(2600))], {
      next: 'dormir',
    }),
    N('r-vrai', [lou('Je sais.', held(2400))], { next: 'dormir' }),
    N(
      'r-rien',
      [lou('On attend. C’est pas grave, on a le temps.', held(2800))],
      { next: 'dormir' },
    ),
    N('dormir', [lou('Papa, si je m’endors, tu me portes ?', held(2600))]),
    A('dormir-ask', [
      reply('toujours', 'Toujours.', {
        next: 'r-toujours',
        effects: [
          { relationEvent: { characterId: 'lou', kind: 'promise_made' } },
        ],
      }),
      reply('grande', 'Tu es trop grande.', { next: 'r-grande' }),
      reply('dors', 'Endors-toi.', { next: 'r-dors' }),
    ]),
    N(
      'r-toujours',
      [
        lou('Même quand je serai grande ?', held(2600)),
        lou('D’accord. Je te crois.', held(2800)),
      ],
      { next: 'glace' },
    ),
    N('r-grande', [lou('Je suis pas grande. Je suis moyenne.', held(3000))], {
      next: 'glace',
    }),
    N(
      'r-dors',
      [lou('Je dors pas. Je ferme les yeux pour réfléchir.', held(3000))],
      { next: 'glace' },
    ),
    N('glace', [lou('Je veux une glace.', held(2200))]),
    A('glace-ask', [
      reply('non', 'Non, il pleut.', { next: 'r-non' }),
      reply('oui', 'D’accord. Une seule.', { next: 'r-oui' }),
      reply('verra', 'On verra.', { next: 'r-verra' }),
    ]),
    N(
      'r-non',
      [
        lou('C’est pas juste.', held(2200)),
        lou('Mais c’est pas grave.', held(3000)),
      ],
      { effects: [flag('t0.lou.phrase')], next: 'fin' },
    ),
    N(
      'r-oui',
      [lou('Yes.', held(2200)), lou('Une seule, promis. Trois.', held(2800))],
      { next: 'fin' },
    ),
    N(
      'r-verra',
      [
        lou('Ça veut dire non.', held(2400)),
        lou('C’est pas juste. Mais c’est pas grave.', held(3200)),
      ],
      { effects: [flag('t0.lou.phrase')], next: 'fin' },
    ),
    N(
      'fin',
      [
        stage(
          'Elle s’endort avant d’arriver. Tu roules plus lentement.',
          held(3800),
        ),
      ],
      { next: 'end' },
    ),
    E(),
  ],
});
