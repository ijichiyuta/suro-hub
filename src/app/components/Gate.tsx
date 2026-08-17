"use client";
import { usePathname } from "next/navigation";
import { AUTH_CONFIGURED, LOGIN_REQUIRED } from "@/lib/authConfig";
import AuthGate from "./AuthGate";
import PinGate from "./PinGate";

// 法務ページ(利用規約/特商法/プライバシー)はログイン前でも閲覧可能にする。
const PUBLIC = /^\/(terms|tokushoho|privacy)(\/|$)/;

// Supabase設定済み＋ログイン必須ONなら会員ログイン(公開登録・20歳以上)、それ以外は簡易PIN(0807)。
export default function Gate({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  if (PUBLIC.test(path)) return <>{children}</>;
  if (AUTH_CONFIGURED && LOGIN_REQUIRED) return <AuthGate>{children}</AuthGate>;
  return <PinGate>{children}</PinGate>;
}
