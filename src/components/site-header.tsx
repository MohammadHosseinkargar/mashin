"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, Car, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/format";
import { LinkButton } from "./ui";

const LINKS = [
  { href: "/", label: "خانه" },
  { href: "/catalog", label: "کاتالوگ خودرو" },
  { href: "/#calculator", label: "ماشین‌حساب قیمت" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

export function Logo({ title = "مستقر خودرو" }: { title?: string }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={title}>
      <span className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-gold to-amber text-[#1a1204] shadow-[0_6px_24px_-6px_rgb(246_189_79/.7)] transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105">
        <Car className="size-5" strokeWidth={2.4} />
      </span>
      <span className="text-lg font-black tracking-tight">{title}</span>
    </Link>
  );
}

export function SiteHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (v: boolean) => setOpenPath(v ? pathname : null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-500", scrolled ? "py-2" : "py-4")}
      >
        <div className={cn("mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-500 sm:px-6", scrolled && "glass mx-3 rounded-2xl py-2.5 shadow-2xl shadow-black/40 sm:mx-auto sm:max-w-6xl")}>
          <Logo title={title} />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="منوی اصلی">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={cn("relative rounded-lg px-4 py-2 text-sm font-medium transition-colors", isActive(l.href) ? "text-ink" : "text-muted hover:text-ink")}>
                {isActive(l.href) && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-lg bg-white/8" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LinkButton href="/contact" size="sm" className="hidden sm:inline-flex"><Phone className="size-4" />مشاوره رایگان</LinkButton>
            <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl border border-line text-ink transition hover:bg-white/10 lg:hidden" aria-label="باز کردن منو">
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[90] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="card-surface absolute inset-y-0 end-0 flex w-[82%] max-w-sm flex-col p-6"
            >
              <div className="mb-8 flex items-center justify-between">
                <Logo title={title} />
                <button onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-xl border border-line" aria-label="بستن منو"><X className="size-5" /></button>
              </div>
              <nav className="flex flex-col gap-1">
                {LINKS.map((l, i) => (
                  <motion.div key={l.href} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.06 }}>
                    <Link href={l.href} className={cn("block rounded-xl px-4 py-3.5 text-lg font-medium", isActive(l.href) ? "bg-gold/12 text-gold" : "text-ink hover:bg-white/6")}>{l.label}</Link>
                  </motion.div>
                ))}
              </nav>
              <div className="mt-auto"><LinkButton href="/contact" size="lg" className="w-full"><Phone className="size-5" />مشاوره رایگان</LinkButton></div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
