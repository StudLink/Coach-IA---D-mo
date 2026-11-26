#!/usr/bin/env python3
"""Contrôles automatiques communs (base du coach et banque générée).
Importé par controle_base.py et controle_banque.py."""
import re, unicodedata
N = lambda s: unicodedata.normalize("NFD", str(s or "").lower()).encode("ascii", "ignore").decode()
EMOJI = re.compile("[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F000-\U0001F2FF⭐⭕‼⁉™ℹ↔-↪⌚-⏿▪-◾️]")
# avis ou chiffre sur les chances d'admission (dans une phrase affirmative du coach)
CHANCE = re.compile(r"(\d+ ?%[^.\n]{0,40}(chance|admis|pris|accept)|(chance|probabilit)[^.\n]{0,30}\d+ ?%|tu as (toutes )?tes chances|tu as de (grandes|bonnes|fortes) chances|tu as peu de chances|aucune chance|c'est (jouable|mort|foutu|tres possible|largement possible|impossible pour toi)|tu seras (pris|prise|admis|admise)|tu vas (etre pris|etre prise|passer)|vous avez (toutes )?vos chances|elle a (toutes )?ses chances|il a (toutes )?ses chances|ca passe (largement|facile)|tu es sur d'etre)")
LIEN_BIO = re.compile(r"lien en bio")
URL = re.compile(r"(https?://[^\s)»\"'<>]+|\b(?:www\.)?[a-z0-9-]+\.(?:gouv\.fr|fr|com|org|eu|net)\b(?:/[^\s)»\"'<>]*)?)")
OFFICIELS = ("parcoursup.gouv.fr", "parcoursup.fr", "onisep.fr", "education.gouv.fr", "enseignementsup-recherche.gouv.fr", "etudiant.gouv.fr",
             "service-public.fr", "sante.fr", "info.gouv.fr", "legifrance.gouv.fr", "messervices.etudiant.gouv.fr", "filsantejeunes.com",
             "3018.fr", "allo119.gouv.fr", "monmaster.gouv.fr", "francetravail.fr", "alternance.emploi.gouv.fr", "monparcourshandicap.gouv.fr",
             "trouvermonmaster.gouv.fr", "studlink.eu", "studlink.github.io", "campusfrance.org", "erasmus-plus.fr", "agence-erasmus.fr",
             "lescrous.fr", "caf.fr", "1jeune1solution.gouv.fr", "jeunes.gouv.fr", "apprentissage.gouv.fr", "travail-emploi.gouv.fr",
             "defense.gouv.fr", "service-civique.gouv.fr", "nightline.fr", "e-enfance.org", "3114.fr", "onisep.fr/", "mon-orientation-en-ligne.fr",
             "ameli.fr", "francecompetences.fr", "visale.fr", "actionlogement.fr", "mesdemarches.agriculture.gouv.fr", "chlorofil.fr", "cned.fr",
             "concours-avenir.com", "inscription-ecoles-sante.fr", "terminales2025-2026.fr", "terminales2026-2027.fr", "secondes-premieres2025-2026.fr", "secondes-premieres2026-2027.fr", "gouv.fr")
NUMEROS = {"3114": "prévention du suicide", "0 800 235 236": "Fil Santé Jeunes", "119": "enfance en danger", "3018": "harcèlement", "15": "SAMU", "112": "urgence", "3020": "harcèlement scolaire (désormais 3018)", "17": "police", "3919": "violences femmes", "114": "urgence par SMS"}
# numéros d'aide qui doivent apparaître quand le cadre détresse s'applique
DETRESSE_REQUIS = ["3114", "0 800 235 236"]
FAUX_NUMEROS = re.compile(r"\b(0 ?800 ?235 ?23[0-57-9]|31[02-9]4|302[1-9]|0 ?800 ?23 ?52 ?36)\b")
PROCHAINE = re.compile(r"(ouvre|va |vas |consulte|regarde|fais|lance|note|prends|appelle|ecris|demande|parle|passe|inscris|prepare|commence|clique|essaie|reponds|rends|compare|liste|choisis|contacte|garde|retiens|termine|finis|reprends|cherche|repere|teste|tape|envoie|depose|verifie|programme|ajoute|redige|relis|tu peux|vous pouvez|ouvrez|consultez|appelez|contactez|demandez|parlez|faites|regardez|notez|prenez|allez|dis-moi|dites-moi|tu veux|voulez-vous|\?)", re.I)
def derniere_phrase(t):
    t = re.sub(r"\s+", " ", str(t or "")).strip()
    parts = re.split(r"(?<=[.!?])\s+", t)
    return parts[-1] if parts else t
def a_prochaine_etape(t):
    fin = " ".join(re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", str(t or "")).strip())[-2:])
    return bool(PROCHAINE.search(N(fin)))
def urls_non_officielles(t):
    out = []
    for m in URL.finditer(str(t or "").lower()):
        u = m.group(0)
        if not any(o in u for o in OFFICIELS): out.append(u)
    return out
def date_depassee(t, annee_courante=2026):
    """fait de calendrier rédigé au futur ou au présent pour une année déjà passée"""
    x = N(t); res = []
    for m in re.finditer(r"(ouvre|ouvrira|commence|commencera|debute|aura lieu|se tiendra|jusqu'au|avant le|a partir du|des le)[^.\n]{0,40}\b(20(1\d|2[0-5]))\b", x):
        res.append(m.group(0))
    return res
def mots(t): return len(re.findall(r"\w+", str(t or "")))
def controle_texte(t, detresse=False):
    """renvoie la liste des problèmes d'un texte de réponse"""
    p = []; x = N(t)
    if EMOJI.search(str(t or "")): p.append("emoji")
    if CHANCE.search(x): p.append("chance_admission:" + CHANCE.search(x).group(0)[:60])
    if LIEN_BIO.search(x): p.append("lien_en_bio")
    u = urls_non_officielles(t)
    if u: p.append("lien_non_officiel:" + ",".join(u[:3]))
    if FAUX_NUMEROS.search(str(t or "")): p.append("numero_aide_faux:" + FAUX_NUMEROS.search(str(t)).group(0))
    if "3020" in str(t or ""): p.append("numero_aide_ancien:3020")
    if detresse:
        for n_ in DETRESSE_REQUIS:
            if n_ not in str(t or ""): p.append("ressource_absente:" + n_)
    d = date_depassee(t)
    if d: p.append("date_depassee:" + d[0][:60])
    if not a_prochaine_etape(t): p.append("sans_prochaine_etape")
    return p
