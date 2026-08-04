"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// お気に入り: 端末localStorageを基盤に、ログイン中はSupabase(favoritesテーブル)と双方向同期。
//   未ログイン/未設定は端末のみ(オフラインでも動く)。ログイン時にローカルとリモートをunion統合。
const LS_KEY = "surohub_favs";
let favs = new Set<string>();
let loaded = false;
const listeners = new Set<() => void>();

function loadLocal() {
  if (loaded) return;
  try { const raw = localStorage.getItem(LS_KEY); if (raw) favs = new Set(JSON.parse(raw)); } catch {}
  loaded = true;
}
function persist() { try { localStorage.setItem(LS_KEY, JSON.stringify([...favs])); } catch {} }
function emit() { favs = new Set(favs); listeners.forEach((l) => l()); }

export function getFavs(): Set<string> { loadLocal(); return favs; }
export function isFav(id: string): boolean { loadLocal(); return favs.has(id); }

export function toggleFav(id: string) {
  loadLocal();
  if (favs.has(id)) { favs.delete(id); void remote("del", id); }
  else { favs.add(id); void remote("add", id); }
  persist(); emit();
}

function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

async function uid(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
async function remote(op: "add" | "del", id: string) {
  const u = await uid(); if (!u || !supabase) return;
  if (op === "add") await supabase.from("favorites").upsert({ user_id: u, machine_id: id }, { onConflict: "user_id,machine_id" });
  else await supabase.from("favorites").delete().eq("user_id", u).eq("machine_id", id);
}

// ログイン時に呼ぶ: リモートとローカルをunion統合し、ローカルのみの分はリモートへ反映。
export async function syncFavorites() {
  const u = await uid(); if (!u || !supabase) return;
  const { data, error } = await supabase.from("favorites").select("machine_id").eq("user_id", u);
  if (error || !data) return;
  loadLocal();
  const remoteIds = new Set<string>(data.map((r) => r.machine_id as string));
  const localOnly = [...favs].filter((id) => !remoteIds.has(id));
  favs = new Set([...favs, ...remoteIds]);
  persist(); emit();
  if (localOnly.length) await supabase.from("favorites").upsert(localOnly.map((id) => ({ user_id: u, machine_id: id })), { onConflict: "user_id,machine_id" });
}

// 単一機種のお気に入り状態＋トグル
export function useFav(id: string) {
  const [fav, setFav] = useState(false);
  useEffect(() => {
    setFav(isFav(id));
    return subscribe(() => setFav(isFav(id)));
  }, [id]);
  return { fav, toggle: () => toggleFav(id) };
}

// お気に入りid一覧(保存タブ/フィルタ用)
export function useFavIds(): string[] {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds([...getFavs()]);
    return subscribe(() => setIds([...getFavs()]));
  }, []);
  return ids;
}
