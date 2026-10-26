import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fail, ok, route } from "@/lib/api";
import { UPLOAD_DIR } from "@/lib/uploads";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const MAX = 6 * 1024 * 1024;

export const POST = route(async (req) => {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("فایلی ارسال نشده است.");
  const ext = TYPES[file.type];
  if (!ext) return fail("فقط تصاویر JPG، PNG، WEBP و AVIF مجاز است.");
  if (file.size > MAX) return fail("حجم تصویر نباید بیشتر از ۶ مگابایت باشد.");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return ok({ url: `/uploads/${name}` }, 201);
}, { admin: true });
