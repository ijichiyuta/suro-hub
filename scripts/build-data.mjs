// build-data.mjs — 期待値(suroschool)＋研究所(slolabo)を統合し、アプリが読む実データを生成。
//   出力: src/data/index.json(機種一覧+検索索引) / src/data/machines/<id>.json(機種詳細メタ)
//   ※このスクリプトはローカルで実行→生成物(src/data)をコミット。CIは生成物を読むだけ。
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { load as loadHtml } from "/Users/ijichiyuuta/.superset/projects/slolabo/scraper/node_modules/cheerio/dist/commonjs/index.js";

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
// ★重要: norm()はカタカナ→ひらがな変換を先に行うため、stripPreに渡る文字列は既にひらがな。
//   旧実装はカタカナの「スマスロ/スマパチ/パチスロ」を並べていたが、入力がひらがな化済みのため
//   永久にマッチせず（＝「スマスロモンキーターンV」の接頭辞が剥がれず、ev「LモンキーターンV」と
//   別機種扱いになり重複していた）。ひらがな形(すますろ/すまぱち/新ぱちすろ 等)を追加して修正。
const stripPre = (n) => n.replace(/^(すますろ|すまぱち|新ぱちすろ|ぱちすろ|スマスロ|スマパチ|パチスロ|新パチスロ|l|s|a)/, "");
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
const artId = (key) => "a" + crypto.createHash("md5").update(key).digest("hex").slice(0, 10);
const BASEPATH = "/suro-hub"; // GitHub Pages プロジェクトサイト。注入HTML内リンクは実URLを直書き。
const postMeta = (id) => { const p = byPost[id]; if (!p) return null; return { id, title: decode((p.title.rendered || "").trim()), date: (p.date || "").slice(0, 10), cats: p.categories || [] }; };

