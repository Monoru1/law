# Immersion 3D — 26 octobre 2026, branche de travail

## Relais Claude — état à reprendre

**Décision : NO-GO pour une publication 3D définitive.** Le socle jouable est vérifié, mais la direction artistique reste une première passe. Aucun merge sur `main`, aucune modification du déploiement public stable `b14004d`. Tous les changements sont sur `feat/real-3d-horror-environments`. Commits précédents : fondation `1770a57`, Tribunal `b048718` ; le commit contenant cette section clôt le lot maison/audio. Reprendre cette branche, sans cherry-pick des deux premiers commits : ils sont déjà dans son historique. La sauvegarde Claude `backup/claude-26-octobre` reste intacte.

### Fonctionnalités terminées dans ce lot C/D

- Extérieur/entrée, salle d'audience, couloir resserré, table familiale, album, photographie et négatif en géométrie réelle. Six assiettes, verres, couverts, chaises, lampe, portes, plafond, murs, parquet et mobilier. Raycasts sur les objets disponibles, contrôles équivalents au clavier, cadrage rapproché sur dossier et sixième assiette, inspection du banc/de la lampe. Noir et révélation de la salle, regard limité par glissement ou flèches ; le mode réduit supprime les déplacements automatiques.
- La sélection de l'assiette déclenche la réplique d'Henri via `line_chosen`, rapproche la caméra, déplace légèrement la chaise vide et atténue l'ambiance. Les trois décisions à table et leurs conséquences continuent à être journalisées et reprises sans changement de schéma.
- Pluie et bruitages localisés par `PannerNode` HRTF ; écouteur synchronisé avec la vraie caméra, musique non spatialisée, horloge du Tribunal, volume/mute conservés et aucun contexte audio avant activation. Annulation des bruitages en attente lors de la pause ou d'une destruction.
- Qualités élevée/standard/économique, baisse automatique de qualité si les images mesurées sont coûteuses, rendu à la demande suspendu hors vue/pause. Résolution économique 0,75 ; instancing du parquet, couverts, verres et autres répétitions. Retour au SVG existant si WebGL échoue/perd son contexte ; retour volontaire 2D/3D testé sans toucher au journal. Géométries, textures et contexte libérés au démontage.

### Résultats vérifiés avant handoff

- `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint` (aucun avertissement), `pnpm typecheck`, `pnpm contracts`, `pnpm build` : réussis. Installation figée relancée dans le même environnement pnpm que l'installation initiale : le sandbox utilisait un autre store et refusait une réinstallation sans TTY. Types Three alignés sur 0.186.0.
- `pnpm test` : **118/118**, 13 fichiers. `pnpm validate:content` : **2 000 parcours historiques + 500 REBIRTH + 500 Tribunal + 500 dossier**, tous réussis. **98 contrats inchangés** (86 + 7 + 5).
- Suite entière sur le dernier build de production local : **35/35 E2E** en 47,8 s, un worker. Après ajout de l'export des mesures : nouvelle passe **6/6 E2E 3D** en 20,7 s. Vrais clics de canvas sur banc, dossier et assiette ; transition Tribunal → maison, réaction persistée après reload, GPU absent/perdu, mobile 390 px, trois qualités, clavier, opt-in audio et écouteur suivant effectivement la caméra. Les parcours historiques, sauvegardes isolées, carnet, décisions et contrôle console restent couverts par la suite.
- Captures réelles inspectées : `test-results/environment3d-real-raycast-*/tribunal.png`, `six-settings.png`, `test-results/environment3d-keyboard-*/hall.png`, `test-results/environment3d-mobile-*/mobile-3d.png`. Vidéos WebM des six tests 3D dans leurs répertoires. Ces preuves sont locales, ignorées par Git et reproductibles ; une nouvelle invocation Playwright remplace le répertoire `test-results`.
- Mesure exacte conservée dans `test-results/environment3d-mobile-*/render-metrics.json` : extérieur à 390 × 844, qualité économique, framebuffer **292 × 303**, **45 draw calls**, **12 776 triangles**, **45 géométries**, médiane des intervalles des frames rendues **22 ms** sur **SwiftShader (GPU logiciel Chromium)**. Ce n'est ni un benchmark de tout le dossier, ni une mesure sur téléphone réel, ni une garantie de FPS. Le premier relevé Tribunal standard, avant finitions et adaptation, était beaucoup plus lent (~196 ms) ; vérifier le matériel réel reste nécessaire.
- CI du lot B `b048718` : réussie, run `40319087355`. **La CI du commit final doit être contrôlée après push** ; un résultat antérieur ne valide pas le nouveau SHA. Aucun contournement, force push ou fusion autorisé par cette note.

### Limites visuelles et priorités pour Claude

