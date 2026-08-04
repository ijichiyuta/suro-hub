"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useLogs, addLog, removeLog } from "@/lib/logger";

const yen = (n: number) => (n < 0 ? "-" : "") + "¥" + Math.abs(n).toLocaleString("ja-JP");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export default function Logger() {
  const logs = useLogs();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [machine, setMachine] = useState("");
  const [invest, setInvest] = useState("");
  const [payout, setPayout] = useState("");
  const [note, setNote] = useState("");

  const totals = useMemo(() => {
    const all = logs.reduce((s, l) => s + (l.payout - l.invest), 0);
    const ym = today().slice(0, 7);
    const month = logs.filter((l) => l.date.slice(0, 7) === ym).reduce((s, l) => s + (l.payout - l.invest), 0);
    return { all, month };
  }, [logs]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const iv = parseInt(invest || "0", 10) || 0;
    const po = parseInt(payout || "0", 10) || 0;
    if (!machine.trim() && !iv && !po) return;
    addLog({ date, machine: machine.trim() || "（機種未入力）", invest: iv, payout: po, note: note.trim() || undefined });
    setMachine(""); setInvest(""); setPayout(""); setNote(""); setOpen(false);
  };

  return (
    <>
      <header style={{ position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
          <Link href="/tools" style={{ color: "var(--sub)", display: "flex" }}><ChevronLeft size={24} /></Link>
          <h1 style={{ fontSize: 18, flex: 1 }}>稼働ロガー</h1>
          <button onClick={() => setOpen((v) => !v)} className="btn" style={{ padding: "7px 12px", fontSize: 13 }}><Plus size={16} /> 記録</button>
        </div>
      </header>

      <main className="pad" style={{ paddingTop: 14 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {[["累計収支", totals.all], ["今月", totals.month]].map(([label, v]) => (
            <div key={label as string} style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: "var(--light)", fontWeight: 700 }}>{label}</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, marginTop: 2, color: (v as number) > 0 ? "var(--green)" : (v as number) < 0 ? "#e5484d" : "var(--ink)" }}>{yen(v as number)}</div>
            </div>
          ))}
        </div>

        {open && (
          <form onSubmit={submit} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14, marginBottom: 16, background: "var(--bg-soft)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="日付"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} /></Field>
              <Field label="機種"><input value={machine} onChange={(e) => setMachine(e.target.value)} placeholder="北斗転生2 など" style={inp} /></Field>
              <Field label="投資(円)"><input type="number" inputMode="numeric" value={invest} onChange={(e) => setInvest(e.target.value)} placeholder="0" style={inp} /></Field>
              <Field label="回収(円)"><input type="number" inputMode="numeric" value={payout} onChange={(e) => setPayout(e.target.value)} placeholder="0" style={inp} /></Field>
            </div>
            <div style={{ marginTop: 10 }}><Field label="メモ"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="設定示唆・立ち回りなど" style={inp} /></Field></div>
            <button type="submit" className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>保存する</button>
          </form>
        )}

        {logs.length === 0 ? (
          <p style={{ color: "var(--light)", textAlign: "center", padding: "48px 24px", fontSize: 13.5 }}>まだ記録がありません。<br />右上の「記録」から追加できます。</p>
        ) : (
          <div>
            {logs.map((l) => {
              const diff = l.payout - l.invest;
              return (
                <div key={l.id} className="row" style={{ alignItems: "flex-start" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.machine}</span>
                      <span className="num" style={{ fontSize: 11.5, color: "var(--light)" }}>{l.date}</span>
                    </span>
                    <span className="num" style={{ display: "block", fontSize: 12, color: "var(--sub)", marginTop: 2 }}>投資 {yen(l.invest)} → 回収 {yen(l.payout)}</span>
                    {l.note && <span style={{ display: "block", fontSize: 12, color: "var(--light)", marginTop: 2 }}>{l.note}</span>}
                  </span>
                  <span className="num" style={{ fontWeight: 800, fontSize: 15, color: diff > 0 ? "var(--green)" : diff < 0 ? "#e5484d" : "var(--ink)", whiteSpace: "nowrap" }}>{yen(diff)}</span>
                  <button onClick={() => { if (confirm("この記録を削除しますか？")) removeLog(l.id); }} aria-label="削除" style={{ background: "none", border: "none", padding: 4, color: "var(--light)", display: "flex", marginLeft: 6 }}><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--sub)", marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}
const inp: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", fontSize: 14, border: "1px solid var(--border)", borderRadius: 6, background: "#fff", color: "var(--ink)", outline: "none" };
