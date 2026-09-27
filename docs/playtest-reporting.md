# Playtest Reporting

## Architecture

```
[Joueur] → Onboarding (pseudo + consentement) → SaveGame.pseudonym / .reportingConsent
         → ScenePlayer → run_completed détecté → useEffect → POST /api/report
         → API route → buildReport (server) → renderEmailHtml → Brevo SMTP API → email
```

Composants :

| Fichier                          | Rôle                                                    |
| -------------------------------- | ------------------------------------------------------- |
| `src/persistence/SaveAdapter.ts` | SaveGame type avec `pseudonym?` et `reportingConsent?`  |
| `src/engine/schema.ts`           | Zod schema avec les deux champs optionnels              |
| `src/content/index.ts`           | Copy `playtestIntro`                                    |
| `src/ui/screens/Onboarding.tsx`  | UX de collecte pseudo + consentement (2 étapes)         |
| `src/store/gameStore.ts`         | Persiste pseudo/consent dans SaveGame                   |
| `src/store/reportingStore.ts`    | État mémoire d'envoi (not_sent → sending → sent/failed) |
| `src/reporting/report.ts`        | Types PlaytestReport                                    |
| `src/reporting/builder.ts`       | buildReport(save, content) → PlaytestReport ou null     |
| `src/reporting/emailRenderer.ts` | renderEmailHtml + renderEmailText + escapeHtml          |
| `app/api/report/route.ts`        | POST endpoint — validation, build, send Brevo           |

## Events utilisés

- `run_started` — horodatage de début
- `choice_locked` — décisions (hesitationMs, selectionChanges, input kind, value)
- `certainty_given` — certitude par scène
- `justification_given` — texte libre par scène
- `law_signed` / `law_revised` / `law_abandoned` — historique des lois
- `confrontation_answered` — réponses aux confrontations
- `scene_skipped` — compte dans la synthèse
- `run_completed` — horodatage de fin, timelineId

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
- Le rapport contient uniquement : décisions, timings, justifications textuelles, lois, confrontations.
- Le consentement explicite est requis. Sans consentement (`reportingConsent !== true`), buildReport retourne null et aucun envoi n'a lieu.
- `BREVO_API_KEY` n'est jamais exposée côté client, jamais loguée, jamais dans une réponse HTTP.

## Idempotence et ses limites

- Côté client : `reportingStore` (mémoire) empêche le double envoi dans la même session. React Strict Mode (double effet) est couvert par le check `status !== 'not_sent'`.
- Après refresh : le statut est perdu (Map en mémoire). Un second envoi est alors possible. Acceptable en V1.
- Côté serveur : aucune déduplication par runId. Si le client renvoie, Brevo recevra deux emails.

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
