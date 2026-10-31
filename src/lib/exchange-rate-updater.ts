
import { db } from "./db";

/**
 * Fetch the latest AED to IRR exchange rate from the external API
 * and update the database
 */
export async function updateExchangeRate(): Promise<{
  success: boolean;
  rate?: number;
  error?: string;
}> {
  // Enterprise-grade: multi-source fallback with real-time market rate
  const sources = [
    {
      name: "priceto.day",
      url: "https://api.priceto.day/v1/latest/irr/aed",
      headers: {
        accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      parse: (d: unknown) => {
        const x = d as { success: boolean; price: number; high?: number; low?: number; time: string };
        return x.success && Number.isFinite(x.price) ? Math.round(x.price / 10) : null;
      },
    },
    {
      name: "open.er-api.com (fallback)",
      url: "https://open.er-api.com/v6/latest/AED",
      parse: (d: unknown) => {
        const x = d as { result?: string; rates?: { IRR?: number }; base_code?: string };
        return x.result === "success" && x.rates?.IRR ? Math.round(x.rates.IRR / 10) : null;
      },
    },
  ];

  // Fetch from all sources in parallel, use the best (highest) valid result
  // Real-time market rate from multiple exchanges ensures accuracy
  console.log("[exchange-rate-updater] Fetching live AED→IRR rate from multiple sources...");

  const results = await Promise.allSettled(
    sources.map(async (s) => {
      try {
        const res = await fetch(s.url, {
          method: "GET",
          headers: { accept: "application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept-Language": "en-US,en;q=0.9", ...(s.headers ?? {}) },
          cache: "no-store",
          // بدون وقفه، یک منبع کند می‌تواند کل درخواست را قفل کند
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return { ok: false, name: s.name, rate: null as number | null };
        const body = await res.json();
        const rate = s.parse(body);
        return { ok: true, name: s.name, rate };
      } catch {
        return { ok: false, name: s.name, rate: null as number | null };
      }
    })
  );

  // Pick the highest valid rate (live market price across all sources)
  let bestRate: number | undefined;
  let usedSource: string | undefined;
  const settled = results
    .filter((r): r is PromiseFulfilledResult<{ ok: boolean; name: string; rate: number | null }> => r.status === "fulfilled" && r.value.ok && r.value.rate !== null)
    .map((r) => ({ rate: r.value.rate!, name: r.value.name }))
    .sort((a, b) => b.rate - a.rate);

  if (settled.length > 0) {
    // Use the highest rate — represents the real market exchange rate
    bestRate = settled[0].rate;
    usedSource = settled[0].name;
    console.log(`[exchange-rate-updater] Live rates from sources:`, settled.map(s => `${s.name}: ${s.rate} Toman`).join(", "));
    console.log(`[exchange-rate-updater] Using highest rate: ${bestRate} Toman from ${usedSource} (real-time market price)`);
  }

  if (!bestRate || bestRate <= 0) {
    return {
      success: false,
      error: `All sources failed or returned invalid rates. Last attempt: ${sources.map(s => `${s.name}: fetch error`).join(", ")}. No valid AED→IRR rate could be obtained from live sources.`,
    };
  }

  // Sanity check: rate should be reasonable for AED→IRR (accept 7,000–500,000 Toman/AED = realistic market range today)
  if (bestRate < 7_000 || bestRate > 500_000) {
    console.error(`[exchange-rate-updater] Rate ${bestRate} Toman out of reasonable range (7k–500k), rejecting`);
    return {
      success: false,
      error: `Rate ${bestRate} Toman out of reasonable range for AED→IRR (expected 7,000–500,000)`,
    };
  }

  // Update database with the new rate in Tomans
  await db.setRate(bestRate, `live-${usedSource?.replace(/\.(ir|com|day)$/i, "") ?? "market"}`, false);
  console.log(`[exchange-rate-updater] Successfully updated rate to: ${bestRate} Tomans (${Math.round(bestRate * 10)} Rials) from ${usedSource} — real-time market rate`);

  return {
    success: true,
    rate: bestRate,
  };
}
