import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, AUTH_CONFIGURED } from "./authConfig";

// 未設定なら null(=呼び出し側はPINゲートにフォールバック)。
export const supabase: SupabaseClient | null = AUTH_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "surohub_auth" },
    })
  : null;
