# 04 — Direction artistique

> Statut : **proposition**. Elle s'appuie sur `docs/visual-research.md` et `docs/audio-direction.md` (conservés) et sur des captures du build de production du 24 octobre (accueil 390 px et 1440 px, première scène de T0 à 390 px).

## 1. Constat sur l'existant

- **T0 est déjà cinématographique.** La première scène (pluie animée, feu rouge qui ne passe jamais au vert, locuteur nommé, trois réponses numérotées) fonctionne à 390 px sans adaptation. Le rouge y désigne un **objet** (le feu), pas un décor.
- **L'accueil est élégant mais c'est un menu.** Une liste typographique de cinq lignes ; « Commencer » a le même poids sur L'EXAMEN et LA PIÈCE ; le pied de page dit encore « LA PIÈCE » ; sur mobile le repère « T/L » chevauche le titre. Aucune ambiance, aucun son, aucune entrée.
- **La palette actuelle est neutre** (`src/styles/tokens.css` : `--law-void #070709`, `--law-paper #efece4`, signal `#b23a30`). La palette du brief est plus chaude et plus judiciaire.
- **Polices** : Instrument Serif (affichage), Inter Tight (corps), IBM Plex Mono (méta), toutes locales (`@fontsource`). À conserver.
- **Décors** : `World` (room / house / city) en DOM/CSS/SVG, sans moteur 3D ; `Stage` pour T0. Décision documentée de ne pas utiliser Three.js (`docs/visual-research.md`) : **je la confirme**.

## 2. Palette et tokens

| Rôle             | Nom du brief     | Hex       | Token proposé                              | Remplace                        |
| ---------------- | ---------------- | --------- | ------------------------------------------ | ------------------------------- |
| Fond             | Noir abyssal     | `#090809` | `--law-void`, `--law-black`                | `#070709`, `#0d0d10`            |
| Surface          | Bordeaux profond | `#241315` | `--law-surface-2` (et dérivés par mélange) | `#141418`, `#1c1c21`, `#24242a` |
| Danger / rupture | Rouge sang       | `#8E302D` | `--law-signal`                             | `#b23a30`                       |
| Texte secondaire | Ivoire ancien    | `#B9A18C` | `--law-ink-2`                              | `#c6c3bb`                       |
| Texte principal  | Blanc verdict    | `#E6DED3` | `--law-paper`                              | `#efece4`                       |

**Principe de migration.** Redéfinir les valeurs des tokens existants dans `src/styles/tokens.css` plutôt que d'en créer d'autres : tout le code qui lit `var(--law-…)` suit sans modification. Les couches de surface intermédiaires se calculent par `color-mix()` entre abysse et bordeaux.

### Contraste (WCAG 2.x, luminance relative sRGB ; calculé le 24 octobre 2026)

| Paire                        | Ratio       | Usage permis                                       |
| ---------------------------- | ----------- | -------------------------------------------------- |
| Blanc verdict sur abysse     | **15,00:1** | Texte courant                                      |
| Ivoire sur abysse            | **8,13:1**  | Texte secondaire, méta                             |
| Blanc verdict sur bordeaux   | **13,36:1** | Texte sur surface                                  |
| Ivoire sur bordeaux          | **7,24:1**  | Méta sur surface                                   |
| Blanc verdict sur rouge sang | **6,03:1**  | Texte sur **fond** rouge (bouton irréversible)     |
| Ivoire sur rouge sang        | 3,27:1      | **Interdit** pour le texte courant                 |
| **Rouge sang sur abysse**    | **2,49:1**  | **Interdit** pour du texte, un liseré ou une icône |
| Rouge sang sur bordeaux      | 2,21:1      | **Interdit**                                       |

**Conséquence concrète.** `#8E302D` ne peut pas servir de texte ni de bordure sur fond sombre : il échoue au seuil de 3:1 pour les composants d'interface. Il n'est utilisable que comme **aplat** portant du texte blanc verdict. Pour un trait ou un petit texte rouge, un dérivé plus clair est nécessaire : **`#CF5B54`** (5,02:1 sur abysse, 4,48:1 sur bordeaux), à nommer `--law-signal-line`.

### Règle du rouge

Le rouge signifie **conséquence irréversible**, sans exception :

