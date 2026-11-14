import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, isAdmin, ok, route } from "@/lib/api";
import { MIN_MODEL_YEAR, dubicarsSearchUrl } from "@/lib/dubicars";
import { IngestError, ingestHtmlPage, ingestListings } from "@/lib/importer";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_BODY_BYTES = 15 * 1024 * 1024;

/** دسترسی: کوکی ادمین یا هدر Authorization: Bearer <INGEST_TOKEN> (حداقل ۱۶ کاراکتر) */
async function authorized(req: NextRequest): Promise<boolean> {
  if (await isAdmin(req)) return true;
  const secret = process.env.INGEST_TOKEN?.trim();
  if (!secret || secret.length < 16) return false;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

const text = (max: number) => z.string().trim().max(max);
const listing = z.object({
  externalId: z.string().regex(/^[\w-]{1,40}$/),
  url: z.union([z.literal(""), z.string().url().max(500)]).default(""),
  title: text(300),
  brand: text(100).min(1),
  model: text(100).min(1),
  trim: text(100).default(""),
  modelYear: z.number().int().min(1990).max(2100),
  priceAed: z.number().positive().max(100_000_000),
  exportPriceAed: z.number().min(0).max(100_000_000).default(0),
  mileage: z.number().min(0).max(5_000_000).default(0),
  engineCc: z.number().min(0).max(20_000).default(0),
  fuel: z.enum(["petrol", "diesel", "electric", "hybrid"]),
  transmission: z.enum(["manual", "automatic"]),
  city: text(100).default(""),
  gcc: z.boolean().default(false),
  bodyType: text(60).default(""),
  color: text(60).default(""),
  doors: z.number().min(0).max(10).default(0),
  seats: z.number().min(0).max(30).default(0),
  seller: text(150).default(""),
  images: z.array(z.string().url().max(600)).max(12).default([]),
  available: z.boolean().default(true),
});

const body = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("dubicars-page"),
    html: z.string().min(200),
    page: z.number().int().min(1).max(5000).default(1),
    lane: z.enum(["cycle", "fast"]).default("cycle"),
    dryRun: z.boolean().optional(),
  }),
  z.object({ kind: z.literal("listings"), listings: z.array(listing).min(1).max(200), dryRun: z.boolean().optional() }),
]);

/** وضعیت برای collector: آدرس جست‌وجو (با فیلتر سال)، cursor فعلی و فعال‌بودن */
export const GET = route(async (req) => {
  if (!(await authorized(req))) return fail("دسترسی غیرمجاز.", 401);
  const s = await db.getImportSettings();
  return ok({
    enabled: s.enabled,
    cursorPage: s.cursorPage,
    totalPages: s.totalPages,
    totalResults: s.totalResults,
    lastSyncAt: s.lastSyncAt,
    minYear: MIN_MODEL_YEAR,
    searchUrl: dubicarsSearchUrl(),
  });
});

export const POST = route(async (req) => {
  if (!(await authorized(req))) return fail("دسترسی غیرمجاز.", 401);
  const settings = await db.getImportSettings();
  if (!settings.enabled) return fail("همگام‌سازی در پنل ادمین غیرفعال است.", 409);

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return fail("حجم درخواست بیش از حد مجاز است.", 413);
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return fail("حجم درخواست بیش از حد مجاز است.", 413);

  const input = body.parse(JSON.parse(raw));
  try {
    if (input.kind === "dubicars-page") return ok(await ingestHtmlPage(input.html, { page: input.page, lane: input.lane, dryRun: input.dryRun }));
    return ok(await ingestListings(input.listings, { dryRun: input.dryRun }));
  } catch (e) {
    if (e instanceof IngestError) return fail(e.message, e.status);
    throw e;
  }
});
