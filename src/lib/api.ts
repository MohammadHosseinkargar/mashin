import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

export const ok = <T,>(data: T, status = 200) => NextResponse.json({ success: true, data }, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status });

export async function isAdmin(req: NextRequest): Promise<boolean> {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<NextResponse>;

/** مدیریت خطا و (اختیاری) احراز هویت ادمین برای همه‌ی route handlerها */
export function route<C = unknown>(handler: Handler<C>, opts: { admin?: boolean } = {}): Handler<C> {
  return async (req, ctx) => {
    try {
      if (opts.admin && !(await isAdmin(req))) return fail("دسترسی غیرمجاز؛ لطفاً وارد شوید.", 401);
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ZodError) return fail(e.issues[0]?.message || "داده‌ی ورودی نامعتبر است.", 400);
      if (e instanceof SyntaxError) return fail("بدنه‌ی درخواست نامعتبر است.", 400);
      console.error("[api]", req.method, req.nextUrl.pathname, e);
      return fail("خطای داخلی سرور. لطفاً دوباره تلاش کنید.", 500);
    }
  };
}

export type IdCtx = { params: Promise<{ id: string }> };

/** محدودکننده‌ی ساده‌ی نرخ درخواست (در حافظه) */
const hits = new Map<string, number[]>();
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return true; }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return false;
}
