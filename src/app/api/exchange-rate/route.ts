import { db } from "@/lib/db";
import { ok, route } from "@/lib/api";
import { rateSchema } from "@/lib/validators";

export const GET = route(async () => ok(await db.getRate()));

export const PUT = route(async (req) => {
  const b = rateSchema.parse(await req.json());
  return ok(await db.setRate(b.rate, b.source, b.isManual));
}, { admin: true });
