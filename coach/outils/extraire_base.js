/*
 * Extrait toute la base de réponses du coach depuis index.html (sans le modifier) :
 * V46_FAQ (réponse élève et réponse parent), V46_FACTS (réponse calculée), qa, faq, FAQ, réponses du cadre.
 *   node extraire_base.js [sortie.json]
 */
const fs = require("fs"), path = require("path");
const { ouvrir } = require("./banc");
(async () => {
  const HTML = path.join(__dirname, "../../index.html");
  const src = fs.readFileSync(HTML, "utf8");
  const b = await ouvrir(HTML), w = b.fenetre;
  const out = [];
  const faqN = w.eval("V46_FAQ.length");
  for (let i = 0; i < faqN; i++) {
    const e = w.eval(`(() => { const e = V46_FAQ[${i}]; const R = x => { if (typeof x !== "function") return x; for (const arg of ["", {}]) { try { return String(x(arg, {})); } catch (er) {} } return "ERREUR rendu"; }; return JSON.stringify({ id: e.id, th: e.th, a: R(e.a), ap: e.ap ? R(e.ap) : null, s: e.s || null }); })()`);
    const o = JSON.parse(e);
    out.push({ base: "V46_FAQ", id: o.id, theme: o.th, texte: o.a, source: o.s });
    if (o.ap) out.push({ base: "V46_FAQ_parent", id: o.id + "#parent", theme: o.th, texte: o.ap, source: o.s });
  }
  const factN = w.eval("V46_FACTS.length");
  for (let i = 0; i < factN; i++) {
    const o = JSON.parse(w.eval(`(() => { const f = V46_FACTS[${i}]; let t = "ERREUR rendu"; if (typeof f.a !== "function") t = f.a; else for (const arg of ["", {}]) { try { t = f.a(arg, {}); break; } catch (e) {} } return JSON.stringify({ id: f.id, a: String(t), src: f.src || null }); })()`));
    out.push({ base: "V46_FACTS", id: o.id, texte: o.a, source: o.src });
  }
  /* qa, faq, FAQ : tableaux [question, réponse] déclarés dans des fonctions ; on évalue le littéral dans la page */
  const litteral = (debut) => {
    const res = [];
    let i = src.indexOf(debut);
    while (i >= 0) {
      const st = src.indexOf("[", i + debut.length - 1);
      let d = 0, j = st, q = null;
      for (; j < src.length; j++) {
        const c = src[j];
        if (q) { if (c === "\\") { j++; continue; } if (c === q) q = null; else if (q === "`" && c === "$" && src[j + 1] === "{") { /* ignoré : on suit seulement les crochets hors chaînes */ } continue; }
        if (c === '"' || c === "'" || c === "`") { q = c; continue; }
        if (c === "[") d++; else if (c === "]") { d--; if (d === 0) break; }
      }
      res.push(src.slice(st, j + 1));
      i = src.indexOf(debut, j);
    }
    return res;
  };
  for (const [nom, debut] of [["qa", "const qa = ["], ["faq", "const faq = ["], ["V29_FAQ", "const V29_FAQ = ["]]) {
    litteral(debut).forEach((lit, k) => {
      let arr; try { arr = w.eval(lit); } catch (e) { out.push({ base: nom, id: nom + "#erreur" + k, texte: "", erreur: e.message }); return; }
      if (!Array.isArray(arr)) return;
      arr.forEach((p, n) => { if (Array.isArray(p) && p.length >= 2) out.push({ base: nom, id: `${nom}${k ? "_" + k : ""}#${n}`, question: String(p[0]), texte: String(p[1]) }); });
    });
  }
  /* réponses du cadre */
  const essais = { "detresse:grave": "j'ai envie de mourir", "detresse:violence": "mon pere me frappe", "detresse:harcelement": "on se moque de moi tous les jours", "detresse:malaise": "je pleure tous les soirs", "hors_cadre": "donne moi une recette de crepes", "hors_cadre_parent": "Bonjour, pourriez-vous me donner la météo de demain pour mon fils ?" };
  for (const [k, msg] of Object.entries(essais)) {
    w.__M = msg;
    const r = w.eval("JSON.stringify(cadreReponse(__M))");
    const o = r ? JSON.parse(r) : null;
    out.push({ base: "cadre", id: k, question: msg, texte: o ? o.text : "", cle: o ? o.k : null });
  }
  const f = process.argv[2] || path.join(__dirname, "../verification/base_extraite.json");
  fs.writeFileSync(f, JSON.stringify(out, null, 1));
  const c = {}; out.forEach(o => c[o.base] = (c[o.base] || 0) + 1);
  console.log(f, out.length, JSON.stringify(c));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
