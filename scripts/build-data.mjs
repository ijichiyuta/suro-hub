// build-data.mjs — 期待値(suroschool)＋研究所(slolabo)を統合し、アプリが読む実データを生成。
//   出力: src/data/index.json(機種一覧+検索索引) / src/data/machines/<id>.json(機種詳細メタ)
//   ※このスクリプトはローカルで実行→生成物(src/data)をコミット。CIは生成物を読むだけ。
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const EV_DIR = "/Users/ijichiyuuta/.superset/projects/smartslotgoal/data/json";
const LAB_DIR = "/Users/ijichiyuuta/.superset/projects/slolabo/data";
const OUT = path.join(ROOT, "src", "data");
fs.rmSync(path.join(OUT, "machines"), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "machines"), { recursive: true });

const load = (p) => JSON.parse(fs.readFileSync(p, "utf-8"));
const ev = load(path.join(EV_DIR, "machines.json"));           // 167 (title, thumb, *_html, date...)
const lab = load(path.join(LAB_DIR, "machines.json"));          // 285 (name, thumb, isNew, sections, otherIds)
const posts = load(path.join(LAB_DIR, "json", "posts.json"));  // 1795
const dir = load(path.join(LAB_DIR, "json", "machine-directory.json")); // 291 [name,?,alias[],nick[],url[],maker,thumb]
const byPost = {}; posts.forEach((p) => (byPost[p.id] = p));

const decode = (s) => (s || "").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&amp;/g, "&");
const kana = (s) => (s || "").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const norm = (s) => kana((s || "").normalize("NFKC").toLowerCase()).replace(/[^0-9a-zぁ-ん一-鿿]/gu, "");
const stripPre = (n) => n.replace(/^(スマスロ|スマパチ|パチスロ|新パチスロ|ぱちすろ|l|s|a)/, "");
const badThumb = (t) => !t || /add_favo|loading|\.gif$/i.test(t);
// 期待値サイトの静的HTML(狙い目/解析)を描画用にクリーニング（scriptなし＝そのまま使える）
const cleanEv = (html) => {
  if (!html) return "";
  let h = html;
  h = h.replace(/<img[^>]*machine-thumbnail[^>]*>/gi, "");        // 先頭の重複サムネ除去
  h = h.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  h = h.replace(/\s(srcset|sizes|style|width|height|loading|decoding|class)="[^"]*"/gi, "");
  h = h.replace(/(<img[^>]+src=")\/(?!\/)/gi, "$1https://suroschool.jp/"); // 相対→絶対
  h = h.replace(/<img /gi, '<img loading="lazy" ');
  return h.trim();
};
const idOf = (name) => "m" + crypto.createHash("md5").update(name).digest("hex").slice(0, 10);
const postMeta = (id) => { const p = byPost[id]; if (!p) return null; return { id, title: decode((p.title.rendered || "").trim()), date: (p.date || "").slice(0, 10), cats: p.categories || [] }; };

// 辞書: norm(任意名) -> {canon, aliases, maker, dirthumb}
const dirByNorm = new Map();
for (const d of dir) {
  const canon = d[0], aliases = [...(d[2] || []), ...(d[3] || [])], maker = d[5] || "", th = d[6] || "";
  const rec = { canon, aliases, maker, th };
  for (const k of [d[0], ...aliases]) { const nk = norm(k); if (nk) { if (!dirByNorm.has(nk)) dirByNorm.set(nk, rec); const sp = stripPre(nk); if (sp.length >= 2 && !dirByNorm.has(sp)) dirByNorm.set(sp, rec); } }
}
const dirInfo = (name) => dirByNorm.get(norm(name)) || dirByNorm.get(stripPre(norm(name))) || null;

// ラボ機種を基盤に unified を構築
const unified = new Map(); // id -> machine
for (const m of lab) {
  const di = dirInfo(m.name);
  const id = idOf(m.name);
  const cols = (m.otherIds || []).map(postMeta).filter(Boolean);
  unified.set(id, {
    id, name: m.name, aliases: di ? di.aliases : [], maker: di ? di.maker : "",
    thumb: !badThumb(m.thumb) ? m.thumb : (di && !badThumb(di.th) ? di.th : ""),
    isNew: !!m.isNew, sources: { lab: true, ev: false },
    lab: { nerai: m.sections?.nerai || null, spec: m.sections?.spec || null, shukei: m.sections?.shukei || null, columns: cols },
    ev: null,
    _norm: [norm(m.name), stripPre(norm(m.name))],
  });
}
// ラボの norm 逆引き
const labByNorm = new Map();
for (const [id, mc] of unified) { for (const k of [...mc._norm, ...mc.aliases.map(norm)]) if (k) if (!labByNorm.has(k)) labByNorm.set(k, id); }

// 期待値機種をマッチ（記事/ツールは除外）
const artRe = /狙い|実践|考察|シミュ|紹介|について|履歴|打法|データ|サブスク|note|優遇冷遇|突入契機|重視すべき/;
let matched = 0, added = 0, skipped = 0;
for (const e of ev) {
  const name = decode(e.title || "").replace(/🆕|🔥|⭐|★/g, "").trim();
  if (!name || artRe.test(name)) { skipped++; continue; }
  const n = norm(name), s = stripPre(n);
  const hitId = labByNorm.get(n) || labByNorm.get(s);
  const neraiHtml = cleanEv((e.nerai_html || "") + (e.tenjo_html && !/(狙い目|天井)/.test(e.nerai_html || "") ? e.tenjo_html : ""));
  const evData = { slug: e.slug, kdash: e.kdash_url || null, nerai: neraiHtml, spec: cleanEv(e.kaiseki_html || "") };
  if (hitId) {
    const mc = unified.get(hitId); mc.sources.ev = true; mc.ev = evData;
    if (!mc.thumb && !badThumb(e.thumb)) mc.thumb = e.thumb;
    matched++;
  } else {
    const id = idOf(name);
    if (unified.has(id)) { unified.get(id).sources.ev = true; unified.get(id).ev = evData; matched++; continue; }
    const di = dirInfo(name);
    unified.set(id, {
      id, name, aliases: di ? di.aliases : [], maker: di ? di.maker : "",
      thumb: !badThumb(e.thumb) ? e.thumb : "", isNew: /🆕/.test(e.title || ""),
      sources: { lab: false, ev: true }, lab: null, ev: evData, _norm: [n, s],
    });
    added++;
  }
}

// 出力
const machines = [...unified.values()].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || a.name.localeCompare(b.name, "ja"));
const index = machines.map((m) => ({
  id: m.id, name: m.name, maker: m.maker, thumb: m.thumb, isNew: m.isNew,
  sources: m.sources, k: [...new Set([norm(m.name), ...m.aliases.map(norm)])].filter(Boolean).join(" "),
}));
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index));
for (const m of machines) { const { _norm, ...out } = m; fs.writeFileSync(path.join(OUT, "machines", m.id + ".json"), JSON.stringify(out)); }

console.log(`統合機種: ${machines.length}（両方:${machines.filter(m => m.sources.ev && m.sources.lab).length} / 研究所のみ:${machines.filter(m => m.sources.lab && !m.sources.ev).length} / 期待値のみ:${machines.filter(m => m.sources.ev && !m.sources.lab).length}）`);
console.log(`期待値マッチ:${matched} / 新規追加:${added} / 記事ツール除外:${skipped}`);
console.log(`サムネ有: ${machines.filter(m => m.thumb).length} / 別名有: ${machines.filter(m => m.aliases.length).length}`);
