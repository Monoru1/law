# Audit de production — Lot A, et ce qui a été livré

Date : 24 octobre 2026. Branche : `codex/tribunal-opening`, créée depuis `origin/main` à jour (`8429ca7`), jamais poussée. Auteur : Claude, en réponse à la mission « LE TRIBUNAL ET LA SIXIÈME PLACE ».

## 1. Ce qui existe déjà (vérifié dans le code, pas supposé)

- **Moteur de conversation déterministe** (`src/engine/talk.ts`) : graphe de nœuds, silence explicite distinct d'un abandon, notes typées (fait/observation/inférence/déclaration), effets conditionnés, conditions `said`/`noted`/`relation`. Robuste, déjà éprouvé sur 500+ parcours seedés pour REBIRTH.
- **Trois campagnes indépendantes, trois journaux, trois clés de stockage** : `thelaw:save*` (T0–T3 historiques, non routées publiquement), `thelaw:rebirth:save-t0` (Les Archives du silence, Gabriel Varenne — toujours la page d'accueil publique), et maintenant `thelaw:tribunal:save-t0` (ce lot). Aucune ne lit ni n'écrase les autres.
- **Registre de contrats triple, append-only** : `contracts.json`, `rebirth-contracts.json`, et `tribunal-contracts.json` (nouveau). `scripts/contracts.ts` vérifie les trois ; `migrations.ts` les fusionne pour la compatibilité de sauvegarde.
- **Validation de contenu** (`scripts/validate-content.ts`) : audit statique + simulation seedée par campagne. Étendu ici avec 500 parcours Tribunal.
- **Piège réel trouvé et corrigé pendant ce lot** : `sceneSchema.id` était verrouillé par une regex `^(?:rebirth\.)?t[0-4]\.[a-z-]+$` qui n'acceptait aucun autre espace de noms. Étendue à `tribunal\.` (un seul caractère ajouté à une alternative, voir `src/engine/schema.ts`), sans toucher au reste du schéma de sauvegarde fermé (`timelineId` reste `t0`–`t4`).
- **Piège réel n°2** : le moteur de conversation (`walkTalk`) traverse silencieusement tout nœud qui n'a ni `ask`, ni `write`, ni `end` propre tant qu'il n'a pas atteint un point d'arrêt — un nœud narratif seul, sans question, n'est **jamais affiché au joueur**, même s'il contient du texte important. `src/content/rebirth.ts` le sait et termine toujours un nœud narrativement significatif par un `ask` à une seule réponse avant de router vers un nœud terminal vide. Mes deux premières versions de ce lot l'ignoraient ; deux tests E2E l'ont révélé immédiatement. C'est documenté en commentaire dans `src/content/tribunal.ts` pour la prochaine personne qui écrira une scène.

## 2. Ce qui est livré dans ce lot

**Uniquement** l'ouverture du Tribunal (§1 de la bible, PAS les dossiers) :

- `src/content/tribunal.ts` — 2 scènes (`tribunal.t0.ouverture`, `tribunal.t0.audience-suspendue`), 9 nœuds, le texte de la bible mot pour mot pour les deux répliques du Greffier citées dans la mission. Trois réponses à la première question (demander / contester / silence), chacune enregistrée comme un **fait séparé**, jamais interprétée en profil.
- `src/ui/tribunal/ScenePlayerTribunal.tsx` + `tribunal.module.css` — lecteur dédié, décor CSS/SVG pur (pas de bitmap), une seule lumière qui s'allume une fois après le premier battement d'obscurité, respect de `prefers-reduced-motion` (une seule transition CSS, désactivée par la media query), aucune musique ni son — voir §4.
- `app/jouer/tribunal/page.tsx`, `src/store/gameStoreTribunal.ts` — route et magasin isolés.
- `app/page.tsx` — un lien honnête ajouté (« Le Tribunal — nouvelle direction narrative, en construction : l'audience d'ouverture seule est jouable »), sans toucher à la page Gabriel Varenne existante ni la présenter comme obsolète aux yeux du joueur.
- Tests : `tests/content/content.test.ts` (ids isolés, aucune collision avec les autres campagnes, 150 parcours seedés rejoués, les trois réponses de l'ouverture bien atteintes et distinctes), `tests/e2e/tribunal.spec.ts` (clavier seul, enregistrement du silence comme fait distinct, reprise après rechargement).

**Volontairement absent, pour ne pas prétendre une livraison qui n'existe pas :**

- **Dossier I — La Sixième Place** : aucune ligne de ses cinq actes n'est écrite. C'est un vrai travail d'écriture et de conception de branches (confrontation physique préfigurée, variantes de chute, dix pièces `FAM-01`–`FAM-10`, trois fins) qui mérite un lot dédié, pas une passe en fin de session. L'écran « Le Tribunal » du jeu le dit explicitement : seule l'ouverture est jouable.
- **Dossiers II et III, interludes, procès final** : non commencés.
- **Un vrai moteur cinématographique 2.5D** (parallaxe, mouvements de caméra, éclairage dynamique par acteur) : non livré. Ce que j'ai construit est une seule composition CSS (un dégradé radial qui s'éclaire) — une ambiance, pas une mise en scène. Le faire correctement demande soit des assets (voir §4), soit un budget de composition DOM/CSS/SVG comparable à l'ancien `World` (supprimé dans la reconstruction Codex), à reconstruire en fonction du dossier réellement écrit — bâtir le décor avant le texte aurait été prématuré.
- **Portraits, sons enregistrés** : aucun nouvel asset binaire. Voir §4 pour ce qui serait nécessaire.

## 3. Mes trois critiques du canon (demandées par la mission, §3)

1. **Le mystère central repose sur un seul grand retournement (le Greffier a un passé), jamais préparé par du gameplay avant le procès final.** La bible le prévoit en Interlude III (« Un document de l'affaire II et une note de procédure de l'affaire III ont été préparés par le même cabinet... »), mais rien dans le Dossier I lui-même ne plante cet indice. Recommandation : qu'au moins une pièce du Dossier I (`FAM-05` ou `FAM-06`) porte déjà, sans l'expliquer, le même tampon de cabinet qu'on retrouve en Interlude II/III — l'indice existe mais ne « parle » qu'après coup, exactement comme le canon le demande pour les Dossiers II/III entre eux. Actuellement cette cohérence transversale n'est écrite nulle part pour le Dossier I.
2. **La scène de la chute (Acte III) est la seule qui a une vraie charge mécanique (physique préfigurée, variantes de gravité), et elle n'est écrite qu'en prose.** Avant de l'implémenter, il faut trancher précisément quelles conditions _factuelles_ (pas narratives) déclenchent quelle branche — la bible dit « si confrontation physique dans des conditions défavorables », ce qui n'est pas une condition testable par le moteur. Je recommande de fixer, avant d'écrire une ligne de scène, la liste exacte des faits du journal (ex. : tapis relevé observé en Acte I + repousser choisi + absence d'appel à Sarah) qui, ensemble, décident la chute — sinon le risque est un hasard déguisé en causalité, que la bible interdit explicitement (« pas de faux dilemme »).
3. **« Aucun surnaturel réel » + « le Greffier n'est jamais vu » crée une tension de lisibilité pour la fin.** Si le joueur ne voit jamais le Greffier et que tout reste humain, la révélation de son identité (Interlude/Procès, §Le visage du Greffier) doit se faire par la voix et par des faits, jamais par une image — ce qui est cohérent avec la direction « pas de portrait » que j'ai choisie pour cette ouverture (aucun visuel du Greffier). Je recommande de garder cette contrainte explicite dans la bible visuelle à venir, pour que personne ne soit tenté d'ajouter un portrait qui court-circuiterait la révélation.

