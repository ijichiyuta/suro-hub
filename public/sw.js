// suro-hub Service Worker — 店内オフライン対応。
//   ・HTML(ナビゲーション)= ネットワーク優先(常に最新を表示。オフライン時のみキャッシュ/トップへフォールバック)
//   ・静的資産(ハッシュ付きJS/CSS・画像・データJSON)= stale-while-revalidate(即表示+背景更新)
//   版数を上げると旧キャッシュを破棄。※以前は全てSWRでHTMLも古いまま表示される問題があった→修正(v3)。
const CACHE = "surohub-v3";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部(画像CDN等)はブラウザ任せ

  const isNav = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  // HTML: ネットワーク優先=常に最新の画面/最新のチャンク参照を配信。落ちた時だけキャッシュ/トップへ。
  if (isNav) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        try {
          const res = await fetch(req);
          if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone());
          return res;
        } catch {
          return (await cache.match(req)) || (await cache.match(self.registration.scope)) || Response.error();
        }
      })
    );
    return;
  }

  // 静的資産: stale-while-revalidate(即表示＋背景更新)。ハッシュ付きなので古いままにならない。
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => { if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone()); return res; })
        .catch(() => null);
      return cached || (await network) || Response.error();
    })
  );
});
