"use client";
import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Service Worker 登録(オフライン対応)。静的サイトなので basePath 付きで登録。
export default function PWA() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    // 既にSWが制御中(=再訪)の場合のみ、新SWが有効化されたら1回だけ自動リロード＝常に最新を表示。
    //   初回訪問(controller無し)ではリロードしない(不要な再読込を防ぐ)。
    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    const onChange = () => { if (refreshing || !hadController) return; refreshing = true; window.location.reload(); };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).catch(() => {});
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onChange);
  }, []);
  return null;
}
