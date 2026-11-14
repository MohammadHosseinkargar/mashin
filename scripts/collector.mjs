#!/usr/bin/env node

/**
 * Collector: آگهی‌ها را از «یک جای تمیز» می‌گیرد و به سایت می‌فرستد (روش push).
 *
 * چرا؟ محدودیت‌هایی که در همگام‌سازی سمت سرور می‌بینید عمدتاً از IP سرور و مرورگر نبودن می‌آید
 * (Cloudflare). این اسکریپت می‌تواند روی هر دستگاهی (کامپیوتر خودتان، یک VPS دیگر) و با مرورگر واقعی
 * اجرا شود؛ سرور سایت فقط HTML صفحه را می‌گیرد، تحلیل می‌کند و آگهی‌ها را ذخیره می‌کند.
 *
 * دو مسیر هم‌زمان:
 *   • fast  : هر چند دقیقه فقط چند صفحه‌ی اول (آگهی‌های تازه) — خیلی سبک
 *   • cycle : چرخه‌ی کامل و پیوسته با cursor مشترک با سایت، بعد از اتمام کمی استراحت و دوباره از اول
 * هنگام مسدودسازی، به‌جای تکرار بی‌فایده با backoff نمایی (تا ۳۰ دقیقه) صبر می‌کند.
 *
 * اجرا:
 *   INGEST_URL=https://سایت-شما  INGEST_TOKEN=... node scripts/collector.mjs
 *   node scripts/collector.mjs --once     # تا پایان یک چرخه و خروج
 *
 * متغیرها:
 *   INGEST_URL / SITE_URL          آدرس سایت (پیش‌فرض http://localhost:3000)
 *   INGEST_TOKEN                   همان INGEST_TOKEN سرور (حداقل ۱۶ کاراکتر)
 *   COLLECT_MODE                   browser (پیش‌فرض؛ نیازمند playwright-core) | fetch (HTTP ساده)
 *   COLLECT_HEADLESS               true برای اجرا بدون پنجره (پیش‌فرض false؛ هنگام چالش می‌توانید دستی تأیید کنید)
 *   COLLECT_PROFILE_DIR            پوشه‌ی پروفایل مرورگر برای ماندن کوکی‌ها (پیش‌فرض .collector-profile)
 *   CHROME_PATH / CHROME_CHANNEL   مرورگر سیستم (مثلاً CHROME_CHANNEL=chrome)
 *   COLLECT_PAGE_DELAY_MS          مکث بین صفحه‌ها (پیش‌فرض ۳۵۰۰، با تصادفی‌سازی)
 *   COLLECT_FAST_EVERY_MIN         فاصله‌ی lane سریع (پیش‌فرض ۳)
 *   COLLECT_FAST_PAGES             تعداد صفحه‌ی lane سریع (پیش‌فرض ۲)
 *   COLLECT_CYCLE_REST_MIN         استراحت بعد از هر چرخه‌ی کامل (پیش‌فرض ۲۰)
 *
 * توجه: دریافت خودکار از یک وب‌سایت ممکن است با شرایط استفاده‌ی آن در تضاد باشد. راه پایدار و کاملاً
 * بدون محدودیت، دریافت فید/API رسمی از خودِ منبع است؛ این اسکریپت همان فید را هم می‌تواند به /api/ingest بدهد.
 */

for (const file of [".env.local", ".env"]) {
  try { process.loadEnvFile(file); } catch { /* فایل وجود ندارد */ }
}

