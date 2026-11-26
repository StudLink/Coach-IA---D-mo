#!/usr/bin/env python3
"""Contrôles automatiques de la banque (section 6 B de PROMPT.md), sur 100 % des entrées.
  python3 controle_banque.py <fichier.jsonl ou dossier> [...] [--catalogue cat.json] [--ps parcoursup.jsonl]
        [--examen ../examen/examen_fixe.jsonl] [--sortie rapport.json] [--corrige dossier_sortie]
Sans --corrige : affiche le bilan. Avec --corrige : écrit des copies où les formulations rejetées
(quasi-doublons, proches de l'examen) sont retirées et où le statut passe à a_corriger si un contrôle échoue."""
import json, sys, os, re, glob, math
from collections import Counter, defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from controles import controle_texte, N, mots

ICI = os.path.dirname(os.path.abspath(__file__))
INTENTIONS = {"decouvrir_formation", "programme_cours", "debouches_metiers", "metier_vers_formation", "admission_prerequis", "duree_niveau",
              "alternance", "cout_financement", "lieu_etablissements", "comparer", "choix_specialites", "parcoursup_procedure", "dossier_motivation",
              "reorientation", "indecision", "contrainte_rejet", "profil_scolaire", "international", "besoins_particuliers", "parents_entourage",
              "stress_motivation", "detresse", "fonctionnement_studlink", "hors_perimetre", "social"}
BLOCS = {"cluster", "sensible", "special"}
STATUTS = {"valide", "a_corriger", "a_verifier", "rejete"}
MOTS_VIDES = set("le la les un une des de du d l a au aux et ou en y je tu il elle on nous vous ils elles me te se ma ta sa mon ton son mes tes ses ce cet cette ces que qui quoi est c j m t s n ne pas pour par sur dans avec plus".split())

def norm_f(s):
    x = re.sub(r"[^a-z0-9 ]", " ", N(s))
    return " ".join(w for w in x.split() if w not in MOTS_VIDES)
def tri(s):
    x = norm_f(s)
    return {x[i:i + 3] for i in range(max(1, len(x) - 2))}
def jac(a, b): return len(a & b) / max(1, len(a | b))

def lire(chemins):
    E = []
    for c in chemins:
        fs = sorted(glob.glob(os.path.join(c, "**/*.jsonl"), recursive=True)) if os.path.isdir(c) else [c]
        for f in fs:
            for k, l in enumerate(open(f, encoding="utf8")):
                l = l.strip()
                if not l: continue
                try: E.append((f, k + 1, json.loads(l)))
                except Exception as e: E.append((f, k + 1, {"__erreur_json": str(e)[:80]}))
    return E

