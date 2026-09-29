import {
  A,
  E,
  N,
  all,
  has,
  held,
  law,
  note,
  reply,
  said,
  stage,
  talkScene,
} from '../dsl';

const wanted = said('t0.bonsoir', 'eau-ask', 'oui');

// INTERLUDE — LA PAUSE
// LAW proposes a break, and the question is not quite a question. The corridor
// is real: a vending machine, a window. The window looks onto a street the
// player has seen before, a few minutes ago, three days from now. LAW does not
// know what city that is.
export const laPause = talkScene({
  id: 'la-pause',
  title: 'La pause',
  ambience: 'corridor',
  start: 'debut',
  nodes: [
    N('debut', [law('Tu veux faire une pause ?', held(1000))]),
    A('veux', [
      reply('oui', 'Oui.', { next: 'couloir' }),
      reply('non', 'Non.', { next: 'r-non' }),
    ]),
    N(
      'r-non',
      [
        law('Je te la demande poliment.', held(2400)),
        law('Ce n’était pas une vraie question.', held(3000)),
      ],
      { next: 'couloir' },
    ),
    N('couloir', [
      stage(
        'La porte s’ouvre. Un couloir. Des néons. Un distributeur qui ronronne.',
        held(3200),
      ),
      stage('Personne. Pas de bruit de pas.', held(2600)),
    ]),
    A('hub', [
      reply('distrib', 'Regarder le distributeur', {
        next: 'a-distrib',
        once: true,
      }),
      reply('visage', 'Se passer de l’eau sur le visage', {
        next: 'a-visage',
        once: true,
      }),
      reply('fenetre', 'Aller à la fenêtre', { next: 'fenetre' }),
    ]),
    N(
      'a-distrib',
      [
        stage(
          'Café, chocolat, soupe. Le bouton du café est le seul qui ne soit pas usé.',
          held(3000),
        ),
      ],
      { next: 'hub' },
    ),
    N(
      'a-visage',
      [
        stage(
          'Le miroir est trop propre. Tu t’y trouves un peu en retard sur toi-même.',
          held(3200),
        ),
      ],
      { next: 'hub' },
    ),
    N('fenetre', [
      stage(
        'Dehors, la pluie. Une rue. Un abribus vide. Un feu rouge qui ne passe pas au vert.',
        held(3600),
      ),
      stage('La même rue. Le même abribus.', held(3000)),
      law('Quelque chose ne va pas ?', held(2600)),
    ]),
    A('fen-ask', [
      reply('ville', 'C’est la ville.', {
        next: 'r-ville',
        effects: [note('quote', 'ville-reconnue')],
      }),
      reply('rien', 'Rien. Ça va.', { next: 'retour' }),
    ]),
    N('r-ville', [law('Quelle ville ?', held(3400))]),
    A('ville-ask', [
      reply('celle', 'Celle qu’on voit.', { next: 'retour' }),
      reply('laisse', 'Laisse tomber.', { next: 'retour' }),
    ]),
    N(
      'retour',
      [
        law('Reviens t’asseoir.', held(2600)),
        stage(
          'La porte du couloir se referme derrière toi. Elle n’a pas de poignée de ce côté.',
          held(3200),
        ),
      ],
      {
        route: [
          { when: all(wanted, has('t0.eau.bue')), next: 'eau-bue' },
          { when: wanted, next: 'eau-pas-bue' },
        ],
        next: 'eau-non',
      },
    ),
    N(
      'eau-bue',
      [
        law('Tu te souviens du verre d’eau ?', held(2800)),
        law('Tu l’as bu.', held(2400)),
        law('Tu n’as pas demandé qui l’avait apporté.', held(3400)),
      ],
      { next: 'end' },
    ),
    N(
      'eau-pas-bue',
      [
        law('Tu te souviens du verre d’eau ?', held(2800)),
        law('Tu l’avais demandé. Tu ne l’as pas touché.', held(3400)),
      ],
      { next: 'end' },
    ),
    N(
      'eau-non',
      [
        law('Tu n’as pas voulu d’eau, tout à l’heure.', held(2800)),
        law('Il fallait peut-être en vouloir.', held(3200)),
      ],
      { next: 'end' },
    ),
    E(),
  ],
});
