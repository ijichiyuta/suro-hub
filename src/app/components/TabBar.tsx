"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Search, Calculator, Star } from "lucide-react";

const ITEMS = [
  { href: "/", label: "機種", Icon: LayoutGrid, match: (p: string) => p === "/" || p.startsWith("/m") },
  { href: "/search", label: "検索", Icon: Search, match: (p: string) => p.startsWith("/search") },
  { href: "/tools", label: "ツール", Icon: Calculator, match: (p: string) => p.startsWith("/tools") },
  { href: "/saved", label: "保存", Icon: Star, match: (p: string) => p.startsWith("/saved") },
];

export default function TabBar() {
  const path = usePathname() || "/";
  return (
    <nav className="tabbar">
      {ITEMS.map(({ href, label, Icon, match }) => (
        <Link key={href} href={href} className={match(path) ? "on" : ""}>
          <Icon size={21} strokeWidth={match(path) ? 2.3 : 1.9} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
