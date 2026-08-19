// Cloudflare Pages Function — 有料コンテンツを会員(premium)限定で配信。
//   保護対象: /data/spec/*(狙い目全文/解析/集計JSON) と /calc/*.html(計算ツール・期待値データ埋込)。
//   認証: cookie "sblab"(Supabaseアクセストークン。AuthSync.tsxが設定) or Authorization ヘッダ。
//   判定: profiles を RLS 経由で取得し plan=premium のみ配信。それ以外は 403。
//   ※ /calc の .js/.css/jQuery 等の汎用資産は非保護(期待値データはHTMLに埋込のためHTMLだけ守れば十分)。
// 無料サンプル(味見)機種ID: build-data.mjs が data/free-samples.json から自動生成する(マーカー間を置換)。
//   これらの /data/spec/<id>.json は premium でなくても「ログイン済みユーザー」なら配信する(トークン必須)。
//   計算ツール(/calc)や他機種は従来どおり premium 限定。※この行は手編集しない(ビルドで上書きされる)。
const FREE_SAMPLE_IDS = new Set([/*FREE_SAMPLES_START*/"mf145f1f809","m6274327c07","ma69b2526ad"/*FREE_SAMPLES_END*/]);

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

  // 無料サンプル(味見)機種の spec は「ログイン済みなら誰でも」配信(premium不要)。
  //   それ以外(通常機種の spec / 計算ツール calc)は従来どおり premium 必須。
  let requirePremium = true;
  if (path.startsWith("/data/spec/")) {
    const id = (path.split("/").pop() || "").replace(/\.json$/, "");
    if (FREE_SAMPLE_IDS.has(id)) requirePremium = false;
  }

  // トークン取得(cookie優先、無ければAuthorizationヘッダ)
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|;\s*)sblab=([^;]+)/);
  let token = m ? decodeURIComponent(m[1]) : "";
  if (!token) {
    const auth = request.headers.get("Authorization") || "";
    token = auth.replace(/^Bearer\s+/i, "");
  }
  if (!token) return deny(401);

  try {
    if (requirePremium) {
      // 通常保護: profiles.plan=premium のみ配信。※premium会員は必ず profiles 行を持つ(checkout時に作成)。
      const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=plan`, {
        headers: { apikey: ANON, Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return deny(403);
      const rows = await r.json();
      const plan = Array.isArray(rows) && rows.length ? rows[0].plan : null;
      if (plan !== "premium") return deny(403);
    } else {
      // 無料サンプル: 「ログイン済みなら誰でも」。新規の無料ユーザーは profiles 行が未作成のことがある
      //   (課金前は行が無い)ため、profiles ではなく /auth/v1/user でトークンの有効性=ログインを検証する。
      const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: ANON, Authorization: `Bearer ${token}` },
      });
      if (!u.ok) return deny(403); // 無効/期限切れトークン=未ログイン相当
    }
  } catch {
    return deny(403);
  }
  return next();
}
