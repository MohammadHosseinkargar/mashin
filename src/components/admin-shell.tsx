"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Car, Coins, DollarSign, Download, ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/format";
import { Logo } from "./site-header";

const NAV = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/vehicles", label: "خودروها", icon: Car },
  { href: "/admin/requests", label: "درخواست‌ها", icon: Inbox },
  { href: "/admin/exchange-rate", label: "نرخ ارز", icon: DollarSign },
  { href: "/admin/fees", label: "هزینه‌های واردات", icon: Coins },
  { href: "/admin/imports", label: "همگام‌سازی", icon: Download },
  { href: "/admin/settings", label: "تنظیمات سایت", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (v: boolean) => setOpenPath(v ? pathname : null);

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  async function logout() {
    try { await api("/api/admin/logout", { method: "POST" }); } catch {}
    toast.success("خارج شدید.");
    router.replace("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <div className="flex items-center justify-between"><Logo title="پنل مدیریت" /><button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg lg:hidden" aria-label="بستن"><X className="size-5" /></button></div>
      <nav className="flex flex-1 flex-col gap-1" aria-label="منوی مدیریت">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={cn("relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors", active(n.href) ? "text-ink" : "text-muted hover:text-ink")}>
            {active(n.href) && <motion.span layoutId="admin-pill" className="absolute inset-0 rounded-xl border border-gold/25 bg-gold/10" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <n.icon className={cn("relative size-5", active(n.href) && "text-gold")} /><span className="relative">{n.label}</span>
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-line pt-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted transition hover:bg-white/5 hover:text-ink"><ExternalLink className="size-5" />مشاهده‌ی سایت</Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-rose transition hover:bg-rose/10"><LogOut className="size-5" />خروج</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="card-surface sticky top-0 hidden h-dvh border-y-0 border-s-0 lg:block">{sidebar}</aside>
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
        <Logo title="پنل مدیریت" />
        <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl border border-line" aria-label="منو"><Menu className="size-5" /></button>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[90] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="card-surface absolute inset-y-0 end-0 w-72">{sidebar}</motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}

export function PageHeader({ title, text, actions }: { title: string; text?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-black sm:text-3xl">{title}</h1>{text && <p className="mt-2 text-sm text-muted">{text}</p>}</div>
      {actions}
    </div>
  );
}
