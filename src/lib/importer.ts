import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { db } from "./db";
import {
  DUBICARS_USER_AGENT,
  DubicarsBlockedError,
  dubicarsSearchUrl,
  fetchDubicarsPage,
  pageDelayMs,
  pagePace,
  parseDubicarsPage,
  type DubicarsListing,
} from "./dubicars";
import { FUEL_LABEL, TRANS_LABEL, toFa } from "./format";
import type { Vehicle, VehicleInput } from "./types";
import { UPLOAD_DIR } from "./uploads";

const SOURCE = "dubicars";
const REFERRER = "https://www.dubicars.com/";
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const IMAGE_EXT = new Set(["jpg", "png", "webp", "avif"]);
const DEFAULT_BUDGET_MS = 150_000;
const MAX_BUDGET_MS = 180_000;

export interface SyncOptions {
  /** فقط بخوان و گزارش بده؛ چیزی ذخیره یا دانلود نمی‌شود */
  dryRun?: boolean;
  /** بودجه‌ی زمانی این دسته به میلی‌ثانیه (پیش‌فرض از DUBICARS_TIME_BUDGET_MS یا ۱۵۰ ثانیه) */
  budgetMs?: number;
  /** حداکثر صفحه در این دسته؛ ۰ یا نامشخص = تا پایان بودجه/چرخه (پیش‌فرض از DUBICARS_PAGES) */
  maxPages?: number;
}

export interface SyncResult {
  created: number;
  updated: number;
  /** آگهی‌هایی که بدون تغییر بودند و به‌روزرسانی نشدند */
  unchanged: number;
  /** تصاویر تازه دانلودشده (فایل‌های از قبل موجود شمرده نمی‌شوند) */
  images: number;
  /** تعداد صفحه‌های کامل‌شده در این اجرا */
  pages: number;
  dryRun: boolean;
  /** تعداد آگهی‌های خوانده‌شده در این اجرا */
  total: number;
  /** صفحه‌ای که اجرای بعدی از آن ادامه می‌دهد */
  cursorPage: number;
  totalPages: number;
  totalResults: number;
  /** چرخه‌ی همه‌ی صفحه‌ها تمام شد و cursor به ابتدای فهرست برگشت */
  done: boolean;
  /** Dubicars درخواست را مسدود کرد؛ اجرای بعدی از همین صفحه ادامه می‌دهد */
  blocked: boolean;
  /** بودجه‌ی زمانی تمام شد؛ اجرای بعدی از همین‌جا ادامه می‌دهد */
  budgetHit: boolean;
}

function envInt(name: string, min: number, max: number, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const v = Number(raw);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.floor(v)));
}

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, Math.floor(v)));
}

/** JSON با کلیدهای مرتب‌شده؛ پایدار در برابر بازچینش کلیدها در JSONB پستگرس */
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.keys(v as Record<string, unknown>).sort().reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = (v as Record<string, unknown>)[k];
          return acc;
        }, {})
      : v
  );
}

function imageExt(url: string): string {
  try {
    const match = /\.([a-z0-9]+)$/i.exec(new URL(url).pathname);
    const ext = (match?.[1] ?? "jpg").toLowerCase();
    if (ext === "jpeg") return "jpg";
    return IMAGE_EXT.has(ext) ? ext : "jpg";
  } catch {
    return "jpg";
  }
}

/**
 * تصویر آگهی را در `.data/uploads` ذخیره می‌کند تا سایت به‌جای لینک خارجی از فایل محلی استفاده کند.
 * نام فایل قطعی است (`dubi-<id>-<n>.jpg`)؛ اگر قبلاً دانلود شده باشد، درخواستی ارسال نمی‌شود.
 * در صورت شکست null برمی‌گردد تا تصویر قبلی (یا در نهایت لینک اصلی) حفظ شود.
 */
async function saveImage(
  url: string,
  externalId: string,
  index: number
): Promise<{ path: string; fresh: boolean } | null> {
  const name = `dubi-${externalId}-${index}.${imageExt(url)}`;
  const dest = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name);
  try {
    await fs.access(dest);
    return { path: `/uploads/${name}`, fresh: false };
  } catch {
    /* دانلود نشده؛ ادامه */
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": DUBICARS_USER_AGENT, Referer: REFERRER },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > MAX_IMAGE_BYTES) return null;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(dest, buf);
    return { path: `/uploads/${name}`, fresh: true };
  } catch {
    return null;
  }
}

/** دانلود موازی تصاویر یک آگهی؛ null یعنی دانلود نشد. */
async function downloadImages(
  l: DubicarsListing,
  limit: number
): Promise<{ paths: (string | null)[]; fresh: number }> {
  const urls = l.images.slice(0, Math.max(0, limit));
  const results = await Promise.all(urls.map((u, i) => saveImage(u, l.externalId, i)));
  return {
    paths: results.map((r) => (r ? r.path : null)),
    fresh: results.filter((r) => r?.fresh).length,
  };
}

/**
 * ترجیح: فایل محلی تازه/ذخیره‌شده ← تصویر ذخیره‌شده‌ی قبلی ← لینک اصلی آگهی.
 * بنابراین شکست دانلود هرگز تصویر قبلی خودرو را از بین نمی‌برد.
 */
