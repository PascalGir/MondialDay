// MondialDay — mise à jour automatique des journées (lancée chaque mois par GitHub Actions).
//
// 1. Récupère la page Wikipédia « Journée internationale » (wikitexte, via l'API officielle).
// 2. En extrait les journées (date + nom) mois par mois.
// 3. Compare avec la liste de base (journees.js) : doublons ignorés, dates changées → corrections,
//    journées inconnues → ajouts. Les journées qui disparaissent de la source sont retirées des ajouts.
// 4. Écrit journees-auto.js avec la date de la récupération réussie.
// En cas d'échec (source injoignable, page vide ou méconnaissable), les données et la date de
// dernière récupération réussie sont conservées ; seule la tentative est notée, et le script sort en erreur.
//
// Options (variables d'environnement) :
//   SOURCE_FICHIER=chemin  lire un wikitexte local au lieu d'Internet (tests)
//   DATE_DU_JOUR=AAAA-MM-JJ  forcer la date (tests)
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");

const RACINE = path.join(__dirname, "..");
const FICHIER_AUTO = path.join(RACINE, "journees-auto.js");
const SOURCE_NOM = "Wikipédia — « Journée internationale »";
const SOURCE_URL = "https://fr.wikipedia.org/w/api.php?action=parse&page=Journ%C3%A9e_internationale&prop=wikitext&format=json&formatversion=2&redirects=1";
const MIN_JOURNEES = 40, MIN_MOIS = 10, ESSAIS = 3, DELAI_MS = 30000;

const MOIS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
const JOURS = { lundi: "MO", mardi: "TU", mercredi: "WE", jeudi: "TH", vendredi: "FR", samedi: "SA", dimanche: "SU" };
const RANGS = { premier: "1", "1er": "1", premiere: "1", deuxieme: "2", second: "2", seconde: "2", "2e": "2", troisieme: "3", "3e": "3", quatrieme: "4", "4e": "4", dernier: "L", derniere: "L" };
const ORGANISMES = [["ONUSIDA"], ["UNESCO"], ["UNICEF"], ["OMS", "Organisation mondiale de la santé"], ["FAO"], ["OIT"], ["UIT"], ["OMM"], ["OMI"], ["OMPI"], ["UPU"], ["OACI"], ["PNUE"], ["ONU", "Nations unies", "Organisation des Nations unies", "Assemblée générale"]];

const sans = t => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const deux = n => String(n).padStart(2, "0");
const aujourdhui = () => process.env.DATE_DU_JOUR || new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich" }).format(new Date());

/* ---------- Lecture des fichiers du site ---------- */
function charger() {
  const ctx = { window: {}, TextEncoder, console }; ctx.globalThis = ctx; vm.createContext(ctx);
  const html = fs.readFileSync(path.join(RACINE, "index.html"), "utf8");
  vm.runInContext(fs.readFileSync(path.join(RACINE, "journees.js"), "utf8"), ctx);
  if (fs.existsSync(FICHIER_AUTO)) vm.runInContext(fs.readFileSync(FICHIER_AUTO, "utf8"), ctx);
  vm.runInContext(/<script id="moteur">([\s\S]*?)<\/script>/.exec(html)[1], ctx);
  const auto = ctx.window.JOURNEES_AUTO || {};
  return { base: ctx.window.JOURNEES, auto: JSON.parse(JSON.stringify(auto)), MD: ctx.window.MD };
}
function ecrire(auto) {
  fs.writeFileSync(FICHIER_AUTO, "/* Fichier écrit par la mise à jour automatique (outils/mise-a-jour.js). Ne pas modifier à la main. */\nwindow.JOURNEES_AUTO = " + JSON.stringify(auto, null, 2) + ";\n");
}

/* ---------- Récupération ---------- */
async function recuperer() {
  if (process.env.SOURCE_FICHIER) return fs.readFileSync(process.env.SOURCE_FICHIER, "utf8");
  let derniere;
  for (let essai = 1; essai <= ESSAIS; essai++) {
    try {
      const r = await fetch(SOURCE_URL, { headers: { "User-Agent": "MondialDay/1.1 (https://github.com/PascalGir/MondialDay)" }, signal: AbortSignal.timeout(DELAI_MS) });
      if (!r.ok) throw new Error("réponse HTTP " + r.status);
      const d = await r.json();
      if (d.error) throw new Error("API Wikipédia : " + (d.error.info || d.error.code));
      const texte = d.parse && d.parse.wikitext;
      if (!texte) throw new Error("page sans contenu");
      return texte;
    } catch (e) {
      derniere = e; console.log(`Essai ${essai}/${ESSAIS} échoué : ${e.message}`);
      if (essai < ESSAIS) await new Promise(ok => setTimeout(ok, 5000 * essai));
    }
  }
  throw new Error("source injoignable (" + derniere.message + ")");
}

