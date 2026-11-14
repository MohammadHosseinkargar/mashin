// امضای نشست با HMAC-SHA256 (Web Crypto) — هم در proxy و هم در route handler کار می‌کند.
import type { NextRequest } from "next/server";
export const SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

/** مقدار env را از فاصله و \r (فایل‌های .env ویندوزی) پاک می‌کند */
function env(name: string): string {
  return (process.env[name] ?? "").replace(/^["']|["']$/g, "").trim();
}

function getSecret(): string {
  const s = env("AUTH_SECRET");
  if (s.length >= 16) return s;
  // هرگز نباید ورود به‌خاطر نبودن AUTH_SECRET از کار بیفتد؛ در این حالت از نام کاربری/رمز ادمین کلید می‌سازیم.
  const u = env("ADMIN_USERNAME");
  const p = env("ADMIN_PASSWORD");
  if (u && p) return `garaj::${u}::${p}::session-key`;
  return "garaj-dev-only-insecure-secret";
}

const enc = new TextEncoder();

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin.${exp}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  try {
    return await verifyToken(token);
  } catch {
    return false;
  }
}

async function verifyToken(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(await hmac(`${parts[0]}.${parts[1]}`), parts[2]);
}

export function checkCredentials(username: string, password: string): boolean {
  const u = env("ADMIN_USERNAME") || (process.env.NODE_ENV === "production" ? "" : "admin");
  const p = env("ADMIN_PASSWORD") || (process.env.NODE_ENV === "production" ? "" : "admin12345");
  if (!u || !p) return false;
  return safeEqual(username.trim(), u) && safeEqual(password.trim(), p);
}

/** پرچم Secure را بر اساس پروتکل واقعی درخواست می‌گذارد: مرورگر کوکی Secure روی HTTP غیر-لوکالاست (IP شبکه یا دامنه بدون HTTPS) ذخیره می‌کند و نشست هرگز ذخیره نمی‌شود و کاربر از پنل به صفحه لاگین برمی‌گردد. */
export function sessionCookieOptions(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const proto = forwarded || req.nextUrl.protocol.replace(":", "");
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: proto === "https",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
