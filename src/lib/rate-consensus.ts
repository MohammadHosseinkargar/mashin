/** منطق خالص انتخاب نرخ (بدون وابستگی؛ قابل تست مستقیم). */

/** محدوده‌ی منطقی نرخ هر درهم به تومان؛ بیرون از آن، پاسخ منبع خراب فرض می‌شود */
export const MIN_TOMAN = 7_000;
export const MAX_TOMAN = 500_000;
/** حداکثر فاصله‌ی مجاز یک منبعِ تنها از نرخ فعلی (محافظ در برابر جهش‌های اشتباه) */
const SINGLE_SOURCE_MAX_JUMP = 0.15;
/** دو منبع با اختلاف کمتر از این، هم‌نظر حساب می‌شوند */
const AGREEMENT = 0.03;


export interface RateReading { name: string; rate: number }

/**
 * از چند خوانش یک نرخ قابل‌اعتماد می‌سازد (تابع خالص؛ قابل تست).
 * ۳ منبع یا بیشتر: میانه + میانگینِ منابع هم‌نظر. دو منبع هم‌نظر: میانگین.
 * دو منبع ناهم‌نظر: همانی که به نرخ فعلی نزدیک‌تر است (بدون نرخ قبلی: اولی). یک منبع: فقط اگر جهش بزرگ نباشد.
 */
export function consensus(readings: RateReading[], prev?: number): { rate: number; sources: string[] } | { error: string } {
  const valid = readings.filter((r) => Number.isFinite(r.rate) && r.rate >= MIN_TOMAN && r.rate <= MAX_TOMAN);
  if (valid.length === 0) return { error: "هیچ منبعی نرخ معتبر برنگرداند." };

  if (valid.length === 1) {
    const [only] = valid;
    if (prev && prev > 0 && Math.abs(only.rate - prev) / prev > SINGLE_SOURCE_MAX_JUMP) {
      return { error: `فقط یک منبع (${only.name}) پاسخ داد و نرخ ${only.rate} بیش از ${SINGLE_SOURCE_MAX_JUMP * 100}٪ با نرخ فعلی فاصله دارد؛ ثبت نشد.` };
    }
    return { rate: only.rate, sources: [only.name] };
  }

  const sorted = [...valid].sort((a, b) => a.rate - b.rate);
  const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2].rate : (sorted[sorted.length / 2 - 1].rate + sorted[sorted.length / 2].rate) / 2;
  const agree = valid.filter((r) => Math.abs(r.rate - median) / median <= AGREEMENT);
  if (agree.length >= 2) {
    return { rate: Math.round(agree.reduce((s, r) => s + r.rate, 0) / agree.length), sources: agree.map((r) => r.name) };
  }
  if (valid.length >= 3) return { rate: Math.round(median), sources: [valid.find((r) => r.rate === sorted[Math.floor(sorted.length / 2)].rate)?.name ?? "median"] };

  // دو منبع ناهم‌نظر
  const chosen = prev && prev > 0
    ? [...valid].sort((a, b) => Math.abs(a.rate - prev) - Math.abs(b.rate - prev))[0]
    : valid[0];
  return { rate: chosen.rate, sources: [chosen.name] };
}

