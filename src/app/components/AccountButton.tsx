"use client";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { syncFavorites } from "@/lib/favorites";
import { syncLogs } from "@/lib/logger";

// ログイン中のみ表示するアカウント/ログアウト。variant で見た目を切替。
export default function AccountButton({ variant = "sidebar" }: { variant?: "sidebar" | "icon" }) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => { if (data.user) { setEmail(data.user.email ?? null); void syncFavorites(); void syncLogs(); } });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      setEmail(s?.user?.email ?? null);
      if (e === "SIGNED_IN") { void syncFavorites(); void syncLogs(); }  // ログイン時にお気に入り/稼働ログをアカウント同期
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabase || !email) return null;

  const logout = async () => {
    if (!confirm("ログアウトしますか？")) return;
    await supabase!.auth.signOut();
  };

  if (variant === "icon") {
    return (
      <button onClick={logout} aria-label="ログアウト" title={`${email} / ログアウト`}
        style={{ width: 34, height: 34, borderRadius: 4, background: "var(--bg-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sub)" }}>
        <LogOut size={17} />
      </button>
    );
  }
  return (
    <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
      <div style={{ fontSize: 11.5, color: "var(--light)", padding: "0 12px 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
      <button onClick={logout}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 6, border: "none", background: "none", color: "var(--sub)", fontWeight: 700, fontSize: 14 }}>
        <LogOut size={18} /> ログアウト
      </button>
    </div>
  );
}
