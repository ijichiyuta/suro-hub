// suro-hub Service Worker — 店内オフライン対応。
// 同一オリジンのGETを stale-while-revalidate でキャッシュ(閲覧した機種・解析・計算ツールは電波なしでも表示)。
// 版数を上げると旧キャッシュを破棄。基本は背景更新なので通常バンプ不要。
const CACHE = "surohub-v2";

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
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => { if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone()); return res; })
        .catch(() => null);
      // キャッシュ優先(即表示)＋背景更新。未キャッシュはネットワーク。オフライン時はナビをトップにフォールバック。
      return cached || (await network) || (req.mode === "navigate" ? cache.match("/suro-hub/") : Response.error());
    })
  );
});