1. **Direction artistique en premier** : mobilier procédural encore très sobre, pièces peu habitées, surfaces trop uniformes, extérieur et voiture schématiques. Le couloir a de meilleures proportions, mais boiseries, enduits, tissus, lumière de fenêtre et composition demandent un vrai passage artistique. Les images prouvent la 3D, pas le niveau de réalisme final demandé. Revoir le cadrage mobile, où la voiture occupe trop le premier plan.
2. **Présence humaine et son** : aucun humain 3D convaincant, geste de main ou voix humaine enregistrée ; le Greffier est seulement transcrit. La chaise bouge, pas un personnage. Pluie visuelle statique, pas de simulation météo. Les sons locaux existants sont réutilisés ; pas de nouveau comédien, grincement de chaise dédié ou doublage. Ne pas présenter ces éléments comme livrés.
3. **Contenu** : la lettre, la cassette, la confrontation et le retour narratif au Tribunal ne sont pas écrits dans le chapitre actuel. Ne pas créer d'objet qui révèle ces informations en contournant le graphe. Les inspections de décor n'ajoutent aucune pièce au journal.
4. **Qualité matérielle** : tester desktop avec GPU et téléphone réel, vérifier confort du regard, contraste et écoute au casque ; profiler Tribunal/table sur chaque qualité, temps de chargement et mémoire après changements de pièce. Pas de test physique iPhone/Android ni validation artistique humaine dans ce lot. Fiber utilise encore `THREE.Clock`, déprécié par Three depuis r183 : avertissement amont identifié, aucun filtre console ajouté pour le masquer. Les ombres utilisent explicitement `PCFShadowMap` pour éviter l'ancienne constante supprimée.
5. **Avant toute publication** : direction artistique validée, CI complète du SHA final verte, puis E2E sur prévisualisation et contrôle visuel. Prévisualisation Netlify : utiliser `?ntl-drawer-state=hidden` pour éviter le panneau collaboratif bloqué par la CSP, sans affaiblir cette CSP.

### Reprise sans conflit

```powershell
git status -sb
git fetch origin --prune
git switch feat/real-3d-horror-environments
git pull --ff-only
pnpm install --frozen-lockfile
pnpm build
pnpm start --hostname 127.0.0.1 --port 3103
# Dans un second terminal :
$env:LAW_BASE_URL='http://127.0.0.1:3103'
pnpm test:e2e --workers=1
```

- Claude peut concentrer ses changements artistiques dans `src/ui/tribunal/WorldModels.tsx` (géométrie/matériaux), `WorldCanvas.tsx` (caméra/lumière/performance) et `tribunal.module.css` (composition). Les textes, légendes et correspondances des objets restent dans `src/content/environments.ts` ; le lecteur conserve la responsabilité d'appeler le store. Tout nouvel asset doit être original ou avoir sa licence documentée.
- Conserver `EnvironmentStage.tsx` comme frontière client/repli/accessibilité et les callbacks d'actions résolues. Ne pas modifier le moteur, les IDs, les contrats et les clés de sauvegarde pour une modification artistique. Ne pas lancer `contracts --write` pour une simple finition de décor.
- Les serveurs de développement/prototypes sur 3100 et 3102 ont été arrêtés ; le serveur de contrôle de production utilise 3103 pendant cette session. Ne pas confondre un serveur lancé avant rebuild avec le dernier build. Sous Windows, préférer ce serveur indépendant au serveur géré par Playwright (fermeture parfois bloquée).

---

## Lot A — Fondation et scènes initiales

Commit sauvegardé et poussé : `1770a57`.

- Branche `feat/real-3d-horror-environments` depuis `main` à `b14004d`. Aucun travail préexistant, aucune PR ouverte à l'audit. `HouseStage.tsx` (SVG) et le décor CSS du Tribunal simulaient la profondeur ; ils restent disponibles en repli.
- Three.js 0.186.1 et Fiber 9.8.2 (peer React >=19 <19.4, compatible React 19.3) ; pas de Drei car caméra et géométrie maîtrisées sans cette dépendance. Import dynamique client, aucun WebGL serveur. Modèles originaux procéduraux, textures de grain déterministes de 256 px, aucun asset tiers, aucun GLB inutile. Architecture et arbitrage : le rendu consomme des actions déjà résolues ; seul le lecteur écrit les événements existants.
- `EnvironmentStage.tsx` : qualités élevée/standard/économique, repli volontaire et automatique, délai d'initialisation borné, garde de contexte perdu, accès HTML au clavier. `WorldCanvas.tsx` : caméra bornée, réglage système et utilisateur de mouvement réduit, pause/hors écran, rendu à la demande et réduction automatique du coût. `WorldModels.tsx` : première salle d'audience fermée, maison, table, six couverts, couloir et album. `src/content/environments.ts` : correspondance objets/réponses et textes d'inspection sans nouvelles preuves.
- Validation : build initial, lint et TypeScript réussis ; 118/118 tests unitaires ; 98 contrats inchangés. Cinq tests navigateur 3D réussis : vrai raycast sur le dossier et l'assiette, conséquence privée persistée, trois qualités, clavier, retour 2D/3D, WebGL absent et contexte perdu, mobile. Images et vidéos réelles dans `test-results/environment3d-*`, exclues de Git, générées par `pnpm test:e2e tests/e2e/environment3d.spec.ts --workers=1` contre le serveur indiqué par `LAW_BASE_URL`.
- Correctif de cycle de vie : la destruction volontaire du renderer n'est plus considérée comme une panne GPU. Les objets inaccessibles au moteur n'ont pas de handler narratif. Aucun changement des scènes, des contrats ou des sauvegardes historiques.
- Limites de cette étape : rendu encore à raffiner et mesures sur GPU logiciel Chromium ; aucune promesse de FPS matériel. Pas de personnages réalistes ni de voix humaine enregistrée. La lettre et la suite de l'enquête ne sont pas écrites dans le chapitre existant : aucune interaction ne les révèle artificiellement. Ne pas fusionner avant la passe qualité complète.
- Générateur Next : normalisation automatique du titre du bloc d'instructions dans `AGENTS.md` conservée. Les imports temporaires `.next/dev` de `next-env.d.ts` seront remplacés par le build de production avant commit.

---

## Lot B — Réalisation du Tribunal

