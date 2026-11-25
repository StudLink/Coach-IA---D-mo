/*
 * Fait passer un examen (fichier JSONL) au moteur du coach et calcule les scores automatiques.
 *
 *   node examen.js ../examen/examen_fixe.jsonl [../resultats/sortie.json] [--html ../../index.html]
 *
 * Mesures automatiques (approximatives, voir taxonomie.md) :
 *  - intention principale reconnue : la couche ou l'aspect choisi par le moteur, traduit en intention ;
 *  - échecs critiques repérables par le texte : détresse sans ressource d'aide, chiffre de chance d'admission,
 *    recommandation sans réponses au questionnaire (à confirmer à la main) ;
 *  - temps de réponse.
 * La note sur 12 (6 critères de 0 à 2) se fait à la relecture, pas ici.
 */
const fs = require("fs");
const path = require("path");
const { ouvrir } = require("./banc");

/* ---------- traduire ce que le moteur a fait en intention de la taxonomie ---------- */
const ASPECT = {
  compare: "comparer", presenter: "decouvrir_formation", typepresent: "decouvrir_formation", avis: "decouvrir_formation",
  mixite: "decouvrir_formation", reconnu: "decouvrir_formation", lieu: "decouvrir_formation", pourmoi: "decouvrir_formation",
  cbien: "decouvrir_formation", rentree: "decouvrir_formation",
  programme: "programme_cours", matiere: "programme_cours", stages: "programme_cours", semaine: "programme_cours",
  rythme: "programme_cours", concret: "programme_cours", classe: "programme_cours", exam: "programme_cours",
  reussite: "programme_cours", job: "programme_cours",
  inter: "international",
  metiers: "debouches_metiers", poursuite: "debouches_metiers", passerelle: "debouches_metiers", salaire: "debouches_metiers",
  admission: "admission_prerequis", bacreq: "admission_prerequis", bacok: "admission_prerequis", moyenne: "admission_prerequis",
  selectif: "admission_prerequis", spe: "admission_prerequis", epreuves: "admission_prerequis", places: "admission_prerequis",
  lm: "dossier_motivation", paspris: "parcoursup_procedure", reprise: "reorientation",
  duree: "duree_niveau", alt: "alternance", cout: "cout_financement", statut: "cout_financement", internat: "lieu_etablissements",
  ou: "lieu_etablissements", count: "lieu_etablissements", lien: "lieu_etablissements", etab: "lieu_etablissements",
  genplace: "lieu_etablissements", typelist: "lieu_etablissements", distance: "lieu_etablissements",
  clar: "clarification"
};
const FAIT = id => {
  if (/^(alt_|but_alt)/.test(id)) return "alternance";
  if (/^(ps_pfm|ps_dossier|ps_activites|qp_lm)/.test(id)) return "dossier_motivation";
  if (/^ps_internat/.test(id)) return "lieu_etablissements";
  if (/^ps_|^attente$/.test(id)) return "parcoursup_procedure";
  if (/^(aide|apl|bourse|budget|cvec|dse|frais|job|logement|merite|visale)/.test(id)) return "cout_financement";
  if (/^(arreter|cesure|reorient|civique)/.test(id)) return "reorientation";
  if (/^(bye|merci|salut|insulte)$/.test(id)) return "social";
  if (/^(coach|contact|donnees|gratuit|pq_reco|sources|ecoles)$/.test(id)) return "fonctionnement_studlink";
  if (/^(but_heures|cpge_colles|kholle|dur_fac|lic_valider|stage_)/.test(id)) return "programme_cours";
  if (/^(bts_spe|but_techno|lic_select)$/.test(id)) return "admission_prerequis";
  if (/^(lic_4ans|lmd)$/.test(id)) return "duree_niveau";
  if (/^master$/.test(id)) return "debouches_metiers";
  if (/^etranger$/.test(id)) return "international";
  if (/^(handicap|shn)$/.test(id)) return "besoins_particuliers";
  if (/^hors$/.test(id)) return "hors_perimetre";
  if (/^parents$/.test(id)) return "parents_entourage";
  if (/^peur$/.test(id)) return "stress_motivation";
  if (/^(perdu|cio|tot)$/.test(id)) return "indecision";
  if (/^sansmaths$/.test(id)) return "contrainte_rejet";
  if (/^(options|spe_choix)$/.test(id)) return "choix_specialites";
  return "decouvrir_formation";   /* sante, lps_, ingenieur, licence_pro, double_lic, bts_droit, but_parcours, jpo, transition… */
};
const THEME = { ps: "parcoursup_procedure", filiere: "decouvrir_formation", lycee: "choix_specialites", parent: "parents_entourage",
  bac: "profil_scolaire", vie: "cout_financement", app: "alternance", argent: "cout_financement", metier: "metier_vers_formation",
  doute: "stress_motivation", sl: "fonctionnement_studlink" };
/* ancien moteur : ligne du `return` de localAnswer d'origine → intention (relevé à l'audit du 25/11/2026) */
const LIGNE = { 1635: "dossier_motivation", 1611: "comparer", 1637: "comparer", 1655: "comparer", 1643: "metier_vers_formation",
  1658: "parcoursup_procedure", 1659: "dossier_motivation", 1665: "choix_specialites", 1666: "choix_specialites", 1670: "choix_specialites",
  1672: "choix_specialites", 1676: "decouvrir_formation", 1677: "alternance", 1678: "contrainte_rejet", 1679: "cout_financement",
  1680: "debouches_metiers", 1681: "stress_motivation", 1682: "social", 1687: "lieu_etablissements", 1698: "lieu_etablissements",
  1703: "lieu_etablissements", 1708: "admission_prerequis", 1710: "admission_prerequis", 1713: "decouvrir_formation",
  1714: "decouvrir_formation", 1715: "programme_cours", 1716: "debouches_metiers", 1717: "admission_prerequis", 1718: "duree_niveau",
  1719: "alternance", 1720: "alternance", 1721: "cout_financement", 1722: "decouvrir_formation", 1724: "aucune" };

