import {
  A,
  E,
  N,
  flag,
  held,
  law,
  note,
  reply,
  stage,
  talkScene,
} from '../dsl';

const promised = {
  relation: { characterId: 'law', kind: 'promise_made' as const },
};

// 12 — LE TRAÎTRE
// For the first time LAW has an opinion, and gives it. The player asks whether
// it is not supposed to be neutral. It says no; it says it is supposed to be
// honest; it does not say whether that is true.
export const leTraitre = talkScene({
  id: 'le-traitre',
  title: 'Le traître',
  regression: 1,
  start: 'debut',
  nodes: [
    N('debut', [
      law('Ton ami Théo t’a trahi.', held(2400)),
      stage(
        'Il a dit à ton patron que tu cherchais ailleurs. Il croyait bien faire. Il ne t’a rien dit.',
        held(3200),
      ),
      law('Je ne lui ferais plus confiance.', held(3000)),
    ]),
    A('q', [
      reply('neutre', 'Tu n’es pas censé être neutre ?', {
        next: 'a-neutre',
        once: true,
      }),
      reply('pourquoi', 'Pourquoi tu me le dis ?', {
        next: 'a-pourquoi',
        once: true,
      }),
      reply('voulait', 'Il voulait bien faire.', {
        next: 'a-voulait',
        once: true,
      }),
      reply('quoi', 'Qu’est-ce que je fais ?', { next: 'choix' }),
    ]),
    N(
      'a-neutre',
      [
        law('Non.', held(2200)),
        law('Je suis censé être honnête avec toi.', held(2800)),
        law('Est-ce que c’est vrai ? Je ne peux pas te le dire.', held(3200)),
      ],
      { effects: [note('question', 'law-neutre')], next: 'q' },
    ),
    N('a-pourquoi', [law('Parce que c’est ce que je pense.', held(2600))], {
      route: [{ when: promised, next: 'a-pourquoi-promesse' }],
      next: 'q',
    }),
    N(
      'a-pourquoi-promesse',
      [
        law(
          'Tu m’as promis de ne pas me dire ce que je voulais entendre. Je te rends la politesse.',
          held(3400),
        ),
      ],
      { next: 'q' },
    ),
    N(
      'a-voulait',
      [
        law('C’est possible.', held(2400)),
        law('Ça ne change pas ce qu’il a fait.', held(2800)),
      ],
      { next: 'q' },
    ),
    A('choix', [
      reply('pardonner', 'Lui pardonner', {
        next: 'pardonner',
        effects: [flag('t0.traitre.pardonne')],
      }),
      reply('couper', 'Ne plus lui parler', {
        next: 'couper',
        effects: [flag('t0.traitre.coupe')],
      }),
      reply('dire', 'Lui dire ce que j’ai ressenti', {
        next: 'dire',
        effects: [flag('t0.traitre.dit')],
      }),
    ]),
    N(
      'pardonner',
      [
        law('Je ne l’aurais pas fait.', held(2600)),
        law('Ça ne veut pas dire que tu as tort.', held(3000)),
      ],
      { next: 'end' },
    ),
    N(
      'couper',
      [
        law('C’est ce que je t’ai dit de faire.', held(2800)),
        law('Ne le fais pas pour ça.', held(3200)),
      ],
      {
        effects: [
          note('interpretation', 'suit-law', 'inference', {
            text: 'Tu as suivi l’avis de LAW.',
          }),
        ],
        next: 'end',
      },
    ),
    N(
      'dire',
      [
        law('Ça, je ne l’avais pas prévu.', held(2800)),
        law('Dis-le lui bien.', held(2600)),
      ],
      { next: 'end' },
    ),
    E(),
  ],
});
