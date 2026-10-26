import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { Reveal } from "@/components/motion";
import { SectionTitle } from "@/components/ui";
import { ConsultForm } from "@/components/consult-form";

export const metadata: Metadata = { title: "تماس با ما", description: "درخواست مشاوره‌ی رایگان برای واردات خودرو از امارات." };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const s = await db.getSettings();
  const items = [
    s.contactPhone && { icon: Phone, label: "تلفن", value: s.contactPhone, href: `tel:${s.contactPhone}`, ltr: true },
    s.whatsappNumber && { icon: MessageCircle, label: "واتس‌اپ", value: `+${s.whatsappNumber}`, href: `https://wa.me/${s.whatsappNumber}?text=${encodeURIComponent(s.whatsappMessage)}`, ltr: true },
    s.contactEmail && { icon: Mail, label: "ایمیل", value: s.contactEmail, href: `mailto:${s.contactEmail}`, ltr: true },
    s.address && { icon: MapPin, label: "نشانی", value: s.address },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string; ltr?: boolean }[];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 sm:px-6 sm:pt-40">
      <Reveal><SectionTitle eyebrow="تماس با ما" title="بیایید درباره‌ی خودروی بعدی‌تان حرف بزنیم" text="فرم را پر کنید؛ کارشناسان ما در اولین فرصت تماس می‌گیرند." /></Reveal>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Reveal x={30} y={0}><div className="card-surface rounded-3xl p-6 sm:p-8"><ConsultForm /></div></Reveal>
        <Reveal x={-30} y={0} delay={0.1}>
          <div className="space-y-4">
            {items.length === 0 && <p className="glass rounded-2xl p-6 text-sm leading-7 text-muted">اطلاعات تماس هنوز ثبت نشده است. لطفاً از فرم مقابل برای ارتباط استفاده کنید.</p>}
            {items.map((it) => {
              const inner = (
                <>
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/12 text-gold"><it.icon className="size-6" /></span>
                  <div className="min-w-0"><p className="text-xs text-faint">{it.label}</p><p className="mt-0.5 truncate font-bold" dir={it.ltr ? "ltr" : undefined}>{it.value}</p></div>
                </>
              );
              const cls = "glass flex items-center gap-4 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40";
              return it.href ? <a key={it.label} href={it.href} className={cls} target={it.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{inner}</a> : <div key={it.label} className={cls}>{inner}</div>;
            })}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
