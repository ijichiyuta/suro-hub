import type { NextConfig } from "next";

// GitHub Pages(プロジェクトサイト /suro-hub/)へ静的出力するための設定。
// output:'export' で out/ に完全静的化。画像はR2/外部のため最適化オフ。
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/suro-hub" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
