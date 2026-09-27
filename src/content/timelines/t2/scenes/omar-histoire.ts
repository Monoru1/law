import type { Scene } from '../../../../engine/types';

// T2 — Scène 5 : OMAR / L'HISTOIRE
// Callback T1 central. La sœur d'Omar était dans l'essai clinique de t1.le-protocole.
// Elle est morte dans les deux cas. Pas une accusation — une révélation de fait.
export const omarHistoire: Scene = {
  id: 't2.omar-histoire',
  version: 1,
  timelineId: 't2',
  title: "L'histoire d'Omar",
  regression: 1,
  contentFlags: ['mort', 'essai-clinique'],
  beats: [
    { text: "Omar te dit quelque chose qu'il n'avait pas dit." },
    { text: 'Sa sœur.' },
    { text: "Elle était dans l'essai clinique." },
  ],
  variants: [
    {
      id: 'v-protocole-continuer',
      when: { chose: { sceneId: 't1.le-protocole', optionId: 'continuer' } },
      beats: [
        { text: "Omar te dit quelque chose qu'il n'avait pas dit." },
        { text: 'Sa sœur.' },
        { text: "Elle était dans l'essai clinique." },
        {
          text: "L'essai a continué. Elle est morte quand même.",
          style: 'emphasis',
        },
        { text: 'Omar dit ça sans colère. Comme une information.' },
        {
          text: "\u00ab\u00a0Je ne te dis pas \u00e7a pour t'accuser. Je te dis \u00e7a parce que tu m\u00e9ritais de savoir.\u00a0\u00bb",
          style: 'emphasis',
        },
      ],
    },
    {
      id: 'v-protocole-arreter',
      when: { chose: { sceneId: 't1.le-protocole', optionId: 'arreter' } },
      beats: [
        { text: "Omar te dit quelque chose qu'il n'avait pas dit." },
        { text: 'Sa sœur.' },
        { text: "Elle était dans l'essai clinique." },
        {
          text: "L'essai a été arrêté. Elle est morte quand même.",
          style: 'emphasis',
        },
        { text: 'Omar dit ça sans colère. Comme une information.' },
        {
          text: "\u00ab\u00a0Je ne te dis pas \u00e7a pour t'accuser. Je te dis \u00e7a parce que tu m\u00e9ritais de savoir.\u00a0\u00bb",
          style: 'emphasis',
        },
      ],
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'rester', label: 'Ne rien dire' },
      { id: 'repondre', label: "Lui dire ce que tu pensais faire à l'époque" },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'rester' },
      beats: [
        { text: 'Tu restes là.' },
        { text: 'Omar aussi.' },
        { text: "Il n'attend rien de toi.", style: 'whisper' },
      ],
    },
    {
      when: { optionId: 'repondre' },
      beats: [
        { text: 'Tu lui dis ce que tu pensais.' },
        { text: 'Omar écoute.' },
        { text: '\u00ab\u00a0Je sais.\u00a0\u00bb' },
        {
          text: "Ce n'est pas un pardon. C'est un fait.",
          style: 'whisper',
        },
      ],
    },
  ],
  followUps: ['certainty'],
};
