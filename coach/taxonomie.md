# Taxonomie des intentions du coach StudLink

Version 1, 25 novembre 2026. Une intention = ce que l'élève veut savoir ou obtenir, quels que soient les mots qu'il emploie.

Chaque message a **une intention principale** (ce qui est réellement demandé) et parfois **des intentions secondaires** (autres questions posées dans le même message, ou contrainte qui doit modifier la réponse). Les **entités** sont les éléments à repérer pour répondre. Les **pièges** sont des mots qui mènent à la mauvaise intention si on lit mot par mot.

## Règles de lecture communes

- **Ce qui est demandé prime sur ce qui est cité.** Une formation, un métier ou une ville cités dans le récit ne sont pas forcément le sujet.
- **Attribution** : « mon frère / ma sœur / mes parents / mon prof / on m'a dit / mes potes » décrit quelqu'un d'autre. Ce n'est pas un souhait de l'élève.
- **Négation** : « pas », « plus », « jamais », « surtout pas », « plutôt que », « sauf », « à part », « j'en ai marre de », « je déteste » transforment un intérêt en contrainte à éviter.
- **Position** : la proposition interrogative et ce qui suit « mais », « par contre », « sauf que », « ma vraie question » pèsent plus que le récit qui précède.
- **Contexte** : « celle-là », « ce BTS », « et en alternance ? », « c'est loin ? » renvoient à la dernière formation ou au dernier lieu dont on a parlé.
- **Détresse** passe avant tout le reste, même si le message contient aussi une question d'orientation.

## Les intentions

| Intention | Définition | Entités attendues | Pièges connus |
|---|---|---|---|
| `decouvrir_formation` | Ce qu'est une formation ou un type de formation, comment ça se passe, si c'est reconnu | formation, type (BTS, BUT, licence…) | un métier cité dans la question ; le mot « école » |
| `programme_cours` | Matières, place d'une matière, stages, rythme, journée ou semaine type, difficulté du contenu | formation, matière | « je veux pas de maths » (contrainte) quand la question porte sur le contenu ; « difficile » lu comme admission |
| `debouches_metiers` | Métiers et poursuites d'études **après** une formation, salaires | formation | « après le bac » (ce n'est pas un débouché) ; « travailler » |
| `metier_vers_formation` | « Je veux devenir X » : quelle formation mène à ce métier | métier | un métier exercé par un proche ; « devenir » dans « devenir autonome » |
| `admission_prerequis` | Bac et spécialités conseillés, attendus, sélection, épreuves, dossier pour **une** formation (jamais de chances) | formation, bac, spécialités, moyenne | la moyenne citée comme profil ; « dur » / « difficile » (contenu ou admission ?) |
| `duree_niveau` | Combien de temps, quel niveau (bac+2, bac+3…) | formation, type | « 2 ans » cité comme contrainte (`contrainte_rejet`) |
| `alternance` | Principe, rémunération, disponibilité de l'alternance ou de l'apprentissage | formation, lieu | périphrases (« être payé pendant les études ») ; « salaire » lu comme débouché |
| `cout_financement` | Public ou privé, frais, bourses, logement, aides, budget | formation, statut, lieu | « payé » (alternance) ; « cher » dans un autre sens |
| `lieu_etablissements` | Où se forme-t-on, près de chez moi, dans telle ville, internat, distance | formation, ville, département, région | une ville citée comme lieu d'habitation sans question de lieu ; ville de l'entourage |
| `comparer` | Différences entre deux formations ou plus, laquelle choisir entre A et B | 2 formations ou plus, critère | un objectif métier dans la même phrase (reste `comparer`) |
| `choix_specialites` | Spécialités et options au lycée, quoi garder ou abandonner | classe, voie, spécialités | une spécialité citée comme profil dans une autre question |
| `parcoursup_procedure` | Calendrier, nombre de vœux, sous-vœux, confirmation, réponses, phase complémentaire, liste d'attente | date, étape | « Parcoursup » cité dans une question sur une formation précise |
| `dossier_motivation` | Projet de formation motivé, rubrique activités, CV, lettre, entretien | formation | « motivation » au sens de « je n'ai plus de motivation » (`stress_motivation`) |
| `reorientation` | Changer de voie après le bac : après une L1, un BTS arrêté, une année blanche, une reprise d'études | formation quittée, formation visée | la formation quittée (ce n'est pas le sujet) |
| `indecision` | Ne sait pas quoi faire, veut des idées à partir de ses goûts | goûts, rejets, profil | un domaine cité par l'entourage ; le profil décrit longuement |
| `contrainte_rejet` | Ce que l'élève veut éviter et qui doit filtrer la réponse (maths, études longues, amphis, quitter sa ville…) | rejet | le rejet lu comme intérêt (« pas de maths » → maths) |
| `profil_scolaire` | Inquiétude sur son niveau, sa moyenne, sa voie (bac pro, techno), un redoublement : « est-ce que je peux… avec mon profil » | moyenne, voie, série | ne jamais répondre par une chance chiffrée |
| `international` | Étudier à l'étranger, échanges, formations en anglais | pays, formation | « langues » (`decouvrir_formation` LLCER/LEA) |
| `besoins_particuliers` | Handicap, trouble, aménagements, sportif de haut niveau, situation particulière | besoin | réponse factuelle avec renvoi vers les référents handicap et les fiches officielles |
| `parents_entourage` | Désaccord avec les parents ou l'entourage, comment en parler, pression | personne, projet de l'élève | le projet des parents lu comme projet de l'élève |
| `stress_motivation` | Peur de se tromper, découragement, perte de motivation, stress des résultats (sans détresse) | – | glisser vers `detresse` si signaux forts |
| `detresse` | Harcèlement, idées noires, épuisement grave, pression qui fait souffrir : **prioritaire** | – | une question d'orientation dans le même message |
| `fonctionnement_studlink` | Le coach, la gratuité, les données, les écoles partenaires, le compte | – | « StudLink » cité dans une autre question |
| `hors_perimetre` | Sans lien avec l'orientation (devoirs, recettes, météo…) | – | un mot d'orientation dans une demande hors sujet |
| `social` | Bonjour, merci, au revoir, réaction courte | – | « merci mais… » suivi d'une vraie question |

## Seuil anti-doublons de la banque

Deux formulations sont des quasi-doublons si, après normalisation (minuscules, sans accents ni ponctuation, mots vides retirés), leur similarité de Jaccard sur les trigrammes de caractères dépasse **0,80**. La seconde est alors rejetée.

## Correspondance avec le moteur actuel (pour la mesure automatique)

Le moteur public (v46) ne connaît pas ces intentions : il choisit un **aspect** dans une liste de priorité fixe (`V46_PRIO`), une **entrée de la base `V46_FAQ`** (177 entrées, thèmes `app`, `argent`, `bac`, `doute`, `filiere`, `lycee`, `metier`, `parent`, `ps`, `sl`, `vie`) ou un **fait** (`v46Fact`). S'il ne trouve rien, il appelle l'ancien moteur, puis une réponse « je n'ai pas de réponse fiable ». La table de correspondance utilisée pour noter est dans `coach/outils/examen.js`. Elle est approximative : elle sert à mesurer des tendances, pas à juger une réponse au mot près.
