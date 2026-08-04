"use client";
import { useEffect, useState } from "react";

// 最近見た機種(端末localStorageのみ・軽量)。機種ページ表示時に記録、ホームに表示。
const LS = "surohub_recent";
const MAX = 24;
let recent: string[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function load() { if (loaded) return; try { const r = localStorage.getItem(LS); if (r) recent = JSON.parse(r); } catch {} loaded = true; }
function persist() { try { localStorage.setItem(LS, JSON.stringify(recent)); } catch {} }

export function pushRecent(id: string) {
  load();
  recent = [id, ...recent.filter((x) => x !== id)].slice(0, MAX);
  persist(); listeners.forEach((l) => l());
}
export function useRecent(): string[] {
  const [v, setV] = useState<string[]>([]);
  useEffect(() => {
    load(); setV([...recent]);
    const l = () => setV([...recent]);
    listeners.add(l); return () => { listeners.delete(l); };
  }, []);
  return v;
}
