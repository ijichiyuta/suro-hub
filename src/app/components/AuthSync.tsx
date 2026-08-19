"use client";
import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { captureRefFromUrl, applyPendingRef } from "@/lib/referral";

// Supabaseのアクセストークンを cookie "sblab" に同期。
//   Cloudflare Pages Function(_middleware) が有料データ(/data/spec/*・/calc/*.html)の会員判定に使う。
//   fetch/iframe は同一オリジンで cookie を自動送信するため、取得側の改修は不要。
function writeCookie(session: Session | null) {
  if (typeof document === "undefined") return;
  if (session?.access_token) {
    const secs = session.expires_at ? Math.max(60, session.expires_at - Math.floor(Date.now() / 1000)) : 3600;
    document.cookie = `sblab=${encodeURIComponent(session.access_token)}; path=/; max-age=${secs}; SameSite=Lax; Secure`;
  } else {
    document.cookie = "sblab=; path=/; max-age=0; SameSite=Lax; Secure";
  }
}

export default function AuthSync() {
  useEffect(() => {
    // ランディング時に ?ref=CODE を localStorage へ退避（cookie 同期とは独立・必ず1回走る）。
    captureRefFromUrl();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => writeCookie(data.session));
    // ログイン/登録が確立したら退避済みの紹介コードを1回だけ紐付け（重複呼び出し防止）。
    let refApplied = false;
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      writeCookie(s);
      if (e === "SIGNED_IN" && s && !refApplied) {
        refApplied = true;
        applyPendingRef().catch(() => {});
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}
