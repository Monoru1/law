import type { Scene } from '../../../../engine';

// T3 — Acte IV, scène 2 : LE DOSSIER DE NADIA
// Sa situation entre en collision avec le critère écrit à la Règle. Choix
// pivot : appliquer strictement, ou ouvrir la porte à l'Acte suivant.
export const nadiaDossier: Scene = {
  id: 't3.nadia-dossier',
  version: 2,
  timelineId: 't3',
  title: 'Le dossier de Nadia',
  regression: 1,
  contentFlags: [],
  beats: [
    {
      text: 'Son dossier ne correspond à aucun des deux critères que tu appliques.',
    },
    {
      text: 'Trop récent pour l’ancienneté. Pas d’urgence déclarée pour l’urgence.',
    },
    {
      text: '« Je ne rentre dans aucune case, je sais », dit-elle. « On me l’a déjà dit. »',
    },
    {
      text: '« Je ne suis pas venue demander une faveur. Je suis venue demander qu’on me regarde une fois. »',
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'appliquer-strictement', label: 'Appliquer strictement la règle' },
      { id: 'envisager-exception', label: 'Envisager une exception' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'appliquer-strictement' },
      beats: [
        { text: '« La règle ne prévoit pas votre cas. »' },
        { text: 'Elle hoche la tête. Elle s’y attendait.' },
      ],
      // Only recorded against a rule that actually exists: an unlikely
      // skipped La Règle leaves nothing enacted to apply.
      effects: [
        {
          if: {
            any: [
              { rule: { ruleId: 'attribution', criterionId: 'anciennete' } },
              { rule: { ruleId: 'attribution', criterionId: 'urgence' } },
              { rule: { ruleId: 'attribution', criterionId: 'tirage' } },
            ],
          },
          then: [
            {
              ruleApplied: {
                ruleId: 'attribution',
                personId: 'nadia',
                outcome: 'refuse',
              },
            },
          ],
        },
      ],
      fact: 'Tu as appliqué strictement la règle au dossier de Nadia.',
    },
    {
      when: { optionId: 'envisager-exception' },
      beats: [
        { text: '« Laissez-moi vérifier ce que je peux faire. »' },
        { text: 'Elle ne remercie pas. Elle attend, comme avant.' },
      ],
      effects: [{ setFlag: 'nadia-exception-envisagee' }],
      fact: 'Tu as envisagé une exception pour le dossier de Nadia.',
    },
  ],
  audio: { ambience: 'act-4' },
};
