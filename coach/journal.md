# Journal de l'entraînement du coach

## Décisions d'Eliot
- Architecture validée par Eliot : non (en attente)
- Garde-fou détresse validé : non (en attente)

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

## Priorités de la prochaine session (type B, compréhension)
1. Si le garde-fou détresse est validé : le préparer en premier.
2. Lexique (`banque/lexique.json`) : SMS, fautes, périphrases relevées dans les échecs (« le truc où t'es payé », « jsp », « koi », « bosser de mes mains »).
3. Petite génération ciblée (mode LÉGER) sur : détresse (formulations variées, sans copier l'examen), fonctionnement StudLink, négations et attributions (frère, mère, « j'habite à »), questions multiples.
4. Créer `examen/pieges.jsonl` avec les premiers pièges adversariaux.
