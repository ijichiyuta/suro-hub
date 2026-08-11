"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { syncFavorites } from "@/lib/favorites";
import { syncLogs } from "@/lib/logger";
import { syncNotes } from "@/lib/notes";

// ログイン中のみ表示。マイページ(/account)への導線。variant で見た目を切替。
//   ログイン時にお気に入り/稼働ログ/メモをアカウント同期する副作用もここで担う。
export default function AccountButton({ variant = "sidebar" }: { variant?: "sidebar" | "icon" }) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const syncAll = () => { void syncFavorites(); void syncLogs(); void syncNotes(); };
    supabase.auth.getUser().then(({ data }) => { if (data.user) { setEmail(data.user.email ?? null); syncAll(); } });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      setEmail(s?.user?.email ?? null);
      if (e === "SIGNED_IN") syncAll();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabase || !email) return null;

  if (variant === "icon") {
    return (
      <Link href="/account" aria-label="マイページ" title={email}
        style={{ width: 34, height: 34, borderRadius: 4, background: "var(--bg-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sub)" }}>
        <User size={17} />
      </Link>
    );
  }
  return (
    <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
      <Link href="/account"
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 6, color: "var(--sub)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
        <User size={18} style={{ flex: "none" }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14 }}>マイページ</span>
          <span style={{ display: "block", fontSize: 11, color: "var(--light)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
        </span>
      </Link>
    </div>
  );
}
