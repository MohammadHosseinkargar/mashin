#!/usr/bin/env node

/**
 * همگام‌سازی خودکار آگهی‌های Dubicars با کاتالوگ سایت.
 *
 * هر اجرا «یک دسته» از صفحه‌های جست‌وجو را می‌گیرد و cursor را جلو می‌برد؛
 * به‌این‌ترتیب کل ۲۱هزار+ آگهی در چند اجرا وارد می‌شود و هر اجرا بخشی را تازه می‌کند.
 *
 * این اسکریپت از همان API پنل ادمین استفاده می‌کند (دقیقاً مثل دکمه‌ی «شروع همگام‌سازی»)،
 * برای همین سرور Next.js باید در حال اجرا باشد.
 *
 * Usage:
 *   npm run listings:sync     # چرخه‌ی کامل: دسته‌ها را پشت‌سرهم می‌زند تا همه‌ی صفحه‌ها تمام شود
 *   npm run listings:worker   # اجرای مداوم: هر SYNC_INTERVAL_MINUTES دقیقه یک دسته
 *
 * متغیرهای محیطی (از .env.local خوانده می‌شوند):
 *   SITE_URL / NEXT_PUBLIC_SITE_URL  آدرس سرور (پیش‌فرض http://localhost:3000)
 *   ADMIN_USERNAME / ADMIN_PASSWORD  اطلاعات ورود پنل ادمین
 *   SYNC_INTERVAL_MINUTES            فاصله‌ی اجرا در حالت worker (پیش‌فرض ۱۰)
 *   DUBICARS_TIME_BUDGET_MS          بودجه‌ی زمانی هر دسته (پیش‌فرض ۱۵۰۰۰۰، حداکثر ۱۸۰۰۰۰)
 *   SYNC_MAX_BATCHES                 سقف دسته‌ها در حالت --once (پیش‌فرض ۵۰۰)
 */

// اول فایل‌های محیطی پروژه را بخوان تا SITE_URL و اطلاعات ورود در دسترس باشند.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    /* فایل وجود ندارد */
  }
}

const BASE = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
const INTERVAL_MINUTES = Math.max(1, Number(process.env.SYNC_INTERVAL_MINUTES) || 10);
// بودجه باید زیر مهلت ~۵ دقیقه‌ی HTTP بماند تا اتصال worker قطع نشود
const BUDGET_MS = Math.min(180_000, Math.max(10_000, Number(process.env.DUBICARS_TIME_BUDGET_MS) || 150_000));
const ONCE = process.argv.includes("--once");
const MAX_ONCE_BATCHES = Math.max(1, Number(process.env.SYNC_MAX_BATCHES) || 500);

let cookie = "";
const stamp = () => new Date().toISOString();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(pathname, options = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* پاسخ بدون بدنه‌ی JSON */
  }
  return { res, body };
}

async function login() {
  const { res, body } = await request("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({
      username: process.env.ADMIN_USERNAME || "admin",
      password: process.env.ADMIN_PASSWORD || "",
    }),
  });
  if (!res.ok || !body?.success) {
    throw new Error(
      `ورود به پنل ادمین ناموفق بود (HTTP ${res.status})${body?.error ? ` — ${body.error}` : ""}; ADMIN_USERNAME و ADMIN_PASSWORD را تنظیم کنید.`
    );
  }
  const match = /admin_session=[^;]+/.exec(res.headers.get("set-cookie") || "");
  if (!match) throw new Error("کوکی نشست دریافت نشد.");
  cookie = match[0];
}

async function sync(retried = false) {
  const { res, body } = await request("/api/admin/imports", {
    method: "POST",
    headers: { Cookie: cookie },
    body: JSON.stringify({ action: "sync", budgetMs: BUDGET_MS }),
  });
  if (res.status === 401 && !retried) {
    cookie = "";
    await login();
    return sync(true);
  }
  if (!res.ok || !body?.success) {
    throw new Error(`همگام‌سازی انجام نشد (HTTP ${res.status})${body?.error ? ` — ${body.error}` : ""}`);
  }
  return body.data.result;
}

/** خلاصه‌ی خوانای یک دسته برای لاگ */
function fmt(r) {
  const parts = [`${r.total} آگهی`, `${r.pages} صفحه`];
  if (r.created) parts.push(`${r.created} جدید`);
  if (r.updated) parts.push(`${r.updated} به‌روزرسانی`);
  if (r.unchanged) parts.push(`${r.unchanged} بدون تغییر`);
  if (r.images) parts.push(`${r.images} تصویر تازه`);
  let line = `${parts.join("، ")} — cursor صفحهٔ ${r.cursorPage}${r.totalPages ? ` از ${r.totalPages}` : ""} (کل ${r.totalResults || "?"} نتیجه)`;
  if (r.done) line += " ✓ چرخه کامل";
  if (r.blocked) line += " ⚠ مسدود شد؛ دسته‌ی بعد ادامه می‌دهد";
  else if (r.budgetHit) line += " (بودجه تمام شد)";
  return line;
}

async function main() {
  console.log(`[${stamp()}] Dubicars sync → ${BASE} — بودجه هر دسته ${Math.round(BUDGET_MS / 1000)} ثانیه`);

  if (ONCE) {
    // حالت تک‌بار: تا پایان چرخه‌ی همه‌ی صفحه‌ها ادامه بده
    for (let batch = 1; batch <= MAX_ONCE_BATCHES; batch++) {
      if (!cookie) await login();
      const r = await sync();
      console.log(`[${stamp()}] دسته ${batch}: ${fmt(r)}`);
      if (r.done) {
        console.log(`[${stamp()}] ✓ چرخه‌ی کامل تمام صفحه‌ها تمام شد.`);
        return;
      }
      if (r.blocked) {
        console.error(`[${stamp()}] ✗ مسدود شد؛ بعداً دوباره اجرا کنید (cursor حفظ شده است).`);
        process.exitCode = 1;
        return;
      }
      await sleep(15_000);
    }
    console.error(`[${stamp()}] ✗ به سقف ${MAX_ONCE_BATCHES} دسته رسید؛ بعداً دوباره اجرا کنید.`);
    process.exitCode = 1;
    return;
  }

  console.log(`[${stamp()}] هر ${INTERVAL_MINUTES} دقیقه یک دسته (بدون هم‌پوشانی)`);
  let stopping = false;
  let blockedStreak = 0;

  const stop = () => {
    stopping = true;
    console.log(`[${stamp()}] Dubicars sync worker متوقف شد.`);
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  // حلقه‌ی تسلسلی: هیچ‌وقت دو اجرا هم‌زمان نمی‌شوند
  while (!stopping) {
    let r = null;
    try {
      if (!cookie) await login();
      r = await sync();
      console.log(`[${stamp()}] ✓ ${fmt(r)}`);
    } catch (error) {
      console.error(`[${stamp()}] ✗ ${error instanceof Error ? error.message : error}`);
    }
    // پشتیبان تناوبی: هنگام مسدودسازی Cloudflare انتظار بیشتر می‌شود تا جریمه تمام شود
    if (r?.blocked) blockedStreak += 1;
    else if (r) blockedStreak = 0;
    const waitMin = blockedStreak === 0 ? INTERVAL_MINUTES : Math.min(30, INTERVAL_MINUTES * (1 + blockedStreak));
    if (blockedStreak > 0) {
      console.log(`[${stamp()}] مسدودسازی متوالی ${blockedStreak}؛ انتظار ${waitMin} دقیقه تا پایان جریمه…`);
    }
    await sleep(waitMin * 60_000);
  }
}

main().catch((error) => {
  console.error(`[${stamp()}] ✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});