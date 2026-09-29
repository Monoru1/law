import type { Scene } from '../../../../engine';
import { femme, reply, silence, stage, held } from '../dsl';

// PROLOGUE — LA VILLE
// Six lines of rain and one woman. The player is recognised before knowing why.
// This scene is played again, exactly, at the end of the examination.
export const prologue: Scene = {
  id: 't0.prologue',
  version: 1,
  timelineId: 't0',
  title: 'La Ville',
  regression: 0,
  contentFlags: [],
  audio: { ambience: 'rain' },
  beats: [],
  input: {
    kind: 'talk',
    talk: {
      start: 'rue',
      nodes: [
        {
          id: 'rue',
          lines: [
            stage('La pluie.', held(1800)),
            stage('Un feu rouge qui ne passe jamais au vert.', held(1600)),
            stage(
              'Sous l’abribus, une femme. Elle regarde d’où tu viens.',
              held(1800),
            ),
            femme('Tu es revenu.', held(1600)),
          ],
          ask: {
            timeoutMs: 22000,
            onTimeout: 'r-rien',
            replies: [
              reply('connait', '« On se connaît ? »', {
                next: 'r-connait',
                effects: [{ setFlag: 't0.prologue.connait' }],
              }),
              reply('dou', '« Revenu d’où ? »', {
                next: 'r-dou',
                effects: [{ setFlag: 't0.prologue.dou' }],
              }),
              { ...silence('rien', 'Ne rien répondre'), next: 'r-rien' },
            ],
          },
        },
        {
          id: 'r-connait',
          lines: [femme('Pas encore.', held(1400))],
          next: 'regle',
        },
        {
          id: 'r-dou',
          lines: [
            femme(
              'Tu poseras une meilleure question la prochaine fois.',
              held(1400),
            ),
          ],
          next: 'regle',
        },
        {
          id: 'r-rien',
          effects: [
            {
              note: {
                kind: 'silence',
                tags: ['prologue-silence'],
                status: 'fact',
              },
            },
          ],
          lines: [
            femme('…', held(2200)),
            femme('Tu faisais déjà ça avant.', held(1400)),
          ],
          next: 'regle',
        },
        {
          id: 'regle',
          lines: [
            stage('Elle se lève.', held(1400)),
            femme('Cette fois…', held(1800)),
            femme(
              'essaie seulement de ne pas changer les règles quand elles commencent à te coûter quelque chose.',
              { style: 'emphasis', pauseMs: 2600 },
            ),
            stage(
              'Une voiture passe. Pendant une fraction de seconde, elle masque tout.',
              held(2000),
            ),
            stage('La femme a disparu.', held(2600)),
          ],
          end: 'suite',
        },
      ],
    },
  },
  outcomes: [
    {
      when: { optionId: 'suite' },
      beats: [{ text: '72 HEURES PLUS TÔT', style: 'emphasis', pauseMs: 2400 }],
      fact: 'Sous la pluie, une femme t’a dit que tu étais revenu.',
    },
  ],
};
