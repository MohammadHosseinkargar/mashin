import { db } from "@/lib/db";
import { fail, ok, route, type IdCtx } from "@/lib/api";
import { feePatchSchema } from "@/lib/validators";

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const { id } = await params;
  const fee = await db.updateFee(id, feePatchSchema.parse(await req.json()));
  return fee ? ok(fee) : fail("هزینه پیدا نشد.", 404);
}, { admin: true });

export const DELETE = route<IdCtx>(async (_req, { params }) => {
  const { id } = await params;
  return (await db.deleteFee(id)) ? ok({ id }) : fail("هزینه پیدا نشد.", 404);
}, { admin: true });
