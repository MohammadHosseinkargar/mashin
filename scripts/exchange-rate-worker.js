#!/usr/bin/env node

/** เอ็นซ์ Exchange Rate Updater Worker
 *
 * Fetches AED/IRR exchange rate every 5 minutes
 * وي brings the latest real-time market rate from multiple live sources.
 *
 * Usage:
 *   npm run exchange-rate:worker   # Continuous: fetches rate every 5 min
 *   npm run exchange-rate:update   # One-shot fetch (no timer)
 *
 * متغیرهای محیطی:
 *   RATE_SERVICE_URL  آدرس सर्वर (پیش‌فرض http://localhost:3000)
 */

// First load env files so RATE_SERVICE_URL is available
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {}
}

const BASE = (process.env.RATE_SERVICE_URL || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function tick() {
  const timestamp = new Date().toISOString();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    let res;
    try {
      res = await fetch(`${BASE}/api/exchange-rate/update`, {
        method: "GET",
        headers: { "Accept": "application/json", "User-Agent": "ExchangeRateWorker/1.0" },
        cache: "no-store",
        signal: controller.signal,
      });
    } finally { clearTimeout(timer); }
    const text = await res.text();
    console.log(`[${timestamp}] Response: HTTP ${res.status}, body: ${text.slice(0,200)}`);
    const data = JSON.parse(text);
    const rate = data.data?.rate ?? data.rate;
    if (data.success && rate && rate >= 7_000 && rate <= 500_000) {
      console.log(`[${timestamp}] ✓ Exchange rate updated: ${rate} Toman/AED (${(rate * 10).toFixed(0)} Rials) — live market rate (${(rate/10/1000).toFixed(2)}/AED market, checked 7k–500k bounds)`);
    } else {
      console.error(`[${timestamp}] ✗ Failed to update rate: ${data.error || `unknown (rate=${rate} out of 7k–500k bounds)`}`);
    }
  } catch (error) {
    console.error(
      `[${timestamp}] ✗ Worker error:`,
      error instanceof Error ? error.message : error
    );
  }
}

// Run immediately on start
console.log(`[${new Date().toISOString()}] Exchange Rate Worker started (interval: ${INTERVAL_MS / 1000}s)`);
tick();

// Then run every 5 minutes
setInterval(tick, INTERVAL_MS);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log(`\n[${new Date().toISOString()}] Shutting down gracefully...`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(`\n[${new Date().toISOString()}] Shutting down gracefully...`);
  process.exit(0);
});
