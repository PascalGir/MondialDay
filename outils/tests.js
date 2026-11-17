// MondialDay — tests automatiques. Lancés par l'automatisation mensuelle avant toute écriture,
// et à lancer avant chaque publication :  node outils/tests.js
// Sortie en erreur dès qu'un test échoue : rien n'est alors enregistré.
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
const RACINE = path.join(__dirname, "..");
const lire = f => fs.readFileSync(path.join(RACINE, f), "utf8");
const MAJ = require("./mise-a-jour.js");
const SOURCE_TEST = path.join(__dirname, "tests", "wikipedia-journee-internationale.txt");

let ok = 0, ko = 0;
function test(nom, fn) {
  try { fn(); ok++; console.log("  ✓ " + nom); }
  catch (e) { ko++; console.log("  ✗ " + nom + " — " + e.message); }
}
function egal(obtenu, attendu, quoi) {
  if (JSON.stringify(obtenu) !== JSON.stringify(attendu)) throw new Error(`${quoi || "valeur"} : ${JSON.stringify(obtenu)} au lieu de ${JSON.stringify(attendu)}`);
}
function vrai(cond, message) { if (!cond) throw new Error(message); }

const { base, MD, exclues } = MAJ.charger();
const jour = (regle, an) => MD.occurrence(regle, an).debut.toISOString().slice(0, 10);

console.log("Calcul des dates");
test("dates fixes et plages", () => { egal(jour("03-08", 2027), "2027-03-08"); egal(MD.occurrence("02-06+3", 2026).dur, 3); });
test("n-ième et dernier jour de semaine", () => { egal(jour("11-3TH", 2026), "2026-11-19"); egal(jour("09-LTH", 2026), "2026-09-24"); egal(jour("02-2MO", 2027), "2027-02-08"); });
test("dernier jour du mois, années bissextiles", () => { egal(jour("02-FIN", 2028), "2028-02-29"); egal(jour("02-FIN", 2027), "2027-02-28"); });
test("fête des mères en France (décalée à la Pentecôte)", () => { egal(jour("MERES_FR", 2026), "2026-05-31"); egal(jour("MERES_FR", 2024), "2024-05-26"); egal(jour("MERES_FR", 2023), "2023-06-04"); });
test("dimanche le plus proche d'une date", () => egal(jour("07-SU~16", 2026), "2026-07-19"));

console.log("Données du site");
test("toutes les règles de date de la liste de base sont valides", () => base.forEach(j => MD.occurrence(j[0], 2026)));
test("aucun doublon dans la liste de base", () => {
  const vus = new Set(); base.forEach(j => { const k = MD.cle(j[1]); vrai(!vus.has(k), "doublon : " + j[1]); vus.add(k); });
});
test("liste publiée (base + données automatiques) sans doublon ni règle invalide", () => {
  const ctx = {}; new Function("window", lire("journees-auto.js"))(ctx);
  const liste = MD.fusion(base, ctx.JOURNEES_AUTO, []);
  const cles = liste.map(j => MD.cle(j[1]));
  vrai(new Set(cles).size === cles.length, "doublon après fusion");
  liste.forEach(j => MD.occurrence(j[0], 2027));
});

