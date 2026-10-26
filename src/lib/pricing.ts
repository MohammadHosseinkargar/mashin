import type { ImportFee, PriceBreakdown } from "./types";

/** محاسبه‌ی قیمت نهایی به تومان. نرخ = تومان به ازای هر درهم. */
export function calcPrice(aed: number, rate: number, fees: ImportFee[]): PriceBreakdown {
  const safeAed = Number.isFinite(aed) ? Math.max(0, aed) : 0;
  const safeRate = Number.isFinite(rate) ? Math.max(0, rate) : 0;
  const baseToman = Math.round(safeAed * safeRate);

  const lines = fees
    .filter((f) => f.isEnabled)
    .map((f) => {
      let amount = 0;
      if (f.type === "percentage") {
        amount = (baseToman * f.value) / 100;
      } else if (f.currency === "AED") {
        amount = f.value * safeRate;
      } else if (f.currency === "Rial") {
        amount = f.value / 10;
      } else {
        amount = f.value;
      }
      return {
        id: f.id,
        name: f.name,
        description: f.description,
        type: f.type,
        rawValue: f.value,
        currency: f.currency,
        amountToman: Math.round(amount),
      };
    });

  const feesToman = lines.reduce((s, l) => s + l.amountToman, 0);
  return { aed: safeAed, rate: safeRate, baseToman, lines, feesToman, totalToman: baseToman + feesToman };
}
