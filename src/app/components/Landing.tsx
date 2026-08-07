"use client";
import Link from "next/link";
import { Target, BarChart3, Calculator, NotebookPen, RefreshCw, WifiOff, Check, LogIn, ChevronRight } from "lucide-react";
import { PRICE_MONTHLY, PRICE_YEARLY, yen } from "@/lib/pricing";

const YEARLY_OFF = Math.round((1 - PRICE_YEARLY / (PRICE_MONTHLY * 12)) * 100);

const FEATURES = [
  { Icon: Target, title: "狙い目・期待値", desc: "全機種の打ち始めゲーム数・期待値を1機種1ページで。天井・ゾーン・やめどきまで。" },
  { Icon: BarChart3, title: "解析・設定判別", desc: "設定差・機械割・小役確率などの解析データを網羅。設定判別の要点も。" },
  { Icon: Calculator, title: "期待値シミュレーター", desc: "スペックを入れると開始G別の期待値とボーダーを自動算出。新台の狙い目づくりに。" },
  { Icon: NotebookPen, title: "稼働ロガー", desc: "実戦の収支・機種・G数を記録。プラスマイナスを色分けで振り返り。" },
  { Icon: RefreshCw, title: "端末間で同期", desc: "お気に入り・稼働ログ・メモがログインで自動同期。スマホとPCどちらでも。" },
  { Icon: WifiOff, title: "店内で高速・オフライン", desc: "一度見た機種は電波が弱くても即表示。ホール内でもサクサク。" },
];

export default function Landing({ onLogin }: { onLogin: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 200, overflowY: "auto" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", zIndex: 2 }}>
        <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>スマスマ期待値ラボ</div>
        <button onClick={onLogin} className="btn" style={{ padding: "8px 16px", fontSize: 13.5 }}><LogIn size={15} />ログイン</button>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 18px 60px" }}>
        {/* ヒーロー */}
        <section style={{ padding: "56px 0 44px", textAlign: "center" }}>
          <div style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, color: "var(--blue)", background: "var(--blue-tint)", padding: "5px 12px", borderRadius: 20, marginBottom: 20 }}>スマスロ・スマパチ 期待値／狙い目</div>
          <h1 style={{ fontSize: 30, lineHeight: 1.3, letterSpacing: "-0.03em", fontWeight: 800 }}>
            打つ前に、勝てる台か<br />ひと目でわかる。
          </h1>
          <p style={{ color: "var(--sub)", fontSize: 15, lineHeight: 1.8, marginTop: 18, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            300機種以上の狙い目・期待値・解析を、1機種1ページに整理。ホールで開いてすぐ判断できる、あなた専用の期待値リファレンス。
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
            <button onClick={onLogin} className="btn" style={{ padding: "13px 28px", fontSize: 15 }}><LogIn size={17} />ログインして使う</button>
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 30, color: "var(--light)", fontSize: 12.5, fontWeight: 600, flexWrap: "wrap" }}>
            <span>300機種以上</span><span>・</span><span>狙い目＋期待値</span><span>・</span><span>毎月更新</span>
          </div>
        </section>

        {/* 特長 */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "18px 16px" }}>
              <span style={{ display: "inline-flex", width: 40, height: 40, borderRadius: 8, background: "var(--blue-tint)", color: "var(--blue)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Icon size={20} strokeWidth={2} /></span>
              <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 5 }}>{title}</div>
              <div style={{ color: "var(--sub)", fontSize: 12.5, lineHeight: 1.65 }}>{desc}</div>
            </div>
          ))}
        </section>

        {/* 料金 */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, textAlign: "center", letterSpacing: "-0.02em" }}>料金プラン</h2>
          <p style={{ color: "var(--sub)", fontSize: 13, textAlign: "center", marginTop: 6 }}>無料でも狙い目の一部をチェック。すべて見るならプレミアム。</p>
          <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--sub)" }}>無料</div>
              <div className="num" style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 14px" }}>¥0</div>
              {["狙い目の一部プレビュー", "機種の基本情報", "期待値シミュレーター", "稼働ロガー"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13 }}><Check size={15} style={{ color: "var(--light)", flex: "none" }} />{t}</div>
              ))}
            </div>
            <div style={{ flex: "1 1 200px", border: "2px solid var(--blue)", borderRadius: 12, padding: 20, background: "var(--blue-tint)", position: "relative" }}>
              <span style={{ position: "absolute", top: -11, left: 20, background: "var(--blue)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12 }}>おすすめ</span>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--blue)" }}>プレミアム</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "6px 0 14px" }}>
                <span className="num" style={{ fontSize: 26, fontWeight: 800 }}>{yen(PRICE_MONTHLY)}<span style={{ fontSize: 13, color: "var(--light)", fontWeight: 600 }}>/月</span></span>
                <span style={{ fontSize: 12, color: "var(--sub)" }}>または年額{yen(PRICE_YEARLY)}（約{YEARLY_OFF}%お得）</span>
              </div>
              {["全機種の狙い目・期待値をフル表示", "解析・設定判別データ", "大量集計データ", "端末間同期・すべての機能"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, fontWeight: 600 }}><Check size={15} style={{ color: "var(--blue)", flex: "none" }} />{t}</div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ marginTop: 44, textAlign: "center", border: "1px solid var(--border)", borderRadius: 12, padding: "32px 20px", background: "var(--blue-tint)" }}>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>さっそく使ってみる</div>
          <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 8, lineHeight: 1.7 }}>現在は招待制です。招待をお持ちの方はログインしてください。<br />ご希望の方は管理者までご連絡ください。</p>
          <button onClick={onLogin} className="btn" style={{ padding: "12px 26px", fontSize: 15, marginTop: 18 }}>ログイン<ChevronRight size={16} /></button>
        </section>

        {/* フッター */}
        <footer style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--line)", display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", fontSize: 12 }}>
          <Link href="/terms" style={{ color: "var(--light)" }}>利用規約</Link>
          <Link href="/tokushoho" style={{ color: "var(--light)" }}>特定商取引法に基づく表記</Link>
          <Link href="/privacy" style={{ color: "var(--light)" }}>プライバシーポリシー</Link>
        </footer>
        <p style={{ textAlign: "center", color: "var(--light)", fontSize: 11, marginTop: 18, lineHeight: 1.7 }}>
          ※本サービスは情報提供を目的とし、遊技結果・収支を保証するものではありません。20歳未満の方はご利用いただけません。
        </p>
      </div>
    </div>
  );
}
