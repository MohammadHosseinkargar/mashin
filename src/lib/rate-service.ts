import "server-only";
import { db } from "./db";
import type { ExchangeRate } from "./types";

import { consensus, type RateReading } from "./rate-consensus";

/** حتی اگر نرخ عوض نشده باشد، هر چند وقت یک‌بار زمان «آخرین به‌روزرسانی» تازه می‌شود */
const HEARTBEAT_MS = 5 * 60_000;
const FETCH_TIMEOUT_MS = 6_000;

export type { RateReading };
export interface RefreshResult {
  ok: boolean;
  /** نرخ جدید ثبت شد (یا تازه‌سازی زمان) */
  updated: boolean;
  rate?: number;
  sources?: string[];
  /** دلیل ثبت‌نشدن یا خطا */
  reason?: string;
}

interface Provider {
  name: string;
  url: string;
  headers?: Record<string, string>;
  /** خروجی: تومان به ازای هر ۱ درهم، یا null اگر پاسخ معتبر نبود */
  parse: (body: unknown) => number | null;
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const BUILT_IN: Provider[] = [
  {
    name: "priceto.day",
    url: "https://api.priceto.day/v1/latest/irr/aed",
    parse: (d) => {
      const x = d as { success?: boolean; price?: number };
      return x?.success && Number.isFinite(x.price) ? Math.round((x.price as number) / 10) : null; // ریال → تومان
    },
  },
  {
    name: "open.er-api.com",
    url: "https://open.er-api.com/v6/latest/AED",
    parse: (d) => {
      const x = d as { result?: string; rates?: { IRR?: number } };
      return x?.result === "success" && x.rates?.IRR ? Math.round(x.rates.IRR / 10) : null;
    },
  },
];

function pick(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

/**
 * منبع‌های اضافه بدون تغییر کد، با متغیر محیطی:
 * RATE_SOURCES_EXTRA='[{"name":"mysrc","url":"https://…","path":"data.aed.sell","divisor":10,"headers":{"x-api-key":"…"}}]'
 * divisor = ۱۰ یعنی مقدار منبع «ریال» است؛ ۱ یعنی همان تومان است.
 */
function extraProviders(): Provider[] {
  const raw = process.env.RATE_SOURCES_EXTRA?.trim();
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as Array<{ name?: string; url?: string; path?: string; divisor?: number; headers?: Record<string, string> }>;
    return list
      .filter((s) => s?.url && s.path)
      .map((s, i) => ({
        name: s.name || `extra-${i + 1}`,
        url: s.url as string,
        headers: s.headers,
        parse: (body: unknown) => {
          const n = Number(String(pick(body, s.path as string) ?? "").replace(/,/g, ""));
          return Number.isFinite(n) && n > 0 ? Math.round(n / (s.divisor && s.divisor > 0 ? s.divisor : 1)) : null;
        },
      }));
  } catch {
    console.error("[rate] RATE_SOURCES_EXTRA یک JSON معتبر نیست؛ نادیده گرفته شد.");
    return [];
  }
}

async function readProvider(p: Provider): Promise<RateReading | null> {
  try {
    const res = await fetch(p.url, {
      headers: { accept: "application/json", "User-Agent": UA, ...(p.headers ?? {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const rate = p.parse(await res.json());
    return rate ? { name: p.name, rate } : null;
  } catch {
    return null;
  }
}

/* ---- حالت مشترک در حافظه‌ی پردازش (قفل، زمان آخرین تلاش، آخرین خطا) ---- */
interface RateState { lock?: Promise<RefreshResult>; lastAttemptAt: number; lastSuccessAt: number; lastError: string | null }
const g = globalThis as unknown as { __rateState?: RateState };
const state = (): RateState => (g.__rateState ??= { lastAttemptAt: 0, lastSuccessAt: 0, lastError: null });

export function getRateState() {
  const s = state();
  return { lastAttemptAt: s.lastAttemptAt, lastSuccessAt: s.lastSuccessAt, lastError: s.lastError };
}

export function rateIntervalMs(): number {
  const v = Number(process.env.RATE_INTERVAL_SECONDS);
  const sec = Number.isFinite(v) && v > 0 ? v : 30;
  return Math.min(3600, Math.max(10, Math.floor(sec))) * 1000;
}

async function run(force: boolean): Promise<RefreshResult> {
  const s = state();
  s.lastAttemptAt = Date.now();
  const current = await db.getRate();
  if (current.isManual && !force) return { ok: true, updated: false, rate: current.rate, reason: "نرخ در حالت دستی است؛ به‌روزرسانی خودکار انجام نشد." };

  const readings = (await Promise.all([...BUILT_IN, ...extraProviders()].map(readProvider))).filter((r): r is RateReading => r !== null);
  // نرخ قبلی فقط وقتی مرجع پیوستگی است که خودکار باشد (نرخ دستی ممکن است عمداً فرق داشته باشد)
  const result = consensus(readings, current.isManual ? undefined : current.rate);
  if ("error" in result) {
    s.lastError = result.error;
    return { ok: false, updated: false, rate: current.rate, reason: result.error };
  }

  s.lastError = null;
  s.lastSuccessAt = Date.now();
  const age = Date.now() - new Date(current.lastUpdated).getTime();
  const changed = result.rate !== current.rate || current.isManual;
  if (!changed && age < HEARTBEAT_MS) return { ok: true, updated: false, rate: result.rate, sources: result.sources };

  const saved = await db.setRate(result.rate, `live:${result.sources.join("+")}`, false);
  return { ok: true, updated: true, rate: saved.rate, sources: result.sources };
}

/** یک بار نرخ را از منابع زنده می‌گیرد. هم‌زمان فقط یک اجرا انجام می‌شود. */
export function refreshRate(opts: { force?: boolean } = {}): Promise<RefreshResult> {
  const s = state();
  if (s.lock) return s.lock;
  const p = run(Boolean(opts.force)).catch((e): RefreshResult => {
    const reason = e instanceof Error ? e.message : "خطای ناشناخته";
    s.lastError = reason;
    return { ok: false, updated: false, reason };
  }).finally(() => { s.lock = undefined; });
  s.lock = p;
  return p;
}

/**
 * «تازه‌سازی در پس‌زمینه با ترافیک سایت»: هر بار که کسی نرخ را می‌خواهد و آخرین تلاش قدیمی است،
 * بدون منتظر ماندن، یک تازه‌سازی شروع می‌شود. حتی بدون ورکر هم نرخ همیشه تازه می‌ماند.
 */
export function kickRefreshIfStale(current: ExchangeRate): void {
  if (current.isManual) return;
  if (Date.now() - state().lastAttemptAt < rateIntervalMs()) return;
  void refreshRate();
}
