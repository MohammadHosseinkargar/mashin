



const CACHE = "trnm-site-v1";
const STATIC = [
  "/",
  "/catalog",
  "/about",
  "/contact",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

async function cacheOk(response: Response): Promise<Response> {
  const clone = response.clone();
  if (clone.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(clone.request, clone);
  }
  return response;
}

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  //ตรึง API calls to network (no caching) so rate + catalog stay fresh
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(req).catch(() => new Response(JSON.stringify({ success: false, error: "آفلاین" }), { status: 503, headers: { "Content-Type": "application/json" } })),
    );
    return;
  }

  // HTML pages: network-first with offline fallback
  if (req.method === "GET" && req.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(req)
        .then((r) => cacheOk(r))
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match("/") as Promise<Response>;
        }),
    );
    return;
  }

  // assets: cache-first, falling back to network
  if (req.method === "GET" && (url.pathname.endsWith(".png") || url.pathname.endsWith(".jpg") || url.pathname.endsWith(".webp") || url.pathname.endsWith(".svg") || url.pathname.endsWith(".js") || url.pathname.endsWith(".css"))) {
    e.respondWith(
      caches.match(req).then((cached) => cached ?? fetch(req).then(cacheOk)),
    );
    return;
  }

  // fallback for anything else not matched: network-first
  e.respondWith(
    fetch(req).catch(async () => caches.match(req)),
  );
});

self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
