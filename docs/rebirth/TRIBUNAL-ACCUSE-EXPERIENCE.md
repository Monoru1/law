# THE LAW: REBIRTH — Tribunal des Absents : dossier de réalisation

**Statut : proposition de mise en scène et de spécification, NON implémentée.**
**Branche : `design/tribunal-accused-experience`.** Ce document ne modifie ni la branche BLACK VEIL ni la production.

## 1. Promesse et règles du canon

Le joueur **est l'accusé** dans le Tribunal, pas un lecteur devant un menu. Le Tribunal est humain, institutionnel et faillible : aucune magie, aucune lecture des pensées, aucune culpabilité présumée. Les chefs d'accusation sont des **allégations soumises à examen**, pas des crimes juridiquement établis. Les pièces doivent être identifiables, les objections possibles, et la réponse du Greffier fondée exclusivement sur les faits consignés.

Conserver la phrase canonique : « Nous n'allons pas vous demander ce que vous auriez fait. Nous allons vous donner l'occasion de le faire. » La première audience se suspend avant le Dossier I ; elle ne prononce pas de verdict. Trois dossiers scellés existent dans le récit, mais seul le premier peut être présenté comme jouable tant que les autres ne le sont pas.

**Identité :** le pseudo déjà choisi à l'inscription suit le joueur dans l'interface, les convocations, les répliques et les procès ultérieurs. Ne jamais substituer arbitrairement « Joueur ». Le rôle de **l'accusé du Tribunal** et celui d'**Alex Delcourt dans la reconstitution familiale** restent distincts ; ne pas renommer Alex rétroactivement. Si la source du pseudo n'est pas accessible, prévoir un écran de confirmation du pseudo avant l'audience, sans écraser les sauvegardes. Ne jamais exposer d'identité civile ni d'email.

## 2. Plan spatial : la salle d'audience

Vue première personne depuis le **box de l'accusé**, légèrement en retrait, hauteur d'œil réaliste. Perspective axiale lisible :
- **Devant** : estrade du juge, siège vide (absence volontaire), sceau institutionnel fictif ; Greffier à son pupitre décalé sur la droite, dossier papier et lampe de lecture.
- **À gauche** : banc de la partie accusatrice, dossiers fermés, silhouette d'un représentant dont le rôle sera précisé plus tard.
- **À droite** : banc réservé à la défense, chaise vide, papier, stylo ; le joueur peut examiner cet espace sans qu'un avocat fictif soit inventé.
- **Derrière** : galerie publique en gradins bas, silhouettes et vêtements différenciés, porte double lourde, agent d'audience discret.
- **Au centre** : allée, parquet usé, garde-corps du box, documents accessibles après autorisation.
- **Sur les côtés** : hautes fenêtres opaques ; un rouge profond éclaire les moulures et le fond de salle. Les visages et objets utiles restent lisibles.

Éviter le décor de cathédrale, les emblèmes judiciaires réels et les foules haute fidélité coûteuses. Le Tribunal doit sembler administratif, intimidant et plausible. Géométrie modulaire, silhouettes instanciées, matériaux PBR, éclairage cinématique mobile-friendly. Pas de bouton « approcher du palier » au-dessus du monde.

## 3. Timeline d'ouverture (cible 4 à 6 minutes, contrôlable)

