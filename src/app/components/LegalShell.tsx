import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// 法務ページ共通枠(利用規約/特商法/プライバシー)。ログイン前でも閲覧できるようGateで公開扱い。
export default function LegalShell({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <header style={{ position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
          <Link href="/" style={{ color: "var(--sub)", display: "flex" }}><ChevronLeft size={24} /></Link>
          <h1 style={{ fontSize: 17 }}>{title}</h1>
        </div>
      </header>
      <main className="pad legal" style={{ paddingTop: 18, paddingBottom: 40, maxWidth: 760, margin: "0 auto" }}>
        {children}
        {updated && <p style={{ color: "var(--light)", fontSize: 12, marginTop: 28 }}>制定・最終改定日: {updated}</p>}
        <div style={{ marginTop: 20, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5 }}>
          <Link href="/terms" style={{ color: "var(--blue)" }}>利用規約</Link>
          <Link href="/tokushoho" style={{ color: "var(--blue)" }}>特定商取引法に基づく表記</Link>
          <Link href="/privacy" style={{ color: "var(--blue)" }}>プライバシーポリシー</Link>
        </div>
      </main>
    </>
  );
}
