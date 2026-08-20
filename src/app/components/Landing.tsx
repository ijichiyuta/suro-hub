"use client";
import Link from "next/link";
import { Target, BarChart3, Calculator, NotebookPen, RefreshCw, WifiOff, ArrowRight, Gift } from "lucide-react";
import { PRICE_MONTHLY, PRICE_YEARLY, yen } from "@/lib/pricing";

const YEARLY_OFF = Math.round((1 - PRICE_YEARLY / (PRICE_MONTHLY * 12)) * 100);

// 実機種パネル(すろらぼ画像)。網羅性を見せる素材。
const PANELS = [
  "https://media.slolaboratory.com/wp-content/uploads/2025/12/25005811/ltensei-t.png",
  "https://slolaboratory.com/wp-content/uploads/2023/06/karakuri-t.png",
  "https://slolaboratory.com/wp-content/uploads/2025/01/tghoul-t.png",
  "https://media.slolaboratory.com/wp-content/uploads/2026/02/15181443/unato-t.png",
  "https://media.slolaboratory.com/wp-content/uploads/2026/03/29235119/lmilliomgod-t.png",
  "https://media.slolaboratory.com/wp-content/uploads/2025/10/18183555/vvv2-t.png",
  "https://slolaboratory.com/wp-content/uploads/2024/04/lseiya-t.png",
  "https://slolaboratory.com/wp-content/uploads/2023/11/kizuna2tenzen-t.png",
  "https://slolaboratory.com/wp-content/uploads/2023/11/monkey5-t.png",
  "https://slolaboratory.com/wp-content/uploads/2023/03/sshokuto-t.png",
  "https://slolaboratory.com/wp-content/uploads/2024/04/bancho4-t.png",
  "https://slolaboratory.com/wp-content/uploads/2024/06/goder-t.png",
  "https://media.slolaboratory.com/wp-content/uploads/2026/05/13001403/sao2-t.png",
  "https://media.slolaboratory.com/wp-content/uploads/2026/01/06124620/ennenn2-t.png",
  "https://slolaboratory.com/wp-content/uploads/2024/02/chibariyo2-t.png",
  "https://slolaboratory.com/wp-content/uploads/2024/04/lenen-t.png",
];

const FEATURES = [
  { Icon: Target, title: "狙い目・期待値", desc: "打ち始めゲーム数・ゾーン・天井・やめどきを、機種ごとに具体的な数値で。" },
  { Icon: BarChart3, title: "解析・設定判別", desc: "設定差・機械割・小役確率などの解析データと、設定判別の要点を網羅。" },
  { Icon: Calculator, title: "期待値シミュレーター", desc: "スペックを入れると開始ゲーム数別の期待値とボーダーを自動で算出。" },
  { Icon: NotebookPen, title: "稼働ロガー", desc: "実戦の収支・機種・ゲーム数を記録。プラスマイナスを振り返れる。" },
  { Icon: RefreshCw, title: "端末間で同期", desc: "お気に入り・稼働ログ・メモをログインで同期。スマホとPCどちらでも。" },
  { Icon: WifiOff, title: "ホールでも軽い", desc: "一度見た機種は電波が弱くても即表示。オフラインでも確認できる。" },
];

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.visibility = "hidden"; };