- Inspection réelle du banc, de la lampe et des dossiers ; cadrages rapprochés bornés puis retour au plan d'ensemble. Le dossier devient ouvrable uniquement après l'audience terminée. Le moteur reste seul responsable de cette progression. Transition de noir à lumière sans mouvement forcé en mode réduit.
- Test raycast du banc puis du dossier, transition réelle vers la maison, assiette et reprise : réussi. Captures `tribunal.png` et vidéo `test-results/environment3d-real-raycast-*/video.webm` reproductibles. Fichiers : `EnvironmentStage.tsx`, `WorldCanvas.tsx`, `ScenePlayerTribunal.tsx` et libellés dans `src/content/environments.ts`/`WorldModels.tsx`.
- Limite conservée : aucun enregistrement humain du Greffier. Le texte n'est jamais présenté comme une voix livrée. Étape suivante : cadrage domestique et matériaux.

---

# Opération Halloween — audit du 26 octobre 2026

- Source préservée : `backup/claude-26-octobre`, `2b2491b`. Intégration sur `codex/halloween-integration`, issue de `origin/main` (`9b287fd`), sans conflit. PR #4 et #5 confirmées fusionnées sur GitHub ; aucun de leurs changements n'est réintroduit séparément.
- Périmètre : ouverture du Tribunal puis premier chapitre de La Sixième Place (trois scènes, trois postures à table, exploration, FAM-01/FAM-02 et conséquences différenciées). L'enquête complète, la cassette, la lettre, la confrontation avec Henri et le retour narratif au Tribunal restent à produire. Ce lot ne livre pas le jeu Halloween complet.
- Corrections d'audit : dépendances React du contenu explicites ; registre `/ma-loi` corrigé pour annoncer et ouvrir le premier chapitre disponible. Contrats historiques inchangés, trois contrats ajoutés ; journal du dossier séparé de l'audience, de Gabriel et des éditions historiques. Aucun changement de schéma de sauvegarde.
- Validation locale : installation figée, formatage, lint sans avertissement, TypeScript, build de production, contrats et validation des contenus réussis (2 000 parcours historiques, 500 REBIRTH, 500 Tribunal, 500 dossier). Tests unitaires : 117/117 lors de la relance isolée ; premier lancement concurrent avec build et simulations : un timeout de 5 s du test du prologue, sans modification de son seuil ni de ses assertions.
- E2E : 29/29 sur build de production ; puis 7/7 du dossier après renforcement de l'audio. Transition Tribunal → dossier, trois branches complètes, conséquences persistées, carnet et focus clavier, reprise exacte, passage sans preuve inventée, absence d'erreurs console. Audio : deux sources effectivement démarrées, volume persistant, mute et appareil indisponible. Captures `test-results/**/hall-public.png` et `house-mobile.png` inspectées : desktop et mobile 360 px lisibles ; captures générées exclues de Git, reproductibles avec les tests.
- Particularité Windows : le lancement E2E avec serveur géré a affiché ses 24 résultats mais n'a pas rendu son bilan de fermeture. Les relances concluantes utilisent un serveur `pnpm start --hostname 127.0.0.1 --port 3001` indépendant puis `$env:LAW_BASE_URL='http://127.0.0.1:3001'; pnpm test:e2e --workers=2`.
- La fusion reste conditionnée à la CI de la PR d'intégration. Aucun secret, capture ou fichier temporaire inclus. Sauvegarde Claude intacte ; aucun force push.
- Validation hébergée : 15/15 E2E Tribunal/dossier réussis sur le déploiement Netlify `6adf36f7b807486b8f18b979` (`ae79d9a`). Les deux premiers essais ont chacun échoué uniquement sur les trois assertions console : l'iframe du panneau collaboratif Netlify est bloquée par la CSP. Le lien permanent injectait aussi ce panneau. Le paramètre officiel `?ntl-drawer-state=hidden` au démarrage des trois parcours supprime l'injection ; aucune erreur n'est filtrée et la CSP est conservée. Documentation : https://docs.netlify.com/deploy/review-deploys/netlify-drawer-for-feedback/troubleshoot-the-netlify-drawer/ . Ce défaut concerne l'outil de prévisualisation, pas une décision ni une sauvegarde du jeu.

---

# THE LAW: REBIRTH — État réel au 26 octobre 2026 (historique avant intégration)

## Ce qui est vrai aujourd'hui

