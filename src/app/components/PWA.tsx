"use client";
import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Service Worker 登録(オフライン対応)。静的サイトなので basePath 付きで登録。
export default function PWA() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).catch(() => {});
  }, []);
  return null;
}
