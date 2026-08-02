// spec-apply.mjs — 解析リライトの再組立＋情報不変検証。
//   入力: data/spec-work/<id>/{dom.html(data-ri付), meta.json} と rewritten.json([{i,html}] エージェント出力)
//   処理: 各本文ブロックをリライト版へ差し替え（※ブロック単位で数字保持を検証し、崩れたブロックは原文維持）。
//         表・画像・構造は無改変。最後に「両ソース数字の和集合(missing=0)」で全体検証。
//   出力: data/rewrites/<id>.json の spec フィールドへ統合（既存 nerai は保持）。
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load as loadHtml } from "/Users/ijichiyuuta/.superset/projects/slolabo/scraper/node_modules/cheerio/dist/commonjs/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WORK = path.join(ROOT, "data", "spec-work");
const REWRITES = path.join(ROOT, "data", "rewrites");
const MACHDIR = path.join(ROOT, "src", "data", "machines");

const numSet = (html) => new Set(((html || "").replace(/<[^>]+>/g, " ").replace(/&#?[a-z0-9]+;/gi, " ").match(/\d+/g)) || []);
const numMulti = (html) => ((html || "").replace(/<[^>]+>/g, " ").match(/\d+/g)) || [];

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
    // ブロック単位の数字保持検証（原文の数字が全て残っているか。捏造は全体側でチェック）
    const need = numSet(origById.get(b.i));
    const have = numSet(rw);
    const missing = [...need].filter((x) => !have.has(x));
    if (missing.length) { el.removeAttr("data-ri"); reverted++; continue; } // 崩れは原文維持
    el.html(rw); el.removeAttr("data-ri"); changed++;
  }
  let finalHtml = ($("body").html() || "").trim();

  // 全体検証: 統合前(内部化済)の両ソース数字の和集合を欠落なく含むか
  const m = JSON.parse(fs.readFileSync(path.join(MACHDIR, id + ".json"), "utf-8"));
  const baseUnion = numSet((m.ev?.spec || "") + " \n " + (m.lab?.specHtml || ""));
  const finalSet = numSet(finalHtml);
  const missingAll = [...baseUnion].filter((x) => !finalSet.has(x));
  const addedAll = [...finalSet].filter((x) => !baseUnion.has(x));
  const ok = missingAll.length === 0;

  if (ok) {
    fs.mkdirSync(REWRITES, { recursive: true });
    const outFile = path.join(REWRITES, id + ".json");
    const existing = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf-8")) : {};
    existing.spec = finalHtml;
    fs.writeFileSync(outFile, JSON.stringify(existing));
  }
  return { id, name: meta.name, ok, changed, reverted, kept, blocks: prose.length, missing: missingAll.length, added: addedAll.length, missingList: missingAll.slice(0, 10) };
}

const ids = process.argv.slice(2);
if (!ids.length) { console.error("usage: node spec-apply.mjs <id> [id...]"); process.exit(1); }
for (const id of ids) {
  const r = apply(id);
  console.log(`${r.ok ? "OK " : "NG "} ${r.name || id}  変更${r.changed || 0}/戻し${r.reverted || 0}/据置${r.kept || 0} (計${r.blocks || 0})  欠落${r.missing ?? "?"} 捏造${r.added ?? "?"}${r.missingList && r.missingList.length ? " 欠落例:" + r.missingList.join(",") : ""}${r.reason ? " " + r.reason : ""}`);
}
