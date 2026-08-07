// フロント(GitHub Pages)から *.supabase.co のEdge Functionを叩くためのCORSヘッダ。
// 認証はBearer JWT(Cookie不使用)なので Origin は "*" で問題ない。
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
