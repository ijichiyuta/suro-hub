"use client";
import Link from "next/link";
import { Lock, Crown } from "lucide-react";

// フルロック(解析/集計など): 内容を隠してアップグレード誘導。
export function PaywallCard({ label = "この内容は会員限定です" }: { label?: string }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "26px 20px", textAlign: "center", background: "var(--bg-soft)" }}>
      <span style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: "var(--blue-tint)", color: "var(--blue)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Lock size={22} /></span>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{label}</div>
      <div style={{ color: "var(--sub)", fontSize: 12.5, marginBottom: 16, lineHeight: 1.6 }}>プレミアム会員なら、全機種の狙い目・解析・大量集計をすべて閲覧できます。</div>
      <Link href="/upgrade" className="btn" style={{ justifyContent: "center" }}><Crown size={16} /> プレミアムにアップグレード</Link>
    </div>
  );
}

// 狙い目の一部プレビュー: 上部だけ見せて下をフェード＋ロック。
export function TeaserGate({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{ position: "relative", maxHeight: 210, overflow: "hidden" }}>
        {children}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 96, background: "linear-gradient(to bottom, rgba(255,255,255,0), #fff)", pointerEvents: "none" }} />
      </div>
      <div style={{ marginTop: 4 }}><PaywallCard label="続きは会員限定です" /></div>
    </div>
  );
}
