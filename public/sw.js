const CACHE_NAME = "careerforge-v1";
const STATIC_ASSETS = ["/dashboard", "/resumes", "/jobs", "/pipeline", "/insights", "/settings"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Network-first for API calls, cache-first for navigation
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || new Response("Offline", { status: 503 })))
    );
  } else if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/dashboard").then((r) => r || new Response("Offline", { status: 503 })))
    );
  }
});