1. Le bouton « Prendre la place de LAW » (seul acte irréversible de T4).
2. Le sceau de verdict.
3. Un objet de fiction rouge au bon endroit (feu du prologue, voyant du téléphone).
4. L'effacement de la sauvegarde.

Interdit : bordures décoratives rouges, titres rouges, fond rouge d'ambiance. Si le rouge apparaît, quelque chose a changé pour toujours.

## 3. Typographie

| Usage                                        | Police           | Règle                                                |
| -------------------------------------------- | ---------------- | ---------------------------------------------------- |
| Titres, répliques de LAW, verdict            | Instrument Serif | Jamais en dessous de 20 px ; le verdict en corps 28+ |
| Corps, interface                             | Inter Tight      | 16 px minimum sur mobile                             |
| Méta, numéros de pièce, horodatages, tampons | IBM Plex Mono    | Majuscules espacées, 12 px minimum, jamais en rouge  |

La typographie française (espaces insécables fines avant `? ! : ;`) est déjà assurée par `src/engine/text.ts`. Aucune nouvelle police : chaque police ajoute du temps de chargement mobile.

## 4. Écrans

### 4.1 Accueil — « Vous avez été convoqué. »

Séquence de lancement (≤ 6 s, passable d'un tap/Entrée) :

1. Noir complet. Une enveloppe discrète apparaît en bas : **« 04:12 »**.
2. Le texte **VOUS AVEZ ÉTÉ CONVOQUÉ.** en Instrument Serif, blanc verdict, apparaît mot par mot.
3. Deux boutons : **Entrer** (nouvelle partie) et **Reprendre** (si une sauvegarde existe).
4. Une question de son avant de continuer : **Avec le son / Sans le son**. Aucun son n'est joué avant ce choix (exigence du brief).

Sans animation (réduction demandée ou JavaScript lent) : la phrase est affichée immédiatement et fixe ; le parcours reste identique.

### 4.2 Le bureau de dossiers

Cinq objets posés sur un bureau (sombre, bois sous bordeaux). Quatre sont des **chemises** : 0 L'EXAMEN, I LA PIÈCE, II LA MAISON, III LA VILLE. Le cinquième est une **enveloppe scellée** : IV LE TRIBUNAL, qui se descelle quand T0 est terminé.

Chaque chemise affiche :

- le **titre** (Plex Mono, majuscules) et **la phrase** (Instrument Serif) déjà dans `copy.doors` ;
- l'**état** par un tampon : NON OUVERT / EN COURS / CLOS (tampon, pas barre de progression ; le dépôt interdit déjà « un pourcentage ou un nombre restant », `doors.md`) ;
- les **indices découverts** (§ `05-GAMEPLAY-SYSTEMS.md` §11), en liste de mots.

**Ordre recommandé** : la chemise 0 est visuellement posée au-dessus des autres au premier lancement.

### 4.3 Lecteur de scène

Conserver tel quel (`ScenePlayerT0`, `ScenePlayer`) : mise en page, cadence, boutons numérotés. À faire : appliquer les nouveaux tokens, ajouter le mode « documents » (§4.5).

### 4.4 La Salle (T4)

Nouvelle composition `tribunal` dans `World` :

- **Plan fixe** : un banc vide au fond, un bureau de greffier au premier plan, **deux verres d'eau**, une plaque effacée.
- **Galerie** : des silhouettes (SVG, une forme répétée) prennent place sur les bancs à mesure que les dépositions s'achèvent. Aucune animation de personnage : seulement leur présence.
- **Lumière** : une source (haute fenêtre) qui se déplace imperceptiblement.
- **Rouge** : absent, jusqu'au dernier choix.

### 4.5 Documents et pièces

Une **pièce** s'affiche comme un papier posé (fond ivoire sombre, texte Plex Mono, numéro de pièce, scène d'origine). Elle s'ouvre dans un tiroir, jamais en plein écran : le texte reste lisible derrière. Sur mobile : feuille basse (bottom sheet) avec focus piégé et fermeture à Échap ; réutiliser le composant `Dialog` existant.

### 4.6 Verdict

Un **document judiciaire** : filigrane faible (« 04:12 »), en-tête, rubriques en tableau (voir `05-GAMEPLAY-SYSTEMS.md` §10), sceau rouge aplat avec texte blanc verdict. Format A4 à l'impression, colonne unique à l'écran.

