import { A, E, N, W, flag, held, law, note, reply, talkScene } from '../dsl';

const trait = (id: string, label: string) =>
  reply(id, label, {
    next: 'pourquoi',
    effects: [
      flag(`t0.defaut.${id}`),
      note('intention', ['defaut', `defaut-${id}`]),
    ],
  });

// 09 — UN DÉFAUT
// You may remove one flaw, for good. LAW asks which, and why, and says nothing
// of what it thinks. The analysis comes much later (t0.l-analyse), and is not
// what you expected.
export const unDefaut = talkScene({
  id: 'un-defaut',
  title: 'Un défaut',
  regression: 1,
  start: 'debut',
  nodes: [
    N('debut', [
      law('Tu peux supprimer un défaut.', held(2400)),
      law('Un seul. Définitivement.', held(2200)),
      law('Tu le choisis.', held(1000)),
    ]),
    A('choix', [
      trait('colere', 'La colère'),
      trait('orgueil', 'L’orgueil'),
      trait('peur', 'La peur'),
      trait('obsession', 'L’obsession'),
      trait('jalousie', 'La jalousie'),
      trait('impulsivite', 'L’impulsivité'),
      reply('autre', 'Autre chose', { next: 'autre' }),
    ]),
    W('autre', 'Ce que tu supprimerais.', 'Un mot, une phrase', {
      maxLength: 80,
      declineLabel: 'Je ne sais pas',
      next: 'pourquoi',
      declineNext: 'pourquoi',
      effects: [
        flag('t0.defaut.autre'),
        note('quote', 'defaut-autre', 'fact', { fromText: true }),
      ],
    }),
    N('pourquoi', [law('Pourquoi celui-là ?', held(900))]),
    W('pourquoi-ecrit', 'Dis-le comme tu veux.', 'Avec tes mots', {
      maxLength: 200,
      declineLabel: 'Je ne sais pas l’expliquer',
      next: 'ok',
      declineNext: 'non',
      effects: [
        note('justification', 'defaut-pourquoi', 'fact', { fromText: true }),
      ],
    }),
    N('ok', [law('Je garde ça.', held(2000))], { next: 'fin' }),
    N('non', [law('D’accord.', held(1800))], { next: 'fin' }),
    N(
      'fin',
      [
        law('Je vais faire l’analyse.', held(2200)),
        law('Ça prend du temps.', held(3000)),
      ],
      { next: 'end' },
    ),
    E(),
  ],
});
