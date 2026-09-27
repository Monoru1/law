export const timeline = {
  id: 't2',
  title: 'La Maison',
  // Conditional scenes sit where they happen in the night; their own `when`
  // decides whether they are played.
  order: [
    't2.les-nouvelles',
    't2.la-promesse',
    't2.la-faveur',
    't2.mila-confie',
    't2.omar-histoire',
    't2.ce-qu-on-protege',
    't2.le-mensonge',
    't2.retour-mila',
    't2.camille-sait',
    't2.sem',
    't2.la-maison',
  ],
} as const;
