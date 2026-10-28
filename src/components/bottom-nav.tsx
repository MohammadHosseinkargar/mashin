"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Home, Search, Calculator, Info, Phone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/format";
import { useEffect, useRef } from "react";

type IconType = typeof Home;

interface Tab {
  href: string;
  label: string;
}

const TABS: Tab[] = [
  { href: "/", label: "خانه" },
  { href: "/catalog", label: "کاتالوگ" },
  { href: "/#calculator", label: "محاسبه" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس" },
];

const ICON_MAP: Record<string, IconType> = {
  "/": Home,
  "/catalog": Search,
  "/#calculator": Calculator,
  "/about": Info,
  "/contact": Phone,
};

function iconFor(href: string) {
  return ICON_MAP[href] ?? Home;
}

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    el.current?.scrollIntoView({ block: "end", inline: "nearest" });
  }, [pathname]);

  // active tab logic: home exact, others by prefix, calculator by anchor fallback
  function activeTab() {
    if (pathname === "/") return TABS[0];
    for (const t of TABS) {
      if (t.href.startsWith("/#")) {
        const base = t.href.replace("#", "");
        if (pathname === base || (base && pathname.startsWith(base))) return t;
      } else if (pathname.startsWith(t.href) && !t.href.startsWith("/#")) return t;
    }
    return TABS[0];
  }

  const active = activeTab();

  return (
    <div ref={el}>
      <nav className={cn("touch-manipulation sm:hidden", className)} aria-label="منوی پایین">
        <div className="fixed bottom-0 inset-x-0 z-50 overflow-hidden rounded-t-[2.25rem] border-t border-line bg-surface/95 backdrop-blur-xl shadow-[0_-12px_32px_-10px_rgb(0_0_0/.7)]">
          <div className="mx-auto flex max-w-[580px] items-center justify-around gap-1 pb-2.5 pt-1">
            {TABS.map((t) => {
              const isActive = active.href === t.href;
              const Icon = iconFor(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors duration-300",
                    isActive ? "text-ink" : "text-muted",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-lg transition-all duration-300",
                      isActive ? "bg-gold/15 text-gold" : "bg-white/[0.04] text-muted",
                    )}
                  >
                    <Icon className="size-5 [stroke-width:2]" />
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-semibold leading-tight",
                      isActive ? "text-gold" : "text-muted",
                    )}
                  >
                    {t.label}
                  </span>
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.span
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        exit={{ scaleX: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-gradient-to-r from-gold/80 to-amber"
                      />
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
          {/* subtle center line */}
          <div className="mx-auto mt-0.5 flex h-px max-w-[580px] items-center justify-around gap-3">
            {TABS.map((t) => (
              <span key={t.href} className="h-px w-6 bg-white/[0.06] transition-all duration-300" />
            ))}
          </div>
        </div>

        {/* soft shadow to indicate the bar is pinned */}
        <div className="pointer-events-none fixed bottom-[calc(100%+1px)] left-1/2 h-[10px] w-[580px] -translate-x-1/2 rounded-full bg-gradient-to-t from-surface/60 to-transparent blur-2xl" />
      </nav>
    </div>
  );
}