// 研究所投稿HTMLのクリーニング(slolabo gen.mjs cleanを踏襲)。stripCalc=計算ツールDOM/データを除去(別途iframe表示)。
function cleanLab(html, title, stripCalc) {
  const $ = loadHtml(html || "");
  ["style", "noscript", "link", "#hamburger-menu", ".draggable", "[class*=menu-content]",
    ".updateItem", ".update-information", "[class*=updateList]", "img.icon", "img[src*=update3]", "img[alt=update]",
    "[class*=new-close]", ".wpfp-span", ".wpfp-link", "[class*=wpfp]", "a.not-decoration", "[class*=breadcrumb]", ".helptip"].forEach((sel) => { try { $(sel).remove(); } catch {} });
  if (stripCalc) { $("#kitaichiCalculationTool2, #hosokuWrap").remove(); $("script:not([src])").each((i, e) => { if (/labelList2/.test($(e).html() || "")) $(e).remove(); }); }
  const T = (title || "").replace(/\s+/g, "");
  if (T) $("h1, h2").each((i, e) => { if ($(e).text().replace(/\s+/g, "") === T) { $(e).remove(); return false; } });
  $("#columnIndex").remove();
  $("h1, h2, h3, h4").each((i, e) => { const t = $(e).text().replace(/\s+/g, ""); if (/^目次$/.test(t)) { $(e).remove(); return; } if (/^更新情報/.test(t)) { const nx = $(e).next(); $(e).remove(); if (nx.is("table")) nx.remove(); } });
  $("div.right").each((i, e) => { if (/\d{4}\/\d{1,2}\/\d{1,2}.*公開/.test($(e).text())) $(e).remove(); });
  $(".js-menu, .js-menu2, .js-menu3").each((i, e) => { const $e = $(e); if (/更新情報|目次/.test($e.text())) { const nx = $e.next(); if (nx && /contents/.test(nx.attr("class") || "")) nx.remove(); $e.remove(); } });
  $("script[src]").remove();
  $("script:not([src])").each((i, e) => { const c = $(e).html() || ""; if (/adsbygoogle|gtag\(|dataLayer|googletag|gtm\.|fbq\(/i.test(c)) $(e).remove(); });
  $("a").each((i, e) => { const t = $(e).text().trim(); if (/ページの一番上へ|トップページへ|元の場所に戻る|見出しを閉じる|全て開く|メニューを開閉|大見出しを開く|大見出し、中見出しを開く/.test(t)) $(e).remove(); });
  $("li").each((i, e) => { const t = $(e).text().replace(/\s+/g, ""); if (t === "" || t === "。" || t === "・") $(e).remove(); });
  $("img").each((i, e) => { const $e = $(e); let s = $e.attr("data-src") || $e.attr("src"); if (s && s.startsWith("/")) s = "https://slolaboratory.com" + s; if (s) { $e.attr("src", s); $e.removeAttr("data-src"); $e.removeAttr("srcset"); $e.attr("loading", "lazy"); } });
  $("a").each((i, e) => { let h = $(e).attr("href"); if (h && h.startsWith("/")) $(e).attr("href", "https://slolaboratory.com" + h); });
  return ($("body").html() || "").replace(/（タップで開閉）/g, "").trim();
}
const cleanPost = (pid, stripCalc) => { const p = byPost[pid]; if (!p) return ""; return cleanLab(p.content.rendered, p.title.rendered, stripCalc); };

// ★外部リンク内部化（このサイトで完結／サイト外へ誘導しない）:
//   ① 参考元/出典 等の“外部誘導セクション”を見出しごと丸ごと除去
//   ② javascript:void(0)・#・画像lightbox のアンカーはリンク解除（テキスト/画像だけ残す）
//   ③ 元サイト(suroschool)の機種/記事ページへのリンクは内部URL(/m/・/a/)へ書換
//   ④ その他すべての外部リンク(3rd party/外部ツール/研究所相互リンク)はリンク解除=テキスト化
const REF_HEAD = /^(参考元|参考サイト|参考にしたサイト|参考にさせて|引用元|出典|外部リンク|関連リンク|関連記事|おすすめ記事)[:：]?$/;
const isImgUrl = (u) => /\.(jpe?g|png|gif|webp|svg)(\?|#|$)/i.test(u);
const linkPathKey = (href) => { // /archives/machine/<name> の <name> を正規化キー化
  try { const u = new URL(href, "https://suroschool.jp"); return norm(decodeURIComponent(u.pathname.replace(/\/+$/, "").split("/").pop() || "")); } catch { return ""; }
};
function internalizeLinks(html, maps) {
  if (!html) return html;
  html = html.replace(/<!--[\s\S]*?-->/g, ""); // 非表示コメント(旧ツールメニュー等/中に外部リンク)を除去
  if (!/<a\b/i.test(html) && !/参考元|参考サイト|引用元|出典|関連リンク|関連記事|<link|<noscript/i.test(html)) return html;
  const $ = loadHtml(html);
  // リソース参照(外部CSS/JS等)・noscriptは除去/展開。href/targetは<a>以外に付いても誘導しないため剥がす。
  $("link, meta, script, style").remove();
  for (const e of $("noscript").toArray()) $(e).replaceWith($(e).html() || "");
  for (const e of $("[href]").toArray()) if (e.tagName !== "a") $(e).removeAttr("href");
  // ① 外部誘導セクション除去（見出し＋次の見出しが来るまでの兄弟）
  // ※.each()中のDOM変更は兄弟をスキップし得るため、必ず toArray() でスナップショットしてから処理。
  for (const e of $("h1,h2,h3,h4,h5,h6").toArray()) {
    const t = $(e).text().replace(/\s+/g, "");
    if (!REF_HEAD.test(t)) continue;
    const kill = [e]; let sib = $(e).next();
    while (sib.length && !/^h[1-6]$/i.test(sib[0].tagName)) { kill.push(sib[0]); sib = sib.next(); }
    kill.forEach((n) => $(n).remove());
  }
  // ②③④ 個別リンク処理
  for (const e of $("a").toArray()) {
    const $e = $(e); const href = ($e.attr("href") || "").trim(); const inner = $e.html() || "";
    if (!href || /^javascript:/i.test(href) || href.startsWith("#")) { $e.replaceWith(inner || $e.text()); continue; }
    if (isImgUrl(href)) { $e.replaceWith($e.find("img").length ? inner : $e.text()); continue; } // lightbox→画像残す
    let host = ""; try { host = new URL(href, "https://suroschool.jp").hostname; } catch {}
    if (/(^|\.)suroschool\.jp$/.test(host)) { // 元サイトの機種/記事 → 内部化
      const key = linkPathKey(href);
      const mid = maps.machine.get(key) || maps.machine.get(stripPre(key));
      const aid = maps.article.get(key);
      if (mid) { $e.attr("href", BASEPATH + "/m/" + mid + "/").removeAttr("target").removeAttr("rel"); continue; }
      if (aid) { $e.attr("href", BASEPATH + "/a/" + aid + "/").removeAttr("target").removeAttr("rel"); continue; }
    }
    $e.replaceWith(inner || $e.text()); // その他外部 → リンク解除
  }
  // 空要素の掃除
  for (const e of $("ul,ol").toArray()) { if (!$(e).find("li").length) $(e).remove(); }
  for (const e of $("li,p").toArray()) { const $e = $(e); if (!$e.text().trim() && !$e.find("img,table,br,iframe").length) $e.remove(); }
  return ($("body").html() || "").trim();
}

// ★リライト検証(情報不変ゲート): 原文の数字が1つも欠落せず、捏造(原文に無い数字)も無いことを確認。
// タグ＋HTML実体(&#8211;等)除去→整数ランのみ抽出。原文の「1.3.5.7周期」等のドット区切りを
// 小数と誤読しないため \d+(整数ラン)で照合(小数24.2は両側とも24,2に割れるので判定は健全)。
const numSet = (html) => new Set(((html || "").replace(/<[^>]+>/g, " ").replace(/&#?[a-z0-9]+;/gi, " ").match(/\d+/g)) || []);
function verifyRewrite(orig, rw) {
  const a = numSet(orig), b = numSet(rw);
  const missing = [...a].filter((x) => !b.has(x));   // 原文の数字が欠落
  const added = [...b].filter((x) => !a.has(x));      // 原文に無い数字(捏造)
  return { ok: missing.length === 0 && added.length === 0, missing, added };
}
const REWRITES = path.join(ROOT, "data", "rewrites");

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
    lab: { specHtml: cleanPost(m.sections?.spec, false), shukeiHtml: cleanPost(m.sections?.shukei, false), columns: cols },
    ev: null,
    _norm: [norm(m.name), stripPre(norm(m.name))],
  });
}
// ラボの norm 逆引き（★統合マッチは「機種自身の名前」のみ。辞書別名は使わない＝別機種の誤統合を防ぐ。
//   例: 研究所辞書はLヤバチバの別名に「花笠/チバリヨ」等の別機種名を含むため、別名マッチすると
//   ev「花笠」機種の内容がヤバチバに誤って上書きされる。→ 別名は検索用のみに限定。）
const labByNorm = new Map();
for (const [id, mc] of unified) { for (const k of mc._norm) if (k && !labByNorm.has(k)) labByNorm.set(k, id); }

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
    const mc = unified.get(hitId);
    if (mc.ev) { skipped++; continue; }   // 既に別のev機種が紐付いていれば上書きしない(誤混入防止)
    mc.sources.ev = true; mc.ev = evData;
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

// ★重複検知(非破壊): 正規化キー(stripPre(norm(name)))が衝突する＝同一機種が2件に割れている可能性。
//   月次更新でev/labの名称ゆらぎにより再発しうるため、ビルド毎に警告を出す。data/dedup-keep-separate.json
//   に「別機種として残す」正規化キーを列挙すれば警告を抑制できる(誤検知の除外用)。
let keepSeparate = [];
try { keepSeparate = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "dedup-keep-separate.json"), "utf-8")); } catch {}
const dupKey = (m) => stripPre(norm(m.name));
const byDupKey = new Map();
for (const m of machines) { const k = dupKey(m); if (!k) continue; if (!byDupKey.has(k)) byDupKey.set(k, []); byDupKey.get(k).push(m); }
const dupGroups = [...byDupKey.entries()].filter(([k, v]) => v.length > 1 && !keepSeparate.includes(k));
if (dupGroups.length) {
  console.warn(`⚠ 重複の可能性 ${dupGroups.length}件（同一正規化キーで複数機種）— 要確認:`);
  for (const [k, v] of dupGroups) console.warn(`   [${k}] ${v.map((m) => m.name + "(" + (m.sources.ev && m.sources.lab ? "両" : m.sources.ev ? "期" : "研") + ")").join(" ／ ")}`);
} else console.log("重複チェック: OK（同一正規化キーの重複なし）");

