import {
  A,
  E,
  N,
  held,
  femme,
  notif,
  reply,
  silence,
  stage,
  talkScene,
} from '../dsl';

// ÉPILOGUE — LA VILLE, LA PLUIE
// The prologue returns as a place rather than an explanation. The examination
// ends at the instant ordinary life resumes.
export const epilogue = talkScene({
  id: 'epilogue',
  title: 'La Ville, la pluie',
  ambience: 'rain',
  regression: 3,
  start: 'rue',
  nodes: [
    N('rue', [
      stage('La pluie.', held(2200)),
      stage('Le même feu rouge.', held(2200)),
      stage('Sous l’abribus, la même femme.', held(2600)),
      femme('Alors ?', held(2200)),
    ]),
    A('reponse', [
      reply('quoi', 'Alors quoi ?', { next: 'r-quoi' }),
      reply('fini', 'C’est fini.', { next: 'r-fini' }),
      reply('revenue', 'Tu savais que je reviendrais.', { next: 'r-savais' }),
      silence('rien', '…', { next: 'r-rien' }),
    ]),
    N('r-quoi', [femme('Mieux.', held(2400))], { next: 'depart' }),
    N('r-fini', [femme('Non.', held(2400))], { next: 'depart' }),
    N('r-savais', [femme('Tu es revenu.', held(2400))], { next: 'depart' }),
    N('r-rien', [femme('Oui.', held(2600))], { next: 'depart' }),
    N('depart', [
      stage('Le feu passe au vert.', held(2600)),
      stage('Ton téléphone vibre.', held(2200)),
      notif('07:42 — Une nouvelle journée.', held(2400)),
      notif('3 messages. 1 appel manqué.', held(2600)),
      femme(
        'Voyons ce que tu fais lorsque personne ne te pose la question.',
        held(3800),
      ),
      stage('Tu lèves les yeux. Elle est déjà partie.', held(3600)),
    ]),
    E(),
  ],
});
