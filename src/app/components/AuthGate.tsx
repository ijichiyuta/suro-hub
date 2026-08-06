"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Supabase ログインゲート(招待制＝限定共有)。ログイン中のみ子(アプリ)を表示。
//   認証方式: ①Google OAuth ②メール+パスワード。どちらも招待メール(allowed_emails)のみ許可。
//   招待の担保: auth.users INSERT トリガー(enforce_invite_only)＝招待外は登録拒否。
//   さらにアプリ側で is_invited() RPC を二重チェック(招待解除された人を弾く)。
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }

    // OAuth 失敗(招待外など)のエラーをリダイレクトURLから拾って表示し、URLを掃除。
    if (typeof window !== "undefined") {
      const raw = (window.location.hash?.slice(1) || window.location.search?.slice(1) || "");
      if (raw) {
        const p = new URLSearchParams(raw);
        const oerr = p.get("error_description") || p.get("error");
        if (oerr) {
          setErr(/not_invited|saving new user|database error|signups? not allowed/i.test(oerr)
            ? "このGoogleアカウントは招待されていません。アクセスをご希望の方は管理者にご連絡ください。"
            : "ログインに失敗しました。時間をおいて再度お試しください。");
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      // 新規サインイン時のみ招待判定(通常のセッション復元は毎回叩かない=高速)。
      if (event === "SIGNED_IN" && s) {
        try {
          const { data: ok } = await supabase!.rpc("is_invited");
          if (ok === false) {
            setErr("このアカウントは招待されていません。アクセスをご希望の方は管理者にご連絡ください。");
            await supabase!.auth.signOut();
            setSession(null);
            return;
          }
        } catch { /* is_invited 未作成でも auth.users トリガーが本ガード */ }
      }
      setSession(s);
    });
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

  const google = async () => {
    if (!supabase) return;
    setErr(""); setBusy(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}${BASE}/` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) { setBusy(false); setErr("Googleログインを開始できませんでした。時間をおいて再度お試しください。"); }
    // 成功時はGoogleへリダイレクトするので busy のままでよい
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontWeight: 800, fontSize: 21, letterSpacing: "-0.02em" }}>スマスマ期待値ラボ</div>
          <div style={{ color: "var(--light)", fontSize: 13, marginTop: 6 }}>ログインしてください</div>
        </div>

        <button type="button" onClick={google} disabled={busy}
          style={{ width: "100%", height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 700, color: "var(--ink)", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          <GoogleMark />
          Googleでログイン
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--light)" }}>または</span>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
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

// Google のブランドマーク(4色G)。lucide にブランドロゴが無いため公式SVGをインライン。
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flex: "none" }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 46, padding: "0 14px", fontSize: 15,
  border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "#fff", color: "var(--ink)", outline: "none",
};
