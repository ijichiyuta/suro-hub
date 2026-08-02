// spec-prep.mjs — 解析リライトの前処理(本文ブロック抽出方式)。
//   期待値(ev.spec)＋研究所(lab.specHtml)を1つの解析DOMに統合し、
//   「書き換え可能な本文ブロック(p/li/figcaption/見出し)」だけに data-ri 連番を付与して抽出する。
//   表・画像・構造は一切触らない=数字/メーカー公表データは構造的に完全保持。
//   統合方針(両ソース機種): lab を土台に、ev から「重複表(数字列一致)」を除いた残り=ev独自情報を
//   追記(情報は網羅・欠落なし)。エージェントには prose.json(文字列配列)のみ渡す。
//   出力: data/spec-work/<id>/{dom.html(=data-ri付き統合DOM), prose.json(=[{i,html}]), meta.json}
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load as loadHtml } from "/Users/ijichiyuuta/.superset/projects/slolabo/scraper/node_modules/cheerio/dist/commonjs/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MACHDIR = path.join(ROOT, "src", "data", "machines");
const WORK = path.join(ROOT, "data", "spec-work");

const numSeq = (html) => ((html || "").replace(/<[^>]+>/g, " ").match(/\d+/g) || []).join(",");
const numUnion = (html) => [...new Set(((html || "").replace(/<[^>]+>/g, " ").replace(/&#?[a-z0-9]+;/gi, " ").match(/\d+/g)) || [])];
// 書き換え対象ブロック: 説明文(p/li/figcaption/dd)で内部に table/img を含まず、実質的な長さのもの。
//   ※見出し(h2-h5)や短い打ち方指示(「赤7狙い」等)はどのサイトも同表現＝コピー懸念が低いので対象外(原文維持)。
const PROSE_TAGS = "p, li, figcaption, dd";
const MIN_PROSE = 30; // これ未満は原文維持（断片化した打ち方一行等）

// evのbodyから「labに既出の表(数字列一致)」を取り除き、ev独自の残りを返す(統合用)。
function evUnique($ev, labTableSigs) {
  $ev("table").each((i, e) => { if (labTableSigs.has(numSeq($ev.html(e)))) $ev(e).remove(); });
  // 空になった見出し/セクションの過剰は残してもリライトで整うので深追いしない
  return ($ev("body").html() || "").trim();
}

function prep(id) {
  const m = JSON.parse(fs.readFileSync(path.join(MACHDIR, id + ".json"), "utf-8"));
  const ev = m.ev?.spec || "", lab = m.lab?.specHtml || "";
  if (!ev && !lab) return null;

  // 統合DOM構築
  let $;
  if (lab) {
    $ = loadHtml(lab);
    if (ev) {
      const labSigs = new Set(); $("table").each((i, e) => labSigs.add(numSeq($.html(e))));
      const $ev = loadHtml(ev);
      $ev("h1").remove(); // 重複タイトル除去
      const extra = evUnique($ev, labSigs);
      if (extra && extra.replace(/<[^>]+>/g, "").trim().length > 20) {
        $("body").append('\n<section data-merge="ev">\n' + extra + "\n</section>\n");
      }
    }
  } else {
    $ = loadHtml(ev);
  }

  // 書き換えブロックに data-ri 付与＋抽出
  const prose = [];
  $(PROSE_TAGS).each((i, e) => {
    const $e = $(e);
    if ($e.parents("table").length) return;          // 表セルは対象外(データ)
    if ($e.find("table, img").length) return;         // 表/画像を内包する要素は触らない
    const inner = ($e.html() || "").trim();
    const txt = $e.text().replace(/\s+/g, " ").trim();
    if (txt.replace(/\s/g, "").length < MIN_PROSE) return; // 短い断片(打ち方一行/ラベル)は原文維持
    if (!/[ぁ-んァ-ヶ一-鿿]/.test(txt)) return;         // 日本語を含まない(記号のみ等)は対象外
    const idx = prose.length;
    $e.attr("data-ri", String(idx));
    prose.push({ i: idx, tag: e.tagName, html: inner });
  });

  const dir = path.join(WORK, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "dom.html"), $("body").html() || "");
  fs.writeFileSync(path.join(dir, "prose.json"), JSON.stringify(prose));
  const proseChars = prose.reduce((s, b) => s + b.html.replace(/<[^>]+>/g, "").length, 0);
  const meta = { id, name: m.name, hasLab: !!lab, hasEv: !!ev, blocks: prose.length, proseChars, origNumUnion: numUnion(ev + " \n " + lab) };
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta));
  return meta;
}

let ids = process.argv.slice(2);
if (!ids.length) { console.error("usage: node spec-prep.mjs <id|ALL> [id...]"); process.exit(1); }
if (ids[0] === "ALL") {
  ids = fs.readdirSync(MACHDIR).map((f) => f.replace(/\.json$/, "")).filter((id) => {
    const m = JSON.parse(fs.readFileSync(path.join(MACHDIR, id + ".json"), "utf-8"));
    return (m.ev?.spec || m.lab?.specHtml);
  });
}
let ok = 0;
for (const id of ids) {
  const meta = prep(id);
  if (meta) { ok++; console.log(`${id}  blocks:${String(meta.blocks).padStart(4)}  prose:${String((meta.proseChars/1024).toFixed(1)).padStart(6)}KB  nums:${String(meta.origNumUnion.length).padStart(4)}  ${meta.name}`); }
}
console.log(`\nprepared: ${ok}`);
