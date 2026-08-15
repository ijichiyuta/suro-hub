"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Landing from "./Landing";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// 収録機種のサムネイル(すろらぼ画像)。左パネルで網羅性を見せる素材。
const MINI = [
  "https://media.slolaboratory.com/wp-content/uploads/2025/12/25005811/ltensei-t.png",
  "https://media.slolaboratory.com/wp-content/uploads/2026/03/29235119/lmilliomgod-t.png",
  "https://slolaboratory.com/wp-content/uploads/2023/06/karakuri-t.png",
  "https://slolaboratory.com/wp-content/uploads/2025/01/tghoul-t.png",
  "https://slolaboratory.com/wp-content/uploads/2024/04/lseiya-t.png",
  "https://slolaboratory.com/wp-content/uploads/2025/10/18183555/vvv2-t.png",
  "https://slolaboratory.com/wp-content/uploads/2024/06/goder-t.png",
];
const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.visibility = "hidden"; };

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
  const [showEmail, setShowEmail] = useState(false); // Google主導。メールは「その他の方法」で展開
  const [processing, setProcessing] = useState(false); // OAuthコールバック処理中(この間はLPを出さない)

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    let cancelled = false;
    // OAuthコールバック検知: PKCEは ?code=、implicit(旧)は #access_token=、失敗時は error=。
    const loc = typeof window !== "undefined" ? window.location : null;
    const params = new URLSearchParams((loc?.hash?.slice(1) || "") || (loc?.search?.slice(1) || ""));
    const oerr = params.get("error_description") || params.get("error");
    const isCallback = !!(params.get("code") || params.get("access_token") || oerr);
    // 失敗コールバック: フォームにエラー表示＋URL掃除。成功コールバック: 処理中はスピナー(LPを出さない)。
    if (oerr) { setErr("ログインに失敗しました。時間をおいて再度お試しください。"); setShowLogin(true); if (loc) window.history.replaceState(null, "", loc.pathname); }
    else if (isCallback) setProcessing(true);

    // detectSessionInUrl が code を交換し終えるのを getSession が待つ。完了後にURLを掃除。
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session); setReady(true);
      if (isCallback && !oerr) {
        setProcessing(false);
        if (loc && (loc.search || loc.hash)) window.history.replaceState(null, "", loc.pathname); // 交換済みcode/tokenを除去(リロード再処理防止)
        if (!data.session) { setShowLogin(true); setErr("ログインを完了できませんでした。もう一度お試しください。"); }
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (!cancelled) setSession(s); });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  if (session) return <>{children}</>;
  if (!ready || processing) return <AuthSpinner />; // 初期化中/コールバック処理中はLPを出さない
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
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#fff" }}>
      <div className="auth-split">
        {/* 左: 説明パネル(PCのみ)。上=ブランド / 中=コピー+チェックリスト / 下=収録機種 で縦を埋める */}
        <div className="auth-left">
          {/* アクセントは1点だけ(装飾過多を避ける) */}
          <span aria-hidden style={{ position: "absolute", top: -140, right: -90, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(43,108,255,0.4), transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em" }}>スマスマ期待値ラボ</div>

          <div style={{ position: "relative" }}>
            <div className="balance" style={{ fontWeight: 800, fontSize: "clamp(27px, 3vw, 36px)", lineHeight: 1.32, letterSpacing: "-0.02em" }}>打つ前に、勝てる台か<br />ひと目でわかる。</div>
            <p style={{ marginTop: 16, fontSize: 14.5, lineHeight: 1.85, color: "rgba(255,255,255,0.82)", maxWidth: 400 }}>スマスロ・スマパチ300機種以上の狙い目・期待値・解析を、1機種1ページに整理。ホールで開いてすぐ判断できます。</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 26 }}>
              {["全機種の狙い目・期待値をフル表示", "解析・設定判別・大量集計データ", "期待値シミュレーター・稼働ロガー", "お気に入り・メモを端末間で同期"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>
                  <span style={{ display: "inline-flex", width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", flex: "none" }}><Check size={14} /></span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.02em", marginBottom: 12 }}>北斗・ミリオンゴッド・カバネリなど話題の機種を収録</div>
            <div style={{ display: "flex", gap: 8 }}>
              {MINI.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" loading="lazy" onError={hideOnError} style={{ width: 46, height: 46, objectFit: "contain", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 4, flex: "none" }} />
              ))}
            </div>
          </div>
        </div>
        {/* 右: 認証フォーム */}
        <div className="auth-right">
          <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
            <button onClick={() => { setShowLogin(false); setErr(""); setNotice(""); }} style={{ background: "none", border: "none", color: "var(--sub)", fontSize: 13, padding: 0, marginBottom: 22, cursor: "pointer" }}>← 戻る</button>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>{isSignup ? "アカウント作成" : "ログイン"}</div>
              <div style={{ color: "var(--light)", fontSize: 13, marginTop: 6 }}>{isSignup ? "無料で登録して始めましょう。" : "スマスマ期待値ラボへようこそ。"}</div>
            </div>

        <button type="button" onClick={google} disabled={busy}
          style={{ width: "100%", height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 15, fontWeight: 700, color: "var(--ink)", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          <GoogleMark />
          Googleで{isSignup ? "登録" : "ログイン"}
        </button>

        {err && <p style={{ color: "#e5484d", fontSize: 12.5, textAlign: "center", marginTop: 14, marginBottom: 0 }}>{err}</p>}
        {notice && <p style={{ color: "var(--green)", fontSize: 12.5, textAlign: "center", marginTop: 14, marginBottom: 0, fontWeight: 700 }}>{notice}</p>}

        {!showEmail ? (
          <button type="button" onClick={() => { setShowEmail(true); setErr(""); setNotice(""); }}
            style={{ width: "100%", background: "none", border: "none", color: "var(--sub)", fontSize: 12.5, fontWeight: 700, marginTop: 18, cursor: "pointer", padding: 6 }}>
            メールアドレスで{isSignup ? "登録" : "ログイン"}
          </button>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
              <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 12, color: "var(--light)" }}>メールアドレス</span>
              <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
            <form onSubmit={submit}>
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="メールアドレス" />
              <input type="password" autoComplete={isSignup ? "new-password" : "current-password"} required value={pw} onChange={(e) => setPw(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder={isSignup ? "パスワード（4文字以上）" : "パスワード"} />
              <button type="submit" disabled={busy} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 14, opacity: busy ? 0.6 : 1 }}>
                {busy ? "処理中…" : isSignup ? "メールで登録" : "ログイン"}
              </button>
            </form>
            <p style={{ color: "var(--sub)", fontSize: 12.5, textAlign: "center", marginTop: 16 }}>
              {isSignup ? "すでにアカウントをお持ちですか？ " : "アカウントをお持ちでない方は "}
              <button onClick={() => { setMode(isSignup ? "login" : "signup"); setErr(""); setNotice(""); }} style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: 0 }}>
                {isSignup ? "ログイン" : "新規登録"}
              </button>
            </p>
          </>
        )}
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

// 初期化中/OAuthコールバック処理中の全画面ローディング(この間LPを出さない=ちらつき/誤バウンス防止)。
function AuthSpinner() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <span className="spin" style={{ width: 30, height: 30, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--blue)", display: "block" }} />
      <span style={{ color: "var(--light)", fontSize: 13 }}>ログイン処理中…</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 46, padding: "0 14px", fontSize: 15,
  border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "#fff", color: "var(--ink)", outline: "none",
};
