"use client";
import Link from "next/link";
import { useState } from "react";

type M = { name: string; maker: string; isNew?: boolean; sources: ("ev" | "lab")[]; icon: string };

const MACHINES: M[] = [
  { name: "L北斗の拳 転生の章2", maker: "サミー", isNew: true, sources: ["ev", "lab"], icon: "🥊" },
  { name: "L東京喰種", maker: "ロデオ", sources: ["ev", "lab"], icon: "🎭" },
  { name: "スマスロ バジリスク絆2 天膳", maker: "ユニバーサル", sources: ["ev", "lab"], icon: "🥷" },
  { name: "Re:ゼロから始める異世界生活2", maker: "大都技研", isNew: true, sources: ["ev", "lab"], icon: "⏳" },
  { name: "L戦国乙女5", maker: "オリンピア", isNew: true, sources: ["lab"], icon: "⚔️" },
  { name: "スマスロ ゴジラ対エヴァンゲリオン", maker: "ビスティ", sources: ["ev", "lab"], icon: "🦖" },
  { name: "Lゴールデンカムイ", maker: "サミー", sources: ["ev", "lab"], icon: "🐻" },
  { name: "スマスロ 頭文字D", maker: "サミー", sources: ["ev", "lab"], icon: "🏎️" },
];

const FILTERS = ["すべて", "🆕 新台", "★ 保存", "メーカー"];

export default function Home() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("すべて");
  const list = MACHINES.filter((m) => {
    if (q && !m.name.includes(q)) return false;
    if (f === "🆕 新台" && !m.isNew) return false;
    return true;
  });

  return (
    <>
      {/* ヘッダー */}
      <header className="pad" style={{ paddingTop: 18, paddingBottom: 8, position: "sticky", top: 0, background: "#fff", zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ fontSize: 22 }}>機種をさがす</h1>
          <span style={{ width: 38, height: 38, borderRadius: 999, background: "var(--bg-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>👤</span>
        </div>
        <label className="search">
          <span>🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="機種名・読みで検索（例: グール / 北斗）"
            style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 15, color: "var(--ink)" }}
          />
        </label>
        <div className="pills" style={{ marginTop: 12 }}>
          {FILTERS.map((x) => (
            <button key={x} className={"pill" + (f === x ? " on" : "")} onClick={() => setF(x)}>{x}</button>
          ))}
        </div>
      </header>

      {/* 件数 */}
      <div className="pad" style={{ color: "var(--sub)", fontSize: 13, margin: "10px 0 2px" }}>
        {list.length}機種
      </div>

      {/* 機種リスト */}
      <div className="pad">
        {list.map((m) => (
          <Link key={m.name} href="/m/sample" className="row">
            <span className="thumb">{m.icon}</span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                {m.isNew && <i className="badge new" style={{ fontStyle: "normal" }}>新台</i>}
                {m.sources.includes("ev") && <i className="badge blue" style={{ fontStyle: "normal" }}>期待値</i>}
                {m.sources.includes("lab") && <i className="badge" style={{ fontStyle: "normal" }}>研究所</i>}
              </span>
              <span style={{ display: "block", fontWeight: 700, fontSize: 15, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
              <span style={{ display: "block", color: "var(--light)", fontSize: 12.5 }}>{m.maker}</span>
            </span>
            <span className="chev">›</span>
          </Link>
        ))}
        {list.length === 0 && <p style={{ color: "var(--sub)", padding: 24, textAlign: "center" }}>該当なし</p>}
      </div>
    </>
  );
}
