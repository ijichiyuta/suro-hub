# Stripe決済セットアップ手順

> ## ✅ 本番化 完了（2026-08-17）
> - 本番アカウント: `acct_1U1knXB93RuUW3DI`（charges_enabled=true）※テストは別サンドボックス`acct_1U1knd…`
> - 本番価格: 月¥780 `price_1U5Jt1B93RuUW3DITaEmmSEb` / 年¥5,980 `price_1U5Jt1B93RuUW3DI4sbhOX2E`（重複は無効化済）
> - 本番Webhook: `we_1U5K19B93RuUW3DI5AVZLqFr` / カスタマーポータル: `bpc_1U5K2Z…`
> - Supabaseシークレット（sk_live_ / 価格 / whsec_ / SITE_URL）差し替え＆3関数再デプロイ済
> - 実カードで通しテスト成功（購入→premium→解約→free→全額返金）。**現在、実課金で稼働中。**
> - シークレット値はこのファイルには書かない（Supabase secretsのみ保持）。


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
専用アカウント「スマスマ期待値ラボ」（スマートコネクトとは別・個別アカウント）。

**★テスト環境では 2026-08-07 に API で作成済み:**
- 商品: `prod_V1oZuPg2Zvkph9`（スマスマ期待値ラボ プレミアム）
- 月額 ¥780: `price_1U1kwMAx6pdLjCbqNLDpzZgZ`
- 年額 ¥5,980: `price_1U1kwMAx6pdLjCbqiiW4PpXb`

※これは**テストモードの**ID。本番アクティベート後は本番モードで同じ2価格を作り直し、その`price_...`（live）に差し替える。
`sk_test_...`（本番は`sk_live_...`）のシークレットキーも控える。

## 3. Supabase CLI で Edge Functions をデプロイ
```bash
# 初回のみ
brew install supabase/tap/supabase        # or npm i -g supabase
supabase login
supabase link --project-ref rhlzapshrggtozqzkran

# シークレット設定（値は自分のものに）
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_あなたのキー \
  STRIPE_PRICE_MONTHLY=price_1U1kwMAx6pdLjCbqNLDpzZgZ \
  STRIPE_PRICE_YEARLY=price_1U1kwMAx6pdLjCbqiiW4PpXb \
  SITE_URL=https://smasuro-lab.com/
#   ↑ price IDはテスト環境の作成済みの値。SITE_URLはカスタムドメイン(末尾スラッシュ付き)。
#     ドメイン切替前に試すなら SITE_URL=https://ijichiyuta.github.io/suro-hub/ でも可

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

## 8. 課金取りこぼしの手動リカバリ

決済は成功したのにプレミアムが反映されない（Webhookの一時失敗・取りこぼし）場合の復旧手順。上から順に試す。

### (a) まず Webhook を再送（推奨・冪等）
1. Stripe Dashboard → 開発者（Developers）→ Webhooks → 該当エンドポイントを開く。
2. 「イベント（Events）」タブ or ログから、当該顧客の該当イベント（`checkout.session.completed` / `customer.subscription.updated` 等）を選ぶ。
3. 右上の「再送（Resend）」を押す → `stripe-webhook` が再処理する。
   - 本ハンドラは冪等（同じ状態への更新は何度実行しても結果が同じ）なので、二重課金や副作用の心配なく再送してよい。

### (b) 再送でも直らないとき: Supabase で直接更新（SQL Editor）
`stripe_customer_id` を条件に profiles を手動でプレミアムへ引き上げる。
```sql
update public.profiles
set plan = 'premium', subscription_status = 'active'
where stripe_customer_id = 'cus_xxx';
```
※ `cus_xxx` は下記(c)で特定した実際の顧客IDに置き換える。反映はフロント次回読み込みで追従。

### (c) 顧客ID（`cus_...`）の特定方法
- Stripe Dashboard → 顧客（Customers）一覧でメールアドレス等から該当顧客を検索し、`cus_...` を控える。
- または該当の Checkout Session / Subscription の `metadata.user_id`（＝SupabaseのauthユーザーID）から、`profiles` を逆引きして本人を特定する。
  ```sql
  -- user_id が分かっている場合の確認
  select id, plan, stripe_customer_id, subscription_status from public.profiles where id = '<user_id>';
  ```

### (d) 再発防止: 失敗通知をONにする
- Stripe Dashboard → 設定 → 通知（Notifications）で、「支払い失敗（failed payments）」と「Webhook配信失敗（webhook delivery failures）」のメール通知をONにしておく。取りこぼしに早く気づける。

---

## メモ
- 公開登録制（20歳以上なら誰でも登録可）。購入できるのは「ログイン済みの本人」だけ（`create-checkout` が `getUser` で本人確認）。
- 返金/中途解約時の日割りは規約の方針（当方都合終了時は年額の未経過分を日割り返金）に合わせ、必要なら手動 or ポータルで対応。
- `profiles.plan` は Webhook が唯一の“真実”として更新（フロントのキャッシュは次回読み込みで追従）。
