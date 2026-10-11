#!/usr/bin/env python3
"""Cerca in blocco i libri su laFeltrinelli e ne estrae i dati della scheda.

Uso: python3 -I lf.py candidati.txt risultati.json
candidati.txt: una riga per libro, "chiave|titolo|autore" (righe vuote e # ignorate).
Per ogni libro: url, In commercio dal, Traduttore, Editore, Collana, Titolo originale,
EAN, Pagine, trama (la "description" dei dati strutturati, cioè il testo dell'editore)
e trama_breve (la stessa accorciata a frasi intere, 220-480 caratteri).
Le ricerche girano in parallelo; la scheda scelta è il primo risultato il cui indirizzo
contiene il cognome dell'autore e la parola "libro".
"""
import sys, re, json, html as H, unicodedata, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/141"}
FIELDS = ["Autore", "Traduttore", "Curatore", "Editore", "Collana", "In commercio dal",
          "Titolo originale", "EAN", "Pagine"]

def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25) as r:
            return r.read().decode("utf-8", "ignore")
    except Exception:
        return ""

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()).strip("-")

def lines(h):
    h = re.sub(r"(?is)<(script|style|noscript|svg).*?</\1>", "", h)
    h = re.sub(r"(?i)<(br|p|div|li|tr|h\d|span|dt|dd)[^>]*>", "\n", h)
    return [l.strip() for l in H.unescape(re.sub(r"<[^>]+>", "", h)).split("\n") if l.strip()]

def breve(t, lo=220, hi=480):
    """Accorcia il testo dell'editore a frasi intere, tra lo e hi caratteri."""
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"^(Edizione speciale[^.]*\.|Nuova edizione[^.]*\.)\s*", "", t)
    out = ""
    for s in re.split(r'(?<=[.!?»…])\s+(?=[«"“A-ZÀ-ÚÈ])', t):
        if out and len(out) + len(s) + 1 > hi:
            break
        out = (out + " " + s).strip()
        if len(out) >= lo:
            break
    return out if len(out) <= hi else out[:hi].rsplit(" ", 1)[0] + "…"

def lookup(row):
    key, title, author = row
    res = {"key": key, "q": f"{title} / {author}"}
    h = get("https://www.lafeltrinelli.it/search/?query=" + urllib.parse.quote_plus(f"{title} {author}"))
    links = list(dict.fromkeys(re.findall(r'href="(/[^"]+/e/\d{13})"', h)))
    # il token più lungo dell'autore, cercato dopo "-libro-" (i cognomi corti come "Li" danno falsi positivi)
    au = max(slug(author).split("-"), key=len) if author else ""
    pick = [l for l in links if "-libro-" in l and (au in l.split("-libro-", 1)[1] if au else slug(title)[:15] in l)]
    if not pick:
        return res
    res["url"] = "https://www.lafeltrinelli.it" + pick[0]
    page = get(res["url"])
    m = re.search(r'"description"\s*:\s*"((?:[^"\\]|\\.)*)"', page)
    if m:
        res["trama"] = H.unescape(json.loads('"' + m.group(1) + '"')).strip()
        res["trama_breve"] = breve(res["trama"])
    L = lines(page)
    idx = [i for i, l in enumerate(L) if l == "Dettagli"]
    if idx:
        i = idx[-1]
        for j in range(i, min(i + 40, len(L) - 1)):
            if L[j].endswith(":") and L[j][:-1] in FIELDS:
                res[L[j][:-1]] = L[j + 1]
    return res

if __name__ == "__main__":
    rows = []
    for line in open(sys.argv[1], encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#"):
            parts = [p.strip() for p in line.split("|")] + ["", ""]
            rows.append(tuple(parts[:3]))
    with ThreadPoolExecutor(max_workers=6) as ex:
        out = list(ex.map(lookup, rows))
    json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for r in out:
        print(r["key"], "|", r.get("In commercio dal"), "|", r.get("Editore"), "|", r.get("Traduttore"),
              "|", r.get("Titolo originale"), "|", "trama" if r.get("trama") else "-", "|", r.get("url", "NESSUNA SCHEDA"))
