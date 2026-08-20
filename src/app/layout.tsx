import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";
import TabBar from "./components/TabBar";
import Sidebar from "./components/Sidebar";
import Gate from "./components/Gate";
import PWA from "./components/PWA";
import AuthSync from "./components/AuthSync";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

const noto = Noto_Sans_JP({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// ★共有(OGP/Twitter)メタ: 紹介リンク・招待リンクをLINE/X/Discordに貼ったときの見た目を整える。
//   noindex(検索非公開)は維持しつつ、リンクを渡された人にだけ魅力的に開く=半クローズドの集客方針に整合。
//   description/画像は「無料登録で人気機種をまるごとお試しできる」味見フックを含める。
const SITE_URL = "https://smasuro-lab.com";
const SHARE_TITLE = "スマスマ期待値ラボ｜スマスロの狙い目・期待値をひと目で";
const SHARE_DESC = "スマスロ・スマパチ300機種以上の狙い目・天井・ゾーン・やめどき・設定判別を1機種1ページに整理。打つ前に勝てる台かひと目でわかる。無料登録で人気機種をまるごとお試しできます。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "スマスマ期待値ラボ",
  description: SHARE_DESC,
  robots: { index: false, follow: false },
  manifest: `${BASE}/manifest.webmanifest`,
  appleWebApp: { capable: true, statusBarStyle: "default", title: "期待値ラボ" },
  icons: { icon: `${BASE}/icon.svg`, apple: `${BASE}/icon.svg` },
  openGraph: {
    type: "website",
    siteName: "スマスマ期待値ラボ",
    title: SHARE_TITLE,
    description: SHARE_DESC,
    url: SITE_URL,
    locale: "ja_JP",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "スマスマ期待値ラボ — 打つ前に、勝てる台かひと目でわかる。" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESC,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1f5eff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${noto.variable} ${inter.variable}`}>
      <body>
        <PWA />
        <AuthSync />
        <Gate>
          <Sidebar />
          <div className="app">
            {children}
            <TabBar />
          </div>
        </Gate>
      </body>
    </html>
  );
}
