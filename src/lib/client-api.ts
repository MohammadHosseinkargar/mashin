"use client";

/** فراخوانی API و برگرداندن data؛ در خطا Error با پیام فارسی پرتاب می‌شود. */
export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(rest.headers ?? {}) },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: "no-store",
    });
  } catch {
    throw new Error("ارتباط با سرور برقرار نشد. اینترنت خود را بررسی کنید.");
  }
  let payload: { success?: boolean; data?: T; error?: string } | null = null;
  try { payload = await res.json(); } catch {}
  if (res.status === 401 && typeof window !== "undefined" && window.location.pathname.startsWith("/admin") && !window.location.pathname.startsWith("/admin/login")) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/login";
  }
  if (!res.ok || !payload?.success) throw new Error(payload?.error || "خطایی رخ داد. دوباره تلاش کنید.");
  return payload.data as T;
}
