import type { Scene } from '../../../../engine';

export const coda: Scene = {
  id: 't1.coda',
  version: 2,
  timelineId: 't1',
  title: 'La pièce',
  regression: 3,
  contentFlags: ['death'],
  beats: [
    {
      text: 'Un bouton que tu as pressé.',
      requires: { flag: 'pressed_button' },
    },
    {
      text: 'Un bouton que tu n’as pas pressé.',
      requires: { not: { flag: 'pressed_button' } },
    },
    {
      text: 'Dix mille euros.',
      requires: { flag: 'took_money' },
    },
    {
      text: 'Un homme de cinquante-deux ans qui a gardé son poste.',
      requires: { not: { flag: 'took_money' } },
    },
    {
      text: 'Des années données.',
      requires: { var: 'lifeYearsGiven', op: '>', value: 0 },
    },
    {
      text: 'Un dossier refermé.',
      requires: { flag: 'chose_probabilite' },
    },
    {
      text: 'Un homme qui attend encore.',
      requires: { flag: 'chose_attente' },
    },
    {
      text: 'Un protocole qui continue.',
      requires: { flag: 'protocole_continue' },
    },
    {
      text: 'Une chambre 14 vide.',
      requires: { flag: 'protocole_arrete' },
    },
    { text: '—', pauseMs: 2000 },
    { text: 'Ils n’avaient pas de nom.' },
    { text: '—', pauseMs: 2400 },
    { text: 'Les prochains en auront.' },
  ],
  input: {
    kind: 'choice',
    confirm: 'tap',
    options: [{ id: 'sortir', label: 'Sortir de la pièce' }],
  },
  outcomes: [{ when: { any: true }, beats: [] }],
};