def main():
    a = sys.argv[1:]
    opt = {}; ch = []
    i = 0
    while i < len(a):
        if a[i].startswith("--"): opt[a[i][2:]] = a[i + 1]; i += 2
        else: ch.append(a[i]); i += 1
    cat = {f["id"] for f in json.load(open(opt["catalogue"]))} if "catalogue" in opt else None
    lieux = set()
    if "ps" in opt:
        for l in open(opt["ps"], encoding="utf8"):
            r = json.loads(l); lieux.update({N(r["ville"]), N(r["etab"]), N(r["region"]), r["dep"]})
    exam = [tri(json.loads(l)["msg"]) for l in open(opt.get("examen", os.path.join(ICI, "../examen/examen_fixe.jsonl")), encoding="utf8") if l.strip()]
    E = lire(ch)
    rapport = []; vus_id = set()
    # 1. contrôles par entrée
    for f, k, e in E:
        p = []
        if "__erreur_json" in e: rapport.append({"fichier": f, "ligne": k, "id": None, "problemes": ["json_invalide"]}); continue
        for champ in ("id", "bloc", "besoin", "lecture", "formulations", "reponse", "formations_citees", "lieux_cites", "sources", "difficulte", "statut"):
            if champ not in e: p.append("champ_absent:" + champ)
        if e.get("id") in vus_id: p.append("id_en_double")
        vus_id.add(e.get("id"))
        if e.get("bloc") not in BLOCS: p.append("bloc_inconnu")
        L = e.get("lecture") or {}
        if L.get("intention_principale") not in INTENTIONS: p.append("intention_inconnue:" + str(L.get("intention_principale")))
        for s in L.get("intentions_secondaires") or []:
            if s not in INTENTIONS: p.append("intention_secondaire_inconnue:" + str(s))
        if e.get("statut") not in STATUTS: p.append("statut_inconnu")
        F = e.get("formulations") or []
        if not isinstance(F, list) or not F: p.append("formulations_vides")
        bloc = e.get("bloc")
        if bloc == "cluster" and not (12 <= len(F) <= 15): p.append(f"cluster_{len(F)}_formulations")
        if bloc == "special":
            if len(F) != 1: p.append("special_plusieurs_formulations")
            elif not (35 <= mots(F[0]) <= 170): p.append(f"special_longueur_question:{mots(F[0])}")
            if len((L.get("caracteristiques") or {})) < 4: p.append("special_moins_de_4_caracteristiques")
        if cat is not None:
            for fid in e.get("formations_citees") or []:
                if fid not in cat: p.append("formation_inconnue:" + str(fid))
        if lieux:
            for li in e.get("lieux_cites") or []:
                if N(li) not in lieux and not any(N(li) in x for x in [N(li)] if False): p.append("lieu_inconnu:" + str(li))
        det = L.get("intention_principale") == "detresse"
        R = e.get("reponse") or ""
        p += controle_texte(R, detresse=det)
        if det:
            sig = N(" ".join(F) + " " + e.get("besoin", ""))
            if re.search(r"harcel|moqu|insult|rackett|cyber", sig) and "3018" not in R: p.append("ressource_absente:3018")
            if re.search(r"frapp|tape dessus|violen|bat\b|battent|dehors|touche", sig) and "119" not in R: p.append("ressource_absente:119")
            p = [x for x in p if x != "sans_prochaine_etape" or True]
        n = mots(R)
        lim = 230 if bloc in ("special", "sensible") else 180
        if n > lim: p.append(f"trop_long:{n}")
        if n < 25 and L.get("intention_principale") not in ("social", "hors_perimetre"): p.append(f"trop_court:{n}")
        if L.get("attribution") == "parent" and not re.search(r"\bvous\b|\bvotre\b|\bvos\b", N(R + " " + str(e.get("reponse_parent") or ""))): p.append("parent_sans_vouvoiement")
        if e.get("reponse_parent"): p += ["parent:" + x for x in controle_texte(e["reponse_parent"], detresse=det)]
        for s in e.get("sources") or []:
            if not isinstance(s, dict) or "url" not in s or "verifie_le" not in s: p.append("source_mal_formee")
        rapport.append({"fichier": f, "ligne": k, "id": e.get("id"), "bloc": bloc, "intention": L.get("intention_principale"), "problemes": p})
    # 2. quasi-doublons (Jaccard trigrammes > 0,80) sur toutes les formulations, et proximité avec l'examen (> 0,70)
    forms = []
    for idx, (f, k, e) in enumerate(E):
        for j, t in enumerate(e.get("formulations") or []):
            forms.append((idx, j, t, tri(t)))
    freq = Counter(g for *_, s in forms for g in s)
    index = defaultdict(list); rejet = defaultdict(set); doublons = 0; proches_exam = 0
    for n_, (idx, j, t, s) in enumerate(forms):
        if any(jac(s, x) > 0.70 for x in exam):
            rejet[idx].add(j); proches_exam += 1; continue
        ordre = sorted(s, key=lambda g: (freq[g], g))
        pref = ordre[: len(s) - math.ceil(0.8 * len(s)) + 1]
        cand = set()
        for g in pref: cand.update(index[g])
        if any(jac(s, forms[c][3]) > 0.80 for c in cand):
            rejet[idx].add(j); doublons += 1; continue
        for g in pref: index[g].append(n_)
    for idx, js in rejet.items():
        rapport[idx].setdefault("formulations_rejetees", sorted(js))
    tot = len(forms); gardees = tot - doublons - proches_exam
    bilan = {"entrees": len(E), "formulations": tot, "quasi_doublons_rejetes": doublons, "proches_examen_rejetes": proches_exam,
             "formulations_gardees": gardees,
             "entrees_avec_probleme": sum(1 for r in rapport if r["problemes"]),
             "problemes": dict(Counter(x.split(":")[0] for r in rapport for x in r["problemes"]))}
    print(json.dumps(bilan, ensure_ascii=False, indent=1))
    if "sortie" in opt: json.dump({"bilan": bilan, "entrees": rapport}, open(opt["sortie"], "w"), ensure_ascii=False, indent=1)
    if "corrige" in opt:
        os.makedirs(opt["corrige"], exist_ok=True)
        par = defaultdict(list)
        for (f, k, e), r in zip(E, rapport):
            if "__erreur_json" in e: continue
            e = dict(e)
            if r.get("formulations_rejetees"):
                e["formulations"] = [t for j, t in enumerate(e["formulations"]) if j not in set(r["formulations_rejetees"])]
            bloquants = [x for x in r["problemes"] if not x.startswith(("sans_prochaine_etape", "cluster_"))]
            if not e["formulations"]: e["statut"] = "rejete"
            elif bloquants and e.get("statut") == "valide": e["statut"] = "a_corriger"; e["controle"] = bloquants
            par[os.path.basename(f)].append(e)
        for nom, L in par.items():
            with open(os.path.join(opt["corrige"], nom), "w", encoding="utf8") as o:
                for e in L: o.write(json.dumps(e, ensure_ascii=False) + "\n")
main()
