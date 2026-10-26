import { db } from "@/lib/db";
import { fail, ok, rateLimited, route } from "@/lib/api";
import { requestSchema } from "@/lib/validators";

export const GET = route(async () => ok(await db.listRequests()), { admin: true });

export const POST = route(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`req:${ip}`, 5, 10 * 60_000)) return fail("درخواست‌های شما زیاد است؛ لطفاً کمی بعد تلاش کنید.", 429);
  const input = requestSchema.parse(await req.json());
  const r = await db.createRequest(input);
  return ok({ id: r.id }, 201);
});
