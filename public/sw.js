// LORA RENTALS — service worker: offline shell + asset caching
const CACHE = "lora-v3";
const SHELL = ["/", "/offline", "/manifest.json", "/icons/icon-192x192.png", "/icons/icon-512x512.png"];

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

  // Pages and API requests prefer fresh data, with cached fallback when available.
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); return response; }).catch(() => caches.match(request).then((hit) => hit || caches.match("/offline")))
    );
    return;
  }

  if (new URL(request.url).pathname.startsWith("/api/")) {
    e.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }
  // Static assets are cache-first to keep the installed shell responsive offline.
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

self.addEventListener("push", (event) => {
  const data = event.data?.json?.() || {};
  event.waitUntil(self.registration.showNotification(data.title || "LORA Rentals", { body: data.body || "You have a LORA update.", icon: "/icons/icon-192x192.png", badge: "/icons/icon-96x96.png", data: { url: data.url || "/dashboard/bookings" } }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
