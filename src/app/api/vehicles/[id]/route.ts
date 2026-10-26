import { db } from "@/lib/db";
import { fail, isAdmin, ok, route, type IdCtx } from "@/lib/api";
import { vehiclePatchSchema } from "@/lib/validators";

export const GET = route<IdCtx>(async (req, { params }) => {
  const { id } = await params;
  const v = await db.getVehicle(id);
  if (!v || (!v.isPublished && !(await isAdmin(req)))) return fail("خودرو پیدا نشد.", 404);
  return ok(v);
});

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const { id } = await params;
  const patch = vehiclePatchSchema.parse(await req.json());
  const v = await db.updateVehicle(id, patch);
  return v ? ok(v) : fail("خودرو پیدا نشد.", 404);
}, { admin: true });

export const DELETE = route<IdCtx>(async (_req, { params }) => {
  const { id } = await params;
  return (await db.deleteVehicle(id)) ? ok({ id }) : fail("خودرو پیدا نشد.", 404);
}, { admin: true });
