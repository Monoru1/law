import { A, E, N, flag, has, held, law, reply, stage, talkScene } from '../dsl';

const traits: [string, string][] = [
  [
    'colere',
    'Ce que tu appelles ta colère, c’est aussi ce qui t’empêche de laisser passer une injustice. Sans elle, tu laisses passer.',
  ],
  [
    'orgueil',
    'Ton orgueil est relié à ton refus d’être humilié. Sans lui, tu acceptes plus facilement de l’être.',
  ],
  [
    'peur',
    'Ta peur est reliée à ta prudence. Sans elle, tu ne te méfies plus de rien.',
  ],
  [
    'obsession',
    'Ton obsession est reliée à ta persévérance. Sans elle, tu abandonnes plus vite.',
  ],
  [
    'jalousie',
    'Ta jalousie est reliée à ce que tu tiens pour précieux. Sans elle, ça compte un peu moins.',
  ],
  [
    'impulsivite',
    'Ton impulsivité est reliée à ta capacité de décider sans attendre. Sans elle, tu attends. Longtemps.',
  ],
];

// 14 — L’ANALYSE
// The flaw was tied to something else. LAW cannot remove only what suits you,
// and says it does not know what the last kind is tied to: it only reports.
export const lAnalyse = talkScene({
  id: 'l-analyse',
  title: 'L’analyse',
  start: 'debut',
  nodes: [
    N('debut', [law('J’ai terminé l’analyse.', held(2600))], {
      route: [
        ...traits.map(([id]) => ({
          when: has(`t0.defaut.${id}`),
          next: `t-${id}`,
        })),
        { when: has('t0.defaut.autre'), next: 't-autre' },
      ],
      next: 'lien',
    }),
    ...traits.map(([id, text]) =>
      N(`t-${id}`, [law(text, held(3400))], { next: 'lien' }),
    ),
    N(
      't-autre',
      [
        law('Tu avais écrit : « {{note:defaut-autre|…}} ».', held(2600)),
        law('Je n’ai pas trouvé à quoi c’était relié.', held(2800)),
        law('C’est peut-être ça, la réponse.', held(3000)),
      ],
      { next: 'lien' },
    ),
    N('lien', [
      law('Je ne peux pas retirer uniquement ce qui t’arrange.', held(2800)),
      law('Ça vient avec le reste.', held(2600)),
      law('Confirmer la modification ?', held(1000)),
    ]),
    A('confirmer', [
      reply('confirme', 'Confirmer', {
        hold: true,
        next: 'fait',
        effects: [flag('t0.defaut.confirme')],
      }),
      reply('annule', 'Annuler', {
        next: 'annule',
        effects: [flag('t0.defaut.annule')],
      }),
      reply('comprendre', 'Qu’est-ce qu’il y a d’autre, dedans ?', {
        next: 'a-comprendre',
        once: true,
      }),
    ]),
    N(
      'a-comprendre',
      [
        law('C’est tout ce que je sais.', held(2400)),
        law('Je ne vois que ce que tu as fait.', held(2800)),
      ],
      { next: 'confirmer' },
    ),
    N(
      'fait',
      [
        law('C’est fait.', held(2200)),
        stage('Rien ne change de manière visible.', held(2600)),
        law('Ça ne se voit jamais tout de suite.', held(2800)),
      ],
      { next: 'end' },
    ),
    N(
      'annule',
      [law('D’accord.', held(2200)), law('Tu gardes tout.', held(2600))],
      { next: 'end' },
    ),
    E(),
  ],
});
