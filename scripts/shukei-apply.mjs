// shukei-apply.mjs — 狙い目リライトの再組立＋情報不変検証(単一ソース)。
//   入力: data/nerai-work/<id>/{dom.html(data-ri付), prose.json, meta.json} と rewritten.json([{i,html}])
//   処理: 各本文ブロックをリライト版へ差し替え(ブロック単位で数字保持を検証・崩れは原文維持)。表・画像は無改変。
//         最後に nerai-raw の数字(missing=0)で全体検証。→ data/rewrites/<id>.json の nerai へ統合(既存 spec は保持)。
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load as loadHtml } from "/Users/ijichiyuuta/.superset/projects/slolabo/scraper/node_modules/cheerio/dist/commonjs/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WORK = path.join(ROOT, "data", "shukei-work");
const REWRITES = path.join(ROOT, "data", "rewrites");
const NERAIRAW = path.join(ROOT, "data", "shukei-raw");

const numSet = (html) => new Set(((html || "").replace(/<[^>]+>/g, " ").replace(/&#?[a-z0-9]+;/gi, " ").match(/\d+/g)) || []);

function apply(id) {
  const dir = path.join(WORK, id);
  const dom = fs.readFileSync(path.join(dir, "dom.html"), "utf-8");
  const prose = JSON.parse(fs.readFileSync(path.join(dir, "prose.json"), "utf-8"));
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf-8"));
  const rwFile = path.join(dir, "rewritten.json");
  if (!fs.existsSync(rwFile)) return { id, name: meta.name, ok: false, reason: "no rewritten.json" };
  const rewritten = JSON.parse(fs.readFileSync(rwFile, "utf-8"));
  const rwById = new Map(rewritten.map((b) => [b.i, b.html]));
  const origById = new Map(prose.map((b) => [b.i, b.html]));

  const $ = loadHtml(dom);
  let kept = 0, reverted = 0, changed = 0;
  for (const b of prose) {
    const el = $(`[data-ri="${b.i}"]`);
    if (!el.length) continue;
    const rw = rwById.get(b.i);
    if (rw == null || !rw.trim()) { el.removeAttr("data-ri"); kept++; continue; }
    const need = numSet(origById.get(b.i));
    const have = numSet(rw);
    const missing = [...need].filter((x) => !have.has(x));
    if (missing.length) { el.removeAttr("data-ri"); reverted++; continue; }
    el.html(rw); el.removeAttr("data-ri"); changed++;
  }
  const finalHtml = ($("body").html() || "").trim();

  const raw = JSON.parse(fs.readFileSync(path.join(NERAIRAW, id + ".json"), "utf-8"));
  const baseUnion = numSet(raw.shukei || "");
  const finalSet = numSet(finalHtml);
  const missingAll = [...baseUnion].filter((x) => !finalSet.has(x));
  const addedAll = [...finalSet].filter((x) => !baseUnion.has(x));
  const ok = missingAll.length === 0;

  if (ok) {
    fs.mkdirSync(REWRITES, { recursive: true });
    const outFile = path.join(REWRITES, id + ".json");
    const existing = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf-8")) : {};
    existing.shukei = finalHtml;
    fs.writeFileSync(outFile, JSON.stringify(existing));
  }
  return { id, name: meta.name, ok, changed, reverted, kept, blocks: prose.length, missing: missingAll.length, added: addedAll.length, missingList: missingAll.slice(0, 10) };
}

const ids = process.argv.slice(2);
if (!ids.length) { console.error("usage: node shukei-apply.mjs <id> [id...]"); process.exit(1); }
let okN = 0, ngN = 0, errN = 0;
for (const id of ids) {
  let r;
  try { r = apply(id); }
  catch (e) { errN++; console.log(`ERR ${id}  ${String(e.message).slice(0, 80)}`); continue; }
  if (r.ok) okN++; else ngN++;
  console.log(`${r.ok ? "OK " : "NG "} ${r.name || id}  変更${r.changed || 0}/戻し${r.reverted || 0}/据置${r.kept || 0} (計${r.blocks || 0})  欠落${r.missing ?? "?"} 捏造${r.added ?? "?"}${r.reason ? " " + r.reason : ""}`);
}
console.log(`\n==== nerai-apply集計: OK ${okN} / NG ${ngN} / ERR ${errN} ====`);
