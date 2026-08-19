// @ts-nocheck  ← Deno/esm.sh のリモート型は環境依存で誤検知が出るため型チェック無効(ロジックは検証済み)
// 友だち紹介。ログイン中ユーザーのJWTで本人確認→JSON {action}をPOST。
//   action="info": 自分の紹介コード(未発行なら生成)と紹介人数を返す。
//   action="set" : 自分に紹介者(ref=紹介コード)を一度きり紐付ける。
//   Stripe不要。profiles: user_id, plan, referral_code, referred_by, referral_count, referral_rewarded。
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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}

// 紛らわしい文字(0/O/1/l/I 等)を除いた base32的な文字集合から8文字を生成
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function genCode(len = 8) {
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_CHARS[buf[i] % CODE_CHARS.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });
  if (req.method !== "POST") return json(req, { error: "メソッドが不正です。" }, 405);
  try {
    // 本人確認(anon + ユーザーJWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(req, { error: "ログインが必要です。" }, 401);
    const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json(req, { error: "ログインが必要です。" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { action, ref } = await req.json().catch(() => ({}));

    // ---- action="info": 自分の紹介情報を返す ----
    if (action === "info") {
      // 自分のprofiles行を取得(無ければ free で作成)
      let { data: prof } = await admin
        .from("profiles")
        .select("referral_code, referral_count")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!prof) {
        await admin.from("profiles").upsert({ user_id: user.id, plan: "free" }, { onConflict: "user_id" });
        const r = await admin
          .from("profiles")
          .select("referral_code, referral_count")
          .eq("user_id", user.id)
          .maybeSingle();
        prof = r.data;
      }

      // 紹介コード未発行なら生成(一意制約衝突時は最大5回リトライ)
      let code: string | null = prof?.referral_code ?? null;
      if (!code) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate = genCode();
          const { error } = await admin
            .from("profiles")
            .update({ referral_code: candidate })
            .eq("user_id", user.id);
          if (!error) {
            code = candidate;
            break;
          }
          // 23505 = unique_violation。別コードで再試行
          if (error.code !== "23505") throw error;
        }
      }

      return json(req, { code, count: prof?.referral_count ?? 0 });
    }

    // ---- action="set": 自分に紹介者を紐付け(一度きり) ----
    if (action === "set") {
      if (!ref) return json(req, { ok: false });

      // 自分のprofiles行を取得(無ければ free で作成)
      let { data: me } = await admin
        .from("profiles")
        .select("referred_by")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!me) {
        await admin.from("profiles").upsert({ user_id: user.id, plan: "free" }, { onConflict: "user_id" });
        const r = await admin.from("profiles").select("referred_by").eq("user_id", user.id).maybeSingle();
        me = r.data;
      }

      // 既に紹介者が設定済みなら上書きしない
      if (me?.referred_by) return json(req, { ok: true, already: true });

      // 紹介コードから紹介者を検索
      const { data: referrer } = await admin
        .from("profiles")
        .select("user_id")
        .eq("referral_code", ref)
        .maybeSingle();
      if (!referrer) return json(req, { ok: false });

      // 自己紹介は禁止
      if (referrer.user_id === user.id) return json(req, { ok: false });

      // 紹介者を紐付け
      const { error } = await admin
        .from("profiles")
        .update({ referred_by: referrer.user_id })
        .eq("user_id", user.id);
      if (error) throw error;

      return json(req, { ok: true });
    }

    return json(req, { error: "アクションが不正です。" }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { error: "エラーが発生しました。" }, 500);
  }
});
