// RNF-01: service worker minimo, escopado a /produtor/cadastro/*, para o
// cadastro do produtor continuar carregando sem internet depois de uma
// primeira visita online.
const CACHE_NAME = "iasy-cadastro-shell-v1";
const APP_SHELL_FALLBACK = "/produtor/cadastro/1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([APP_SHELL_FALLBACK]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate") return;

  const url = new URL(request.url);
  if (!url.pathname.startsWith("/produtor/cadastro/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(
        async () =>
          (await caches.match(request)) ||
          (await caches.match(APP_SHELL_FALLBACK))
      )
  );
});
