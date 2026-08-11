"use client";
// ルートレイアウト自体のエラー用(html/bodyを自前で持つ必要がある)。まれだが白画面防止の最終防衛線。
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center", color: "#1a1a1a" }}>
        <div style={{ fontWeight: 800, fontSize: 19 }}>エラーが発生しました</div>
        <p style={{ color: "#666", fontSize: 14 }}>お手数ですが、もう一度お試しください。</p>
        <button onClick={reset} style={{ padding: "10px 22px", background: "#1f5eff", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>再読み込み</button>
      </body>
    </html>
  );
}
