# MondialDay

Site statique qui recense les journées mondiales, internationales, européennes et nationales (France et Suisse), avec recherche, filtres et export vers un agenda (.ics).

Adresse : https://pascalgir.github.io/MondialDay/

## Fichiers

- `index.html` : la page (HTML, CSS et JavaScript). Le bloc `<script id="moteur">` contient le calcul des dates et la création des fichiers .ics.
- `config.js` : réglages modifiables sans toucher au code (nom, adresse du site, nombre de jours à venir, rappel…).
- `journees.js` : la liste des journées. Une ligne par journée : `[règle de date, nom, type, officielle (1/0), organisme]`. Les règles de date sont décrites en tête du fichier.
- `nouveautes.js` : historique public affiché dans la fenêtre « Nouveautés ».
- `calendrier.ics`, `officielles.ics` : calendriers à suivre par abonnement, générés par `node outils/generer-ics.js`.
- `sw.js` : consultation hors ligne.
- `CHANGELOG.md` : historique détaillé.

## Mettre à jour la liste

1. Modifier `journees.js`.
2. Lancer `node outils/generer-ics.js` pour régénérer les deux fichiers .ics.
3. Mettre à jour le numéro de version (page, `sw.js`, paramètres `?v=`), `CHANGELOG.md` et `nouveautes.js`.

## Sources

Journées proclamées par les Nations Unies et leurs agences, les institutions européennes, la France et la Suisse, complétées de journées populaires. Voir aussi la [liste de l’ONU](https://www.un.org/fr/observances/list-days-weeks) et [Wikipédia](https://fr.wikipedia.org/wiki/Journ%C3%A9e_internationale).
