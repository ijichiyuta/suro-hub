"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Star, Calculator, Crown } from "lucide-react";
import { useFav } from "@/lib/favorites";
import { pushRecent } from "@/lib/recent";
import { useNote, setNote } from "@/lib/notes";
import { useSubscription } from "@/lib/subscription";
import { supabase } from "@/lib/supabase";
import { PaywallCard } from "./Paywall";

type Col = { id: number; title: string; date: string };
type Machine = {
  id: string; name: string; aliases: string[]; maker: string; thumb: string; isNew: boolean;
  hasCalc?: boolean; hasSpec?: boolean; hasShukei?: boolean; hasFullNerai?: boolean;
  neraiTeaser?: string; neraiSource?: string; freeSample?: boolean;
  sources: { ev: boolean; lab: boolean };
  lab: null | { columns: Col[] };
  ev: null | { slug: string; kdash: string | null };
};
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

const TABS = ["狙い目", "解析・設定", "大量集計"] as const;

function Content({ html }: { html: string }) {
  return <div className="content" dangerouslySetInnerHTML={{ __html: html }} />;
}
// 狙い目クイックナビ: 見出しへスクロールジャンプ(横スクロールのチップ)。「タップ→すぐ狙い目のゲーム数」用。
function NeraiNav({ items }: { items: { label: string; id: string }[] }) {
  const jump = (id: string) => {
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <nav className="nerai-nav" aria-label="狙い目クイックナビ">
      {items.map((it) => (
        <button key={it.id} type="button" onClick={() => jump(it.id)} className="nerai-chip">{it.label}</button>
      ))}
    </nav>
  );
}
function Pending({ text }: { text: string }) {
  return <p style={{ color: "var(--light)", padding: "16px 0", fontSize: 13 }}>{text}</p>;
}
function Loading() {
  return <p style={{ color: "var(--light)", padding: "16px 0", fontSize: 13 }}>読み込み中…</p>;
}
// 無料サンプル(味見)の帯: 非会員にも全文公開している機種であることを明示。
function FreeSampleBanner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--green-tint)", border: "1px solid var(--green)", color: "var(--green)", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, fontWeight: 700, marginBottom: 12, lineHeight: 1.5 }}>
      <i className="badge free">無料サンプル</i>
      <span>この機種は登録なしで全内容を公開中です。</span>
    </div>
  );
}
// 無料サンプル閲覧中の非会員へ: 他機種も見るための会員登録CTA。
function FreeSampleUpsell() {
  return (
    <div style={{ marginTop: 20, border: "1px solid var(--border)", borderRadius: 8, padding: "20px 18px", textAlign: "center", background: "var(--bg-soft)" }}>
      <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 4 }}>この続き、他の全機種でも。</div>
      <div style={{ color: "var(--sub)", fontSize: 12.5, marginBottom: 14, lineHeight: 1.6 }}>プレミアム会員なら全機種の狙い目・解析・大量集計＋期待値計算ツールが使い放題です。</div>
      <Link href="/upgrade" className="btn" style={{ justifyContent: "center" }}><Crown size={16} /> プレミアムにアップグレード</Link>
    </div>
  );
}