// ★狙い目リライト適用（data/rewrites/<id>.json の nerai）＋情報不変ゲート。検証NGは原文維持。
//   ※解析(spec)リライトは「リンク内部化の後」に適用する（rw.spec は内部化済み本文を基に生成しており、
//     ゲートの基準も内部化済みの spec に揃える必要があるため。下部の内部化パス後で処理）。
let rwOk = 0, rwNg = 0, rwSpecOk = 0, rwSpecNg = 0;
for (const m of machines) {
  const rwFile = path.join(REWRITES, m.id + ".json");
  if (!fs.existsSync(rwFile)) continue;
  const rw = JSON.parse(fs.readFileSync(rwFile, "utf-8"));
  if (rw.nerai && m.ev && m.ev.nerai) {
    const v = verifyRewrite(m.ev.nerai, rw.nerai);
    if (v.ok) { m.ev.neraiOriginal = m.ev.nerai; m.ev.nerai = rw.nerai; m.ev.rewritten = true; rwOk++; }
    else { console.warn(`⚠ 狙い目リライト検証NG(不適用): ${m.name} 欠落数字:${v.missing.join(",")} 捏造数字:${v.added.join(",")}`); rwNg++; }
  }
}
console.log(`狙い目リライト: OK ${rwOk} / NG ${rwNg}`);

