# 02 — Directions créatives concurrentes

> Statut : **proposition**. La recommandation est en §5 ; la décision attend validation (`08-DECISIONS.md`, D-01).

## 1. Ce que le brief demande et ce que le dépôt contient

Le brief décrit quatre dossiers neufs (étudiant et examen, accusé amnésique, voix d'une chambre condamnée, message de 3 h 17) autour d'un tribunal. Le dépôt contient **autre chose, déjà construit** :

|                   | Brief                                   | Dépôt (vérifié, voir `01-AUDIT.md`)                                                                                         |
| ----------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Cadre             | Un tribunal                             | Aucun tribunal dans la fiction ; une porte « LE TRIBUNAL » annoncée mais non jouable (`src/content/index.ts`, `copy.doors`) |
| T0                | Le dernier examen (tricherie)           | L'EXAMEN : LAW interroge le joueur, 28 scènes, ~4 500 mots, voix aboutie                                                    |
| T1                | La salle des absents (accusé amnésique) | LA PIÈCE : bouton, dix mille euros, sept années, greffe, protocole (~300 mots)                                              |
| T2                | Ceux qui restent (chambre condamnée)    | LA MAISON : un dernier dîner, quatre personnes aux noms (~960 mots)                                                         |
| T3                | La nuit des témoins (3 h 17)            | LA VILLE : un guichet, une règle, 417 (~1 240 mots)                                                                         |
| Thème transversal | Une tragédie unique                     | Déjà là : _inconnus → noms → échelle_, et la loi personnelle du joueur                                                      |

Le brief propose donc des idées fortes, mais pas **des remplacements** : il faut les confronter à ce qui existe.

## 2. Ce que je retiens de chaque piste du brief

| Piste du brief                       | Verdict                                | Pourquoi                                                                                                                                                                         | Où elle va                                                                        |
| ------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Le dernier examen (tricherie)        | **Conservée en esprit, pas en scène.** | L'ambition est déjà traitée en T0 (garder sa place face à Mathis, `t0.projet.*`) avec moins de cliché ; la tricherie scolaire est la situation morale la plus attendue du genre. | Extension : cas supplémentaire post-lancement.                                    |
| La salle des absents (amnésique)     | **Adoptée, élevée au rang de finale.** | Excellente structure de procès : témoignages contradictoires, mémoire manquante. Elle est le seul des quatre dossiers qui a besoin du tribunal.                                  | **T4 « La Salle des absents »**, où l'amnésie devient le journal du joueur.       |
| Ceux qui restent (chambre condamnée) | **Greffée sur T2, en extension.**      | La Maison a déjà famille, secret, deuil ; la chambre condamnée est une excellente scène d'horreur de situation, mais la réécrire casse des scènes stables.                       | Scène optionnelle « La chambre du haut » dans T2, sonnerie à 4 h 12 [étendu].     |
| La nuit des témoins (3 h 17)         | **Adoptée comme motif.**               | Le message « Vous avez vu. Vous n'avez rien fait. » est la meilleure phrase de marketing du brief. Il fonctionne sur les deux sens possibles (on s'abstient ; on décide).        | Convocation de T0→T4. Heure ramenée à **4 h 12** (déjà dans le dépôt trois fois). |
| Intrigue transversale                | **Adoptée, avec un mystère réel**      | Voir la bible : une note du registre est fausse, et LAW est quelqu'un qui est resté.                                                                                             | `03-STORY-BIBLE.md`.                                                              |

## 3. Les trois architectures

### A — « L'ARCHIVE » : préservation maximale

**Principe.** Rien n'est réécrit. On ajoute un habillage judiciaire (accueil « Vous avez été convoqué », bureau de dossiers) et une T4 courte qui ne fait que lire la mémoire héritée.

- **Conserve.** 100 % du contenu, des saves, des contrats.
- **Ajoute.** Cadre visuel, T4 en lecture de journal (3 à 5 scènes), document de verdict.
- **Avantages.** Risque technique minimal. Livrable en 3 à 4 jours.
- **Limites.** Aucun mystère : le Tribunal est un bilan, pas un récit. La promesse « thriller » du brief n'est pas tenue. T4 serait un écran de résumé glorifié.
- **Risque narratif.** Élevé : le joueur ne comprend pas pourquoi le Tribunal existe.

### B — « LES QUATRE DOSSIERS » : refonte selon le brief

**Principe.** On remplace T0 à T3 par les quatre intrigues du brief et on écrit l'intrigue transversale entre elles.

