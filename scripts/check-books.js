#!/usr/bin/env node
// Valida books.json contro lo schema descritto in CLAUDE.md.
const fs = require("fs");
const path = require("path");

const GENERI = ["Romanzo", "Romanzo storico", "Racconti", "Ibrido", "Memoir", "Giallo", "Thriller", "Horror", "Fantasy", "Fantascienza", "Romance", "Young adult"];
const SEGNALAZIONI = ["Esordio", "Prima edizione italiana", "Possibile riedizione", "Titolo italiano da confermare", "Data da confermare"];
const CAMPI = ["titolo", "autore", "editore", "mese", "giorno", "traduttore", "titolo_originale", "titolo_alternativo", "genere", "segnalazioni", "link", "fonti"];

const file = path.join(__dirname, "..", "books.json");
let books;
try { books = JSON.parse(fs.readFileSync(file, "utf8")); }
catch (e) { console.error("JSON non valido: " + e.message); process.exit(1); }
if (!Array.isArray(books)) { console.error("books.json deve essere un array"); process.exit(1); }

const errors = [];
const seen = new Map();
const key = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const strOrNull = v => v === null || (typeof v === "string" && v.trim() !== "");
const order = b => (b.mese || "9999-99") + "-" + String(b.giorno ?? 99).padStart(2, "0");

books.forEach((b, i) => {
  const where = `#${i} «${b && b.titolo}»`;
  const err = msg => errors.push(`${where}: ${msg}`);
  if (!b || typeof b !== "object") return err("non è un oggetto");
  for (const k of Object.keys(b)) if (!CAMPI.includes(k)) err(`campo sconosciuto "${k}"`);
  for (const k of CAMPI) if (!(k in b)) err(`manca il campo "${k}"`);
  if (typeof b.titolo !== "string" || !b.titolo.trim()) err("titolo mancante");
  for (const k of ["autore", "editore", "traduttore", "titolo_originale", "titolo_alternativo", "link"]) if (k in b && !strOrNull(b[k])) err(`${k} deve essere una stringa non vuota o null`);
  if (b.mese !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(b.mese)) err(`mese "${b.mese}" non nel formato AAAA-MM`);
  if (b.giorno !== null && !(Number.isInteger(b.giorno) && b.giorno >= 1 && b.giorno <= 31)) err(`giorno "${b.giorno}" non valido`);
  if (b.giorno !== null && b.mese === null) err("giorno senza mese");
  if (!GENERI.includes(b.genere)) err(`genere "${b.genere}" non ammesso`);
  if (!Array.isArray(b.segnalazioni)) err("segnalazioni deve essere un array");
  else b.segnalazioni.forEach(s => { if (!SEGNALAZIONI.includes(s)) err(`segnalazione "${s}" non ammessa`); });
  if (b.link !== null && typeof b.link === "string" && !/^https?:\/\//.test(b.link)) err("link non è un URL");
  if (!b.fonti || typeof b.fonti !== "object" || Array.isArray(b.fonti)) err("fonti deve essere un oggetto");
  for (const t of [b.titolo, b.titolo_alternativo].filter(Boolean)) {
    const k = key(b.autore) + "|" + key(t);
    if (seen.has(k) && seen.get(k) !== i) err(`duplicato di #${seen.get(k)}`);
    seen.set(k, i);
  }
  if (i > 0 && order(books[i - 1]) > order(b)) err("fuori ordine (mese, giorno, date null in fondo)");
});

const now = new Date();
const archive = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const archiveKey = archive.getFullYear() + "-" + String(archive.getMonth() + 1).padStart(2, "0");
books.forEach((b, i) => { if (b && b.mese && b.mese < archiveKey) errors.push(`#${i} «${b.titolo}»: mese ${b.mese} anteriore all'archivio (${archiveKey}), da cancellare`); });

if (errors.length) { console.error(errors.join("\n")); console.error(`\n${errors.length} errori su ${books.length} libri`); process.exit(1); }
console.log(`books.json valido: ${books.length} libri`);
