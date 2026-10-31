"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, Car, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import { useActiveNav } from "@/lib/use-active-nav";
import { LinkButton } from "./ui";

const LINKS = [
  { href: "/", label: "خانه" },
  { href: "/catalog", label: "کاتالوگ خودرو" },
  { href: "/#calculator", label: "ماشین‌حساب قیمت" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

export function Logo({ title = "ترنم شرق چابهار" }: { title?: string }) {
  return (
    <Link href="/" className="group flex min-w-0 items-center gap-2.5" aria-label={title}>
      <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold to-amber text-[#1a1204] shadow-[0_6px_24px_-6px_rgb(246_189_79/.7)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
        <Car className="size-5" strokeWidth={2.4} />
      </span>
      <span className="truncate text-base font-black tracking-tight sm:text-lg">{title}</span>
    </Link>
  );
}

export function SiteHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const active = useActiveNav();
  // منو فقط برای همین مسیر باز می‌ماند؛ با تغییر صفحه خودکار بسته می‌شود (بدون setState در effect)
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (v: boolean) => setOpenPath(v ? pathname : null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenPath(null);
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className={cn("border-b transition-[background-color,border-color,box-shadow] duration-300", scrolled ? "border-line bg-bg/92 shadow-[0_8px_30px_-12px_rgb(0_0_0/.8)] backdrop-blur-xl" : "border-transparent bg-transparent")}>
          <div className="mx-auto flex h-[var(--header-h)] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
            <Logo title={title} />

            <nav className="hidden items-center gap-1 lg:flex" aria-label="منوی اصلی">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} aria-current={active === l.href ? "page" : undefined} className={cn("relative shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors", active === l.href ? "text-ink" : "text-muted hover:text-ink")}>
                  {active === l.href && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-lg bg-white/8" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <LinkButton href="/contact" size="sm"><Phone className="size-4" />مشاوره<span className="hidden sm:inline"> رایگان</span></LinkButton>
              {/* روی موبایل، نوار پایین ناوبری را انجام می‌دهد؛ منوی کشویی فقط برای تبلت */}
              <button onClick={() => setOpen(true)} className="hidden size-10 place-items-center rounded-xl border border-line text-ink transition hover:bg-white/10 md:grid lg:hidden" aria-label="باز کردن منو" aria-expanded={open}>
                <Menu className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[90] hidden md:block lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            {/* در RTL لبه‌ی end سمت چپ است، پس از چپ می‌آید */}
            <motion.aside
              role="dialog" aria-modal="true" aria-label="منو"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="card-surface absolute inset-y-0 end-0 flex w-[82%] max-w-sm flex-col p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            >
              <div className="mb-8 flex items-center justify-between gap-3">
                <Logo title={title} />
                <button onClick={() => setOpen(false)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-line" aria-label="بستن منو"><X className="size-5" /></button>
              </div>
              <nav className="flex flex-col gap-1">
                {LINKS.map((l, i) => (
                  <motion.div key={l.href} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 + i * 0.05 }}>
                    <Link href={l.href} onClick={() => setOpen(false)} className={cn("block rounded-xl px-4 py-3.5 text-lg font-medium", active === l.href ? "bg-gold/12 text-gold" : "text-ink hover:bg-white/6")}>{l.label}</Link>
                  </motion.div>
                ))}
              </nav>
              <div className="mt-auto pt-6"><LinkButton href="/contact" size="lg" className="w-full"><Phone className="size-5" />مشاوره رایگان</LinkButton></div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
