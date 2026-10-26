import { db } from "@/lib/db";
import { isAdmin, ok, route } from "@/lib/api";
import { vehicleSchema } from "@/lib/validators";
import type { VehicleQuery } from "@/lib/types";

const intOr = (v: string | null) => (v && Number.isFinite(Number(v)) ? Number(v) : undefined);

export const GET = route(async (req) => {
  const sp = req.nextUrl.searchParams;
  const admin = sp.get("all") === "1" && (await isAdmin(req));
  const q: VehicleQuery = {
    publishedOnly: !admin,
    search: sp.get("search") ?? undefined,
    brand: sp.get("brand") ?? undefined,
    fuelType: sp.get("fuelType") ?? undefined,
    transmission: sp.get("transmission") ?? undefined,
    status: sp.get("status") ?? undefined,
    yearMin: intOr(sp.get("yearMin")),
    yearMax: intOr(sp.get("yearMax")),
    priceMin: intOr(sp.get("priceMin")),
    priceMax: intOr(sp.get("priceMax")),
    sort: (sp.get("sort") as VehicleQuery["sort"]) ?? "newest",
    limit: intOr(sp.get("limit")) ?? 100,
    offset: intOr(sp.get("offset")) ?? 0,
  };
  return ok(await db.listVehicles(q));
});

export const POST = route(async (req) => {
  const input = vehicleSchema.parse(await req.json());
  return ok(await db.createVehicle(input), 201);
}, { admin: true });

export const dynamic = "force-dynamic";
