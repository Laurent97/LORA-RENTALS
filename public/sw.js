// LORA RENTALS — service worker: offline shell + asset caching
const CACHE = "lora-v1";
const SHELL = ["/", "/offline", "/icon.svg", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  if (!request.url.startsWith("http://") && !request.url.startsWith("https://")) return;

  // navigations: network-first, fall back to offline page
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("/offline"))
    );
    return;
  }

  // static assets: cache-first
  if (request.destination === "image" || request.destination === "style" || request.destination === "script" || request.destination === "font") {
    e.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((c) => c.put(request, clone));
            }
            return res;
          })
      )
    );
  }
});
