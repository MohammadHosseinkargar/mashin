import { db } from "@/lib/db";
import { fail, ok, route } from "@/lib/api";
import { runSync } from "@/lib/importer";

export const GET = route(async () => ok(await db.getImportSettings()), { admin: true });

export const POST = route(async (req) => {
  const body = (await req.json()) as { action?: string; enabled?: boolean; dryRun?: boolean };
  if (body.action === "toggle") {
    return ok(await db.saveImportSettings({ enabled: Boolean(body.enabled) }));
  }
  if (body.action === "sync") {
    const settings = await db.getImportSettings();
    if (!settings.enabled) return fail("ابتدا همگام‌سازی را فعال کنید.", 400);
    try {
      return ok({ result: await runSync(Boolean(body.dryRun)), settings: await db.getImportSettings() });
    } catch (e) {
      await db.saveImportSettings({ lastError: e instanceof Error ? e.message : "خطای ناشناخته" });
      throw e;
    }
  }
  return fail("عملیات نامعتبر است.", 400);
}, { admin: true });
