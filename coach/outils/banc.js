/*
 * Banc d'essai du coach StudLink, hors navigateur.
 *
 * Charge index.html dans jsdom (sans réseau), instrumente localAnswer UNIQUEMENT ici
 * (chaque `return` note la ligne qui a répondu), puis envoie des messages avec un profil
 * et un contexte donnés.
 *
 * Utilisation en module :
 *   const banc = await require("./banc").ouvrir("../../index.html");
 *   const r = banc.demander("C'est combien de temps un BTS ?", { profil: {...}, contexte: "bts-mco" });
 *   // r = { reponse, branche, ms }
 *
 * Utilisation en ligne de commande :
 *   node banc.js "ma question" [--classe Terminale] [--voie g] [--ctx id-formation]
 */
const fs = require("fs");
const path = require("path");
const acorn = require("acorn");
const walk = require("acorn-walk");
const MagicString = require("magic-string");
const { JSDOM, VirtualConsole } = require("jsdom");

/* ---------- 1. instrumenter localAnswer dans une copie du HTML ---------- */
function instrumenter(html) {
  const re = /<script([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    if (/application\/json/.test(m[1])) continue;
    const st = m.index + m[0].length, en = html.indexOf("</script>", st);
    const code = html.slice(st, en);
    if (!code.includes("function localAnswer")) continue;
    const ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "script", locations: true });
    let fn = null;
    walk.simple(ast, { FunctionDeclaration(n) { if (n.id && n.id.name === "localAnswer") fn = n; } });
    if (!fn) throw new Error("localAnswer introuvable");
    const ms = new MagicString(code);
    const branches = {};
    // seuls les `return` dont la fonction englobante la plus proche est localAnswer
    (function visite(node, dansAutreFonction) {
      if (!node || typeof node.type !== "string") return;
      const estFonction = /Function/.test(node.type);
      const autre = dansAutreFonction || (estFonction && node !== fn);
      if (node.type === "ReturnStatement" && !dansAutreFonction && node.argument) {
        const L = node.loc.start.line;
        branches[L] = code.slice(node.argument.start, node.argument.start + 90).replace(/\s+/g, " ");
        ms.appendLeft(node.argument.start, `(globalThis.__BRANCHE = ${L}, `);
        ms.appendRight(node.argument.end, `)`);
      }
      for (const k in node) {
        if (k === "loc" || k === "start" || k === "end") continue;
        const v = node[k];
        if (Array.isArray(v)) v.forEach(x => x && typeof x.type === "string" && visite(x, autre));
        else if (v && typeof v.type === "string") visite(v, autre);
      }
    })(fn, false);
    return { html: html.slice(0, st) + ms.toString() + html.slice(en), branches };
  }
  throw new Error("script du moteur introuvable");
}

/* ---------- 2. ouvrir la page ---------- */
async function ouvrir(fichier) {
  const brut = fs.readFileSync(path.resolve(fichier), "utf8");
  const { html, branches } = instrumenter(brut);
  const erreurs = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => erreurs.push(String(e && e.message || e).slice(0, 200)));
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://studlink.github.io/Coach-IA---D-mo/",
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
      w.IntersectionObserver = w.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
      w.ResizeObserver = w.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.fetch = () => Promise.reject(new Error("pas de réseau dans le banc d'essai"));
    }
  });
  const w = dom.window;
  await new Promise(r => setTimeout(r, 300));
  if (typeof w.localAnswer !== "function") throw new Error("localAnswer non chargé : " + erreurs.slice(0, 3).join(" | "));

  /* profil de test : on remplace prof() le temps d'une question */
  w.eval(`globalThis.__profOrig = prof; globalThis.__PROFIL = null;
    prof = function () { const p = __profOrig(); return __PROFIL ? Object.assign(p, __PROFIL) : p; };`);

  /* La réponse publique passe par une chaîne de couches qui enveloppent localAnswer :
     v46 (coachV46 : analyse + base V46_FAQ + faits) → v38 (niches) → v34 (« pourquoi tu me proposes ») → v32 → moteur d'origine.
     On relève : la couche v46 qui a répondu (D.coach.v46.lastG, l'aspect retenu) et, si c'est l'ancien moteur,
     la ligne du `return` de localAnswer d'origine. */
  const MARK = "⁣v46";
  function un(message) {
    w.__BRANCHE = null;
    const t0 = process.hrtime.bigint();
    let brut, erreur = null;
    /* même enchaînement que freeChat sans IA : v46pre, formation reconnue → ctxF, puis localAnswer(text, found) */
    w.__MSG = message;
    try { brut = w.eval(`(() => { D.coach.v46pre = D.coach.ctxF; const found = findFormations(norm(__MSG), 2); if (found.length) D.coach.ctxF = found[0].id; return localAnswer(__MSG, found); })()`); }
    catch (e) { erreur = String(e && e.message || e); brut = ""; }
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    const txt = String(brut || ""), cut = txt.indexOf(MARK);
    const X = w.eval("D.coach.v46 || {}");
    return {
      reponse: cut >= 0 ? txt.slice(0, cut).trim() : txt.trim(),
      couche: X.lastG || null,
      aspect: X.last ? X.last.asp : null,
      branche: X.lastG === "old" ? w.__BRANCHE : null,
      ms: Math.round(ms * 10) / 10,
      erreur
    };
  }
  /* opts : profil {classe, voie, codes…}, contexte (id de formation dont on parlait), recos (ids), avant (messages précédents) */
  function demander(message, opts = {}) {
    const o = opts || {};
    w.__PROFIL = o.profil ? Object.assign({ codes: [], speL: [], lv: -1, mob: "", reg: "", regL: "" }, o.profil) : null;
    w.__CTX = o.contexte || null;
    w.__RECOS = o.recos || [];
    w.eval(`D.coach = Object.assign(D.coach || {}, { ctxF: __CTX, ctxO: null, lastA: null, msgs: [], done: true, v46: { n: 0, f: __CTX || undefined } , v46pre: __CTX });
      D.results = __RECOS.length ? { recos: __RECOS.map(id => ({ id })) } : null;
      D.bac = __PROFIL && __PROFIL.voie ? __PROFIL.voie : ""; D.ville = null;`);
    (o.avant || []).forEach(m => un(m));
    return un(message);
  }
  return { demander, branches, erreurs, fenetre: w };
}

module.exports = { ouvrir, instrumenter };

/* ---------- 3. ligne de commande ---------- */
if (require.main === module) {
  (async () => {
    const a = process.argv.slice(2);
    const msg = a.find(x => !x.startsWith("--") && !a[a.indexOf(x) - 1]?.startsWith("--"));
    const get = k => { const i = a.indexOf("--" + k); return i >= 0 ? a[i + 1] : undefined; };
    const banc = await ouvrir(path.join(__dirname, "../../index.html"));
    const profil = get("classe") || get("voie") ? { classe: get("classe") || "Terminale", voie: get("voie") || "" } : null;
    const r = banc.demander(msg || "Bonjour", { profil, contexte: get("ctx") });
    console.log(`[couche ${r.couche} · aspect ${r.aspect}${r.branche ? " · ancien moteur L" + r.branche : ""} · ${r.ms} ms]${r.erreur ? " ERREUR " + r.erreur : ""}\n${r.reponse}`);
    process.exit(0);
  })().catch(e => { console.error(e); process.exit(1); });
}
