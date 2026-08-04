"use client";
import Link from "next/link";
import { ChevronLeft, Check, Crown } from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import { PRICE_MONTHLY, PRICE_YEARLY, yen } from "@/lib/pricing";

const YEARLY_PER_MONTH = Math.round(PRICE_YEARLY / 12);
const YEARLY_OFF = Math.round((1 - PRICE_YEARLY / (PRICE_MONTHLY * 12)) * 100);

const PERKS = [
  "全機種の狙い目・期待値をフル表示",
  "解析・設定判別データ",
  "大量集計データ",
  "期待値計算ツール",
  "お気に入り・稼働ロガー・メモの端末間同期",
];

export default function Upgrade() {
  const { premium, loggedIn } = useSubscription();
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

        <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 18 }}>
          {PERKS.map((p) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
              <Check size={17} style={{ color: "var(--blue)", flex: "none" }} />
              <span style={{ fontSize: 14 }}>{p}</span>
            </div>
          ))}
        </div>

        {premium ? (
          <div style={{ marginTop: 20, textAlign: "center", color: "var(--green)", fontWeight: 700, fontSize: 14, padding: "14px", background: "var(--green-tint)", borderRadius: 8 }}>
            すでにプレミアム会員です。ありがとうございます！
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <div style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 10, padding: "16px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "var(--sub)", fontWeight: 700 }}>月額プラン</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{yen(PRICE_MONTHLY)}<span style={{ fontSize: 12, color: "var(--light)", fontWeight: 600 }}>/月</span></div>
              </div>
              <div style={{ flex: 1, border: "2px solid var(--blue)", borderRadius: 10, padding: "16px 14px", textAlign: "center", position: "relative", background: "var(--blue-tint)" }}>
                <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "var(--blue)", color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>約{YEARLY_OFF}%お得</span>
                <div style={{ fontSize: 12, color: "var(--blue)", fontWeight: 700 }}>年額プラン</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{yen(PRICE_YEARLY)}<span style={{ fontSize: 12, color: "var(--light)", fontWeight: 600 }}>/年</span></div>
                <div style={{ fontSize: 11, color: "var(--sub)", marginTop: 2 }}>月あたり約{yen(YEARLY_PER_MONTH)}</div>
              </div>
            </div>
            <button className="btn" disabled style={{ width: "100%", justifyContent: "center", marginTop: 16, opacity: 0.6 }}>
              決済は準備中です（近日公開）
            </button>
            <p style={{ color: "var(--light)", fontSize: 12, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
              {loggedIn ? "オンライン決済は現在準備中です。開始までお待ちください。" : "ログインするとアップグレードできます。"}
            </p>
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
