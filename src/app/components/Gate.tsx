"use client";
import { AUTH_CONFIGURED } from "@/lib/authConfig";
import AuthGate from "./AuthGate";
import PinGate from "./PinGate";

// Supabase が設定済みなら会員ログイン(招待制)、未設定なら簡易PIN(0807)にフォールバック。
export default function Gate({ children }: { children: React.ReactNode }) {
  if (AUTH_CONFIGURED) return <AuthGate>{children}</AuthGate>;
  return <PinGate>{children}</PinGate>;
}
