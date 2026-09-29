import { E, N, W, held, law, note, talkScene } from '../dsl';

// 23 — TA LOI
// No menu of principles. The sentence is the player's and is frozen into the
// journal as a declared law. Declining remains a valid answer.
export const taLoi = talkScene({
  id: 'ta-loi',
  title: 'Ta loi',
  regression: 3,
  start: 'debut',
  nodes: [
    N('debut', [
      law('Tu as répondu à mes situations.', held(2800)),
      law('Maintenant, pas de situation.', held(2600)),
      law('Écris une règle que tu refuses de violer.', held(3200)),
    ]),
    W('ecrire', 'Ta loi.', 'Je refuse de…', {
      maxLength: 280,
      next: 'ecrite',
      declineNext: 'refuse',
      declineLabel: 'Ne pas écrire de loi',
      effects: [
        { declareLaw: { principleId: 'P_DECLARED' } },
        note('declared', 't0-loi-declaree', 'declared', { fromText: true }),
      ],
    }),
    N(
      'ecrite',
      [
        law('« {{note:t0-loi-declaree|…}} »', held(3400)),
        law('Ce sont tes mots.', held(2800)),
        law('Ils sortiront d’ici avec toi.', held(3200)),
      ],
      { next: 'end' },
    ),
    N(
      'refuse',
      [
        law('D’accord.', held(2600)),
        law('Ne pas écrire est aussi une limite.', held(3000)),
      ],
      { next: 'end' },
    ),
    E(),
  ],
});
