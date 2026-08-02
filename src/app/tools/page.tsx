import { Calculator, TrendingDown, NotebookPen, ChevronRight } from "lucide-react";

const TOOLS = [
  { Icon: Calculator, name: "期待値計算", desc: "機種選択→ゲーム数から期待値を算出" },
  { Icon: TrendingDown, name: "下振れシミュレーター", desc: "試行回数から下振れ幅を確認" },
  { Icon: NotebookPen, name: "稼働ロガー", desc: "収支・実戦を記録（端末保存）" },
];

export default function Tools() {
  return (
    <>
      <header className="pad" style={{ paddingTop: 16, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
        <h1 style={{ fontSize: 21 }}>ツール</h1>
      </header>
      <div className="pad" style={{ marginTop: 6 }}>
        {TOOLS.map(({ Icon, name, desc }) => (
          <div key={name} className="row">
            <span style={{ width: 44, height: 44, borderRadius: 6, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", flex: "none" }}><Icon size={22} strokeWidth={2} /></span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{name}</span>
              <span style={{ display: "block", color: "var(--sub)", fontSize: 12.5 }}>{desc}</span>
            </span>
            <ChevronRight className="chev" size={18} />
          </div>
        ))}
      </div>
    </>
  );
}