- **`main` à `3427612`** : l'accueil public (`/`) ne présente plus que le Tribunal (« VOUS AVEZ ÉTÉ CONVOQUÉ. ») ; Les Archives du silence (Gabriel Varenne) n'a plus aucun lien public mais reste jouable à `/jouer/t0`, avec sa sauvegarde intacte et isolée. `/ma-loi` est désormais le registre du Tribunal (nouvelle UI, export/effacement de l'audience du Tribunal uniquement — l'export/effacement dédié des anciennes sauvegardes a été retiré de cette page ; les données elles-mêmes ne sont pas touchées).
- PR #3, #4, #5 fusionnées. Correctifs réels effectués pendant l'intégration, pas seulement du formatage :
  - un vrai défaut moteur (`src/engine/talk.ts` : `walkTalk` saute silencieusement tout nœud narratif sans question — une UI qui ne lit que `track.cursor` perdait du texte réellement écrit) corrigé à la source par `visibleTrailNodes`/`visibleLines`, appliqué au Tribunal et à Gabriel ;
  - un vrai bug React (`react-hooks/set-state-in-effect`) dans le nouveau système audio global (`src/ui/audio/HorrorAudio.tsx`) ;
  - un vrai conflit UX : le nouveau son global dupliquait le contrôle « Activer le son » déjà existant sur `/jouer/t0` — `HorrorAudio` exclut maintenant ce chemin ;
  - plusieurs tests E2E qui ciblaient l'ancienne UI de `/ma-loi` ont été réécrits contre la nouvelle, sans perdre la garantie qu'ils protégeaient (effacer l'audience du Tribunal n'efface jamais une sauvegarde d'une autre édition — testé avec deux sauvegardes historiques simultanées désormais, pas une seule).
- État vérifié sur `main` lui-même (pas seulement sur les branches) : `pnpm typecheck`/`lint`/`format:check` verts, build de production OK, 22/22 E2E.
- **Travail local de Codex en cours**, retrouvé non committé puis sauvegardé par Claude dans la branche `codex/sixieme-place-opening` (poussée sur GitHub, commit `8c8e13c`, **non fusionnée, non encore vérifiée par les contrôles complets**) : premiers éléments de La Sixième Place — `src/content/sixieme-place.ts`, `src/ui/tribunal/HouseStage.tsx`, route `/jouer/sixieme-place`, extensions du lecteur Tribunal et de l'audio procédural. À auditer et valider avant toute fusion.
- Documents canoniques inchangés : `docs/rebirth/canon-2026/00-BIBLE-DU-TRIBUNAL.md`, `DOSSIER-01-LA-SIXIEME-PLACE.md`, `DOSSIERS-02-03-ET-PROCES.md`. Bilan de production et limites honnêtes dans `docs/rebirth/canon-2026/AUDIT-PRODUCTION.md`.

## Pour reprendre

```
git fetch origin
git switch codex/sixieme-place-opening   # ou: git pull si déjà dessus
pnpm install
pnpm typecheck && pnpm lint && pnpm test && pnpm validate:content && pnpm build
LAW_E2E_PORT=3101 CI=1 pnpm test:e2e
```

Rien n'est encore annoncé comme jouable publiquement pour La Sixième Place : aucune route vers `/jouer/sixieme-place` n'existe dans la navigation publique de `main`.

---

# THE LAW: REBIRTH — Transmission à Claude, 24 octobre 2026 (historique)

## État actuel (dépassé — voir section ci-dessus)

La directive **Opération REBIRTH : nouvelle histoire, nouveau jeu** remplace la direction « Le Greffier ». Le canon public est désormais **Les Archives du silence**, à Valombre. Gabriel Varenne, 34 ans, revient en octobre 2026 sur la disparition d'Élise Moreau en 2009. Les dossiers de 2013 et 2018, le dernier greffier et le verdict restent à développer.

**Lot 1 livré : prologue complet, pas jeu complet ni dossier T0 complet.** `/jouer/t0` présente sept scènes : arrivée à 23 h 46, enveloppe, restauration d'un message, comparaison des dépositions, choix Nora/Keller/solitaire, couloir B et photographie récente. Une issue termine le prologue et conserve le dossier ; l'interface annonce explicitement que la suite n'est pas encore jouable.

## Réalisation et points d'entrée

- `src/content/rebirth.ts` : scènes publiques, dialogues, conditions, effets, pièces `RB-001` à `RB-009`, lieux et conclusions factuelles. La photo d'Élise lui attribue une intention et une parole, sans confirmer son sort. Les deux textes diffèrent ; l'auteur de la modification reste inconnu. Une serrure récente ne prouve pas qu'Élise est vivante.
- Le choix Nora donne accès à une copie de maintenance et une alliée qui cache sa source ; Keller facilite l'entrée mais avertit les archives ; Gabriel seul doit entrer sans témoin. Les suites visibles et les relations enregistrées diffèrent. Les pièces ne sont acquises qu'après « Consigner », pas simplement après ouverture.
- `src/ui/t0/ScenePlayerT0.tsx` : lecteur d'enquête unique, cadence manuelle, documents, carnet, pause/passage libre, clavier, export, fin de prologue et reprise dans un document. `Stage.tsx` et `Controls.tsx` fournissent les composants réutilisables.
- `public/rebirth/` : deux décors bitmap originaux générés puis optimisés en WebP, illustrations des pièces et portraits vectoriels originaux, onze WAV locaux. Prompts/provenance dans `docs/visual-research.md`, production sonore dans `docs/audio-direction.md`.
- Le son est volontaire : pluie/vent, ventilation, motif musical synthétique, papier, téléphone, pas, porte, grésillement et horloge. La scène finale passe au silence. Volume/mute persistants, aucun AudioContext avant activation, fermeture à la sortie. Les deux clips de voix française sont synthétisés localement, avec transcription équivalente. C'est une voix synthétique, pas une interprétation de comédienne.

## Sauvegardes : ne pas fusionner les éditions

- Nouvelle clé : **`thelaw:rebirth:save-t0`**. Nouveaux IDs : **`rebirth.t0.*`**. Nouveau registre append-only : **`src/content/rebirth-contracts.json`** (7 contrats).
- Les clés historiques `thelaw:save`, `thelaw:save-t0`, `thelaw:save-t2`, `thelaw:save-t3`, leurs 86 contrats, les migrations et fixtures restent préservés. Les anciennes données ne deviennent jamais des actes de Gabriel. Leur export brut est accessible depuis le carnet, sans ancienne interface narrative.
- `scripts/contracts.ts` vérifie séparément les deux registres ; `--write` n'écrit que les contrats manquants. Le registre historique précédemment signalé localement est protégé et ne contient aucun changement fonctionnel dans ce lot.
- Le schéma reste v5 : `settings.volume` est optionnel. La validation des IDs accepte explicitement le namespace `rebirth.`. Le moteur déterministe, le journal et les conditions/effets ne dépendent pas de React ou du navigateur.
- Aucun reporting ni envoi de texte libre. L'ancienne API de collecte reste 410. Le site de préinscription est indépendant et n'a pas été modifié.

## Nettoyage effectif

Ancien lecteur T1–T3 et ses seuils, `BeatRenderer`, `GlyphInput`, onboarding et fins, ancien `World` et CSS, ancienne projection visuelle T0, audio `actAudio`, `grain.svg` et tests E2E des parcours publics supprimés ont été retirés. Les deux suites E2E existantes sont réécrites autour du nouveau comportement. Les tests du moteur et les fixtures historiques restent pertinents et conservés. **Motion est retiré de package.json et du lockfile**, sans nouvelle dépendance. Les styles globaux de l'ancien gameplay sont remplacés par les primitives encore consommées.

Les anciens contenus narratifs restent dans le dépôt à titre de compatibilité et de validation des sauvegardes, sans route publique jouable. `/jouer`, `/jouer/t2` et `/jouer/t3` redirigent vers `/jouer/t0`.

## Vérifications et limites

- Build, lint, TypeScript, Prettier et contrats vérifiés. Validation : 500 nouveaux parcours seedés, plus les simulations et fixtures historiques. Vérification de l'énergie non nulle des onze WAV et de la présence de décors différents.
- 14 E2E sur build de production : les trois routes de contact, parcours complet au clavier, reprise dans un document, absence de fausse collecte, passage de toutes les scènes, export/effacement sans toucher l'ancienne édition, activation/volume/mute, appareil audio indisponible et redirections. Captures inspectées à 390 et 1440 px ; contrôles de largeur à 320, 390, 667×375, 768 et 1440.
- À poursuivre : dossier Élise après le prologue, archives et témoins, enquête Camille 2013, station 2018, Tribunal et verdict déterministe. Aucun de ces chapitres n'est annoncé comme livré. Portraits stylisés et voix synthétique à améliorer si une direction plus réaliste est retenue. Pas de test physique iPhone/Android ni de nouvelle mesure Lighthouse à ce stade.

La suite de ce fichier est l'historique de l'ancienne édition et des travaux précédents ; elle n'est plus le plan narratif actif.

---

# Progress

## Done

- Next.js App Router, TypeScript strict, Tailwind CSS v4, design tokens, local fonts, ESLint, Prettier, Vitest, Playwright configuration and GitHub Actions.
- Pure event-sourced engine, Zod content and save schemas, deterministic replay, conditions, effects, flow, laws, contradictions, text templating and observations.
- Full Timeline I content with branch-dependent return, law proposal, confrontation and coda. Seeded validator simulates 500 complete runs and checks reachability.
- Home, onboarding, player, outcome, certainty, law, pause, settings, end, history, export and erase screens; local autosave and corrupt-save backup.
- Unit tests for engine and corrupt saves; Playwright journeys for a complete run, full keyboard play, saved resume, reduced motion, privacy and layouts at 360, 768 and 1440 px.
- Lighthouse mobile on the production home page: Performance 95, Accessibility 100 (single local run).

- Timeline II — LA MAISON is playable end to end after LA PIÈCE: threshold with inherited memory, 12 scenes (4 conditional), per-person consequences, a law born in the house (`P_PAROLE`), confrontations across timelines and a residue ending. `validate:content` plays 2,000 seeded T1→T2 journeys.
- Save schema 4: per-scene contract registry, byte-exact historical fixtures (84db105, 17c614d, fd2e163), load-boundary invariants, replay fuzzing.
- Production hardening: browser security headers, non-cacheable reporting responses, JSON-only reporting boundary, byte-accurate request limit and strict top-level payload fields. The factual release checklist and missing human/legal inputs live in `docs/playtest-reporting.md`.

- Timeline 0 — L’EXAMEN is merged on main (PR #2): 28 scenes of deterministic conversation (`talk` input, `line_chosen` events, silence recorded, narrative notes, save schema 5). T4 (LE TRIBUNAL) is still a presentation door only.
- 24 October 2026 audit and REBIRTH proposal: see `docs/rebirth/` (audit, creative directions, story bible, art direction, gameplay systems, release plan, cleanup plan, decisions). Security update of dependencies (Next 16.4.3 and others), unique accessible name per home door, `format:check` in CI, `.gitattributes`. La direction « Le Greffier » est validée le 24 octobre avec les corrections consignées ci-dessous.

## Decisions

- The three possible scene 8 screens are one dramatic slot after the surgeon. A signed law without a contradiction sees `t1.pas-encore`; without a signed law, a strong positive evidence trend can see `t1.confrontation-non-signee`.
- Narrative text is rendered as a React text node, so free text is escaped by React instead of HTML entity encoding, avoiding double-escaped player input.
- Local font packages are bundled with `next/font/local`, avoiding runtime requests to third-party font hosts.

- Director pass — the four people of the house are the strangers of the room, recognisable only by detail: Sem is the man of fifty-two (_Dix mille_), Mila is dossier B (_Chambre froide_), Omar's brother Yanis was room 14 (_Le protocole_), Camille is one of the ten, or the stranger who gave seven years (_Sept années_). T1 choices decide their circumstances and change which dilemma each person brings. The ending re-attaches the coda's anonymous fragments to their names and closes on the player's exact words from _Pourquoi_.
- Director pass — each person carries one kind of dilemma (promise, complicity, secret, truth) plus one scarcity scene; betrayal returns the next morning in the person betrayed (`camille-sait` after a lie, `sem` after revealing his secret, `retour-mila` after keeping hers). The first, lightest choice — where to sit — decides who walks the player to the door.
- Director pass — a law interrupts the player once per timeline. Four confrontations in one night turned the question into a formality; later contradictions stay on record (`raised: false`, Ma loi, report) and the scenes themselves place the old act beside the new answer.

## Remaining

- Conduct a human timing check for the 8–12 minute target.
- Remote playtest reporting was retired for REBIRTH. Historical save fields remain readable; see `docs/playtest-reporting.md`.
- A human timing check of LA MAISON (target comparable to LA PIÈCE) and a human read of the French text by a native editor.
- LA VILLE — décisions, règle et décors des six actes sont intégrés. La durée de jeu et la relecture humaine restent à vérifier.

## Deviations and justifications

- THE-9 — Diffabilité : les sources sont normalisées par Prettier et `format:check` précède le lint en CI. Les fichiers générés `next-env.d.ts` et `pnpm-lock.yaml` restent exclus du formatage.
- THE-9 — Le diff ignorant les espaces ne peut pas être vide après découpage des lignes et ajout du contrôle CI. La vérification compare les sources à la sortie exacte de Prettier sur le commit initial, puis les AST JavaScript émis, en normalisant les parenthèses et les fragments textuels JSX adjacents. Aucun contrat public ni format de sauvegarde ne change.
- THE-9 — Le SHA du commit de formatage est enregistré dans `.git-blame-ignore-revs` par un second commit documentaire : un commit ne peut pas contenir son propre SHA. Aucun historique n'est réécrit.
- The document describes ten scenes while the branching confrontation can produce three different scene IDs. Twelve content records implement the eight ordered scenes, three scene 8 branches and one deferred return.
- Experience pass — `t1.pas-encore` is now a first-class `passage`: its visit remains event-sourced, but the engine advances after the authored beats without fabricating a `choice_locked` event. Schema version 3 migrates the exact former content identity so existing saves remain readable.
- Experience pass — `BeatRenderer` owns bounded, testable narrative pacing. Beats reveal automatically, consequences retain a short reading hold and then lead to the next meaningful control; no Space/click-to-reveal primitive or generic outcome “Continuer” remains. Reduced motion removes movement, not reading time.
- A choice revealed on reload is reconstructed from the event journal; transient intra-beat animation progress is not persisted.
- The local browser initially crashed between tests with a serverless Chromium flag; removing that flag allowed the full suite to pass.
- Playtest Reporting V1 — `reportingStatus` (not_sent/sending/sent/failed) is a persisted field on `SaveGame`, not an in-memory store: an ephemeral store cannot satisfy the requirement that a refresh or a navigation to "Ma loi" and back must not cause a duplicate send. A `sending` status found at load time (interrupted session) is downgraded to `failed` rather than left to block silently forever with no retry.
- Playtest Reporting V1 — there is no server-side idempotency or deduplication by `runId`: the API route has no datastore to check against, and a Brevo idempotency key would have nothing to be checked against without one. If the client's connection drops after the server has received the request but before the response reaches the browser, a retry can produce a genuine duplicate email. This is documented, not hidden, in `docs/playtest-reporting.md`.
- Playtest Reporting V1 — `confrontation_answered` events carry no `sceneId`. The report correlates each one to its scene by pairing it positionally, in event order, with the `choice_locked(input:'confrontation')` event the player flow always appends immediately after it — not a change to the event schema itself.
- Playtest Reporting V1 — a `law_declined` event for a principle that is later signed is not reported as a separate "declined" record; only the eventual signature is kept, since it supersedes the earlier decline.
- Experience pass — hold-to-confirm was removed as the standard interaction. Every in-game decision now commits on a single deliberate click (or one click on a distinct "Confirmer"/"Signer" for two-stage inputs: slider, glyph, laws). The `HoldButton` primitive and its `simpleConfirmation` setting are gone from the UI; `settings.simpleConfirmation` is kept in the schema/defaults (deprecated) so existing saves migrate unchanged. Telemetry (`hesitationMs`, `selectionChanges`, `choice_locked`) is unaffected.
- Experience pass — the interface deepens through shared tokens and primitives rather than per-page styling: a layered surface/ink palette that carries its own contrast in daylight and darkness, a deliberate `.choice` control (raised surface, left index rule, strong hover/focus/selected), a `.commit` act, and a `.signal` variant reserved for the irreversible erase. The room accumulates one identical mark per committed decision (history, not judgment) and a restrained top-boundary pulse acknowledges each commit; both respect `prefers-reduced-motion`.
- Experience pass — the erase action in "Ma loi" moved from a hold gesture to an explicit two-click confirm (Effacer → Confirmer l'effacement), keeping a safety step for the one irreversible action without reintroducing hold.
- Experience pass — the Room now projects factual `choice_locked` events into deterministic, neutral incisions and shifts its light axis from the latest decision. Regression levels progressively loosen the architecture and close the perspective without assigning meaning or value to any choice; traces remain visible on mobile and all motion collapses under reduced-motion settings.
- Experience pass — ordinary choices remain native buttons for keyboard and assistive technology, but their shared presentation is now a numbered spatial threshold instead of a grid of raised cards. Generic functional “Continuer” labels were replaced by the specific actions “Reprendre” and “Consigner”; authored decision text remains untouched.
- Timeline II — The IncompatibleSaveError seen before this pass was not migration behaviour: the T2 adapter validated every T2 save against T1 content (`migrateSave`'s default argument), so Timeline II could never be started or saved; the UI swallowed the error. `migrateSave` now requires its content and each adapter is bound to its timeline.
- Timeline II — Save compatibility is decided per scene contract instead of the canonical identity of the whole content. The former rule made every text edit incompatible with every save, and the v2→v3 migration derived the "previous" identity from current content, so it would have broken at the next edit. The frozen `legacy-content-v1.json` had also been rewritten once (3958bfc), silently orphaning earlier saves; those saves are now read through the identity they embed.
- Timeline II — Scene IDs `t2.*` were restructured at version 2 and `t2.l-exception` removed: no T2 journal could ever have been written before this pass, so no history references them. T1 scene IDs and versions are unchanged; T1 edits in this pass are text only (the coda's two organ lines were attached to the wrong choice and are swapped back).
- Timeline II — Memory is copied into the house journal (`memory_inherited`) rather than read from the room's save, so the house keeps what the player did even if the room is erased or replaced later.
- Timeline II — `relation_event` was declared as a journal event but never written or accepted by the schema; relations are derived from `relationEvent` effects of recorded choices, stamped with the choice's own ID and time (the reducer previously called `Date.now()`).
- Timeline II — Signing a self-written law is recorded as that sentence (`law_signed.statementText`), no longer as "the default sentence, then a revision" the player never made. Journals written before keep their historical form.
- Timeline II — `--law-space-5` was used by every choice button but never defined, invalidating the padding shorthand at all viewports (the index overlapped the first letter). The token is now defined.
- Second playtest — reduced motion shows a consequence all at once; the automatic hold now keeps the staggered reveal's total reading time (`transitionHold`), since the previous hold, computed from the last line only, gave reduced-motion players a fraction of the reading time.
- Second playtest — two tabs on one journal follow each other through the `storage` event; a write refused anyway is stated with "Recharger la partie" instead of failing silently. The journal is never forked.
- Cadence pass — narration and decisions no longer share one rhythm. Beats inside a scene still reveal on their own; a committed decision now rests: the committed option stays above its consequence (`lock-trace`), and the consequence waits, without any time limit, for a small textual “Suivant” focused for Enter/Space and sized for touch. This replaces the automatic reading hold after outcomes that playtesters found too fast; it does not bring back a per-paragraph “Afficher la suite”. `outcomeCadence` (pure) decides: every decision rests, a passage and a single-option way out (“Sortir de la pièce/maison”) flow on without a second act. Certainty is asked under the resting consequence instead of replacing it, and a signed or declined law rests on its own page (“Signée.” / “Non signée.”).
- Cadence pass — the phase of a visit is read from the journal (`visitStage`: deciding, consequence, sealed), so a reload returns to the same resting consequence. Moving on writes only the next `scene_entered`; no `choice_locked` is ever created by the rest, so reporting and room traces count real decisions only. `advance` refuses to move on from a visit that is no longer the latest, so a double click or key repeat cannot skip a scene. No save schema change.
- Director pass (cadence) — in the ending, whoever walks the player to the door does so before anyone leaves (Mila, gone at 4:12 after the night at her door, is said to be absent rather than turning away); the envelope returns the next morning in Omar's shifts; the balcony answer that contradicts the room returns beside Yanis's name instead of being explained on the balcony; Mila is twenty a year after the cold room; revising a law no longer offers its current wording.
- Timeline III — LA VILLE is playable for its first two acts (Le Guichet, La Règle): 7 scenes, `t3.premier-jour` through `t3.la-fenetre`, inheriting La Maison's memory (which already carries La Pièce's). Actes III-VI (Le Rouage, Le Dossier, Tenir, La Sortie — Nadia, Farid, la grève, la liste définitive) are designed in the validated blueprint but not yet written; `t3.la-fenetre` closes this milestone as a chapter break, not as T3's true ending, and is the current `codaSceneId` only so completion/reporting/inheritance work for what ships.
- Timeline III — the engine gained a collective-rule primitive, parallel to relations: `ruleEnacted`/`ruleRevised`/`ruleApplied`/`exceptionGranted` effects append to `state.rules` (never rewrite), and a `rule` condition reads the _current_ criterion (the latest enacted-or-revised entry) while the full history stays on the journal for a future Tribunal. `Memory` gained `relations`, `rules`, `certainty` and `contradictions` (a closed, factual summary — law, scene, raised, answer) so the T1→T2→T3→T4 chain composes transitively without T3 reading T1's content, exactly as `choices`/`laws` already did. No save schema bump: only the `Memory` shape carried at a new-timeline threshold changed.
- Timeline III — a real procedural audio system replaces the unused `AudioManager` stub: three Web Audio layers (a low drone, a slow-pulsed carrier, filtered noise) cross-fade over each scene's declared act (`audio.ambience`, `'act-1'`..`'act-6'`), built only after a first user gesture, muted by `settings.sound` (already a persisted per-timeline setting), and every entry point wrapped so a failure is silent rather than blocking play. The act→gain mapping (`src/audio/actAudio.ts`) is pure and unit-tested; the Web Audio wiring itself is not (no jsdom `AudioContext`), which is the honest limit of that coverage.
- Timeline III — `scripts/simulation.ts` gained `simulateJourney3`, chaining a third `simulateRun` off T2's memory; `validate:content` now plays 2,000 seeded T1→T2→T3 journeys (up from T1→T2), asserting T3's own coda, 100% scene/variant coverage, and that the attribution rule always starts with `enacted` before any `revised`. `pnpm contracts --write` registered the 7 new scene contracts.
- Timeline III — Actes III (Le Rouage), IV (Le Dossier), V (Tenir) and VI (La Sortie) are written: 21 new scenes (28 total). Farid deepens across Le Café/Farid le sait; Nadia is introduced (`t3.nadia`) before her dossier collides with the attribution rule (`t3.nadia-dossier`), with a real exception/precedent pair (`t3.exception`, `t3.precedent`) showing the collective cost either way; institutional pressure and a strike carry Act V (`t3.la-pression`, `t3.la-greve`); La Liste Définitive (`t3.la-liste`) is signed on a single tap, no confirmation; the 417 motif resolves from a monthly count planted in `t3.la-routine` to Nadia's own file number in `t3.quatre-cent-dix-sept`; `t3.le-registre` (maintenir/réviser/laisser) precedes the true ending `t3.sortie`, now `codaSceneId`. `t3.consequence-differee` and `t3.retour-connu`/`t3.ce-qui-reste` use `variants` to callback a T1 choice (`t1.dix-mille`) without T3 reading T1's structure. Rule-touching effects added in Acts IV-VI (`ruleApplied`/`exceptionGranted`/`ruleRevised` on Nadia's dossier, the exception and the registry) are wrapped in a defensive `if: {any: [...]}` guard against the simulator's fuzz `scene_skipped`, so a record can never start with anything but `enacted`.

## REBIRTH — 24 octobre 2026, reconstruction Codex

- Lot A : suppression de `scripts/reset-t0-contracts.mjs` (purge incompatible avec les contrats historiques), du handoff T0 terminé et du relais `Room` sans logique ; `ScenePlayer` utilise directement `World`. Retrait de `silentAudio` et des méthodes audio sans appelant. Aucun contrat, scène, clé de stockage ou format de sauvegarde modifié.
- `pnpm contracts` vérifie désormais sans écrire ; seul `--write` enregistre les nouvelles versions. La modification locale préexistante de `contracts.json` reste exclue des commits Codex.
- Lots suivants : palette centralisée, entrée et registre uniques, puis lecture/pièces, préparation du Tribunal et verdict après validation narrative. Le reporting transmet encore les textes libres : correctif de confidentialité nécessaire avant ouverture publique.
- Arbitrages narratifs proposés : rendre toute falsification vérifiable par une pièce effectivement enregistrée, y compris sans réponse au bouton ; remplacer la fin imposée pour absence de loi ou délai expiré par une issue explicitement choisie ; résoudre la contradiction entre occupation constante de la salle et finale où tous sortent. D-01 à D-05 restent en attente dans la bible de Claude.

- Lots B/C : palette REBIRTH sur les tokens partagés, identité des métadonnées/manifest/aperçu et du chrome, accueil monumental CSS sans ressource externe, registre unique avec états réels et visites consignées ; remplacement des styles de l'ancien registre, aucun second menu.
- Lot D : composant réutilisable `NotesLedger` dans les contrôles de conversation existants, consultable depuis « Ma loi » et la pause T0 ; source, catégorie, statut et posture proviennent du journal. T0 est désormais inclus dans l'export et l'effacement explicite. Aucun nouveau format de sauvegarde.
- Validation créative reçue : « Le Greffier » avec preuve disponible, fin choisie et occupation cohérente. Préparation du Tribunal autorisée ; ne pas présenter une simple maquette comme une audience jouable.

- Lot confidentialité : retrait des cinq modules de reporting et de leurs quatre fichiers de tests devenus sans objet ; remplacement des tests API par le contrat 410 sans collecte. Suppression du consentement de playtest, des contrôles d'envoi, styles et mocks associés. Les champs historiques restent lisibles, le journal et ses archives ne changent pas. La route résiduelle n'utilise aucune clé Brevo et ne lit jamais le corps.

- Lot préparation du Tribunal : `start` accepte des mémoires secondaires après la source primaire ; chaque mémoire est copiée. Test avec de vrais parcours simulés T0 et T1→T2→T3, relecture persistée, absence de mutation par l'appelant et refus des sources dupliquées. Aucun écran d'audience vide ni déverrouillage fictif ajouté.
- Retrait de 16 tokens sans consommateur après recherche dans app/src et des anciennes règles d'accueil sans usage. Les couleurs de texte T0 utilisent les rôles partagés.

- Validation finale des lots : 119 tests unitaires (14 fichiers), 86 contrats vérifiés sans écriture, 2 000 parcours T1→T2→T3 et 500 parcours T0 couverts par les tests ; lint, TypeScript du build, build de production et Prettier verts. Suite navigateur complète : 73/73 ; après ajustement du bouton de reprise et du contraste d'effacement, 21/21 tests d'interface supplémentaires passent sur le dernier build. Audit npm : aucune vulnérabilité connue.
- Contrôle visuel des captures mobile et desktop ; 320 px, paysage 667×375, clavier et réduction des animations vérifiés. Lighthouse et appareils physiques restent à tester.
- Restent à réaliser : écriture et validation de l'audience T4, témoignages, pièces confrontables, composition du Tribunal et verdict personnalisé ; enrichissement narratif éventuel de T1–T3. Les scènes actives ne sont pas supprimées avant leur remplacement jouable.
