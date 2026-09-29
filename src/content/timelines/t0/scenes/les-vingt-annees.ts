import {
  A,
  E,
  N,
  flag,
  held,
  law,
  lou,
  reply,
  said,
  silence,
  stage,
  talkScene,
  year,
} from '../dsl';

const here = (node: string, option: string) =>
  said('t0.les-vingt-annees', node, option);
const dish = '{{said:t0.quelques-questions/plat-ecrit|des pâtes}}';
const y = (n: string) => year(n, held(2600));
const s = (text: string, ms = 3000) => stage(text, held(ms));

// 19 — LES VINGT ANNÉES
// Not a montage: a life taken in fragments, banal ones next to major ones, an
// object that ages (a yellow raincoat), a voice that changes (Lou’s), a phrase
// that comes back. It runs about fifteen minutes because most of them are
// nothing at all. You may refuse to see it; LAW then says only the end.
export const lesVingtAnnees = talkScene({
  id: 'les-vingt-annees',
  title: 'Les vingt années',
  ambience: 'home',
  regression: 3,
  flags: ['temps', 'deuil'],
  start: 'debut',
  nodes: [
    N('debut', [
      law('Il y a vingt ans que tu ne connais pas.', held(3000)),
      law('Je peux te les montrer. Vite. Pas tous.', held(3000)),
      law('Tu veux les voir ?', held(1000)),
    ]),
    A('voir', [
      reply('oui', 'Oui.', { next: 'ferme' }),
      reply('non', 'Non.', {
        next: 'non',
        effects: [flag('t0.annees.refuse')],
      }),
      silence('rien', '…', { next: 'ferme' }),
    ]),
    N(
      'non',
      [
        law('D’accord.', held(2800)),
        law('Alors je ne te les montre pas.', held(3000)),
      ],
      { next: 'end' },
    ),
    N('ferme', [stage('Tu fermes les yeux.', held(3600))]),

    N('y2027', [
      y('2027'),
      s(
        'Un appartement trop petit. Une plante que tu oublies d’arroser. Elle survit, par mépris.',
      ),
    ]),
    N('y2028', [
      y('2028'),
      s(
        'Le premier lundi. Personne ne sait où mettre ses mains dans l’ascenseur.',
      ),
      s(
        'Tu apprends le prénom de la femme de l’accueil. Elle s’appelle Odile. Elle te dit bonjour pendant douze ans.',
      ),
    ]),
    N('y2029', [
      y('2029'),
      s('Inès. Elle laisse son parapluie chez tout le monde.'),
      s(
        'Tu lui dis que tu n’aimes pas les gens qui oublient leurs affaires. Elle laisse ses clés chez toi. Tu ne les rends pas.',
      ),
    ]),
    N('y2030', [
      y('2030'),
      s(
        '4 h 12. Un distributeur de café en panne au deuxième étage. Une infirmière t’en tend un quand même.',
      ),
      s(
        'Lou pèse trois kilos deux cents. Elle a les poings fermés, comme si elle voulait te dire quelque chose.',
        3400,
      ),
    ]),
    N('y2031', [
      y('2031'),
      s(
        'Vous vous mariez un mardi, à la mairie, parce que c’était moins cher. Il pleut.',
      ),
      s('Inès dit que c’est bon signe. Elle dit ça de tout.'),
    ]),
    N('y2032', [
      y('2032'),
      s(
        'Les nuits. Tu connais maintenant l’heure exacte à laquelle le frigo change de bruit.',
      ),
    ]),
    N('y2033', [
      y('2033'),
      s('Lou dit « papa » pour la première fois. Elle le dit à un lampadaire.'),
      lou('Pa.', held(1600)),
    ]),
    A('pa', [
      reply('oui', 'Oui ?', { next: 'r-pa-oui' }),
      silence('rien', 'La regarder', { next: 'r-pa-rien' }),
    ]),
    N(
      'r-pa-oui',
      [
        lou('Pa !', held(1800)),
        s(
          'Elle éclate de rire, comme si elle avait fait une bonne blague.',
          2800,
        ),
      ],
      { next: 'y2034' },
    ),
    N(
      'r-pa-rien',
      [
        s(
          'Elle recommence, plus fort. Elle attend que tu lèves la tête.',
          3000,
        ),
      ],
      { next: 'y2034' },
    ),
    N('y2034', [
      y('2034'),
      s(
        'Des vacances. Une tente qui fuit. Vous dormez à trois sous une bâche, Lou compte les gouttes à voix haute jusqu’à s’endormir.',
      ),
      s(
        'Elle s’arrête à quarante-sept. Personne ne sait ce qui s’est passé après.',
        3200,
      ),
    ]),
    N('y2036', [
      y('2036'),
      s(
        'Le ciré jaune est à sa taille, enfin. Il pend encore un peu aux manches.',
      ),
      lou('Papa, regarde !', held(1800)),
    ]),
    A('regarde', [
      reply('regarde', 'Je regarde.', { next: 'r-regarde' }),
      reply('seconde', 'Une seconde, je finis.', { next: 'r-seconde' }),
    ]),
    N(
      'r-regarde',
      [
        s(
          'Elle fait un tour sur elle-même, les bras écartés. C’est tout. C’était ça, le spectacle.',
          3400,
        ),
      ],
      { next: 'y2037' },
    ),
    N(
      'r-seconde',
      [
        lou('Tu finis toujours.', held(2400)),
        s('Elle s’en va sans le dire. Tu ne l’entends pas partir.', 3200),
      ],
      { next: 'y2037' },
    ),
    N('y2037', [
      y('2037'),
      s(
        'Une dent qui tombe. Elle la garde dans la boîte aux trésors, avec un bouchon et un caillou.',
      ),
    ]),
    N('y2038', [
      y('2038'),
      s(
        'Ton père. Un mardi, à l’hôpital, chambre 214, avec un plateau-repas intact.',
        3400,
      ),
      s(
        'Dans le couloir, Lou te tient la main plus fort que nécessaire.',
        3200,
      ),
      lou('Il est où, maintenant ?', held(2600)),
    ]),
    A('ou', [
      reply('sais-pas', 'Je ne sais pas.', { next: 'r-ou-sais' }),
      reply('tetes', 'Dans nos têtes.', { next: 'r-ou-tetes' }),
      reply('mort', 'Il est mort, Lou.', { next: 'r-ou-mort' }),
    ]),
    N('r-ou-sais', [lou('Ah.', held(1800)), lou('Moi non plus.', held(2600))], {
      next: 'casquette',
    }),
    N(
      'r-ou-tetes',
      [lou('Alors il est un peu dans la mienne aussi.', held(3000))],
      { next: 'casquette' },
    ),
    N('r-ou-mort', [lou('…Ok.', held(2600))], { next: 'casquette' }),
    N(
      'casquette',
      [lou('Je peux quand même garder sa casquette ?', held(3200))],
      { next: 'y2039' },
    ),
    N('y2039', [
      y('2039'),
      s(
        'Le projet ne trouve pas de financement. Tu ranges les plans dans un carton étiqueté « provisoire ». Il y restera.',
        3800,
      ),
      s('Un soir, Lou te dit qu’elle a fait à dîner.', 2600),
      lou(
        `Je t’ai fait ${dish}. C’est ce que tu manges quand t’es triste.`,
        held(3200),
      ),
    ]),
    A('diner', [
      reply('merci', 'Merci.', { next: 'r-merci' }),
      reply('faim', 'Je n’ai pas faim.', { next: 'r-faim' }),
    ]),
    N(
      'r-merci',
      [
        s(
          'Tu manges tout. C’est très moyen. Elle te regarde manger comme on regarde un feu.',
          3400,
        ),
      ],
      { next: 'y2040' },
    ),
    N(
      'r-faim',
      [
        lou('Ah.', held(2000)),
        s(
          'Elle laisse l’assiette sur la table, au cas où. Tu la trouves froide à minuit et tu la manges debout.',
          3600,
        ),
      ],
      { next: 'y2040' },
    ),
    N('y2040', [
      y('2040'),
      s(
        'Une dispute sur le lave-vaisselle. Inès dit que tu ranges les assiettes comme quelqu’un qui a peur qu’elles s’échappent.',
      ),
      s(
        'Tu réponds qu’elle est mal placée pour parler d’organisation. Vous en rirez pendant des années. Ce soir-là, personne ne rit.',
        3600,
      ),
    ]),
    A('dispute', [
      reply('excuse', 'Je m’excuse.', { next: 'r-excuse' }),
      reply('commence', 'Elle a commencé.', { next: 'r-commence' }),
      silence('rien', '…', { next: 'r-dispute-rien' }),
    ]),
    N(
      'r-excuse',
      [
        s(
          'Inès ne répond pas tout de suite. Puis : « C’est le lave-vaisselle, hein ? » Tu dis oui.',
          3400,
        ),
      ],
      { next: 'y2042' },
    ),
    N(
      'r-commence',
      [s('Elle sourit un peu quand même. Ça ne règle rien. Ça aide.', 3000)],
      { next: 'y2042' },
    ),
    N(
      'r-dispute-rien',
      [
        s(
          'Vous rangez tous les deux les assiettes en silence. Elle les range mieux que toi.',
          3200,
        ),
      ],
      { next: 'y2042' },
    ),
    N('y2042', [
      y('2042'),
      s(
        'Devant le collège. Tu l’appelles « Bout », sur le trottoir, devant ses amies.',
        3000,
      ),
      lou('J’ai plus huit ans, arrête.', held(2800)),
      lou('Tu regardes jamais quand je te dis regarde.', {
        pauseMs: 3000,
        requires: here('regarde', 'seconde'),
      }),
    ]),
    A('bout', [
      reply('pardon', 'Pardon.', { next: 'r-pardon' }),
      reply('toujours', 'Tu seras toujours mon Bout.', { next: 'r-toujours' }),
      silence('rien', '…', { next: 'r-bout-rien' }),
    ]),
    N(
      'r-pardon',
      [
        lou('C’est bon.', held(2000)),
        lou('Mais pas devant les autres.', held(2800)),
      ],
      { next: 'y2043' },
    ),
    N(
      'r-toujours',
      [
        lou('Papa.', held(1800)),
        lou('…D’accord. Mais pas devant les autres.', held(3000)),
      ],
      { next: 'y2043' },
    ),
    N(
      'r-bout-rien',
      [
        s(
          'Elle rejoint ses amies. Elle se retourne une fois, pour vérifier que tu n’as pas l’air trop triste.',
          3600,
        ),
      ],
      { next: 'y2043' },
    ),
    N('y2043', [
      y('2043'),
      s(
        'Le premier gros succès. La chose que tu croyais ne plus jamais arriver arrive un jeudi, sans raison, dans un train.',
        3800,
      ),
      s(
        'Personne à qui le dire tout de suite. Tu écris à Inès. Elle répond : « Je sais. Je suis fière. Pense à acheter du pain. »',
        3800,
      ),
    ]),
    N('y2044', [
      y('2044'),
      s(
        'Vous n’avez plus rien à vous dire, pendant tout un dîner, Inès et toi. C’est très agréable.',
        3400,
      ),
    ]),
    N('y2045', [
      y('2045'),
      s(
        'Un voyage scolaire. Elle refuse que tu l’accompagnes jusqu’au quai. Tu restes derrière la vitre.',
        3400,
      ),
      lou('Papa. Arrête de faire cette tête.', held(2800)),
      s(
        'Elle se retourne trois fois. Le ciré jaune est resté sur la patère. « Au cas où », a-t-elle dit.',
        3600,
      ),
    ]),
    N('y2046', [
      y('2046'),
      s('Un dimanche. Rien. Une pluie très fine.', 3000),
      s(
        'Elle a seize ans. Elle épluche une pomme, à la table de la cuisine. Toi, tu lis le journal.',
        3600,
      ),
      lou('Papa ?', held(3200)),
    ]),
    A('final', [
      reply('oui', 'Oui ?', { next: 'r-final-oui' }),
      silence('rien', 'Lever les yeux', { next: 'r-final-rien' }),
    ]),
    N(
      'r-final-oui',
      [
        lou('Rien.', held(2600)),
        lou('Je voulais juste voir si t’étais là.', held(3800)),
      ],
      { next: 'coupe' },
    ),
    N(
      'r-final-rien',
      [
        lou('Rien.', held(2600)),
        s(
          'Elle te regarde une seconde de plus que nécessaire. Puis elle retourne à sa pomme.',
          4000,
        ),
      ],
      { next: 'coupe' },
    ),
    N('coupe', [], { effects: [flag('t0.annees.vues')], next: 'end' }),
    E(),
  ],
});