export default function MachineView({ machine: m }: { machine: Machine }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("狙い目");
  const [calc, setCalc] = useState(false);
  const { fav, toggle } = useFav(m.id);
  const { premium, loading: subLoading } = useSubscription();  // free=一部プレビュー / premium=全表示
  // 無料サンプル(味見): この機種は非会員でも狙い目/解析/集計を全文表示(計算ツールは会員限定のまま)。
  const access = premium || !!m.freeSample;
  const freeOpen = !premium && !!m.freeSample; // 非会員が味見で見ている状態
  useEffect(() => { pushRecent(m.id); }, [m.id]);
  const savedNote = useNote(m.id);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteFocus, setNoteFocus] = useState(false);
  useEffect(() => { if (!noteFocus) setNoteDraft(savedNote); }, [savedNote, noteFocus]);
  // 狙い目全文・解析・集計は重いので遅延取得。無料会員はプレビュー(teaser)のみで取得しない=会員限定。
  //   プレミアムは機種を開いた時点でまとめて取得(狙い目=既定タブを速く出すため)。
  const [specData, setSpecData] = useState<{ nerai?: string; spec: string; shukei: string; neraiNav?: { label: string; id: string }[]; error?: boolean } | null>(null);
  const [specLoading, setSpecLoading] = useState(false);
  const needData = access && (m.hasFullNerai || m.hasSpec || m.hasShukei);
  useEffect(() => {
    if (!needData || specData || specLoading) return;
    setSpecLoading(true);
    (async () => {
      // 保護データ(/data/spec)にアクセストークンを付与して取得(Cloudflare Functionが会員判定)。
      //   無料サンプル機種は、非premiumでもログイン済みなら middleware が配信する(トークン必須)。
      let headers: Record<string, string> | undefined;
      try {
        const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
        const t = data.session?.access_token;
        if (t) headers = { Authorization: `Bearer ${t}` };
      } catch { /* トークン無しでも試行(公開機種等) */ }
      const r = await fetch(`${BASE}/data/spec/${m.id}.json`, headers ? { headers } : undefined);
      if (!r.ok) throw new Error(String(r.status));
      setSpecData(await r.json());
    })()
      .catch(() => setSpecData({ spec: "", shukei: "", error: true }))
      .finally(() => setSpecLoading(false));
  }, [needData, specData, specLoading, m.id]);

  return (
    <>
      <header style={{ position: "sticky", top: 0, background: "#fff", zIndex: 20, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px" }}>
          <Link href="/" style={{ color: "var(--sub)", display: "flex" }}><ChevronLeft size={24} /></Link>
          {m.thumb
            ? // eslint-disable-next-line @next/next/no-img-element
              <img src={m.thumb} alt="" style={{ width: 44, height: 44, borderRadius: 4, objectFit: "cover", border: "1px solid var(--border)" }} />
            : <span style={{ width: 44, height: 44, borderRadius: 4, background: "var(--bg-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>🎰</span>}
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 800, fontSize: 16, lineHeight: 1.25, letterSpacing: "-0.02em" }}>{m.name}</span>
            <span style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 3, flexWrap: "wrap" }}>
              {m.isNew && <i className="badge new">新台</i>}
              {m.freeSample && <i className="badge free">無料サンプル</i>}
              {m.maker && <span style={{ color: "var(--light)", fontSize: 12 }}>{m.maker}</span>}
            </span>
          </span>
          <button type="button" onClick={toggle} aria-label={fav ? "お気に入りを解除" : "お気に入りに追加"}
            style={{ background: "none", border: "none", color: fav ? "var(--blue)" : "var(--light)", display: "flex", padding: 9, margin: -9, cursor: "pointer", touchAction: "manipulation" }}>
            <Star size={24} fill={fav ? "var(--blue)" : "none"} />
          </button>
        </div>
        <div className="pad tabs">
          {TABS.map((t) => (<button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>))}
        </div>
      </header>

      <main className="pad" style={{ paddingTop: 15 }}>
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onFocus={() => setNoteFocus(true)}
          onBlur={() => { setNoteFocus(false); setNote(m.id, noteDraft); }}
          placeholder="＋ 自分メモ（設定示唆・立ち回り・ホール状況など）"
          rows={noteDraft ? 3 : 1}
          style={{ width: "100%", resize: "vertical", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--ink)", background: "var(--bg-soft)", outline: "none", lineHeight: 1.6, marginBottom: 15 }}
        />
        {tab === "狙い目" && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>狙い目・期待値</h2>
            {!m.hasFullNerai ? (
              <Pending text="この機種の狙い目データは準備中です。" />
            ) : access ? (
              <>
                {freeOpen && <FreeSampleBanner />}
                {/* 狙い目クイックナビ: タップでその狙い目(リセット/天井/ゾーン/やめどき等)へ即ジャンプ */}
                {specData?.neraiNav && specData.neraiNav.length > 0 && <NeraiNav items={specData.neraiNav} />}
                {/* 狙い目全文は保護ファイル(遅延)から取得。取得中は冒頭teaserを表示し全文へ差替(読み込み中テキストは出さない) */}
                <Content html={specData?.nerai || m.neraiTeaser || ""} />
                {/* 計算ツールは会員限定(味見機種でも非会員には出さない=中身は/calcでmiddleware保護)。
                    計算ボタンは全文表示後に出す=teaser→全文の高さ変化でボタンが飛ぶのを防ぐ */}
                {m.hasCalc && premium && specData && (calc ? (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <h3 style={{ fontSize: 15 }}>期待値計算ツール</h3>
                      <button onClick={() => setCalc(false)} style={{ background: "none", border: "none", color: "var(--sub)", fontWeight: 700, fontSize: 13 }}>閉じる</button>
                    </div>
                    <iframe src={`${BASE}/calc/${m.id}.html`} title="期待値計算ツール" style={{ width: "100%", height: "78vh", border: "1px solid var(--border)", borderRadius: 6, background: "#fff" }} />
                  </div>
                ) : (
                  <button className="btn" style={{ marginTop: 16 }} onClick={() => setCalc(true)}><Calculator size={18} /> 期待値を計算する</button>
                ))}
                {freeOpen && <FreeSampleUpsell />}
              </>
            ) : subLoading ? null : (
              <PaywallCard label="狙い目・期待値は会員限定です" />
            )}
          </>
        )}
        {tab === "解析・設定" && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>解析・設定判別</h2>
            {!m.hasSpec ? <Pending text="解析データは準備中です。" />
              : subLoading ? <Loading />
              : !access ? <PaywallCard label="解析・設定は会員限定です" />
              : specData ? (specData.spec ? <><Content html={specData.spec} />{freeOpen && <FreeSampleUpsell />}</> : <Pending text="解析データを読み込めませんでした。" />) : <Loading />}
          </>
        )}
        {tab === "大量集計" && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>大量集計</h2>
            {!m.hasShukei
              ? <Pending text="大量集計データはありません。" />
              : subLoading ? <Loading />
              : !access ? <PaywallCard label="大量集計は会員限定です" />
              : specData ? (specData.shukei ? <><Content html={specData.shukei} />{freeOpen && <FreeSampleUpsell />}</> : <Pending text="集計データを読み込めませんでした。" />) : <Loading />}
          </>
        )}
      </main>
    </>
  );
}
