/* MondialDay — réglages modifiables sans toucher au code. */
window.CONFIG = {
  // Numéro de version du site : le seul endroit à modifier (puis lancer « node outils/version.js »)
  version: "1.2",
  nomSite: "MondialDay",
  titre: "Chaque jour sa journée",
  // Adresse publique du site (sert aux liens d'abonnement au calendrier)
  urlSite: "https://pascalgir.github.io/MondialDay/",
  // Nombre de jours couverts par « Les prochains jours »
  joursAVenir: 14,
  // Nombre d'années affichées dans la liste (l'année en cours, puis les suivantes)
  anneesAffichees: 2,
  // Date à laquelle la liste de base a été établie (affichée tant qu'aucune récupération n'a eu lieu)
  dateListeInitiale: "2026-11-13",
  // Rappel la veille coché par défaut dans l'export, et son heure (0 à 23)
  rappelParDefaut: false,
  heureRappel: 18,
  // Première année couverte par les fichiers .ics (les journées se répètent ensuite chaque année)
  anneeDepart: 2025,
  // Nombre d'années générées pour les dates calculées (fête des mères en France)
  anneesCalculees: 10,
  // Journées de la source automatique à ne jamais ajouter (nom exact tel qu'il apparaît sur le site)
  journeesExclues: []
};
