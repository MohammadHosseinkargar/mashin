import "server-only";
import { db } from "./db";

interface PriceToResponse {
  success: boolean;
  price: number;
  high: number;
  low: number;
  time: string;
}

/**
 * Fetch the latest AED to IRR exchange rate from the external API
 * and update the database
 */
export async function updateExchangeRate(): Promise<{
  success: boolean;
  rate?: number;
  error?: string;
}> {
  try {
    console.log("[exchange-rate-updater] Fetching rate from API...");

    const response = await fetch("https://api.priceto.day/v1/latest/irr/aed", {
      method: "GET",
      headers: {
        accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      // Disable Next.js caching for this external API call
      cache: "no-store",
    });

    console.log("[exchange-rate-updater] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to read error");
      console.error("[exchange-rate-updater] API error:", errorText);
      return {
        success: false,
        error: `API returned status ${response.status}: ${errorText.slice(0, 100)}`,
      };
    }

    const data = (await response.json()) as PriceToResponse;
    console.log("[exchange-rate-updater] Received data:", data);

    // The API returns IRR (Rials) per 1 AED in the 'price' field
    // Convert Rials to Tomans by dividing by 10
    const rateInTomans = Math.round(data.price / 10);

    if (!rateInTomans || typeof rateInTomans !== "number" || rateInTomans <= 0) {
      return {
        success: false,
        error: "Invalid rate value received from API",
      };
    }

    // Update database with the new rate in Tomans
    await db.setRate(rateInTomans, "priceto.day", false);
    console.log("[exchange-rate-updater] Successfully updated rate to:", rateInTomans, "Tomans");

    return {
      success: true,
      rate: rateInTomans,
    };
  } catch (error) {
    console.error("[exchange-rate-updater] Exception:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: message,
    };
  }
}
