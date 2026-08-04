"use client";
import { AUTH_CONFIGURED, LOGIN_REQUIRED } from "@/lib/authConfig";
import AuthGate from "./AuthGate";
import PinGate from "./PinGate";

// Supabase設定済み＋ログイン必須ONなら会員ログイン(招待制)、それ以外は簡易PIN(0807)。
export default function Gate({ children }: { children: React.ReactNode }) {
  if (AUTH_CONFIGURED && LOGIN_REQUIRED) return <AuthGate>{children}</AuthGate>;
  return <PinGate>{children}</PinGate>;
}
