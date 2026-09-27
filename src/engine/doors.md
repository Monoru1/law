# Contrat des portes — version 2

API pure exportée depuis `src/engine/index.ts`. Les fonctions reçoivent, par timeline, l’état issu de `replay` et le contenu. Elles ne lisent ni navigateur ni horloge, et ne modifient aucun journal.

`getTimelineDoors(runs): TimelineDoor[]` retourne, dans cet ordre, `t1` (LA PIÈCE), `t2` (LA MAISON), `t3` (LA VILLE), `t4` (LE TRIBUNAL). `runs` associe chaque timeline jouable à `{ state, content }`. Une timeline absente de `runs`, ou dont le contenu ne fournit aucune scène ordonnée de cette timeline, reste `presentation` : ajouter une scène ne suffit pas à ouvrir une porte.

`resolveDoorEntry(timelineId, runs): DoorEntry` fournit une intention de navigation :

| Situation                                                | status       | entry.kind   | Action du consommateur                                       |
| -------------------------------------------------------- | ------------ | ------------ | ------------------------------------------------------------ |
| Journal vide, timeline ouverte                           | available    | start        | Onboarding (T1) ou seuil (T2), puis démarrage non destructif |
| Parcours commencé, même avant la première scène          | in_progress  | resume       | Lecteur existant, sans appeler start ni effacer le journal   |
| Événement `run_completed` de cette timeline              | completed    | summary      | Bilan existant, sans recréer de parcours                     |
| Porte sans moteur jouable, ou timeline héritée non finie | presentation | presentation | Présentation locale, retour libre, aucune écriture           |

Une timeline dont le contenu déclare `inherits` (LA MAISON hérite de LA PIÈCE) reste `presentation` tant que la timeline source n’a pas d’événement `run_completed`. Un journal déjà commencé reste `resume` ou `summary` même si la source est effacée ensuite : sa mémoire est une copie.

`getRunProgress(state, content): RunProgress` expose `currentScene`, `visitedScenes`, `visitedSceneCount`, `totalScenes: null` et `completionEventId` pour la timeline de `content`. Les visites sont des scènes connues effectivement entrées, dédupliquées ; chaque référence désigne son événement réel. Le compteur indique une quantité déjà parcourue, jamais un pourcentage ni un nombre restant.
