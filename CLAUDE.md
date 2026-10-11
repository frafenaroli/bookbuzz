# BookBuzz

Sito statico che elenca la narrativa straniera tradotta in uscita in Italia. Nessun build: `index.html`, `bookbuzz.css`, `app.js` e i dati in `books.json`, caricati dal browser con `fetch` (serve un server HTTP, anche solo `python3 -m http.server`).

Il catalogo si aggiorna con la skill `aggiorna-bookbuzz`, che modifica solo `books.json`.

## Perimetro

- Narrativa straniera tradotta in italiano: romanzi, racconti, memoir, libri ibridi, narrativa di genere.
- Esclusi: autori italiani, saggistica pura, varia, manualistica, fumetti, libri per l'infanzia sotto la fascia young adult.
- Solo prime edizioni italiane. Riedizioni certe escluse; dubbi inclusi con la segnalazione "Possibile riedizione".
- Finestra corrente: da settembre a dicembre 2026. Sono ammessi i libri annunciati come in arrivo con mese ancora ignoto (`mese: null`).
- La finestra si può allargare: il sito ricava schede dei mesi e sottotitolo dai mesi presenti nei dati, senza modifiche al codice.

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
| `fonti` | oggetto | Una chiave per campo (`data`, `traduttore`, `titolo_originale`, …) con URL o nota sulla fonte, per esempio `"solo estratto"` o i canali provati senza esito. |

Generi ammessi: `Romanzo`, `Romanzo storico`, `Racconti`, `Ibrido`, `Memoir`, `Giallo`, `Thriller`, `Horror`, `Fantasy`, `Fantascienza`, `Romance`, `Young adult`. Un genere nuovo va aggiunto anche a `ICONS` in `app.js` e alle classi `.g-*` in `bookbuzz.css`, altrimenti appare con l'icona e il colore di Romanzo.

Segnalazioni ammesse: `Esordio`, `Prima edizione italiana`, `Possibile riedizione`, `Titolo italiano da confermare`, `Data da confermare`. Le prime due alimentano il filtro "In evidenza", le altre compaiono come nota nella scheda del libro.

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
  "genere": "Romanzo",
  "segnalazioni": [],
  "link": "https://www.illibraio.it/news/narrativa/libri-da-leggere-autunno-2026-1502831/",
  "fonti": { "data": "https://...", "traduttore": "https://..." }
}
```

## Validazione

Dopo ogni modifica a `books.json`:

```sh
node scripts/check-books.js
```
