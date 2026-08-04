"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import INDEX from "@/data/index.json";
import AccountButton from "@/app/components/AccountButton";
import { useFavIds, toggleFav } from "@/lib/favorites";
import { useRecent } from "@/lib/recent";

type M = { id: string; name: string; maker: string; thumb: string; isNew: boolean; sources: { ev: boolean; lab: boolean }; k: string };
const ALL = INDEX as M[];

const kana = (s: string) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const norm = (s: string) => kana((s || "").normalize("NFKC").toLowerCase()).replace(/[^0-9a-zぁ-ん一-鿿]/g, "");
const FILTERS = ["すべて", "新台", "お気に入り", "メーカー"];

export default function Home() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("すべて");
  const [maker, setMaker] = useState("");
  const favIds = useFavIds();
  const favSet = useMemo(() => new Set(favIds), [favIds]);
  const byId = useMemo(() => new Map(ALL.map((m) => [m.id, m])), []);
  const makers = useMemo(() => [...new Set(ALL.map((m) => m.maker).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja")), []);
  const recentIds = useRecent();
  const recent = useMemo(() => recentIds.map((id) => byId.get(id)).filter(Boolean).slice(0, 12) as M[], [recentIds, byId]);

  const list = useMemo(() => {
    const nq = norm(q);
    return ALL.filter((m) => {
      if (nq && !(m.k.includes(nq) || norm(m.name).includes(nq))) return false;
      if (f === "新台" && !m.isNew) return false;
      if (f === "お気に入り" && !favSet.has(m.id)) return false;
      if (f === "メーカー" && maker && m.maker !== maker) return false;
      return true;
    });
  }, [q, f, favSet, maker]);

  const showRecent = !q && f === "すべて" && recent.length > 0;

  return (
    <>
      <header className="pad" style={{ paddingTop: 16, paddingBottom: 8, position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
          <h1 style={{ fontSize: 21 }}>機種をさがす</h1>
          <AccountButton variant="icon" />
        </div>
        <label className="search">
          <Search size={18} strokeWidth={2} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="機種名・読みで検索（例: グール / 北斗）" />
        </label>
        <div className="chips" style={{ marginTop: 11 }}>
          {FILTERS.map((x) => (<button key={x} className={"chip" + (f === x ? " on" : "")} onClick={() => { setF(x); if (x !== "メーカー") setMaker(""); }}>{x}</button>))}
        </div>
        {f === "メーカー" && (
          <div className="chips" style={{ marginTop: 8, overflowX: "auto", flexWrap: "nowrap", paddingBottom: 2 }}>
            <button className={"chip" + (maker === "" ? " on" : "")} onClick={() => setMaker("")} style={{ flex: "none" }}>すべて</button>
            {makers.map((mk) => (
              <button key={mk} className={"chip" + (maker === mk ? " on" : "")} onClick={() => setMaker(mk)} style={{ flex: "none" }}>{mk}</button>
            ))}
          </div>
        )}
      </header>

      {showRecent && (
        <div style={{ padding: "12px 0 2px" }}>
          <div className="pad" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--sub)", marginBottom: 8 }}>最近見た機種</div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px 4px" }}>
            {recent.map((m) => (
              <Link key={m.id} href={`/m/${m.id}`} style={{ flex: "none", width: 66, textAlign: "center" }}>
                {m.thumb
                  ? // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.thumb} alt="" loading="lazy" style={{ width: 66, height: 66, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
                  : <span style={{ display: "flex", width: 66, height: 66, borderRadius: 8, background: "var(--bg-soft)", border: "1px solid var(--border)", alignItems: "center", justifyContent: "center" }}>🎰</span>}
                <span style={{ display: "block", fontSize: 10.5, color: "var(--sub)", marginTop: 4, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

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
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(m.id); }}
              aria-label={favSet.has(m.id) ? "お気に入りを解除" : "お気に入りに追加"}
              style={{ background: "none", border: "none", padding: 11, margin: -4, display: "flex", flex: "none", color: favSet.has(m.id) ? "var(--blue)" : "var(--light)", cursor: "pointer", touchAction: "manipulation" }}>
              <Star size={20} fill={favSet.has(m.id) ? "var(--blue)" : "none"} />
            </button>
          </Link>
        ))}
        {list.length === 0 && f === "お気に入り" && <p style={{ color: "var(--sub)", padding: 40, textAlign: "center", fontSize: 13.5 }}>お気に入りはまだありません。<br />★をタップで追加できます。</p>}
        {list.length === 0 && f !== "お気に入り" && <p style={{ color: "var(--sub)", padding: 24, textAlign: "center" }}>該当なし</p>}
        {list.length > 400 && <p style={{ color: "var(--light)", fontSize: 12, textAlign: "center", padding: 16 }}>上位400件を表示（検索で絞れます）</p>}
      </div>
    </>
  );
}
