/* MondialDay — consultation hors ligne. Changer VERSION à chaque version du site. */
const VERSION = "1.0";
const CACHE = "mondialday-" + VERSION;
const FICHIERS = ["./", "index.html", "config.js?v=" + VERSION, "journees.js?v=" + VERSION, "nouveautes.js?v=" + VERSION, "icon-180.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Affiche tout de suite la copie gardée, et la met à jour en arrière-plan
  e.respondWith(caches.open(CACHE).then(async c => {
    const garde = await c.match(req);
    const reseau = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => garde);
    return garde || reseau;
  }));
});
