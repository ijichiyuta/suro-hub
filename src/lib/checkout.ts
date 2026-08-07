"use client";
// Stripe決済フロントヘルパー。Supabase Edge Function を叩いてCheckout/顧客ポータルへ遷移。
import { supabase } from "./supabase";
import { SUPABASE_URL } from "./authConfig";

async function callFn(name: string, body: unknown): Promise<{ url?: string; error?: string }> {
  if (!supabase) throw new Error("未設定です。");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です。");
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "エラーが発生しました。時間をおいて再度お試しください。");
  return data;
}

// プランを選んで決済ページへ。成功/キャンセルは /upgrade/ に戻る。
export async function startCheckout(plan: "monthly" | "yearly"): Promise<void> {
  const { url } = await callFn("create-checkout", { plan });
  if (url) window.location.href = url;
}

// サブスクの管理(プラン変更・解約・支払い方法)ページへ。
export async function openCustomerPortal(): Promise<void> {
  const { url } = await callFn("customer-portal", {});
  if (url) window.location.href = url;
}
