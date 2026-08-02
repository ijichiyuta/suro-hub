import type { Metadata } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";
import TabBar from "./components/TabBar";
import Sidebar from "./components/Sidebar";

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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${noto.variable} ${inter.variable}`}>
      <body>
        <Sidebar />
        <div className="app">
          {children}
          <TabBar />
        </div>
      </body>
    </html>
  );
}
