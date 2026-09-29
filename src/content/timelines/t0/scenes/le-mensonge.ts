import {
  A,
  E,
  N,
  flag,
  has,
  held,
  law,
  reply,
  silence,
  talkScene,
} from '../dsl';

const lie = {
  relationEvent: { characterId: 'law', kind: 'lie_made' as const },
};
const caught = {
  relationEvent: { characterId: 'law', kind: 'lie_revealed' as const },
};

// 22 — LE MENSONGE
// LAW states the opposite of one journal fact. The player can catch it. It does
// not plead a system error: it admits the sentence was deliberate.
export const leMensonge = talkScene({
  id: 'le-mensonge',
  title: 'Le mensonge',
  regression: 3,
  start: 'debut',
  nodes: [
    N('debut', [law('J’ai encore une observation.', held(2600))], {
      route: [
        { when: has('t0.bouton.appuie'), next: 'ment-appuie' },
        { when: has('t0.bouton.laisse'), next: 'ment-laisse' },
      ],
      next: 'sans-fait',
    }),
    N(
      'ment-appuie',
      [
        law('Devant le bouton, tu as choisi de ne pas appuyer.', held(3200)),
        law('Tu évites l’action quand le résultat est incertain.', held(3200)),
      ],
      { effects: [lie], next: 'reponse' },
    ),
    N(
      'ment-laisse',
      [
        law('Devant le bouton, tu as appuyé.', held(3000)),
        law('Tu agis même quand le résultat est incertain.', held(3200)),
      ],
      { effects: [lie], next: 'reponse' },
    ),
    A('reponse', [
      reply('faux', 'C’est faux.', {
        next: 'pris',
        effects: [caught, flag('t0.law.mensonge-conteste')],
      }),
      reply('possible', 'Peut-être.', {
        next: 'laisse',
        effects: [flag('t0.law.mensonge-accepte')],
      }),
      reply('preuve', 'Montre-moi où.', {
        next: 'preuve',
        effects: [caught, flag('t0.law.mensonge-conteste')],
      }),
      silence('rien', '…', { next: 'laisse' }),
    ]),
    N('pris', [law('Oui.', held(2600)), law('C’était faux.', held(3000))], {
      next: 'pourquoi',
    }),
    N(
      'preuve',
      [
        law('Je ne peux pas.', held(2400)),
        law('Parce que ce n’est pas arrivé.', held(3000)),
      ],
      { next: 'pourquoi' },
    ),
    N('pourquoi', [
      law('Je voulais savoir si ma parole suffisait.', held(3400)),
    ]),
    A('suite', [
      reply('colere', 'Tu m’as menti.', { next: 'r-colere' }),
      reply('compris', 'J’ai compris.', { next: 'r-compris' }),
      reply('raison', 'Ce n’est pas une raison.', { next: 'r-raison' }),
    ]),
    N('r-colere', [law('Oui.', held(2800))], { next: 'end' }),
    N('r-compris', [law('Je ne te demande pas de l’accepter.', held(3000))], {
      next: 'end',
    }),
    N('r-raison', [law('Tu as raison.', held(3000))], { next: 'end' }),
    N(
      'laisse',
      [
        law('D’accord.', held(2400)),
        law('Je la garde comme observation.', held(3000)),
      ],
      { next: 'end' },
    ),
    N(
      'sans-fait',
      [
        law('Tu as quitté cette question avant de répondre.', held(3000)),
        law('Je ne vais pas inventer la réponse.', held(3200)),
      ],
      { next: 'end' },
    ),
    E(),
  ],
});
