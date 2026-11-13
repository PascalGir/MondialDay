// Génère calendrier.ics (toutes les journées) et officielles.ics à partir de journees.js
// et des données récupérées automatiquement (journees-auto.js).
// Utilise le même moteur que la page (bloc <script id="moteur"> de index.html).
// Lancer depuis la racine du dépôt :  node outils/generer-ics.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const racine = path.join(__dirname, "..");
const ctx = { window: {}, TextEncoder, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
const html = fs.readFileSync(path.join(racine, "index.html"), "utf8");
const moteur = /<script id="moteur">([\s\S]*?)<\/script>/.exec(html)[1];
for (const f of ["config.js", "journees.js", "journees-auto.js"]) if (fs.existsSync(path.join(racine, f))) vm.runInContext(fs.readFileSync(path.join(racine, f), "utf8"), ctx);
vm.runInContext(moteur, ctx);
const { CONFIG: C, MD } = ctx.window;
const J = MD.fusion(ctx.window.JOURNEES, ctx.window.JOURNEES_AUTO);
const horodatage = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
const opt = nom => ({ nom, url: C.urlSite, rappel: false, heureRappel: C.heureRappel, anneeDepart: C.anneeDepart, anneesCalculees: C.anneesCalculees, horodatage });
fs.writeFileSync(path.join(racine, "calendrier.ics"), MD.ics(J, opt(C.nomSite)));
fs.writeFileSync(path.join(racine, "officielles.ics"), MD.ics(J.filter(j => j[3]), opt(C.nomSite + " · officielles")));
console.log("calendrier.ics :", J.length, "journées ; officielles.ics :", J.filter(j => j[3]).length);
