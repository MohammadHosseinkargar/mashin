"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input, Select } from "./ui";
import { FUEL_LABEL, STATUS_LABEL, TRANS_LABEL, cn } from "@/lib/format";

export function CatalogFilters({ brands, total }: { brands: string[]; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [open, setOpen] = useState(Boolean(sp.get("yearMin") || sp.get("priceMax") || sp.get("priceMin") || sp.get("yearMax")));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const urlSearch = sp.get("search") ?? "";
  const [pushed, setPushed] = useState(urlSearch);
  const [prevUrl, setPrevUrl] = useState(urlSearch);
  // همگام‌سازی با تغییر آدرس از بیرون (دکمه‌ی back، ریست) در زمان render — الگوی رسمی React
  // «adjusting state when props change»؛ این الگو بدون side-effect در effect است و خطای lint ندارد.
  if (urlSearch !== prevUrl) {
    setPrevUrl(urlSearch);
    if (urlSearch !== pushed) { setPushed(urlSearch); setSearch(urlSearch); }
  }

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString());
    if ("search" in patch) setPushed(patch.search ?? "");
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in patch)) next.delete("page");
    start(() => router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false }));
  }

  useEffect(() => () => clearTimeout(timer.current), []);
  const onSearch = (v: string) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ search: v.trim() || null }), 450);
  };
  const hasFilters = ["search", "brand", "fuelType", "transmission", "status", "yearMin", "yearMax", "priceMin", "priceMax"].some((k) => sp.get(k));
  const num = (k: string) => (
    <Input key={k + (sp.get(k) ?? "")} dir="ltr" inputMode="numeric" defaultValue={sp.get(k) ?? ""} className="h-11 text-center"
      onBlur={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v !== (sp.get(k) ?? "")) update({ [k]: v || null }); }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
  );

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-3.5 sm:p-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
        <div className="relative col-span-2 md:col-span-1">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-faint" />
          <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="جستجوی برند، مدل یا توضیحات..." className="ps-12" aria-label="جستجو" />
        </div>
        <Select aria-label="برند" value={sp.get("brand") ?? ""} onChange={(e) => update({ brand: e.target.value || null })}>
          <option value="">همه‌ی برندها</option>
          {brands.map((b) => (<option key={b} value={b}>{b}</option>))}
        </Select>
        <Select aria-label="سوخت" value={sp.get("fuelType") ?? ""} onChange={(e) => update({ fuelType: e.target.value || null })}>
          <option value="">همه‌ی سوخت‌ها</option>
          {Object.entries(FUEL_LABEL).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
        </Select>
        <Select aria-label="مرتب‌سازی" value={sp.get("sort") ?? "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}>
          <option value="newest">جدیدترین</option>
          <option value="price_asc">ارزان‌ترین</option>
          <option value="price_desc">گران‌ترین</option>
          <option value="year_desc">جدیدترین مدل</option>
          <option value="mileage_asc">کم‌کارکردترین</option>
        </Select>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={cn("flex h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium whitespace-nowrap transition sm:px-4", open ? "border-gold/50 bg-gold/10 text-gold" : "border-line text-muted hover:text-ink")}>
          <SlidersHorizontal className="size-4" />فیلتر بیشتر
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select aria-label="گیربکس" value={sp.get("transmission") ?? ""} onChange={(e) => update({ transmission: e.target.value || null })}>
                <option value="">همه‌ی گیربکس‌ها</option>
                {Object.entries(TRANS_LABEL).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
              </Select>
              <Select aria-label="وضعیت" value={sp.get("status") ?? ""} onChange={(e) => update({ status: e.target.value || null })}>
                <option value="">همه‌ی وضعیت‌ها</option>
                {Object.entries(STATUS_LABEL).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
              </Select>
              <div className="grid grid-cols-2 gap-2"><label className="min-w-0 space-y-1"><span className="text-xs text-faint">از سال</span>{num("yearMin")}</label><label className="space-y-1"><span className="text-xs text-faint">تا سال</span>{num("yearMax")}</label></div>
              <div className="grid grid-cols-2 gap-2"><label className="space-y-1"><span className="text-xs text-faint">حداقل قیمت (درهم)</span>{num("priceMin")}</label><label className="space-y-1"><span className="text-xs text-faint">حداکثر قیمت (درهم)</span>{num("priceMax")}</label></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted">
        <span className={cn("transition-opacity wrap-anywhere", pending && "animate-pulse")}>{new Intl.NumberFormat("fa-IR").format(total)} خودرو یافت شد</span>
        {hasFilters && (
          <button onClick={() => { setSearch(""); setPushed(""); clearTimeout(timer.current); start(() => router.replace(pathname, { scroll: false })); }} className="flex items-center gap-1.5 text-gold transition hover:brightness-125"><RotateCcw className="size-4" />پاک کردن فیلترها</button>
        )}
      </div>
      {pending && <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2 }} className="absolute inset-x-6 bottom-0 h-0.5 origin-right rounded bg-gradient-to-l from-gold to-amber" />}
    </div>
  );
}
