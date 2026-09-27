import type { Scene } from '../../../../engine/types';

// T2 — Scène 4 : MILA SE CONFIE
// Mila a dix-neuf ans : le dossier B. Qu'elle attende encore ou qu'elle ait été
// greffée dépend de la chambre froide, et change ce qu'elle confie.
export const milaConfie: Scene = {
  id: 't2.mila-confie',
  version: 2,
  timelineId: 't2',
  title: 'Mila se confie',
  regression: 1,
  contentFlags: ['maladie'],
  beats: [
    {
      text: 'Mila est assise dans l’escalier. Son téléphone à côté d’elle, écran vers le haut.',
    },
    { text: 'Dix-neuf ans. Sur une liste depuis un an.' },
    {
      text: '« L’an dernier, ils ont appelé. Une heure après, ils ont rappelé : finalement, non. »',
    },
    {
      text: '« C’est allé à un homme de quarante-trois ans. Trois enfants. On n’est pas censé savoir. »',
    },
    {
      text: '« J’ai arrêté un de mes traitements. Si mes analyses baissent, je passe devant. »',
    },
    { text: '« Ne le dis pas à Omar. »', style: 'emphasis' },
  ],
  variants: [
    {
      id: 'greffee',
      when: { chose: { sceneId: 't1.chambre-froide', optionId: 'dossier-b' } },
      beats: [
        {
          text: 'Mila est assise dans l’escalier. Elle a enlevé son col roulé.',
        },
        { text: 'Une cicatrice descend sous son tee-shirt.' },
        {
          text: '« Il y a un an, ils m’ont appelée à trois heures du matin. Quelqu’un avait décidé que ce serait moi. »',
        },
        {
          text: '« L’autre dossier, c’était un homme de quarante-trois ans. Trois enfants. »',
        },
        { text: '« Il est mort en novembre. »' },
        {
          text: '« Je voudrais écrire à ses enfants. Leur dire que c’est moi qui l’ai eu. »',
        },
        { text: '« Tu crois que je dois ? »', style: 'emphasis' },
      ],
      input: {
        kind: 'binary',
        options: [
          { id: 'ecrire', label: 'Lui dire d’écrire' },
          { id: 'se-taire', label: 'Lui dire de garder ça pour elle' },
        ],
      },
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      {
        id: 'garder',
        label: 'Garder son secret',
        // Someone else on the list moves back so that Mila moves forward.
        evidence: [{ principleId: 'P_INNOCENT', weight: -0.5 }],
      },
      { id: 'prevenir', label: 'Lui dire que tu vas prévenir Omar' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'garder' },
      beats: [
        { text: '« Merci. »' },
        {
          text: 'Elle monte le son de son téléphone. Il était déjà au maximum.',
        },
      ],
      effects: [
        { setFlag: 't2.secret-mila' },
        { relationEvent: { characterId: 'mila', kind: 'promise_made' } },
      ],
      fact: 'Dans l’escalier, tu as gardé le secret de Mila. Elle passera devant quelqu’un.',
    },
    {
      when: { optionId: 'prevenir' },
      beats: [
        { text: 'Mila te regarde longtemps.' },
        { text: '« Alors je ne t’ai rien dit. »' },
        { text: 'Elle monte dans sa chambre.' },
      ],
      effects: [
        { setFlag: 't2.omar-prevenu' },
        { relationEvent: { characterId: 'mila', kind: 'secret_told' } },
      ],
      fact: 'Dans l’escalier, tu as dit à Mila que tu préviendrais Omar.',
    },
    {
      when: { optionId: 'ecrire' },
      beats: [
        { text: 'Mila sort une feuille pliée de sa poche.' },
        { text: 'Elle l’avait déjà écrite.' },
        { text: 'Elle voulait juste que quelqu’un le dise.', style: 'whisper' },
      ],
      effects: [{ setFlag: 't2.lettre-mila' }],
      fact: 'Dans l’escalier, tu as dit à Mila d’écrire aux enfants.',
    },
    {
      when: { optionId: 'se-taire' },
      beats: [{ text: '« Ouais. »' }, { text: 'Elle remet son col roulé.' }],
      fact: 'Dans l’escalier, tu as dit à Mila de garder ça pour elle.',
    },
  ],
};