| Temps indicatif | Image et caméra | Son | Interaction et logique |
|---|---|---|---|
| 00:00 | Clic volontaire sur ENTRER, noir, sous-titre discret | Serrure, porte massive, frottement de vêtements ; audio déverrouillé par le geste | Charger l'identité et le point de sauvegarde ; aucun son autoplay avant geste |
| 00:08 | Regard fixé sur le bois du box ; lumière révèle les mains et le garde-corps | Brouhaha de salle, pas, chaise, toux ; voix indistinctes | Permettre rotation douce, pas de mouvement forcé long |
| 00:22 | Vue s'élargit vers bancs, pupitre et estrade vide | Brouhaha spatial, coup sec du Greffier | Le joueur peut regarder la galerie et le siège vide |
| 00:45 | Le Greffier se lève, s'adresse au box | « Que l'accusé se lève. » ; le public se tait progressivement | Choix : se lever / demander pourquoi / rester assis ; réaction spécifique sans punition automatique |
| 01:15 | Gros plan bref sur convocation portant le pseudo | Papier et plume ; souffle de salle | Greffier appelle le pseudo validé ; sous-titres si voix indisponible |
| 01:40 | Dossier officiel ouvert, en-tête « ACTE D'ACCUSATION — PRÉLIMINAIRE » | Silence, pages tournées | Présentation formelle des allégations, sans qualifier le joueur réel |
| 02:35 | Retour au box, trois points d'attention (greffier, pièces, galerie) | Son de salle contenu, pas de musique envahissante | Contester / exiger la provenance / réserver sa réponse |
| 03:25 | Le Greffier concède les limites des pièces ; trois dossiers scellés | Trois coups légers de papier, son de verrou | Un seul dossier déverrouillé : La Sixième Place |
| 04:15 | Approche du dossier I ; photographie d'une table à six couverts | Brouhaha disparaît, pluie et maison prennent le relais | Transition visuelle et sonore vers la reconstitution |
| 05:00 | Maison Delcourt, POV d'Alex ; interface de rôle claire | Pluie, voix étouffées | Continuer l'enquête ; sauvegarde de l'audience intacte |

Les durées sont des repères de montage, **pas des délais imposés au joueur**. Aucun compte à rebours. Option passer la cinématique après première lecture ; reprise depuis le dernier état.

## 4. Proposition de dialogues : audience initiale

**Greffier :** « Que l'accusé se lève. »

**Greffier :** « Vous avez été convoqué sous le nom de **{pseudo}**. C'est sous ce nom que vos déclarations seront consignées. »

**Greffier :** « Je vais lire les griefs qui motivent cette audience. Vous pourrez les contester. Rien de ce qui suit ne vaut condamnation. »

**Greffier :** « Premier chef : avoir contribué, par vos déclarations ou omissions, à la conservation d'une version des faits que des pièces ultérieures pourraient contredire. »

**Greffier :** « Deuxième chef : avoir pris, face à une personne vulnérable ou absente, une décision dont vous ne connaissiez pas toutes les conséquences. »

**Greffier :** « Troisième chef : avoir soutenu une certitude alors que la provenance des témoignages et des archives restait contestée. »

**Greffier :** « Ces chefs ne sont, pour l'heure, que des questions adressées à votre conduite au sein des reconstitutions. Ils ne prouvent aucun fait. »

**Greffier :** « Nous n'allons pas vous demander ce que vous auriez fait. Nous allons vous donner l'occasion de le faire. »

**Greffier :** « Demandez les pièces. Contestez nos versions. Ou gardez le silence. Ce qui sera consigné, c'est ce que vous aurez réellement choisi. »

Réponses :
- « Je conteste votre droit de m'accuser sans preuve. » → Greffier reconnaît le caractère préliminaire, note une contestation de procédure.
- « Montrez-moi les pièces et leur provenance. » → Greffier décrit les reconstitutions comme des assemblages de témoignages et archives, reconnaît qu'elles peuvent être orientées.
- **Se taire.** → « Le silence est consigné. Il ne vaut pas aveu. »

Ces trois choix doivent produire des événements distincts, des rappels plus tard, mais **aucune étiquette psychologique**. Ne pas annoncer comme faits des actions que le joueur n'a pas encore accomplies.

## 5. Modèle d'état et pseudo

Avant implémentation, auditer les sources de l'inscription et les stores. Établir une source canonique `playerAlias` (pseudo) ; valider Unicode, trim, taille maximale raisonnable, échappement dans les dialogues, valeurs de repli explicites. Migrer sans casser les événements existants. Les sauvegardes des reconstitutions conservent Alex comme personnage ; l'audience conserve le pseudo. Prévoir un affichage de sous-titre pour les pseudos impossibles à prononcer en TTS, sans prétendre générer une voix humaine de qualité.

