import type { NextConfig } from "next";
import { BASE_PATH } from "./siteConfig.mjs";

// GitHub Pages(プロジェクトサイト)へ静的出力するための設定。基底パスは siteConfig.mjs に集約。
// output:'export' で out/ に完全静的化。画像はR2/外部のため最適化オフ。
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? BASE_PATH : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
