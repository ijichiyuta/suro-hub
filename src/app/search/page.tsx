import { Search as SearchIcon } from "lucide-react";

export default function Search() {
  return (
    <>
      <header className="pad" style={{ paddingTop: 16, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
        <h1 style={{ fontSize: 21, marginBottom: 12 }}>検索</h1>
        <label className="search">
          <SearchIcon size={18} strokeWidth={2} />
          <input placeholder="機種・記事・読みで検索（例: グール）" />
        </label>
      </header>
      <div className="pad" style={{ fontSize: 13, paddingTop: 16 }}>
        <p className="eyebrow">最近見た</p>
        <p style={{ color: "var(--sub)", marginTop: 6 }}>Lからくりサーカス2 / L東京喰種 …</p>
        <p className="eyebrow" style={{ marginTop: 18 }}>読みでもヒット</p>
        <p style={{ color: "var(--sub)", marginTop: 6 }}>「グール」→ L東京喰種、「ほくと」→ L北斗の拳 …</p>
      </div>
    </>
  );
}
