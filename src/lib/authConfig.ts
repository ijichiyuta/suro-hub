// Supabase の公開設定。anon(公開)キーはクライアント公開前提で、行レベルセキュリティ(RLS)＝
// 「公開登録を無効化＋招待制」で守る。ここに値を入れると自動でログイン方式へ切替。
// 空のままなら簡易PINゲート(0807)を使用する(=まだ壊れない)。
//
// 設定手順(あなた):
//   1) https://supabase.com で無料プロジェクト作成
//   2) Project Settings → API から「Project URL」と「anon public」キーをコピーして下記に貼る
//   3) Authentication → Sign In / Providers → Email を有効、"Allow new users to sign up" を OFF(招待制)
//   4) Authentication → Users → "Invite" で知人のメールを招待(本人がパスワード設定)
export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";
export const AUTH_CONFIGURED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
