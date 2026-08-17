// @ts-nocheck  ← Deno/esm.sh のリモート型は環境依存で誤検知が出るため型チェック無効
// 退会/アカウント削除。ログイン中ユーザーのJWTで本人確認→
//   Stripeの有効サブスクを即時解約→関連データ(favorites/logs/notes/profiles)削除→
//   Supabase Authユーザー削除。フロント: ログイン中ユーザーのJWTをAuthorizationに載せてPOST。
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// CORS: 許可オリジンのみ反映(既定は本番オリジン)
const ALLOWED_ORIGIN = "https://smasuro-lab.com";
function corsHeadersFor(req: Request) {
  const origin = req.headers.get("Origin");
  const allow = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeadersFor(req), "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });
  try {
    // 1. 本人確認(anon + ユーザーJWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(req, { error: "ログインが必要です。" }, 401);
    const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json(req, { error: "ログインが必要です。" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);

    // 2. Stripe顧客IDを取得
    const { data: prof } = await admin.from("profiles").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    const customerId = prof?.stripe_customer_id;

    // 3. 有効サブスク(active/trialing/past_due)を即時解約
    if (customerId) {
      try {
        const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
        for (const sub of subs.data) {
          if (sub.status === "active" || sub.status === "trialing" || sub.status === "past_due") {
            try {
              await stripe.subscriptions.cancel(sub.id);
            } catch (e) {
              console.error("subscription cancel failed:", sub.id, e);
            }
          }
        }
      } catch (e) {
        console.error("subscription list failed:", e);
      }
    }

    // 4. 関連データ削除(存在するものだけ。無ければ無視)
    for (const table of ["favorites", "logs", "notes", "profiles"]) {
      const { error } = await admin.from(table).delete().eq("user_id", user.id);
      if (error) console.error(`delete from ${table} failed:`, error);
    }

    // 5. Supabase Authユーザー削除
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) console.error("auth deleteUser failed:", delErr);

    // 6. 完了
    return json(req, { ok: true });
  } catch (e) {
    console.error(e);
    return json(req, { error: "エラーが発生しました。時間をおいて再度お試しください。" }, 500);
  }
});