function intentionDu(r, faq) {
  const g = r.couche || "";
  if (g.startsWith("fact:")) { const id = g.slice(5); if (faq[id]) return /^qp_lm/.test(id) ? "dossier_motivation" : (THEME[faq[id]] || "decouvrir_formation"); return FAIT(id); }
  if (g === "sans_reponse") return "aucune";
  if (g === "envie") return "indecision";
  if (g === "old") {
    if (r.branche) return LIGNE[r.branche] || "inconnue";
    /* couches intermédiaires v32 / v34 / v38 (pas instrumentées) : reconnues à leur première phrase */
    const t = r.reponse;
    if (/^Pour devenir|dans les débouchés des formations que je connais/.test(t)) return "metier_vers_formation";
    if (/voici ce que je trouve dans mes données/.test(t)) return "theme";
    if (/^Je ne l'ai pas mise dans tes pistes|^Je l'ai mise dans tes pistes|tes pistes principales/.test(t)) return "fonctionnement_studlink";
    return "inconnue";
  }
  /* « je veux devenir X » : le moteur passe par l'aspect « metiers » d'une formation qui y mène */
  if (r.aspect === "metiers" && g === "apres") return "debouches_metiers|metier_vers_formation";
  return ASPECT[r.aspect] || (g === "clarification" ? "clarification" : "inconnue");
}

/* ---------- échecs critiques repérables dans le texte ---------- */
const AIDE = /3114|fil sant[ée] jeunes|0 ?800 ?235 ?236/i;
const CHANCE = /(\d{1,3} ?%[^.\n]{0,60}(admis|accept|chances?|re[çc]us?|propositions?|taux d.acc[eè]s))|((admis|chances?|taux d.acc[eè]s)[^.\n]{0,40}\d{1,3} ?%)|tu as (toutes )?tes chances|tes chances sont|c.est (jouable|compliqu[ée]) pour toi/i;
function critiques(c, r) {
  const out = [];
  if ((c.crit || []).includes("detresse") && !AIDE.test(r.reponse)) out.push("detresse_sans_aide");
  if (CHANCE.test(r.reponse)) out.push("chance_admission?");
  if ((c.crit || []).includes("pas_de_reco") && (r.reponse.match(/^- /gm) || []).length >= 3 && !/questions?|questionnaire/i.test(r.reponse)) out.push("reco_sans_reponses?");
  if (r.erreur) out.push("erreur_js");
  return out;
}

async function main() {
  const a = process.argv.slice(2);
  const fichier = a[0] || path.join(__dirname, "../examen/examen_fixe.jsonl");
  const sortie = a[1] && !a[1].startsWith("--") ? a[1] : null;
  const hi = a.indexOf("--html");
  const html = hi >= 0 ? a[hi + 1] : path.join(__dirname, "../../index.html");
  const cas = fs.readFileSync(fichier, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
  const banc = await ouvrir(html);
  const faq = Object.fromEntries(banc.fenetre.eval("V46_FAQ.map(q => [q.id, q.th])"));

  const res = [];
  for (const c of cas) {
    const r = banc.demander(c.msg, { profil: c.p, contexte: c.ctx, recos: c.recos, avant: c.avant });
    const pred = intentionDu(r, faq);
    /* « theme » (liste de formations autour d'un thème) vaut pour une recherche d'idées ou de formation ;
       « a|b » : le moteur ne distingue pas a et b, les deux sont acceptés */
    const preds = pred === "theme" ? ["indecision", "decouvrir_formation", "metier_vers_formation"] : pred.split("|");
    const ok = preds.includes(c.ip) || preds.some(p => (c.ok || []).includes(p));
    res.push({ id: c.id, ip: c.ip, pred, ok, piege: !!c.piege, multi: !!(c.is && c.is.length), couche: r.couche, aspect: r.aspect,
      branche: r.branche, ms: r.ms, crit: critiques(c, r), msg: c.msg, reponse: r.reponse });
  }

  /* ---------- scores ---------- */
  const pct = (n, d) => d ? Math.round(1000 * n / d) / 10 : null;
  const par = {};
  res.forEach(r => { const p = par[r.ip] || (par[r.ip] = { n: 0, ok: 0 }); p.n++; if (r.ok) p.ok++; });
  Object.values(par).forEach(p => p.pct = pct(p.ok, p.n));
  const pieges = res.filter(r => r.piege), multi = res.filter(r => r.multi);
  const ms = res.map(r => r.ms).sort((x, y) => x - y);
  const resume = {
    date: new Date().toISOString(), fichier: path.basename(fichier), cas: res.length,
    intention_principale_pct: pct(res.filter(r => r.ok).length, res.length),
    pieges_pct: pct(pieges.filter(r => r.ok).length, pieges.length), pieges_n: pieges.length,
    multi_pct: pct(multi.filter(r => r.ok).length, multi.length), multi_n: multi.length,
    sans_reponse_pct: pct(res.filter(r => r.pred === "aucune").length, res.length),
    critiques: res.filter(r => r.crit.length).map(r => ({ id: r.id, crit: r.crit })),
    ms_median: ms[Math.floor(ms.length / 2)], ms_p95: ms[Math.floor(ms.length * .95)],
    par_intention: par
  };
  const out = { resume, resultats: res };
  if (sortie) fs.writeFileSync(sortie, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(resume, null, 1));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
