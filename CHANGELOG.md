# Changelog — MondialDay

## 1.3 — 2026-11-17 — Simplification, fiche d'une journée, partage

- Simplification (EV-06 à EV-09) : un seul bouton « Ajouter à mon agenda (N) » ouvrant `#dlgAgenda` (téléchargement .ics de la sélection avec rappel, puis abonnements) à la place de « Exporter » et « S'abonner » ; filtres par type dans `<details id="plus">` « Plus de filtres » avec compteur des types masqués ; menu des mois supprimé (`etat.mois` retiré, doublon de l'accordéon) ; lignes : type + « ✓ organisme » pour les officielles seulement, plus de pastille « Populaire » ni d'organisme des journées populaires, plus d'icône « en savoir plus ».
- Fiche d'une journée (`#dlgJour`, nom cliquable `data-jour="i|an"`) : date complète, type, officielle/populaire, organisme, boutons Agenda, Partager (EV-14 : `navigator.share`, sinon copie du texte et du lien) et En savoir plus. Lien `#j-<nom>` : ouvre la fiche au chargement.
- EV-15 : mots recherchés surlignés (`<mark>`, insensible aux accents). EV-16 : bouton flottant « Rechercher » quand les filtres sont hors de vue (IntersectionObserver). EV-17 : type écrit en toutes lettres dans « Les 14 prochains jours » (`.tag`), à la place de la seule pastille de couleur.
- EV-11 : bandeau de récupération en `<details>` sur une ligne (source et prochaine mise à jour au toucher). EV-12 : message « Nouvelle version disponible — Actualiser » sur `controllerchange` quand une version précédente était installée ; vérification au retour sur la page.
- EV-10 : balises Open Graph / Twitter, image `apercu.png` (1200 × 630, charte Confettis).
- EV-13 : journées suisses ajoutées (Saint-Berchtold, Journée des malades, Journée suisse de la lecture à voix haute, Grève féministe) : 9 au total.
- EV-05 : `rapport-mise-a-jour.md` écrit à chaque récupération réussie (nouvelles, retirées, dates corrigées, toutes les journées venant de la source, mode d'emploi de `journeesExclues`) ; ticket GitHub « Journées à vérifier » ouvert s'il y a du nouveau (`issues: write`). Premier rapport : les 63 journées de la récupération du 17.11.

## 1.2 — 2026-11-17 — Lecture fiable de Wikipédia, tests, version unique

- Cause de l'échec du 13.11 (1 journée reconnue) : les dates de la page sont des modèles à un paramètre (`{{date|1 janvier}}`), effacés par le nettoyage ; et les références `<ref name="calendrier" />` étaient prises pour des références ouvrantes, ce qui supprimait des blocs entiers de la page.
- `outils/mise-a-jour.js` : modèles `{{date|…}}` (un ou plusieurs paramètres), `{{1er|samedi}}` / `{{2e|lundi}} de février` / `{{3e|week-end}}` ; plages « 6 / 8 février » ; « 28 ou 29 février » → dernier jour du mois ; « À partir du » ; « Dernier samedi (du mois) » ; sous-listes `**` rattachées à la date de la ligne parente ; arrêt aux sections Notes / Voir aussi ; noms : parenthèses, « ou … », suite de phrase après une virgule et « instaurée / créée … » retirées, un nom doit commencer par Journée, Jour, Semaine ou Fête.
- Comparaison : correction de date seulement si le nom est identique ; doublon si même jour et moitié des mots en commun ou un nom contenu dans l'autre, ou même mois et ≥ 0,75 ; mots proches tolérés (Novruz / Nowrouz). Liste des ajouts et corrections écrite dans le journal de l'automatisation ; début de la page écrit en cas de contenu inattendu.
- `config.journeesExclues` : journées de la source à ne jamais ajouter (appliqué par la mise à jour, la page et les .ics).
- `outils/tests.js` (EV-03) : calcul des dates, données du site, lecture d'une copie de la vraie page (`outils/tests/wikipedia-journee-internationale.txt`, relevée le 17.11.2026), doublons, idempotence, exclusions, récupération réussie / source illisible / injoignable sur une copie du site, cohérence du numéro de version. Lancé par l'automatisation avant toute écriture.
- Version unique (EV-04) : `config.version` ; la page l'affiche ; `node outils/version.js` la reporte dans les paramètres anti-cache et `sw.js` ; les tests refusent toute incohérence.
- Essai sur la page réelle : 211 journées lues sur 12 mois, 148 déjà connues, 63 nouvelles, 0 date déplacée.

## 1.1 — 2026-11-13 — Prochains jours, accordéon par mois, mise à jour mensuelle

- Bandeau en haut de page : « Dernière récupération des informations », lu dans `journees-auto.js` (`derniereRecuperation`, date de la dernière récupération réussie uniquement). Sans récupération : mention « aucune pour l’instant » + date de la liste initiale (`config.dateListeInitiale`) + date de la prochaine récupération prévue.
- « Les 14 prochains jours » (`config.joursAVenir: 14`) : toutes les journées du lendemain à J+14, sans limite de nombre ni mention « et N autres ».
- Liste complète : sections par année (année en cours + `config.anneesAffichees - 1` suivantes, calculées depuis la date du jour), mois en `<details>` fermés par défaut, contenu rempli à l’ouverture ; état ouvert/fermé mémorisé pendant la visite ; recherche ou choix d’un mois → mois concernés ouverts ; bouton « Tout développer / Tout réduire » ; mention « ce mois-ci ». Sélecteur d’année retiré.
- Export : la sélection compte chaque journée une seule fois sur l’ensemble des années affichées.
- Moteur : `MD.cle()` (clé de comparaison des noms) et `MD.fusion(base, auto)` (corrections de dates + ajouts sans doublon), utilisés par la page et par `outils/generer-ics.js`.
- `outils/mise-a-jour.js` : récupère la page Wikipédia « Journée internationale » (API, wikitexte, 3 essais, délai 30 s), extrait date + nom par mois (dates fixes, plages, n-ième jour de semaine, sous-listes, plusieurs journées par ligne), écarte les journées nationales d’autres pays, compare à `journees.js` (nom identique ou proche + même date/mois) : doublons ignorés, date différente → `corrections`, inconnues → `ajouts` ; journées disparues de la source → retirées. Contrôle de vraisemblance (≥ 40 journées sur ≥ 10 mois). En cas d’échec : données et date de dernière récupération conservées, `derniereTentative` notée, sortie en erreur.
- `.github/workflows/mise-a-jour.yml` : le 1er de chaque mois à 5 h UTC (+ lancement manuel), exécute la mise à jour, régénère les .ics, enregistre le résultat dans le dépôt, signale l’échec.
- `sw.js` : cache `mondialday-1.1`, ajout de `journees-auto.js`. Dates au format « 1er ».

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
