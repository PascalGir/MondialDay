// Reporte le numéro de version de config.js partout où il doit figurer :
// paramètres anti-cache de index.html et cache hors ligne de sw.js.
// Lancer depuis la racine du dépôt après avoir changé « version » dans config.js :  node outils/version.js
"use strict";
const fs = require("fs"), path = require("path");
const R = f => path.join(__dirname, "..", f);
const v = /version:\s*"([^"]+)"/.exec(fs.readFileSync(R("config.js"), "utf8"))[1];
const html = fs.readFileSync(R("index.html"), "utf8").replace(/(\.js)\?v=[\d.]+"/g, `$1?v=${v}"`);
fs.writeFileSync(R("index.html"), html);
const sw = fs.readFileSync(R("sw.js"), "utf8").replace(/const VERSION = "[^"]*";/, `const VERSION = "${v}";`);
fs.writeFileSync(R("sw.js"), sw);
console.log("Version " + v + " reportée dans index.html et sw.js.");
