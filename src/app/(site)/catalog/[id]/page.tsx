import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Calendar, CheckCircle2, ChevronLeft, Cog, Fuel, Gauge, MapPin, Palette, Users } from "lucide-react";
import { db, vehicleTitle } from "@/lib/db";
import { calcPrice } from "@/lib/pricing";
import { FEE_CURRENCY_LABEL, FUEL_LABEL, STATUS_LABEL, TRANS_LABEL, formatAed, formatDate, formatToman, toFa, toFaPlain } from "@/lib/format";
import { Badge } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { ConsultForm } from "@/components/consult-form";
import { VehicleCard } from "@/components/vehicle-card";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

async function load(id: string) {
  const v = await db.getVehicle(id);
  return v && v.isPublished ? v : null;
}

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const v = await load((await params).id);
  if (!v) return { title: "خودرو پیدا نشد" };
  return { title: vehicleTitle(v), description: v.description.slice(0, 160) || `${vehicleTitle(v)} — برآورد قیمت واردات از امارات` };
}

export default async function VehiclePage({ params }: Ctx) {
  const { id } = await params;
  const v = await load(id);
  if (!v) notFound();

  const [rate, allFees, related] = await Promise.all([
    db.getRate(), db.listFees(), db.listVehicles({ publishedOnly: true, brand: v.brand, limit: 4 }),
  ]);
  const fees = allFees.filter((f) => f.isEnabled);
  const price = calcPrice(v.aedPrice, rate.rate, fees);
  const staleDays = daysSince(rate.lastUpdated);
  const others = related.items.filter((x) => x.id !== v.id).slice(0, 3);
  const title = vehicleTitle(v);
  const s = v.specifications;
  const tone = v.status === "available" ? "mint" : v.status === "order" ? "gold" : "rose";

  const specs = [
    { icon: Calendar, label: "سال ساخت", value: toFaPlain(v.modelYear) },
    { icon: Gauge, label: "کارکرد", value: `${toFa(v.mileage)} کیلومتر` },
    { icon: Fuel, label: "سوخت", value: FUEL_LABEL[v.fuelType] },
    { icon: Cog, label: "گیربکس", value: TRANS_LABEL[v.transmission] },
    ...(v.engineCapacity > 0 ? [{ icon: Cog, label: "حجم موتور", value: `${toFa(v.engineCapacity)} سی‌سی` }] : []),
    ...(s.color ? [{ icon: Palette, label: "رنگ", value: String(s.color) }] : []),
    ...(s.seats ? [{ icon: Users, label: "ظرفیت", value: `${toFa(Number(s.seats))} نفر` }] : []),
    ...(s.location ? [{ icon: MapPin, label: "موقعیت", value: String(s.location) }] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
      <nav aria-label="مسیر" className="mb-5 flex min-w-0 items-center gap-2 text-sm text-muted sm:mb-6">
        <Link href="/" className="shrink-0 hover:text-ink">خانه</Link><ChevronLeft className="size-4 shrink-0" />
        <Link href="/catalog" className="shrink-0 hover:text-ink">کاتالوگ</Link><ChevronLeft className="size-4 shrink-0" />
        <span className="min-w-0 truncate text-ink" dir="auto">{title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0 space-y-8">
          <Reveal><VehicleGallery images={v.images} brand={v.brand} title={title} /></Reveal>

          <Reveal>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3"><Badge tone="gold">{v.brand}</Badge><Badge tone={tone}>{STATUS_LABEL[v.status]}</Badge>{s.gccSpec === true && <Badge tone="sky">اسپک GCC</Badge>}</div>
              <h1 className="text-2xl font-black leading-snug wrap-anywhere sm:text-4xl" dir="auto">{v.brand} {v.model} <span className="text-muted">{toFaPlain(v.modelYear)}</span></h1>
              {v.description && <p className="whitespace-pre-line leading-9 text-muted">{v.description}</p>}
            </div>
          </Reveal>

          <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" gap={0.05}>
            {specs.map((x) => (
              <StaggerItem key={x.label} className="card-surface rounded-2xl p-4">
                <x.icon className="mb-3 size-5 text-gold" />
                <p className="text-xs text-faint">{x.label}</p>
                <p className="mt-1 text-sm font-bold">{x.value}</p>
              </StaggerItem>
            ))}
          </Stagger>

          {v.features.length > 0 && (
            <Reveal>
              <h2 className="mb-4 text-xl font-black">امکانات</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {v.features.map((f) => (<li key={f} className="flex items-center gap-3 rounded-xl bg-white/4 px-4 py-3 text-sm"><CheckCircle2 className="size-5 shrink-0 text-mint" />{f}</li>))}
              </ul>
            </Reveal>
          )}
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <Reveal x={-30} y={0}>
            <div className="glass relative overflow-hidden rounded-3xl p-6">
              <div className="pointer-events-none absolute -top-16 end-0 size-48 rounded-full bg-gold/20 blur-3xl" />
              <p className="text-sm text-muted">برآورد قیمت نهایی در ایران</p>
              <p className="mt-2 text-2xl font-black gradient-text sm:text-3xl">{rate.rate > 0 ? formatToman(price.totalToman) : "استعلام قیمت"}</p>
              <p className="mt-1 text-sm text-faint">قیمت در امارات: {formatAed(v.aedPrice)}</p>

              {rate.rate > 0 && (
                <div className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm">
                  <div className="flex justify-between"><span className="text-muted">معادل تومانی ({toFa(rate.rate)} تومان/درهم)</span><span className="font-semibold">{formatToman(price.baseToman)}</span></div>
                  {price.lines.map((l) => (
                    <div key={l.id} className="flex justify-between gap-3">
                      <span className="text-muted">{l.name}<span className="ms-1 text-xs text-faint">{l.type === "percentage" ? `(${toFa(l.rawValue)}٪)` : l.currency !== "Toman" ? `(${toFa(l.rawValue)} ${FEE_CURRENCY_LABEL[l.currency]})` : ""}</span></span>
                      <span className="shrink-0 font-semibold">{formatToman(l.amountToman)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-line pt-3 text-base font-black"><span>مجموع</span><span>{formatToman(price.totalToman)}</span></div>
                </div>
              )}
              <p className="mt-4 text-xs leading-6 text-faint">آخرین به‌روزرسانی نرخ: {formatDate(rate.lastUpdated)}</p>
              {staleDays > 7 && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-gold/10 p-3 text-xs leading-6 text-gold"><AlertTriangle className="mt-0.5 size-4 shrink-0" />نرخ ارز {toFa(staleDays)} روز پیش به‌روز شده؛ برای قیمت دقیق با ما تماس بگیرید.</p>
              )}
            </div>
          </Reveal>

          <Reveal x={-30} y={0} delay={0.1}>
            <div className="card-surface rounded-3xl p-6">
              <h2 className="mb-1 text-lg font-black">درخواست مشاوره برای این خودرو</h2>
              <p className="mb-5 text-sm text-muted">شماره‌ی خود را بگذارید تا با شما تماس بگیریم.</p>
              <ConsultForm compact vehicleId={v.id} vehicleTitle={title} />
            </div>
          </Reveal>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-16 sm:mt-24">
          <Reveal><h2 className="mb-8 text-2xl font-black">خودروهای مشابه از {v.brand}</h2></Reveal>
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (<StaggerItem key={o.id}><VehicleCard vehicle={o} rate={rate.rate} fees={fees} /></StaggerItem>))}
          </Stagger>
        </section>
      )}
    </div>
  );
}
