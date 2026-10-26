const faNum = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });
const faDate = new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" });
const faDateTime = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const toFa = (n: number | string | null | undefined): string =>
  n === null || n === undefined || n === "" || Number.isNaN(Number(n)) ? "—" : faNum.format(Number(n));

/** عدد فارسی/عربی را به لاتین تبدیل می‌کند و فقط عدد برمی‌گرداند. */
export function parseNum(input: string | number | null | undefined): number {
  if (typeof input === "number") return Number.isFinite(input) ? input : 0;
  if (!input) return 0;
  const s = String(input)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[٬,،\s]/g, "")
    .replace(/٫/g, ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function toEnDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/** اعداد بدون جداکننده‌ی هزارگان (برای سال و شماره‌ها) */
const faPlain = new Intl.NumberFormat("fa-IR", { useGrouping: false });
export const toFaPlain = (n: number) => faPlain.format(n);

export const formatToman = (n: number) => `${toFa(n)} تومان`;
export const formatAed = (n: number) => `${toFa(n)} درهم`;
export const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : faDate.format(d);
};
export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : faDateTime.format(d);
};

/** نمایش خلاصه‌ی مبلغ بزرگ: ۱٫۲ میلیارد / ۸۵۰ میلیون */
export function compactToman(n: number): string {
  if (n >= 1_000_000_000) return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(n / 1_000_000_000)} میلیارد تومان`;
  if (n >= 1_000_000) return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(n / 1_000_000)} میلیون تومان`;
  return formatToman(n);
}

export const FUEL_LABEL: Record<string, string> = { petrol: "بنزینی", diesel: "دیزلی", electric: "برقی", hybrid: "هیبریدی" };
export const TRANS_LABEL: Record<string, string> = { automatic: "اتوماتیک", manual: "دنده‌ای" };
export const STATUS_LABEL: Record<string, string> = { available: "موجود", order: "سفارشی", unavailable: "ناموجود" };
export const REQUEST_LABEL: Record<string, string> = { pending: "در انتظار", contacted: "تماس گرفته شد", converted: "تبدیل به خرید" };
export const FEE_CURRENCY_LABEL: Record<string, string> = { AED: "درهم", Toman: "تومان", Rial: "ریال" };

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
