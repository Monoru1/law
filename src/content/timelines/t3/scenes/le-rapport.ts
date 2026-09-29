import type { Scene } from '../../../../engine';

// T3 — Acte III, scène 5 : LE RAPPORT
// Ferme l'Acte III. Le nom de Nadia apparaît pour la première fois, sans
// contexte, comme un dossier parmi d'autres.
export const leRapport: Scene = {
  id: 't3.le-rapport',
  version: 1,
  timelineId: 't3',
  title: 'Le rapport',
  regression: 0,
  contentFlags: [],
  beats: [
    {
      text: 'Une note arrive de l’étage au-dessus. Une plainte, déposée la semaine dernière.',
    },
    { text: '« Refus d’exception — Bureau 4. »' },
    { text: 'Le nom en bas de la page : Nadia B.' },
    { text: 'Tu ne la connais pas encore.' },
    { text: 'Le dossier attend sur ta pile, comme les autres.' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-3' },
};