// ★内部記事レジストリ: 期待値サイトで「機種」化しなかった記事(実践データ/狙い/考察等)を
//   内部ページ /a/<aid> として復元し、サイト外へ誘導していたリンクの受け皿にする。
const articles = [];
const machineKey = new Map(), articleKey = new Map();
for (const m of machines) {
  for (const k of [norm(m.name), stripPre(norm(m.name))]) if (k && !machineKey.has(k)) machineKey.set(k, m.id);
  if (m.ev?.slug) { const nk = norm(m.ev.slug.replace(/^archives_machine_/, "").replace(/__[0-9a-f]+$/, "")); if (nk && !machineKey.has(nk)) machineKey.set(nk, m.id); }
}
for (const e of ev) {
  const name = decode(e.title || "").replace(/🆕|🔥|⭐|★/g, "").trim();
  if (!name || !artRe.test(name)) continue;               // 記事のみ（機種はスキップ）
  if (/シミュレーター|シュミレーター|カウントツール|算出ツール/.test(name)) continue; // JSツールは元サイト依存で単独動作せず→内部ページ化しない
  const body = cleanEv((e.nerai_html || "") + (e.tenjo_html || ""));
  const kai = cleanEv(e.kaiseki_html || "");
  const full = [body, kai].filter(Boolean).join("\n");
  if (full.replace(/<[^>]+>/g, "").trim().length < 40) continue; // 実質空(サブスク紹介等)は作らない
  const aid = artId(e.url || e.slug || name);
  articles.push({ aid, title: name, date: (e.date || "").slice(0, 10), kdash: e.kdash_url || null, html: full });
  for (const k of [norm(name), linkPathKey(e.url || ""), norm((e.slug || "").replace(/^archives_machine_/, "").replace(/__[0-9a-f]+$/, ""))])
    if (k && !articleKey.has(k)) articleKey.set(k, aid);
}
// ★リンク内部化を全表示フィールドへ適用
const maps = { machine: machineKey, article: articleKey };
for (const m of machines) {
  if (m.ev) { m.ev.nerai = internalizeLinks(m.ev.nerai, maps); if (m.ev.neraiOriginal) m.ev.neraiOriginal = internalizeLinks(m.ev.neraiOriginal, maps); if (m.ev.spec) m.ev.spec = internalizeLinks(m.ev.spec, maps); }
  if (m.lab) { if (m.lab.specHtml) m.lab.specHtml = internalizeLinks(m.lab.specHtml, maps); if (m.lab.shukeiHtml) m.lab.shukeiHtml = internalizeLinks(m.lab.shukeiHtml, maps); }
  if (m.specCombined) m.specCombined = internalizeLinks(m.specCombined, maps);
}
for (const a of articles) a.html = internalizeLinks(a.html, maps);

// ★解析(spec)リライト適用（内部化後）＋情報不変ゲート。rw.spec は表・画像を無改変のまま説明文だけ
//   リライトした「統合済み解析HTML」。基準=内部化済みの両ソース数字の和集合(欠落0を必須/捏造は許容)。
for (const m of machines) {
  const rwFile = path.join(REWRITES, m.id + ".json");
  if (!fs.existsSync(rwFile)) continue;
  const rw = JSON.parse(fs.readFileSync(rwFile, "utf-8"));
  if (!rw.spec) continue;
  const evSpec = m.ev?.spec || "", labSpec = m.lab?.specHtml || "";
  if (!evSpec && !labSpec) continue;
  const specClean = internalizeLinks(rw.spec, maps); // リライト側にも内部化を適用(念のため)
  const v = verifyRewrite(evSpec + " \n " + labSpec, specClean);
  if (v.ok) { m.specCombined = specClean; if (m.ev) delete m.ev.spec; if (m.lab) delete m.lab.specHtml; rwSpecOk++; }
  else { console.warn(`⚠ 解析リライト検証NG(不適用): ${m.name} 欠落:${v.missing.slice(0, 8).join(",")} 捏造:${v.added.slice(0, 8).join(",")}`); rwSpecNg++; }
}
console.log(`解析リライト: OK ${rwSpecOk} / NG ${rwSpecNg}`);

