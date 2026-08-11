"use client";
// ルートセグメントのエラーバウンダリ。未処理エラーで白画面になるのを防ぎ、復帰導線を出す。
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { /* 必要なら監視送信 */ }, [error]);
  return (
    <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", gap: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em" }}>エラーが発生しました</div>
      <p style={{ color: "var(--sub)", fontSize: 14, lineHeight: 1.7 }}>お手数ですが、もう一度お試しください。<br />繰り返す場合は時間をおいてアクセスしてください。</p>
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button className="btn" style={{ width: "auto", padding: "10px 22px" }} onClick={reset}>再読み込み</button>
        <a href="/" className="btn" style={{ width: "auto", padding: "10px 22px", background: "#fff", color: "var(--ink)", border: "1px solid var(--border)", textDecoration: "none" }}>トップへ</a>
      </div>
    </div>
  );
}
