"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * مسیر فعال منو (هدر و نوار پایین). برای «ماشین‌حساب» که یک لنگر روی صفحه‌ی اصلی است،
 * با IntersectionObserver مشخص می‌شود کاربر الان همان بخش را می‌بیند یا نه.
 */
export function useActiveNav(): string | null {
  const pathname = usePathname();
  const [calcInView, setCalcInView] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    const el = document.getElementById("calculator");
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCalcInView(entry.isIntersecting), { rootMargin: "-35% 0px -45% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);

  if (pathname === "/") return calcInView ? "/#calculator" : "/";
  if (pathname.startsWith("/catalog")) return "/catalog";
  if (pathname.startsWith("/about")) return "/about";
  if (pathname.startsWith("/contact")) return "/contact";
  return null;
}
