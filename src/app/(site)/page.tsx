import { ArrowLeft, BadgeCheck, Calculator, FileCheck2, Handshake, Search, ShieldCheck, Ship, Sparkles, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { LinkButton, SectionTitle } from "@/components/ui";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { HeroScene } from "@/components/hero-scene";
import { VehicleCard } from "@/components/vehicle-card";
import { PriceCalculator } from "@/components/price-calculator";
import { ConsultForm } from "@/components/consult-form";

const STEPS = [
  { icon: Search, title: "انتخاب خودرو", text: "از کاتالوگ خودروی مدنظرتان را انتخاب کنید یا مشخصاتش را به ما بگویید." },
  { icon: Calculator, title: "استعلام قیمت شفاف", text: "قیمت نهایی را با نرخ روز و تمام هزینه‌ها پیش از هر اقدامی می‌بینید." },
  { icon: Ship, title: "خرید و حمل", text: "بازرسی، خرید امن و حمل بیمه‌شده از امارات تا بندر چابهار را ما انجام می‌دهیم." },
  { icon: FileCheck2, title: "ترخیص و تحویل", text: "مراحل ترخیص و مستندسازی را پیگیری و خودرو را تحویل شما می‌دهیم." },
];
const BENEFITS = [
  { icon: ShieldCheck, title: "بازرسی و اصالت", text: "بررسی سوابق و وضعیت فنی خودرو پیش از خرید." },
  { icon: Wallet, title: "هزینه‌ی شفاف", text: "همه‌ی هزینه‌ها از ابتدا مشخص است؛ بدون غافلگیری." },
  { icon: Handshake, title: "همراهی تا آخر", text: "از انتخاب تا تحویل، یک کارشناس مسئول پرونده‌ی شماست." },
  { icon: BadgeCheck, title: "اطمینان در معامله", text: "خرید از فروشندگان معتبر و قراردادهای مستند." },
];

export default async function HomePage() {
  const [rate, fees, latest, stats, brands] = await Promise.all([
    db.getRate(),
    db.listFees().then((f) => f.filter((x) => x.isEnabled)),
    db.listVehicles({ publishedOnly: true, limit: 6, sort: "newest" }),
    db.stats(),
    db.listBrands(true),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="noise relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="bg-grid absolute inset-0 -z-10" />
        <div className="absolute -top-40 end-[-10%] -z-10 size-[620px] rounded-full bg-sky/15 blur-[130px]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-7">
            <Reveal><span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-semibold text-gold"><Sparkles className="size-4" />واردات خودرو از امارات، از چابهار</span></Reveal>
            <Reveal delay={0.1}>
              <h1 className="text-4xl font-black leading-[1.35] sm:text-5xl lg:text-[3.6rem]">
                خودروی رویایی‌ات را <span className="gradient-text">شفاف و مطمئن</span><br />از امارات وارد کن
              </h1>
            </Reveal>
            <Reveal delay={0.2}><p className="max-w-xl text-lg leading-9 text-muted">قیمت نهایی را همین حالا با نرخ روز و تمام هزینه‌های واردات ببین؛ از انتخاب تا ترخیص، ترنم شرق چابهار همراهت است.</p></Reveal>
            <Reveal delay={0.3}>
              <div className="flex flex-wrap gap-3">
                <LinkButton href="/catalog" size="lg">مشاهده‌ی کاتالوگ<ArrowLeft className="size-5" /></LinkButton>
                <LinkButton href="/#calculator" variant="outline" size="lg"><Calculator className="size-5" />محاسبه‌ی قیمت</LinkButton>
              </div>
            </Reveal>
          </div>
          <HeroScene rate={rate.rate} />
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <Stagger className="glass grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-line md:grid-cols-4">
          {[
            { n: stats.published, l: "خودروی آماده‌ی سفارش" },
            { n: brands.length, l: "برند معتبر" },
            { n: fees.length, l: "مرحله‌ی هزینه‌ی شفاف" },
            { n: 24, l: "ساعته پاسخگو", s: "/۷" },
          ].map((s) => (
            <StaggerItem key={s.l} className="bg-surface/90 px-4 py-8 text-center">
              <p className="text-3xl font-black gradient-text sm:text-4xl"><CountUp to={s.n} />{s.s ?? ""}</p>
              <p className="mt-2 text-sm text-muted">{s.l}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* BRAND MARQUEE */}
      {brands.length > 0 && (
        <div className="mt-14 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_15%,#000_85%,transparent)]" aria-hidden="true">
          <div className="flex w-max animate-marquee gap-12 text-2xl font-black text-white/15">
            {[...brands, ...brands, ...brands, ...brands].map((b, i) => (<span key={i} className="whitespace-nowrap">{b}</span>))}
          </div>
        </div>
      )}

      {/* FEATURED */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle eyebrow="تازه‌ترین‌ها" title="خودروهای منتخب" text="جدیدترین خودروهای آماده‌ی واردات با برآورد قیمت نهایی." />
            <LinkButton href="/catalog" variant="outline" className="mb-10">همه‌ی خودروها<ArrowLeft className="size-4" /></LinkButton>
          </div>
        </Reveal>
        {latest.items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong py-16 text-center text-muted">هنوز خودرویی منتشر نشده است.</p>
        ) : (
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.items.map((v) => (<StaggerItem key={v.id}><VehicleCard vehicle={v} rate={rate.rate} fees={fees} /></StaggerItem>))}
          </Stagger>
        )}
      </section>

      {/* STEPS */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6">
        <Reveal><SectionTitle center eyebrow="مسیر خرید" title="چهار قدم تا خودروی شما" text="فرایندی ساده و قابل‌پیگیری، بدون پیچیدگی." /></Reveal>
        <Stagger className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4" gap={0.12}>
          <div className="absolute inset-x-[12%] top-12 hidden h-px bg-gradient-to-l from-transparent via-gold/40 to-transparent lg:block" />
          {STEPS.map((s, i) => (
            <StaggerItem key={s.title} className="card-surface border-glow group relative rounded-3xl p-6 transition-transform duration-500 hover:-translate-y-2">
              <span className="absolute end-5 top-4 text-6xl font-black text-white/[0.04]">{new Intl.NumberFormat("fa-IR").format(i + 1)}</span>
              <span className="relative mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-gold/25 to-amber/10 text-gold transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"><s.icon className="size-7" /></span>
              <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
              <p className="text-sm leading-7 text-muted">{s.text}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="mx-auto mt-28 max-w-6xl scroll-mt-28 px-4 sm:px-6">
        <Reveal><PriceCalculator rate={rate.rate} fees={fees} /></Reveal>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6">
        <Reveal><SectionTitle center eyebrow="چرا ترنم شرق چابهار" title="خرید با خیال راحت" /></Reveal>
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <StaggerItem key={b.title} className="glass group rounded-3xl p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/40">
              <b.icon className="mb-4 size-9 text-gold transition-transform duration-500 group-hover:scale-110" />
              <h3 className="mb-2 font-bold">{b.title}</h3>
              <p className="text-sm leading-7 text-muted">{b.text}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="noise relative grid overflow-hidden rounded-[2rem] border border-gold/20 bg-gradient-to-bl from-gold/12 via-surface to-surface p-6 sm:p-12 lg:grid-cols-2 lg:gap-12">
            <div className="absolute -start-24 -bottom-24 size-80 rounded-full bg-gold/15 blur-[90px]" />
            <div className="relative mb-8 space-y-4 lg:mb-0">
              <h2 className="text-3xl font-black leading-snug sm:text-4xl">مشاوره‌ی <span className="gradient-text">رایگان</span> می‌خواهید؟</h2>
              <p className="leading-8 text-muted">شماره‌تان را بگذارید تا کارشناس ما بهترین گزینه‌ها را متناسب با بودجه‌ی شما پیشنهاد دهد.</p>
            </div>
            <div className="relative"><ConsultForm compact /></div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
