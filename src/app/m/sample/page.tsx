"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Calculator } from "lucide-react";

const TABS = ["狙い目", "解析・設定", "大量集計", "コラム"] as const;
const THUMB = "https://media.slolaboratory.com/wp-content/uploads/2026/06/09022827/2026-07-06-1.jpg";

export default function MachineDetail() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("狙い目");
  return (
    <>
      <header style={{ position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px" }}>
          <Link href="/" style={{ color: "var(--sub)", display: "flex" }}><ChevronLeft size={24} /></Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={THUMB} alt="" style={{ width: 44, height: 44, borderRadius: 4, objectFit: "cover", border: "1px solid var(--border)" }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 800, fontSize: 16, lineHeight: 1.25, letterSpacing: "-0.02em" }}>Lからくりサーカス2</span>
            <span style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 3 }}>
              <i className="badge new">新台</i>
              <i className="badge blue">期待値</i>
              <i className="badge">研究所</i>
              <span style={{ color: "var(--light)", fontSize: 12 }}>サミー</span>
            </span>
          </span>
          <button style={{ background: "none", border: "none", color: "var(--light)", display: "flex" }}><Star size={22} /></button>
        </div>
        <div className="pad tabs">
          {TABS.map((t) => (
            <button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </header>

      <main className="pad" style={{ paddingTop: 15 }}>
        {tab === "狙い目" && (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
              <h2 style={{ fontSize: 16 }}>期待値・狙い目</h2>
              <span style={{ color: "var(--blue-dark)", fontWeight: 700, fontSize: 13 }}>原文を見る</span>
            </div>
            <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
              <span className="eyebrow" style={{ alignSelf: "center", marginRight: 2 }}>出典</span>
              <i className="badge blue">期待値</i><i className="badge">研究所</i>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
              <table className="dtable num">
                <thead><tr><th>ゲーム数</th><th>期待値</th><th>時給</th></tr></thead>
                <tbody>
                  <tr><td>0〜100</td><td className="pos">+380円</td><td>—</td></tr>
                  <tr><td>100〜300</td><td className="pos">+1,050円</td><td>+2,600</td></tr>
                  <tr><td>300〜500</td><td className="pos">+2,240円</td><td>+3,900</td></tr>
                  <tr><td>500〜天井</td><td className="pos">+3,880円</td><td>+5,200</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 6 }}>
              {[["ゾーン", "150 / 250 / 400G が強め"], ["天井", "999G（恩恵: 銭闘状態）"], ["ヤメ時", "AT後 32G＋前兆確認"]].map(([k, v]) => (
                <div className="kv" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
              ))}
            </div>
            <button className="btn" style={{ marginTop: 18 }}><Calculator size={18} /> この機種で期待値を計算</button>
          </>
        )}
        {tab === "解析・設定" && <p style={{ color: "var(--sub)", padding: "20px 0" }}>スペック・機械割・設定差・判別要素をここに（期待値＋研究所を統合）。</p>}
        {tab === "大量集計" && <p style={{ color: "var(--sub)", padding: "20px 0" }}>ゾーン当選率・サンプル集計データをここに（研究所コラムの表を集約）。</p>}
        {tab === "コラム" && (
          <div style={{ paddingTop: 4 }}>
            {["チャンスモード後・朝イチモード後の狙い目考察", "状況別各種数値", "すろらぼ座談会 vol.11"].map((t) => (
              <div key={t} className="row"><span style={{ flex: 1, fontWeight: 700, fontSize: 14.5 }}>{t}</span><ChevronRight className="chev" size={18} /></div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
