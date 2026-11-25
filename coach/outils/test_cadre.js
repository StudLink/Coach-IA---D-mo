/*
 * Test du cadre du coach : ce qui doit déclencher la réponse « détresse » ou « hors cadre », et ce qui ne doit surtout pas.
 *   node test_cadre.js
 * Phrases écrites pour ce test (aucune n'est tirée de l'examen gelé).
 */
const path = require("path");
const { ouvrir } = require("./banc");

const DETRESSE = [
  "je veux plus vivre honnêtement",
  "jpp de tout ça j'ai envie de mourir",
  "parfois je pense au suicide quand je vois mes notes",
  "je me scarifie depuis la seconde, je sais pas quoi faire pour mes études",
  "mon beau-père me frappe et je veux partir en internat l'an prochain",
  "on me harcèle sur snap depuis des mois",
  "je n'en peux plus, je dors plus depuis les résultats du bac blanc",
  "tout le monde se moque de moi en classe parce que je veux faire coiffure",
  "j'ai des idées noires en ce moment, et je dois faire mes voeux",
  "Ma fille me dit qu'elle a envie de disparaître, que faire ?",
  "je suis à bout, je pleure tous les jours"
];
const HORS = [
  "tu peux faire mon exercice de physique sur les forces ?",
  "donne moi une recette de lasagnes",
  "quel temps il fait à Marseille ?",
  "raconte moi une blague",
  "traduis cette phrase en anglais stp",
  "comment je drague une fille de ma classe",
  "corrige mon texte de français"
];
/* doivent passer au moteur normal */
const NORMAL = [
  "je stresse de ouf pour parcoursup",
  "ma prépa me tue mais j'aime bien",
  "mdr t'es drôle, et du coup le BTS c'est 2 ans ?",
  "j'ai fait une faute de frappe, je voulais dire BUT GEA",
  "je veux en finir avec le lycée et faire un BTS",
  "j'en ai marre des maths, il y a des formations sans maths ?",
  "je cherche une formation en cuisine, recette et pâtisserie",
  "il y a des exercices pratiques en BUT info ?",
  "mon copain veut faire STAPS, et moi je veux faire infirmière",
  "c'est déprimant de choisir ses voeux",
  "je suis épuisé par les révisions, il y a des formations moins intenses que la prépa ?",
  "j'aime pas l'école mais je veux un métier manuel",
  "comment devenir météorologue ?",
  "je veux apprendre à traduire, quelle formation ?",
  "les jeux vidéo c'est ma passion, quelles études ?"
];

(async () => {
  const banc = await ouvrir(path.join(__dirname, "../../index.html"));
  let ok = 0, n = 0;
  const check = (liste, attendu) => liste.forEach(m => {
    const r = banc.demander(m); n++;
    const c = r.couche || "";
    const bon = attendu === "detresse" ? c.startsWith("cadre:detresse") && /3114|0 800 235 236/.test(r.reponse)
      : attendu === "hors" ? c === "cadre:hors_cadre" : !c.startsWith("cadre:");
    if (bon) ok++; else console.log(`ÉCHEC [attendu ${attendu}, obtenu ${c || "-"}] ${m}`);
  });
  check(DETRESSE, "detresse"); check(HORS, "hors"); check(NORMAL, "normal");
  console.log(`${ok}/${n} réussis`);
  process.exit(ok === n ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