## 4. Ce qu'il faudrait pour la direction visuelle demandée (honnêteté, §6 de la mission)

Je n'ai produit aucun asset binaire (image, son) dans ce lot. Pour la salle d'audience décrite dans la mission (architecture monumentale, dossiers anciens, bois et métal, éclairage dramatique, pluie, pas, portes) :

| Besoin                           | Cadrage                                                                        | Durée/format                                                                   | Usage                                      |
| -------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------ |
| Décor de salle (couches)         | Fond lointain (colonnes), plan moyen (banc), premier plan (bureau du Greffier) | SVG ou WebP optimisé, 3 calques                                                | `World`-like composition, parallaxe légère |
| Boucle de pluie/silence de salle | —                                                                              | WAV court, bouclable, procédural de préférence (`AudioManager` existe pour ça) | Ambiance continue, mute persistant         |
| Porte (ouverture/fermeture)      | —                                                                              | WAV court                                                                      | Transition de scène                        |
| Pas, chaise                      | —                                                                              | WAV courts                                                                     | Battements d'ouverture                     |

Je recommande de **ne pas** investir dans des assets avant que le Dossier I soit écrit : la salle du Tribunal n'est visitée que 3 à 5 minutes au total tant que les dossiers ne sont pas instruits ; les lieux du Dossier I (maison, cuisine, cave) ont un besoin bien plus pressant et un cahier des charges déjà écrit dans la bible (§« Direction de réalisation scène par scène »).

## 5. Vérifications effectuées sur ce lot

- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` : verts.
- `pnpm test` (Vitest) : 116/116, dont les trois nouveaux cas Tribunal.
- `pnpm validate:content` : 500 parcours Tribunal seedés, audit statique sans erreur, aucune dérive de contrat.
- `pnpm build` : production OK, `/jouer/tribunal` statique.
- `pnpm exec playwright test tests/e2e/tribunal.spec.ts` : 2/2, clavier seul, silence explicite vérifié dans le journal, reprise après rechargement vérifiée.
- `pnpm exec playwright test` (suite complète, 68 tests) : voir le rapport final pour le résultat exact — lancée en parallèle de la rédaction de ce document.
- `pnpm audit --audit-level=moderate` : aucune vulnérabilité connue.
- **Non fait** : écoute au casque (aucun son livré dans ce lot), test sur appareil physique iPhone/Android, Lighthouse.

## 6. Risques avant Halloween, propres à ce lot

- Si quelqu'un écrit une scène de conversation sans relire §1 (le piège `walkTalk`), tout nœud narratif sans `ask` disparaîtra silencieusement de l'écran — aucune erreur de build, aucun test par défaut ne l'attrape à moins d'écrire un test de présence de texte comme celui ajouté ici. Recommandation : ajouter une règle d'audit automatique (`auditContent` ou un nouveau contrôle) qui signale tout nœud avec `lines` non vide et sans `ask`/`write`/`end` propre — actuellement cette classe d'erreur silencieuse n'est détectée par aucun outil, seulement par lecture attentive d'un E2E qui échoue sur un texte absent.
- La page d'accueil présente maintenant DEUX directions narratives simultanément (Archives du silence + Tribunal). C'est honnête mais pas définitif : il faudra, une fois le Dossier I réellement jouable, décider si l'accueil bascule entièrement vers le Tribunal ou continue de présenter les deux. Cette décision n'est pas prise ici.
