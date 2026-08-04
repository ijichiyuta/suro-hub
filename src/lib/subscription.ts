"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// 会員プラン。profiles.plan を読む(Stripe連携で更新予定)。行が無ければ free。
export type Plan = "free" | "premium";
const CACHE = "surohub_plan";

function cached(): Plan | null {
  try { const p = localStorage.getItem(CACHE); return p === "premium" || p === "free" ? p : null; } catch { return null; }
}

export function useSubscription(): { plan: Plan; premium: boolean; loading: boolean; loggedIn: boolean } {
  // 認証未設定(PIN/開発時)はゲートしない=premium扱い。設定時は前回の判定をキャッシュから即反映(ちらつき防止)。
  const [plan, setPlan] = useState<Plan>(() => (supabase ? (cached() ?? "free") : "premium"));
  const [loading, setLoading] = useState(!!supabase);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const apply = (p: Plan) => { if (!active) return; setPlan(p); try { localStorage.setItem(CACHE, p); } catch {} };
    const read = async () => {
      const { data: u } = await supabase!.auth.getUser();
      if (!active) return;
      if (!u.user) { setLoggedIn(false); apply("free"); try { localStorage.removeItem(CACHE); } catch {} setLoading(false); return; }
      setLoggedIn(true);
      const { data } = await supabase!.from("profiles").select("plan").eq("user_id", u.user.id).maybeSingle();
      if (!active) return;
      apply((data?.plan as Plan) === "premium" ? "premium" : "free");
      setLoading(false);
    };
    read();
    const { data: sub } = supabase!.auth.onAuthStateChange(() => read());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { plan, premium: plan === "premium", loading, loggedIn };
}
