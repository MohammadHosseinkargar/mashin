import "server-only";
import { db } from "./db";
import { rateIntervalMs, refreshRate } from "./rate-service";
import { runSync } from "./importer";

const g = globalThis as unknown as { __jobsStarted?: boolean };
const num = (name: string, fallback: number, min: number, max: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.min(max, Math.max(min, v)) : fallback;
};
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** حلقه‌ی خودتنظیم: بعد از تمام شدن هر اجرا، فاصله‌ی بعدی را خودِ تابع تعیین می‌کند (هیچ‌وقت دو اجرای هم‌زمان نداریم). */
function loop(name: string, firstDelayMs: number, step: () => Promise<number>) {
  const tick = async () => {
    let next = 60_000;
    try { next = await step(); } catch (e) { console.error(`[jobs:${name}]`, msg(e)); }
    setTimeout(tick, next).unref();
  };
  setTimeout(tick, firstDelayMs).unref();
}

function startRateLoop() {
  let failures = 0;
  loop("rate", 3_000, async () => {
    const r = await refreshRate();
    if (!r.ok) {
      failures++;
      if (failures === 1 || failures % 20 === 0) console.warn(`[jobs:rate] دریافت نرخ ناموفق (${failures} بار پیاپی): ${r.reason}`);
    } else {
      if (failures > 0) console.log("[jobs:rate] دریافت نرخ دوباره برقرار شد.");
      failures = 0;
      if (r.updated) console.log(`[jobs:rate] نرخ درهم: ${r.rate} تومان (${r.sources?.join(", ")})`);
    }
    return rateIntervalMs() + Math.floor(Math.random() * 2_000);
  });
}

/**
 * همگام‌سازی سمت سرور (اختیاری، با AUTO_SYNC=true): lane سریع برای آگهی‌های تازه + چرخه‌ی کامل پیوسته.
 * اگر Dubicars مسدود کرد، به‌جای تکرار بی‌فایده، با backoff نمایی (۱ تا ۳۰ دقیقه) صبر می‌کند.
 */
function startSyncLoop() {
  const fastEveryMs = num("DUBICARS_FAST_EVERY_MINUTES", 5, 1, 120) * 60_000;
  const restMs = num("DUBICARS_CYCLE_REST_MINUTES", 30, 1, 1440) * 60_000;
  let nextFast = 0;
  let cycleResumeAt = 0;
  let blockedUntil = 0;
  let blockStep = 0;

  const onBlocked = () => {
    blockStep = Math.min(blockStep + 1, 5);
    blockedUntil = Date.now() + 60_000 * 2 ** (blockStep - 1);
    console.warn(`[jobs:sync] Dubicars مسدود کرد؛ ${Math.round((blockedUntil - Date.now()) / 60_000)} دقیقه صبر می‌کنیم. (برای دور زدن پایدار: collector خارجی)`);
  };

  loop("sync", 20_000, async () => {
    const settings = await db.getImportSettings();
    if (!settings.enabled) return 60_000;
    const now = Date.now();
    if (now < blockedUntil) return Math.min(60_000, blockedUntil - now);

    if (now >= nextFast) {
      nextFast = now + fastEveryMs;
      try {
        const r = await runSync({ lane: "fast" });
        if (r.blocked) { onBlocked(); return 30_000; }
        if (r.created || r.updated) console.log(`[jobs:sync] lane سریع: ${r.created} جدید، ${r.updated} به‌روزرسانی`);
      } catch (e) { console.error("[jobs:sync] lane سریع:", msg(e)); }
    }
    if (now < cycleResumeAt) return 15_000;

    try {
      const r = await runSync({ lane: "cycle", budgetMs: 120_000 });
      if (r.blocked) { onBlocked(); return 30_000; }
      blockStep = 0;
      if (r.created || r.updated) console.log(`[jobs:sync] چرخه: ${r.created} جدید، ${r.updated} به‌روزرسانی (صفحه ${r.cursorPage}/${r.totalPages || "?"})`);
      if (r.done) { cycleResumeAt = Date.now() + restMs; console.log(`[jobs:sync] چرخه‌ی کامل شد؛ ${Math.round(restMs / 60_000)} دقیقه استراحت.`); }
    } catch (e) { console.error("[jobs:sync] چرخه:", msg(e)); return 60_000; }
    return 10_000;
  });
}

export function startBackgroundJobs() {
  if (g.__jobsStarted) return;
  g.__jobsStarted = true;
  startRateLoop();
  console.log(`[jobs] به‌روزرسانی نرخ درهم هر ${Math.round(rateIntervalMs() / 1000)} ثانیه فعال شد.`);
  if (process.env.AUTO_SYNC?.trim().toLowerCase() === "true") {
    startSyncLoop();
    console.log("[jobs] همگام‌سازی خودکار آگهی‌ها (سمت سرور) فعال شد.");
  }
}
