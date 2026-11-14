/**
 * با بالا آمدن سرور Next اجرا می‌شود؛ کارهای پس‌زمینه (نرخ درهم و ...) را بدون ورکر جداگانه راه می‌اندازد.
 * خاموش‌کردن: AUTO_JOBS=false  |  فعال‌سازی در حالت dev: AUTO_JOBS=true
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const flag = process.env.AUTO_JOBS?.trim().toLowerCase();
  if (flag === "false") return;
  if (process.env.NODE_ENV !== "production" && flag !== "true") return;
  const { startBackgroundJobs } = await import("./lib/background-jobs");
  startBackgroundJobs();
}
