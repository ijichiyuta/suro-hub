// nerai-prep.mjs — 狙い目リライトの前処理(本文ブロック抽出方式・単一ソース)。
//   build-data が出力する data/nerai-raw/<id>.json = {name, source, nerai}(内部化前の生狙い目/ev・lab解決済)を読み、
//   説明文ブロック(p/li/figcaption/dd)だけに data-ri を付与して抽出。表(期待値表)・画像・構造は無改変=数字完全保持。
//   出力: data/nerai-work/<id>/{dom.html(data-ri付), prose.json([{i,tag,html}]), meta.json}
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load as loadHtml } from "/Users/ijichiyuuta/.superset/projects/slolabo/scraper/node_modules/cheerio/dist/commonjs/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const NERAIRAW = path.join(ROOT, "data", "nerai-raw");
const WORK = path.join(ROOT, "data", "nerai-work");

const numUnion = (html) => [...new Set(((html || "").replace(/<[^>]+>/g, " ").replace(/&#?[a-z0-9]+;/gi, " ").match(/\d+/g)) || [])];
const PROSE_TAGS = "p, li, figcaption, dd";
const MIN_PROSE = 24; // 狙い目は打ち方より説明文中心。短い断片は原文維持。

function prep(id) {
  const rawFile = path.join(NERAIRAW, id + ".json");
  if (!fs.existsSync(rawFile)) return null;
  const raw = JSON.parse(fs.readFileSync(rawFile, "utf-8"));
  const nerai = raw.nerai || "";
  if (!nerai) return null;
  const $ = loadHtml(nerai);
  const prose = [];
  $(PROSE_TAGS).each((i, e) => {
    const $e = $(e);
    if ($e.parents("table").length) return;      // 期待値表セルは対象外(データ)
    if ($e.find("table, img").length) return;     // 表/画像を内包する要素は触らない
    const inner = ($e.html() || "").trim();
    const txt = $e.text().replace(/\s+/g, " ").trim();
    if (txt.replace(/\s/g, "").length < MIN_PROSE) return;
    if (!/[ぁ-んァ-ヶ一-鿿]/.test(txt)) return;
    const idx = prose.length;
    $e.attr("data-ri", String(idx));
    prose.push({ i: idx, tag: e.tagName, html: inner });
  });
  const dir = path.join(WORK, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "dom.html"), $("body").html() || "");
  fs.writeFileSync(path.join(dir, "prose.json"), JSON.stringify(prose));
  const proseChars = prose.reduce((s, b) => s + b.html.replace(/<[^>]+>/g, "").length, 0);
  const meta = { id, name: raw.name, source: raw.source, blocks: prose.length, proseChars, origNumUnion: numUnion(nerai) };
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta));
  return meta;
}

let ids = process.argv.slice(2);
if (!ids.length) { console.error("usage: node nerai-prep.mjs <id|ALL> [id...]"); process.exit(1); }
if (ids[0] === "ALL") ids = fs.readdirSync(NERAIRAW).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
let ok = 0;
for (const id of ids) {
  const meta = prep(id);
  if (meta) { ok++; console.log(`${id}  blocks:${String(meta.blocks).padStart(4)}  prose:${String((meta.proseChars / 1024).toFixed(1)).padStart(6)}KB  nums:${String(meta.origNumUnion.length).padStart(4)}  ${meta.name}`); }
}
console.log(`\nprepared: ${ok}`);
