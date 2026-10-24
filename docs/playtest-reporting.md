# Données locales — THE LAW: REBIRTH

Le reporting distant de playtest a été retiré le 24 octobre 2026. Aucun journal, pseudonyme, texte libre, temps de réponse ou loi n'est envoyé par le jeu.

- Les journaux restent dans `localStorage` : `thelaw:save`, `thelaw:save-t0`, `thelaw:save-t2`, `thelaw:save-t3`.
- « Ma loi » permet un export JSON explicite et l'effacement des parties actives, y compris L'Examen. Les copies locales de récupération restent gérées par le mécanisme de sauvegarde existant.
- Les anciens champs `reportingConsent` et `reportingStatus` restent acceptés dans les sauvegardes historiques. Ils n'activent aucun envoi.
- `/api/report` retourne 410 sans lire le corps, sans journaliser son contenu et sans appeler de prestataire. Cette réponse sert seulement aux anciens clients qui connaissaient cette adresse.
- Les variables Brevo et les adresses de reporting ne sont plus utilisées. Aucune nouvelle dépendance ne remplace le service.
- Les exports téléchargés sont sous le contrôle du joueur. Supprimer une partie dans le navigateur ne supprime pas ses fichiers exportés.

Vérification : tests de la route retirée, parcours local hors ligne et absence d'envoi lors de la lecture des notes et de l'achèvement d'une ancienne partie consentie.
