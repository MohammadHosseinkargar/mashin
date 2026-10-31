/// <reference lib="webworker" />

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
    await caches.open(CACHE).then((c) => c.put(response.url, clone));
  }
  return response;
}

// Extend the self type so ServiceWorker API is available even in TS lib checks
const swSelf = self as unknown as {
  skipWaiting: () => Promise<void>;
  clients: {
    claim: () => Promise<void>;
  };
  addEventListener: (
    type: "install" | "activate" | "fetch" | "message",
    listener: (
      e: {
        waitUntil: (p: Promise<void>) => void;
        request?: Request;
        respondWith: (r: Promise<Response>) => void;
        data?: unknown;
      },
    ) => void,
  ) => void;
};

swSelf.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)));
});

swSelf.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k) as unknown as Promise<void>)).then((v) => v as unknown as void),
    ),
  );
  swSelf.clients.claim();
});

swSelf.addEventListener("fetch", (e) => {
  const req2 = e.request;
  if (!req2) return;
  const url = new URL(req2.url);
  const req = req2;
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(req).catch(
        () =>
          new Response(
            JSON.stringify({ success: false, error: "آفلاین" }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          ),
      ),
    );
    return;
  }

  if (req.method === "GET" && req.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(req)
        .then((r) => cacheOk(r))
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached as unknown as Promise<Response>;
          const fallback = await caches.match("/") ?? new Response("offline", { status: 503 });
          return fallback as unknown as Promise<Response>;
        }),
    );
    return;
  }

  if (
    req.method === "GET" &&
    (url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".webp") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css"))
  ) {
    e.respondWith(
      caches.match(req).then((cached) => cached ?? fetch(req).then(cacheOk)),
    );
    return;
  }

  e.respondWith(
    fetch(req).catch(async () => (await caches.match(req)) ?? Response.error()),
  );
});

swSelf.addEventListener("message", (e) => {
  if ((e as { data?: unknown }).data && (e as { data?: { type?: string } }).data?.type === "SKIP_WAITING") {
    swSelf.skipWaiting();
  }
});
