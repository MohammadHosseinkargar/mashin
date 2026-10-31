import { route, ok, fail } from "@/lib/api";
import { updateExchangeRate } from "@/lib/exchange-rate-updater";

export const GET = route(async () => {
  const result = await updateExchangeRate();

  if (result.success) {
    return ok({ rate: result.rate });
  } else {
    return fail(result.error || "خطا در دریافت نرخ ارز از API", 500);
  }
}, { admin: true });
