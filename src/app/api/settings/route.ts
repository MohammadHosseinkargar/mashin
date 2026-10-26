import { db } from "@/lib/db";
import { ok, route } from "@/lib/api";
import { settingsSchema } from "@/lib/validators";

export const GET = route(async () => ok(await db.getSettings()));

export const PUT = route(async (req) => ok(await db.saveSettings(settingsSchema.parse(await req.json()))), { admin: true });
