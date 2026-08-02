const TOOLS = [
  { ico: "🧮", name: "期待値計算", desc: "機種選択→ゲーム数から期待値を算出" },
  { ico: "📉", name: "下振れシミュレーター", desc: "試行回数から下振れ幅を確認" },
  { ico: "📓", name: "稼働ロガー", desc: "収支・実戦を記録（端末保存）" },
];

export default function Tools() {
  return (
    <>
      <header className="pad" style={{ paddingTop: 18, paddingBottom: 8 }}>
        <h1 style={{ fontSize: 22 }}>ツール</h1>
      </header>
      <div className="pad" style={{ display: "grid", gap: 12, marginTop: 6 }}>
        {TOOLS.map((t) => (
          <div key={t.name} className="row" style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, borderBottom: "1px solid var(--border)" }}>
            <span className="thumb" style={{ background: "var(--blue-tint)", border: "none" }}>{t.ico}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontWeight: 700, fontSize: 15.5 }}>{t.name}</span>
              <span style={{ display: "block", color: "var(--sub)", fontSize: 13 }}>{t.desc}</span>
            </span>
            <span className="chev">›</span>
          </div>
        ))}
      </div>
    </>
  );
}
