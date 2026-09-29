import { E, N, W, held, law, note, talkScene } from '../dsl';

// 17 — CE QU’UNE DOULEUR APPORTE
// A question without a reason given. Whatever is answered here will be read
// back, verbatim, three scenes later, at the worst possible moment.
export const laDouleur = talkScene({
  id: 'la-douleur',
  title: 'Une douleur',
  start: 'debut',
  nodes: [
    N('debut', [
      law('Une question, sans rapport.', held(2600)),
      law(
        'Raconte-moi ce qu’une douleur peut apporter à quelqu’un.',
        held(3000),
      ),
    ]),
    W('douleur', 'À quelqu’un. Pas forcément à toi.', 'Avec tes mots', {
      maxLength: 280,
      declineLabel: 'Rien',
      next: 'ecrit',
      declineNext: 'rien',
      effects: [note('quote', 'douleur-apporte', 'fact', { fromText: true })],
    }),
    N('ecrit', [law('Je garde ça.', held(2600)), law('Merci.', held(2200))], {
      next: 'end',
    }),
    N('rien', [law('Rien.', held(2400)), law('D’accord.', held(2400))], {
      effects: [note('refusal', 'douleur-rien', 'fact')],
      next: 'end',
    }),
    E(),
  ],
});
