#!/usr/bin/env node

/**
 * کرون خارجی نرخ درهم (اختیاری).
 *
 * در حالت عادی لازم نیست: سرور خودش (instrumentation.ts) نرخ را هر RATE_INTERVAL_SECONDS ثانیه
 * تازه می‌کند و هر بازدید هم در صورت قدیمی‌بودن آن را در پس‌زمینه تازه می‌کند.
 * این اسکریپت فقط برای میزبان‌هایی است که پردازش پس‌زمینه‌ی دائمی ندارند (مثل serverless).
 *
 *   CRON_SECRET=... RATE_SERVICE_URL=https://سایت-شما node scripts/exchange-rate-worker.js [--once]
 */
for (const file of [".env.local", ".env"]) {
  try { process.loadEnvFile(file); } catch { /* فایل وجود ندارد */ }
}

const BASE = (process.env.RATE_SERVICE_URL || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
const SECRET = (process.env.CRON_SECRET || "").trim();
const sec = Number(process.env.RATE_INTERVAL_SECONDS);
const INTERVAL_MS = Math.min(3600, Math.max(10, Number.isFinite(sec) && sec > 0 ? sec : 30)) * 1000;
const ONCE = process.argv.includes("--once");

if (SECRET.length < 16) {
  console.error("✗ CRON_SECRET (حداقل ۱۶ کاراکتر) را در محیط سرور و همین‌جا تنظیم کنید؛ بدون آن سرور درخواست را رد می‌کند.");
  process.exit(1);
}

async function tick() {
  const at = new Date().toISOString();
  try {
    const res = await fetch(`${BASE}/api/exchange-rate/update`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${SECRET}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.success) console.log(`[${at}] ${body.data?.updated ? "✓ به‌روز شد" : "= بدون تغییر"}: ${body.data?.rate} تومان/درهم (${(body.data?.sources || []).join(", ")})`);
    else console.error(`[${at}] ✗ HTTP ${res.status}: ${body.error || "نامشخص"}`);
  } catch (e) {
    console.error(`[${at}] ✗ ${e.message}`);
  }
}

await tick();
if (!ONCE) setInterval(tick, INTERVAL_MS);
