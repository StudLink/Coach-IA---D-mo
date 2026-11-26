# Journal de l'entraînement du coach

## Décisions d'Eliot
- 25/11/2026 14h25 : faits officiels sur StudLink donnés par Eliot (gratuit pour élèves et parents, seules les écoles partenaires paient ; pourcentage = compatibilité avec le profil ; suppression du compte depuis le profil). Rangés dans `coach/faits_studlink.md`. L'usage des données n'est pas encore précisé par Eliot : s'en tenir à la politique de confidentialité de l'application.
- 25/11/2026 14h15 : **rien n'est mis en ligne ni modifié dans le moteur pour l'instant.** Toutes les modifications sont accumulées sur cette branche et Eliot les publiera en une fois. Les sessions suivent `coach/PROMPT.md` (v2).
- 25/11/2026 : objectif d'**au moins 10 000 nouvelles questions par jour** (au moins 5 000 par session) avec des réponses construites, priorité aux sujets sensibles et aux questions spéciales (longues, avec beaucoup de caractéristiques). Vérification de la base et de la banque à chaque session.
- Architecture validée par Eliot : non (en attente)
- Garde-fou détresse validé : oui (25/11/2026). Règle d'Eliot : **le coach impose un cadre**. Hors orientation, il dit tout de suite qu'il n'est pas capable de répondre. En cas de détresse (suicide, violences, harcèlement, épuisement), il dit qu'il ne peut pas aider sur ça et redirige vers les bons numéros. Il ne doit pas essayer de répondre à tout.
- Le cadre est en place dans `index.html` (script `sl-cadre`, avant toutes les couches et avant l'IA). Test dédié : `outils/test_cadre.js` (33 phrases, doit rester à 33/33). Toute nouvelle couche doit rester derrière ce cadre.

## Architecture réelle du moteur (relevée le 25/11/2026, v46)
La réponse publique passe par une chaîne de couches qui enveloppent `localAnswer` :
`coachV46` (v46Parse, V46_FAQ 177 entrées, V46_FACTS 99, priorité fixe V46_PRIO) → v38 (niches) → v34 (« pourquoi tu me proposes ») → v32 (synonymes, métiers) → `localAnswer` d'origine (drapeaux `I_`) → repli « pas de réponse fiable ».
Le relais IA (`IA_RELAIS_ACTIF`) est désactivé. Outils : `outils/banc.js` (une question), `outils/examen.js` (examen complet, table de correspondance moteur → intentions).
Commande : `cd coach/outils && npm install && node examen.js ../examen/examen_fixe.jsonl ../resultats/<date>.json`

## Sessions

### 2026-11-25 13h20 · initialisation (type A) · terminée
- Lancée à la main par Eliot dans la conversation. Pas de génération de banque.
- Créé : banc d'essai, taxonomie (25 intentions), examen gelé (300 cas, 109 pièges, 74 questions multiples).
- Scores de départ : intention principale 45,7 % · pièges 29,4 % · questions multiples 36,5 % · note moyenne 8,1/12 (échantillon de 36) · 9 échecs critiques (détresse).
- Plus faibles : détresse 0/10, fonctionnement StudLink 1/12, besoins particuliers 1/8, stress 2/10, profil scolaire 2/10.

### 2026-11-25 14h30 · cadre du coach (hors session programmée) · terminée
- Ajout du cadre (détresse + hors orientation), à la demande d'Eliot. Numéros vérifiés le 25/11/2026 : 3114, Fil Santé Jeunes 0 800 235 236, 119, 3018, 15, 112.
- Examen : intention principale 45,7 → 51 % · pièges 29,4 → 41,3 % · questions multiples 36,5 → 41,9 % · échecs critiques 9 → 0 · détresse 0/10 → 10/10 · hors périmètre 2/8 → 8/8 · aucune régression, aucun faux positif.
- Attention : les motifs du cadre ont été écrits en connaissant les formulations de l'examen. Le test séparé (`test_cadre.js`, 33 phrases nouvelles) est la mesure honnête du cadre.

### 2026-11-25 16h34 · session programmée (v2) · interrompue
- Démarrée automatiquement à 16h34 (heure de Puebla). Aucun livrable poussé après le passage « en cours » (ni banque, ni vérification, ni rapport) : session interrompue avant son premier commit de travail.

### 2026-11-26 04h34 · session programmée (v2) · interrompue
- Démarrée automatiquement à 4h34 (heure de Puebla). Aucun livrable poussé après le passage « en cours » : session interrompue avant son premier commit de travail.

### 2026-11-26 16h34 · session programmée (v2) · **session en cours**
- Démarrée automatiquement à 16h34 (heure de Puebla). Consigne : commit et push après chaque étape.

## Priorités de la prochaine session
1. Première session au format v2 : créer `banque/`, `verification/`, `banque/index.json` et `banque/lexique.json`.
2. Vérifier toute la base du coach (177 entrées V46_FAQ, 99 V46_FACTS) avec les contrôles automatiques, et 30 entrées à la source officielle (d'abord celles qui portent une date ou un montant).
3. Générer au moins 5 000 questions (2 500 en clusters, 1 500 sensibles, 1 000 spéciales), en parallèle avec des sous-agents.
4. Couverture prioritaire : détresse indirecte ou en SMS, fonctionnement de StudLink (réponses à partir de `coach/faits_studlink.md`), négations et attributions, questions multiples.
