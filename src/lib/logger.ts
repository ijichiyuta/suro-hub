"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// 稼働ロガー: 端末localStorage基盤＋ログイン中はSupabase(logsテーブル)同期。収支=回収-投資。
export type LogEntry = {
  id: string; date: string; machine: string;
  invest: number; payout: number; games?: number; note?: string; createdAt: number;
};
const LS = "surohub_logs";
let logs: LogEntry[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function load() { if (loaded) return; try { const r = localStorage.getItem(LS); if (r) logs = JSON.parse(r); } catch {} loaded = true; }
function persist() { try { localStorage.setItem(LS, JSON.stringify(logs)); } catch {} }
function emit() { logs = [...logs]; listeners.forEach((l) => l()); }
function sub(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
function sortLogs(a: LogEntry, b: LogEntry) { return b.date.localeCompare(a.date) || b.createdAt - a.createdAt; }

export function getLogs(): LogEntry[] { load(); return logs; }

export function addLog(e: Omit<LogEntry, "id" | "createdAt">) {
  load();
  const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1e9)}`);
  const entry: LogEntry = { ...e, id, createdAt: Date.now() };
  logs = [entry, ...logs].sort(sortLogs); persist(); emit(); void remoteAdd(entry);
}
export function removeLog(id: string) { load(); logs = logs.filter((l) => l.id !== id); persist(); emit(); void remoteDel(id); }

async function uid(): Promise<string | null> { if (!supabase) return null; const { data } = await supabase.auth.getUser(); return data.user?.id ?? null; }
function row(e: LogEntry, u: string) { return { id: e.id, user_id: u, date: e.date, machine: e.machine, invest: e.invest, payout: e.payout, games: e.games ?? null, note: e.note ?? null }; }
async function remoteAdd(e: LogEntry) { const u = await uid(); if (!u || !supabase) return; await supabase.from("logs").upsert(row(e, u)); }
async function remoteDel(id: string) { const u = await uid(); if (!u || !supabase) return; await supabase.from("logs").delete().eq("id", id).eq("user_id", u); }

export async function syncLogs() {
  const u = await uid(); if (!u || !supabase) return;
  const { data, error } = await supabase.from("logs").select("*").eq("user_id", u);
  if (error || !data) return;
  load();
  const remoteIds = new Set(data.map((r) => r.id as string));
  const remoteEntries: LogEntry[] = data.map((r) => ({ id: r.id, date: r.date, machine: r.machine, invest: r.invest, payout: r.payout, games: r.games ?? undefined, note: r.note ?? undefined, createdAt: r.created_at ? Date.parse(r.created_at) : Date.now() }));
  const localOnly = logs.filter((l) => !remoteIds.has(l.id));
  logs = [...remoteEntries, ...localOnly].sort(sortLogs); persist(); emit();
  if (localOnly.length) await supabase.from("logs").upsert(localOnly.map((e) => row(e, u)));
}

export function useLogs(): LogEntry[] {
  const [v, setV] = useState<LogEntry[]>([]);
  useEffect(() => { setV(getLogs()); return sub(() => setV(getLogs())); }, []);
  return v;
}