function mergeImages(
  downloaded: (string | null)[],
  stored: string[],
  listing: DubicarsListing
): string[] {
  const merged: string[] = [];
  const slots = Math.max(downloaded.length, stored.length);
  for (let i = 0; i < slots; i++) {
    const local = downloaded[i];
    if (local) merged.push(local);
    else if (stored[i]) merged.push(stored[i]);
    else if (i < downloaded.length && listing.images[i]) merged.push(listing.images[i]);
  }
  return merged.filter(Boolean);
}

function toVehicle(l: DubicarsListing, images: string[]): VehicleInput {
  const model = l.trim ? `${l.model} ${l.trim}` : l.model;
  const description = [
    `${l.brand} ${model} مدل ${l.modelYear}${l.city ? ` از ${l.city} امارات` : ""}؛ کارکرد ${toFa(l.mileage)} کیلومتر، ${FUEL_LABEL[l.fuel]}، دندهٔ ${TRANS_LABEL[l.transmission].toLowerCase()}، ${l.gcc ? "اسپک GCC" : "اسپک غیر GCC"}${l.engineCc ? `، حجم موتور ${toFa(l.engineCc)} سی‌سی` : ""}.`,
    l.bodyType ? `نوع بدنه: ${l.bodyType}.` : "",
    l.color ? `رنگ: ${l.color}.` : "",
    "",
    l.title,
    l.url ? `\nمنبع آگهی: ${l.url}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    brand: l.brand,
    model,
    modelYear: l.modelYear,
    aedPrice: l.priceAed,
    images,
    specifications: {
      source: SOURCE,
      externalId: l.externalId,
      sourceUrl: l.url,
      location: l.city,
      gccSpec: l.gcc,
      currency: "AED",
      originalTitle: l.title,
      exportPrice: l.exportPriceAed,
      seller: l.seller,
      bodyType: l.bodyType,
      color: l.color,
      doors: l.doors,
      seats: l.seats,
    },
    mileage: l.mileage,
    engineCapacity: l.engineCc,
    fuelType: l.fuel,
    transmission: l.transmission,
    features: [],
    description,
    status: l.available ? "available" : "unavailable",
    isPublished: true, // مستقیم در کاتالوگ سایت نمایش داده می‌شود
  };
}

/** آیا داده‌ی جدید با رکورد موجود فرقی دارد؟ (بدون آن، به‌روزرسانی انجام نمی‌شود) */
function needsUpdate(v: Vehicle, next: VehicleInput): boolean {
  return (
    v.brand !== next.brand ||
    v.model !== next.model ||
    v.modelYear !== next.modelYear ||
    v.aedPrice !== next.aedPrice ||
    v.mileage !== next.mileage ||
    v.engineCapacity !== next.engineCapacity ||
    v.fuelType !== next.fuelType ||
    v.transmission !== next.transmission ||
    v.status !== next.status ||
    v.description !== next.description ||
    stableJson(v.images) !== stableJson(next.images) ||
    stableJson(v.features) !== stableJson(next.features) ||
    stableJson(v.specifications) !== stableJson(next.specifications)
  );
}

/**
 * یک «دسته» از همگام‌سازی: صفحه‌ها را از cursor ذخیره‌شده شروع می‌کند و تا پایان
 * بودجه‌ی زمانی یا حداکثر تعداد صفحه ادامه می‌دهد؛ سپس cursor را برای اجرای بعدی می‌نشاند.
 * به‌این‌ترتیب با هر اجرا بخشی از کل ۲۱هزار+ آگهی تازه می‌شود و چرخه‌ی کامل در چند اجرا تمام می‌شود.
 */
export async function runSync(options: SyncOptions = {}): Promise<SyncResult> {
  const dryRun = Boolean(options.dryRun);
  const budget = clampInt(
    options.budgetMs ?? envInt("DUBICARS_TIME_BUDGET_MS", 10_000, MAX_BUDGET_MS, DEFAULT_BUDGET_MS),
    10_000,
    MAX_BUDGET_MS
  );

  const settings = await db.getImportSettings();
  const searchUrl = dubicarsSearchUrl();
  const delay = pageDelayMs();

  let maxPages = clampInt(options.maxPages ?? envInt("DUBICARS_PAGES", 0, 2000, 0), 0, 2000);
  // اجرای آزمایشی: حداکثر ۳ صفحه تا سریع تمام شود
  if (dryRun && options.maxPages === undefined) maxPages = Math.min(maxPages || 3, 3);

  const rawImageLimit = process.env.DUBICARS_IMAGES?.trim();
  const parsedLimit = rawImageLimit ? Number(rawImageLimit) : NaN;
  const imageLimit = Number.isFinite(parsedLimit) && parsedLimit >= 0 ? parsedLimit : 4;

  let page = Math.max(1, settings.cursorPage || 1);
  const startPage = page;
  let fails = Math.max(0, settings.cursorFails || 0);
  let totalPages = Math.max(0, settings.totalPages || 0);
  let totalResults = Math.max(0, settings.totalResults || 0);

  // Only import cars 2023 and newer — ignore older vehicles entirely
  const MIN_YEAR = 2023;

  let done = false;
  let blocked = false;
  let budgetHit = false;
  let lastError: string | null = null;

  // Only import cars 2023 and newer — ignore older vehicles entirely
  const MIN_YEAR_CONST = 2023;

  // === aggregators (incremented during this batch) ===
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let freshImages = 0;
  let pages = 0;
  let total = 0;

  const started = Date.now();
  const overBudget = () => Date.now() - started >= budget;

  while (true) {
    if (overBudget()) {
      budgetHit = true;
      break;
    }
    if (maxPages > 0 && pages >= maxPages) break;

    let fetched;
    try {
      fetched = await fetchDubicarsPage(searchUrl, page);
    } catch (e) {
      if (e instanceof DubicarsBlockedError) {
        blocked = true;
        fails += 1;
        lastError = `${e.message} — صفحه‌ی ${page}؛ تلاش ${fails} پیاپی`;
        if (fails >= 3) {
          // اگر یک صفحه پیاپی مسدود شد، از آن رد می‌شویم تا چرخه قفل نشود
          page += 1;
          fails = 0;
          lastError += "؛ صفحه رد شد";
        }
        break;
      }
      throw e;
    }
    fails = 0;

    // انتهای نتایج: صفحه‌ای با کارت وجود ندارد
    if (fetched.itemCount === 0) {
      done = true;
      break;
    }

    if (fetched.totalResults > 0) totalResults = fetched.totalResults;
    if (totalResults > 0) {
      if (fetched.itemCount >= 30) totalPages = Math.ceil(totalResults / fetched.itemCount);
      else if (totalPages === 0) totalPages = Math.ceil(totalResults / Math.max(1, fetched.itemCount));
    }

    const listings = parseDubicarsPage(fetched.html);
    // Count only filtered listings (2023+)
    total += listings.filter(l => l.modelYear >= MIN_YEAR_CONST).length;

    // حذف تکرار داخل صفحه، سپس پردازش هم‌زمان چند آگهی (سرعت دانلود عکس)
    const seen = new Set<string>();
    const unique: DubicarsListing[] = [];
    for (const l of listings) {
      if (seen.has(l.externalId)) continue;
      // Skip vehicles older than 2023 — never imported
      if (l.modelYear < MIN_YEAR_CONST) {
        seen.add(l.externalId);
        continue;
      }
      seen.add(l.externalId);
      unique.push(l);
    }

    const existing = unique.length ? await db.listByExternalIds(unique.map((l) => l.externalId)) : [];
    const byExternal = new Map(
      existing.map((v) => [String(v.specifications.externalId ?? ""), v])
    );

    let pageComplete = true;
    const CHUNK = 4; // ≤۴ آگهی هم‌زمان × ≤۴ عکس = حداکثر ۱۶ اتصال موازی
    for (let i = 0; i < unique.length; i += CHUNK) {
      if (overBudget()) {
        budgetHit = true;
        pageComplete = false;
        break;
      }
      await Promise.all(
        unique.slice(i, i + CHUNK).map(async (listing) => {
          const found = byExternal.get(listing.externalId) ?? null;
          const downloaded = dryRun
            ? { paths: [] as (string | null)[], fresh: 0 }
            : await downloadImages(listing, imageLimit);
          freshImages += downloaded.fresh;

          const images = mergeImages(downloaded.paths, found?.images ?? [], listing);
          const data = toVehicle(listing, images);

          if (found) {
            if (needsUpdate(found, data)) {
              updated++;
              if (!dryRun) await db.updateVehicle(found.id, data);
            } else {
              unchanged++;
            }
          } else {
            created++;
            if (!dryRun) await db.createVehicle(data);
          }
        })
      );
    }

    // بودجه وسط صفحه تمام شد: cursor روی همین صفحه می‌ماند تا اجرای بعد کامل شود
    if (!pageComplete) break;

    pages += 1;
    page += 1;
    if (totalPages > 0 && page > totalPages) {
      done = true;
      break;
    }
    if (!overBudget()) await pagePace(delay);
  }

  // چرخه کامل شد: اجرای بعدی از ابتدای فهرست شروع می‌کند
  if (done) page = 1;

  if (pages === 0 && total === 0 && !blocked && !budgetHit && startPage === 1) {
    throw new Error("هیچ آگهی‌ای از Dubicars دریافت نشد؛ آدرس جست‌وجو را بررسی کنید.");
  }

  const result: SyncResult = {
    created,
    updated,
    unchanged,
    images: freshImages,
    pages,
    dryRun,
    total,
    cursorPage: page,
    totalPages,
    totalResults,
    done,
    blocked,
    budgetHit,
  };

  if (!dryRun) {
    await db.saveImportSettings({
      lastSyncAt: new Date().toISOString(),
      lastError,
      cursorPage: page,
      totalPages,
      totalResults,
      cursorFails: fails,
      totalImported: settings.totalImported + created,
      totalUpdated: settings.totalUpdated + updated,
    });
  }

  return result;
}