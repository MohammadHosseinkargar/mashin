import "server-only";
import { db } from "./db";
import type { FuelType, Transmission, VehicleInput } from "./types";

/** آداپتر نمونه (Mock) — برای اتصال به منبع واقعی، فقط تابع fetchListings را جایگزین کنید. */
interface Listing {
  externalId: string;
  brand: string;
  model: string;
  year: number;
  priceAed: number;
  mileage: number;
  engine: number;
  fuel: FuelType;
  transmission: Transmission;
  city: string;
  gcc: boolean;
}

const MOCK: Listing[] = [
  { externalId: "mock-1001", brand: "تویوتا", model: "Prado TXL", year: 2022, priceAed: 142000, mileage: 36000, engine: 2700, fuel: "petrol", transmission: "automatic", city: "دبی", gcc: true },
  { externalId: "mock-1002", brand: "نیسان", model: "X-Trail SL", year: 2021, priceAed: 74000, mileage: 48000, engine: 2500, fuel: "petrol", transmission: "automatic", city: "شارجه", gcc: true },
  { externalId: "mock-1003", brand: "بی‌ام‌و", model: "X5 xDrive40i", year: 2022, priceAed: 235000, mileage: 29000, engine: 3000, fuel: "petrol", transmission: "automatic", city: "دبی", gcc: true },
  { externalId: "mock-1004", brand: "کیا", model: "Sportage GT-Line", year: 2023, priceAed: 91000, mileage: 15000, engine: 2400, fuel: "petrol", transmission: "automatic", city: "ابوظبی", gcc: true },
  { externalId: "mock-1005", brand: "لندرور", model: "Range Rover Sport", year: 2021, priceAed: 289000, mileage: 41000, engine: 3000, fuel: "diesel", transmission: "automatic", city: "دبی", gcc: false },
  { externalId: "mock-1006", brand: "هوندا", model: "Accord Sport", year: 2022, priceAed: 68000, mileage: 33000, engine: 1500, fuel: "petrol", transmission: "automatic", city: "عجمان", gcc: true },
];

async function fetchListings(): Promise<Listing[]> {
  // جایگزین کنید: فراخوانی API رسمی/مجاز منبع داده
  return MOCK;
}

function toVehicle(l: Listing): VehicleInput {
  return {
    brand: l.brand,
    model: l.model,
    modelYear: l.year,
    aedPrice: l.priceAed,
    images: [],
    specifications: { source: "mock", externalId: l.externalId, location: l.city, gccSpec: l.gcc, currency: "AED" },
    mileage: l.mileage,
    engineCapacity: l.engine,
    fuelType: l.fuel,
    transmission: l.transmission,
    features: [],
    description: `${l.brand} ${l.model} مدل ${l.year} — وارداتی از ${l.city} (داده‌ی آزمایشی).`,
    status: "available",
    isPublished: false, // پیش‌فرض: پیش‌نویس تا ادمین بررسی و منتشر کند
  };
}

export interface SyncResult { created: number; updated: number; dryRun: boolean; total: number }

export async function runSync(dryRun = false): Promise<SyncResult> {
  const listings = await fetchListings();
  const { items: existing } = await db.listVehicles({ limit: 500 });
  const byExternal = new Map(existing.filter((v) => v.specifications.source === "mock").map((v) => [String(v.specifications.externalId), v]));
  let created = 0, updated = 0;
  for (const l of listings) {
    const data = toVehicle(l);
    const found = byExternal.get(l.externalId);
    if (found) {
      updated++;
      if (!dryRun) await db.updateVehicle(found.id, { aedPrice: data.aedPrice, mileage: data.mileage, specifications: data.specifications });
    } else {
      created++;
      if (!dryRun) await db.createVehicle(data);
    }
  }
  if (!dryRun) {
    const s = await db.getImportSettings();
    await db.saveImportSettings({ lastSyncAt: new Date().toISOString(), lastError: null, totalImported: s.totalImported + created, totalUpdated: s.totalUpdated + updated });
  }
  return { created, updated, dryRun, total: listings.length };
}
