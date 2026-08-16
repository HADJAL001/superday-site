/* SUPER DAY — service worker.
   Стратегия: навигации — network-first с офлайн-фолбэком на кэш главной;
   статика (иконки, манифест, шрифты) — cache-first. Версия в имени кэша —
   меняй CACHE при обновлении, чтобы старый кэш очистился. */
var CACHE = "superday-v63";
var SHELL = [
  "/",
  "/index.html",
  "/app.html",
  "/documents.html",
  "/support.html",
  "/legal.css",
  "/legal.js",
  "/support.js",
  // Слои волны 11: язык интерфейса и подсказки ввода. Словари (i18n/<код>.js)
  // в оболочку не кладём — грузится ровно один, он и осядет в кэше при первом
  // визите; русскому не нужен ни один.
  "/i18n.js",
  "/ux.js",
  "/refer.js",
  // Движок роста: без него приложение работает, но без уровней и серии — в
  // оболочке, потому что рендер обращается к нему на первом же кадре.
  "/growth.js",
  "/assets/vendor/leaflet-1.9.4.js",
  "/manifest.webmanifest",
  "/assets/mark.png",
  "/assets/logo.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/icon-maskable-512.png",
  "/assets/apple-touch-icon-180.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "skipWaiting") { self.skipWaiting(); }
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) { return caches.delete(k); }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") { return; }

  // Навигации: сеть, при офлайне — кэш этой же страницы, иначе главная.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        if (!res || res.status !== 200 || (res.type !== "basic" && res.type !== "cors")) {
          return res;
        }
        var copy = res.clone();
        return caches.open(CACHE).then(function (c) {
          return c.put(req, copy);
        }).then(function () { return res; });
      }).catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match("/app.html").then(function (app) {
            return app || caches.match("/index.html").then(function (h) { return h || caches.match("/"); });
          });
        });
      })
    );
    return;
  }

  // Остальное: сначала кэш, затем сеть (с дозаписью в кэш).
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) { return cached; }
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
    })
  );
});
