"use client";
// 友だち紹介のフロントヘルパー。
//   紹介リンク https://smasuro-lab.com/?ref=CODE を踏んだ人の CODE を localStorage に退避し、
//   ログイン/登録が確立したタイミングで Edge Function `referral` に紐付けを依頼する。
import { supabase } from "./supabase";
import { SUPABASE_URL } from "./authConfig";

const REF_KEY = "surohub_ref";

// 英数字のみ許可(サニタイズ)。上限も念のため設ける。
const sanitize = (raw: string | null): string => (raw || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 64);

// checkout.ts の callFn と同じ流儀（session.access_token を Bearer で）。
async function callReferral<T = unknown>(body: unknown): Promise<T> {
  if (!supabase) throw new Error("未設定です。");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です。");
  const res = await fetch(`${SUPABASE_URL}/functions/v1/referral`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "エラーが発生しました。時間をおいて再度お試しください。");
  return data as T;
}

// ランディング時に URL の ?ref=CODE を検知して localStorage に退避（既に保存済みなら上書きしない）。
export function captureRefFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(REF_KEY)) return; // 既存を優先
    const code = sanitize(new URLSearchParams(window.location.search).get("ref"));
    if (code) localStorage.setItem(REF_KEY, code);
  } catch {}
}

// 退避済みの紹介コードを取得。
export function getPendingRef(): string | null {
  if (typeof window === "undefined") return null;
  try { return sanitize(localStorage.getItem(REF_KEY)) || null; } catch { return null; }
}

// 退避済みの紹介コードをクリア。
export function clearPendingRef(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(REF_KEY); } catch {}
}

// 退避済みの紹介コードがあれば紹介者を紐付け（成功/既存どちらでも退避はクリア）。
export async function applyPendingRef(): Promise<void> {
  const ref = getPendingRef();
  if (!ref) return;
  try {
    await callReferral({ action: "set", ref });
  } finally {
    clearPendingRef();
  }
}

// マイページ用: 自分の紹介コードと紹介人数を取得。
export async function fetchReferralInfo(): Promise<{ code: string; count: number }> {
  return callReferral<{ code: string; count: number }>({ action: "info" });
}
