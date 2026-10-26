import { promises as fs } from "fs";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import { MIME, UPLOAD_DIR } from "@/lib/uploads";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const m = /^[\w-]+\.(jpg|png|webp|avif)$/.exec(name);
  if (!m) return new NextResponse("Not found", { status: 404 });
  try {
    const buf = await fs.readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name));
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": MIME[m[1]], "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
