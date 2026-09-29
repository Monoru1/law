# Direction visuelle — espace habité

## Décision

THE LAW utilise une scène DOM/CSS/SVG, sans texture téléchargée ni moteur 3D.
Le décor est une architecture derrière la lecture, pas une image de fond. Chaque
lieu possède un avant-plan, une limite, une source lumineuse, un seuil et un hors-champ.

Les primitives reçoivent `timelineId`, `sceneId`, `phase`, `regression` et les
décisions déjà enregistrées. Elles ne lisent ni ne modifient le moteur narratif.

## Sources techniques consultées

| Source                                                                                                   | Licence / usage                               | Idée retenue                                                            |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| [Motion](https://motion.dev/docs/react-animate-presence)                                                 | MIT, déjà installé                            | Séparer clairement entrée et sortie ; aucune reprise de code.           |
| [Motion Primitives](https://github.com/ibelick/motion-primitives)                                        | MIT                                           | API de primitives composables ; référence uniquement.                   |
| [React Bits](https://github.com/DavidHDev/react-bits)                                                    | MIT + Commons Clause                          | Comparaison des textures et reveals ; aucun composant repris.           |
| [Cult UI](https://www.cult-ui.com/docs)                                                                  | Open source, licence à vérifier par composant | Panels et masques étudiés ; aucun code repris.                          |
| [Codrops, CSS transforms](https://tympanus.net/codrops/css_reference/transform/)                         | Référence pédagogique                         | Un seul point de fuite partagé pour la porte et le couloir.             |
| [Codrops, multi-layer reveals](https://tympanus.net/codrops/2016/06/01/multi-layer-page-reveal-effects/) | Visual reference only                         | Deux panneaux sobres, animés derrière le texte.                         |
| [Three.js](https://github.com/mrdoob/three.js/blob/dev/LICENSE)                                          | MIT                                           | Évalué puis rejeté : coût injustifié pour cette géométrie.              |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber)                                         | MIT                                           | Évalué puis rejeté : aucun besoin de caméra ou mesh interactif.         |
| [Theatre.js](https://github.com/theatre-js/theatre)                                                      | Core Apache-2.0, Studio AGPL-3.0              | Évalué comme outil d’orchestration, rejeté pour la production actuelle. |
| [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)                          | Documentation MDN                             | Base retenue pour de futurs drones et bruits filtrés procéduraux.       |

CodePen, 21st.dev, Aceternity, Magic UI et Fancy Components ont été parcourus
comme catalogues d’idées. Leurs exemples n’ont pas été copiés : les licences
varient et leurs effets privilégient souvent la démonstration au lieu.

## Références supplémentaires

Ces références ne fournissent aucun code ni asset au projet.

1. [Bear 71, NFB](https://bear71vr.nfb.ca/) — un système visuel unique transforme des données de surveillance en territoire.
2. [Way to Go, NFB](https://collection.nfb.ca/interactive/way_to_go/) — la caméra bouge pour voyager, puis laisse les moments exister.
3. [The Boat, SBS](https://www.sbs.com.au/theboat/) — son et mouvement servent précisément le lieu, pas une couche décorative générique.
4. [Short Trip, Alexander Perrin](https://alexanderperrin.com.au/portfolio/short-trip/) — une matière cohérente suffit à rendre un monde crédible sur mobile.
5. [17776, SB Nation](https://www.sbnation.com/a/17776-football) — le texte peut changer d’échelle sans perdre son rôle central.
6. [The Fallen of World War II](https://www.neilfilms.com/ww2/) — la statistique devient espace et s’arrête pour laisser explorer.
7. [Just a Reflektor](https://www.aaronkoblin.com/project/just-a-reflektor/) — lumière et ombre constituent l’interaction, sans chrome supplémentaire.
8. [The Johnny Cash Project](https://docubase.mit.edu/project/the-johnny-cash-project/) — une multitude d’unités devient une seule image vivante.
9. [The Wilderness Downtown](https://experiments.withgoogle.com/the-wilderness-downtown) — plusieurs plans participent à une même séquence sans imiter une page classique.
10. [A Dark Room](https://github.com/doublespeakgames/adarkroom) — le monde se révèle par ses traces et son rythme ; code MPL-2.0 non repris.
11. [Snow Fall](https://www.nytimes.com/projects/2012/snow-fall/) — les médias occupent les transitions, la lecture reste stable.
12. [The Turn of the Screw, Lusion](https://v2.lusion.co/work/the-turn-of-the-screw-trailer/) — une trajectoire de caméra rare donne plus de poids à l’immobilité.

## Architecture finale

- `World` choisit une composition `room`, `house` ou `city`.
- `ArchitecturalDoor` possède cadre, épaisseur, poignée, occlusion et lumière.
- `CurtainPanels` masque puis révèle l’espace à chaque nouvelle visite.
- `Corridor` construit la profondeur avec un seul point de fuite.
- `HouseWindow` combine verre, cadre, rideaux, pluie et voisinage hors champ.
- `CityWindows` évoque 417 fenêtres avec un motif SVG, sans 417 nœuds DOM.
- `OfficeLight`, `FileStack`, mobilier et traces donnent source, échelle et mémoire.
- Le grain existant est conservé comme couche très faible, jamais comme filtre VHS.

## Règles

- Le décor est `aria-hidden`, non interactif et ne porte aucune information nécessaire.
- Le texte ne se déplace jamais pendant la lecture.
- Les animations décoratives utilisent transform/opacité et cessent en reduced motion.
- Le rouge reste réservé aux actions irréversibles.
- Le mobile est recomposé : fenêtre décentrée, mobilier raccourci, seuil toujours lisible.
- Une décision peut déplacer l’axe lumineux et ajouter une trace, sans score ni couleur morale.

## Prototypes rejetés

- Porte Canvas : bon volume, mais accessibilité et maintenance moins bonnes que le DOM/CSS.
- Porte SVG : contour précis, profondeur et occlusion moins convaincantes.
- Porte R3F : résultat possible, mais dépendance, GPU et hydratation disproportionnés.
- Rideau en simulation physique : trop démonstratif et coûteux ; deux panneaux avec ombre suffisent.
- 417 fenêtres DOM : inutile ; le motif SVG donne la même échelle avec quelques nœuds.
- Photo ou texture de bureau : refusée, elle aurait remplacé la composition au lieu de la construire.

## Assets

Aucun asset externe n’est intégré. Toute la géométrie et toute la lumière sont
réécrites pour THE LAW avec CSS/SVG. Le seul fichier de texture utilisé reste
`public/grain.svg`, déjà présent dans le dépôt.
