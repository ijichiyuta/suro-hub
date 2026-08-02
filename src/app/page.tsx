"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, ChevronRight, User } from "lucide-react";

type M = { name: string; maker: string; isNew?: boolean; sources: ("ev" | "lab")[]; thumb: string };

const MACHINES: M[] = [
  { name: "Lからくりサーカス2", maker: "サミー", isNew: true, sources: ["ev", "lab"], thumb: "https://media.slolaboratory.com/wp-content/uploads/2026/06/09022827/2026-07-06-1.jpg" },
  { name: "戦国コレクション6", maker: "ロデオ", isNew: true, sources: ["ev", "lab"], thumb: "https://media.slolaboratory.com/wp-content/uploads/2026/06/09022828/2026-07-06-2.jpg" },
  { name: "Lヤバチバ", maker: "大都技研", isNew: true, sources: ["ev", "lab"], thumb: "https://media.slolaboratory.com/wp-content/uploads/2026/06/09022831/2026-07-06-5.jpg" },
  { name: "L南国育ち SPECIAL", maker: "オリンピア", isNew: true, sources: ["ev", "lab"], thumb: "https://media.slolaboratory.com/wp-content/uploads/2026/06/09022829/2026-07-06-3.jpg" },
  { name: "スロット ソードアート・オンラインⅡ", maker: "ムゲンエンタ", isNew: true, sources: ["ev", "lab"], thumb: "https://media.slolaboratory.com/wp-content/uploads/2026/05/13001403/sao2-t.png" },
  { name: "L戦国乙女5", maker: "オリンピア", isNew: true, sources: ["lab"], thumb: "https://media.slolaboratory.com/wp-content/uploads/2026/05/13001402/otome5-t.png" },
  { name: "スマスロ バイオハザードRE:3", maker: "エンターライズ", sources: ["ev", "lab"], thumb: "https://media.slolaboratory.com/wp-content/uploads/2026/04/16161120/2026-05-11-3.jpg" },
  { name: "L ULTRAMAN 最終決戦", maker: "ニューギン", isNew: true, sources: ["ev", "lab"], thumb: "https://media.slolaboratory.com/wp-content/uploads/2026/06/17052725/2026-07-06-7.jpg" },
];

const FILTERS = ["すべて", "新台", "保存", "メーカー"];

export default function Home() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("すべて");
  const list = MACHINES.filter((m) => {
    if (q && !m.name.includes(q)) return false;
    if (f === "新台" && !m.isNew) return false;
    return true;
  });

  return (
    <>
      <header className="pad" style={{ paddingTop: 16, paddingBottom: 8, position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
          <h1 style={{ fontSize: 21 }}>機種をさがす</h1>
          <span style={{ width: 34, height: 34, borderRadius: 4, background: "var(--bg-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sub)" }}><User size={18} /></span>
        </div>
        <label className="search">
          <Search size={18} strokeWidth={2} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="機種名・読みで検索（例: グール / 北斗）" />
        </label>
        <div className="chips" style={{ marginTop: 11 }}>
          {FILTERS.map((x) => (
            <button key={x} className={"chip" + (f === x ? " on" : "")} onClick={() => setF(x)}>{x}</button>
          ))}
        </div>
      </header>

      <div className="pad" style={{ color: "var(--sub)", fontSize: 12.5, margin: "10px 0 0", fontWeight: 700 }}>{list.length}機種</div>

      <div className="pad">
        {list.map((m) => (
          <Link key={m.name} href="/m/sample" className="row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="thumb" src={m.thumb} alt="" loading="lazy" />
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 3 }}>
                {m.isNew && <i className="badge new">新台</i>}
                {m.sources.includes("ev") && <i className="badge blue">期待値</i>}
                {m.sources.includes("lab") && <i className="badge">研究所</i>}
              </span>
              <span style={{ display: "block", fontWeight: 700, fontSize: 15, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
              <span style={{ display: "block", color: "var(--light)", fontSize: 12 }}>{m.maker}</span>
            </span>
            <ChevronRight className="chev" size={18} />
          </Link>
        ))}
        {list.length === 0 && <p style={{ color: "var(--sub)", padding: 24, textAlign: "center" }}>該当なし</p>}
      </div>
    </>
  );
}
