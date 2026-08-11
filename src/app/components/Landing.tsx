"use client";
import Link from "next/link";
import { Target, BarChart3, Calculator, NotebookPen, RefreshCw, WifiOff, Check, LogIn, ChevronRight } from "lucide-react";
import { PRICE_MONTHLY, PRICE_YEARLY, yen } from "@/lib/pricing";

const YEARLY_OFF = Math.round((1 - PRICE_YEARLY / (PRICE_MONTHLY * 12)) * 100);

// ヒーローの実機種パネル(すろらぼ画像・サイト全体で使用中のもの)。硬さを和らげる視覚要素。
const PANELS = [
  "https://media.slolaboratory.com/wp-content/uploads/2025/12/25005811/ltensei-t.png",
  "https://media.slolaboratory.com/wp-content/uploads/2026/02/15181443/unato-t.png",
  "https://media.slolaboratory.com/wp-content/uploads/2026/03/29235119/lmilliomgod-t.png",
  "https://slolaboratory.com/wp-content/uploads/2023/06/karakuri-t.png",
  "https://slolaboratory.com/wp-content/uploads/2025/01/tghoul-t.png",
  "https://slolaboratory.com/wp-content/uploads/2024/04/lseiya-t.png",
  "https://media.slolaboratory.com/wp-content/uploads/2025/10/18183555/vvv2-t.png",
];

const FEATURES = [
  { Icon: Target, title: "狙い目・期待値", desc: "全機種の打ち始めゲーム数・期待値を1機種1ページで。天井・ゾーン・やめどきまで。" },
  { Icon: BarChart3, title: "解析・設定判別", desc: "設定差・機械割・小役確率などの解析データを網羅。設定判別の要点も。" },
  { Icon: Calculator, title: "期待値シミュレーター", desc: "スペックを入れると開始G別の期待値とボーダーを自動算出。新台の狙い目づくりに。" },
  { Icon: NotebookPen, title: "稼働ロガー", desc: "実戦の収支・機種・G数を記録。プラスマイナスを色分けで振り返り。" },
  { Icon: RefreshCw, title: "端末間で同期", desc: "お気に入り・稼働ログ・メモがログインで自動同期。スマホとPCどちらでも。" },
  { Icon: WifiOff, title: "店内で高速・オフライン", desc: "一度見た機種は電波が弱くても即表示。ホール内でもサクサク。" },
];

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.visibility = "hidden"; };

export default function Landing({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 200, overflowY: "auto" }}>
      {/* ヘッダー(中央寄せ・ボタンは伸ばさない) */}
      <div style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--line)", zIndex: 3 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>スマスマ期待値ラボ</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <button onClick={onLogin} style={{ background: "none", border: "none", color: "var(--sub)", fontWeight: 700, fontSize: 13.5, cursor: "pointer", padding: "6px 4px" }}>ログイン</button>
            <button onClick={onSignup} className="btn" style={{ width: "auto", padding: "9px 16px", fontSize: 13.5 }}>無料登録</button>
          </div>
        </div>
      </div>

      {/* ヒーロー */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(40px, 6vw, 64px) 18px clamp(28px, 4vw, 40px)", textAlign: "center" }}>
        <div style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, color: "var(--blue)", background: "var(--blue-tint)", padding: "5px 12px", borderRadius: 20, marginBottom: 20 }}>スマスロ・スマパチ 期待値／狙い目</div>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 40px)", lineHeight: 1.28, letterSpacing: "-0.03em", fontWeight: 800 }}>
          打つ前に、勝てる台か<br />ひと目でわかる。
        </h1>
        <p style={{ color: "var(--sub)", fontSize: "clamp(14px, 2.6vw, 16px)", lineHeight: 1.8, marginTop: 18, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
          300機種以上の狙い目・期待値・解析を、1機種1ページに整理。ホールで開いてすぐ判断できる、あなた専用の期待値リファレンス。
        </p>
        <div style={{ marginTop: 26, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onSignup} className="btn" style={{ width: "auto", padding: "13px 30px", fontSize: 15 }}>無料で登録して始める<ChevronRight size={17} /></button>
          <button onClick={onLogin} className="btn" style={{ width: "auto", padding: "13px 24px", fontSize: 15, background: "#fff", color: "var(--ink)", border: "1px solid var(--border)" }}><LogIn size={17} />ログイン</button>
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 26, color: "var(--light)", fontSize: 12.5, fontWeight: 600, flexWrap: "wrap" }}>
          <span>300機種以上</span><span aria-hidden>・</span><span>狙い目＋期待値</span><span aria-hidden>・</span><span>毎月更新</span>
        </div>

        {/* 実機種パネルのショーケース(横並び・端はフェード) */}
        <div style={{ position: "relative", marginTop: 34 }}>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "flex-end", flexWrap: "wrap" }}>
            {PANELS.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" loading="lazy" onError={hideOnError}
                style={{ height: "clamp(56px, 12vw, 92px)", width: "auto", objectFit: "contain", filter: "drop-shadow(0 6px 14px rgba(20,40,90,0.16))", borderRadius: 6 }} />
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 18px 60px" }}>
        {/* 特長(auto-fitで自動的にスマホ1列/PC2列) */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, marginTop: 8 }}>
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
          <p style={{ color: "var(--sub)", fontSize: 13, textAlign: "center", marginTop: 6 }}>登録は無料。全機能（狙い目・解析・集計・計算ツール）の閲覧はプレミアム会員で。</p>
          <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--sub)" }}>無料登録</div>
              <div className="num" style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 14px" }}>¥0</div>
              {["アカウント作成", "お気に入り・メモの保存"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13 }}><Check size={15} style={{ color: "var(--light)", flex: "none" }} />{t}</div>
              ))}
              <div style={{ fontSize: 11.5, color: "var(--light)", marginTop: 8, lineHeight: 1.6 }}>※狙い目・解析・大量集計・計算ツールはプレミアム限定</div>
            </div>
            <div style={{ flex: "1 1 220px", border: "2px solid var(--blue)", borderRadius: 12, padding: 20, background: "var(--blue-tint)", position: "relative" }}>
              <span style={{ position: "absolute", top: -11, left: 20, background: "var(--blue)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12 }}>おすすめ</span>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--blue)" }}>プレミアム</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "6px 0 14px", flexWrap: "wrap" }}>
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
        <section style={{ marginTop: 44, textAlign: "center", border: "1px solid var(--border)", borderRadius: 12, padding: "clamp(24px, 5vw, 34px) 20px", background: "var(--blue-tint)" }}>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>さっそく始める</div>
          <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 8, lineHeight: 1.7 }}>無料登録して、プレミアム（月額{yen(PRICE_MONTHLY)}／年額{yen(PRICE_YEARLY)}）で<br />全機種の狙い目・解析・計算ツールが見放題に。</p>
          <button onClick={onSignup} className="btn" style={{ width: "auto", padding: "12px 28px", fontSize: 15, marginTop: 18, margin: "18px auto 0" }}>無料で登録して始める<ChevronRight size={16} /></button>
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
