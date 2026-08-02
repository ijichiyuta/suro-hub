"use client";
import Link from "next/link";
import { useState } from "react";

const TABS = ["狙い目", "解析・設定", "大量集計", "コラム"] as const;

export default function MachineDetail() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("狙い目");
  return (
    <>
      {/* 機種ヘッダー（固定） */}
      <header style={{ position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--border)" }}>
        <div className="pad" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px" }}>
          <Link href="/" style={{ fontSize: 22, color: "var(--sub)" }}>‹</Link>
          <span className="thumb" style={{ width: 46, height: 46, fontSize: 20 }}>🥊</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 800, fontSize: 16, lineHeight: 1.3 }}>L北斗の拳 転生の章2</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 3 }}>
              <i className="badge new" style={{ fontStyle: "normal" }}>新台</i>
              <i className="badge blue" style={{ fontStyle: "normal" }}>期待値</i>
              <i className="badge" style={{ fontStyle: "normal" }}>研究所</i>
              <span style={{ color: "var(--light)", fontSize: 12 }}>サミー</span>
            </span>
          </span>
          <span style={{ fontSize: 22, color: "var(--light)" }}>☆</span>
        </div>
        {/* タブ */}
        <div className="pad tabs">
          {TABS.map((t) => (
            <button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </header>

      <main className="pad" style={{ paddingTop: 16 }}>
        {tab === "狙い目" && (
          <>
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>期待値・狙い目</h2>
            <p style={{ color: "var(--sub)", fontSize: 13, margin: "0 0 12px" }}>
              出典: <i className="badge blue" style={{ fontStyle: "normal" }}>期待値</i> <i className="badge" style={{ fontStyle: "normal" }}>研究所</i>
              <span style={{ marginLeft: 8, color: "var(--blue-dark)", fontWeight: 700 }}>原文を見る ▾</span>
            </p>
            <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
              <table className="dtable num">
                <thead>
                  <tr><th>ゲーム数</th><th>期待値</th><th>時給</th></tr>
                </thead>
                <tbody>
                  <tr><td>0〜100</td><td className="pos">+380円</td><td>—</td></tr>
                  <tr><td>100〜300</td><td className="pos">+1,050円</td><td>+2,600</td></tr>
                  <tr><td>300〜500</td><td className="pos">+2,240円</td><td>+3,900</td></tr>
                  <tr><td>500〜天井</td><td className="pos">+3,880円</td><td>+5,200</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              {[["ゾーン", "150 / 250 / 400G が強め"], ["天井", "999G（恩恵: 銭闘状態）"], ["ヤメ時", "AT後 32G+前兆確認"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, background: "var(--bg-soft)", borderRadius: 12, padding: "12px 14px" }}>
                  <span style={{ color: "var(--sub)", fontSize: 13, fontWeight: 700 }}>{k}</span>
                  <span style={{ fontSize: 14, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>
            <button className="btn" style={{ marginTop: 18 }}>🧮 この機種で期待値を計算</button>
          </>
        )}
        {tab === "解析・設定" && (
          <p style={{ color: "var(--sub)", padding: "20px 0" }}>スペック・機械割・設定差・判別要素をここに（期待値＋研究所を統合）。</p>
        )}
        {tab === "大量集計" && (
          <p style={{ color: "var(--sub)", padding: "20px 0" }}>ゾーン当選率・サンプル集計データをここに（研究所コラムの表を集約）。</p>
        )}
        {tab === "コラム" && (
          <div style={{ paddingTop: 6 }}>
            {["チャンスモード後・朝イチモード後の狙い目考察", "状況別各種数値", "すろらぼ座談会 vol.11"].map((t) => (
              <div key={t} className="row"><span style={{ flex: 1, fontWeight: 700, fontSize: 14.5 }}>{t}</span><span className="chev">›</span></div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