Événements narratifs suggérés (à adapter au contrat existant) :
- `tribunal.entry_started` (une fois)
- `tribunal.alias_confirmed`
- `tribunal.stood_up` / `tribunal.challenged_summons` / `tribunal.remained_seated`
- `tribunal.charges_read`
- `tribunal.procedural_objection` / `tribunal.requested_provenance` / `tribunal.reserved_response`
- `tribunal.dossier_01_opened`

Le replay doit rester déterministe ; pas d'enregistrement doublon en cas de double-clic, navigation arrière, reprise ou reconnexion. Les scènes de l'audience ne doivent pas connaître les résultats du Dossier I avant qu'ils aient eu lieu.

## 6. Son et mise en scène

Construire des stems indépendants : `crowd_murmur`, `court_foley`, `door_heavy`, `clerk_presence`, `court_roomtone`, `transition_rain`. Brouhaha **indistinct**, jamais de phrases qui prétendent connaître le pseudo avant sa confirmation. Décroissance progressive du public au coup de marteau/pupitre (éviter de présenter un maillet de juge comme un élément obligatoire du droit réel). Son 3D atténué par distance et orientation, mix adapté au casque et haut-parleur téléphone. Réglages séparés volume général/voix/effets si faisable, mute, sous-titres et contrôle des sons intenses. Pas d'autoplay avant ENTRER.

## 7. Interface, accessibilité, mobile

Pendant l'ouverture, HUD minimal : Pause, Sous-titres, Audio, Carnet. Les réglages de qualité dans Pause, pas en barre de commande principale. Dialogues en overlay **dans le viewport** ; choix contextuels à grandes cibles tactiles, navigation clavier, focus visible. Camera drag sur tactile ; ne pas confondre swipe et tap. WebGL absent/perdu → scène 2D narrative équivalente, pas écran bloquant. Mode mouvement réduit → transitions sans travelling, mais information identique. Sous-titres pour tous les indices sonores importants : « murmures », « porte verrouillée », « silence de la salle ». Contraste des textes sur fond rouge/noir.

## 8. Matrice QA / critères de GO

- Nouveau joueur avec pseudo : affiché sur la convocation, prononcé ou sous-titré par le Greffier, conservé au rechargement et lors du retour au Tribunal.
- Ancien joueur sans pseudo migré : confirmation explicite sans écraser les sauvegardes.
- Trois premières réponses : événements distincts et répliques distinctes ; aucun faux aveu ni profil psychologique.
- Reprise à chaque point de sauvegarde ; aucune répétition des sons ou événements à double-clic.
- Mobile portrait/paysage : box visible, tribunal lisible, options accessibles, aucun scroll obligatoire pour décider.
- Sans audio : sous-titres et événements compréhensibles.
- Sans WebGL : repli complet.
- Réduction des mouvements : aucune information perdue.
- Performance : mesurer FPS, mémoire, draw calls et temps de chargement sur appareils disponibles ; budgets ajustés à la mesure, pas de promesse universelle.
- Vérifier captures réelles : rouge perceptible **dans le décor**, place de l'accusé immédiatement identifiable, estrade et public visibles, Greffier perceptible.
- Ne pas publier comme « Tribunal complet » tant que le dossier II, III et le procès final ne sont pas implémentés.

## 9. Découpage d'implémentation sans conflit

1. **Vertical slice Tribunal** sur branche dédiée depuis `main` : identité + box + ouverture + premier échange + transition vers dossier I.
2. Intégration visuelle de l'accueil rouge PR #8 **après** audit et CI ; éviter de remplacer des fichiers BLACK VEIL en cours.
3. Tests unitaires d'identité/contrats et E2E d'ouverture desktop/mobile.
4. Revue artistique humaine de la preview Netlify ; fusion seulement après GO.
5. Réconciliation de la branche BLACK VEIL sur le nouveau `main` via PR distincte ; résoudre les conflits intentionnellement.

**Ne pas confondre ce document de conception avec une fonctionnalité déjà livrée.**
