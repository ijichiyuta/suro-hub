"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star, Calculator } from "lucide-react";
import { useFav } from "@/lib/favorites";
import { pushRecent } from "@/lib/recent";
import { useNote, setNote } from "@/lib/notes";

type Col = { id: number; title: string; date: string };
type Machine = {
  id: string; name: string; aliases: string[]; maker: string; thumb: string; isNew: boolean;
  hasCalc?: boolean; hasSpec?: boolean; hasShukei?: boolean;
  sources: { ev: boolean; lab: boolean };
  lab: null | { columns: Col[] };
  ev: null | { slug: string; kdash: string | null; nerai: string };
};
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

const TABS = ["狙い目", "解析・設定", "大量集計", "コラム"] as const;

function Content({ html }: { html: string }) {
  return <div className="content" dangerouslySetInnerHTML={{ __html: html }} />;
}
function Pending({ text }: { text: string }) {
  return <p style={{ color: "var(--light)", padding: "16px 0", fontSize: 13 }}>{text}</p>;
}
function Loading() {
  return <p style={{ color: "var(--light)", padding: "16px 0", fontSize: 13 }}>読み込み中…</p>;
}

export default function MachineView({ machine: m }: { machine: Machine }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("狙い目");
  const [calc, setCalc] = useState(false);
  const { fav, toggle } = useFav(m.id);
  useEffect(() => { pushRecent(m.id); }, [m.id]);
  const savedNote = useNote(m.id);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteFocus, setNoteFocus] = useState(false);
  useEffect(() => { if (!noteFocus) setNoteDraft(savedNote); }, [savedNote, noteFocus]);
  // 解析/集計HTMLは重いので遅延取得（狙い目タブは即表示のまま＝店内高速表示）
  const [specData, setSpecData] = useState<{ spec: string; shukei: string; error?: boolean } | null>(null);
  const [specLoading, setSpecLoading] = useState(false);
  const needSpec = tab === "解析・設定" || tab === "大量集計";
  useEffect(() => {
    if (!needSpec || specData || specLoading) return;
    if (!m.hasSpec && !m.hasShukei) return;
    setSpecLoading(true);
    fetch(`${BASE}/data/spec/${m.id}.json`)
      .then((r) => r.json())
      .then((d) => setSpecData(d))
      .catch(() => setSpecData({ spec: "", shukei: "", error: true }))
      .finally(() => setSpecLoading(false));
  }, [needSpec, specData, specLoading, m.id, m.hasSpec, m.hasShukei]);

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
              {m.maker && <span style={{ color: "var(--light)", fontSize: 12 }}>{m.maker}</span>}
            </span>
          </span>
          <button onClick={toggle} aria-label={fav ? "保存を解除" : "保存する"} style={{ background: "none", border: "none", color: fav ? "var(--blue)" : "var(--light)", display: "flex" }}>
            <Star size={22} fill={fav ? "var(--blue)" : "none"} />
          </button>
        </div>
        <div className="pad tabs">
          {TABS.map((t) => (<button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>))}
        </div>
      </header>

      <main className="pad" style={{ paddingTop: 15 }}>
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onFocus={() => setNoteFocus(true)}
          onBlur={() => { setNoteFocus(false); setNote(m.id, noteDraft); }}
          placeholder="＋ 自分メモ（設定示唆・立ち回り・ホール状況など）"
          rows={noteDraft ? 3 : 1}
          style={{ width: "100%", resize: "vertical", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--ink)", background: "var(--bg-soft)", outline: "none", lineHeight: 1.6, marginBottom: 15 }}
        />
        {tab === "狙い目" && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>狙い目・期待値</h2>
            {m.ev?.nerai && <Content html={m.ev.nerai} />}
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
            {m.hasSpec
              ? specData ? (specData.spec ? <Content html={specData.spec} /> : <Pending text="解析データを読み込めませんでした。" />) : <Loading />
              : <Pending text="解析データは準備中です。" />}
          </>
        )}
        {tab === "大量集計" && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>大量集計</h2>
            {m.hasShukei
              ? specData ? (specData.shukei ? <Content html={specData.shukei} /> : <Pending text="集計データを読み込めませんでした。" />) : <Loading />
              : cols.length
                ? <Pending text="機種別の大量集計データは「コラム」タブの実践・考察記事にまとめています。" />
                : <Pending text="大量集計データはありません。" />}
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
