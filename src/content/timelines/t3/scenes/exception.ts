import type { Scene } from '../../../../engine';

// T3 — Acte IV, scène 3 : L'EXCEPTION
// N'apparaît que si l'exception a été envisagée. Aucune réponse moralement
// "correcte" : accorder crée un précédent, refuser referme une porte ouverte.
export const exception: Scene = {
  id: 't3.exception',
  version: 2,
  timelineId: 't3',
  title: 'L’exception',
  regression: 1,
  contentFlags: [],
  when: { flag: 'nadia-exception-envisagee' },
  beats: [
    {
      text: 'Une exception n’existe nulle part dans le règlement du bureau 4.',
    },
    {
      text: 'Tu peux l’écrire quand même. Personne ne t’en empêche. Personne ne te couvrira non plus.',
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'accorder', label: 'Accorder l’exception' },
      { id: 'refuser-finalement', label: 'Refuser, finalement' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'accorder' },
      beats: [
        { text: 'Tu écris une ligne que le règlement ne prévoit pas.' },
        { text: 'Nadia obtient ce qu’elle est venue chercher.' },
      ],
      // Only recorded against a rule that actually exists: an unlikely
      // skipped La Règle leaves nothing enacted to except.
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
            { exceptionGranted: { ruleId: 'attribution', personId: 'nadia' } },
          ],
        },
        { setFlag: 'nadia-exception-accordee' },
      ],
      fact: 'Tu as accordé une exception au dossier de Nadia.',
    },
    {
      when: { optionId: 'refuser-finalement' },
      beats: [
        { text: 'Tu reposes le stylo. « Je ne peux pas. »' },
        { text: 'Elle se lève sans un mot de plus.' },
      ],
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
        { setFlag: 'nadia-exception-refusee' },
      ],
      fact: 'Tu as finalement refusé l’exception pour Nadia.',
    },
  ],
  audio: { ambience: 'act-4' },
};
