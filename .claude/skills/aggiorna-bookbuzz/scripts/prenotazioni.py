#!/usr/bin/env python3
"""Elenca i libri in prenotazione su laFeltrinelli, reparto per reparto.

Uso: python3 -I prenotazioni.py out.json ["Narrativa straniera" "Gialli, thriller, horror" ...]
Senza reparti usa: Narrativa straniera; Gialli, thriller, horror; Fantasy e fantascienza;
Narrativa erotica e rosa; Young Adult.
Per ogni libro: titolo, autore, editore, data ("Disponibile dal", AAAA-MM-GG), reparto.
Non distingue autori italiani, fumetti, classici e riedizioni: va filtrato a mano,
poi i candidati vanno passati a lf.py e, se serve, a sbn.js.
"""
import re, json, sys, html as H, urllib.request, urllib.parse

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/141"}
MESI = {m: i + 1 for i, m in enumerate("gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre".split())}
REPARTI = ["Narrativa straniera", "Gialli, thriller, horror", "Fantasy e fantascienza", "Narrativa erotica e rosa", "Young Adult"]

def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40) as r:
            return r.read().decode("utf-8", "ignore")
    except Exception:
        return ""

def lines(h):
    h = re.sub(r"(?is)<(script|style|noscript|svg).*?</\1>", "", h)
    h = re.sub(r"(?i)<(br|p|div|li|tr|h\d|span|dt|dd|a)[^>]*>", "\n", h)
    return [l.strip() for l in H.unescape(re.sub(r"<[^>]+>", "", h)).split("\n") if l.strip()]

def main():
    out_path, reparti = sys.argv[1], sys.argv[2:] or REPARTI
    out = {}
    for rep in reparti:
        for page in range(1, 60):
            u = ("https://www.lafeltrinelli.it/libri/in-prenotazione?useAsn=True&productsPerPage=25"
                 f"&page={page}&filterDepartment={urllib.parse.quote_plus(rep)}")
            L, prima, n = lines(get(u)), len(out), 0
            for i, l in enumerate(L):
                m = re.match(r"Disponibile dal (\d+) (\w+) (\d{4})", l)
                if not m:
                    continue
                j = i - 1
                while j > 0 and not re.match(r"^\d{4}$", L[j]):
                    j -= 1
                editore = L[j - 1].rstrip(",")
                if L[j - 3] == "di":
                    autore, titolo = L[j - 2], L[j - 4]
                elif L[j - 2].startswith("di "):
                    autore, titolo = L[j - 2][3:], L[j - 3]
                else:
                    autore, titolo = "", L[j - 2]
                data = f"{m.group(3)}-{MESI.get(m.group(2), 0):02d}-{int(m.group(1)):02d}"
                out[(titolo, autore)] = {"titolo": titolo, "autore": autore, "editore": editore, "data": data, "reparto": rep}
                n += 1
            print(rep, "pagina", page, n, file=sys.stderr)
            if n == 0 or len(out) == prima:
                break
    json.dump(list(out.values()), open(out_path, "w"), ensure_ascii=False, indent=1)
    print(len(out), "libri")

if __name__ == "__main__":
    main()
