/* Service worker de Peluquería Barbería Ismael.
   Solo guarda la carcasa pública; nunca almacena APIs, autenticación,
   administración ni reservas de Google Calendar. */
const CACHE_NAME = "ismael-barber-shell-v1";
const BASE_PATH = "/ismael-barber-web/";
const APP_SHELL = [BASE_PATH, BASE_PATH + "index.html", BASE_PATH + "logo-ismael.png", BASE_PATH + "icons/icon-192.png", BASE_PATH + "icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("ismael-barber-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE_PATH)) return;
  if (url.pathname.includes("/admin") || url.pathname.includes("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok && url.pathname.endsWith("/index.html")) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(BASE_PATH + "index.html", copy));
      }
      return response;
    }).catch(() => caches.match(BASE_PATH + "index.html")));
    return;
  }
  if (url.pathname === BASE_PATH + "logo-ismael.png" || url.pathname.startsWith(BASE_PATH + "icons/")) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
