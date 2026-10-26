import { NextResponse } from "next/server";
import { checkCredentials, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { fail, rateLimited, route } from "@/lib/api";

export const POST = route(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`login:${ip}`, 8, 10 * 60_000)) return fail("تعداد تلاش‌ها زیاد است؛ چند دقیقه بعد دوباره امتحان کنید.", 429);
  const body = (await req.json()) as { username?: unknown; password?: unknown };
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!checkCredentials(username, password)) return fail("نام کاربری یا رمز عبور اشتباه است.", 401);
  const res = NextResponse.json({ success: true, data: { ok: true } });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
  return res;
});
