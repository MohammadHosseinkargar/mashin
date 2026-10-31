"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Calculator, Car, Home, Info, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/format";
import { useActiveNav } from "@/lib/use-active-nav";

const TABS = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/catalog", label: "کاتالوگ", icon: Car },
  { href: "/#calculator", label: "محاسبه", icon: Calculator },
  { href: "/about", label: "درباره ما", icon: Info },
  { href: "/contact", label: "تماس", icon: Phone },
] as const;

const NON_TEXT = new Set(["checkbox", "radio", "range", "button", "submit", "reset", "file", "color"]);

export function BottomNav() {
  const pathname = usePathname();
  const active = useActiveNav();
  const [typing, setTyping] = useState(false);

  // وقتی کیبورد موبایل باز است، نوار پایین نباید روی کیبورد/فیلد شناور شود
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === "TEXTAREA" || t.tagName === "SELECT" || (t.tagName === "INPUT" && !NON_TEXT.has((t as HTMLInputElement).type)));
    const onIn = (e: FocusEvent) => { if (isField(e.target)) setTyping(true); };
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => { document.removeEventListener("focusin", onIn); document.removeEventListener("focusout", onOut); };
  }, []);

  function onTap(e: React.MouseEvent, href: string) {
    // لمس دوباره‌ی «خانه» وقتی همین‌جا هستیم = برگشت به بالای صفحه
    if (href === "/" && pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.location.hash) history.replaceState(null, "", "/");
    }
  }

  return (
    <nav aria-label="منوی پایین" aria-hidden={typing || undefined} className={cn("fixed inset-x-0 bottom-0 z-50 md:hidden transition-transform duration-300", typing && "pointer-events-none translate-y-full")}>
      <div className="border-t border-line bg-surface/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_-12px_rgb(0_0_0/.8)] backdrop-blur-xl">
        <ul className="mx-auto grid h-[var(--nav-h)] max-w-lg grid-cols-5">
          {TABS.map((t) => {
            const isActive = active === t.href;
            return (
              <li key={t.href} className="min-w-0">
                <Link
                  href={t.href}
                  onClick={(e) => onTap(e, t.href)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn("relative flex h-full flex-col items-center justify-center gap-1 transition-colors duration-200 active:scale-95", isActive ? "text-gold" : "text-muted")}
                >
                  {isActive && <motion.span layoutId="bottom-nav-indicator" className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-gradient-to-l from-gold to-amber" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                  <t.icon className="size-[22px]" strokeWidth={isActive ? 2.4 : 1.9} />
                  <span className="max-w-full truncate px-1 text-[11px] font-semibold leading-none">{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
