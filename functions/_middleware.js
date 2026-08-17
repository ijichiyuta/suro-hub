// Cloudflare Pages Function — 有料コンテンツを会員(premium)限定で配信。
//   保護対象: /data/spec/*(狙い目全文/解析/集計JSON) と /calc/*.html(計算ツール・期待値データ埋込)。
//   認証: cookie "sblab"(Supabaseアクセストークン。AuthSync.tsxが設定) or Authorization ヘッダ。
//   判定: profiles を RLS 経由で取得し plan=premium のみ配信。それ以外は 403。
//   ※ /calc の .js/.css/jQuery 等の汎用資産は非保護(期待値データはHTMLに埋込のためHTMLだけ守れば十分)。
const SUPABASE_URL = "https://rhlzapshrggtozqzkran.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobHphcHNocmdndG96cXprcmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MTgxNzMsImV4cCI6MjEwMTM5NDE3M30.prB09uhQpd0pvkhjCGFp3KT4jiiG5-IilPn2KiIYtSo";

function isProtected(pathname) {
  if (pathname.startsWith("/data/spec/")) return true;
  if (pathname.startsWith("/calc/")) {
    // 計算ツールHTMLは .html だが、Cloudflareが拡張子なしのクリーンURL(/calc/<id>)へ308する。
    // 両方を保護。.js/.css/画像等の汎用資産(拡張子あり・非html)は非保護。
    const last = pathname.split("/").pop() || "";
    return last.endsWith(".html") || !last.includes(".");
  }
  return false;
}

function deny(status) {
  return new Response(JSON.stringify({ error: "会員限定コンテンツです。ログイン＆プレミアム登録が必要です。" }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  // ★パス正規化: 連続スラッシュ畳み込み+小文字化してから判定。
  //   //data/spec/… や /DATA/SPEC/… 等で startsWith 判定を回避され、CDNが実ファイルを返す漏洩を塞ぐ。
  const path = url.pathname.replace(/\/{2,}/g, "/").toLowerCase();
  if (!isProtected(path)) return next();

  // トークン取得(cookie優先、無ければAuthorizationヘッダ)
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|;\s*)sblab=([^;]+)/);
  let token = m ? decodeURIComponent(m[1]) : "";
  if (!token) {
    const auth = request.headers.get("Authorization") || "";
    token = auth.replace(/^Bearer\s+/i, "");
  }
  if (!token) return deny(401);

  // plan を profiles から取得(RLSで自分の行のみ返る)。有効なトークンかつ premium のみ通す。
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=plan`, {
      headers: { apikey: ANON, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return deny(403);
    const rows = await r.json();
    const plan = Array.isArray(rows) && rows.length ? rows[0].plan : null;
    if (plan !== "premium") return deny(403);
  } catch {
    return deny(403);
  }
  return next();
}
