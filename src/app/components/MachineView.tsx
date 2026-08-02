"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Calculator } from "lucide-react";

type Col = { id: number; title: string; date: string };
type Machine = {
  id: string; name: string; aliases: string[]; maker: string; thumb: string; isNew: boolean;
  sources: { ev: boolean; lab: boolean };
  lab: null | { nerai: number | null; spec: number | null; shukei: number | null; columns: Col[] };
  ev: null | { neraiHtml: boolean; kaisekiHtml: boolean; tenjoHtml: boolean; kdash: string | null };
};

const TABS = ["狙い目", "解析・設定", "大量集計", "コラム"] as const;

function SrcNote({ items }: { items: [boolean, string][] }) {
  const on = items.filter(([b]) => b);
  if (!on.length) return <p style={{ color: "var(--light)", padding: "18px 0" }}>この項目のデータは準備中です。</p>;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "4px 12px", marginBottom: 14 }}>
      {on.map(([, t]) => (
        <div className="kv" key={t} style={{ borderBottom: "1px solid var(--line)" }}>
          <span className="k">{t.split("｜")[0]}</span>
          <span className="v" style={{ color: "var(--sub)", fontSize: 13 }}>{t.split("｜")[1]}</span>
        </div>
      ))}
    </div>
  );
}

export default function MachineView({ machine: m }: { machine: Machine }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("狙い目");
  const cols = m.lab?.columns || [];
  return (
    <>
      <header style={{ position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px" }}>
          <Link href="/" style={{ color: "var(--sub)", display: "flex" }}><ChevronLeft size={24} /></Link>
          {m.thumb
            ? // eslint-disable-next-line @next/next/no-img-element
              <img src={m.thumb} alt="" style={{ width: 44, height: 44, borderRadius: 4, objectFit: "cover", border: "1px solid var(--border)" }} />
            : <span style={{ width: 44, height: 44, borderRadius: 4, background: "var(--bg-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>🎰</span>}
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 800, fontSize: 16, lineHeight: 1.25, letterSpacing: "-0.02em" }}>{m.name}</span>
            <span style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 3, flexWrap: "wrap" }}>
              {m.isNew && <i className="badge new">新台</i>}
              {m.sources.ev && <i className="badge blue">期待値</i>}
              {m.sources.lab && <i className="badge">研究所</i>}
              {m.maker && <span style={{ color: "var(--light)", fontSize: 12 }}>{m.maker}</span>}
            </span>
          </span>
          <button style={{ background: "none", border: "none", color: "var(--light)", display: "flex" }}><Star size={22} /></button>
        </div>
        <div className="pad tabs">
          {TABS.map((t) => (<button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>))}
        </div>
      </header>

      <main className="pad" style={{ paddingTop: 15 }}>
        {tab === "狙い目" && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>狙い目・期待値</h2>
            <SrcNote items={[[!!m.ev?.neraiHtml, "期待値サイト｜狙い目・期待値表"], [!!m.ev?.tenjoHtml, "期待値サイト｜天井"], [!!m.lab?.nerai, "研究所｜期待値表・狙い目 記事"]]} />
            <button className="btn"><Calculator size={18} /> この機種で期待値を計算</button>
            <p style={{ color: "var(--light)", fontSize: 12, marginTop: 10 }}>※ 狙い目（ゲーム数／スルー回数／状態別）と期待値表・計算ツールを統合中（M6）。</p>
          </>
        )}
        {tab === "解析・設定" && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>解析・設定判別</h2>
            <SrcNote items={[[!!m.ev?.kaisekiHtml, "期待値サイト｜解析・設定判別"], [!!m.lab?.spec, "研究所｜機種情報・設定判別 記事"]]} />
          </>
        )}
        {tab === "大量集計" && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>大量集計</h2>
            <SrcNote items={[[!!m.ev?.kdash, "期待値サイト｜集計ダッシュボード"], [!!m.lab?.shukei, "研究所｜大量集計・考察コラム"]]} />
          </>
        )}
        {tab === "コラム" && (
          <div style={{ paddingTop: 2 }}>
            {cols.length ? cols.map((c) => (
              <div key={c.id} className="row">
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 14.5, lineHeight: 1.4 }}>{c.title}</span>
                  <span style={{ display: "block", color: "var(--light)", fontSize: 12 }} className="num">{c.date}</span>
                </span>
                <ChevronRight className="chev" size={18} />
              </div>
            )) : <p style={{ color: "var(--light)", padding: "18px 0" }}>関連コラムは準備中です。</p>}
          </div>
        )}
      </main>
    </>
  );
}