// アプリの機種ページを模したモックアップ(実画面に近い見た目でプロダクト価値を伝える)。
function AppMock() {
  return (
    <div style={{ width: "min(300px, 78vw)", background: "#fff", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "0 24px 60px -24px rgba(15,30,70,0.35), 0 6px 16px -8px rgba(15,30,70,0.2)", overflow: "hidden" }}>
      <div style={{ borderBottom: "1px solid var(--line)", padding: "13px 15px", display: "flex", alignItems: "center", gap: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PANELS[0]} alt="" onError={hideOnError} style={{ width: 38, height: 38, objectFit: "contain", flex: "none" }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>L北斗の拳 転生の章2</div>
          <div style={{ color: "var(--light)", fontSize: 10.5, marginTop: 2 }}>サミー</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, padding: "10px 15px 0", fontSize: 12, fontWeight: 700, color: "var(--light)" }}>
        <span style={{ color: "var(--ink)", borderBottom: "2px solid var(--blue)", paddingBottom: 8 }}>狙い目</span>
        <span style={{ paddingBottom: 8 }}>解析</span>
        <span style={{ paddingBottom: 8 }}>大量集計</span>
      </div>
      <div style={{ borderTop: "1px solid var(--line)", padding: "14px 15px 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 12.5, marginBottom: 9 }}>狙い目・期待値</div>
        {[["リセット狙い", "180G〜"], ["ゲーム数天井", "550G〜"], ["宿命モード後", "0G〜"], ["やめどき", "32G+"]].map(([a, b]) => (
          <div key={a} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: "1px solid var(--line)", fontSize: 12 }}>
            <span style={{ color: "var(--sub)" }}>{a}</span>
            <span className="num" style={{ fontWeight: 700 }}>{b}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, background: "var(--blue)", color: "#fff", borderRadius: 8, textAlign: "center", padding: "10px 0", fontSize: 12.5, fontWeight: 700 }}>期待値を計算する</div>
      </div>
    </div>
  );
}

export default function Landing({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  const track = [...PANELS, ...PANELS];
  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 200, overflowY: "auto" }}>
      {/* ヘッダー */}
      <header style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)", zIndex: 3 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>スマスマ期待値ラボ</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
            <button onClick={onLogin} style={{ background: "none", border: "none", color: "var(--sub)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>ログイン</button>
            <button onClick={onSignup} className="btn" style={{ width: "auto", padding: "9px 18px", fontSize: 14 }}>無料で登録</button>
          </div>
        </div>
      </header>

      {/* ヒーロー: 左=コピー / 右=実画面モックアップ(非対称・左寄せ) */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(48px, 8vw, 96px) 24px clamp(40px, 6vw, 72px)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(32px, 5vw, 64px)", alignItems: "center" }}>
          <div style={{ flex: "1 1 380px", minWidth: 0 }}>
            <h1 className="balance" style={{ fontSize: "clamp(34px, 5.4vw, 60px)", lineHeight: 1.18, letterSpacing: "-0.035em", fontWeight: 800 }}>
              打つ前に、勝てる台か<br />ひと目でわかる。
            </h1>
            <p style={{ color: "var(--sub)", fontSize: "clamp(15px, 1.6vw, 17px)", lineHeight: 1.85, marginTop: 22, maxWidth: 460 }}>
              スマスロ・スマパチ 300機種以上の狙い目・期待値・解析を、1機種1ページに整理。ホールで開いて、その場で判断できます。
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 32, flexWrap: "wrap" }}>
              <button onClick={onSignup} className="btn" style={{ width: "auto", padding: "14px 26px", fontSize: 15 }}>無料で登録して始める<ArrowRight size={17} /></button>
              <button onClick={onLogin} style={{ background: "none", border: "none", color: "var(--ink)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>ログイン</button>
            </div>
            {/* 味見フック: 登録した無料会員は人気機種をフル閲覧できる=課金前に価値を体験できることを明示 */}
            <div style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 9, background: "var(--green-tint)", color: "var(--green)", fontWeight: 700, fontSize: 13.5, padding: "9px 14px", borderRadius: 999 }}>
              <Gift size={16} />無料登録で、人気機種をまるごとお試し
            </div>
            <div style={{ marginTop: 22, color: "var(--light)", fontSize: 13, letterSpacing: "0.01em" }}>
              300機種以上を収録　·　毎月更新　·　スマスロ／スマパチ対応
            </div>
          </div>
          <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "center" }}>
            <AppMock />
          </div>
        </div>
      </section>

      {/* 機種の網羅(実パネルのマーキー) */}
      <section style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "clamp(28px, 4vw, 44px) 0", background: "var(--bg-soft)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto 20px", padding: "0 24px", color: "var(--sub)", fontSize: 13.5, fontWeight: 700 }}>北斗・カバネリ・ミリオンゴッドなど、話題の300機種以上を収録</div>
        <div className="marquee">
          <div className="marquee-track">
            {track.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" loading="lazy" onError={hideOnError} style={{ height: "clamp(52px, 8vw, 74px)", width: "auto", objectFit: "contain", flex: "none" }} />
            ))}
          </div>
        </div>
      </section>

      {/* 特長(編集的なグリッド・アイコンタイルや過度な装飾なし) */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(56px, 8vw, 96px) 24px" }}>
        <h2 style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800, letterSpacing: "-0.03em", maxWidth: 520 }}>立ち回りに必要なものを、ひとつに。</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "clamp(28px, 3vw, 44px)", marginTop: "clamp(36px, 5vw, 56px)" }}>
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title}>
              <Icon size={22} strokeWidth={2} style={{ color: "var(--blue)" }} />
              <div style={{ fontWeight: 800, fontSize: 16.5, marginTop: 14, letterSpacing: "-0.01em" }}>{title}</div>
              <p style={{ color: "var(--sub)", fontSize: 14, lineHeight: 1.8, marginTop: 8 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 料金 */}
      <section style={{ borderTop: "1px solid var(--line)", background: "var(--bg-soft)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(56px, 8vw, 96px) 24px" }}>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800, letterSpacing: "-0.03em" }}>料金</h2>
          <p style={{ color: "var(--sub)", fontSize: 15, marginTop: 12, maxWidth: 480, lineHeight: 1.8 }}>登録は無料で、人気機種はそのままお試し閲覧できます。全機種の狙い目・解析・大量集計・計算ツールはプレミアム会員で。</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 36, alignItems: "stretch" }}>
            <div style={{ flex: "1 1 260px", background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: 26 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sub)" }}>無料登録</div>
              <div className="num" style={{ fontSize: 30, fontWeight: 800, margin: "8px 0 4px", letterSpacing: "-0.02em" }}>¥0</div>
              <div style={{ color: "var(--light)", fontSize: 13, lineHeight: 1.7, marginTop: 12 }}>アカウント作成・お気に入り・メモの保存。人気機種は狙い目・解析・大量集計まで無料でお試しできます。</div>
            </div>
            <div style={{ flex: "1 1 260px", background: "#fff", border: "1.5px solid var(--blue)", borderRadius: 14, padding: 26 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)" }}>プレミアム</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "8px 0 4px", flexWrap: "wrap" }}>
                <span className="num" style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>{yen(PRICE_MONTHLY)}<span style={{ fontSize: 14, color: "var(--light)", fontWeight: 600 }}> / 月</span></span>
                <span style={{ fontSize: 13, color: "var(--sub)" }}>年額 {yen(PRICE_YEARLY)}（約{YEARLY_OFF}%お得）</span>
              </div>
              <div style={{ color: "var(--sub)", fontSize: 13.5, lineHeight: 1.8, marginTop: 12 }}>全機種の狙い目・期待値・解析・設定判別・大量集計・期待値計算ツール・端末間同期。</div>
              <button onClick={onSignup} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 18 }}>無料で登録して始める</button>
            </div>
          </div>
        </div>
      </section>

      {/* 最終CTA(ダークで一箇所だけコントラスト) */}
      <section style={{ background: "#0e1526", color: "#fff" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(56px, 8vw, 100px) 24px", textAlign: "center" }}>
          <h2 className="balance" style={{ fontSize: "clamp(26px, 3.6vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.3 }}>今日の立ち回りを、<br />データで決める。</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, marginTop: 16, lineHeight: 1.8 }}>登録は無料。まずは中身を確かめてみてください。</p>
          <button onClick={onSignup} className="btn" style={{ width: "auto", padding: "14px 30px", fontSize: 15, marginTop: 28 }}>無料で登録して始める<ArrowRight size={17} /></button>
        </div>
      </section>

      {/* フッター */}
      <footer style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px 48px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13 }}>
          <Link href="/terms" style={{ color: "var(--sub)" }}>利用規約</Link>
          <Link href="/tokushoho" style={{ color: "var(--sub)" }}>特定商取引法に基づく表記</Link>
          <Link href="/privacy" style={{ color: "var(--sub)" }}>プライバシーポリシー</Link>
        </div>
        <div style={{ color: "var(--light)", fontSize: 11.5, lineHeight: 1.7 }}>情報提供を目的とし、遊技結果・収支を保証するものではありません。20歳未満はご利用いただけません。</div>
      </footer>
    </div>
  );
}
