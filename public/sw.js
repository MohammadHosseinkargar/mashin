



const CACHE = "trnm-site-v2";
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

  // فقط GET و فقط همین origin؛ پنل مدیریت و API هرگز کش نمی‌شوند (حریم خصوصی + داده‌ی تازه)
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/")) return;

    // HTML pages: network-first with offline fallback
  if (req.headers.get("accept")?.includes("text/html")) {
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
  if (url.pathname.startsWith("/_next/static/") || /^\/icon-\d+\.png$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((cached) => cached ?? fetch(req).then(cacheOk)),
    );
    return;
  }

  // بقیه (مثل عکس‌های آپلودی): شبکه، و در صورت قطعی نسخه‌ی کش‌شده
  e.respondWith(
    fetch(req).catch(async () => (await caches.match(req)) ?? Response.error()),
  );
});

self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
