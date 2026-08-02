// build-calc.mjs — 研究所nerai投稿から期待値計算ツールを機種ごとの自己完結HTMLに書き出す。
//   出力: public/calc/<id>.html（DOM＋データscript＋jQuery＋calculation.js＋CSS）。iframeで開く。
//   ※原典の calculation.js をそのまま使う＝数字は完全一致（情報不変）。
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { load } from "/Users/ijichiyuuta/.superset/projects/slolabo/scraper/node_modules/cheerio/dist/commonjs/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LAB = "/Users/ijichiyuuta/.superset/projects/slolabo/data";
const OUTDIR = path.join(ROOT, "public", "calc");
fs.mkdirSync(OUTDIR, { recursive: true });

const lab = JSON.parse(fs.readFileSync(path.join(LAB, "machines.json"), "utf-8"));
const posts = JSON.parse(fs.readFileSync(path.join(LAB, "json", "posts.json"), "utf-8"));
const byId = {}; posts.forEach((p) => (byId[p.id] = p));
const idOf = (name) => "m" + crypto.createHash("md5").update(name).digest("hex").slice(0, 10);

const CSS = `
*{box-sizing:border-box}body{margin:0;padding:12px;font-family:"Noto Sans JP",system-ui,sans-serif;color:#15181e;font-size:14px;background:#fff;-webkit-text-size-adjust:100%}
table{width:100%;border-collapse:collapse;margin:10px 0;border:1px solid #e4e6ea;border-radius:6px;overflow:hidden;font-size:13px}
caption{text-align:left;font-weight:800;font-size:14px;margin:14px 0 6px;caption-side:top}
th,td{padding:8px 8px;border-bottom:1px solid #eceef1;border-right:1px solid #eceef1;text-align:center}
th{background:#f4f5f7;color:#626b76;font-weight:700;font-size:11px}
th:last-child,td:last-child{border-right:none}tr:last-child td{border-bottom:none}
#condition td:first-child,#condition th{text-align:left}
select,input{font-family:inherit;font-size:14px;padding:7px 8px;border:1px solid #e4e6ea;border-radius:6px;background:#fff;width:100%;color:#15181e}
input#medal{max-width:120px}
.condition table{margin:0}
.condition tr.not-use{display:none}
.plus{color:#1f5eff;font-weight:700}.minus{color:#e0345a;font-weight:700}
.rate-button{display:flex;gap:6px;padding:6px 0}
.rate-button button{flex:1;padding:8px;border:1px solid #e4e6ea;border-radius:6px;background:#fff;font-weight:700;font-size:13px;cursor:pointer}
.bar1,.bar2{display:inline-block;height:9px;background:#1f5eff;border-radius:2px;vertical-align:middle}
.bar2{background:#12894a}.over-limit{background:#e0345a}
h2,h3,h4{font-weight:800;letter-spacing:-.01em;margin:14px 0 6px}h4{font-size:14px;color:#626b76}
.hosoku{font-size:12px;color:#626b76;margin:6px 0}
[name=section]{width:auto;margin-right:4px}
label{font-size:13px;margin-right:12px;display:inline-flex;align-items:center;gap:4px}
#container{display:block}
img{max-width:100%;height:auto}
`;

const template = (dom, data) => `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<style>${CSS}</style></head><body>
<div id="kitaichiWrap">${dom}</div>
<script>function setTab(){}function scrollToElement(){}function setControl(){}</script>
<script>${data}</script>
<script src="./jquery.min.js"></script>
<script src="./calculation.js"></script>
</body></html>`;

const ids = new Set();
let done = 0, noTool = 0, noData = 0;
for (const m of lab) {
  const nid = m.sections?.nerai;
  if (!nid || !byId[nid]) continue;
  const html = byId[nid].content.rendered || "";
  if (!/labelList2/.test(html)) { noData++; continue; }
  const $ = load(html);
  const tool = $("#kitaichiCalculationTool2");
  if (!tool.length) { noTool++; continue; }
  const dataScript = $("script:not([src])").filter((i, e) => /labelList2/.test($(e).html() || "")).first().html() || "";
  if (!dataScript) { noData++; continue; }
  let dom = $.html(tool);
  const hw = $("#hosokuWrap"); if (hw.length) dom += $.html(hw);
  // 画像は絶対URL化（ホットリンク）
  dom = dom.replace(/(<img[^>]+src=")\/(?!\/)/gi, "$1https://slolaboratory.com/");
  const id = idOf(m.name);
  fs.writeFileSync(path.join(OUTDIR, id + ".html"), template(dom, dataScript));
  ids.add(id); done++;
}
fs.writeFileSync(path.join(ROOT, "src", "data", "calc-ids.json"), JSON.stringify([...ids]));
// 各機種JSONに hasCalc を付与
const MDIR = path.join(ROOT, "src", "data", "machines");
for (const id of ids) { const f = path.join(MDIR, id + ".json"); if (fs.existsSync(f)) { const j = JSON.parse(fs.readFileSync(f, "utf-8")); j.hasCalc = true; fs.writeFileSync(f, JSON.stringify(j)); } }

console.log(`計算ツールHTML生成: ${done}機種 / labelListなし:${noData} / toolなし:${noTool}`);
let total = 0; for (const f of fs.readdirSync(OUTDIR)) if (f.endsWith(".html")) total += fs.statSync(path.join(OUTDIR, f)).size;
console.log(`public/calc/ 合計: ${(total / 1048576).toFixed(1)}MB（${fs.readdirSync(OUTDIR).filter(f => f.endsWith(".html")).length}ファイル）`);
