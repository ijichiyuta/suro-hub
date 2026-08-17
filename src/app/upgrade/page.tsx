"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Check, Crown, Settings, Loader2 } from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import { supabase } from "@/lib/supabase";
import { PRICE_MONTHLY, PRICE_YEARLY, yen } from "@/lib/pricing";
import { BILLING_ENABLED } from "@/lib/billingConfig";
import { startCheckout, openCustomerPortal } from "@/lib/checkout";

const YEARLY_PER_MONTH = Math.round(PRICE_YEARLY / 12);
const YEARLY_OFF = Math.round((1 - PRICE_YEARLY / (PRICE_MONTHLY * 12)) * 100);

// timestamptz → YYYY/MM/DD 表示。
const fmtDate = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

const PERKS = [
  "全機種の狙い目・期待値をフル表示",
  "解析・設定判別データ",
  "大量集計データ",
  "期待値計算ツール",
  "お気に入り・稼働ロガー・メモの端末間同期",
];

export default function Upgrade() {
  const { premium, loggedIn, currentPeriodEnd, cancelAtPeriodEnd } = useSubscription();
  const [busy, setBusy] = useState<"" | "monthly" | "yearly" | "portal">("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [agreed, setAgreed] = useState(false); // 決済前の同意チェック(必須)
  const [waiting, setWaiting] = useState(false); // 購入後の反映待ち(ポーリング中)

  // 決済後のリダイレクト(?checkout=success|cancel)を拾って表示。反映はWebhook経由なので数秒待つ旨も。
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("checkout");
    if (q === "success") { setNotice("ご登録ありがとうございます。反映まで数秒かかる場合があります。"); setWaiting(true); }
    else if (q === "cancel") setNotice("お手続きはキャンセルされました。");
    if (q) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // 反映ポーリング: ?checkout=success 後、profiles.plan を 2秒×最大10回 見て premium になったら再読み込み。
  useEffect(() => {
    if (!waiting || !supabase) return;
    if (premium) { setWaiting(false); return; } // useSubscription 側で既に反映済み
    let active = true;
    let tries = 0;
    const timer = setInterval(async () => {
      if (!active) return;
      tries += 1;
      const { data: u } = await supabase!.auth.getUser();
      if (u.user) {
        const { data } = await supabase!.from("profiles").select("plan").eq("user_id", u.user.id).maybeSingle();
        if ((data?.plan as string) === "premium") { clearInterval(timer); location.reload(); return; }
      }
      if (tries >= 10) { clearInterval(timer); if (active) setWaiting(false); }
    }, 2000);
    return () => { active = false; clearInterval(timer); };
  }, [waiting, premium]);

  const buy = async (plan: "monthly" | "yearly") => {
    if (!agreed) return; // 同意チェック必須(念のため二重ガード)
    setErr(""); setBusy(plan);
    try { await startCheckout(plan); } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); setBusy(""); }
  };
  const portal = async () => {
    setErr(""); setBusy("portal");
    try { await openCustomerPortal(); } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); setBusy(""); }
  };

  return (
    <>
      <header style={{ position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
          <Link href="/" style={{ color: "var(--sub)", display: "flex" }}><ChevronLeft size={24} /></Link>
          <h1 style={{ fontSize: 18 }}>プレミアム</h1>
        </div>
      </header>

      <main className="pad" style={{ paddingTop: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <span style={{ display: "inline-flex", width: 52, height: 52, borderRadius: "50%", background: "var(--blue-tint)", color: "var(--blue)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Crown size={26} /></span>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>プレミアム会員</div>
          <div style={{ color: "var(--sub)", fontSize: 13, marginTop: 4 }}>全機種の狙い目・解析・集計がすべて見放題</div>
        </div>

        {notice && (
          <div style={{ marginBottom: 16, textAlign: "center", fontSize: 13, padding: "12px", background: "var(--blue-tint)", color: "var(--blue)", borderRadius: 8, fontWeight: 700 }}>{notice}</div>
        )}

        <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 18 }}>
          {PERKS.map((p) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
              <Check size={17} style={{ color: "var(--blue)", flex: "none" }} />
              <span style={{ fontSize: 14 }}>{p}</span>
            </div>
          ))}
        </div>

        {premium ? (
          <>
            <div style={{ marginTop: 20, textAlign: "center", color: "var(--green)", fontWeight: 700, fontSize: 14, padding: "14px", background: "var(--green-tint)", borderRadius: 8 }}>
              すでにプレミアム会員です。ありがとうございます！
            </div>
            {currentPeriodEnd && (
              cancelAtPeriodEnd ? (
                <p style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: "var(--sub)", lineHeight: 1.6 }}>
                  {fmtDate(currentPeriodEnd)} まで利用可能（更新停止手続き済み）
                </p>
              ) : (
                <p style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: "var(--sub)" }}>
                  次回更新日: {fmtDate(currentPeriodEnd)}
                </p>
              )
            )}
            {BILLING_ENABLED && (
              <button onClick={portal} disabled={busy === "portal"} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 12, background: "#fff", color: "var(--ink)", border: "1px solid var(--border)", opacity: busy === "portal" ? 0.6 : 1 }}>
                <Settings size={15} />{busy === "portal" ? "読み込み中…" : "サブスクの管理・解約"}
              </button>
            )}
          </>
        ) : (
          <>
            {BILLING_ENABLED && loggedIn && (
              <label style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 18, padding: "13px 14px", border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", fontSize: 12.5, lineHeight: 1.7, color: "var(--ink)" }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 17, height: 17, marginTop: 2, flex: "none", accentColor: "var(--blue)", cursor: "pointer" }} />
                <span>
                  私は20歳以上であり、<Link href="/terms" style={{ color: "var(--blue)" }}>利用規約</Link>・<Link href="/tokushoho" style={{ color: "var(--blue)" }}>特定商取引法に基づく表記</Link>・<Link href="/privacy" style={{ color: "var(--blue)" }}>プライバシーポリシー</Link>に同意します（自動更新される定期課金であることを理解しました）
                </span>
              </label>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <div style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 10, padding: "16px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "var(--sub)", fontWeight: 700 }}>月額プラン</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{yen(PRICE_MONTHLY)}<span style={{ fontSize: 12, color: "var(--light)", fontWeight: 600 }}>/月</span></div>
                {BILLING_ENABLED && loggedIn && (
                  <button onClick={() => buy("monthly")} disabled={!!busy || !agreed || waiting} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 12, background: "#fff", color: "var(--blue)", border: "1px solid var(--blue)", opacity: (busy || !agreed || waiting) ? 0.5 : 1 }}>{busy === "monthly" ? <><Loader2 size={14} className="spin" />移動中…</> : waiting ? "確認中…" : "月額で登録"}</button>
                )}
              </div>
              <div style={{ flex: 1, border: "2px solid var(--blue)", borderRadius: 10, padding: "16px 14px", textAlign: "center", position: "relative", background: "var(--blue-tint)" }}>
                <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "var(--blue)", color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>約{YEARLY_OFF}%お得</span>
                <div style={{ fontSize: 12, color: "var(--blue)", fontWeight: 700 }}>年額プラン</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{yen(PRICE_YEARLY)}<span style={{ fontSize: 12, color: "var(--light)", fontWeight: 600 }}>/年</span></div>
                <div style={{ fontSize: 11, color: "var(--sub)", marginTop: 2 }}>月あたり約{yen(YEARLY_PER_MONTH)}</div>
                {BILLING_ENABLED && loggedIn && (
                  <button onClick={() => buy("yearly")} disabled={!!busy || !agreed || waiting} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 12, opacity: (busy || !agreed || waiting) ? 0.5 : 1 }}>{busy === "yearly" ? <><Loader2 size={14} className="spin" />移動中…</> : waiting ? "確認中…" : "年額で登録"}</button>
                )}
              </div>
            </div>

            {waiting && <p style={{ color: "var(--blue)", fontSize: 12.5, textAlign: "center", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700 }}><Loader2 size={14} className="spin" />反映を確認しています…</p>}
            {busy && <p style={{ color: "var(--sub)", fontSize: 12.5, textAlign: "center", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Loader2 size={14} className="spin" />決済ページを準備しています。少々お待ちください…</p>}
            {err && <p style={{ color: "#e5484d", fontSize: 12.5, textAlign: "center", marginTop: 12 }}>{err}</p>}

            {!BILLING_ENABLED && (
              <>
                <button className="btn" disabled style={{ width: "100%", justifyContent: "center", marginTop: 16, opacity: 0.6 }}>
                  決済は準備中です（近日公開）
                </button>
                <p style={{ color: "var(--light)", fontSize: 12, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
                  オンライン決済は現在準備中です。開始までお待ちください。
                </p>
              </>
            )}
            {BILLING_ENABLED && !loggedIn && (
              <p style={{ color: "var(--light)", fontSize: 12, textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
                ログインするとアップグレードできます。
              </p>
            )}
          </>
        )}

        <div style={{ marginTop: 26, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", fontSize: 12 }}>
          <Link href="/terms" style={{ color: "var(--sub)" }}>利用規約</Link>
          <Link href="/tokushoho" style={{ color: "var(--sub)" }}>特定商取引法に基づく表記</Link>
          <Link href="/privacy" style={{ color: "var(--sub)" }}>プライバシーポリシー</Link>
        </div>
      </main>
    </>
  );
}
