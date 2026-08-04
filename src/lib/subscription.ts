"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// 会員プラン。profiles.plan を読む(Stripe連携で更新予定)。行が無ければ free。
export type Plan = "free" | "premium";

export function useSubscription(): { plan: Plan; premium: boolean; loading: boolean; loggedIn: boolean } {
  // 認証未設定(PIN/開発時)はゲートしない=premium扱い。
  const [plan, setPlan] = useState<Plan>(supabase ? "free" : "premium");
  const [loading, setLoading] = useState(!!supabase);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const read = async () => {
      const { data: u } = await supabase!.auth.getUser();
      if (!active) return;
      if (!u.user) { setLoggedIn(false); setPlan("free"); setLoading(false); return; }
      setLoggedIn(true);
      const { data } = await supabase!.from("profiles").select("plan").eq("user_id", u.user.id).maybeSingle();
      if (!active) return;
      setPlan((data?.plan as Plan) === "premium" ? "premium" : "free");
      setLoading(false);
    };
    read();
    const { data: sub } = supabase!.auth.onAuthStateChange(() => read());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { plan, premium: plan === "premium", loading, loggedIn };
}
