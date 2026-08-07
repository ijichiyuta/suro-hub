// 課金(Stripe)有効スイッチ。false の間は /upgrade を「準備中」表示のまま(現行維持)。
//   Stripeアカウント作成→価格登録→Edge Functionsデプロイ→シークレット設定 が済んだら true にして再デプロイ。
//   手順は docs/stripe-setup.md を参照。
export const BILLING_ENABLED = false;
