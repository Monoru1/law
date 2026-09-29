import { A, E, N, held, law, reply, silence, stage, talkScene } from '../dsl';

// 24 — LA PORTE
// A small final hub. LAW refuses cleanly, answers what it can, and lets the
// player leave without awarding a result.
export const laPorte = talkScene({
  id: 'la-porte',
  title: 'La porte',
  ambience: 'corridor',
  regression: 3,
  start: 'debut',
  nodes: [
    N('debut', [
      stage('La porte est ouverte.', held(2800)),
      law('Tu peux partir.', held(2600)),
      law('Tu peux encore me demander quelque chose.', held(2800)),
    ]),
    A('questions', [
      reply('qui', 'Qui es-tu ?', { next: 'r-qui', once: true }),
      reply('pourquoi', 'Pourquoi moi ?', { next: 'r-pourquoi', once: true }),
      reply('resultat', 'Quel est mon résultat ?', {
        next: 'r-resultat',
        once: true,
      }),
      reply('ville', 'Qu’est-ce qu’il y a dehors ?', {
        next: 'r-ville',
        once: true,
      }),
      reply('partir', 'Partir', { next: 'partir' }),
      silence('rien', 'Passer la porte', { next: 'partir' }),
    ]),
    N('r-qui', [law('Non.', held(2400)), law('Pas encore.', held(2600))], {
      next: 'questions',
    }),
    N('r-pourquoi', [law('Parce que tu es entré.', held(2800))], {
      next: 'questions',
    }),
    N(
      'r-resultat',
      [
        law('Je n’ai jamais dit qu’il y avait un résultat.', held(3400)),
        law('J’ai dit que je noterais.', held(2800)),
      ],
      { next: 'questions' },
    ),
    N(
      'r-ville',
      [law('Des gens qui ne te demanderont pas tes principes.', held(3200))],
      { next: 'questions' },
    ),
    N(
      'partir',
      [
        law('Une chose.', held(2400)),
        law(
          'Dehors, personne ne te dira quand la question commence.',
          held(3400),
        ),
      ],
      { next: 'end' },
    ),
    E(),
  ],
});
