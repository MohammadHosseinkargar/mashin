import { db } from "@/lib/db";
import { fail, ok, route } from "@/lib/api";
import { runSync } from "@/lib/importer";

export const GET = route(async () => ok(await db.getImportSettings()), { admin: true });

export const POST = route(async (req) => {
  const body = (await req.json()) as {
    action?: string;
    enabled?: boolean;
    dryRun?: boolean;
    budgetMs?: number;
    maxPages?: number;
  };
  if (body.action === "toggle") {
    return ok(await db.saveImportSettings({ enabled: Boolean(body.enabled) }));
  }
  if (body.action === "sync") {
    const settings = await db.getImportSettings();
    if (!settings.enabled) return fail("ابتدا همگام‌سازی را فعال کنید.", 400);
    const num = (v: unknown, min: number, max: number): number | undefined => {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) return undefined;
      return Math.min(max, Math.max(min, Math.floor(n)));
    };
    try {
      const result = await runSync({
        dryRun: Boolean(body.dryRun),
        budgetMs: num(body.budgetMs, 10_000, 180_000),
        maxPages: num(body.maxPages, 0, 2000),
      });
      return ok({ result, settings: await db.getImportSettings() });
    } catch (e) {
      await db.saveImportSettings({ lastError: e instanceof Error ? e.message : "خطای ناشناخته" });
      throw e;
    }
  }
  return fail("عملیات نامعتبر است.", 400);
}, { admin: true });