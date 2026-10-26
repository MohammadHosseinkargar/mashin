#!/usr/bin/env node

/**
 * Exchange Rate Updater Worker
 *
 * Fetches AED/IRR exchange rate every 5 minutes
 *
 * Usage:
 * - Direct: node scripts/exchange-rate-worker.js
 * - With npm: npm run exchange-rate:worker
 * - With PM2: pm2 start scripts/exchange-rate-worker.js --name exchange-rate
 */

import { updateExchangeRate } from "../src/lib/exchange-rate-updater.js";

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function tick() {
  const timestamp = new Date().toISOString();
  try {
    const result = await updateExchangeRate();
    if (result.success) {
      console.log(`[${timestamp}] ✓ Exchange rate updated: ${result.rate} IRR/AED`);
    } else {
      console.error(`[${timestamp}] ✗ Failed to update rate: ${result.error}`);
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
