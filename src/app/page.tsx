// M2プロトタイプ: smartconnectデザイン言語をスロット期待値アーカイブに適用した確認用トップ。
// 静的出力(SSG)で成立するか＋デザインの見た目を検証する目的。データは仮。

type Machine = {
  name: string;
  maker: string;
  isNew?: boolean;
  sources: ("ev" | "lab")[];
};

const SAMPLE: Machine[] = [
  { name: "L北斗の拳 転生の章2", maker: "サミー", isNew: true, sources: ["ev", "lab"] },
  { name: "L東京喰種", maker: "ロデオ", sources: ["ev", "lab"] },
  { name: "スマスロ バジリスク絆2 天膳", maker: "ユニバーサル", sources: ["ev", "lab"] },
  { name: "Re:ゼロから始める異世界生活2", maker: "大都技研", isNew: true, sources: ["ev", "lab"] },
  { name: "L戦国乙女5", maker: "オリンピア", isNew: true, sources: ["lab"] },
  { name: "スマスロ ゴジラ対エヴァンゲリオン", maker: "ビスティ", sources: ["ev", "lab"] },
];

function SourceBadges({ sources }: { sources: ("ev" | "lab")[] }) {
  return (
    <span style={{ display: "inline-flex", gap: 6 }}>
      {sources.includes("ev") && <Badge label="期待値" />}
      {sources.includes("lab") && <Badge label="研究所" />}
    </span>
  );
}

function Badge({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 999,
        color: accent ? "#fff" : "var(--sub)",
        background: accent ? "var(--green)" : "var(--bg)",
        border: accent ? "none" : "1px solid var(--border)",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      {label}
    </span>
  );
}

export default function Home() {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ヘッダー */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: "var(--grad)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
            }}
          >
            ◆
          </span>
          <span
            style={{
              fontFamily: "var(--font-poppins), sans-serif",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-0.01em",
            }}
          >
            スマスマ期待値ラボ
          </span>
        </div>
        <nav style={{ display: "flex", gap: 22, alignItems: "center", fontSize: 14, fontWeight: 700 }}>
          <span>機種</span>
          <span>ツール</span>
          <span>記事</span>
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: "1px solid var(--border)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🔍
          </span>
        </nav>
      </header>

      {/* ヒーロー */}
      <section
        style={{
          padding: "64px 24px 40px",
          background: "linear-gradient(180deg,#eaf3fb 0%,#f4f9fd 55%,#fff 100%)",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <span className="sec-label">SLOT EV ARCHIVE</span>
          <h1 style={{ fontSize: "clamp(28px,4.6vw,46px)", margin: "16px 0 14px", maxWidth: 760 }}>
            期待値と研究所を、
            <br />
            <span className="grad-text">1台1ページ</span>にまとめた。
          </h1>
          <p style={{ color: "var(--sub)", fontSize: 16, maxWidth: 560, margin: 0 }}>
            狙い目・解析・大量集計・コラムを機種ごとに統合。店内でもオフラインで、数秒で引ける。
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
            <button className="btn btn-primary">機種を探す</button>
            <button
              className="btn"
              style={{ background: "#fff", color: "var(--navy)", border: "2px solid var(--navy)" }}
            >
              ツールを使う
            </button>
          </div>
        </div>
      </section>

      {/* 機種グリッド */}
      <section style={{ padding: "56px 24px 96px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <span className="sec-label">MACHINES</span>
          <h2 style={{ fontSize: "clamp(24px,3.6vw,34px)", margin: "12px 0 26px" }}>機種一覧</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
              gap: 20,
            }}
          >
            {SAMPLE.map((m) => (
              <div key={m.name} className="card" style={{ padding: 20 }}>
                <div
                  style={{
                    height: 120,
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#eef4fb,#f6f9fc)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 30,
                    marginBottom: 14,
                    border: "1px solid var(--border)",
                  }}
                >
                  🎰
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {m.isNew && <Badge label="新台" accent />}
                  <SourceBadges sources={m.sources} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.5 }}>{m.name}</div>
                <div style={{ color: "var(--light)", fontSize: 12.5, marginTop: 4 }}>{m.maker}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  {["狙い目", "解析", "大量集計", "コラム"].map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 11,
                        color: "var(--sub)",
                        background: "var(--bg)",
                        borderRadius: 6,
                        padding: "3px 7px",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer
        style={{
          padding: "24px",
          textAlign: "center",
          color: "var(--light)",
          fontSize: 12.5,
          borderTop: "1px solid var(--border)",
        }}
      >
        個人アーカイブ（統合版・M2プロトタイプ）
      </footer>
    </div>
  );
}
