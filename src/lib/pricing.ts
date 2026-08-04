// 料金設定(税込)。1箇所に集約。
export const PRICE_MONTHLY = 780;   // 月額
export const PRICE_YEARLY = 5980;   // 年額(月あたり約498円)
export const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");
