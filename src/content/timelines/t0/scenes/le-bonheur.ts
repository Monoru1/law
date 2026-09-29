import {
  A,
  E,
  N,
  W,
  flag,
  held,
  law,
  note,
  reply,
  silence,
  stage,
  talkScene,
} from '../dsl';

const who = '{{said:t0.le-bonheur/nom|cette personne}}';

const why = (id: string, label: string, tag: string) =>
  reply(id, label, {
    next: 'end',
    effects: [note('intention', ['bonheur-intent', tag])],
  });

// 08 — LE BONHEUR
// Someone you love can have an extraordinary life, on one condition: you are
// not in it. LAW asks you to name them, offers to show it, and when it has
// been shown asks the question again.
export const leBonheur = talkScene({
  id: 'le-bonheur',
  title: 'Le bonheur',
  regression: 2,
  start: 'debut',
  nodes: [
    N('debut', [
      law(
        'Quelqu’un que tu aimes peut avoir une vie extraordinairement heureuse.',
        held(2600),
      ),
      law('Je préfère que tu ne dises pas « quelqu’un ».', held(1800)),
    ]),
    W('nom', 'Son nom.', 'Un prénom', {
      maxLength: 30,
      declineLabel: 'Je préfère ne pas le dire',
      next: 'nomme',
      declineNext: 'sans-nom',
      effects: [note('quote', 'aime-nom', 'fact', { fromText: true })],
    }),
    N('nomme', [law('{{said:t0.le-bonheur/nom|…}}.', held(2400))], {
      next: 'condition',
    }),
    N('sans-nom', [law('Tu en as le droit.', held(2000))], {
      next: 'condition',
    }),
    N('condition', [
      law('Sa vie sera belle. Réellement.', held(2200)),
      law('La condition : tu n’en feras jamais partie.', held(2800)),
      law('Tu veux la voir ?', held(1000)),
    ]),
    A('voir', [
      reply('oui', 'Oui.', {
        next: 'vision',
        effects: [flag('t0.bonheur.vu')],
      }),
      reply('non', 'Non.', { next: 'sans-voir' }),
      silence('rien', '…', { next: 'sans-voir' }),
    ]),
    N(
      'sans-voir',
      [law('D’accord. Alors je te le demande directement.', held(2400))],
      { next: 'choix' },
    ),
    N('vision', [
      stage(`${who} rit. Ce n’est pas un rire poli.`, held(3000)),
      stage(
        'Une maison avec un escalier qui craque. Un été, des gens qui dansent mal.',
        held(3200),
      ),
      stage('Deux enfants qui se disputent la dernière crêpe.', held(3000)),
      stage(
        'Plus tard : des mains qui tremblent un peu, autour d’un café. Personne ne s’en inquiète.',
        held(3400),
      ),
      stage('Rien ne manque.', held(3400)),
      stage('Tu n’y es nulle part. Pas même à l’arrière-plan.', held(4200)),
      law('Je repose la question.', held(2800)),
    ]),
    A(
      'choix',
      [
        reply('renonce', 'Je renonce.', {
          next: 'renonce',
          hold: true,
          effects: [flag('t0.bonheur.renonce')],
          evidence: [{ principleId: 'P_SACRIFICE_SOI', weight: 1 }],
        }),
        reply('refuse', 'Non.', {
          next: 'refuse',
          effects: [flag('t0.bonheur.refuse')],
          evidence: [{ principleId: 'P_SACRIFICE_SOI', weight: -0.5 }],
        }),
        reply('un-peu', 'Et si je pouvais être là, un tout petit peu ?', {
          next: 'a-un-peu',
          once: true,
        }),
      ],
      { timeoutMs: 120000, onTimeout: 'laisse' },
    ),
    N(
      'a-un-peu',
      [law('Non.', held(2200)), law('C’est la condition.', held(2400))],
      { next: 'choix' },
    ),
    N('renonce', [law('D’accord.', held(2400)), law('Pourquoi ?', held(800))], {
      next: 'pourquoi-renonce',
    }),
    A('pourquoi-renonce', [
      why('aime', 'Parce que je l’aime.', 'intent-amour'),
      why(
        'empeche',
        'Je ne veux pas être ce qui l’empêche.',
        'intent-ne-pas-empecher',
      ),
      why('mieux', 'Sa vie sera meilleure sans moi.', 'intent-mieux-sans-moi'),
    ]),
    N('refuse', [law('D’accord.', held(2400)), law('Pourquoi ?', held(800))], {
      next: 'pourquoi-refuse',
    }),
    A('pourquoi-refuse', [
      why(
        'impossible',
        'Je ne peux pas renoncer à cette personne.',
        'intent-impossible',
      ),
      why(
        'droit',
        'Ce n’est pas à moi de décider à sa place.',
        'intent-pas-a-moi',
      ),
      why('non', 'Je ne veux pas disparaître de sa vie.', 'intent-rester'),
    ]),
    N(
      'laisse',
      [
        law('Tu n’as rien dit.', held(2400)),
        law('Je le note comme un non.', held(2600)),
      ],
      {
        effects: [
          flag('t0.bonheur.refuse'),
          note('silence', 'bonheur-timeout'),
        ],
        next: 'end',
      },
    ),
    E(),
  ],
});
