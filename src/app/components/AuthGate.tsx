"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Supabase ログインゲート(招待制＝限定共有)。ログイン中のみ子(アプリ)を表示。
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  if (session) return <>{children}</>;

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setErr(""); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) setErr("メールアドレスまたはパスワードが正しくありません。");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontWeight: 800, fontSize: 21, letterSpacing: "-0.02em" }}>スマスマ期待値ラボ</div>
          <div style={{ color: "var(--light)", fontSize: 13, marginTop: 6 }}>ログインしてください</div>
        </div>
        <form onSubmit={login}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--sub)", marginBottom: 6 }}>メールアドレス</label>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            style={inputStyle} placeholder="you@example.com" />
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--sub)", margin: "16px 0 6px" }}>パスワード</label>
          <input type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)}
            style={inputStyle} placeholder="••••••••" />
          {err && <p style={{ color: "#e5484d", fontSize: 12.5, marginTop: 12, marginBottom: 0 }}>{err}</p>}
          <button type="submit" disabled={busy} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 22, opacity: busy ? 0.6 : 1 }}>
            {busy ? "確認中…" : "ログイン"}
          </button>
        </form>
        <p style={{ color: "var(--light)", fontSize: 12, textAlign: "center", marginTop: 22, lineHeight: 1.6 }}>
          招待制です。アクセスをご希望の方は管理者にご連絡ください。
        </p>
        <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", fontSize: 11.5 }}>
          <Link href="/terms" style={{ color: "var(--light)" }}>利用規約</Link>
          <Link href="/tokushoho" style={{ color: "var(--light)" }}>特定商取引法に基づく表記</Link>
          <Link href="/privacy" style={{ color: "var(--light)" }}>プライバシーポリシー</Link>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 46, padding: "0 14px", fontSize: 15,
  border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "#fff", color: "var(--ink)", outline: "none",
};
