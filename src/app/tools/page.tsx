import Link from "next/link";
import { Calculator, TrendingDown, NotebookPen, ChevronRight } from "lucide-react";

const TOOLS = [
  { Icon: NotebookPen, name: "稼働ロガー", desc: "収支・実戦を記録（端末保存＋ログイン同期）", href: "/tools/logger" },
  { Icon: Calculator, name: "期待値シミュレーター", desc: "スペックを入力して期待値表・ボーダーを算出（新台の狙い目作成に）", href: "/tools/calc" },
  { Icon: TrendingDown, name: "下振れシミュレーター", desc: "試行回数から下振れ幅を確認（準備中）", href: null },
];

export default function Tools() {
  return (
    <>
      <header className="pad" style={{ paddingTop: 16, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
        <h1 style={{ fontSize: 21 }}>ツール</h1>
      </header>
      <div className="pad" style={{ marginTop: 6 }}>
        {TOOLS.map(({ Icon, name, desc, href }) => {
          const body = (
            <>
              <span style={{ width: 44, height: 44, borderRadius: 6, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", flex: "none" }}><Icon size={22} strokeWidth={2} /></span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{name}</span>
                <span style={{ display: "block", color: "var(--sub)", fontSize: 12.5 }}>{desc}</span>
              </span>
              {href && <ChevronRight className="chev" size={18} />}
            </>
          );
          return href
            ? <Link key={name} href={href} className="row">{body}</Link>
            : <div key={name} className="row" style={{ opacity: 0.6 }}>{body}</div>;
        })}
      </div>
    </>
  );
}
