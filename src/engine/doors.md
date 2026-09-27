# Contrat des portes — version 1

API pure exportée depuis `src/engine/index.ts`. Les fonctions reçoivent l’état issu de `replay` et le contenu. Elles ne lisent ni navigateur ni horloge, et ne modifient aucun journal. Le schéma de sauvegarde reste inchangé.

`getTimelineDoors(state, content): TimelineDoor[]` retourne, dans cet ordre, `t1` (LA PIÈCE), `t2` (LA MAISON), `t3` (LA VILLE), `t4` (LE TRIBUNAL). Les noms et textes de présentation sont à fournir par le contenu. Les trois dernières portes restent `presentation` tant que leur moteur de parcours n’est pas implémenté ; ajouter une scène ne suffit pas à les rendre jouables.

`resolveDoorEntry(timelineId, state, content): DoorEntry` fournit une intention de navigation :

| Situation                                       | status       | entry.kind   | Action du consommateur                                           |
| ----------------------------------------------- | ------------ | ------------ | ---------------------------------------------------------------- |
| Premier lancement, journal vide                 | available    | start        | Onboarding, puis démarrage non destructif du store               |
| Parcours commencé, même avant la première scène | in_progress  | resume       | Lecteur existant, sans appeler start ni effacer le journal       |
| Événement run_completed pour t1                 | completed    | summary      | Bilan existant, sans recréer de parcours                         |
| Porte sans moteur jouable                       | presentation | presentation | Présentation locale, retour libre, aucune écriture de sauvegarde |

L’intention `resume` fournit `sceneId: string | null`. `null` couvre notamment le journal commencé avant la première scène et le contenu historique introuvable ; ce n’est jamais une autorisation de remplacement. L’interface doit attendre l’hydratation et traiter les erreurs de récupération avant toute entrée. Le démarrage non destructif et le remplacement explicite relèvent du contrat de persistance de THE-10. Aucun redémarrage automatique n’est exposé ici.

`getRunProgress(state, content): RunProgress` expose `currentScene: { sceneId, title, eventId } | null`, `visitedScenes: { sceneId, eventId }[]`, `visitedSceneCount`, `totalScenes: null`, `completionEventId: string | null`. Les visites sont des scènes connues effectivement entrées, dédupliquées ; une scène passée sans entrée ne compte pas comme visite. Chaque référence désigne son événement réel. Le titre courant vient du contenu associé à cette entrée. Après achèvement, le titre courant est nul. Les données concernent le dernier run_started du journal.

Le compteur indique une quantité déjà parcourue, jamais un pourcentage ni un nombre restant. Les branches, retours différés et confrontations répétées rendent `content.order.length` impropre comme dénominateur. SEUIL peut afficher uniquement le titre courant. Les selectors ne génèrent aucune observation ou citation de décision.

Intégration : SEUIL gère les routes et les actions ci-dessus ; DÉCOR peut consommer `status` pour l’apparence des portes ; PLUME possède les noms et les textes. Ce contrat n’introduit pas de mécanique narrative pour les trois présentations.
