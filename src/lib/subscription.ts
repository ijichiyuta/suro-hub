"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// 会員プラン。profiles.plan を読む(Stripe連携で更新予定)。行が無ければ free。
export type Plan = "free" | "premium";
const CACHE = "surohub_plan";

function cached(): Plan | null {
  try { const p = localStorage.getItem(CACHE); return p === "premium" || p === "free" ? p : null; } catch { return null; }
}

export function useSubscription(): { plan: Plan; premium: boolean; loading: boolean; loggedIn: boolean; subscriptionStatus: string | null; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } {
  // 認証未設定(PIN/開発時)はゲートしない=premium扱い。設定時は前回の判定をキャッシュから即反映(ちらつき防止)。
  const [plan, setPlan] = useState<Plan>(() => (supabase ? (cached() ?? "free") : "premium"));
  const [loading, setLoading] = useState(!!supabase);
  const [loggedIn, setLoggedIn] = useState(false);
  // 状態・次回更新日・解約予約は表示専用(キャッシュせず毎回取得)。
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const apply = (p: Plan) => { if (!active) return; setPlan(p); try { localStorage.setItem(CACHE, p); } catch {} };
    const read = async () => {
      const { data: u } = await supabase!.auth.getUser();
      if (!active) return;
      if (!u.user) { setLoggedIn(false); apply("free"); setSubscriptionStatus(null); setCurrentPeriodEnd(null); setCancelAtPeriodEnd(false); try { localStorage.removeItem(CACHE); } catch {} setLoading(false); return; }
      setLoggedIn(true);
      const { data } = await supabase!.from("profiles").select("plan, subscription_status, current_period_end, cancel_at_period_end").eq("user_id", u.user.id).maybeSingle();
      if (!active) return;
      apply((data?.plan as Plan) === "premium" ? "premium" : "free");
      setSubscriptionStatus((data?.subscription_status as string) ?? null);
      setCurrentPeriodEnd((data?.current_period_end as string) ?? null);
      setCancelAtPeriodEnd(data?.cancel_at_period_end === true);
      setLoading(false);
    };
    read();
    const { data: sub } = supabase!.auth.onAuthStateChange(() => read());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { plan, premium: plan === "premium", loading, loggedIn, subscriptionStatus, currentPeriodEnd, cancelAtPeriodEnd };
}