- **Conserve.** Le moteur, l'UI, les contrats existants (mais plus le contenu).
- **Ajoute.** Quatre campagnes neuves (≈ 20 000 mots si l'on vise la densité de T0).
- **Avantages.** Fidélité maximale au brief ; cohérence totale de l'univers neuf.
- **Limites.** **Irréaliste à valider en sept jours.** Écrire 20 000 mots est possible (T0 et son moteur de conversation ont été produits en une journée de commits, le 30 septembre). Ce qui ne l'est pas, c'est de les rendre fiables : `PROGRESS.md` liste encore, pour T1 à T3, un relevé de durée humain et une relecture par un éditeur francophone qui n'ont jamais eu lieu. Quatre campagnes neuves multiplient ces deux goulots par quatre. Casse aussi les sauvegardes existantes (scène IDs stables, `AGENTS.md`). Perd Elias, Nora, Lou, Camille, Sem, Omar, Mila, Farid, Nadia, c'est-à-dire presque tous les personnages déjà écrits.
- **Risque.** Très élevé. Le plus probable est quatre dossiers inachevés, ce que le brief refuse explicitement.

### C — « LE GREFFIER » : hybride (recommandée)

**Principe.** T0 à T3 deviennent les quatre **dossiers** d'une même audience ; T4 devient **La Salle des absents**, un vrai procès avec un mystère jouable (une note du registre est fausse) ; une poignée de **graines** de texte relie le tout rétroactivement, sans toucher aux contrats.

- **Conserve.** Tout le contenu et les sauvegardes. Elias, Nora, Lou, Camille, Sem, Omar, Mila, Farid, Nadia, LAW.
- **Ajoute.** Cadre « convocation / bureau de dossiers » ; T4 (≈ 11 scènes, 3 500 mots) ; panneau « Ce que LAW a noté » ; document de verdict ; ~10 graines ; palette réchauffée.
- **Avantages.** Livrable avant le 31 : le gros du contenu existe, l'investissement va sur ce qui manquait (la fin, le mystère, l'identité). Rejouable. Cohérence de canon.
- **Limites.** T1 à T3 restent brefs (voir §4). La réécriture « massive » du brief n'a pas lieu. Le mystère repose sur une seule grande révélation.
- **Risque.** Moyen. Voir `06-RELEASE-PLAN.md` : multi-héritage de mémoire pour T4, durée d'écriture de T4, UI de pièces.

## 4. Comparaison

Notation 1 (faible) à 5 (fort), jugement de l'auteur de ce document, avec la justification ci-dessous.

| Critère                                    | A Archive | B Quatre dossiers | C Greffier |
| ------------------------------------------ | --------- | ----------------- | ---------- |
| Faisabilité avant le 31 octobre            | 5         | 1                 | 4          |
| Préservation de l'existant                 | 5         | 1                 | 5          |
| Mystère et thriller                        | 1         | 4                 | 4          |
| Cohérence avec les personnages déjà écrits | 5         | 1                 | 5          |
| Mémorabilité de la fin                     | 2         | 4                 | 5          |
| Rejouabilité                               | 2         | 3                 | 4          |
| Risque de sauvegardes cassées              | 5         | 1                 | 4          |
| Fidélité à la lettre du brief              | 2         | 5                 | 3          |

**Justifications principales.**

- A est la plus sûre, mais n'écrit pas la chose que le brief demande avant tout : _un véritable scénario_.
- B est la plus fidèle, mais son goulot n'est pas l'écriture, c'est la validation : relecture humaine, durée, mobile, rejouabilité, audit narratif (`scripts/audit-t0.ts`) à refaire pour quatre campagnes en même temps.
- C déplace l'effort au bon endroit : le dépôt n'a pas de fin ni de cadre, il en a de trop peu de prose en T1–T3. On écrit la fin.

## 5. Recommandation : C, avec une limite explicite

**Je recommande C.** J'écarte B comme plan de lancement. Je n'écarte pas ses idées, qui deviennent des extensions.

Je prends position sur quatre points où le brief est contestable :

1. **« Quatre campagnes complètes » n'est pas réaliste** et le brief le prévoit lui-même (§VII). La version de lancement doit être l'ensemble T0 → T4 tel qu'il existe, avec T4 neuve.
2. **03 h 17 → 04 h 12.** L'heure existe déjà trois fois dans le dépôt. Inventer une quatrième heure dilue le motif.
3. **L'horreur par procédure, pas par effet.** Le meilleur du dépôt (le verre d'eau qui apparaît sans qu'on l'ait vu, la copie, LAW qui ment) est de l'inquiétude de situation. T4 prolonge cette ligne : une salle qui se remplit, des phrases que le joueur a déjà entendues. Pas de jump scare, conformément au brief.
4. **Pas de grand « choix moral » final.** Le piège du brief est de finir sur un dilemme de plus. La dernière décision de T4 (« un entre, un sort ») est un coût, pas une valeur.

**Limite assumée.** T1 (≈ 300 mots), T2 (≈ 960) et T3 (≈ 1 240) sont des squelettes structurellement bons mais maigres en prose. Au lancement, ils sont présentés comme des **cas courts** (10 à 25 minutes chacun). Un enrichissement de leur texte est inscrit en extension, pas promis.

## 6. Ce qu'on ne fait pas

- Ne pas renommer ni supprimer de `sceneId` (`AGENTS.md`).
- Ne pas introduire de LLM runtime ni d'appel réseau pour du texte libre (`AGENTS.md`).
- Ne pas ajouter de score moral, de jauge ou de barre de réputation.
- Ne pas promettre « quatre campagnes » dans la communication.
