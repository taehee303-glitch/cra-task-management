const CACHE_VERSION = "90";
const CACHE_NAME = `cra-task-manager-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./calendar-config.js",
  "./calendar-sync.js",
  "./firebase-config.js",
  "./firebase-sync.js",
  "./pwa.js",  "./manifest.webmanifest",
  "./404.html",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
];

function isAppShellRequest(url) {
  if (url.pathname.endsWith("/") || url.pathname.endsWith("/index.html")) return true;
  return /\.(html|js|css|webmanifest)$/i.test(url.pathname);
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) =>
              (key.startsWith("cra-task-manager-") && key !== CACHE_NAME) ||
              key.startsWith("fitspace")
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isAppShellRequest(url)) {
    event.respondWith(networkFirstWithCacheUpdate(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

async function networkFirstWithCacheUpdate(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("./index.html");
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await caches.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || networkPromise || new Response("", { status: 504 });
}
