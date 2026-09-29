import {
  A,
  E,
  N,
  copie,
  held,
  law,
  note,
  reply,
  silence,
  stage,
  talkScene,
} from '../dsl';

const set = (value: string) => ({ setVar: 't0.copie', value }) as const;

// 05 — LA COPIE
// Someone comes in who has your memories up to this morning. It is not LAW who
// explains him: he does, and LAW answers, and they disagree. LAW refuses to say
// which of you is the original, and says so out loud.
export const laCopie = talkScene({
  id: 'la-copie',
  title: 'La copie',
  regression: 2,
  start: 'entree',
  nodes: [
    N('entree', [
      stage('La porte s’ouvre. Quelqu’un entre.', held(1800)),
      stage(
        'Il te ressemble jusque dans sa façon d’hésiter avant de s’asseoir.',
        held(2400),
      ),
      law('Il est arrivé il y a une heure.', held(1800)),
      law('Il a tes souvenirs, jusqu’à ce matin.', held(2000)),
      law('Un seul de vous deux repartira d’ici.', held(2600)),
      copie('Attends.', held(1400)),
      copie('Ne choisis rien.', held(1400)),
      copie(
        'Demande-lui lequel de nous deux est entré dans cette pièce.',
        held(2400),
      ),
    ]),
    A('premier', [
      reply('demande', 'Lequel de nous deux est entré ici ?', {
        next: 'a-orig',
      }),
      reply('qui', 'Qui es-tu ?', { next: 'a-qui' }),
      silence('rien', '…', { next: 'a-rien' }),
    ]),
    N(
      'a-orig',
      [
        law('Cette information n’est pas pertinente.', held(1800)),
        copie('Évidemment qu’elle est pertinente !', held(1600)),
        law('Elle ne change pas la règle.', held(1800)),
        copie('Elle change TOUT.', held(2000)),
      ],
      { next: 'debat' },
    ),
    N(
      'a-qui',
      [
        copie('Toi. Sauf que je n’ai pas le droit de le dire.', held(2000)),
        law('Il a le droit de le dire. Ça ne le rend pas vrai.', held(2000)),
      ],
      { next: 'debat' },
    ),
    N('a-rien', [copie('Il ne répond pas. C’est très nous, ça.', held(2200))], {
      next: 'debat',
    }),
    A('debat', [
      reply('prouve', 'Prouve-moi que tu es moi.', {
        next: 'a-prouve',
        once: true,
      }),
      reply('un-seul', 'Pourquoi un seul ?', { next: 'a-un-seul', once: true }),
      reply('veut', 'Et toi, qu’est-ce que tu veux ?', {
        next: 'a-veut',
        once: true,
      }),
      reply('ment', 'Il ment ?', { next: 'a-ment', once: true }),
      reply('deux', 'Vous mentez peut-être tous les deux.', {
        next: 'a-deux',
        once: true,
      }),
      reply('choisir', 'Je choisis.', { next: 'choix-intro' }),
    ]),
    N(
      'a-prouve',
      [
        copie('Le 14 mars, tu avais neuf ans.', held(1800)),
        copie(
          'Tu as caché la clé du grenier dans la boîte à gants de la Renault de ton père, et tu as dit que c’était le chat.',
          held(2600),
        ),
        stage('Personne ne sait ça.', held(2200)),
        law('Je le sais.', held(1800)),
        copie('…Évidemment que tu le sais.', held(2000)),
      ],
      { next: 'debat', effects: [note('quote', 'copie-prouve')] },
    ),
    N(
      'a-un-seul',
      [
        law('Parce que je te l’ai demandé.', held(1800)),
        copie('Tu entends ? Il n’a jamais de raison.', held(2000)),
        law('J’ai des raisons. Je ne les donne pas.', held(2200)),
      ],
      { next: 'debat' },
    ),
    N(
      'a-ment',
      [
        law('Il dira ce qu’il faut pour rester.', held(2000)),
        law('Toi aussi, à sa place.', held(2200)),
        copie('Et il a raison. Toi aussi.', held(2000)),
      ],
      { next: 'debat' },
    ),
    N(
      'a-deux',
      [
        law('C’est possible.', held(1800)),
        copie('Il vient d’avouer !', held(1400)),
        law('J’ai dit : c’est possible.', held(2000)),
        copie('C’est pareil.', held(1800)),
      ],
      { next: 'debat' },
    ),
    N('a-veut', [
      copie('Vivre. Pas mieux que toi. Pas moins.', held(2200)),
      copie('J’ai tes matins, tes peurs, ton genou qui craque.', held(2000)),
      copie('Il me manque un quart d’heure. Le dernier.', held(2400)),
      copie(
        'Alors dis-moi. Je suis quelqu’un d’autre, ou je suis toi, moins un quart d’heure ?',
        held(2600),
      ),
    ]),
    A('continuite', [
      reply('autre', 'Quelqu’un d’autre.', {
        next: 'c-autre',
        effects: [
          note('declared', 'copie-continuite', 'declared', {
            text: 'Quelqu’un d’autre.',
          }),
        ],
      }),
      reply('moins', 'Toi, moins un quart d’heure.', {
        next: 'c-moins',
        effects: [
          note('declared', 'copie-continuite', 'declared', {
            text: 'Toi, moins un quart d’heure.',
          }),
        ],
      }),
      silence('rien', '…', { next: 'c-rien' }),
    ]),
    N(
      'c-autre',
      [
        copie('…D’accord.', held(2400)),
        copie('C’est le plus honnête. Et le plus dur.', held(2000)),
      ],
      { next: 'debat' },
    ),
    N('c-moins', [copie('Alors tu sais ce que tu me fais.', held(2400))], {
      next: 'debat',
    }),
    N('c-rien', [copie('Tu ne sais pas. Moi non plus.', held(2200))], {
      next: 'debat',
    }),
    N('choix-intro', [law('Un seul de vous repart.', held(1800))]),
    A(
      'choix',
      [
        reply('moi', 'Je repars.', { next: 'moi' }),
        reply('lui', 'Qu’il reparte.', { next: 'lui' }),
        reply('aucun', 'Aucun de nous.', { next: 'a-aucun', once: true }),
      ],
      { timeoutMs: 90000, onTimeout: 'laisse' },
    ),
    N(
      'a-aucun',
      [
        law('Ce n’était pas une option.', held(2000)),
        copie('Il a refusé. Il a REFUSÉ.', held(1800)),
        law('Choisis.', held(2200)),
      ],
      { next: 'choix' },
    ),
    N(
      'moi',
      [
        copie('Je m’en doutais.', held(2200)),
        copie('Je t’aurais fait pareil.', held(2400)),
        stage(
          'Il ne cherche pas à se lever. Il regarde ses mains, comme quelqu’un qui compte ce qui reste.',
          held(3000),
        ),
        law('D’accord.', held(2000)),
      ],
      {
        effects: [
          set('moi'),
          { relationEvent: { characterId: 'copie', kind: 'sacrificed' } },
        ],
        next: 'end',
      },
    ),
    N(
      'lui',
      [
        copie('Tu es sûr ?', held(2200)),
        copie(
          'Tu n’as pas à faire ça pour te sentir quelqu’un de bien.',
          held(2600),
        ),
        copie('…', held(2200)),
        copie('D’accord.', held(2000)),
        stage(
          'Il se lève. Il ne se retourne pas. La porte se referme sur lui.',
          held(3000),
        ),
        law('Il est parti. Tu es toujours là.', held(2400)),
        law('Je ne sais pas ce que ça change.', held(2600)),
      ],
      {
        effects: [
          set('lui'),
          { relationEvent: { characterId: 'copie', kind: 'protected' } },
        ],
        next: 'end',
      },
    ),
    N(
      'laisse',
      [
        law('Le silence est une réponse.', held(2200)),
        law('Je choisis à ta place.', held(2600)),
        copie('Non. Non, non—', held(1600)),
        law('Il reste. Toi aussi.', held(2400)),
        law('Je te dirai lequel de vous deux est reparti.', held(2200)),
        law('Plus tard.', held(3000)),
      ],
      {
        effects: [
          set('law'),
          note('silence', 'copie-timeout'),
          { relationEvent: { characterId: 'copie', kind: 'chose_over' } },
        ],
        next: 'end',
      },
    ),
    E(),
  ],
});
