"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, Plus, Trash2, Copy, Check } from "lucide-react";
import { calcKitaichi, toTableHtml, type Zone } from "@/lib/kitaichi";

const inp: React.CSSProperties = { width: "100%", height: 40, padding: "0 10px", fontSize: 14, border: "1px solid var(--border)", borderRadius: 6, background: "#fff", color: "var(--ink)", outline: "none" };

function Num({ label, value, set, suffix }: { label: string; value: number; set: (n: number) => void; suffix?: string }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--sub)", marginBottom: 4 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="number" inputMode="decimal" value={Number.isFinite(value) ? value : ""} onChange={(e) => set(parseFloat(e.target.value))} style={inp} />
        {suffix && <span style={{ fontSize: 12, color: "var(--light)", flex: "none" }}>{suffix}</span>}
      </span>
    </label>
  );
}

export default function Calc() {
  const [tenjo, setTenjo] = useState(1000);
  const [baseRate, setBaseRate] = useState(400);
  const [zones, setZones] = useState<Zone[]>([{ from: 700, to: 800, rate: 80 }]);
  const [atDiff, setAtDiff] = useState(700);
  const [tenjoDiff, setTenjoDiff] = useState(900);
  const [coinMochi, setCoinMochi] = useState(35);
  const [borrow, setBorrow] = useState(20);
  const [exchange, setExchange] = useState(20);
  const [step, setStep] = useState(100);
  const [copied, setCopied] = useState(false);

  const { rows, border } = useMemo(
    () => calcKitaichi({ tenjo, baseRate, zones, atDiff, tenjoDiff, coinMochi, borrow, exchange, step }),
    [tenjo, baseRate, zones, atDiff, tenjoDiff, coinMochi, borrow, exchange, step]
  );

  const setZone = (i: number, k: keyof Zone, v: number) => setZones((zs) => zs.map((z, j) => (j === i ? { ...z, [k]: v } : z)));
  const copy = async () => { try { await navigator.clipboard.writeText(toTableHtml(rows, border)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };

  return (
    <>
      <header style={{ position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
          <Link href="/tools" style={{ color: "var(--sub)", display: "flex" }}><ChevronLeft size={24} /></Link>
          <h1 style={{ fontSize: 18 }}>期待値シミュレーター</h1>
        </div>
      </header>

      <main className="pad" style={{ paddingTop: 14 }}>
        <p style={{ color: "var(--light)", fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>機種スペックを入力すると、開始ゲーム数別の期待値とボーダーを算出します。結果の表は自作機種の狙い目にそのまま貼れます。</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Num label="天井G" value={tenjo} set={setTenjo} suffix="G" />
          <Num label="通常時当選率 (1/x)" value={baseRate} set={setBaseRate} suffix="分の1" />
          <Num label="AT平均差枚" value={atDiff} set={setAtDiff} suffix="枚" />
          <Num label="天井時 平均差枚" value={tenjoDiff} set={setTenjoDiff} suffix="枚" />
          <Num label="コイン持ち(50枚あたり)" value={coinMochi} set={setCoinMochi} suffix="G" />
          <Num label="貸単価" value={borrow} set={setBorrow} suffix="円/枚" />
          <Num label="換金率" value={exchange} set={setExchange} suffix="円/枚" />
          <Num label="表のG刻み" value={step} set={setStep} suffix="G" />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--sub)" }}>ゾーン（範囲で当選率を上書き）</span>
            <button onClick={() => setZones((z) => [...z, { from: 0, to: 0, rate: 100 }])} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", fontSize: 12, color: "var(--sub)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Plus size={13} />追加</button>
          </div>
          {zones.map((z, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <input type="number" value={z.from} onChange={(e) => setZone(i, "from", parseFloat(e.target.value))} placeholder="開始G" style={{ ...inp, height: 36 }} />
              <span style={{ color: "var(--light)" }}>〜</span>
              <input type="number" value={z.to} onChange={(e) => setZone(i, "to", parseFloat(e.target.value))} placeholder="終了G" style={{ ...inp, height: 36 }} />
              <span style={{ fontSize: 12, color: "var(--light)", flex: "none" }}>1/</span>
              <input type="number" value={z.rate} onChange={(e) => setZone(i, "rate", parseFloat(e.target.value))} placeholder="当選率" style={{ ...inp, height: 36 }} />
              <button onClick={() => setZones((zs) => zs.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--light)", display: "flex", flex: "none", padding: 4 }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>ボーダー: {border != null ? `約 ${border}G〜` : "全域マイナス"}</span>
            <button onClick={copy} className="btn" style={{ padding: "6px 12px", fontSize: 12.5 }}>{copied ? <><Check size={14} />コピー済</> : <><Copy size={14} />表をコピー</>}</button>
          </div>
          <table className="content" style={{ width: "100%" }}>
            <thead><tr><th style={{ textAlign: "left", padding: "6px 14px", fontSize: 12, color: "var(--sub)" }}>開始G</th><th style={{ textAlign: "right", padding: "6px 14px", fontSize: 12, color: "var(--sub)" }}>期待値</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.g} style={{ borderTop: "1px solid var(--line)" }}>
                  <td className="num" style={{ padding: "7px 14px", fontSize: 13.5 }}>{r.g}G〜</td>
                  <td className="num" style={{ padding: "7px 14px", fontSize: 13.5, textAlign: "right", fontWeight: 700, color: r.ev > 0 ? "var(--green)" : r.ev < 0 ? "#e5484d" : "var(--ink)" }}>{r.ev >= 0 ? "+" : ""}{r.ev.toLocaleString("ja-JP")}円</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: "var(--light)", fontSize: 11.5, marginTop: 12, lineHeight: 1.7 }}>※簡易モデルです。当選=AT平均差枚、天井到達=天井平均差枚として、開始Gから天井まで積分し投資（消化G×コイン単価）を差し引いています。より精密にするにはゾーンや状態を細かく設定してください。</p>
      </main>
    </>
  );
}
