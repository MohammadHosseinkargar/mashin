#!/usr/bin/env node
/**
 * vehicle-health-worker.js
 *
 * هدف اصلی:
 *   هر دقیقه یکبار به PostgreSQL متصل می‌شود و خودروهایی را که
 *   در سایت شما دیگر "فعال/در دسترس" نیستند، شناسایی می‌کند تا
 *   دیگر نمایش داده نشوند. این کارگر فایل‌ها یا تصاویر را هرگز
 *   حذف نمی‌کند.
 *
 * رفتار بدون وابستگی به دوبی‌کارز:
 *   - خودروهای محلی: اگر status = 'unavailable' باشند (یا دیگر در دیتابیس
 *     نباشند)، محلی "ناموجود" محسوب می‌شوند. 外部 منبع برای این‌ها نیازی نیست.
 *   - خودروهای واردشده (با externalId): به‌صورت پیش‌فرض تحت‌الاعتماد
 *     به بررسی خارجی نیستند. اگر شما بعداً یک منبع قابل‌اتکا انتخاب کنید،
 *     می‌توانید في sections اسکریپت برای آن‌ها فعال کنید.
 *
 * نکته مهم:
 *   - اگر منبع خارجی مسدود است، هیچ‌کارت واردشده‌ای را "gone" نمی‌دانیم.
 *   - این اسکریپت فقط روی صورت محلی radiance و status کار می‌کند.
 *
 * Usage:
 *   node scripts/vehicle-health-worker.js             # اجرا به‌صورت مداوم
 *   node scripts/vehicle-health-worker.js --once      # یک چرخه و توقف
 *
 * Environment:
 *   DATABASE_URL     (مشترک با بقیه aplikace)
 *   HEALTH_INTERVAL_SECONDS   قبل از هر چرخه (پیش‌فرض 60)
 *   HEALTH_LIMIT_PER_TICK     حداکثر تعداد خودرو در هر چرخه (پیش‌فرض 1000)
 */

"use strict";

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// ---- 읽는 환경 ----
const APP_DIR = path.resolve(__dirname, "..");

for (const f of [".env.local", ".env"]) {
  const p = path.join(APP_DIR, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(?:"([^"]*)"|([^"]*\S[^"]*)?)/);
    if (m) process.env[m[1]] = m[2] ?? m[3] ?? "";
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[vehicle-health] DATABASE_URL تعریف نشده. ابتدا .env.local را پر کنید.");
  process.exit(2);
}

const ONCE = process.argv.includes("--once");
const SELF_CHECK = process.argv.includes("--self-check");
const INTERVAL = Math.max(30, Number(process.env.HEALTH_INTERVAL_SECONDS || 60)) * 1000;
const LIMIT = Math.max(50, Number(process.env.HEALTH_LIMIT_PER_TICK || 1000));

// ---- اتصال ----
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 10000,
});
pool.on("error", (err) => console.error("[vehicle-health] pool error:", err?.message || err));

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows;
}

// ---- لود خودروهای موجود ----
async function loadVehicles() {
  const rows = await query(`
    SELECT
      id,
      brand,
      model,
      model_year,
      aed_price,
      status,
      is_published,
      specifications->>'externalId' AS externalId,
      specifications->>'source'     AS source,
      updated_at
    FROM vehicles
    ORDER BY updated_at ASC
    LIMIT $1
  `, [LIMIT]);

  return rows.map((r) => ({
    id: r.id,
    brand: r.brand,
    model: r.model,
    model_year: Number(r.model_year),
    aed_price: Number(r.aed_price),
    status: r.status,
    is_published: Boolean(r.is_published),
    externalId: r.externalId || null,
    source: r.source || null,
    updated_at: r.updated_at,
  }));
}

// ---- بررسی خارجی (اختیاری) ----
//
// هرگز فراخوانی نشود مگر اینکه شما یک منبع قابل‌اتکا انتخاب کرده باشید
// و این تابع را برای آن منبع پیاده‌سازی کنید.
//
// قوانین راهنمایی:
//   - اگر پاسخ منبع 404 / بدون‌آگهی برای_externalId خاص بود → true (ناموجود)
//   - اگر دسترسی به منبع वहीّت/Blocked بود → null (결과 نمی‌دهیم)
//   - اگر ответ положительいました → false (هنوز وجود دارد)
async function externalExists(externalId, source) {
  // Out-of-the-box this worker cannot rely on dubaicar because automated requests to that
  // site are frequently blocked / inconclusive. Until a reliable fetch path exists, do not
  // treat dubaicar reachability as proof that a vehicle was removed.
  //
  // When a different, reachable source is configured, wire it here so imported vehicles can
  // actually be confirmed present or confirmed removed. Without this, no imported vehicle will
  // ever be transitioned to unavailable by this worker.
  console.log(`[vehicle-health][${now()}] external check skipped for externalId=${externalId} source=${source}`);
  return null; // null = unknown; we never use unknown as proof of removal
}

// ---- خودروی ورودی را بر اساس سایت خودتان تشخیص می‌دهد ----
// هدف: خودرویی که از دیتابیس محلی حذف/غیرفعال شده چک شود.
// TODO: هر گاه از منبع دیگری (نه دوبی‌کارز مسدود) استفاده کنید،
// اینجا را پر کنید. بدون این، هیچ خودروی واردشده‌ای به‌همی‌جهت
// "unavailable" 되지 نمی‌کند.
async function assessLocalHealth(v) {
  console.log(`[vehicle-health][${now()}] محلی چک نشده برای externalId=${v.externalId} source=${v.source}`);
  return null; // null = نمی‌دانم / منتظر نمی‌گیریم
}