const SERVER = (process.env.INGEST_URL || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
const TOKEN = (process.env.INGEST_TOKEN || "").trim();
const MODE = (process.env.COLLECT_MODE || "browser").toLowerCase();
const ONCE = process.argv.includes("--once");
const int = (name, d, min = 0) => { const v = Number(process.env[name]); return Number.isFinite(v) && v >= min ? v : d; };
const PAGE_DELAY = int("COLLECT_PAGE_DELAY_MS", 3500);
const FAST_EVERY = int("COLLECT_FAST_EVERY_MIN", 3, 1) * 60_000;
const FAST_PAGES = Math.min(10, Math.max(1, int("COLLECT_FAST_PAGES", 2, 1)));
const CYCLE_REST = int("COLLECT_CYCLE_REST_MIN", 20, 1) * 60_000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const stamp = () => new Date().toISOString().replace("T", " ").slice(0, 19);
const log = (...a) => console.log(`[${stamp()}]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pace = () => sleep(PAGE_DELAY * (0.8 + Math.random() * 0.6));
function die(msg) { console.error(`✗ ${msg}`); process.exit(1); }

class Blocked extends Error {}
class Fatal extends Error {}
const CHALLENGE = /just a moment|cf-chl|challenge-platform|attention required|cf-browser-verification/i;

/* ---------------------------------------------------------------- سرور سایت */
async function server(path, init = {}) {
  const res = await fetch(`${SERVER}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}`, ...(init.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch { /* بدون JSON */ }
  if (res.status === 401) throw new Fatal("توکن رد شد؛ INGEST_TOKEN با مقدار سرور یکی نیست.");
  return { status: res.status, body };
}

async function getStatus() {
  const { status, body } = await server("/api/ingest");
  if (status !== 200 || !body?.success) throw new Error(`وضعیت سایت خوانده نشد (HTTP ${status})`);
  return body.data;
}

async function push(html, page, lane) {
  const { status, body } = await server("/api/ingest", { method: "POST", body: JSON.stringify({ kind: "dubicars-page", html, page, lane }) });
  if (status === 409) throw new Error("همگام‌سازی در پنل ادمین غیرفعال است.");
  if (status === 422) throw new Blocked(body?.error || "HTML پذیرفته نشد");
  if (status !== 200 || !body?.success) throw new Error(`ارسال به سایت ناموفق (HTTP ${status}) ${body?.error || ""}`);
  return body.data;
}

/* ------------------------------------------------------------ گرفتن HTML */
async function makeFetcher() {
  if (MODE === "fetch") {
    return {
      async get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" }, redirect: "follow" });
        const text = await res.text();
        if ([403, 429, 503].includes(res.status) || (res.ok === false) || CHALLENGE.test(text.slice(0, 4000))) throw new Blocked(`HTTP ${res.status}`);
        return text;
      },
      async close() {},
    };
  }

  let chromium = null;
  for (const m of ["playwright", "playwright-core"]) {
    try { ({ chromium } = await import(m)); break; } catch { /* بعدی */ }
  }
  if (!chromium) die("برای COLLECT_MODE=browser باید بسته‌ی playwright-core نصب باشد:  npm i playwright-core  (و یک مرورگر: CHROME_CHANNEL=chrome یا npx playwright install chromium)  — یا COLLECT_MODE=fetch.");

  const context = await chromium.launchPersistentContext(process.env.COLLECT_PROFILE_DIR || ".collector-profile", {
    headless: process.env.COLLECT_HEADLESS === "true",
    channel: process.env.CHROME_CHANNEL || undefined,
    executablePath: process.env.CHROME_PATH || undefined,
    viewport: { width: 1366, height: 850 },
    locale: "en-US",
  });
  const page = context.pages()[0] || (await context.newPage());
  let origin = "";

  async function warm(url) {
    origin = new URL(url).origin;
    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => {});
    // اگر چالش امنیتی آمد، تا ۹۰ ثانیه صبر می‌کنیم (در حالت headful می‌توانید دستی تأیید کنید)
    for (let i = 0; i < 45; i++) {
      const title = await page.title().catch(() => "");
      if (!CHALLENGE.test(title)) return;
      if (i === 0) log("چالش امنیتی دیده شد؛ منتظر تأیید (در پنجره‌ی مرورگر) …");
      await sleep(2000);
    }
    throw new Blocked("چالش امنیتی تأیید نشد");
  }

  return {
    async get(url) {
      if (new URL(url).origin !== origin) await warm(url);
      // fetch داخل خودِ مرورگر: TLS، کوکی و هدرهای واقعی مرورگر؛ و متن خام HTML (دقیقاً همان که پارسر انتظار دارد)
      const r = await page.evaluate(async (u) => {
        const res = await fetch(u, { credentials: "include", headers: { Accept: "text/html" } });
        return { status: res.status, text: await res.text() };
      }, url);
      if ([403, 429, 503].includes(r.status) || CHALLENGE.test(r.text.slice(0, 4000))) {
        await warm(url).catch(() => {});
        throw new Blocked(`HTTP ${r.status}`);
      }
      return r.text;
    },
    async close() { await context.close().catch(() => {}); },
  };
}

/* ------------------------------------------------------------------ حلقه */
async function main() {
  if (TOKEN.length < 16) die("INGEST_TOKEN (حداقل ۱۶ کاراکتر) را تنظیم کنید؛ همان مقدار را در محیط سرور سایت هم بگذارید.");
  log(`Collector → ${SERVER} (${MODE}${ONCE ? "، یک چرخه" : ""})`);
  const fetcher = await makeFetcher();
  const stop = async () => { log("خروج…"); await fetcher.close(); process.exit(0); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  let status = await getStatus();
  let nextFastAt = 0, cycleResumeAt = 0, blockedUntil = 0, blockStep = 0;

  const step = async (page, lane) => {
    const u = new URL(status.searchUrl);
    if (page > 1) u.searchParams.set("page", String(page));
    const html = await fetcher.get(u.toString());
    const r = await push(html, page, lane);
    log(`${lane === "fast" ? "سریع" : "چرخه"} صفحه ${page}: ${r.accepted} آگهی (${r.created} جدید، ${r.updated} به‌روز، ${r.unchanged} بدون تغییر)${r.done ? " ✓ چرخه کامل" : ""}`);
    return r;
  };

  for (;;) {
    const now = Date.now();
    if (now < blockedUntil) { await sleep(Math.min(30_000, blockedUntil - now)); continue; }
    try {
      status = await getStatus();
      if (!status.enabled) { log("همگام‌سازی در پنل ادمین غیرفعال است؛ ۶۰ ثانیه دیگر دوباره بررسی می‌شود."); await sleep(60_000); continue; }

      if (now >= nextFastAt) {
        nextFastAt = now + FAST_EVERY;
        for (let p = 1; p <= FAST_PAGES; p++) { await step(p, "fast"); await pace(); }
      }
      if (Date.now() < cycleResumeAt) { await sleep(Math.min(15_000, cycleResumeAt - Date.now())); continue; }

      const r = await step(status.cursorPage || 1, "cycle");
      blockStep = 0;
      if (r.done) {
        if (ONCE) { log("✓ چرخه‌ی کامل تمام شد."); await fetcher.close(); return; }
        cycleResumeAt = Date.now() + CYCLE_REST;
        log(`چرخه‌ی کامل تمام شد؛ ${Math.round(CYCLE_REST / 60_000)} دقیقه استراحت (lane سریع ادامه دارد).`);
      }
      await pace();
    } catch (e) {
      if (e instanceof Fatal) { await fetcher.close(); die(e.message); }
      if (e instanceof Blocked) {
        blockStep = Math.min(blockStep + 1, 5);
        const wait = 60_000 * 2 ** (blockStep - 1);
        blockedUntil = Date.now() + wait;
        log(`⚠ مسدود/چالش (${e.message}) — ${Math.round(wait / 60_000)} دقیقه صبر می‌کنیم.`);
      } else {
        log(`خطا: ${e.message} — ۳۰ ثانیه دیگر تلاش می‌کنیم.`);
        await sleep(30_000);
      }
    }
  }
}

main().catch((e) => die(e.message));
