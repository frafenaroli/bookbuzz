---
name: aggiorna-bookbuzz
description: Procedura per aggiornare books.json di BookBuzz con le nuove uscite di narrativa straniera tradotta in italiano, con traduttore, titolo originale e una breve trama. Usala ogni volta che si parla di aggiornare il catalogo, aggiungere libri, controllare le prossime uscite, verificare traduttori, titoli originali, trame o riedizioni, allargare la finestra temporale, o quando si chiede "cosa esce" per un editore o un mese, anche se la parola "skill" o "aggiorna" non compare.
---

# Aggiorna BookBuzz

Obiettivo: portare in `books.json` (e, per gli editori nuovi, in `editori.json`) le nuove uscite che rientrano nel perimetro definito in `CLAUDE.md`, con ogni campo tracciato su una fonte. Leggi `CLAUDE.md` prima di iniziare: perimetro, schema, valori ammessi e regola sulle uscite passate stanno lì.

Principio guida: un campo vuoto e onesto vale più di un campo pieno e stimato. Se un dato non è confermato da una fonte, resta `null`.

## 0. Strumenti e regole di velocità

Gli script stanno in `scripts/` accanto a questo file. Lavora in una cartella temporanea e passa i percorsi come argomenti.

| Script | A cosa serve | Tempi indicativi |
|---|---|---|
| `lf.py candidati.txt out.json` | Cerca in parallelo su laFeltrinelli: data ("In commercio dal"), traduttore, titolo originale, EAN, trama dell'editore e `trama_breve` già accorciata. Una riga per libro: `chiave\|titolo\|autore`. | ~10 s ogni 30 libri |
| `sbn.js "autore titolo"…` | Controllo riedizioni su OPAC SBN (luoghi, anni, titolo dell'opera). Va lanciato con `PW=$(npm root -g)/playwright node sbn.js …`. | ~15 s a ricerca |
| `render.js URL…` | Testo delle pagine costruite via JavaScript (siti degli editori). Stesso `PW=` di sopra. | ~5 s a pagina |
| `txt.py pagina.html` | Testo leggibile da un HTML scaricato con `curl`. | immediato |

Regole:
- Scarica le pagine con `curl` o `render.js` e leggile tu; non usare la ricerca web per i dati, perché restituisce riassunti generati e spesso sbagliati. Usala solo per trovare un indirizzo.
- Raggruppa: prima raccogli tutti i candidati, poi una sola passata di `lf.py` su tutti, poi una sola passata di `sbn.js` sui dubbi.
- Controlla sempre che la scheda trovata da `lf.py` sia il libro giusto: confronta il titolo con l'indirizzo e la data con l'anno. Con titoli generici (*Medusa*, *La voce*) o autori con molti libri lo script può prendere un'edizione vecchia o un altro titolo.
- Le pagine "in prenotazione" dei librai e la ricerca su IBS non servono: la prima non filtra per editore, la seconda risponde 429.

## 1. Raccolta dei candidati

Percorri i canali in quest'ordine. Annota per ogni candidato la fonte da cui viene.

**Liste per editore** (le più complete, con date e traduttori):
- Nerdgames, articoli "[editore]: le novità di [mese] [anno]". Trovati finora: e/o, Neri Pozza (ottobre e novembre), Guanda. Cerca con `https://www.nerdgames.it/?s=novità+[mese]+[anno]`.
- i-LIBRI, "Libri [editore] in uscita da … a …" (Longanesi).

**Pagine degli editori**, da leggere con `render.js` salvo dove indicato:

| Editore | Pagina |
|---|---|
| Adelphi | `https://www.adelphi.it/catalogo/anteprime` |
| Iperborea | `https://iperborea.com/`, sezioni "Prossime uscite" (Iperborei e Corvi) |
| Sellerio | `https://sellerio.it/it/novita/?per=AAAA-M` (un mese per pagina) |
| Einaudi | `https://www.einaudi.it/libri-in-uscita/` |
| Feltrinelli e Gramma | `https://www.feltrinellieditore.it/libri/prossimeuscite/` |
| Fazi | `https://fazieditore.it/catalogo/anteprime` |
| L'orma | `https://www.lormaeditore.it/catalogo/anteprime` |
| Crocetti | `https://www.crocettieditore.com/catalogo/anteprime` (a ottobre 2026 irraggiungibile dalla rete della sessione) |
| NN | `https://www.nneditore.it/catalogo/novita` |
| Voland | `https://www.voland.it/catalogo/novita` |
| Mondadori | `https://www.mondadori.it/libri-prossime-uscite/` |
| Oscar (Vault, Fantastica, Dark Romance) | `https://www.mondadori.it/oscar/in-arrivo/` |
| Fanucci | `https://www.fanucci.it/collections/novita` (lenta: se va in timeout, cerca i titoli con `lf.py`) |

Non hanno una pagina di prossime uscite leggibile: SUR, add, La Nuova Frontiera, Atlantide, 66thand2nd, Armenia, Triskell, Sperling & Kupfer. marcos y marcos, DOA e Always Publishing a ottobre 2026 non rispondevano. Per questi editori usa le testate qui sotto, poi `lf.py`.

**Testate di settore**:
- ilLibraio.it, speciale stagionale (`/news/narrativa/libri-da-leggere-[stagione]-[anno]-…`). Il testo è lungo: scaricalo con `curl` e filtra i paragrafi che contengono "traduzione" o un editore noto. Appartiene al gruppo GeMS (Longanesi, Guanda, Garzanti, Salani, Nord, Ponte alle Grazie), che è sovrarappresentato: bilancialo con gli altri canali.
- Libreriamo, rubrica settimanale "5 libri di narrativa straniera in uscita dal … al …" e lista mensile "10 libri in uscita a [mese]". Gli indirizzi si trovano con `https://libreriamo.it/?s=narrativa+straniera+in+uscita` o nel feed `https://libreriamo.it/feed/`.

**Librai online**: solo laFeltrinelli tramite `lf.py`, per incrociare date, traduttori, titoli originali e trame. Non vanno usati come `link`.

## 2. Filtro di perimetro

Per ogni candidato controlla, nell'ordine:
1. È narrativa straniera tradotta? Memoir e ibridi sì; saggistica pura, varia, poesia, fumetti e libri per ragazzi sotto i 12 anni no. In caso di dubbio leggi la trama: un libro "sulla scrittura" o "sulla lettura" è quasi sempre un saggio.
2. Il libro è uscito al massimo 30 giorni prima di oggi, o esce entro la fine della finestra, oppure il mese è ignoto ma il libro è annunciato come in arrivo?
3. È una prima edizione italiana? Vedi il passo 3.

## 3. Verifica delle riedizioni

È il passaggio in cui si sbaglia più spesso. Indizi da cercare sempre:
- recensioni dei lettori o presenza in classifica prima della data di uscita;
- colophon o estratto dell'editore con una "Prima edizione" anteriore;
- stessa traduttrice o stesso traduttore di un'edizione italiana precedente;
- diciture "nuova edizione", "edizione illustrata", "deluxe", "ediz. integrale", collane tascabili, "torna in libreria", "torna in Italia";
- un libro uscito all'estero da più di dieci anni;
- editori il cui catalogo di novità è composto in gran parte da ristampe.

Passa tutti i dubbi a `sbn.js` in una sola volta, cercando autore più titolo originale e autore più titolo italiano. Un luogo italiano (Milano, Roma, Torino…) con un anno precedente vuol dire riedizione.

Esiti:
- riedizione certa: escludi e annotalo nel report;
- dubbio: includi con la segnalazione "Possibile riedizione";
- prima traduzione italiana dichiarata dalla fonte ("inedito in Italia", "per la prima volta in Italia"): segnalazione "Prima edizione italiana".

## 4. Arricchimento dei campi

Per ogni libro tenuto, partendo dall'uscita di `lf.py`:
- **Traduttore**: scheda dell'editore, lista dell'editore o laFeltrinelli. Riporta la grafia della fonte; se due fonti scrivono il nome in modo diverso, scegli quella dell'editore e annota l'altra in `fonti.traduttore`. Non dedurlo mai da edizioni precedenti dello stesso autore.
- **Data**: lista o scheda dell'editore, poi laFeltrinelli. Se le fonti divergono, tieni quella dell'editore e aggiungi "Data da confermare", scrivendo le due date in `fonti.data`.
- **Genere**: uno solo, tra i valori ammessi. Se il libro è a metà tra memoir e romanzo, usa "Ibrido". Per la narrativa senza un genere più preciso usa "Narrativa".
- **Link**: la scheda o la pagina dell'editore quando esiste, altrimenti l'articolo che ha segnalato il libro.
- **Editore nuovo**: se il marchio non è ancora in `editori.json`, aggiungilo con `indipendente` (`true`, `false` con il `gruppo`, oppure `null` se non trovi conferme) e una `nota` con la fonte. Criterio e gruppi principali sono in `CLAUDE.md`. Cerca la proprietà sul sito dell'editore (pagina "chi siamo") o nella stampa economica; non fidarti della memoria.
- **Trama**: vedi sotto.
- **Titolo originale**: vedi sotto.

### Trama

Due o tre frasi, al massimo 600 caratteri, che dicano di cosa parla il libro.
- Se c'è il testo dell'editore (`trama_breve` di `lf.py`, la scheda dell'editore o le righe "L'OPERA" delle liste Nerdgames), usalo così com'è. Controlla però che non cominci a metà di un discorso, che non contenga errori di estrazione (sillabe spezzate, legature perse come "!usso" per "flusso") e che non sia solo uno slogan pubblicitario o una citazione: in questi casi correggilo o riscrivilo.
- Se c'è solo un articolo (ilLibraio, Libreriamo), riscrivi tu con parole tue quello che l'articolo dice della trama, senza giudizi critici e senza aggiungere nulla che la fonte non dica.
- Il testo dell'editore in inglese va riscritto in italiano.
- In `fonti.trama` scrivi l'indirizzo e come l'hai trattato: "testo dell'editore, accorciato", "corretto a mano" oppure "rielaborato".
- Se non trovi nessuna fonte, `trama` resta `null`.

### Ricerca del titolo originale

Il titolo originale raramente compare negli articoli di presentazione, quindi va cercato attivamente. Percorri i canali in quest'ordine e fermati appena trovi una conferma solida. Prima di lasciare il campo `null` devi averne provati almeno quattro; se il tempo non basta, prova almeno i primi tre e scrivi in `fonti.titolo_originale` quali hai provato.

1. **laFeltrinelli**, già nell'uscita di `lf.py` ("Titolo originale").
2. **OPAC SBN**: il campo "Titolo dell'opera" nei risultati di `sbn.js` (SBN omette l'articolo iniziale: "chat du jardinier" sta per "Le Chat du jardinier").
3. **Materiali dell'editore italiano**: scheda, estratto PDF, pagina del copyright, comunicato stampa.
4. **Sito dell'autore** o pagina dell'editore originale.
5. **Agenzie letterarie e rights guide**, enti di promozione della traduzione del paese d'origine, stampa di settore sui diritti (Publishers Weekly, The Bookseller, Livres Hebdo, Börsenblatt).
6. **Ricerca nella lingua originale**: autore più elementi della trama, oppure la bibliografia dell'autore su Wikipedia in quella lingua.
7. **Goodreads o StoryGraph**: solo come pista, da confermare altrove.

Criteri per accettare un titolo:
- l'autore coincide e l'anno di uscita originale è compatibile con la traduzione;
- trama, ambientazione o protagonisti coincidono con la presentazione italiana. Se il titolo viene solo da questa corrispondenza, scrivilo in `fonti.titolo_originale`;
- per un originale non inglese, il titolo va registrato nella lingua originale. Un titolo inglese di una traduzione intermedia non va usato;
- per le lingue con alfabeto non latino, usa la forma romanizzata adottata dall'editore o dall'agenzia e annota la grafia originale in `fonti`;
- se titolo italiano e originale coincidono, serve comunque una conferma: un titolo inglese conservato in italiano non basta a dimostrarlo.

### Recupero dei campi mancanti

A ogni aggiornamento, dopo i nuovi titoli, passa a `lf.py` anche i libri già presenti con `traduttore`, `titolo_originale`, `mese` o `trama` a `null`. Man mano che l'uscita si avvicina, le schede si completano.

## 5. Scrittura in `books.json`

- Leggi il file esistente prima di modificarlo.
- Cancella prima i libri usciti più di 30 giorni prima di oggi (regola in `CLAUDE.md`; per un libro senza giorno conta l'ultimo giorno del mese).
- Chiave per i duplicati: autore più titolo, normalizzati (minuscole, senza accenti né punteggiatura). Controlla anche `titolo_alternativo`.
- Libro già presente: aggiorna solo i campi che erano `null` o che una fonte più autorevole corregge. Non cancellare dati confermati. Se cambi un valore, aggiorna la fonte corrispondente in `fonti`. Quando si conferma il titolo italiano di un libro segnato "Titolo italiano da confermare", sposta il vecchio titolo in `titolo_alternativo` e togli la segnalazione.
- Discordanze tra fonti: non sceglierne una in silenzio. Usa `titolo_alternativo` o una segnalazione "da confermare".
- Mantieni l'ordine dei campi dello schema e l'ordinamento del file per mese, poi giorno, con le date `null` in fondo.
- Fai le modifiche con uno script che legge e riscrive il JSON, non a mano.
- Valida con `node scripts/check-books.js` prima di chiudere: controlla anche che ogni editore sia in `editori.json`.

## 6. Report finale

Chiudi sempre con un resoconto breve, diviso in quattro parti:
- **Aggiunti**: titolo, autore, editore, mese.
- **Aggiornati**: quali campi sono stati completati o corretti, trame comprese.
- **Esclusi**: titolo e motivo (riedizione, saggistica, fuori finestra, italiano).
- **Cancellati**: libri tolti perché usciti più di 30 giorni prima.
- **Ancora aperti**: libri con traduttore, titolo originale, mese o trama ancora `null`, ed editori per cui non è stato possibile raggiungere le prossime uscite.