### 4.7 Ma loi, Paramètres

Inchangés dans leur fonction. Paramètres : ajouter explicitement **Son** (sur/hors, mémorisé), **Réduire les animations**, **Taille du texte** (déjà là), et **Sauter la séquence** (déjà « Passer »).

## 5. Animations

| Principe             | Règle                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Non bloquantes       | Aucune animation n'empêche d'agir ; toutes sont interruptibles.                                                                                                                |
| Budget               | Au plus une animation de fond et une animation de premier plan simultanées.                                                                                                    |
| Réduction            | `prefers-reduced-motion` et le réglage du jeu remplacent tout mouvement par un fondu court ou un état fixe. Le temps de lecture est conservé (`PROGRESS.md`, second playtest). |
| Pas d'effets de peur | Aucun flash, aucun tremblement d'écran, aucun glitch. Le brief le demande ; la sécurité photosensible aussi.                                                                   |
| Cadence              | Les décisions « reposent » : la conséquence attend un clic sur « Suivant » (cadence déjà en place).                                                                            |

## 6. Sons

Le dépôt possède un moteur sonore **procédural** (Web Audio : drone, porteuse pulsée, bruit filtré), construit après un geste utilisateur, coupé par `settings.sound`, sans fichier tiers (`src/audio/AudioManager.ts`, `docs/audio-direction.md`).

À ajouter, **toujours procédural** (aucune licence à gérer, aucun poids) :

| Cue             | Recette                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| `salle.room`    | Réverbération courte de grande salle (bruit filtré + convolution synthétique)     |
| `salle.horloge` | Tic très discret, uniquement avant le dernier choix                               |
| `salle.galerie` | Murmure : bruit rose passe-bande, gain très faible, ne monte jamais               |
| `porte.ouvre`   | Déjà prévu dans `docs/audio-direction.md` (charnière basse, jamais un grincement) |
| `papier`        | Frottement bref à l'ouverture d'une pièce                                         |

**Contrôle utilisateur.** Choix explicite sur l'écran d'entrée ; bouton muet permanent dans le menu Pause ; aucune musique ; aucune voix.

## 7. Mobile : priorité de conception

| Point            | Exigence                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| Viewport minimal | 320 px sans défilement horizontal (tests actuels : 360, 390, 768, 1440 ; **ajouter 320 et paysage 667×375**) |
| Cibles           | 44 px minimum (`--law-target-min`), 62 px pour les réponses (`--law-control-min`)                            |
| Zone du pouce    | Les réponses restent en bas ; les infos non actionnables en haut                                             |
| Encoches         | `env(safe-area-inset-*)` sur le bas et les côtés                                                             |
| Clavier virtuel  | La zone de texte libre (T0 `ta-loi`) ne doit pas être masquée par le clavier                                 |
| Poids            | Aucune image bitmap ; décors SVG/CSS ; polices locales subsettées                                            |
| Perfs            | Cible Lighthouse mobile : Performance ≥ 90, Accessibilité 100 (valeurs mesurées en septembre : 95 / 100)     |

## 8. Accessibilité

- Contrastes : tableau §2 ; vérifier à nouveau après migration de palette.
- Nom accessible unique pour chaque porte (déjà corrigé : « Commencer — LA PIÈCE »).
- Zone d'annonce `aria-live` pour les répliques (déjà en place dans le lecteur T0, à vérifier pour T4).
- Focus visible sur toutes les commandes ; clavier seul sur tout le parcours (test E2E existant à étendre à T4).
- Contenu sensible : l'avertissement actuel (`copy.onboarding`) mentionne mort, sacrifice, culpabilité ; ajouter « deuil » et « perte de mémoire » pour T0 et T4.

## 9. Périmètre

| Lancement (31 octobre)                                                                                                                                                                 | Étendu                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens migrés ; accueil « convocation » ; bureau de dossiers ; composition `tribunal` ; pièces et panneau ; verdict HTML ; sons procéduraux de la salle ; tests mobiles 320 et paysage | Décors évolutifs de T1 à T3 par dossier ; transitions de lieu inter-dossiers ; verdict exportable en image ; variantes sonores par fin ; icônes PWA raster (déjà listées comme manquantes dans le README) |