// 記事出力
fs.rmSync(path.join(OUT, "articles"), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "articles"), { recursive: true });
fs.writeFileSync(path.join(OUT, "articles.json"), JSON.stringify(articles.map((a) => ({ aid: a.aid, title: a.title, date: a.date }))));
for (const a of articles) fs.writeFileSync(path.join(OUT, "articles", a.aid + ".json"), JSON.stringify(a));
console.log(`内部記事: ${articles.length}（外部誘導リンクの内部受け皿）`);

const index = machines.map((m) => ({
  id: m.id, name: m.name, maker: m.maker, thumb: m.thumb, isNew: m.isNew,
  sources: m.sources, k: [...new Set([norm(m.name), ...m.aliases.map(norm)])].filter(Boolean).join(" "),
}));
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index));

// ★店内高速表示: 重い解析/集計HTML(全体の77%)を機種JSONから分離し、public/data/spec/<id>.json へ。
//   狙い目タブ(実戦で必要な軽量コンテンツ)は機種JSONにインライン維持＝ページは即表示。
//   解析/集計タブを開いたときだけ MachineView が spec ファイルを取得する(遅延読み込み)。
const SPECOUT = path.join(ROOT, "public", "data", "spec");
fs.rmSync(SPECOUT, { recursive: true, force: true });
fs.mkdirSync(SPECOUT, { recursive: true });
// 解析リライトのパイプライン(spec-prep/apply)用に、内部化済みの生spec(ev/lab別)を退避(build専用/gitignore)。
//   機種JSONからは重い生specを剥がすため、リライト対象(未specCombined)の素材をここに保持する。
const SPECRAW = path.join(ROOT, "data", "spec-raw");
fs.rmSync(SPECRAW, { recursive: true, force: true });
fs.mkdirSync(SPECRAW, { recursive: true });
let splitBytes = 0, splitCount = 0;
for (const m of machines) {
  if (!m.specCombined && (m.ev?.spec || m.lab?.specHtml)) // 未リライト機種の素材をパイプライン用に保存
    fs.writeFileSync(path.join(SPECRAW, m.id + ".json"), JSON.stringify({ name: m.name, ev: m.ev?.spec || "", lab: m.lab?.specHtml || "" }));
  const specHtml = m.specCombined || m.lab?.specHtml || m.ev?.spec || ""; // 解析タブの表示優先順を確定
  const shukeiHtml = m.lab?.shukeiHtml || "";                              // 大量集計タブ
  if (specHtml || shukeiHtml) {
    const payload = JSON.stringify({ spec: specHtml, shukei: shukeiHtml });
    fs.writeFileSync(path.join(SPECOUT, m.id + ".json"), payload);
    splitBytes += payload.length; splitCount++;
  }
  m.hasSpec = !!specHtml; m.hasShukei = !!shukeiHtml;
  // 機種JSONから重いフィールドを除去(遅延取得へ)
  const { _norm, specCombined, ...rest } = m;
  if (rest.ev) { const { spec, ...evLight } = rest.ev; rest.ev = evLight; }
  if (rest.lab) { const { specHtml: _s, shukeiHtml: _k, ...labLight } = rest.lab; rest.lab = labLight; }
  fs.writeFileSync(path.join(OUT, "machines", m.id + ".json"), JSON.stringify(rest));
}
console.log(`解析/集計を分離(遅延読込): ${splitCount}機種 / ${(splitBytes / 1e6).toFixed(1)}MB → public/data/spec/`);

console.log(`統合機種: ${machines.length}（両方:${machines.filter(m => m.sources.ev && m.sources.lab).length} / 研究所のみ:${machines.filter(m => m.sources.lab && !m.sources.ev).length} / 期待値のみ:${machines.filter(m => m.sources.ev && !m.sources.lab).length}）`);
console.log(`期待値マッチ:${matched} / 新規追加:${added} / 記事ツール除外:${skipped}`);
console.log(`サムネ有: ${machines.filter(m => m.thumb).length} / 別名有: ${machines.filter(m => m.aliases.length).length}`);
