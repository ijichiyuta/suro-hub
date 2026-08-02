"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Article = { aid: string; title: string; date: string; kdash?: string | null; html: string };

export default function ArticleView({ article: a }: { article: Article }) {
  return (
    <>
      <header style={{ position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px" }}>
          <button onClick={() => (history.length > 1 ? history.back() : (location.href = "/"))} style={{ background: "none", border: "none", color: "var(--sub)", display: "flex", cursor: "pointer" }} aria-label="戻る">
            <ChevronLeft size={24} />
          </button>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 800, fontSize: 16, lineHeight: 1.3, letterSpacing: "-0.02em" }}>{a.title}</span>
            {a.date && <span style={{ display: "block", color: "var(--light)", fontSize: 12, marginTop: 2 }} className="num">{a.date}</span>}
          </span>
        </div>
      </header>
      <main className="pad" style={{ paddingTop: 15 }}>
        <p style={{ color: "var(--light)", fontSize: 12, marginBottom: 12 }}>実践・狙い目データ</p>
        <div className="content" dangerouslySetInnerHTML={{ __html: a.html }} />
        <div style={{ marginTop: 24 }}>
          <Link href="/" style={{ color: "var(--blue)", fontWeight: 700, fontSize: 14 }}>← 機種一覧へ戻る</Link>
        </div>
      </main>
    </>
  );
}