console.log("Lecture de la source (copie de la page Wikipédia du 17.11.2026)");
const page = fs.readFileSync(SOURCE_TEST, "utf8");
const { journees, moisVus } = MAJ.analyser(page, MD);
const trouve = (regle, debutNom) => journees.some(j => j[0] === regle && MD.cle(j[1]).startsWith(MD.cle(debutNom)));
test("assez de journées sur les 12 mois", () => { vrai(journees.length >= 150, journees.length + " journées seulement"); egal(moisVus.size, 12, "mois lus"); });
test("dates « {{date|…}} » simples", () => { vrai(trouve("01-04", "Journée mondiale du braille"), "braille"); vrai(trouve("12-01", "Journée mondiale de lutte contre le sida"), "sida"); });
test("« 1er octobre » et sous-listes rattachées à leur date", () => { vrai(trouve("10-01", "Journée internationale du café"), "café"); vrai(trouve("02-04", "Journée mondiale contre le cancer"), "cancer"); });
test("rang de jour de semaine (« 2e lundi de février », « 1er samedi »)", () => { vrai(trouve("02-2MO", "Journée internationale de l'épilepsie"), "épilepsie"); vrai(trouve("07-1SA", "Journée internationale des coopératives"), "coopératives"); });
test("plages, « 28 ou 29 février », « 3e week-end »", () => {
  vrai(trouve("02-06+3", "Journée mondiale sans téléphone"), "sans téléphone");
  vrai(trouve("02-FIN", "Journée mondiale des maladies rares"), "maladies rares");
  vrai(trouve("09-3SA+2", "Journées européennes du patrimoine"), "patrimoine");
});
test("noms propres : sans référence, parenthèse ni suite de phrase", () => {
  journees.forEach(j => vrai(!/[<>{}\[\]|]|\(|également|instaurée/i.test(j[1]), "nom mal nettoyé : " + j[1]));
  vrai(journees.some(j => j[1] === "Journée mondiale de prière pour la sauvegarde de la création"), "nom coupé");
});
test("organismes officiels reconnus", () => {
  const env = journees.find(j => /environnement/.test(j[1])), sante = journees.find(j => j[0] === "04-07");
  vrai(env && env[4] === "ONU" && env[3] === 1, "ONU non reconnu"); vrai(sante && sante[4] === "OMS", "OMS non reconnue");
});

console.log("Comparaison avec la liste de base");
const r1 = MAJ.comparer(base, journees, MD, 2026, exclues);
test("les journées déjà connues ne sont pas ajoutées une seconde fois", () => {
  ["journee mondiale de la paix", "journee internationale du novruz", "journee internationale des femmes", "journee de l europe de l union europeenne", "journee europeenne du 112"]
    .forEach(k => vrai(!r1.ajouts.some(j => MD.cle(j[1]) === k), "doublon ajouté : " + k));
});
test("aucune date de la liste de base déplacée à tort", () => egal(Object.keys(r1.corrections).length, 0, "corrections"));
test("nouvelles journées repérées", () => { vrai(r1.ajouts.length >= 20, r1.ajouts.length + " ajouts"); vrai(r1.ajouts.some(j => /chat noir/.test(j[1])), "chat noir absent"); });
test("même résultat à chaque passage", () => egal(MAJ.comparer(base, journees, MD, 2026, exclues), r1));
test("journée exclue jamais ajoutée", () => {
  const r = MAJ.comparer(base, journees, MD, 2026, [MD.cle("Journée internationale du chat noir")]);
  vrai(!r.ajouts.some(j => /chat noir/.test(j[1])), "exclusion ignorée");
});

console.log("Mise à jour complète et gestion des erreurs (sur une copie du site)");
function copie() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "mondialday-"));
  ["index.html", "config.js", "journees.js", "journees-auto.js"].forEach(f => fs.copyFileSync(path.join(RACINE, f), path.join(d, f)));
  fs.mkdirSync(path.join(d, "outils"));
  fs.copyFileSync(path.join(__dirname, "mise-a-jour.js"), path.join(d, "outils", "mise-a-jour.js"));
  return d;
}
function lancer(d, source, date) {
  try { execFileSync("node", [path.join(d, "outils", "mise-a-jour.js")], { env: { ...process.env, SOURCE_FICHIER: source, DATE_DU_JOUR: date }, stdio: "pipe" }); return 0; }
  catch (e) { return e.status; }
}
const auto = d => { const c = {}; new Function("window", fs.readFileSync(path.join(d, "journees-auto.js"), "utf8"))(c); return c.JOURNEES_AUTO; };
test("récupération réussie : date notée, ajouts écrits", () => {
  const d = copie(); egal(lancer(d, SOURCE_TEST, "2026-12-01"), 0, "code de sortie");
  const a = auto(d); egal(a.derniereRecuperation, "2026-12-01"); egal(a.derniereTentative.statut, "réussie"); vrai(a.ajouts.length >= 20, "ajouts");
  const rapport = fs.readFileSync(path.join(d, "rapport-mise-a-jour.md"), "utf8");
  vrai(/Journées à vérifier/.test(rapport) && /chat noir/.test(rapport) && /journeesExclues/.test(rapport), "rapport incomplet");
  egal(lancer(d, SOURCE_TEST, "2027-01-01"), 0, "2e passage"); egal(auto(d).ajouts, a.ajouts, "2e passage identique");
});
test("source illisible : erreur, données et date de dernière réussite conservées", () => {
  const d = copie(); lancer(d, SOURCE_TEST, "2026-12-01"); const avant = auto(d);
  const vide = path.join(d, "vide.txt"); fs.writeFileSync(vide, "Page vide");
  vrai(lancer(d, vide, "2027-01-01") !== 0, "l'échec n'est pas signalé");
  const apres = auto(d);
  egal(apres.derniereRecuperation, "2026-12-01", "date conservée"); egal(apres.ajouts, avant.ajouts, "données conservées"); egal(apres.derniereTentative.statut, "échec");
});
test("source injoignable : erreur signalée, données conservées", () => {
  const d = copie(); const avant = auto(d);
  vrai(lancer(d, path.join(d, "absent.txt"), "2027-01-01") !== 0, "l'échec n'est pas signalé");
  egal(auto(d).derniereRecuperation, avant.derniereRecuperation, "date conservée");
});

console.log("Numéro de version");
test("même version partout", () => {
  const v = /version:\s*"([^"]+)"/.exec(lire("config.js"))[1];
  const html = lire("index.html");
  (html.match(/\.js\?v=([\d.]+)"/g) || []).forEach(m => vrai(m.includes("?v=" + v + '"'), "index.html : " + m));
  vrai(lire("sw.js").includes(`const VERSION = "${v}";`), "sw.js");
  vrai(/window\.NOUVEAUTES = \[\s*\{\s*version: "([^"]+)"/.exec(lire("nouveautes.js"))[1] === v, "nouveautes.js");
  vrai(lire("CHANGELOG.md").includes("## " + v + " "), "CHANGELOG.md");
});

console.log(`\n${ok} réussi(s), ${ko} échoué(s)`);
if (ko) process.exitCode = 1;
