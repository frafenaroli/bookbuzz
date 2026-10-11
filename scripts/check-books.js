#!/usr/bin/env node
// Valida books.json contro lo schema descritto in CLAUDE.md.
const fs = require("fs");
const path = require("path");

const GENERI = ["Romanzo", "Romanzo storico", "Racconti", "Ibrido", "Memoir", "Giallo", "Thriller", "Horror", "Fantasy", "Fantascienza", "Romance", "Young adult"];
const SEGNALAZIONI = ["Esordio", "Prima edizione italiana", "Possibile riedizione", "Titolo italiano da confermare", "Data da confermare"];
const CAMPI = ["titolo", "autore", "editore", "mese", "giorno", "traduttore", "titolo_originale", "titolo_alternativo", "genere", "segnalazioni", "link", "trama", "fonti"];

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
  for (const k of ["autore", "editore", "traduttore", "titolo_originale", "titolo_alternativo", "link", "trama"]) if (k in b && !strOrNull(b[k])) err(`${k} deve essere una stringa non vuota o null`);
  if (b.mese !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(b.mese)) err(`mese "${b.mese}" non nel formato AAAA-MM`);
  if (b.giorno !== null && !(Number.isInteger(b.giorno) && b.giorno >= 1 && b.giorno <= 31)) err(`giorno "${b.giorno}" non valido`);
  if (b.giorno !== null && b.mese === null) err("giorno senza mese");
  if (!GENERI.includes(b.genere)) err(`genere "${b.genere}" non ammesso`);
  if (!Array.isArray(b.segnalazioni)) err("segnalazioni deve essere un array");
  else b.segnalazioni.forEach(s => { if (!SEGNALAZIONI.includes(s)) err(`segnalazione "${s}" non ammessa`); });
  if (b.link !== null && typeof b.link === "string" && !/^https?:\/\//.test(b.link)) err("link non è un URL");
  if (typeof b.trama === "string" && b.trama.length > 600) err("trama troppo lunga (massimo 600 caratteri)");
  if (b.trama && !(b.fonti && b.fonti.trama)) err("trama senza fonti.trama");
  if (!b.fonti || typeof b.fonti !== "object" || Array.isArray(b.fonti)) err("fonti deve essere un oggetto");
  for (const t of [b.titolo, b.titolo_alternativo].filter(Boolean)) {
    const k = key(b.autore) + "|" + key(t);
    if (seen.has(k) && seen.get(k) !== i) err(`duplicato di #${seen.get(k)}`);
    seen.set(k, i);
  }
  if (i > 0 && order(books[i - 1]) > order(b)) err("fuori ordine (mese, giorno, date null in fondo)");
});

// Uscite più vecchie di 30 giorni rispetto a oggi: il sito non le mostra più, vanno cancellate.
// Senza giorno, la data stimata è l'ultimo giorno del mese (come nel sito).
const today = new Date(); today.setHours(0, 0, 0, 0);
const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - 30);
books.forEach((b, i) => {
  if (!b || !b.mese || !/^\d{4}-\d{2}$/.test(b.mese)) return;
  const [y, m] = b.mese.split("-").map(Number);
  const d = new Date(y, m - 1, b.giorno || new Date(y, m, 0).getDate());
  if (d < cutoff) errors.push(`#${i} «${b.titolo}»: uscito più di 30 giorni fa (${d.toISOString().slice(0, 10)}), da cancellare`);
});

if (errors.length) { console.error(errors.join("\n")); console.error(`\n${errors.length} errori su ${books.length} libri`); process.exit(1); }
console.log(`books.json valido: ${books.length} libri`);
