# Playtest Reporting

## Architecture

```
[Joueur] → Onboarding (pseudo + consentement) → SaveGame.pseudonym / .reportingConsent
         → ScenePlayer → run_completed détecté → useEffect → POST /api/report
         → API route → buildReport (server) → renderEmailHtml → Brevo SMTP API → email
```

Composants :

| Fichier                          | Rôle                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/persistence/SaveAdapter.ts` | SaveGame type avec `pseudonym?`, `reportingConsent?`, `reportingStatus?` (`ReportingStatus`) |
| `src/engine/schema.ts`           | Zod schema avec les trois champs optionnels                                                  |
| `src/content/index.ts`           | Copy `playtestIntro` (pseudo + texte de consentement)                                        |
| `src/ui/screens/Onboarding.tsx`  | UX de collecte pseudo + consentement (2 étapes)                                              |
| `src/store/gameStore.ts`         | Persiste pseudo/consent/**reportingStatus** dans SaveGame (localStorage)                     |
| `src/reporting/sendGate.ts`      | `canAutoSend`, garde anti-doublon en mémoire (`tryClaimSend`/`releaseSend`), `submitReport`  |
| `src/reporting/report.ts`        | Types PlaytestReport                                                                         |
| `src/reporting/builder.ts`       | buildReport(save, content) → PlaytestReport ou null                                          |
| `src/reporting/emailRenderer.ts` | renderEmailHtml + renderEmailText + escapeHtml                                               |
| `app/api/report/route.ts`        | POST endpoint — validation, build, send Brevo                                                |

`reportingStatus` (`not_sent | sending | sent | failed`) est un champ persisté de `SaveGame`, au même titre que `settings` — il survit au rafraîchissement de page et à la navigation (Ma loi, retour à l'écran final), contrairement à un store en mémoire. Un statut `sending` retrouvé au chargement (session interrompue) est automatiquement rétrogradé en `failed` pour ne jamais bloquer silencieusement le joueur sans option de réessai.

## Deux timelines

Chaque timeline a son propre journal, son propre `runId` et son propre rapport. LA MAISON reprend le pseudonyme et le consentement de LA PIÈCE au seuil ; le seuil le dit explicitement et propose « Entrer sans rapport ». Le rapport de LA MAISON indique `inheritedFromRunId` (le run de LA PIÈCE dont la mémoire a été copiée), marque les lois héritées (« signée dans la pièce ») et ajoute une section factuelle « Personnes » : ce que le joueur a fait envers chacun (promesse faite, tenue ou non tenue, mensonge, secret gardé ou révélé, aidé·e, pas choisi·e), dans l’ordre, sans score. Chaque confrontation indique l’acte réel qu’elle a placé à côté de la loi.

## Validation serveur

L’API relit la sauvegarde exactement comme un chargement local : `migrateSave(body, contenu de sa timeline)` — schéma, contrats de scène et rejeu de chaque événement. Une histoire impossible (décision hors de sa scène, achèvement prématuré, doublon) est refusée en 400 avant toute construction de rapport. Le pseudonyme est débarrassé des caractères de contrôle avant le sujet et le corps.

## Limitation d’envoi

`src/reporting/sendLimiter.ts`, en mémoire par instance serveur : un rapport déjà livré pour le même `timelineId:runId` n’est pas renvoyé (réponse 200 `{ ok: true, duplicate: true }`), et au plus 20 envois par fenêtre de 10 minutes sont acceptés (429 au-delà). Sans base de données, cette garde protège d’un double clic ou d’un rafraîchissement, pas d’un expéditeur déterminé sur plusieurs instances.

## Events utilisés

- `run_started` — horodatage de début
- `choice_locked` — décisions (hesitationMs, selectionChanges, input kind, value)
- `certainty_given` — certitude par scène
- `justification_given` — texte libre par scène
- `law_signed` / `law_revised` / `law_abandoned` — historique des lois
- `law_declined` — proposition de loi déclinée sans signature (exposée avec `number: null`, `status: 'declined'`, tant que le principe n'a pas été signé ultérieurement)
- `confrontation_answered` — réponses aux confrontations ; sa scène est retrouvée en associant positionnellement chaque `confrontation_answered` au `choice_locked(input:'confrontation')` qui le suit (aucun lien direct sur l'event)
- `scene_skipped` — compte dans la synthèse
- `run_completed` — horodatage de fin, timelineId
- `memory_inherited` — lois et mémoire héritées de LA PIÈCE (rapport de LA MAISON)
- effets `relationEvent` des choix, rejoués — section « Personnes »

## Variables d'environnement

| Variable            | Description                 | Obligatoire                       |
| ------------------- | --------------------------- | --------------------------------- |
| `BREVO_API_KEY`     | Clé API Brevo (server-only) | Oui                               |
| `REPORT_FROM_EMAIL` | Adresse expéditeur          | Oui                               |
| `REPORT_FROM_NAME`  | Nom expéditeur              | Non (défaut : "THE LAW Playtest") |
| `REPORT_TO_EMAIL`   | Destinataire du rapport     | Oui                               |

**JAMAIS de vraie clé dans le code ou les commits.**

## Intégration Brevo

Endpoint : `POST https://api.brevo.com/v3/smtp/email`  
Headers : `api-key`, `content-type: application/json`  
Timeout : 10 secondes (AbortSignal.timeout)  
Erreurs non-2xx : loguées server-side, réponse sobre au client.

