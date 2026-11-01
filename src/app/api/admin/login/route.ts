import { NextResponse } from "next/server";
import { checkCredentials, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { clearAttempts, fail, isRateLimited, recordAttempt, route } from "@/lib/api";

export const POST = route(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `login:${ip}`;
  if (isRateLimited(key, 8, 10 * 60_000)) return fail("تعداد تلاش‌ها زیاد است؛ چند دقیقه بعد دوباره امتحان کنید.", 429);
  const body = (await req.json()) as { username?: unknown; password?: unknown };
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!checkCredentials(username, password)) {
    recordAttempt(key, 10 * 60_000); // فقط تلاش ناموفق شمرده می‌شود
    return fail("نام کاربری یا رمز عبور اشتباه است.", 401);
  }
  clearAttempts(key); // لاگین موفق شمارنده را صفر می‌کند
  const res = NextResponse.json({ success: true, data: { ok: true } });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions(req));
  return res;
});
