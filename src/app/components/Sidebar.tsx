"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Search, Calculator, Star } from "lucide-react";

const ITEMS = [
  { href: "/", label: "機種をさがす", Icon: LayoutGrid, match: (p: string) => p === "/" || p.startsWith("/m") },
  { href: "/search", label: "検索", Icon: Search, match: (p: string) => p.startsWith("/search") },
  { href: "/tools", label: "ツール", Icon: Calculator, match: (p: string) => p.startsWith("/tools") },
  { href: "/saved", label: "保存した機種", Icon: Star, match: (p: string) => p.startsWith("/saved") },
];

export default function Sidebar() {
  const path = usePathname() || "/";
  return (
    <aside className="sidebar">
      <Link href="/" className="side-brand">
        <span className="side-logo">◆</span>
        スマスマ期待値ラボ
      </Link>
      <nav className="side-nav">
        {ITEMS.map(({ href, label, Icon, match }) => (
          <Link key={href} href={href} className={match(path) ? "on" : ""}>
            <Icon size={19} strokeWidth={match(path) ? 2.4 : 2} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
