// 期待値シミュレーター(簡易モデル)。天井/ゾーン/当選率/差枚/コイン単価から、開始G別の期待値(円)を算出。
//   モデル: 開始Gから天井まで各Gで当選確率rate(g)。当選=AT平均差枚、天井到達=天井平均差枚。
//   期待値(円) = 期待獲得差枚×換金率 − 期待消化G×コイン単価。ゾーンは範囲でrateを上書き。
export type Zone = { from: number; to: number; rate: number }; // rate = 当選率の分母(1/rate)。0は無効。
export type CalcInput = {
  tenjo: number;      // 天井G
  baseRate: number;   // 通常時のAT/CZ当選率の分母(1/baseRate)
  zones: Zone[];      // ゾーン(範囲で当選率を上書き)
  atDiff: number;     // AT1回の平均差枚(純増後・枚)
  tenjoDiff: number;  // 天井到達時の平均差枚(枚)
  coinMochi: number;  // 通常時コイン持ち(50枚あたりのG数)。通常投資の算出用。
  borrow: number;     // 貸単価(円/枚。通常20)
  exchange: number;   // 換金率(円/枚。等価20、非等価はそれ以下)
  step: number;       // 期待値表のG刻み
};
export type Row = { g: number; ev: number; hitP: number };

export function calcKitaichi(inp: CalcInput): { rows: Row[]; border: number | null } {
  const T = Math.max(1, Math.round(inp.tenjo));
  // 通常時の1G投資(円) = (50枚 / コイン持ちG) × 貸単価。通常回しの純消費を表す。
  const costPerGame = inp.coinMochi > 0 ? (50 / inp.coinMochi) * inp.borrow : 0;
  const rateAt = (g: number) => {
    for (const z of inp.zones) if (z.rate > 0 && g >= z.from && g < z.to) return 1 / z.rate;
    return inp.baseRate > 0 ? 1 / inp.baseRate : 0;
  };
  const evAt = (g0: number) => {
    let surv = 1, games = 0, gainCoins = 0;
    for (let g = g0; g < T; g++) {
      const p = rateAt(g);
      games += surv;                       // このGを消化する期待回数
      gainCoins += surv * p * inp.atDiff;   // このGで当選する分の期待獲得枚
      surv *= 1 - p;
    }
    gainCoins += surv * inp.tenjoDiff;       // 天井到達分
    const hitP = 1 - surv;                   // 天井前当選率
    const ev = gainCoins * inp.exchange - games * costPerGame; // 獲得(換金) − 通常投資(貸)
    return { ev, hitP };
  };
  const rows: Row[] = [];
  const step = Math.max(1, Math.round(inp.step));
  for (let g = 0; g <= T; g += step) { const { ev, hitP } = evAt(g); rows.push({ g, ev: Math.round(ev), hitP }); }
  let border: number | null = null;
  for (const r of rows) if (r.ev >= 0) { border = r.g; break; }
  return { rows, border };
}

// 期待値表HTML(自作機種の狙い目にそのまま貼れる形式)
export function toTableHtml(rows: Row[], border: number | null): string {
  const body = rows.map((r) => `<tr><td>${r.g}G〜</td><td>${r.ev >= 0 ? "+" : ""}${r.ev.toLocaleString("ja-JP")}円</td></tr>`).join("");
  const b = border != null ? `<p>ボーダー: 約 ${border}G〜（期待値がプラスに転じる開始ゲーム数）</p>` : "";
  return `<h3>期待値表</h3>${b}<table><thead><tr><th>開始G</th><th>期待値</th></tr></thead><tbody>${body}</tbody></table>`;
}
