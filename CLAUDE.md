# BookBuzz

Sito statico che elenca la narrativa straniera tradotta in uscita in Italia. Nessun build: `index.html`, `bookbuzz.css`, `app.js` e i dati in `books.json` ed `editori.json`, caricati dal browser con `fetch` (serve un server HTTP, anche solo `python3 -m http.server`).

Il catalogo si aggiorna con la skill `aggiorna-bookbuzz` (in `.claude/skills/aggiorna-bookbuzz/`, con gli script di ricerca), che modifica solo `books.json`.

## Perimetro

- Narrativa straniera tradotta in italiano: romanzi, racconti, memoir, libri ibridi, narrativa di genere.
- Esclusi: autori italiani, saggistica pura, varia, manualistica, fumetti, libri per l'infanzia sotto la fascia young adult.
- Solo prime edizioni italiane. Riedizioni certe escluse; dubbi inclusi con la segnalazione "Possibile riedizione".
- Finestra corrente: da settembre a dicembre 2026. Sono ammessi i libri annunciati come in arrivo con mese ancora ignoto (`mese: null`).
- La finestra si può allargare: il sito ricava schede dei mesi e sottotitolo dai mesi presenti nei dati, senza modifiche al codice.

## Uscite passate

- Il taglio è la data di consultazione, calcolata dal browser. "Tutti" e le schede dei mesi mostrano solo i libri che escono da oggi in poi (più quelli senza mese). I libri usciti nei 30 giorni precedenti finiscono nella scheda "Recenti"; quelli più vecchi non vengono mostrati.
- Per un libro senza giorno la data stimata è l'ultimo giorno del mese.
- A ogni aggiornamento, prima di aggiungere titoli, cancella da `books.json` i libri usciti più di 30 giorni prima della data dell'aggiornamento. I libri con `mese: null` restano. Il validatore li segnala.
- Non aggiungere libri usciti più di 30 giorni prima.
- `?oggi=AAAA-MM-GG` in fondo all'indirizzo del sito simula un'altra data (va bene anche `?oggi=AAAA-MM`, che vale il primo del mese).

## Schema di `books.json`

Un array di oggetti, ordinato per `mese`, poi `giorno`, con le date `null` in fondo. Un campo non confermato da una fonte resta `null`.

| Campo | Tipo | Note |
|---|---|---|
| `titolo` | stringa | Titolo italiano. Obbligatorio. |
| `autore` | stringa | Più autori separati da virgola. |
| `editore` | stringa | Nome del marchio, con la collana tra parentesi se utile: `Mondadori (Oscar Vault)`. |
| `mese` | stringa `"AAAA-MM"` o `null` | Mese di uscita. |
| `giorno` | intero 1-31 o `null` | Solo se `mese` è valorizzato. |
| `traduttore` | stringa o `null` | Grafia della fonte. Più nomi separati da virgola. |
| `titolo_originale` | stringa o `null` | Nella lingua originale. |
| `titolo_alternativo` | stringa o `null` | Altro titolo italiano circolato tra le fonti. |
| `genere` | stringa | Uno dei valori ammessi qui sotto. |
| `segnalazioni` | array di stringhe | Valori ammessi qui sotto, anche vuoto. |
| `link` | stringa (URL) o `null` | Preferibilmente la scheda sul sito dell'editore. |
| `trama` | stringa o `null` | Due o tre frasi sul libro, al massimo 600 caratteri, mostrate nella scheda. Testo dell'editore accorciato se c'è, altrimenti riscritto dalle fonti; mai inventato. Fonte in `fonti.trama`. |
| `fonti` | oggetto | Una chiave per campo (`data`, `traduttore`, `titolo_originale`, …) con URL o nota sulla fonte, per esempio `"solo estratto"` o i canali provati senza esito. |

Generi ammessi: `Narrativa`, `Romanzo storico`, `Racconti`, `Ibrido`, `Memoir`, `Giallo`, `Thriller`, `Horror`, `Fantasy`, `Fantascienza`, `Romance`, `Young adult`. Un genere nuovo va aggiunto anche a `ICONS` in `app.js` e alle classi `.g-*` in `bookbuzz.css`, altrimenti appare con l'icona e il colore di Narrativa.

Segnalazioni ammesse: `Esordio`, `Prima edizione italiana`, `Possibile riedizione`, `Titolo italiano da confermare`, `Data da confermare`. Le prime due alimentano il filtro "In evidenza" (insieme a "Indipendenti", che viene da `editori.json`), le altre compaiono come nota nella scheda del libro.

## Editori indipendenti: `editori.json`

Un oggetto con una chiave per marchio (il nome come in `editore`, senza la collana tra parentesi):

```json
"Neri Pozza": { "indipendente": false, "gruppo": "Athesis", "nota": "fonte o motivo" }
```

- `indipendente: true` se il marchio non è controllato da un grande gruppo editoriale o mediatico (Mondadori, GeMS/Messaggerie, Feltrinelli, Giunti, De Agostini, HarperCollins, Athesis…). Le quote di minoranza non contano. I marchi di un editore indipendente (Ne/oN di e/o, TimeCrime di Fanucci) sono indipendenti.
- `false` con il `gruppo` di appartenenza; `null` se la proprietà non è verificata.
- Il sito aggiunge in automatico il tag "Indipendente", e il filtro "In evidenza > Indipendenti", ai libri dei marchi con `true`. Non va messo tra le `segnalazioni`.
- Ogni editore presente in `books.json` deve stare in `editori.json`: il validatore lo controlla.

I libri importati dal prototipo hanno in `fonti` la sola chiave `import`, con il link da cui provenivano tutti i campi. Quando un campo viene verificato o corretto, aggiungi la chiave specifica.

## Esempio

```json
{
  "titolo": "Le cose che non diciamo",
  "autore": "Elizabeth Strout",
  "editore": "Einaudi",
  "mese": "2026-10",
  "giorno": 13,
  "traduttore": "Susanna Basso",
  "titolo_originale": "The Things We Never Say",
  "titolo_alternativo": null,
  "genere": "Narrativa",
  "segnalazioni": [],
  "link": "https://www.illibraio.it/news/narrativa/libri-da-leggere-autunno-2026-1502831/",
  "trama": "Artie Dam è l'insegnante che tutti vorrebbero: accogliente, gioviale, devoto ai suoi ragazzi. Eppure dietro la sua vita si nasconde un'ombra insondabile.",
  "fonti": { "data": "https://...", "traduttore": "https://...", "trama": "https://... (testo dell'editore, accorciato)" }
}
```

## Validazione

Dopo ogni modifica a `books.json`:

```sh
node scripts/check-books.js
```