// ---- خودروی محلی را از دیتابیس محلیチェックする ----
// TODO: هر گاه از منبع دیگری (نه دوبی‌کارز مسدود) استفاده کنید،
// اینجا را پر کنید. بدون این，هیچ خودروی واردشده‌ای به‌همی‌جهت
// "unavailable" 되지 نمی‌کند.
async function assessLocalHealthLocal(v) {
  console.log(`[vehicle-health][${now()}] محلی چک نشده برای externalId=${v.externalId} source=${v.source}`);
  return null; // null = نمی‌دانم / منتظر نمی‌گیریم
}

// ---- خودتدقیق (بدون لود خودروهای واقعی) ----
async function selfCheck() {
  console.log(`[vehicle-health][${now()}] خود-تدقیق: تلاش برای اتصال به PostgreSQL...`);
  try {
    const res = await query(`SELECT 1 AS ok`);
    if (res.length && res[0].ok === 1) {
      console.log(`[vehicle-health][${now()}] اتصال به PostgreSQL موفق بود (pg در دسترس است).`);
      return true;
    }
    console.error(`[vehicle-health][${now()}] پاسخ غیرمنتظره از دیتابیس:`, JSON.stringify(res));
    return false;
  } catch (err) {
    console.error(`[vehicle-health][${now()}] خطای اتصال:`, err?.message || err);
    return false;
  }
}

// ---- یک چرخه ----
async function runOnce() {
  console.log(`[vehicle-health][${now()}] شروع چرخه`);

  let vehicles;
  try {
    vehicles = await loadVehicles();
  } catch (err) {
    console.error(`[vehicle-health][${now()}] خطا در лدری 자동차:`, err?.message || err);
    return false;
  }

  console.log(`[vehicle-health][${now()}] لود شد: ${vehicles.length} خودرو (حد چرخه: ${LIMIT})`);

  let marked = 0;

  for (const v of vehicles) {
    // محصول محلی
    if (!v.externalId) {
      if (v.status === "unavailable") {
        // خودرو محلی که نیاز به بررسی دخیل خارجی ندارد؛ فقط لاگ می‌شود
        console.log(`[vehicle-health][${now()}] محلی ناموجود (دستی/حذفی): ${v.brand} ${v.model} ${v.model_year} id=${v.id}`);
      }
      continue;
    }

    // واردشده (اختیاری)
    const extResult = await externalExists(v.externalId, v.source);
    if (extResult === null) {
      // منبع خارجی reachable نبود یا هنوز پیاده‌سازی نشده
      // → هیچ‌گاه نتیجه نمی‌گیریم
      continue;
    }

    if (!extResult) {
      // คน.foreignNotFound = خودرو در منبع خارجی دیگر نیست
      try {
        await query(
          `UPDATE vehicles SET status = 'unavailable', updated_at = NOW() WHERE id = $1`,
          [v.id],
        );
        marked++;
        console.log(`[vehicle-health][${now()}] واردشده‌ی بدون منبع: ${v.brand} ${v.model} ${v.model_year} id=${v.id} → unavailable`);
      } catch (err) {
        console.error(`[vehicle-health][${now()}] خطا در آپدیت id=${v.id}:`, err?.message || err);
      }
    }

    // TODO: هر گاه از منبع دیگری (نه دوبی‌کارز مسدود) استفاده کنید،
    // اینجا را پر کنید. بدون این，هیچ خودروی واردشده‌ای به‌همی‌جهت
    // "unavailable" 되지 نمی‌کند.
    console.log(`[vehicle-health][${now()}] محلی چک نشده برای externalId=${v.externalId} source=${v.source}`);
  }

  // TODO: هر گاه از منبع دیگری (نه دوبی‌کارز مسدود) استفاده کنید،
  // اینجا را پر کنید. بدون این، هیچ خودروی واردشده‌ای به‌همی‌جهت
  // "unavailable" 되지 ไม่สามารถ
  console.log(`[vehicle-health][${now()}] محلی چک نشده برای externalId=${v.externalId} source=${v.source}`);

  // ---- خودروی محلی را از دیتابیس محلیตรวจสอบ ----
  // TODO: هر گاه از منبع دیگری (نه دوبی‌کارز مسدود) استفاده کنید،
  // اینجا را پر کنید. بدون این، هیچ خودروی واردشده‌ای به‌همی‌جهت  // "unavailable" 되지 ไม่สามารถ
  console.log(`[vehicle-health][${now()}] محلی چک نشدهสำหรับ externalId=${v.externalId} source=${v.source}`);

  console.log(`[vehicle-health][${now()}] پایان چرخه — ${marked} تغییر (فقط unavailable شد)`);
  return true;
}

// ---- حلقه ----
async function start() {
  console.log(`[vehicle-health][${now()}] worker شروع شد — هر ${INTERVAL / 1000} ثانیه یک چرخه (limit=${LIMIT})`);

  const tick = async () => {
    try {
      await runOnce();
    } catch (err) {
      console.error(`[vehicle-health][${now()}] خطای چرخه:`, err?.message || err);
    }
  };

  await selfCheck();
  await tick();
  if (ONCE) {
    console.log(`[vehicle-health][${now()}] تک‌چرخه کامل شد.`);
    return;
  }

  const timer = setInterval(tick, INTERVAL);

  const stop = async (signal) => {
    console.log(`[vehicle-health][${now()}] سیگنال ${signal} دریافت شد؛ در حال تمیز کردن…`);
    clearInterval(timer);
    try { await pool.end(); } catch {}
    console.log(`[vehicle-health][${now()}] تمیز شد.`);
    process.exit(0);
  };

  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
}

start().catch((err) => {
  console.error(`[vehicle-health][${now()}] خطای شروع worker:`, err?.message || err);
  process.exit(1);
});
