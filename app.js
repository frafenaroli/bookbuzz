(function(){
"use strict";

var PAGE = 20;
var MONTH_NAMES = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
var MONTH_ABBR = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
var EVID = [["esordio","Esordi"],["prima","Prime edizioni italiane"]];
var EVID_TAG = {esordio:"Esordio",prima:"Prima edizione italiana"};
var SORT_LABEL = {date:"data",title:"titolo",author:"autore",publisher:"editore"};

/* ---------- testo ---------- */
var FOLD = {"ø":"o","æ":"ae","œ":"oe","ß":"ss","ł":"l","đ":"d","ð":"d","þ":"th","ı":"i","&":"e"};
function foldChar(c){
  var l = c.toLowerCase();
  if (FOLD[l]) return FOLD[l];
  var n = l.normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (!n) return "";
  return /[\p{L}\p{N}]/u.test(n) ? n : " ";
}
function norm(s){
  var o = "";
  for (var c of String(s == null ? "" : s)) o += foldChar(c);
  return o.replace(/\s+/g, " ").trim();
}
function clean(v){ return (typeof v === "string" && v.trim()) ? v.trim() : null; }
function cap(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function plural(n, one, many){ return n === 1 ? "1 " + one : n + " " + many; }
function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}

function lev(a, b, max){
  if (Math.abs(a.length - b.length) > max) return max + 1;
  var prev = [];
  for (var j = 0; j <= b.length; j++) prev.push(j);
  for (var i = 1; i <= a.length; i++){
    var cur = [i], rowMin = i;
    for (var k = 1; k <= b.length; k++){
      var c = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1));
      cur.push(c);
      if (c < rowMin) rowMin = c;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/* ---------- icone Lucide per genere (viewBox 24) ---------- */
var BOOK_OPEN = ["M12 7v14", "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"];
var ICONS = {
  "romanzo": BOOK_OPEN,
  "romanzo-storico": ["M5 22h14", "M5 2h14", "M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22", "M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"],
  "racconti": ["M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z", "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65", "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"],
  "ibrido": ["M2 9a7 7 0 1 0 14 0a7 7 0 1 0-14 0", "M8 15a7 7 0 1 0 14 0a7 7 0 1 0-14 0"],
  "memoir": ["M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z", "M16 8 2 22", "M17.5 15H9"],
  "giallo": ["M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z", "M16.5 7.5h.01"],
  "thriller": ["M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"],
  "horror": ["M9 10h.01", "M15 10h.01", "M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"],
  "fantasy": ["M15 4V2", "M15 16v-2", "M8 9h2", "M20 9h2", "M17.8 11.8 19 13", "M15 9h.01", "M17.8 6.2 19 5", "m3 21 9-9", "M12.2 6.2 11 5"],
  "fantascienza": ["M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z", "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z", "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0", "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"],
  "romance": ["M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"],
  "young-adult": ["M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z", "M8 10h8", "M8 18h8", "M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6", "M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"]
};
function gslug(g){ return norm(g).replace(/ /g, "-"); }
function svgIcon(g, size, sw, cls){
  var paths = (ICONS[gslug(g)] || BOOK_OPEN).map(function(d){ return '<path d="' + d + '"></path>'; }).join("");
  return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
}
var X_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
var CHECK_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
var CHEV_ICON = '<svg class="bb-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>';

/* ---------- dati ---------- */
var BOOKS = [], MONTHS = [], ALL_GENRES = [], ALL_PUBS = [], ONE_YEAR = true;

/* Mesi passati: il mese precedente va in archivio, quelli ancora prima non si mostrano.
   ?oggi=AAAA-MM nell'indirizzo simula un'altra data, per provare il passaggio di mese. */
function ym(d){ return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
var NOW = (function(){
  var m = /[?&]oggi=(\d{4}-\d{2})/.exec(location.search);
  return m ? m[1] : ym(new Date());
})();
var ARCHIVE = (function(){ var d = new Date(+NOW.slice(0, 4), +NOW.slice(5) - 2, 1); return ym(d); })();
var HAS_ARCHIVE = false;

function monthKey(v){
  if (typeof v !== "string") return null;
  var m = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  var n = +m[2];
  return (n >= 1 && n <= 12) ? v.trim() : null;
}
function mIdx(key){ return +key.slice(5) - 1; }
function mYear(key){ return key.slice(0, 4); }
function monthLabel(key, withYear){ var s = cap(MONTH_NAMES[mIdx(key)]); return withYear || !ONE_YEAR ? s + " " + mYear(key) : s; }

/* Normalizzazione dei dati in ingresso: stringhe vuote diventano null, mese e giorno non validi vengono scartati */
function prepare(raw){
  BOOKS = raw.filter(function(r){ var m = monthKey(r.mese); return !m || m >= ARCHIVE; }).map(function(r, i){
    var f = Array.isArray(r.segnalazioni) ? r.segnalazioni : [];
    var m = monthKey(r.mese);
    var d = (m && Number.isInteger(r.giorno) && r.giorno >= 1 && r.giorno <= 31) ? r.giorno : null;
    var b = {
      id: i,
      t: clean(r.titolo) || "Senza titolo",
      a: clean(r.autore) || "",
      p: clean(r.editore) || "",
      tr: clean(r.traduttore), o: clean(r.titolo_originale), alt: clean(r.titolo_alternativo),
      k: clean(r.genere) || "Narrativa",
      m: m, d: d, u: clean(r.link), arch: m === ARCHIVE,
      ev: [], notes: []
    };
    f.forEach(function(x){
      if (typeof x !== "string") return;
      if (/esordio/i.test(x)) b.ev.push("esordio");
      if (/prima edizione italiana/i.test(x)) b.ev.push("prima");
      if (/titolo italiano da confermare/i.test(x)) b.notes.push("Il titolo italiano potrebbe cambiare prima dell’uscita.");
      if (/data da confermare/i.test(x)) b.notes.push("La data di uscita è indicativa.");
      if (/riedizione/i.test(x)) b.notes.push("Potrebbe trattarsi di una riedizione.");
    });
    if (b.o && norm(b.o) === norm(b.t)) b.oSame = true;
    b.hay = norm([b.t, b.alt, b.a, b.p, b.tr, b.o, b.k].filter(Boolean).join(" "));
    b.compact = b.hay.replace(/ /g, "");
    b.words = b.hay.split(" ");
    b.nO = b.o ? norm(b.o) : "";
    b.nAlt = b.alt ? norm(b.alt) : "";
    return b;
  });
  MONTHS = Array.from(new Set(BOOKS.map(function(b){ return b.arch ? null : b.m; }).filter(Boolean))).sort();
  HAS_ARCHIVE = BOOKS.some(function(b){ return b.arch; });
  ONE_YEAR = new Set(MONTHS.concat(HAS_ARCHIVE ? [ARCHIVE] : []).map(mYear)).size <= 1;
  ALL_GENRES = Array.from(new Set(BOOKS.map(function(b){ return b.k; }))).sort(function(x, y){ return x.localeCompare(y, "it"); });
  ALL_PUBS = Array.from(new Set(BOOKS.map(function(b){ return b.p; }).filter(Boolean)));
}

function tokenize(q){
  var t = norm(q).split(" ").filter(Boolean);
  var long = t.filter(function(x){ return x.length > 1; });
  return long.length ? long : t;
}
function strictTok(b, t){ return b.hay.indexOf(t) > -1 || (t.length >= 4 && b.compact.indexOf(t) > -1); }
function fuzzyTok(b, t){
  if (strictTok(b, t)) return true;
  if (t.length < 4) return false;
  var k = t.length >= 7 ? 2 : 1;
  return b.words.some(function(w){
    return lev(t, w, k) <= k || (w.length > t.length && lev(t, w.slice(0, t.length), k) <= k);
  });
}

/* Evidenzia le parole trovate, mappando il testo normalizzato sulla stringa originale */
function highlight(s, toks){
  if (!toks.length) return esc(s);
  var o = "", map = [], pos = 0;
  for (var c of s){
    var f = foldChar(c);
    for (var x = 0; x < f.length; x++){ o += f[x]; map.push(pos); }
    pos += c.length;
  }
  var mark = new Array(s.length).fill(false);
  toks.forEach(function(tk){
    var i = o.indexOf(tk);
    while (i > -1){
      for (var j = i; j < i + tk.length; j++){ var p = map[j]; mark[p] = true; if (s.charCodeAt(p) >= 0xD800 && s.charCodeAt(p) <= 0xDBFF) mark[p + 1] = true; }
      i = o.indexOf(tk, i + tk.length);
    }
  });
  var out = "", cur = "", curHit = null;
  function flush(){ if (cur) out += curHit ? '<mark class="bb-hl">' + esc(cur) + '</mark>' : esc(cur); }
  for (var k = 0; k < s.length; k++){
    var h = mark[k];
    if (curHit === null) curHit = h;
    if (h !== curHit){ flush(); cur = ""; curHit = h; }
    cur += s[k];
  }
  flush();
  return out;
}

function tabKey(b){ return b.arch ? "arch" : (b.m || "na"); }
function tabLabel(key){ return key === "all" ? "Tutti" : key === "na" ? "Da annunciare" : key === "arch" ? "Archivio · " + monthLabel(ARCHIVE) : monthLabel(key); }
function dateKey(b){ var i = b.m ? MONTHS.indexOf(b.m) : MONTHS.length; return i * 100 + (b.d == null ? 60 : b.d); }
var CMP = {
  date: function(x, y){ return dateKey(x) - dateKey(y) || x.t.localeCompare(y.t, "it"); },
  title: function(x, y){ return x.t.localeCompare(y.t, "it"); },
  author: function(x, y){ return x.a.localeCompare(y.a, "it") || x.t.localeCompare(y.t, "it"); },
  publisher: function(x, y){ return x.p.localeCompare(y.p, "it") || dateKey(x) - dateKey(y); }
};
function dateFull(b){
  if (b.m && b.d) return b.d + " " + MONTH_NAMES[mIdx(b.m)] + " " + mYear(b.m);
  if (b.m) return monthLabel(b.m, true);
  return "Da annunciare";
}
function genreTag(g){ return '<span class="bb-gtag g-' + gslug(g) + '">' + svgIcon(g, 13, 2.2) + esc(g) + '</span>'; }
function evidTags(b){ return b.ev.map(function(e){ return '<span class="bb-tagl">' + EVID_TAG[e] + '</span>'; }).join(""); }

/* ---------- stato ---------- */
var THEMES = ["auto","light","dark"];
var theme = "auto";
try { var savedTheme = localStorage.getItem("bb-theme"); if (THEMES.indexOf(savedTheme) > -1) theme = savedTheme; } catch (e) {}
function paintTheme(){
  document.querySelectorAll(".bb-theme [data-theme]").forEach(function(el){ el.setAttribute("aria-pressed", String(el.dataset.theme === theme)); });
  root.className = root.className.replace(/\bt-\w+/, "t-" + theme);
}

var S = { q: "", mese: "all", genere: [], editore: [], evid: [], sort: "date", limit: PAGE, sheet: false, detail: null, pubQ: "", pubAll: false };
var isM = false;
var results = [];
var actions = {};
var $ = function(id){ return document.getElementById(id); };
var root = $("bb");

function set(patch){ Object.assign(S, patch); render(); }
function toggle(key, val){
  var cur = S[key];
  var patch = { limit: PAGE };
  patch[key] = cur.indexOf(val) > -1 ? cur.filter(function(x){ return x !== val; }) : cur.concat([val]);
  set(patch);
}
function resetFilters(){ set({ mese: "all", genere: [], editore: [], evid: [], limit: PAGE, pubQ: "", pubAll: false }); }

/* Ogni pulsante generato porta data-act e, se serve, data-v; i gestori stanno in `actions` */
function btn(act, v){ return ' data-act="' + act + '"' + (v != null ? ' data-v="' + esc(v) + '"' : ''); }

actions = {
  resetAll: function(){ set({ q: "", mese: "all", genere: [], editore: [], evid: [], limit: PAGE, pubQ: "", pubAll: false, detail: null, sheet: false }); },
  resetFilters: resetFilters,
  clearQ: function(){ set({ q: "", limit: PAGE }); $("bb-q").focus(); },
  openSheet: function(){ set({ sheet: true }); },
  closeSheet: function(){ set({ sheet: false }); },
  closeOverlays: function(){ set({ sheet: false, detail: null }); },
  closeDetail: function(){ set({ detail: null }); },
  togglePubAll: function(){ set({ pubAll: !S.pubAll }); },
  showMore: function(){ set({ limit: S.limit + PAGE }); },
  mese: function(v){ set({ mese: v, limit: PAGE }); },
  genere: function(v){ toggle("genere", v); },
  editore: function(v){ toggle("editore", v); },
  evid: function(v){ toggle("evid", v); },
  rmMese: function(){ set({ mese: "all", limit: PAGE }); },
  suggPub: function(v){ set({ q: "", editore: S.editore.concat([v]), limit: PAGE }); },
  suggGenre: function(v){ set({ q: "", genere: S.genere.concat([v]), limit: PAGE }); },
  open: function(v){ set({ detail: +v, sheet: false }); },
  prev: function(){ step(-1); },
  next: function(){ step(1); },
  allPub: function(v){ set({ q: "", mese: BOOKS[S.detail] && BOOKS[S.detail].arch ? "arch" : "all", genere: [], evid: [], editore: [v], detail: null, limit: PAGE }); },
  allGenre: function(v){ set({ q: "", mese: BOOKS[S.detail] && BOOKS[S.detail].arch ? "arch" : "all", editore: [], evid: [], genere: [v], detail: null, limit: PAGE }); }
};
function step(dir){
  var idx = results.findIndex(function(b){ return b.id === S.detail; });
  var n = idx + dir;
  if (idx > -1 && n >= 0 && n < results.length) set({ detail: results[n].id });
}

/* ---------- render ---------- */
var lastDetail = null;

function render(){
  var toks = tokenize(S.q);
  var hasTok = toks.length > 0;
  var base = BOOKS, fuzzy = false;
  if (hasTok){
    base = BOOKS.filter(function(b){ return toks.every(function(t){ return strictTok(b, t); }); });
    if (!base.length){
      var fz = BOOKS.filter(function(b){ return toks.every(function(t){ return fuzzyTok(b, t); }); });
      if (fz.length){ base = fz; fuzzy = true; }
    }
  }

  function pass(b, except){
    if (except !== "mese" && (S.mese === "all" ? b.arch : tabKey(b) !== S.mese)) return false;
    if (except !== "genere" && S.genere.length && S.genere.indexOf(b.k) < 0) return false;
    if (except !== "editore" && S.editore.length && S.editore.indexOf(b.p) < 0) return false;
    if (except !== "evid" && S.evid.length && !S.evid.some(function(e){ return b.ev.indexOf(e) > -1; })) return false;
    return true;
  }
  function countBy(except, fn){
    var m = {};
    base.forEach(function(b){ if (!pass(b, except)) return; fn(b).forEach(function(v){ m[v] = (m[v] || 0) + 1; }); });
    return m;
  }
  results = base.filter(function(b){ return pass(b, null); }).sort(CMP[S.sort] || CMP.date);

  /* schede mese */
  var mC = countBy("mese", function(b){ return [tabKey(b)]; });
  var tabsTotal = 0; Object.keys(mC).forEach(function(k){ if (k !== "arch") tabsTotal += mC[k]; });
  $("bb-tabs").innerHTML = ["all"].concat(MONTHS, ["na"], HAS_ARCHIVE ? ["arch"] : []).map(function(key){
    var n = key === "all" ? tabsTotal : (mC[key] || 0);
    var label = tabLabel(key);
    var dis = n === 0 && S.mese !== key;
    return '<button type="button" class="bb-tab" aria-pressed="' + (S.mese === key) + '"' + (dis ? " disabled" : "") + btn("mese", key) + '>' + label + '<span class="bb-n">' + n + '</span></button>';
  }).join("");

  /* genere */
  var gC = countBy("genere", function(b){ return [b.k]; });
  var genres = ALL_GENRES.filter(function(g){ return gC[g] || S.genere.indexOf(g) > -1; });
  $("bb-genres").innerHTML = genres.map(function(g){
    return '<button type="button" class="bb-chip" aria-pressed="' + (S.genere.indexOf(g) > -1) + '"' + btn("genere", g) + '>' + svgIcon(g, 15, 2, "bb-gico g-" + gslug(g)) + esc(g) + '<span class="bb-n">' + (gC[g] || 0) + '</span></button>';
  }).join("");
  $("bb-fs-genre").hidden = genres.length === 0;

  /* in evidenza */
  var eC = countBy("evid", function(b){ return b.ev; });
  var evid = EVID.filter(function(e){ return eC[e[0]] || S.evid.indexOf(e[0]) > -1; });
  $("bb-evid").innerHTML = evid.map(function(e){
    return '<button type="button" class="bb-chip" aria-pressed="' + (S.evid.indexOf(e[0]) > -1) + '"' + btn("evid", e[0]) + '>' + e[1] + '<span class="bb-n">' + (eC[e[0]] || 0) + '</span></button>';
  }).join("");
  $("bb-fs-evid").hidden = evid.length === 0;

  /* editore */
  var pC = countBy("editore", function(b){ return b.p ? [b.p] : []; });
  var nPq = norm(S.pubQ);
  var pubList = ALL_PUBS.filter(function(p){
    if (nPq) return norm(p).indexOf(nPq) > -1;
    return S.editore.indexOf(p) > -1 || pC[p];
  }).sort(function(x, y){
    var sx = S.editore.indexOf(x) > -1 ? 0 : 1, sy = S.editore.indexOf(y) > -1 ? 0 : 1;
    return sx - sy || (pC[y] || 0) - (pC[x] || 0) || x.localeCompare(y, "it");
  });
  var showPubMore = !nPq && pubList.length > 8;
  var pubShown = (nPq || S.pubAll) ? pubList : pubList.slice(0, 8);
  $("bb-pubs").innerHTML = pubShown.map(function(p){
    return '<li><button type="button" class="bb-check" aria-pressed="' + (S.editore.indexOf(p) > -1) + '"' + btn("editore", p) + '><span class="bb-box">' + CHECK_ICON + '</span><span class="bb-lab">' + esc(p) + '</span><span class="bb-n">' + (pC[p] || 0) + '</span></button></li>';
  }).join("");
  $("bb-pub-empty").hidden = pubList.length > 0;
  $("bb-pub-more").hidden = !showPubMore;
  $("bb-pub-more").textContent = S.pubAll ? "Mostra meno" : "Mostra tutti gli editori (" + pubList.length + ")";

  /* filtri attivi */
  var pills = [];
  if (S.mese !== "all") pills.push({ label: S.mese === "arch" ? "Archivio" : tabLabel(S.mese), act: "rmMese" });
  S.evid.forEach(function(e){ pills.push({ label: EVID_TAG[e], act: "evid", v: e }); });
  S.genere.forEach(function(g){ pills.push({ label: g, act: "genere", v: g }); });
  S.editore.forEach(function(p){ pills.push({ label: p, act: "editore", v: p }); });
  var hasActive = pills.length > 0;
  $("bb-active").hidden = !hasActive;
  $("bb-active").innerHTML = pills.map(function(p){
    return '<button type="button" class="bb-pill" aria-label="Rimuovi il filtro ' + esc(p.label) + '"' + btn(p.act, p.v) + '>' + esc(p.label) + X_ICON + '</button>';
  }).join("") + (hasActive ? '<button type="button" class="bb-link"' + btn("resetFilters") + '>Azzera filtri</button>' : "");
  $("bb-side-reset").hidden = !hasActive || isM;
  $("bb-badge").hidden = !hasActive;
  $("bb-badge").textContent = pills.length;

  /* suggerimenti: la ricerca diventa un filtro */
  var sugg = [];
  var nq = norm(S.q);
  if (nq.length >= 3){
    ALL_PUBS.forEach(function(p){ if (S.editore.indexOf(p) < 0 && norm(p).indexOf(nq) > -1) sugg.push(["Editore", p, "suggPub"]); });
    ALL_GENRES.forEach(function(g){ if (S.genere.indexOf(g) < 0 && norm(g).indexOf(nq) > -1) sugg.push(["Genere", g, "suggGenre"]); });
    sugg = sugg.slice(0, 4);
  }
  $("bb-sugg").hidden = !sugg.length;
  $("bb-sugg").innerHTML = "<span>Filtra per</span>" + sugg.map(function(s){
    return '<button type="button" class="bb-sugg-btn"' + btn(s[2], s[1]) + '><span class="bb-sugg-k">' + s[0] + '</span>' + esc(s[1]) + '</button>';
  }).join("");

  /* elenco */
  var qShow = S.q.trim();
  $("bb-fuzzy").hidden = !fuzzy;
  $("bb-fuzzy").textContent = "Nessun risultato esatto per «" + qShow + "»: questi sono i titoli più vicini.";
  $("bb-count").textContent = plural(results.length, "libro", "libri") + (S.sort !== "date" && results.length ? ", per " + SORT_LABEL[S.sort] : "");
  $("bb-show").textContent = results.length ? "Mostra " + plural(results.length, "libro", "libri") : "Nessun libro";

  var hl = toks.filter(function(t){ return t.length >= 2; });
  function matchedIn(field){ return hasTok && field && toks.some(function(t){ return field.indexOf(t) > -1; }); }
  function item(b){
    var meta = [];
    if (b.tr) meta.push("Traduzione di " + b.tr);
    if (b.o && !b.oSame && matchedIn(b.nO)) meta.push("titolo originale " + b.o);
    if (b.alt && matchedIn(b.nAlt)) meta.push("anche " + b.alt);
    var dm = b.m ? ((b.d || isM) ? MONTH_ABBR[mIdx(b.m)] : MONTH_NAMES[mIdx(b.m)]) : "";
    var tags = isM ? evidTags(b) : genreTag(b.k) + evidTags(b);
    return '<li class="bb-item">' +
      '<div class="bb-date">' + (b.d ? '<span class="bb-dd">' + b.d + '</span>' : '') + '<span class="bb-dm">' + dm + '</span>' +
        (isM ? '<span class="bb-gbadge g-' + gslug(b.k) + '" title="' + esc(b.k) + '">' + svgIcon(b.k, 15, 2) + '<span class="bb-sr">' + esc(b.k) + '</span></span>' : '') +
      '</div>' +
      '<div class="bb-body">' +
        '<h3 class="bb-t"><button type="button" class="bb-open"' + btn("open", b.id) + '>' + highlight(b.t, hl) + '</button></h3>' +
        '<p class="bb-a">' + highlight(b.a, hl) + (b.p ? ' <span class="bb-pub">per ' + esc(b.p) + '</span>' : '') + '</p>' +
        (meta.length ? '<p class="bb-meta">' + esc(cap(meta.join(" · "))) + '</p>' : '') +
        (tags ? '<div class="bb-tags">' + tags + '</div>' : '') +
      '</div>' + CHEV_ICON + '</li>';
  }
  var visible = results.slice(0, S.limit);
  var html = "";
  if (S.sort === "date"){
    var tot = {};
    results.forEach(function(b){ var k = b.m || "na"; tot[k] = (tot[k] || 0) + 1; });
    var curKey = null;
    visible.forEach(function(b){
      var key = b.m || "na";
      if (key !== curKey){
        if (curKey !== null) html += "</ol></div>";
        curKey = key;
        html += '<div class="bb-group"><h2 class="bb-gh"><span>' + (key === "na" ? "Da annunciare" : monthLabel(key, true)) + '</span><span class="bb-gh-n">' + plural(tot[key], "libro", "libri") + '</span></h2><ol class="bb-list">';
      }
      html += item(b);
    });
    if (curKey !== null) html += "</ol></div>";
  } else if (visible.length){
    html = '<div class="bb-group"><ol class="bb-list">' + visible.map(item).join("") + '</ol></div>';
  }
  $("bb-groups").innerHTML = html;

  var rest = results.length - visible.length;
  $("bb-morewrap").hidden = rest <= 0;
  $("bb-more").textContent = "Mostra altri " + Math.min(PAGE, rest);
  $("bb-moresub").textContent = visible.length + " di " + results.length;

  $("bb-empty").hidden = results.length > 0;
  $("bb-empty-t").textContent = hasTok ? "Nessun libro trovato per «" + qShow + "»." : "Nessun libro con questi filtri.";
  $("bb-empty-q").hidden = !S.q;
  $("bb-empty-f").hidden = !hasActive;
  var inArch = S.mese !== "arch" ? (mC.arch || 0) : 0;
  $("bb-empty-arch").hidden = !(results.length === 0 && inArch);
  $("bb-empty-arch").textContent = "Vedi " + plural(inArch, "libro", "libri") + " in archivio";

  /* controlli statici */
  if ($("bb-q").value !== S.q) $("bb-q").value = S.q;
  if ($("bb-pq").value !== S.pubQ) $("bb-pq").value = S.pubQ;
  $("bb-clear").hidden = !S.q;
  document.querySelectorAll(".bb-sort").forEach(function(el){ el.value = S.sort; });

  renderDetail();

  root.className = "bb t-" + theme + (isM ? " is-m" : " is-d") + (isM && S.sheet ? " sheet-open" : "") + (S.detail != null ? " detail-open" : "");
}

function renderDetail(){
  var dr = $("bb-drawer");
  var db = S.detail != null ? BOOKS[S.detail] : null;
  if (!db){
    dr.hidden = true; dr.innerHTML = "";
    if (lastDetail != null){
      lastDetail = null;
      var opener = document.querySelector('.bb-open[data-v="' + lastOpened + '"]');
      if (opener) opener.focus({ preventScroll: true });
    }
    return;
  }
  var idx = results.findIndex(function(b){ return b.id === db.id; });
  var rows = [["Uscita", dateFull(db), ""]];
  if (db.p) rows.push(["Editore", db.p, ""]);
  if (db.tr) rows.push(["Traduzione", db.tr, ""]);
  if (db.o && !db.oSame) rows.push(["Titolo originale", db.o, "bb-rv-em"]);
  if (db.alt) rows.push(["Noto anche come", db.alt, "bb-rv-em"]);
  function rel(b){
    return '<li><button type="button" class="bb-relbtn"' + btn("open", b.id) + '><strong>' + esc(b.t) + '</strong><span>' + esc(b.a + (b.m ? " · " + (b.d ? b.d + " " : "") + MONTH_NAMES[mIdx(b.m)] : "")) + '</span></button></li>';
  }
  var pool = BOOKS.filter(function(b){ return b.arch === db.arch; });
  var samePub = db.p ? pool.filter(function(b){ return b.p === db.p && b.id !== db.id; }).sort(CMP.date) : [];
  var sameGenre = pool.filter(function(b){ return b.k === db.k && b.id !== db.id && b.p !== db.p; }).sort(CMP.date);
  var gTot = pool.filter(function(b){ return b.k === db.k; }).length;
  var navBtn = function(act, label, path, dis){
    return '<button type="button" class="bb-iconbtn" aria-label="' + label + '"' + (dis ? " disabled" : "") + btn(act) + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"></path></svg></button>';
  };

  dr.setAttribute("aria-label", db.t);
  dr.innerHTML =
    '<div class="bb-dhead">' +
      '<button type="button" class="bb-iconbtn" id="bb-dclose" aria-label="Chiudi la scheda"' + btn("closeDetail") + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>' +
      '<div class="bb-dnav"><span class="bb-pos">' + (idx > -1 ? (idx + 1) + " di " + results.length : "") + '</span>' +
        navBtn("prev", "Libro precedente", "m15 18-6-6 6-6", !(idx > 0)) +
        navBtn("next", "Libro successivo", "m9 18 6-6-6-6", !(idx > -1 && idx < results.length - 1)) +
      '</div>' +
    '</div>' +
    '<div class="bb-dbody" id="bb-dbody">' +
      '<p class="bb-dk">' + esc(dateFull(db)) + '</p>' +
      '<h2 class="bb-dt">' + esc(db.t) + '</h2>' +
      (db.a ? '<p class="bb-da">' + esc(db.a) + '</p>' : '') +
      '<div class="bb-tags">' + genreTag(db.k) + evidTags(db) + '</div>' +
      '<div class="bb-dl">' + rows.map(function(r){ return '<div class="bb-row"><span class="bb-rk">' + r[0] + '</span><span class="' + r[2] + '">' + esc(r[1]) + '</span></div>'; }).join("") + '</div>' +
      db.notes.map(function(t){ return '<p class="bb-dnote">' + esc(t) + '</p>'; }).join("") +
      (db.u ? '<a class="bb-src" href="' + esc(db.u) + '" target="_blank" rel="noopener">Apri la scheda della fonte<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></a>' : '') +
      (samePub.length ? '<div class="bb-rel"><h3 class="bb-rel-h">Sempre da ' + esc(db.p) + '</h3><ul class="bb-rel-list">' + samePub.slice(0, 4).map(rel).join("") + '</ul>' +
        '<button type="button" class="bb-more"' + btn("allPub", db.p) + '>Tutti i titoli ' + esc(db.p) + ' (' + (samePub.length + 1) + ')</button></div>' : '') +
      (sameGenre.length ? '<div class="bb-rel"><h3 class="bb-rel-h">Altri titoli · ' + esc(db.k) + '</h3><ul class="bb-rel-list">' + sameGenre.slice(0, 4).map(rel).join("") + '</ul>' +
        '<button type="button" class="bb-more"' + btn("allGenre", db.k) + '>Vedi tutti: ' + esc(db.k) + ' (' + gTot + ')</button></div>' : '') +
    '</div>';
  dr.hidden = false;

  if (S.detail !== lastDetail){
    var wasClosed = lastDetail == null;
    lastDetail = S.detail;
    $("bb-dbody").scrollTop = 0;
    if (wasClosed) $("bb-dclose").focus({ preventScroll: true });
  }
}

/* ---------- eventi ---------- */
var lastOpened = null;
root.addEventListener("click", function(e){
  var el = e.target.closest("[data-act]");
  if (!el || el.disabled || !actions[el.dataset.act]) return;
  if (el.dataset.act === "open" && !el.closest("#bb-drawer")) lastOpened = el.dataset.v;
  var keepFocus = el.closest("#bb-drawer") ? el.getAttribute("aria-label") : null;
  actions[el.dataset.act](el.dataset.v);
  /* dopo il render della scheda, il pulsante cliccato è stato ricreato: ridai il fuoco a quello equivalente */
  if (keepFocus && S.detail != null){
    var again = document.querySelector('#bb-drawer [aria-label="' + keepFocus + '"]');
    if (again && !again.disabled) again.focus({ preventScroll: true });
  }
});
document.querySelectorAll(".bb-theme [data-theme]").forEach(function(el){
  el.addEventListener("click", function(){
    theme = el.dataset.theme;
    try { if (theme === "auto") localStorage.removeItem("bb-theme"); else localStorage.setItem("bb-theme", theme); } catch (e) {}
    paintTheme();
  });
});
$("bb-q").addEventListener("input", function(e){ set({ q: e.target.value, limit: PAGE }); });
$("bb-pq").addEventListener("input", function(e){ set({ pubQ: e.target.value }); });
document.querySelectorAll(".bb-sort").forEach(function(el){
  el.addEventListener("change", function(e){ set({ sort: e.target.value, limit: PAGE }); });
});
document.addEventListener("keydown", function(e){
  if (e.key !== "Escape") return;
  if (S.detail != null) set({ detail: null });
  else if (S.sheet) set({ sheet: false });
});
function measure(){
  var n = window.innerWidth < 768;
  if (n !== isM){ isM = n; if (loaded) render(); }
}
window.addEventListener("resize", measure);

/* ---------- avvio ---------- */
var loaded = false;
function tagline(){
  if (!MONTHS.length) return;
  var a = MONTHS[0], b = MONTHS[MONTHS.length - 1];
  var span;
  if (a === b) span = "a " + MONTH_NAMES[mIdx(a)] + " " + mYear(a);
  else if (ONE_YEAR) span = "da " + MONTH_NAMES[mIdx(a)] + " a " + MONTH_NAMES[mIdx(b)] + " " + mYear(b);
  else span = "da " + MONTH_NAMES[mIdx(a)] + " " + mYear(a) + " a " + MONTH_NAMES[mIdx(b)] + " " + mYear(b);
  $("bb-tagline").textContent = "Narrativa straniera tradotta in uscita in Italia " + span + ": romanzi, racconti, memoir e libri ibridi, anche di genere.";
}
isM = window.innerWidth < 768;
paintTheme();
fetch("books.json", { cache: "no-cache" })
  .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(function(data){
    prepare(Array.isArray(data) ? data : []);
    loaded = true;
    tagline();
    render();
  })
  .catch(function(){
    $("bb-count").textContent = "Non è stato possibile caricare il catalogo.";
  });
})();