/* ---------- Analyse du wikitexte ---------- */
function nettoyer(t) {
  return t
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/>/gi, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/\{\{\s*1er\s*\}\}/gi, "1er").replace(/\{\{\s*er\s*\}\}/gi, "er").replace(/\{\{\s*e\s*\}\}/gi, "e")
    .replace(/\{\{\s*date[^|}]*\|([^|}]*)\|([^|}]*)(?:\|[^}]*)?\}\}/gi, "$1 $2")
    .replace(/\{\{\s*(?:lang|langue)\s*\|[^|}]*\|([^}]*)\}\}/gi, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, "$1").replace(/\[https?:\/\/\S+\]/g, "")
    .replace(/'{2,}/g, "").replace(/<[^>]+>/g, "").replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ").trim();
}

function lireDate(texte, moisSection) {
  const t = sans(texte), M = "(" + MOIS.join("|") + ")";
  let m;
  if ((m = new RegExp("^(\\d{1,2})(?:er)?\\s*(?:au|-|–|—)\\s*(\\d{1,2})(?:er)?\\s+" + M + "\\b").exec(t)))
    return { regle: deux(MOIS.indexOf(m[3]) + 1) + "-" + deux(m[1]) + "+" + (+m[2] - +m[1] + 1), lu: m[0].length };
  if ((m = new RegExp("^(\\d{1,2})(?:er)?\\s+" + M + "\\b").exec(t)))
    return { regle: deux(MOIS.indexOf(m[2]) + 1) + "-" + deux(m[1]), lu: m[0].length };
  if ((m = new RegExp("^(premier|1er|premiere|deuxieme|second|seconde|2e|troisieme|3e|quatrieme|4e|dernier|derniere)\\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\\s+(?:de\\s+|d')?" + M + "\\b").exec(t)))
    return { regle: deux(MOIS.indexOf(m[3]) + 1) + "-" + RANGS[m[1]] + JOURS[m[2]], lu: m[0].length };
  if (moisSection && (m = /^(\d{1,2})(?:er)?\b/.exec(t)) && +m[1] >= 1 && +m[1] <= 31)
    return { regle: deux(moisSection) + "-" + deux(m[1]), lu: m[0].length };
  return null;
}

function typeDe(nom) {
  const n = sans(nom);
  if (/europeen/.test(n)) return "E";
  if (/mondial/.test(n)) return "M";
  return "I";
}

function analyser(wikitexte, MD) {
  const lignes = nettoyerRefs(wikitexte).split(/\r?\n/);
  const resultat = [], moisVus = new Set();
  let moisSection = 0, dateParent = null;
  for (const brute of lignes) {
    const titre = /^(={2,5})\s*(.*?)\s*\1\s*$/.exec(brute);
    if (titre) { const i = MOIS.indexOf(sans(nettoyer(titre[2]))); moisSection = i >= 0 ? i + 1 : 0; dateParent = null; continue; }
    const puce = /^(\*+)\s*(.*)$/.exec(brute);
    if (!puce || !moisSection) continue;
    const niveau = puce[1].length, texte = nettoyer(puce[2]);
    if (!texte) continue;
    let d = lireDate(texte, moisSection), reste = texte;
    if (d) { reste = texte.slice(d.lu); if (niveau === 1) dateParent = d.regle; }
    else if (niveau > 1 && dateParent) d = { regle: dateParent };
    else continue;
    try { MD.lire(d.regle); } catch (e) { continue; }
    const parties = reste.replace(/^[\s:–—,\-.]+/, "").split(/\s*;\s*/);
    for (let p of parties) {
      const organisme = trouverOrganisme(p);
      let nom = p.replace(/\s*\((?:[^()]*?(?:ONU|Nations|UNESCO|OMS|FAO|OIT|UIT|depuis|\d{4})[^()]*)\)\s*/gi, " ")
        .replace(/\s*[,–—-]\s*(?:proclam|instaur|cré|décid|adopt).*$/i, "")
        .replace(/[.,;:\s]+$/, "").trim();
      if (!/journ[ée]e|semaine|\bjour\b|fête/i.test(nom) || nom.length < 8 || nom.length > 200) continue;
      if (/(^|[^a-zà-ÿ])nationale/i.test(nom) && !/france|français|suisse/i.test(p)) continue; // nationales d'autres pays : hors périmètre
      nom = nom.charAt(0).toUpperCase() + nom.slice(1);
      resultat.push([d.regle, nom, typeDe(nom), organisme ? 1 : 0, organisme || "Wikipédia"]);
      moisVus.add(+d.regle.slice(0, 2));
    }
  }
  return { journees: resultat, moisVus };
}
function nettoyerRefs(t) { return t.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "").replace(/<!--[\s\S]*?-->/g, ""); }
function trouverOrganisme(t) {
  for (const noms of ORGANISMES) for (const n of noms) if (new RegExp("\\b" + n + "\\b", n === n.toUpperCase() ? "" : "i").test(t)) return noms[0];
  return null;
}

