"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Calculator } from "lucide-react";

type Col = { id: number; title: string; date: string };
type Machine = {
  id: string; name: string; aliases: string[]; maker: string; thumb: string; isNew: boolean;
  hasCalc?: boolean;
  sources: { ev: boolean; lab: boolean };
  lab: null | { nerai: number | null; spec: number | null; shukei: number | null; columns: Col[] };
  ev: null | { slug: string; kdash: string | null; nerai: string; spec: string; neraiOriginal?: string; rewritten?: boolean };
};
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

const TABS = ["狙い目", "解析・設定", "大量集計", "コラム"] as const;

function Content({ html }: { html: string }) {
  return <div className="content" dangerouslySetInnerHTML={{ __html: html }} />;
}
function Pending({ text }: { text: string }) {
  return <p style={{ color: "var(--light)", padding: "16px 0", fontSize: 13 }}>{text}</p>;
}
function Sources({ ev, lab }: { ev: boolean; lab: boolean }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 12 }}>
      <span className="eyebrow" style={{ marginRight: 2 }}>出典</span>
      {ev && <i className="badge blue">期待値</i>}
      {lab && <i className="badge">研究所</i>}
    </div>
  );
}

export default function MachineView({ machine: m }: { machine: Machine }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("狙い目");
  const [calc, setCalc] = useState(false);
  const [orig, setOrig] = useState(false);
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h2 style={{ fontSize: 16 }}>狙い目・期待値</h2>
              {m.ev?.rewritten && m.ev.neraiOriginal && (
                <button onClick={() => setOrig(!orig)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 10px", color: "var(--sub)", fontWeight: 700, fontSize: 12 }}>
                  {orig ? "編集版に戻す" : "原文を見る"}
                </button>
              )}
            </div>
            <Sources ev={m.sources.ev} lab={m.sources.lab} />
            {m.ev?.nerai && <Content html={orig && m.ev.neraiOriginal ? m.ev.neraiOriginal : m.ev.nerai} />}
            {m.hasCalc ? (
              calc ? (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <h3 style={{ fontSize: 15 }}>期待値計算ツール</h3>
                    <button onClick={() => setCalc(false)} style={{ background: "none", border: "none", color: "var(--sub)", fontWeight: 700, fontSize: 13 }}>閉じる</button>
                  </div>
                  <iframe src={`${BASE}/calc/${m.id}.html`} title="期待値計算ツール" style={{ width: "100%", height: "78vh", border: "1px solid var(--border)", borderRadius: 6, background: "#fff" }} />
                </div>
              ) : (
                <button className="btn" style={{ marginTop: 16 }} onClick={() => setCalc(true)}><Calculator size={18} /> 期待値を計算する</button>
              )
            ) : (!m.ev?.nerai && <Pending text="この機種の狙い目データは準備中です。" />)}
          </>
        )}
        {tab === "解析・設定" && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>解析・設定判別</h2>
            <Sources ev={m.sources.ev} lab={m.sources.lab} />
            {m.ev?.spec ? <Content html={m.ev.spec} /> : m.lab?.spec ? <Pending text="研究所の機種情報・設定判別を統合中（M6）。" /> : <Pending text="解析データは準備中です。" />}
          </>
        )}
        {tab === "大量集計" && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>大量集計</h2>
            {m.lab?.shukei || m.ev?.kdash ? <Pending text="ゾーン当選率・サンプル集計を統合中（M6）。" /> : <Pending text="大量集計データはありません。" />}
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
            )) : <Pending text="関連コラムはありません。" />}
          </div>
        )}
      </main>
    </>
  );
}
