"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// 機種ごとの自分メモ。端末localStorage基盤＋ログイン中はSupabase(notesテーブル)同期。
const LS = "surohub_notes";
let notes: Record<string, string> = {};
let loaded = false;
const listeners = new Set<() => void>();

function load() { if (loaded) return; try { const r = localStorage.getItem(LS); if (r) notes = JSON.parse(r); } catch {} loaded = true; }
function persist() { try { localStorage.setItem(LS, JSON.stringify(notes)); } catch {} }
function emit() { listeners.forEach((l) => l()); }

export function getNote(id: string) { load(); return notes[id] || ""; }
export function setNote(id: string, text: string) {
  load();
  const t = (text || "").trim();
  if (t) notes[id] = t; else delete notes[id];
  persist(); emit(); void remote(id, t);
}
async function uid(): Promise<string | null> { if (!supabase) return null; const { data } = await supabase.auth.getUser(); return data.user?.id ?? null; }
async function remote(id: string, text: string) {
  const u = await uid(); if (!u || !supabase) return;
  if (text) await supabase.from("notes").upsert({ user_id: u, machine_id: id, body: text }, { onConflict: "user_id,machine_id" });
  else await supabase.from("notes").delete().eq("user_id", u).eq("machine_id", id);
}
export async function syncNotes() {
  const u = await uid(); if (!u || !supabase) return;
  const { data, error } = await supabase.from("notes").select("machine_id, body").eq("user_id", u);
  if (error || !data) return;
  load();
  const remoteIds = new Set<string>();
  for (const r of data) { if (r.body) { notes[r.machine_id] = r.body; remoteIds.add(r.machine_id); } }
  persist(); emit();
  const localOnly = Object.entries(notes).filter(([id]) => !remoteIds.has(id));
  if (localOnly.length) await supabase.from("notes").upsert(localOnly.map(([id, body]) => ({ user_id: u, machine_id: id, body })), { onConflict: "user_id,machine_id" });
}

export function useNote(id: string): string {
  const [v, setV] = useState("");
  useEffect(() => {
    load(); setV(getNote(id));
    const l = () => setV(getNote(id));
    listeners.add(l); return () => { listeners.delete(l); };
  }, [id]);
  return v;
}
