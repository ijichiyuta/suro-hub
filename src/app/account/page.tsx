"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Crown, LogOut, KeyRound, RefreshCw, Mail, Settings, Check, Trash2, Gift, Copy, Share2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/lib/subscription";
import { BILLING_ENABLED } from "@/lib/billingConfig";
import { openCustomerPortal } from "@/lib/checkout";
import { fetchReferralInfo } from "@/lib/referral";
import { SUPABASE_URL } from "@/lib/authConfig";

// timestamptz → YYYY/MM/DD 表示。
const fmtDate = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 16 };
const cardHead: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "var(--sub)", padding: "13px 16px 3px" };
const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" };
const rowBtn: React.CSSProperties = { ...row, width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit" };
const topLine: React.CSSProperties = { borderTop: "1px solid var(--line)" };
const label: React.CSSProperties = { flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700 };

export default function Account() {
  const { premium, currentPeriodEnd, cancelAtPeriodEnd } = useSubscription();
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [ref, setRef] = useState<{ code: string; count: number } | null>(null);
  const [refCopied, setRefCopied] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  // 友だち紹介: 自分の紹介コードと紹介人数を取得（取得失敗時は控えめに非表示）。
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    fetchReferralInfo().then((d) => { if (alive) setRef(d); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const refLink = ref ? `https://smasuro-lab.com/?ref=${ref.code}` : "";
  // 共有メッセージ(LINE/X/Discord等に貼る前提)。特典を明記して踏んでもらいやすく。
  const shareText = "スマスロ・スマパチ300機種以上の狙い目・期待値・天井をまとめた「スマスマ期待値ラボ」📈 このリンクから登録＆課金でお互い1ヶ月分(¥780)無料になります👇";
  const copyRefLink = async () => {
    if (!refLink) return;
    try { await navigator.clipboard.writeText(refLink); setRefCopied(true); setTimeout(() => setRefCopied(false), 1500); } catch {}
  };
  // ネイティブ共有(モバイルはLINE/X等の共有シートへ1タップ)。未対応環境はコピーにフォールバック。
  const shareRefLink = async () => {
    if (!refLink) return;
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (nav && typeof nav.share === "function") {
      try { await nav.share({ title: "スマスマ期待値ラボ", text: shareText, url: refLink }); return; }
      catch { return; } // ユーザーがキャンセル等 → 何もしない
    }
    copyRefLink();
  };

  const provider = (user?.app_metadata?.provider as string) || "email";
  const isEmail = provider === "email";
  const providerLabel = provider === "google" ? "Google" : "メールアドレス";

  const logout = async () => { if (!supabase || !confirm("ログアウトしますか？")) return; await supabase.auth.signOut(); location.href = "/"; };
  const portal = async () => {
    setErr(""); setMsg(""); setBusy("portal");
    try { await openCustomerPortal(); } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); setBusy(""); }
  };
  const changePw = async () => {
    if (!supabase) return;
    setErr(""); setMsg("");
    if (pw.length < 8) { setErr("パスワードは8文字以上で入力してください。"); return; }
    setBusy("pw");
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy("");
    if (error) { setErr("変更できませんでした。時間をおいて再度お試しください。"); return; }
    setMsg("パスワードを変更しました。"); setPw(""); setPwOpen(false);
  };

  // 退会(アカウント削除)。二段確認 → Edge Function を Bearer トークンで叩く → サインアウトしてトップへ。
  const deleteAccount = async () => {
    if (!supabase) return;
    setErr(""); setMsg("");
    const email = user?.email || "";
    if (!confirm("本当にアカウントを削除しますか？\nサブスクは解約され、お気に入り・稼働ログ・メモもすべて消えます。この操作は取り消せません。")) return;
    const answer = prompt(email ? `確認のため、登録メールアドレス「${email}」を入力してください。` : "確認のため「削除」と入力してください。");
    if (answer === null) return;
    const ok = email ? answer.trim() === email : answer.trim() === "削除";
    if (!ok) { setErr("入力が一致しませんでした。削除は中止しました。"); return; }
    setBusy("delete");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("ログインが必要です。");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "エラーが発生しました。時間をおいて再度お試しください。");
      await supabase.auth.signOut();
      location.href = "/";
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e)); setBusy("");
    }
  };

  return (
    <>
      <header style={{ position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
          <Link href="/" style={{ color: "var(--sub)", display: "flex" }}><ChevronLeft size={24} /></Link>
          <h1 style={{ fontSize: 18 }}>マイページ</h1>
        </div>
      </header>

      <main className="pad" style={{ paddingTop: 18, maxWidth: 760 }}>
        {msg && <p style={{ background: "var(--green-tint)", color: "var(--green)", fontWeight: 700, fontSize: 13, textAlign: "center", padding: 12, borderRadius: 8, marginBottom: 14 }}>{msg}</p>}
        {err && <p style={{ color: "#e5484d", fontSize: 13, textAlign: "center", marginBottom: 14 }}>{err}</p>}

        {/* アカウント */}
        <div style={card}>
          <div style={cardHead}>アカウント</div>
          <div style={row}>
            <Mail size={18} style={{ color: "var(--light)", flex: "none" }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 11, color: "var(--light)" }}>メールアドレス</span>
              <span style={{ display: "block", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email || "—"}</span>
            </span>
          </div>
          <div style={{ ...row, ...topLine }}>
            <Settings size={18} style={{ color: "var(--light)", flex: "none" }} />
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 11, color: "var(--light)" }}>ログイン方法</span>
              <span style={{ display: "block", fontSize: 14 }}>{providerLabel}</span>
            </span>
          </div>
        </div>

        {/* プラン・お支払い */}
        <div style={card}>
          <div style={cardHead}>プラン・お支払い</div>
          <div style={row}>
            <Crown size={18} style={{ color: premium ? "var(--blue)" : "var(--light)", flex: "none" }} />
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 11, color: "var(--light)" }}>現在のプラン</span>
              <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: premium ? "var(--blue)" : "var(--ink)" }}>{premium ? "プレミアム会員" : "無料会員"}</span>
              {premium && currentPeriodEnd && (
                cancelAtPeriodEnd ? (
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--sub)", marginTop: 2 }}>{fmtDate(currentPeriodEnd)} まで利用可能（更新停止手続き済み）</span>
                ) : (
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--light)", marginTop: 2 }}>次回更新日: {fmtDate(currentPeriodEnd)}</span>
                )
              )}
            </span>
            {premium && <span style={{ background: cancelAtPeriodEnd ? "var(--line)" : "var(--blue-tint)", color: cancelAtPeriodEnd ? "var(--sub)" : "var(--blue)", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 10, flex: "none" }}>{cancelAtPeriodEnd ? "解約予約中" : "有効"}</span>}
          </div>
          {premium ? (
            BILLING_ENABLED && (
              <button onClick={portal} disabled={busy === "portal"} style={{ ...rowBtn, ...topLine, opacity: busy === "portal" ? 0.6 : 1 }}>
                <RefreshCw size={18} style={{ color: "var(--sub)", flex: "none" }} />
                <span style={label}>{busy === "portal" ? "読み込み中…" : "サブスクの管理・解約・お支払い方法"}</span>
                <ChevronRight size={18} className="chev" />
              </button>
            )
          ) : (
            <Link href="/upgrade" style={{ ...rowBtn, ...topLine, textDecoration: "none" }}>
              <Crown size={18} style={{ color: "var(--blue)", flex: "none" }} />
              <span style={{ ...label, color: "var(--blue)" }}>プレミアムにアップグレード</span>
              <ChevronRight size={18} className="chev" />
            </Link>
          )}
        </div>
        {premium && BILLING_ENABLED && (
          <p style={{ fontSize: 11.5, color: "var(--light)", margin: "-6px 4px 16px", lineHeight: 1.6 }}>
            「サブスクの管理」から、解約・プラン変更・お支払い方法の更新・領収書の確認ができます（Stripeの安全な画面に移動します）。
          </p>
        )}

        {/* 友だち紹介 — 取得成功時のみ表示 */}
        {ref && (
          <>
            <div style={card}>
              <div style={cardHead}>友だち紹介</div>
              <div style={{ padding: "10px 16px 4px" }}>
                <span style={{ display: "block", fontSize: 11, color: "var(--light)", marginBottom: 6 }}>あなたの紹介リンク</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input readOnly value={refLink} onFocus={(e) => e.currentTarget.select()}
                    style={{ flex: 1, minWidth: 0, height: 40, padding: "0 12px", fontSize: 13, border: "1px solid var(--border)", borderRadius: 6, outline: "none", background: "var(--bg-soft)", color: "var(--ink)" }} />
                  <button onClick={copyRefLink} className="btn ghost" style={{ width: "auto", padding: "0 14px", height: 40, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                    {refCopied ? <><Check size={14} />コピー済</> : <><Copy size={14} />コピー</>}
                  </button>
                </div>
                {/* ネイティブ共有: LINE/X/Discord等へ1タップ(未対応環境はコピー) */}
                <button onClick={shareRefLink} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 10, gap: 7 }}>
                  <Share2 size={16} />友だちに共有する
                </button>
              </div>
              <div style={{ ...row, ...topLine, marginTop: 10 }}>
                <Gift size={18} style={{ color: "var(--blue)", flex: "none" }} />
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--light)" }}>これまでの紹介</span>
                  <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>{ref.count}人</span>
                </span>
              </div>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--light)", margin: "-6px 4px 16px", lineHeight: 1.6 }}>
              紹介した方・された方の双方に、紹介された方が課金したタイミングで1ヶ月分（¥780）が無料になります。
            </p>
          </>
        )}

        {/* 設定 */}
        <div style={card}>
          <div style={cardHead}>設定</div>
          {isEmail ? (
            <>
              <button onClick={() => { setPwOpen(!pwOpen); setErr(""); }} style={rowBtn}>
                <KeyRound size={18} style={{ color: "var(--sub)", flex: "none" }} />
                <span style={label}>パスワードを変更</span>
                <ChevronRight size={18} className="chev" style={{ transform: pwOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
              </button>
              {pwOpen && (
                <div style={{ padding: "0 16px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="新しいパスワード(8文字以上)"
                    style={{ flex: 1, height: 40, padding: "0 12px", fontSize: 14, border: "1px solid var(--border)", borderRadius: 6, outline: "none" }} />
                  <button onClick={changePw} disabled={busy === "pw"} className="btn" style={{ width: "auto", padding: "0 16px", height: 40, opacity: busy === "pw" ? 0.6 : 1 }}>{busy === "pw" ? "…" : "変更"}</button>
                </div>
              )}
            </>
          ) : (
            <div style={row}>
              <KeyRound size={18} style={{ color: "var(--light)", flex: "none" }} />
              <span style={{ flex: 1, fontSize: 13, color: "var(--sub)" }}>Googleログインのため、パスワードはGoogle側で管理されます。</span>
            </div>
          )}
          <div style={{ ...row, ...topLine }}>
            <RefreshCw size={18} style={{ color: "var(--light)", flex: "none" }} />
            <span style={{ flex: 1, fontSize: 13, color: "var(--sub)", lineHeight: 1.6 }}>お気に入り・稼働ログ・メモは、ログイン中の端末間で自動同期されます。</span>
            <Check size={16} style={{ color: "var(--green)", flex: "none" }} />
          </div>
        </div>

        {/* ログアウト */}
        <button onClick={logout} style={{ ...rowBtn, border: "1px solid var(--border)", borderRadius: 12, color: "#e5484d", marginBottom: 20 }}>
          <LogOut size={18} style={{ flex: "none" }} />
          <span style={label}>ログアウト</span>
        </button>

        {/* 退会(アカウント削除) — 危険操作として控えめに配置 */}
        <div style={{ marginTop: 8, marginBottom: 24 }}>
          <button onClick={deleteAccount} disabled={busy === "delete"} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", color: "var(--light)", fontSize: 12.5, padding: "6px 4px", opacity: busy === "delete" ? 0.6 : 1 }}>
            <Trash2 size={15} style={{ flex: "none" }} />
            <span>{busy === "delete" ? "削除しています…" : "アカウントを削除（退会）"}</span>
          </button>
          <p style={{ fontSize: 11, color: "var(--light)", margin: "4px 4px 0", lineHeight: 1.6 }}>
            退会するとサブスクは解約され、お気に入り・稼働ログ・メモもすべて削除されます。この操作は取り消せません。
          </p>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", fontSize: 12, paddingBottom: 40 }}>
          <Link href="/terms" style={{ color: "var(--light)" }}>利用規約</Link>
          <Link href="/tokushoho" style={{ color: "var(--light)" }}>特定商取引法に基づく表記</Link>
          <Link href="/privacy" style={{ color: "var(--light)" }}>プライバシーポリシー</Link>
        </div>
      </main>
    </>
  );
}
