import Link from "next/link";
import { ArrowLeft, Car, DollarSign, Eye, Inbox, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin-shell";
import { CountUp, Stagger, StaggerItem } from "@/components/motion";
import { Badge, LinkButton } from "@/components/ui";
import { REQUEST_LABEL, formatDateTime, formatToman, toFa } from "@/lib/format";

export const metadata = { title: "داشبورد" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, rate, requests] = await Promise.all([db.stats(), db.getRate(), db.listRequests()]);
  const cards = [
    { label: "کل خودروها", value: stats.vehicles, icon: Car, href: "/admin/vehicles", tone: "text-gold bg-gold/12" },
    { label: "منتشرشده", value: stats.published, icon: Eye, href: "/admin/vehicles", tone: "text-mint bg-mint/12" },
    { label: "کل درخواست‌ها", value: stats.requests, icon: Inbox, href: "/admin/requests", tone: "text-[#9db0ff] bg-sky/12" },
    { label: "در انتظار پاسخ", value: stats.pendingRequests, icon: Inbox, href: "/admin/requests", tone: "text-rose bg-rose/12" },
  ];
  return (
    <>
      <PageHeader title="داشبورد" text="نمای کلی از وضعیت سایت" actions={<LinkButton href="/admin/vehicles/new"><Plus className="size-5" />افزودن خودرو</LinkButton>} />
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StaggerItem key={c.label}>
            <Link href={c.href} className="card-surface border-glow group flex items-center gap-4 rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-1">
              <span className={`grid size-14 place-items-center rounded-2xl transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 ${c.tone}`}><c.icon className="size-7" /></span>
              <div><p className="text-3xl font-black"><CountUp to={c.value} duration={1.1} /></p><p className="text-sm text-muted">{c.label}</p></div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card-surface rounded-3xl p-6">
          <div className="mb-5 flex items-center justify-between"><h2 className="font-black">آخرین درخواست‌ها</h2><Link href="/admin/requests" className="flex items-center gap-1 text-sm text-gold">همه<ArrowLeft className="size-4" /></Link></div>
          {requests.length === 0 ? <p className="py-8 text-center text-sm text-muted">هنوز درخواستی ثبت نشده است.</p> : (
            <ul className="divide-y divide-line">
              {requests.slice(0, 5).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0"><p className="font-bold">{r.name}</p><p className="mt-0.5 truncate text-xs text-muted" dir="ltr">{r.phone}{r.vehicleTitle ? ` · ${r.vehicleTitle}` : ""}</p></div>
                  <div className="flex items-center gap-3"><Badge tone={r.status === "pending" ? "rose" : r.status === "contacted" ? "gold" : "mint"}>{REQUEST_LABEL[r.status]}</Badge><span className="text-xs text-faint">{formatDateTime(r.submittedAt)}</span></div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card-surface rounded-3xl p-6">
          <h2 className="mb-5 font-black">نرخ فعلی درهم</h2>
          <div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-2xl bg-gold/12 text-gold"><DollarSign className="size-7" /></span><div><p className="text-2xl font-black gradient-text">{rate.rate > 0 ? formatToman(rate.rate) : "تنظیم نشده"}</p><p className="text-xs text-muted">{rate.isManual ? "ثبت دستی" : "خودکار"} · {formatDateTime(rate.lastUpdated)}</p></div></div>
          <LinkButton href="/admin/exchange-rate" variant="outline" className="mt-6 w-full">به‌روزرسانی نرخ</LinkButton>
          <p className="mt-4 text-xs text-faint">تعداد درخواست‌ها: {toFa(stats.requests)}</p>
        </section>
      </div>
    </>
  );
}
