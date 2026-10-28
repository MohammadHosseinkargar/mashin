/**
 * دریافت و تحلیل آگهی‌های Dubicars از صفحه‌ی جست‌وجو.
 * این ماژول فقط از type استفاده می‌کند و هیچ وابستگی اجرایی ندارد،
 * تا هم در Next.js و هم در ابزارهای Node قابل استفاده و تست باشد.
 *
 * منبع داده: HTML سمت سرور صفحه‌ی جست‌وجو که برای هر آگهی شامل
 * JSON-LD (ItemList) و اتریبیوت‌های data-fpa-preview / data-ga4-detail /
 * data-mixpanel-detail / data-slider-images است.
 */
import type { FuelType, Transmission } from "./types";

export const DEFAULT_SEARCH_URL =
  "https://www.dubicars.com/search?o=&did=&gen=&trg=&c=used&ul=DE&cr=AED&k=&mg=&coo=&yf=&yt=&set=bu&pf=&pt=&emif=&emit=&kf=&kt=&esf=&est=&l=3";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** هدر مشترک برای دریافت صفحه و تصاویر از Dubicars */
export const DUBICARS_USER_AGENT = USER_AGENT;

export interface DubicarsListing {
  externalId: string;
  url: string;
  title: string;
  brand: string;
  model: string;
  trim: string;
  modelYear: number;
  priceAed: number;
  exportPriceAed: number;
  mileage: number;
  engineCc: number;
  fuel: FuelType;
  transmission: Transmission;
  city: string;
  gcc: boolean;
  bodyType: string;
  color: string;
  doors: number;
  seats: number;
  seller: string;
  images: string[];
  available: boolean;
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const n = Number(String(value).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** استخراج شیء JSON متوازن از یک رشته (با در نظر گرفتن رشته‌ها و escape) */
function extractBalancedJson<T>(source: string, from: number): T | null {
  const start = source.indexOf("{", from);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(source.slice(start, i + 1)) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function attrValue(source: string, name: string): string {
  const m = new RegExp(`${name}="([^"]*)"`).exec(source);
  return m ? decodeEntities(m[1]) : "";
}

function attrJson<T>(source: string, name: string): T | null {
  const raw = attrValue(source, name);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** مقدار JSON داخل اتریبیوت تک‌نقله‌ای (مثل data-fpa-preview='{...}') */
function quotedJson<T>(source: string, name: string): T | null {
  const marker = `${name}='`;
  const at = source.indexOf(marker);
  if (at < 0) return null;
  const after = at + marker.length;
  if (source[after] !== "{") return null; // مقدار 'null'
  return extractBalancedJson<T>(source, after);
}

function absoluteUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

function mapFuel(value: string): FuelType {
  const v = value.toLowerCase();
  if (v.includes("diesel")) return "diesel";
  if (v.includes("electric") || v.includes("battery")) return "electric";
  if (v.includes("hybrid")) return "hybrid";
  return "petrol";
}

function mapTransmission(value: string): Transmission {
  const v = value.toLowerCase();
  return v.includes("manual") || v === "mt" ? "manual" : "automatic";
}

function engineCcOf(fpa: FpaPreview | null, title: string): number {
  const specs = (fpa?.specs ?? []).map((s) => String(s?.value ?? "").trim());
  for (const spec of specs) {
    const m = /^([\d.]+)\s*L$/i.exec(spec);
    if (m) {
      const liters = Number(m[1]);
      if (liters > 0) return Math.round(liters * 1000);
    }
  }
  const size = Number(fpa?.engine_size);
  if (Number.isFinite(size) && size > 0 && size < 20) return Math.round(size * 1000);
  // برخی آگهی‌ها fpa ندارند؛ حجم موتور را از عنوان آگهی می‌خوانیم (مثل "3.5L Twin-Turbo")
  const fromTitle = /\b(\d{1,2}(?:\.\d+)?)\s*L\b/i.exec(title);
  if (fromTitle) {
    const liters = Number(fromTitle[1]);
    if (liters > 0) return Math.round(liters * 1000);
  }
  return 0;
}

function sliderImages(chunk: string): string[] {
  const m = /data-slider-images='([^']*)'/.exec(chunk);
  if (!m) return [];
  try {
    const raw = m[1].replace(/\\"/g, '"').replace(/\\\//g, "/");
    const arr = JSON.parse(raw) as unknown;
    if (Array.isArray(arr)) return arr.filter((x): x is string => typeof x === "string" && !!x).map(absoluteUrl);
  } catch {
    /* ignore */
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* JSON-LD (قیمت، لینک، تصویر اصلی، وضعیت موجودی)                     */
/* ------------------------------------------------------------------ */

interface LdMeta {
  url: string;
  price: number;
  image: string;
  available: boolean;
  name: string;
}

function parseJsonLd(html: string): Map<string, LdMeta> {
  const out = new Map<string, LdMeta>();
  const block = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!block) return out;
  try {
    const doc = JSON.parse(block[1]) as { "@graph"?: Array<Record<string, unknown>> };
    const graph = Array.isArray(doc["@graph"]) ? doc["@graph"] : [];
    for (const node of graph) {
      if (node?.["@type"] !== "ItemList") continue;
      const elements = (node.itemListElement ?? []) as Array<{ item?: Record<string, unknown> }>;
      for (const element of elements) {
        const item = element?.item;
        if (!item) continue;
        const url = typeof item.url === "string" ? item.url : "";
        const idMatch = /-(\d+)\.html/.exec(url);
        if (!idMatch) continue;
        const offers = (item.offers ?? {}) as { price?: unknown; availability?: unknown };
        const availability = String(offers.availability ?? "");
        const image = typeof item.image === "string" ? item.image : "";
        out.set(idMatch[1], {
          url,
          price: toNumber(offers.price),
          image: absoluteUrl(image),
          available: !/OutOfStock|SoldOut|Discontinued/i.test(availability),
          name: typeof item.name === "string" ? item.name : "",
        });
      }
    }
  } catch {
    /* ignore malformed structured data */
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* کارت‌های نتیجه‌ی جست‌وجو                                             */
/* ------------------------------------------------------------------ */

interface FpaPreview {
  id?: number;
  make?: { name?: string };
  model?: { name?: string };
  year?: { name?: string };
  place?: { name?: string };
  fuel?: { name?: string };
  regional_spec?: { name?: string };
  engine_size?: number;
  km?: string;
  specs?: Array<{ value?: string }>;
}

interface Ga4Detail {
  item_id?: number;
  price?: number;
  export_price?: number;
  city?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  exterior_color?: string;
  seat_count?: number | string;
  door_count?: number | string;
  seller_name?: string;
  car_make?: string;
  car_model?: string;
  car_year?: number;
  regional_specs?: string;
  image_url?: string;
}

interface MixpanelDetail {
  item_trim?: string;
  item_location?: string;
  item_fuel_type?: string;
  item_gearbox?: string;
  item_local_price?: number;
  item_mileage?: number;
}

interface SpItem {
  id?: number;
  pr?: number; // قیمت خام (درهم)
  spr?: number; // قیمت نمایش‌داده‌شده در سایت
  xp?: number; // قیمت صادراتی
  km?: number;
  y?: number;
}

export function parseDubicarsPage(html: string): DubicarsListing[] {
  const meta = parseJsonLd(html);
  // هر کارت با data-sp-item شروع می‌شود؛ مرزبندی کارت‌ها بر اساس همین اتریبیوت است.
  const starts = Array.from(html.matchAll(/data-sp-item='/g), (m) => m.index ?? -1).filter((i) => i >= 0);
  const listings: DubicarsListing[] = [];

  starts.forEach((start, index) => {
    const end = starts[index + 1] ?? Math.min(html.length, start + 100_000);
    const chunk = html.slice(start, end);
    // برخی آگهی‌ها data-fpa-preview='null' دارند؛ ga4/mixpanel/sp روی همه‌ی کارت‌ها هست.
    const fpa = quotedJson<FpaPreview>(chunk, "data-fpa-preview");
    const ga4 = attrJson<Ga4Detail>(chunk, "data-ga4-detail");
    const mixpanel = attrJson<MixpanelDetail>(chunk, "data-mixpanel-detail");
    const sp = quotedJson<SpItem>(decodeEntities(chunk), "data-sp-item");
    if (!ga4 && !sp) return;

    const externalId = String(ga4?.item_id ?? fpa?.id ?? sp?.id ?? "");
    if (!externalId || externalId === "undefined") return;
    const ld = meta.get(externalId);

    const title =
      attrValue(chunk, "data-item-title") || ld?.name || `${ga4?.car_make ?? ""} ${ga4?.car_model ?? ""}`;
    const brand = String(ga4?.car_make ?? fpa?.make?.name ?? "").trim();
    const model = String(ga4?.car_model ?? fpa?.model?.name ?? "").trim();
    const modelYear = toNumber(ga4?.car_year ?? fpa?.year?.name ?? sp?.y);
    if (!brand || !model || !modelYear) return;

    const images = sliderImages(chunk);
    if (!images.length && ga4?.image_url) images.push(absoluteUrl(ga4.image_url));
    if (!images.length && ld?.image) images.push(ld.image);

    const specValues = (fpa?.specs ?? []).map((s) => String(s?.value ?? ""));
    const gcc =
      String(fpa?.regional_spec?.name ?? ga4?.regional_specs ?? "")
        .toUpperCase()
        .includes("GCC") || specValues.some((v) => v.toUpperCase() === "GCC");

    const kmAttr = /data-item-kilometers="([^"]*)"/.exec(chunk)?.[1] ?? "";
    const mileage =
      toNumber(mixpanel?.item_mileage) ||
      toNumber(fpa?.km) ||
      toNumber(sp?.km) ||
      toNumber(kmAttr.replace(/[^\d.]/g, ""));

    const priceAed =
      toNumber(ga4?.price) ||
      toNumber(mixpanel?.item_local_price) ||
      ld?.price ||
      toNumber(sp?.pr) ||
      toNumber(sp?.spr) ||
      0;
    // آگهی‌های «قیمت را بپرسید» قیمتی ندارند و قابل نمایش در کاتالوگ نیستند.
    if (priceAed <= 0) return;

    listings.push({
      externalId,
      url: ld?.url ?? "",
      title,
      brand,
      model,
      trim: String(mixpanel?.item_trim ?? "").trim(),
      modelYear,
      priceAed,
      exportPriceAed: toNumber(ga4?.export_price) || toNumber(sp?.xp),
      mileage,
      engineCc: engineCcOf(fpa, title),
      fuel: mapFuel(String(fpa?.fuel?.name ?? ga4?.fuel_type ?? mixpanel?.item_fuel_type ?? "")),
      transmission: mapTransmission(
        String(ga4?.transmission ?? mixpanel?.item_gearbox ?? specValues.find((v) => /automatic|manual|cvt|dct/i.test(v)) ?? "")
      ),
      city: String(ga4?.city ?? fpa?.place?.name ?? mixpanel?.item_location ?? "").trim(),
      gcc,
      bodyType: String(ga4?.body_type ?? "").trim(),
      color: String(ga4?.exterior_color ?? "").trim(),
      doors: toNumber(ga4?.door_count),
      seats: toNumber(ga4?.seat_count),
      seller: String(ga4?.seller_name ?? "").trim(),
      images,
      available: ld ? ld.available : true,
    });
  });

  return listings;
}

/* ------------------------------------------------------------------ */
/* دریافت صفحه‌ها                                                       */
/* ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** مکث بین درخواست‌های صفحه (میلی‌ثانیه)؛ از DUBICARS_PAGE_DELAY_MS یا ۲۵۰۰ */
export function pageDelayMs(): number {
  const raw = process.env.DUBICARS_PAGE_DELAY_MS?.trim();
  if (!raw) return 2500;
  const v = Number(raw);
  return Number.isFinite(v) && v >= 0 ? v : 2500;
}

/** آدرس صفحه‌ی جست‌وجو (پیکربندی یا لاگ) */
export function dubicarsSearchUrl(): string {
  return process.env.DUBICARS_SEARCH_URL?.trim() || DEFAULT_SEARCH_URL;
}

/** مسدودسازی موقت Cloudflare (403/429)؛ با تلاش مجدد یا در دسته‌ی بعدی دور زده می‌شود. */
export class DubicarsBlockedError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Dubicars درخواست را مسدود کرد (HTTP ${status})`);
    this.name = "DubicarsBlockedError";
    this.status = status;
  }
}

/** مکش‌های تلاش مجدد بعد از پاسخ مسدودکننده */
const RETRY_DELAYS_MS = [12_000, 30_000];

async function fetchPage(url: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
        redirect: "follow",
      });
    } catch (e) {
      // خطای شبکه → تلاش مجدد
      if (attempt >= RETRY_DELAYS_MS.length) throw e;
      continue;
    }
    if (res.ok) return res.text();
    const retryable = res.status === 403 || res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= RETRY_DELAYS_MS.length) {
      if (res.status === 403 || res.status === 429) throw new DubicarsBlockedError(res.status);
      throw new Error(`Dubicars پاسخ HTTP ${res.status} داد: ${url}`);
    }
  }
}

/** تعداد کل نتایج جست‌وجو («۲۱٬۷۳۶ results»)؛ ۰ اگر پیدا نشود. */
function parseResultsTotal(html: string): number {
  const m = /([\d,]+)\s+results/i.exec(html);
  const n = m ? Number(m[1].replace(/,/g, "")) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** تعداد کارت‌های خام صفحه (۳۰ برای صفحات کامل) */
function countCards(html: string): number {
  return (html.match(/data-sp-item='/g) ?? []).length;
}

export interface DubicarsPage {
  html: string;
  /** مجموع نتایج جست‌وجو؛ ۰ اگر نامشخص */
  totalResults: number;
  /** تعداد کارت‌های خام این صفحه */
  itemCount: number;
}

/** دریافت یک صفحه‌ی نتایج (۱ = اولین صفحه) با تلاش مجدد در برابر مسدودسازی. */
export async function fetchDubicarsPage(searchUrl: string, page: number): Promise<DubicarsPage> {
  const url = new URL(searchUrl);
  if (page > 1) url.searchParams.set("page", String(page));
  const html = await fetchPage(url.toString());
  return { html, totalResults: parseResultsTotal(html), itemCount: countCards(html) };
}

/** مکث کوتاه با اندکی تصادفی‌سازی (کاهش الگوی درخواست) */
export async function pagePace(delayMs: number): Promise<void> {
  await sleep(delayMs + Math.floor(Math.random() * 600));
}
