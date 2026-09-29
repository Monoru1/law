import type { Scene } from '../../../../engine';
import { law, held, reply, silence, stage } from '../dsl';

const many = { var: 't0.q-innocent', op: '>=', value: 2 } as const;
const one = { var: 't0.q-innocent', op: '==', value: 1 } as const;

// 03 — CE QUI EST NOTÉ
// Nothing is asked. LAW lets a silence stand, then says what it wrote down:
// first a count, which is a fact, then a reading, which is only LAW's. The
// player can accept it, nuance it or refuse it, and LAW keeps which.
export const ceQuiEstNote: Scene = {
  id: 't0.ce-qui-est-note',
  version: 1,
  timelineId: 't0',
  title: 'Ce qui est noté',
  regression: 0,
  contentFlags: [],
  audio: { ambience: 'room' },
  beats: [],
  input: {
    kind: 'talk',
    talk: {
      start: 'silence',
      nodes: [
        {
          id: 'silence',
          lines: [stage('LAW ne dit rien.', held(1600))],
        },
        {
          id: 'attente',
          ask: {
            timeoutMs: 14000,
            onTimeout: 'attend',
            replies: [
              reply('parle', 'Tu ne dis rien ?', { next: 'r-parle' }),
              { ...silence('rien', '…'), next: 'r-rien' },
            ],
          },
        },
        {
          id: 'r-parle',
          lines: [law('Non.', held(2200)), law('Je regardais.', held(1800))],
          next: 'obs',
        },
        {
          id: 'r-rien',
          lines: [law('D’accord.', held(2000))],
          next: 'obs',
        },
        {
          id: 'attend',
          effects: [
            {
              note: { kind: 'silence', tags: ['attend-note'], status: 'fact' },
            },
          ],
          lines: [law('Tu sais attendre.', held(2200))],
          next: 'obs',
        },
        {
          id: 'obs',
          effects: [
            {
              note: {
                kind: 'curiosity',
                tags: ['questions-innocent'],
                status: 'observation',
              },
            },
          ],
          lines: [
            law('Tu n’as posé aucune question avant de décider.', {
              pauseMs: 1800,
              requires: { not: { var: 't0.q-innocent', op: '>', value: 0 } },
            }),
            law('Tu as posé une question avant de décider.', {
              pauseMs: 1800,
              requires: one,
            }),
            law(
              'Tu as posé {{var:t0.q-innocent|0}} questions avant de décider.',
              { pauseMs: 1800, requires: many },
            ),
            law('Je le note.', held(1800)),
          ],
          next: 'lecture',
        },
        {
          id: 'lecture',
          effects: [
            {
              if: many,
              then: [
                {
                  note: {
                    kind: 'interpretation',
                    status: 'inference',
                    tags: ['lecture-questions'],
                    text: 'Tu sembles vouloir savoir avant d’agir.',
                  },
                },
              ],
            },
            {
              if: { not: many },
              then: [
                {
                  note: {
                    kind: 'interpretation',
                    status: 'inference',
                    tags: ['lecture-questions'],
                    text: 'Tu sembles décider vite.',
                  },
                },
              ],
            },
          ],
          lines: [
            law('Tu sembles vouloir savoir avant d’agir.', {
              pauseMs: 2000,
              requires: many,
            }),
            law('Tu sembles décider vite.', {
              pauseMs: 2000,
              requires: { not: many },
            }),
            law('C’est ce que je lis. Je peux me tromper.', held(1800)),
          ],
        },
        {
          id: 'lecture-ask',
          ask: {
            replies: [
              reply('juste', 'C’est assez juste.', {
                next: 'l-juste',
                effects: [
                  { stance: { tag: 'lecture-questions', stance: 'accepted' } },
                ],
              }),
              reply('nuance', 'Pas toujours.', {
                next: 'l-nuance',
                effects: [
                  { stance: { tag: 'lecture-questions', stance: 'nuanced' } },
                ],
              }),
              reply('faux', 'Tu n’en sais rien.', {
                next: 'l-faux',
                effects: [
                  { stance: { tag: 'lecture-questions', stance: 'refused' } },
                ],
              }),
            ],
          },
        },
        { id: 'l-juste', lines: [law('D’accord.', held(1600))], next: 'fin' },
        { id: 'l-nuance', lines: [law('Quand pas ?', held(1200))] },
        {
          id: 'l-quand',
          write: {
            prompt: 'Dis-le comme tu veux.',
            placeholder: 'Quand ce n’est pas vrai',
            maxLength: 280,
            declineLabel: 'Je ne sais pas',
            next: 'l-note',
            declineNext: 'fin',
            effects: [
              {
                note: {
                  kind: 'quote',
                  tags: ['lecture-questions-nuance'],
                  status: 'fact',
                  fromText: true,
                },
              },
            ],
          },
        },
        {
          id: 'l-note',
          lines: [law('Je le garde.', held(1800))],
          next: 'fin',
        },
        {
          id: 'l-faux',
          lines: [
            law('Non.', held(1800)),
            law(
              'Je lis ce qui s’est passé. Je ne sais pas pourquoi.',
              held(2200),
            ),
            law('Je le garde comme une hypothèse.', held(1800)),
          ],
          next: 'fin',
        },
        {
          id: 'fin',
          lines: [law('Continuons.', held(1800))],
          end: 'suite',
        },
      ],
    },
  },
  outcomes: [{ when: { optionId: 'suite' }, beats: [] }],
};
