// @ts-nocheck  ← Deno/esm.sh のリモート型は環境依存で誤検知が出るため型チェック無効
// Stripe Webhook 受信。署名検証(constructEventAsync + SubtleCrypto)後、
//   サブスク状態に応じて profiles.plan を premium/free に更新する。
//   ★ verify_jwt=false 必須(StripeはSupabaseのJWTを持たない)。署名で真正性を担保。
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const WH_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// customer に紐づく profiles 行のプランを更新
async function setPlanByCustomer(customerId: string, plan: "premium" | "free", sub?: any) {
  const patch: Record<string, unknown> = { plan };
  if (sub) {
    patch.stripe_subscription_id = sub.id;
    patch.subscription_status = sub.status;
    patch.cancel_at_period_end = sub.cancel_at_period_end ?? false;
    if (sub.current_period_end) patch.current_period_end = new Date(sub.current_period_end * 1000).toISOString();
  }
  await admin.from("profiles").update(patch).eq("stripe_customer_id", customerId);
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: any;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, WH_SECRET, undefined, cryptoProvider);
  } catch (e) {
    console.error("signature verify failed:", e);
    return new Response("webhook error", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const userId = s.metadata?.user_id || s.client_reference_id;
        const customerId = s.customer as string;
        // user_id と customer を確実に結びつけ、即premium化
        if (userId && customerId) {
          await admin.from("profiles").upsert(
            { user_id: userId, stripe_customer_id: customerId, plan: "premium" },
            { onConflict: "user_id" },
          );
        } else if (customerId) {
          await setPlanByCustomer(customerId, "premium");
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        // premium扱い=active/trialing/past_due(past_dueは支払いリトライ中の猶予でロックしない)
        // free扱い=canceled/unpaid/incomplete_expired/incomplete
        const premium = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
        await setPlanByCustomer(sub.customer as string, premium ? "premium" : "free", sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await setPlanByCustomer(sub.customer as string, "free", sub);
        break;
      }
      case "invoice.payment_failed": {
        // 支払い失敗＝past_due相当。planはpremiumのまま維持(猶予)、状態のみ past_due に更新。
        const inv = event.data.object;
        const customerId = inv.customer as string;
        if (customerId) {
          await admin.from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("stripe_customer_id", customerId);
        }
        console.error("invoice.payment_failed for customer:", customerId);
        break;
      }
    }
  } catch (e) {
    console.error("handler error:", e);
    return new Response("webhook error", { status: 500 });
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
