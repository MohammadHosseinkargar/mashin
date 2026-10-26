import { db } from "@/lib/db";
import { fail, ok, route, type IdCtx } from "@/lib/api";
import { requestStatusSchema } from "@/lib/validators";

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const { id } = await params;
  const { status } = requestStatusSchema.parse(await req.json());
  const r = await db.updateRequestStatus(id, status);
  return r ? ok(r) : fail("درخواست پیدا نشد.", 404);
}, { admin: true });

export const DELETE = route<IdCtx>(async (_req, { params }) => {
  const { id } = await params;
  return (await db.deleteRequest(id)) ? ok({ id }) : fail("درخواست پیدا نشد.", 404);
}, { admin: true });
