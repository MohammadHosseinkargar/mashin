import "server-only";
import type { Store } from "./store";
import { jsonStore } from "./json-store";
import { pgStore } from "./pg-store";

/** اگر DATABASE_URL تنظیم شده باشد از PostgreSQL، وگرنه از فایل JSON محلی استفاده می‌شود. */
export const db: Store = process.env.DATABASE_URL ? pgStore : jsonStore;
export const usingPostgres = Boolean(process.env.DATABASE_URL);
export { vehicleTitle } from "./store";
