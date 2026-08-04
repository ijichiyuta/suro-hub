// ★サイトの基底パス（URL変更時はここ1箇所を変えて再ビルドするだけ）。
//   - GitHub Pages プロジェクトサイト(ijichiyuta.github.io/suro-hub) = "/suro-hub"
//   - リポ名を変える場合 = "/新リポ名"
//   - 独自ドメインをルート配信する場合 = "" （空文字）
// 変更後: `node scripts/build-data.mjs`（内部リンク再生成）→ build-calc → `npm run build` → push。
// ※ manifest と Service Worker は相対パス/scope由来で自動追従するため編集不要。
export const BASE_PATH = "/suro-hub";
