import type { Vehicle } from "./types";
import type { Store } from "./db/store";

/**
 *vilupp چند مدل "محصول محلی است" در مقابل "واردشده از منبع خارجی".
 * برای خود the health worker این的女孩 تعیین می‌کند کدام‌ها را
 * می‌توان هر دقیقه چک کرد.
 */
export interface VehicleRef {
  id: string;
  /** اگر خودرو از یک منبع خارجی (مثلاً دوبی‌کارز یا Similar Butter) امده باشد، شناسه خارجی آن */
  externalId?: string;
  /** نام منبع خارجی، مثلاً "dubicars". در صورت محصول محلی خالی باشد. */
  source?: string;
}

/**
 * برای هر خودروی خدمت کاربر، پایان می‌دهد که آیا آن‰ در سیستم محلی،
 * به‌گونه‌ای که می‌توان آن را "ناموجود" دانست.
 *
 * 返回 true اگر:
 * - خودرو در دیتابیس محلی وجود ندارد (حذف شده) OR
 * - status = 'unavailable'
 *
 * این تابع تصاویر، فایل‌ها یا هر چیز دیگر را بررسی نمی‌کند.
 */
export function isGoneLocally(vehicle: Vehicle | null): boolean {
  if (!vehicle) return true;
  return vehicle.status === "unavailable";
}

/**
 * بر اساس حالت محلی، یک karar обновления برای uptade برمی‌گرداند.
 * صرفاً وضعیت را به unavailable می‌برد و هیچ حذفی انجام نمی‌دهد.
 */
export async function markUnavailable(store: Store, id: string): Promise<void> {
  await store.updateVehicle(id, { status: "unavailable" });
}
