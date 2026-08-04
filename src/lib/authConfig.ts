// Supabase の公開設定。anon(公開)キーはクライアント公開前提で、行レベルセキュリティ(RLS)＝
// 「公開登録を無効化＋招待制」で守る。値が入っていると supabase クライアントが有効化。
export const SUPABASE_URL = "https://rhlzapshrggtozqzkran.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobHphcHNocmdndG96cXprcmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MTgxNzMsImV4cCI6MjEwMTM5NDE3M30.prB09uhQpd0pvkhjCGFp3KT4jiiG5-IilPn2KiIYtSo";
export const AUTH_CONFIGURED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// ★ログイン必須スイッチ。false の間は現行PIN(0807)ゲートのまま＝ロックアウト防止。
//   準備（①下記SQLでテーブル作成 ②Authentication>Users>Add userで自分のアカウント作成
//   ③Allow new users to sign up をOFF）が済んだら true にして再デプロイ→ログイン必須に切替。
//   ※ AUTH_CONFIGURED が true ならログイン中はお気に入り/ロガー/メモがアカウント同期される。
export const LOGIN_REQUIRED = true;
