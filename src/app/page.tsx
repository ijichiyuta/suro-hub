"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ChevronRight, User } from "lucide-react";
import INDEX from "@/data/index.json";

type M = { id: string; name: string; maker: string; thumb: string; isNew: boolean; sources: { ev: boolean; lab: boolean }; k: string };
const ALL = INDEX as M[];

const kana = (s: string) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const norm = (s: string) => kana((s || "").normalize("NFKC").toLowerCase()).replace(/[^0-9a-zぁ-ん一-鿿]/g, "");
const FILTERS = ["すべて", "新台", "保存", "メーカー"];

export default function Home() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("すべて");
  const list = useMemo(() => {
    const nq = norm(q);
    return ALL.filter((m) => {
      if (nq && !(m.k.includes(nq) || norm(m.name).includes(nq))) return false;
      if (f === "新台" && !m.isNew) return false;
      return true;
    });
  }, [q, f]);

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
          {FILTERS.map((x) => (<button key={x} className={"chip" + (f === x ? " on" : "")} onClick={() => setF(x)}>{x}</button>))}
        </div>
      </header>

      <div className="pad" style={{ color: "var(--sub)", fontSize: 12.5, margin: "10px 0 0", fontWeight: 700 }}>{list.length}機種</div>

      <div className="pad mgrid">
        {list.slice(0, 400).map((m) => (
          <Link key={m.id} href={`/m/${m.id}`} className="row">
            {m.thumb
              ? // eslint-disable-next-line @next/next/no-img-element
                <img className="thumb" src={m.thumb} alt="" loading="lazy" />
              : <span className="thumb thumb-ph">🎰</span>}
            <span style={{ minWidth: 0, flex: 1 }}>
              {m.isNew && <span style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 3 }}><i className="badge new">新台</i></span>}
              <span style={{ display: "block", fontWeight: 700, fontSize: 15, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
              {m.maker && <span style={{ display: "block", color: "var(--light)", fontSize: 12 }}>{m.maker}</span>}
            </span>
            <ChevronRight className="chev" size={18} />
          </Link>
        ))}
        {list.length === 0 && <p style={{ color: "var(--sub)", padding: 24, textAlign: "center" }}>該当なし</p>}
        {list.length > 400 && <p style={{ color: "var(--light)", fontSize: 12, textAlign: "center", padding: 16 }}>上位400件を表示（検索で絞れます）</p>}
      </div>
    </>
  );
}
