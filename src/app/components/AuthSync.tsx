"use client";
import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => writeCookie(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => writeCookie(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}
