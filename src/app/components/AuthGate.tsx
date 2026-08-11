"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Landing from "./Landing";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Supabase 認証ゲート(公開登録・有料会員制)。ログイン中のみ子(アプリ)を表示。
//   誰でも登録可(Google / メール+パスワード)。アプリ内で課金してプレミアムになると全コンテンツ閲覧可。
//   未ログインは Landing(LP) を表示。
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showLogin, setShowLogin] = useState(false); // 未ログイン時: false=LP表示 / true=認証フォーム

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    // OAuth 失敗のエラーをリダイレクトURLから拾って表示し、URLを掃除。
    if (typeof window !== "undefined") {
      const raw = (window.location.hash?.slice(1) || window.location.search?.slice(1) || "");
      if (raw) {
        const p = new URLSearchParams(raw);
        const oerr = p.get("error_description") || p.get("error");
        if (oerr) { setErr("ログインに失敗しました。時間をおいて再度お試しください。"); setShowLogin(true); window.history.replaceState(null, "", window.location.pathname); }
      }
    }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  if (session) return <>{children}</>;
  if (!showLogin) return <Landing onLogin={() => { setMode("login"); setShowLogin(true); }} onSignup={() => { setMode("signup"); setShowLogin(true); }} />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setErr(""); setNotice(""); setBusy(true);
    if (mode === "signup") {
      if (pw.length < 4) { setErr("パスワードは4文字以上で入力してください。"); setBusy(false); return; }
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pw });
      setBusy(false);
      if (error) { setErr(/registered|already/i.test(error.message) ? "このメールアドレスは登録済みです。ログインしてください。" : "登録できませんでした。時間をおいて再度お試しください。"); return; }
      if (!data.session) setNotice("確認メールを送信しました。メール内のリンクで登録を完了してください。");
      // data.session がある場合は onAuthStateChange でアプリへ。
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
      setBusy(false);
      if (error) setErr("メールアドレスまたはパスワードが正しくありません。");
    }
  };

  const google = async () => {
    if (!supabase) return;
    setErr(""); setNotice(""); setBusy(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}${BASE}/` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) { setBusy(false); setErr("Googleログインを開始できませんでした。時間をおいて再度お試しください。"); }
  };

  const isSignup = mode === "signup";
  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <button onClick={() => { setShowLogin(false); setErr(""); setNotice(""); }} style={{ background: "none", border: "none", color: "var(--sub)", fontSize: 13, padding: 0, marginBottom: 18, cursor: "pointer" }}>← 戻る</button>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontWeight: 800, fontSize: 21, letterSpacing: "-0.02em" }}>スマスマ期待値ラボ</div>
          <div style={{ color: "var(--light)", fontSize: 13, marginTop: 6 }}>{isSignup ? "アカウントを新規作成" : "ログイン"}</div>
        </div>

        <button type="button" onClick={google} disabled={busy}
          style={{ width: "100%", height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 700, color: "var(--ink)", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          <GoogleMark />
          Googleで{isSignup ? "登録" : "ログイン"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--light)" }}>または</span>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <form onSubmit={submit}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--sub)", marginBottom: 6 }}>メールアドレス</label>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            style={inputStyle} placeholder="you@example.com" />
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--sub)", margin: "16px 0 6px" }}>パスワード{isSignup && "（4文字以上）"}</label>
          <input type="password" autoComplete={isSignup ? "new-password" : "current-password"} required value={pw} onChange={(e) => setPw(e.target.value)}
            style={inputStyle} placeholder="••••••••" />
          {err && <p style={{ color: "#e5484d", fontSize: 12.5, marginTop: 12, marginBottom: 0 }}>{err}</p>}
          {notice && <p style={{ color: "var(--green)", fontSize: 12.5, marginTop: 12, marginBottom: 0, fontWeight: 700 }}>{notice}</p>}
          <button type="submit" disabled={busy} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 22, opacity: busy ? 0.6 : 1 }}>
            {busy ? "処理中…" : isSignup ? "登録する" : "ログイン"}
          </button>
        </form>

        <p style={{ color: "var(--sub)", fontSize: 12.5, textAlign: "center", marginTop: 20 }}>
          {isSignup ? "すでにアカウントをお持ちですか？ " : "アカウントをお持ちでない方は "}
          <button onClick={() => { setMode(isSignup ? "login" : "signup"); setErr(""); setNotice(""); }} style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: 0 }}>
            {isSignup ? "ログイン" : "新規登録"}
          </button>
        </p>
        <p style={{ color: "var(--light)", fontSize: 11.5, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
          登録は無料です。全機能の閲覧にはプレミアム（月額プラン）へのご登録が必要です。
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
