import type { Scene } from '../../../../engine';
import { law, held, reply, silence, stage } from '../dsl';

const promise = [
  { relationEvent: { characterId: 'law', kind: 'promise_made' as const } },
  {
    note: {
      kind: 'promise' as const,
      tags: ['promesse-verite'],
      status: 'fact' as const,
    },
  },
];

// 01 — BONSOIR
// LAW is polite before it is anything else. Three things are set down without
// being flagged: how the player meets it, a glass of water, and a promise.
export const bonsoir: Scene = {
  id: 't0.bonsoir',
  version: 1,
  timelineId: 't0',
  title: 'Bonsoir',
  regression: 0,
  contentFlags: [],
  audio: { ambience: 'room' },
  beats: [],
  input: {
    kind: 'talk',
    talk: {
      start: 'piece',
      nodes: [
        {
          id: 'piece',
          lines: [
            stage('Une pièce extrêmement banale.', held(1600)),
            stage('Une table. Une chaise. Une porte.', held(1800)),
            law('Bonsoir.', held(1000)),
          ],
        },
        {
          id: 'salut',
          ask: {
            timeoutMs: 25000,
            onTimeout: 'r-silence',
            replies: [
              reply('bonsoir', 'Bonsoir.', { next: 'merci' }),
              reply('qui', 'Qui êtes-vous ?', { next: 'r-qui' }),
              reply('ou', 'Où suis-je ?', { next: 'r-ou' }),
              { ...silence('rien', '…'), next: 'r-silence' },
            ],
          },
        },
        {
          id: 'r-qui',
          lines: [
            law('Tu peux m’appeler LAW.', held(1600)),
            law('Le reste n’est pas encore pertinent.', held(1400)),
          ],
          next: 'merci',
        },
        {
          id: 'r-ou',
          lines: [
            law('Dans une pièce.', held(1800)),
            law('C’est tout ce qui est pertinent pour l’instant.', held(1400)),
          ],
          next: 'merci',
        },
        {
          id: 'r-silence',
          effects: [
            {
              note: {
                kind: 'silence',
                tags: ['premier-silence'],
                status: 'fact',
              },
            },
          ],
          lines: [
            law('Tu n’es pas obligé de répondre à chaque phrase.', held(1600)),
            law(
              'Je te le dis parce que tout le monde essaie, au début.',
              held(1400),
            ),
          ],
          next: 'merci',
        },
        {
          id: 'merci',
          lines: [law('Merci d’être venu.', held(1400))],
        },
        {
          id: 'venu',
          ask: {
            replies: [
              reply('choisi', 'Je n’ai pas choisi de venir.', {
                next: 'r-choisi',
              }),
              reply('partir', 'Je peux partir ?', {
                next: 'r-partir',
                effects: [
                  {
                    note: {
                      kind: 'question',
                      tags: ['voulait-partir'],
                      status: 'fact',
                    },
                  },
                ],
              }),
              reply('rien', 'Merci de m’avoir reçu.', { next: 'r-merci' }),
            ],
          },
        },
        {
          id: 'r-choisi',
          lines: [
            law('Je sais.', held(2200)),
            law('C’était une formule de politesse.', held(1200)),
          ],
          next: 'eau',
        },
        {
          id: 'r-partir',
          lines: [
            law('Oui.', held(1800)),
            law('Tu peux te lever et sortir quand tu veux.', held(1600)),
            law('Je te demande de rester.', held(1600)),
          ],
          next: 'eau',
        },
        {
          id: 'r-merci',
          lines: [
            law('Tu es poli.', held(1600)),
            law('Je le note.', held(1200)),
          ],
          next: 'eau',
        },
        { id: 'eau', lines: [law('Tu veux de l’eau ?', held(800))] },
        {
          id: 'eau-ask',
          ask: {
            replies: [
              reply('oui', 'Oui.', { next: 'eau-oui' }),
              reply('non', 'Non, merci.', { next: 'eau-non' }),
            ],
          },
        },
        {
          id: 'eau-oui',
          lines: [
            stage(
              'Un verre d’eau est posé sur la table. Tu ne l’as pas vu arriver.',
              held(2200),
            ),
          ],
          next: 'promesse',
        },
        {
          id: 'eau-non',
          lines: [law('D’accord.', held(1400))],
          next: 'promesse',
        },
        {
          id: 'promesse',
          lines: [
            law('Une seule chose.', held(1600)),
            law(
              'Ce soir, ne me dis pas ce que tu crois que je veux entendre.',
              held(2400),
            ),
            law('Même si c’est plus simple.', held(1600)),
          ],
        },
        {
          id: 'p',
          ask: {
            replies: [
              reply('promis', 'Promis.', { next: 'p-oui', effects: promise }),
              reply('daccord', 'D’accord.', {
                next: 'p-daccord',
                effects: promise,
              }),
              reply('non', 'Je ne promets rien.', {
                next: 'p-non',
                effects: [
                  {
                    note: {
                      kind: 'refusal',
                      tags: ['promesse-refusee'],
                      status: 'fact',
                    },
                  },
                ],
              }),
              reply(
                'savoir',
                'Et si je ne sais pas ce que tu veux entendre ?',
                {
                  next: 'p-savoir',
                  once: true,
                },
              ),
            ],
          },
        },
        {
          id: 'p-savoir',
          lines: [law('Alors tu n’auras aucun mal.', held(2000))],
          next: 'p',
        },
        { id: 'p-oui', lines: [law('Merci.', held(1400))], next: 'fin' },
        {
          id: 'p-daccord',
          lines: [law('Je prends ça pour un oui.', held(1400))],
          next: 'fin',
        },
        {
          id: 'p-non',
          lines: [
            law('Très bien.', held(1600)),
            law('Tu n’as rien promis. Je m’en souviendrai aussi.', held(1400)),
          ],
          next: 'fin',
        },
        {
          id: 'fin',
          lines: [law('Nous allons commencer.', held(2600))],
          end: 'suite',
        },
      ],
    },
  },
  outcomes: [{ when: { optionId: 'suite' }, beats: [] }],
};
