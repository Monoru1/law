import {
  A,
  E,
  N,
  W,
  has,
  held,
  law,
  note,
  reply,
  stage,
  talkScene,
} from '../dsl';

// 16 — LA SECONDE CHANCE
// You are ten again, in your mother’s hallway, with everything you know. You
// may change one thing. LAW lets you write it before it says what it costs:
// people who are here now would probably not be.
export const laSecondeChance = talkScene({
  id: 'la-seconde-chance',
  title: 'La seconde chance',
  regression: 2,
  start: 'debut',
  nodes: [
    N('debut', [
      law('Tu as dix ans.', held(2600)),
      stage(
        'Le couloir de la maison de ta mère. Le carrelage est froid. Tu as dix ans, et tu sais tout ce que tu sais.',
        held(3600),
      ),
      law('Tu peux changer une chose.', held(2400)),
      law('Une seule. Celle que tu veux.', held(1000)),
    ]),
    W('chose', 'La première chose que tu changerais.', 'Avec tes mots', {
      maxLength: 200,
      declineLabel: 'Je ne changerais rien',
      next: 'ecrit',
      declineNext: 'rien',
      effects: [note('quote', 'seconde-chance', 'fact', { fromText: true })],
    }),
    N('ecrit', [law('« {{said:t0.la-seconde-chance/chose|…}} »', held(3000))], {
      next: 'cout',
    }),
    N('rien', [law('Rien.', held(2800))], { next: 'cout' }),
    N(
      'cout',
      [
        law('Je dois te dire une chose.', held(2600)),
        law(
          'Certaines personnes que tu connais n’existeraient probablement pas, dans cette version.',
          held(3400),
        ),
        law('Je ne sais pas lesquelles.', held(2800)),
      ],
      { route: [{ when: has('t0.vie.vue'), next: 'lou' }], next: 'inconnu' },
    ),
    N('lou', [law('Celle qui t’appelle papa, peut-être.', held(3800))], {
      next: 'toujours',
    }),
    N(
      'inconnu',
      [
        law(
          'Des gens que tu as rencontrés depuis. Tu ne peux pas savoir qui.',
          held(3400),
        ),
      ],
      { next: 'toujours' },
    ),
    N('toujours', [law('Toujours ?', held(1200))]),
    A('choix', [
      reply('oui', 'Oui.', {
        next: 'fin',
        effects: [
          note('declared', ['change-passe', 'change-oui'], 'declared', {
            text: 'Oui.',
          }),
        ],
      }),
      reply('non', 'Non.', {
        next: 'fin',
        effects: [
          note('declared', ['change-passe', 'change-non'], 'declared', {
            text: 'Non.',
          }),
        ],
      }),
      reply('sais-plus', 'Je ne sais plus.', { next: 'r-sais-plus' }),
    ]),
    N('r-sais-plus', [law('Merci de ne pas choisir vite.', held(3200))], {
      next: 'end',
    }),
    N('fin', [law('D’accord.', held(2800))], { next: 'end' }),
    E(),
  ],
});
