#!/usr/bin/env python3
"""Testo leggibile da un file HTML scaricato con curl. Uso: python3 -I txt.py pagina.html"""
import sys, re, html as H
h = open(sys.argv[1], encoding="utf-8", errors="ignore").read()
h = re.sub(r"(?is)<(script|style|noscript|svg).*?</\1>", "", h)
h = re.sub(r"(?i)<(br|p|div|li|tr|h\d)[^>]*>", "\n", h)
t = H.unescape(re.sub(r"<[^>]+>", "", h))
print(re.sub(r"\n\s*\n+", "\n", re.sub(r"[ \t]+", " ", t)))
