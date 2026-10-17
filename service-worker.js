/* ==========================================================================
   service-worker.js — Fonctionnement 100 % hors ligne
   --------------------------------------------------------------------------
   • À l'installation : met en cache TOUTES les ressources de l'application.
   • Ensuite : stratégie « cache d'abord » (cache-first) → l'app se lance
     sans réseau, même après fermeture complète.
   • Mise à jour : changer CACHE_VERSION (nouveau vocabulaire ou nouveau code).
     À l'activation, les anciens caches sont supprimés.
   • La progression de l'apprenant est dans localStorage, PAS dans ce cache :
     vider ou remplacer le cache ne l'efface jamais.
   • Toutes les URL sont construites à partir de la portée (scope) courante :
     l'app fonctionne à la racine d'un domaine comme dans un sous-dossier
     (ex. https://nom.github.io/allemand/).
   ========================================================================== */
const CACHE_VERSION = 'v1.2.0';
const CACHE_NAME = 'wortschatz-' + CACHE_VERSION;

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './vocabulaire.js',
  './css/app.css',
  './js/i18n.js',
  './js/srs.js',
  './js/answer.js',
  './js/store.js',
  './js/sound.js',
  './js/app.js',
  './fonts/inter-latin-wght.woff2',
  './fonts/space-grotesk-latin-wght.woff2',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];
const SCOPE = self.registration.scope;
const URLS = FILES.map(function (f) { return new URL(f, SCOPE).href; });

/* Installation : tout précharger (en contournant le cache HTTP du navigateur) */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(URLS.map(function (url) {
        return fetch(new Request(url, { cache: 'reload' })).then(function (res) {
          if (!res.ok) throw new Error(url + ' → ' + res.status);
          return cache.put(url, res);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

/* Activation : supprimer les caches des versions précédentes */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf('wortschatz-') === 0 && k !== CACHE_NAME;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Requêtes : cache d'abord, réseau en secours (et mise en cache au passage) */
self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        // Navigation vers une URL inconnue de l'app : servir index.html
        if (req.mode === 'navigate') {
          return cache.match(new URL('./index.html', SCOPE).href).then(function (page) {
            return page || fetch(req);
          });
        }
        return fetch(req).then(function (res) {
          if (res.ok && req.url.indexOf(SCOPE) === 0) cache.put(req, res.clone());
          return res;
        });
      });
    })
  );
});
