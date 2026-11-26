#!/usr/bin/env python3
"""Contrôles automatiques sur toute la base du coach (extraite par extraire_base.js).
  python3 controle_base.py base_extraite.json sortie.json"""
import json, sys, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from controles import controle_texte, N
base = json.load(open(sys.argv[1]))
res = []
for e in base:
    det = e["base"] == "cadre" and e["id"].startswith("detresse")
    p = controle_texte(e["texte"], detresse=det and e["id"] in ("detresse:grave", "detresse:violence"))
    if det and "3114" not in e["texte"]: p.append("ressource_absente:3114")
    # la réponse du cadre détresse finit volontairement sans « prochaine étape » d'orientation
    if e["base"] == "cadre": p = [x for x in p if x != "sans_prochaine_etape"]
    porte = bool(re.search(r"\b20\d\d\b|€|euros?\b|\b\d{1,2} (janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\b|calendrier|campYear|date", N(e["texte"])))
    res.append({"base": e["base"], "id": e["id"], "problemes": p, "porte_date_montant": porte})
json.dump(res, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
from collections import Counter
c = Counter(x.split(":")[0] for r in res for x in r["problemes"])
print(len(res), "entrées ;", sum(1 for r in res if r["problemes"]), "avec au moins un problème ;", dict(c))
print("portent une date ou un montant :", sum(r["porte_date_montant"] for r in res))
