/* SW: red primero para HTML/navegaciones (siempre fresco), cache para estaticos. */
const CACHE = "csl-v2";
const CORE = ["/manifest.webmanifest", "/images/logo-nuevo.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()).catch(() => {})
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico"
  );
}

self.addEventListener("push", (e) => {
  let data = { title: "Colegio", body: "", url: "/portal/avisos" };
  try {
    data = Object.assign(data, e.data ? e.data.json() : {});
  } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/images/logo-nuevo.png",
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/portal/avisos";
  e.waitUntil(self.clients.openWindow(url));
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navegaciones y HTML: red primero, cache como respaldo sin internet.
  if (request.mode === "navigate" || !isStatic(url)) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/inicio")))
    );
    return;
  }

  // Estaticos: cache primero.
  e.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
    )
  );
});
