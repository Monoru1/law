import type { Scene } from '../../../../engine';

// T3 — Acte VI, scène 4 : LE REGISTRE
// Dernier choix véritable. Aucune révision n'efface l'histoire — la
// primitive de règle garantit déjà cette propriété au niveau du moteur.
export const leRegistre: Scene = {
  id: 't3.le-registre',
  version: 2,
  timelineId: 't3',
  title: 'Le registre',
  regression: 2,
  contentFlags: [],
  beats: [
    {
      text: 'Une dernière page. « Registre du bureau — maintenir, réviser, ou laisser. »',
    },
  ],
  input: {
    kind: 'choice',
    confirm: 'tap',
    options: [
      { id: 'maintenir', label: 'Maintenir' },
      { id: 'reviser', label: 'Réviser' },
      { id: 'laisser', label: 'Laisser' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'maintenir' },
      beats: [{ text: 'Tu coches la case. Rien ne change.' }],
      fact: 'Tu as maintenu le registre du bureau tel quel.',
    },
    {
      when: { optionId: 'reviser' },
      beats: [
        { text: 'Tu écris une note en marge. La prochaine personne la lira.' },
      ],
      // Only recorded against a rule that actually exists: an unlikely
      // skipped La Règle leaves nothing enacted to revise.
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
              ruleRevised: {
                ruleId: 'attribution',
                criterionId: 'a-revoir',
              },
            },
          ],
        },
      ],
      fact: 'Tu as ouvert une révision du registre du bureau.',
    },
    {
      when: { optionId: 'laisser' },
      beats: [
        { text: 'Tu reposes la page sans rien cocher. Elle restera ainsi.' },
      ],
      effects: [{ setFlag: 'registre-laisse' }],
      fact: 'Tu as laissé le registre du bureau tel quel, sans le maintenir explicitement.',
    },
  ],
  audio: { ambience: 'act-6' },
};
