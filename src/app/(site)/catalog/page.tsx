import type { Metadata } from "next";
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

export const metadata: Metadata = { title: "کاتالوگ خودرو", description: "فهرست خودروهای آماده‌ی واردات از امارات با برآورد قیمت نهایی." };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const int = (v: string | string[] | undefined) => { const n = Number(one(v)); return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined; };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = int(sp.page) ?? 1;
  const sort = one(sp.sort);
  const query: VehicleQuery = {
    publishedOnly: true,
    search: one(sp.search), brand: one(sp.brand), fuelType: one(sp.fuelType), transmission: one(sp.transmission), status: one(sp.status),
    yearMin: int(sp.yearMin), yearMax: int(sp.yearMax), priceMin: int(sp.priceMin), priceMax: int(sp.priceMax),
    sort: (["price_asc", "price_desc", "year_desc", "mileage_asc"].includes(sort ?? "") ? sort : "newest") as VehicleQuery["sort"],
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
    <div className="mx-auto max-w-7xl px-4 pt-32 sm:px-6 sm:pt-36">
      <Reveal><SectionTitle eyebrow="کاتالوگ" title="خودروهای آماده‌ی واردات" text="خودروی دلخواهتان را پیدا کنید؛ قیمت نهایی با نرخ روز و تمام هزینه‌ها محاسبه شده است." /></Reveal>
      <Suspense fallback={<div className="skeleton h-40 rounded-3xl" />}><CatalogFilters brands={brands} total={total} /></Suspense>

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState icon={<SearchX className="size-8" />} title="خودرویی با این مشخصات پیدا نشد" text="فیلترها را تغییر دهید یا برای پیدا کردن خودروی دلخواه با ما تماس بگیرید." action={<LinkButton href="/contact" variant="outline">درخواست مشاوره</LinkButton>} />
        ) : (
          <Stagger key={JSON.stringify(sp)} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
            {items.map((v) => (<StaggerItem key={v.id}><VehicleCard vehicle={v} rate={rate.rate} fees={fees} /></StaggerItem>))}
          </Stagger>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="صفحه‌بندی" className="mt-12 flex items-center justify-center gap-2">
          <Link aria-disabled={page <= 1} href={href(Math.max(1, page - 1))} className={cn("grid size-11 place-items-center rounded-xl border border-line transition hover:border-gold/50", page <= 1 && "pointer-events-none opacity-40")}><ChevronRight className="size-5" /></Link>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={href(p)} aria-current={p === page ? "page" : undefined} className={cn("grid size-11 place-items-center rounded-xl border text-sm font-bold transition", p === page ? "border-transparent bg-gradient-to-br from-gold to-amber text-[#1a1204]" : "border-line text-muted hover:border-gold/50 hover:text-ink")}>{toFa(p)}</Link>
          ))}
          <Link aria-disabled={page >= pages} href={href(Math.min(pages, page + 1))} className={cn("grid size-11 place-items-center rounded-xl border border-line transition hover:border-gold/50", page >= pages && "pointer-events-none opacity-40")}><ChevronLeft className="size-5" /></Link>
        </nav>
      )}
    </div>
  );
}