## Privacy

- Aucun diagnostic psychologique n'est produit.
- Le rapport contient uniquement : décisions, hésitation, changements de sélection, certitude (quand disponible), justifications textuelles, lois (signées, révisées, abandonnées, propositions déclinées), confrontations.
- Le consentement explicite est requis. Sans consentement (`reportingConsent !== true`), buildReport retourne null et aucun envoi n'a lieu.
- `BREVO_API_KEY` n'est jamais exposée côté client, jamais loguée, jamais dans une réponse HTTP.
- Aucune collecte explicite d'IP, user-agent, géolocalisation, email joueur, fingerprint ou cookie marketing — ni par le client, ni par l'API route (Next.js n'en journalise aucun ici).

## Idempotence et ses limites

- Côté client : `reportingStatus` est un champ **persisté** de `SaveGame` (localStorage), pas un état mémoire éphémère. Il survit au rafraîchissement de page, à la fermeture/réouverture de l'onglet et à la navigation vers "Ma loi" puis retour à l'écran final.
- React Strict Mode (double effet mount → unmount → remount) est couvert par une garde synchrone en mémoire (`tryClaimSend`/`releaseSend` dans `sendGate.ts`), qui agit avant même la persistance du statut `sending` — nécessaire car la persistance elle-même est asynchrone.
- Un statut `sending` retrouvé au chargement d'une session interrompue (l'app a été fermée pendant l'envoi) est automatiquement rétrogradé en `failed` : on ne peut pas savoir si la requête a réellement abouti côté serveur, donc on expose un bouton "Réessayer" plutôt que de bloquer silencieusement.
- Côté serveur : **aucune déduplication par runId**. Il n'y a pas de base de données ; l'API ne peut pas savoir si une requête pour ce `runId` a déjà été traitée. Un idempotency key dérivé de `runId` + `reportVersion` n'apporterait rien sans un magasin serveur pour le vérifier — non implémenté pour cette raison, documenté plutôt que simulé.
- **Limite honnête** : si le navigateur se ferme ou perd la connexion _pendant_ que la requête est en cours de traitement côté serveur (après que le corps a été reçu, avant que la réponse ne revienne au client), un second envoi ultérieur peut produire un doublon réel. Aucune garantie d'exactly-once distribué n'est faite en V1.

## Comportement offline/erreur

- Fetch échoue (offline, timeout) → status → 'failed' → bouton "Réessayer" affiché.
- Brevo non-2xx → idem.
- Un échec d'envoi ne bloque pas le joueur et ne corrompt pas le run.
- L'envoi est invisible pendant qu'il est en cours.

## Procédure de test local

1. Copier `.env.local.example` en `.env.local` et renseigner les variables.
2. `pnpm dev`
3. Jouer une partie complète sur `/jouer`.
4. À la fin, vérifier l'email reçu.
5. Pour tester l'échec : modifier temporairement `BREVO_API_KEY` avec une valeur invalide.

## Procédure Netlify

1. Dans le dashboard Netlify → Site → Environment variables :
   - `BREVO_API_KEY` = (clé Brevo réelle)
   - `REPORT_FROM_EMAIL` = noreply@...
   - `REPORT_FROM_NAME` = THE LAW Playtest
   - `REPORT_TO_EMAIL` = contact@ryadsaka.com
2. Redéployer le site.
3. Vérifier que `/api/report` répond 405 sur GET (test rapide dans le navigateur).
4. Jouer une partie complète pour déclencher l'envoi réel.
