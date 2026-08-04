"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Star } from "lucide-react";
import INDEX from "@/data/index.json";
import { useFavIds, toggleFav } from "@/lib/favorites";

type M = { id: string; name: string; maker: string; thumb: string; isNew: boolean };
const ALL = INDEX as M[];

export default function Saved() {
  const favIds = useFavIds();
  const favSet = useMemo(() => new Set(favIds), [favIds]);
  const list = useMemo(() => ALL.filter((m) => favSet.has(m.id)), [favSet]);

  return (
    <>
      <header className="pad" style={{ paddingTop: 16, paddingBottom: 8, position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--line)" }}>
        <h1 style={{ fontSize: 21 }}>お気に入り</h1>
        <div style={{ color: "var(--sub)", fontSize: 12.5, marginTop: 6, fontWeight: 700 }}>{list.length}機種</div>
      </header>

      {list.length === 0 ? (
        <div style={{ color: "var(--sub)", textAlign: "center", padding: "56px 24px" }}>
          <Star size={34} style={{ color: "var(--light)", marginBottom: 12 }} />
          <p>機種ページや一覧の ☆ をタップすると<br />ここに追加されます</p>
        </div>
      ) : (
        <div className="pad mgrid">
          {list.map((m) => (
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
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(m.id); }} aria-label="お気に入りを解除"
                style={{ background: "none", border: "none", padding: 11, margin: -4, display: "flex", flex: "none", color: "var(--blue)", cursor: "pointer", touchAction: "manipulation" }}>
                <Star size={20} fill="var(--blue)" />
              </button>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
