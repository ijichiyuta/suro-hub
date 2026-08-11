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

export const metadata: Metadata = {
  title: "スマスマ期待値ラボ",
  description: "個人用パチスロ期待値アーカイブ（統合版）",
  robots: { index: false, follow: false },
  manifest: `${BASE}/manifest.webmanifest`,
  appleWebApp: { capable: true, statusBarStyle: "default", title: "期待値ラボ" },
  icons: { icon: `${BASE}/icon.svg`, apple: `${BASE}/icon.svg` },
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
