"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "機種", ico: "🎰", match: (p: string) => p === "/" || p.startsWith("/m") },
  { href: "/search", label: "検索", ico: "🔍", match: (p: string) => p.startsWith("/search") },
  { href: "/tools", label: "ツール", ico: "🧮", match: (p: string) => p.startsWith("/tools") },
  { href: "/saved", label: "保存", ico: "★", match: (p: string) => p.startsWith("/saved") },
];

export default function TabBar() {
  const path = usePathname() || "/";
  return (
    <nav className="tabbar">
      {ITEMS.map((it) => (
        <Link key={it.href} href={it.href} className={it.match(path) ? "on" : ""}>
          <span className="ico">{it.ico}</span>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
