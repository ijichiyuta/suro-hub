export default function Search() {
  return (
    <>
      <header className="pad" style={{ paddingTop: 18, paddingBottom: 8 }}>
        <h1 style={{ fontSize: 22 }}>検索</h1>
        <label className="search" style={{ marginTop: 12 }}>
          <span>🔍</span>
          <input placeholder="機種・記事・読みで検索（例: グール）" style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 15 }} />
        </label>
      </header>
      <div className="pad" style={{ color: "var(--sub)", fontSize: 13, paddingTop: 16 }}>
        <p style={{ fontWeight: 700, color: "var(--ink)" }}>最近見た</p>
        <p>L北斗の拳 転生の章2 / L東京喰種 …</p>
        <p style={{ fontWeight: 700, color: "var(--ink)", marginTop: 16 }}>読みでもヒット</p>
        <p>「グール」→ L東京喰種、「ほくと」→ L北斗の拳 …</p>
      </div>
    </>
  );
}
