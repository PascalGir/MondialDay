# Changelog — MondialDay

## 1.0 — 2026-11-13 — Première version

- Page unique `index.html` (charte « Confettis » : fond #FFFDF8, couleurs par type mondiale #C94444, internationale #13786E, européenne #9A6200, nationale #5B4BD5 ; police arrondie du système ; mode clair / sombre automatique).
- Données dans `journees.js` : 326 journées (239 officielles), types M / I / E / FR / CH.
- Règles de date : date fixe, durée sur plusieurs jours (`+N`), n-ième ou dernier jour de semaine du mois, dernier jour du mois, jour de semaine le plus proche d’une date, fête des mères française (calcul de Pâques / Pentecôte).
- Encart « Aujourd’hui » et « Ces prochains jours » (nombre de jours dans `config.js`).
- Recherche insensible aux accents, filtres par type, interrupteur « Officielles seulement », choix du mois et de l’année.
- Export .ics de la sélection (événements récurrents RRULE, UID stables, rappel optionnel la veille via VALARM) et ajout d’une journée seule.
- Fichiers d’abonnement `calendrier.ics` et `officielles.ics` générés par `outils/generer-ics.js`, qui réutilise le moteur de la page.
- Service worker `sw.js` (cache « mondialday-1.0 ») pour la consultation hors ligne.
- Fenêtre « Nouveautés » alimentée par `nouveautes.js`.
