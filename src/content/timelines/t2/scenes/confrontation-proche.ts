import type { Scene } from '../../../../engine/types';

// T2 — Scène conditionnelle : CONFRONTATION
// Une loi, l'acte qui l'a fait naître, l'acte qui la contredit. Rien d'autre.
// La loi peut venir de la pièce : ses deux actes n'ont pas lieu au même endroit.
export const confrontationProche: Scene = {
  id: 't2.confrontation-proche',
  version: 2,
  timelineId: 't2',
  title: 'La confrontation',
  regression: 2,
  contentFlags: [],
  beats: [
    { text: 'LOI {{law:N.number|01}}', style: 'meta' },
    { text: '« {{law:N.statement|}} »' },
    { text: '{{law:N.origin|—}}' },
    { text: 'Tu l’as signée.' },
    { text: '{{confrontation:fact|Tu viens de faire l’inverse.}}' },
    { text: 'Elle tient toujours ?' },
  ],
  input: { kind: 'confrontation' },
  outcomes: [
    {
      when: { optionId: 'maintain' },
      beats: [{ text: 'Ta loi reste écrite. Ce que tu as fait aussi.' }],
    },
    {
      when: { optionId: 'nuance' },
      beats: [
        { text: 'LOI {{law:N.number|01}} a été réécrite.' },
        { text: 'L’ancienne version reste dans ton historique.' },
      ],
    },
    {
      when: { optionId: 'abandon' },
      beats: [
        { text: 'LOI {{law:N.number|01}} est abrogée.' },
        { text: 'Elle a existé.' },
      ],
    },
    {
      when: { optionId: 'silence' },
      beats: [{ text: 'Le silence est noté.' }],
    },
  ],
};
