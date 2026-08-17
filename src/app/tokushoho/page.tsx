import LegalShell from "@/app/components/LegalShell";
import { PRICE_MONTHLY, PRICE_YEARLY, yen } from "@/lib/pricing";

export const metadata = { title: "特定商取引法に基づく表記 | スマスマ期待値ラボ" };

export default function Tokushoho() {
  return (
    <LegalShell title="特定商取引法に基づく表記" updated="2026年8月5日">
      <p className="lead">特定商取引に関する法律に基づき、以下のとおり表示します。</p>
      <dl>
        <dt>販売事業者（屋号）</dt>
        <dd>スマートコネクト</dd>

        <dt>運営サイト</dt>
        <dd>smcn-jp.com</dd>

        <dt>運営統括責任者</dt>
        <dd>ご請求があった場合、遅滞なく開示します。</dd>

        <dt>所在地</dt>
        <dd>ご請求があった場合、遅滞なく開示します。</dd>

        <dt>電話番号</dt>
        <dd>ご請求があった場合、遅滞なく開示します。（お問い合わせは下記メールにて承ります）</dd>

        <dt>メールアドレス</dt>
        <dd>info@smcn-jp.com</dd>

        <dt>販売価格</dt>
        <dd>プレミアム会員：月額 {yen(PRICE_MONTHLY)}（税込）／年額 {yen(PRICE_YEARLY)}（税込）。無料会員は一部機能のみ利用可。</dd>

        <dt>商品代金以外の必要料金</dt>
        <dd>インターネット接続に係る通信料はお客様のご負担となります。</dd>

        <dt>支払方法</dt>
        <dd>クレジットカード（決済代行：Stripe）</dd>

        <dt>支払時期</dt>
        <dd>お申し込み時に初回課金。以後、各更新日（月額は毎月、年額は毎年）に自動更新・自動課金されます。</dd>

        <dt>役務の提供時期</dt>
        <dd>決済完了後、直ちにプレミアム機能をご利用いただけます。</dd>

        <dt>解約・返金について</dt>
        <dd>次回更新日の前までにお手続きいただくことで、いつでも解約できます。最低利用期間の定めはありません。デジタルサービスの性質上、会員都合による中途解約時の返金（日割りを含む）は原則行いません。ただし、当方都合でサービスを終了する場合、年額プランの未経過期間分を日割りで返金します（利用規約第6条）。</dd>

        <dt>動作環境</dt>
        <dd>最新のモダンブラウザ（Google Chrome / Safari 等）でのご利用を推奨します。</dd>

        <dt>販売数量の制限等</dt>
        <dd>どなたでもご登録いただけます（20歳以上）。</dd>
      </dl>
    </LegalShell>
  );
}
