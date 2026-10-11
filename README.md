# bookbuzz
Tracker di libri e memoir di narrativa straniera in arrivo in Italia.

Sito statico, senza build: `index.html`, `bookbuzz.css`, `app.js`, dati in `books.json`.

Per provarlo in locale (serve un server, `fetch` non funziona da `file://`):

```sh
python3 -m http.server
```

Pubblicazione: GitHub Pages dalla radice del branch principale.

Schema dei dati, perimetro e regole di aggiornamento: [CLAUDE.md](CLAUDE.md). Validazione: `node scripts/check-books.js`.
