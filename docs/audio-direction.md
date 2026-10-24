# Direction audio

## Principe

Le lieu précède la musique. La plupart du temps, THE LAW doit respirer avec un
room tone discret : ventilation, électricité, pluie, bâtiment ou ville lointaine.
Le silence complet reste un événement de mise en scène.

Claude conserve l’AudioManager et la logique contextuelle. Cette palette définit
des couches et des cues génériques raccordables sans imposer de narration.

## Palette

| Phase        | Texture                                                 | Densité / pulsation       | Présence                 | Silence                             |
| ------------ | ------------------------------------------------------- | ------------------------- | ------------------------ | ----------------------------------- |
| T1 ROOM      | ventilation filtrée, néon 50 Hz atténué, grave stable   | très faible, sans tempo   | presque subliminale      | après une décision irréversible     |
| T2 HOUSE     | pluie sur vitre, tuyauterie, bois lointain, rue amortie | irrégulière, humaine      | faible                   | quand la maison attend une réponse  |
| T3 EARLY     | ventilation de bureau, papier, ascenseur lointain       | stable, administrative    | faible                   | avant la première instruction       |
| T3 SYSTEM    | moteurs, relais, ventilation plus large                 | répétition lente          | moyenne, jamais musicale | après une confirmation du système   |
| T3 PRESSURE  | grave filtré, masse urbaine, impulsion très lente       | dense sans percussion     | moyenne                  | coupure nette avant un choix majeur |
| T3 AFTERMATH | air, bâtiment vidé, ville distante                      | presque immobile          | très faible              | longues plages assumées             |
| T4 FUTURE    | acoustique vaste, frottement, registre médium vide      | aucune pulsation attendue | à définir                | élément principal                   |

## Recettes procédurales

- `room.hum` : oscillateur sinusoïdal 50 Hz à très bas gain + harmonique filtrée.
- `room.air` : bruit généré, passe-bande large autour de 500 Hz, modulation lente.
- `city.distance` : bruit rose filtré, panoramique stéréo limité à ±0,15.
- `pressure.low` : sinusoïde 38–44 Hz, gain inférieur au room tone, sans attaque.
- `light.flicker` : modulation de gain rare, jamais synchronisée avec le texte.

Chaque couche doit avoir une enveloppe d’au moins 1,5 s. Aucun son ne démarre
avant une interaction utilisateur. Une absence d’`AudioContext` reste silencieuse
et non bloquante.

## Sons UI

| Cue               | Direction                                                     |
| ----------------- | ------------------------------------------------------------- |
| `choice.lock`     | contact mécanique court, sec, sans grave spectaculaire        |
| `law.seal`        | verrou + papier, plus long mais sous 450 ms                   |
| `navigation.next` | souffle ou contact presque inaudible                          |
| `door.open`       | charnière basse et frottement, jamais un grincement d’horreur |
| `panel.reveal`    | frottement mat très court                                     |
| `file.move`       | carton/papier proche, mono ou très peu spatialisé             |
| `elevator.arrive` | moteur filtré puis petit relais métallique                    |

Voix et cris restent exclus tant qu’un asset précis, contextuel et clairement
licencié n’a pas été validé. Aucun placeholder humain ne doit arriver en production.

## Sources et licences

- [Web Audio API, MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) : synthèse et filtrage procéduraux, sans asset.
- [StereoPannerNode, MDN](https://developer.mozilla.org/en-US/docs/Web/API/StereoPannerNode) : panoramique peu coûteux, borné et subtil.
- [Freesound FAQ](https://freesound.org/help/faq/) : retenir uniquement CC0, ou CC-BY avec attribution complète ; exclure CC-BY-NC sans validation humaine.
- [Pixabay Content License](https://pixabay.com/service/license-summary/) : usage possible sous licence propriétaire, redistribution standalone interdite ; asset à valider individuellement.
- [Mixkit SFX License](https://mixkit.co/license/modal/sfxFree/) : intégration possible dans un produit, redistribution de l’asset seul interdite ; asset à valider individuellement.
- Poly Haven, ambientCG et Musopen ont été évalués comme bibliothèques futures ; licence à conserver asset par asset, en particulier pour les enregistrements Musopen.

## Budget

- Priorité au procédural pour les couches longues.
- Formats courts compressés pour porte, papier et ascenseur uniquement.
- Aucun WAV brut dans le bundle de production.
- Une seule ambiance active par lieu, avec deux couches secondaires maximum.
- Mute persistant, reduced motion indépendant du mute, mono toujours acceptable.

## Assets intégrés

Aucun fichier audio tiers n’est ajouté par ce pass. Il n’existe donc aucune
attribution d’asset à publier et aucune licence ambiguë dans le dépôt.

## REBIRTH — son du prologue, 24 octobre 2026

L'ancien moteur à trois oscillateurs est remplacé par des fichiers locaux et une gestion explicite de leur cycle de vie. Les descriptions précédentes sont historiques.

- `scripts/create-rebirth-audio.py` produit neuf fichiers WAV originaux : pluie/vent, ventilation et résonances du lycée, motif musical synthétique à partiels de piano et échos, papier, porte, pas, téléphone, électricité, horloge. Bibliothèque standard Python, sans samples tiers. Le motif est une composition synthétique courte, pas une bande-son orchestrale ni une captation réelle.
- `message.wav` et `message-intro.wav` : texte original du scénario synthétisé hors ligne avec la voix française Microsoft Hortense installée, via `System.Speech.Synthesis.SpeechSynthesizer`, débit -1. Pas d'imitation d'une personne réelle, pas de service réseau. La version intégrale dure environ 17 secondes ; la transcription identique est toujours visible. Cette voix de synthèse reste une limite de production à remplacer éventuellement par une interprétation enregistrée.
- Les fichiers sont chargés uniquement après activation du son, puis décodés par Web Audio. Un compresseur limite les crêtes. Les ambiances et la musique se fondent sur 1,5 seconde lors du changement de lieu.
- Le volume est un champ optionnel des réglages : les sauvegardes historiques sans volume restent lisibles. Une nouvelle visite n'ouvre pas automatiquement d'AudioContext, même si l'option Son a été mémorisée.
- Mute coupe les lectures ponctuelles ; quitter ferme le contexte. Un appareil audio indisponible ne bloque aucune décision. Les tests vérifient l'énergie non nulle des fichiers et le démarrage de véritables sources Web Audio dans Chromium.

Texte synthétisé : « Si vous écoutez ceci, c’est qu’ils ont recommencé. Ne cherchez pas mon nom dans le registre. Cherchez ce qu’ils ont changé après la signature. B dix-sept. La lumière était encore allumée. » Le fichier introductif ne contient que la première phrase.
