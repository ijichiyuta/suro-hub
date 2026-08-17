// @ts-nocheck  ← Deno/esm.sh のリモート型は環境依存で誤検知が出るため型チェック無効(ロジックは検証済み)
// Stripe Checkout セッションを作成し、決済ページURLを返すEdge Function。
//   フロント: ログイン中ユーザーのJWTを Authorization に載せて {plan:"monthly"|"yearly"} をPOST。
//   本人確認(getUser)→Stripe顧客をprofilesと紐付け→サブスクのCheckout作成→url返却。
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
const PRICES: Record<string, string | undefined> = {
  monthly: Deno.env.get("STRIPE_PRICE_MONTHLY"),
  yearly: Deno.env.get("STRIPE_PRICE_YEARLY"),
};
// 末尾スラッシュを保証(trailingSlash構成のサイト)
const SITE_URL = (Deno.env.get("SITE_URL") || "https://smasuro-lab.com/").replace(/\/?$/, "/");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(req, { error: "ログインが必要です。" }, 401);

    // ユーザーのJWTで本人確認
    const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json(req, { error: "ログインが必要です。" }, 401);

    const { plan } = await req.json().catch(() => ({}));
    const price = PRICES[plan];
    if (!price) return json(req, { error: "プランが不正です。" }, 400);

    // 既存のStripe顧客を再利用(無ければ作成してprofilesに保存)
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: prof } = await admin.from("profiles").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    let customerId: string | undefined = prof?.stripe_customer_id ?? undefined;
    // 保存済み顧客IDが別アカウント/削除済みで無効なら作り直す(自己修復＝アカウント切替に強い)
    if (customerId) {
      try {
        const c = await stripe.customers.retrieve(customerId);
        if ((c as { deleted?: boolean })?.deleted) customerId = undefined;
      } catch { customerId = undefined; }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = customer.id;
      await admin.from("profiles").upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: "user_id" });
    }

    // 二重購入防止: 既に有効なサブスク(active/trialing/past_due)があれば中断
    const existing = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 5 });
    const hasActive = existing.data.some(
      (s) => s.status === "active" || s.status === "trialing" || s.status === "past_due",
    );
    if (hasActive) return json(req, { error: "すでにプレミアム会員です。" }, 409);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${SITE_URL}upgrade/?checkout=success`,
      cancel_url: `${SITE_URL}upgrade/?checkout=cancel`,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      locale: "ja",
    });
    return json(req, { url: session.url });
  } catch (e) {
    console.error(e);
    return json(req, { error: "エラーが発生しました。時間をおいて再度お試しください。" }, 500);
  }
});
