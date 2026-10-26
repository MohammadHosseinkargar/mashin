import { db } from "@/lib/db";
import { isAdmin, ok, route } from "@/lib/api";
import { feeSchema } from "@/lib/validators";

export const GET = route(async (req) => {
  const fees = await db.listFees();
  const admin = req.nextUrl.searchParams.get("all") === "1" && (await isAdmin(req));
  return ok(admin ? fees : fees.filter((f) => f.isEnabled));
});

export const POST = route(async (req) => ok(await db.createFee(feeSchema.parse(await req.json())), 201), { admin: true });
