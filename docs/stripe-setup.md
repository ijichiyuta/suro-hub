# Stripe決済セットアップ手順

サブスク（月額¥780 / 年額¥5,980）をStripeで受け付けるための設定。コードは実装済み（`supabase/functions/*`・`src/lib/checkout.ts`・`/upgrade`）。あとはアカウント作成と鍵の設定だけ。

## 全体像
静的サイト → `/upgrade` のボタン → Supabase Edge Function `create-checkout` → Stripe Checkout で決済 → Stripe Webhook → `stripe-webhook` が `profiles.plan` を `premium` に更新。解約等は `customer-portal`（Stripeカスタマーポータル）。

---

## 1. profiles テーブルに列を追加（SQL Editor）
```sql
alter table public.profiles
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status    text,
  add column if not exists current_period_end     timestamptz;
create index if not exists profiles_stripe_customer_idx on public.profiles (stripe_customer_id);
```

## 2. Stripeアカウント & 価格
1. https://stripe.com で登録（日本・本人/事業者確認）。まずは**テストモード**で通し、後で本番へ。
2. 商品を作成し、**継続（recurring）価格**を2つ登録:
   - 月額: ¥780 / 月（JPY）
   - 年額: ¥5,980 / 年（JPY）
3. それぞれの **価格ID**（`price_xxx`）を控える。
4. **APIキー**（`sk_test_...` / 本番は `sk_live_...`）を控える。

## 3. Supabase CLI で Edge Functions をデプロイ
```bash
# 初回のみ
brew install supabase/tap/supabase        # or npm i -g supabase
supabase login
supabase link --project-ref rhlzapshrggtozqzkran

# シークレット設定（値は自分のものに）
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_PRICE_MONTHLY=price_xxx_month \
  STRIPE_PRICE_YEARLY=price_xxx_year \
  SITE_URL=https://ijichiyuta.github.io/suro-hub/
#   ↑ カスタムドメインにしたら SITE_URL をそのドメイン(末尾スラッシュ付き)に変更

# デプロイ（3関数）
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy stripe-webhook
```
※ `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` はEdge Functionに自動で入るので設定不要。

## 4. Stripe Webhook を登録
1. Stripeダッシュボード → 開発者 → Webhook → エンドポイント追加
2. URL: `https://rhlzapshrggtozqzkran.supabase.co/functions/v1/stripe-webhook`
3. 送信イベント:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. 署名シークレット（`whsec_...`）を控えて設定:
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase functions deploy stripe-webhook   # シークレット反映のため再デプロイ
```

## 5. カスタマーポータルを有効化
Stripe → 設定 → Billing → カスタマーポータル → 有効化（解約・プラン変更を許可）。

## 6. フロントの課金を有効化
`src/lib/billingConfig.ts` の `BILLING_ENABLED` を `true` にして、`npm run build` → commit → push。
→ `/upgrade` に「月額で登録 / 年額で登録」ボタンが出て、決済が回る。

## 7. テスト
- テストモードのカード `4242 4242 4242 4242`（任意の将来日付・任意CVC）で購入 → `/upgrade?checkout=success` に戻る → 数秒後にプレミアム反映を確認。
- 本番は Stripe を本番モードにし、`sk_live_...` / 本番Webhookの `whsec_...` / 本番の価格ID に差し替えて再デプロイ。

## メモ
- 招待制なので、購入できるのは「ログイン済み＝招待された人」だけ（`create-checkout` が `getUser` で本人確認）。
- 返金/中途解約時の日割りは規約の方針（当方都合終了時は年額の未経過分を日割り返金）に合わせ、必要なら手動 or ポータルで対応。
- `profiles.plan` は Webhook が唯一の“真実”として更新（フロントのキャッシュは次回読み込みで追従）。
