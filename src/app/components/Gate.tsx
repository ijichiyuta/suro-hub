"use client";
import { useEffect, useState } from "react";
import { Delete } from "lucide-react";

// 簡易パスワードゲート(4桁PIN・端末ごとに記憶)。静的サイトのためUIを隠す簡易ロック
// (noindex/robotsと併用の閲覧抑止。厳密な認証ではない)。
const PIN = "0807";
const KEY = "surohub_unlock";

export default function Gate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    setMounted(true);
    try { if (localStorage.getItem(KEY) === "1") setUnlocked(true); } catch {}
  }, []);

  useEffect(() => {
    if (input.length < 4) return;
    if (input === PIN) {
      try { localStorage.setItem(KEY, "1"); } catch {}
      setUnlocked(true);
    } else {
      setErr(true);
      const t = setTimeout(() => { setInput(""); setErr(false); }, 480);
      return () => clearTimeout(t);
    }
  }, [input]);

  if (!mounted) return null;                 // ハイドレーション前のちらつき回避
  if (unlocked) return <>{children}</>;

  const press = (d: string) => setInput((v) => (v.length < 4 ? v + d : v));
  const del = () => setInput((v) => v.slice(0, -1));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em", marginBottom: 6 }}>スマスマ期待値ラボ</div>
      <div style={{ color: "var(--light)", fontSize: 13, marginBottom: 30 }}>暗証番号を入力してください</div>
      <div className={err ? "pin-shake" : ""} style={{ display: "flex", gap: 15, marginBottom: 38 }}>
        {[0, 1, 2, 3].map((i) => {
          const on = i < input.length;
          const c = err ? "#e5484d" : "var(--blue)";
          return <span key={i} style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${c}`, background: on ? c : "transparent", transition: "background .15s" }} />;
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 70px)", gap: 14 }}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} onClick={() => press(d)} className="pin-key">{d}</button>
        ))}
        <span />
        <button onClick={() => press("0")} className="pin-key">0</button>
        <button onClick={del} className="pin-key" aria-label="削除" style={{ color: "var(--sub)" }}><Delete size={22} /></button>
      </div>
    </div>
  );
}
