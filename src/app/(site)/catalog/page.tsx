import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { db } from "@/lib/db";
import type { VehicleQuery } from "@/lib/types";
import { CatalogFilters } from "@/components/catalog-filters";
import { VehicleCard } from "@/components/vehicle-card";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { cn, toFa } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const int = (v: string | string[] | undefined) => { const n = Number(one(v)); return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined; };
const yearMaxOf = (v: number | undefined) => (v && v >= 2023 ? Math.floor(v) : 9999);

/** با هزاران صفحه، فقط صفحه‌های نزدیکِ جاری (به‌همراه اول و آخر) نمایش داده می‌شوند. */
function pageWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set<number>();
  for (const p of [1, 2, total - 1, total, current - 2, current - 1, current, current + 1, current + 2]) {
    if (p >= 1 && p <= total) keep.add(p);
  }
  const sorted = [...keep].sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("gap");
    out.push(p);
    prev = p;
  }
  return out;
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = int(sp.page) ?? 1;
  const sort = one(sp.sort);
  const query: VehicleQuery = {
    publishedOnly: true,
    search: one(sp.search), brand: one(sp.brand), fuelType: one(sp.fuelType), transmission: one(sp.transmission), status: one(sp.status),
    yearMin: int(sp.yearMin) ?? 2023, yearMax: yearMaxOf(int(sp.yearMax)), priceMin: int(sp.priceMin), priceMax: int(sp.priceMax),
    sort: (["price_asc", "price_desc", "year_desc", "mileage_asc"].includes(sort ?? "") ? sort : "newest") as VehicleQuery["sort"],
    yearOnly: true,
    limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE,
  };
  const [{ items, total }, rate, fees, brands] = await Promise.all([
    db.listVehicles(query), db.getRate(), db.listFees().then((f) => f.filter((x) => x.isEnabled)), db.listBrands(true),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) { const val = one(v); if (val && k !== "page") next.set(k, val); }
    if (p > 1) next.set("page", String(p));
    return next.toString() ? `/catalog?${next}` : "/catalog";
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Reveal><SectionTitle eyebrow="کاتالوگ" title="خودروهای آماده‌ی واردات" text="خودروی دلخواهتان را پیدا کنید؛ قیمت نهایی با نرخ روز و تمام هزینه‌ها محاسبه شده است." /></Reveal>
      <Suspense fallback={<div className="skeleton h-40 rounded-3xl" />}><CatalogFilters brands={brands} total={total} /></Suspense>

      <div className="mt-6 overflow-x-clip">
        {items.length === 0 ? (
          <EmptyState icon={<SearchX className="size-8" />} title="خودرویی با این مشخصات پیدا نشد" text="فیلترها را تغییر دهید یا برای پیدا کردن خودروی دلخواه با ما تماس بگیرید." action={<LinkButton href="/contact" variant="outline">درخواست مشاوره</LinkButton>} />
        ) : (
          <Stagger key={JSON.stringify(sp)} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
            {items.map((v) => (<StaggerItem key={v.id} className="min-w-0"><VehicleCard vehicle={v} rate={rate.rate} fees={fees} /></StaggerItem>))}
          </Stagger>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="صفحه‌بندی" className="mt-8 flex items-center justify-center gap-2 overflow-x-auto sm:mt-10">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold sm:hidden">صفحه {toFa(page)} از {toFa(pages)}</span>
            <Link aria-disabled={page <= 1} href={href(Math.max(1, page - 1))} className={cn("grid size-11 place-items-center rounded-xl border border-line transition hover:border-gold/50", page <= 1 && "pointer-events-none opacity-40")} aria-label="صفحه‌ی قبل"><ChevronRight className="size-5" /></Link>
            {pageWindow(page, pages).map((p, i) =>
              p === "gap" ? (
                <span key={`gap-${i}`} aria-hidden className="size-11 place-items-center text-muted">…</span>
              ) : (
                <Link key={p} href={href(p)} aria-current={p === page ? "page" : undefined} className={cn("size-11 place-items-center rounded-xl border text-sm font-bold transition", p === page ? "border-transparent bg-gradient-to-br from-gold to-amber text-[#1a1204]" : "border-line text-muted hover:border-gold/50 hover:text-ink")}>{toFa(p)}</Link>
              )
            )}
            <Link aria-disabled={page >= pages} href={href(Math.min(pages, page + 1))} className={cn("grid size-11 place-items-center rounded-xl border border-line transition hover:border-gold/50", page >= pages && "pointer-events-none opacity-40")} aria-label="صفحه‌ی بعد"><ChevronLeft className="size-5" /></Link>
          </div>
        </nav>
      )}
    </div>
  );
}