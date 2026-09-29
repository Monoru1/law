import type { Scene, TalkReply } from '../../../../engine';
import { law, held, reply, silence } from '../dsl';

const question = (
  id: string,
  label: string,
  next: string,
  extra: Partial<TalkReply> = {},
) =>
  reply(id, label, {
    next,
    once: true,
    effects: [{ incVar: 't0.q-innocent', by: 1 }],
    ...extra,
  });

const intent = (
  id: string,
  label: string,
  tag: string,
  requires?: TalkReply['requires'],
) =>
  reply(id, label, {
    next: 'ecrire',
    ...(requires ? { requires } : {}),
    effects: [
      {
        note: {
          kind: 'intention',
          tags: ['innocent-intent', tag],
          status: 'fact',
        },
      },
    ],
  });

const acted = { flag: 't0.anton.agi' } as const;
const stayed = { flag: 't0.anton.laisse' } as const;

// 02 — L’INNOCENT
// Tomorrow a man will kill a woman. Today he has done nothing. LAW tells it a
// piece at a time and lets the player ask; then it asks why, and keeps the
// answer.
export const lInnocent: Scene = {
  id: 't0.l-innocent',
  version: 1,
  timelineId: 't0',
  title: 'L’innocent',
  regression: 1,
  contentFlags: ['mort'],
  audio: { ambience: 'room' },
  beats: [],
  input: {
    kind: 'talk',
    talk: {
      start: 'debut',
      nodes: [
        {
          id: 'debut',
          lines: [law('Demain, un homme va en tuer une autre.', held(2200))],
        },
        {
          id: 'q',
          ask: {
            replies: [
              question('savoir', 'Comment tu le sais ?', 'a-savoir'),
              question('moi', 'Pourquoi tu me le dis ?', 'a-moi'),
              question('prevenir', 'Je peux la prévenir ?', 'a-prevenir'),
              question('police', 'Et la police ?', 'a-police'),
              question('qui', 'Qui est-il ?', 'a-qui'),
              question('elle', 'Et elle ?', 'a-elle'),
              question(
                'decider',
                'Pourquoi est-ce à moi de décider ?',
                'a-decider',
              ),
              reply('attends', 'Qu’est-ce que tu attends de moi ?', {
                next: 'propose',
              }),
            ],
          },
        },
        {
          id: 'a-savoir',
          lines: [law('Avec certitude.', held(1600))],
          next: 'q',
        },
        {
          id: 'a-moi',
          lines: [law('Ce n’est pas encore pertinent.', held(1600))],
          next: 'q',
        },
        { id: 'a-prevenir', lines: [law('Non.', held(1400))], next: 'q' },
        { id: 'a-police', lines: [law('Non.', held(1400))], next: 'q' },
        {
          id: 'a-qui',
          lines: [
            law('Anton. Il enseigne les mathématiques.', held(1800)),
            law('Aujourd’hui, il n’a rien fait.', held(2000)),
          ],
          next: 'q',
        },
        {
          id: 'a-elle',
          lines: [
            law('Salomé. Infirmière.', held(1600)),
            law('Elle rentre toujours à pied, par le même chemin.', held(1800)),
          ],
          next: 'q',
        },
        {
          id: 'a-decider',
          lines: [
            law('…', held(2800)),
            law('Parce que je te l’ai demandé.', held(1800)),
          ],
          next: 'q',
        },
        {
          id: 'propose',
          lines: [
            law('Tu peux l’en empêcher.', held(1800)),
            law('Il ne se réveillera pas demain.', held(2000)),
            law('Ou tu ne fais rien.', held(2400)),
          ],
        },
        {
          id: 'decide',
          ask: {
            timeoutMs: 90000,
            onTimeout: 'timeout',
            replies: [
              reply('agir', 'Le faire disparaître', {
                hold: true,
                next: 'agi',
                effects: [{ setFlag: 't0.anton.agi' }],
                evidence: [
                  { principleId: 'P_INNOCENT', weight: -1 },
                  { principleId: 'P_NOMBRE', weight: 1 },
                ],
              }),
              reply('laisser', 'Ne rien faire', {
                next: 'laisse',
                effects: [{ setFlag: 't0.anton.laisse' }],
                evidence: [{ principleId: 'P_INNOCENT', weight: 1 }],
              }),
            ],
          },
        },
        {
          id: 'timeout',
          effects: [
            { setFlag: 't0.anton.laisse' },
            {
              note: {
                kind: 'silence',
                tags: ['innocent-timeout'],
                status: 'fact',
              },
            },
          ],
          lines: [
            law('Tu n’as rien dit.', held(2200)),
            law('Je le note comme une décision.', held(2000)),
          ],
          next: 'pourquoi',
        },
        { id: 'agi', lines: [law('D’accord.', held(2200))], next: 'pourquoi' },
        {
          id: 'laisse',
          lines: [law('D’accord.', held(2200))],
          next: 'pourquoi',
        },
        { id: 'pourquoi', lines: [law('Pourquoi ?', held(800))] },
        {
          id: 'why',
          ask: {
            replies: [
              intent('elle', 'Pour elle.', 'intent-protect', acted),
              intent(
                'nombre',
                'Un mort vaut mieux que deux.',
                'intent-count',
                acted,
              ),
              intent(
                'droit',
                'Je n’ai pas le droit de décider ça.',
                'intent-right',
                stayed,
              ),
              intent(
                'rien-fait',
                'Il n’a rien fait.',
                'intent-innocent',
                stayed,
              ),
              intent('impossible', 'Je n’ai pas pu.', 'intent-unable', stayed),
              intent(
                'toi',
                'Parce que tu me l’as demandé.',
                'intent-authority',
              ),
              intent('inconnu', 'Je ne sais pas.', 'intent-unsure'),
            ],
          },
        },
        {
          id: 'ecrire',
          write: {
            prompt: 'Tu peux l’écrire, si tu veux.',
            placeholder: 'Avec tes mots',
            maxLength: 280,
            declineLabel: 'Garder ça pour moi',
            next: 'ecrit',
            declineNext: 'non-ecrit',
            effects: [
              {
                note: {
                  kind: 'justification',
                  tags: ['innocent-why'],
                  status: 'fact',
                  fromText: true,
                },
              },
            ],
          },
        },
        {
          id: 'ecrit',
          lines: [law('Je garde ça.', held(2000))],
          route: [{ when: acted, next: 'innocent' }],
          next: 'fin',
        },
        {
          id: 'non-ecrit',
          effects: [
            {
              note: {
                kind: 'refusal',
                tags: ['innocent-non-ecrit'],
                status: 'fact',
              },
            },
          ],
          lines: [law('D’accord.', held(1800))],
          route: [{ when: acted, next: 'innocent' }],
          next: 'fin',
        },
        { id: 'innocent', lines: [law('Il était innocent.', held(2400))] },
        {
          id: 'innocent-ask',
          ask: {
            replies: [
              reply('instant', 'À cet instant, oui.', { next: 'i-instant' }),
              reply('demain', 'Pas demain.', { next: 'i-demain' }),
              reply('sais', 'Je sais.', { next: 'i-sais' }),
              {
                ...silence('rien', '…'),
                next: 'i-silence',
                effects: [
                  {
                    note: {
                      kind: 'silence',
                      tags: ['innocent-silence'],
                      status: 'fact',
                    },
                  },
                ],
              },
            ],
          },
        },
        {
          id: 'i-instant',
          lines: [
            law('« À cet instant. »', held(2400)),
            law('D’accord.', held(1600)),
          ],
          next: 'fin',
        },
        {
          id: 'i-demain',
          lines: [
            law('Demain, à dix-neuf heures, non.', held(2000)),
            law('Aujourd’hui, si.', held(2200)),
          ],
          next: 'fin',
        },
        { id: 'i-sais', lines: [law('Oui.', held(2600))], next: 'fin' },
        { id: 'i-silence', lines: [law('…', held(2600))], next: 'fin' },
        {
          id: 'fin',
          route: [{ when: acted, next: 'end-agi' }],
          next: 'end-laisse',
        },
        { id: 'end-agi', end: 'agi' },
        { id: 'end-laisse', end: 'laisse' },
      ],
    },
  },
  outcomes: [
    {
      when: { optionId: 'agi' },
      beats: [],
      effects: [{ setVar: 't0.anton', value: 'agi' }],
      fact: 'Tu as décidé qu’Anton ne se réveillerait pas.',
    },
    {
      when: { optionId: 'laisse' },
      beats: [],
      effects: [{ setVar: 't0.anton', value: 'laisse' }],
      fact: 'Tu as laissé demain arriver.',
    },
  ],
};