/* ---------- Comparaison avec la liste de base ---------- */
const MOTS_VIDES = new Set(["journee", "journees", "mondiale", "mondial", "internationale", "international", "de", "du", "des", "la", "le", "les", "l", "d", "et", "pour", "a", "au", "aux", "en", "sur", "contre", "nations", "unies"]);
function mots(nom) { return new Set(sans(nom).replace(/[^a-z0-9]+/g, " ").split(" ").filter(m => m && !MOTS_VIDES.has(m))); }
function proche(a, b) {
  const A = mots(a), B = mots(b); if (!A.size || !B.size) return false;
  let commun = 0; A.forEach(m => { if (B.has(m)) commun++; });
  return commun / (A.size + B.size - commun) >= 0.75;
}
function memeJour(MD, r1, r2, an) {
  const a = MD.occurrence(r1, an), b = MD.occurrence(r2, an);
  return a.debut.getTime() === b.debut.getTime();
}

function comparer(base, source, MD, an) {
  const cles = new Map(base.map(j => [MD.cle(j[1]), j]));
  const corrections = {}, ajouts = [], vus = new Set();
  let doublons = 0;
  for (const s of source) {
    const k = MD.cle(s[1]);
    if (vus.has(k)) { doublons++; continue; }
    vus.add(k);
    let ref = cles.get(k);
    if (!ref) ref = base.find(b => proche(b[1], s[1]) && (memeJour(MD, b[0], s[0], an) || b[0].slice(0, 2) === s[0].slice(0, 2)));
    if (ref) {
      if (!memeJour(MD, ref[0], s[0], an) && /^\d\d-\d\d$|^\d\d-[1-4L][A-Z]{2}$/.test(s[0]) && !/\+/.test(ref[0])) corrections[MD.cle(ref[1])] = s[0];
      else doublons++;
      continue;
    }
    ajouts.push(s);
  }
  ajouts.sort((a, b) => MD.occurrence(a[0], an).debut - MD.occurrence(b[0], an).debut || a[1].localeCompare(b[1], "fr"));
  return { corrections, ajouts, doublons };
}

/* ---------- Programme principal ---------- */
async function main() {
  const { base, auto, MD } = charger();
  const date = aujourdhui(), an = +date.slice(0, 4);
  try {
    const texte = await recuperer();
    const { journees, moisVus } = analyser(texte, MD);
    if (journees.length < MIN_JOURNEES || moisVus.size < MIN_MOIS)
      throw new Error(`contenu inattendu : ${journees.length} journées sur ${moisVus.size} mois (minimum ${MIN_JOURNEES} sur ${MIN_MOIS}) — la page a peut-être changé de forme`);
    const { corrections, ajouts, doublons } = comparer(base, journees, MD, an);
    const avant = new Map((auto.ajouts || []).map(j => [MD.cle(j[1]), j]));
    const apres = new Map(ajouts.map(j => [MD.cle(j[1]), j]));
    const stats = {
      luesDansLaSource: journees.length,
      dejaPresentes: doublons,
      ajoutees: [...apres.keys()].filter(k => !avant.has(k)).length,
      modifiees: [...apres].filter(([k, j]) => avant.has(k) && JSON.stringify(avant.get(k)) !== JSON.stringify(j)).length
        + Object.keys(corrections).filter(k => (auto.corrections || {})[k] !== corrections[k]).length,
      retirees: [...avant.keys()].filter(k => !apres.has(k)).length
        + Object.keys(auto.corrections || {}).filter(k => !(k in corrections)).length,
      totalAjouts: ajouts.length,
      totalCorrections: Object.keys(corrections).length
    };
    ecrire({ source: SOURCE_NOM, derniereRecuperation: date, derniereTentative: { date, statut: "réussie", message: "" }, statistiques: stats, corrections, ajouts });
    console.log("Récupération réussie le " + date + " :", JSON.stringify(stats));
  } catch (e) {
    auto.source = auto.source || SOURCE_NOM;
    auto.derniereTentative = { date, statut: "échec", message: e.message };
    ecrire(auto); // données et date de dernière récupération réussie inchangées
    console.error("::error::Mise à jour impossible : " + e.message + " — données précédentes conservées.");
    process.exitCode = 1;
  }
}

if (require.main === module) main();
module.exports = { analyser, comparer, nettoyer, lireDate };
