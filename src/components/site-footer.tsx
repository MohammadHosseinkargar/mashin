import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { toFaPlain } from "@/lib/format";
import { Logo } from "./site-header";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="relative mt-24 border-t border-line bg-surface/60">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold/50 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo title={settings.siteTitle} />
          <p className="max-w-sm text-sm leading-8 text-muted">{settings.siteDescription}</p>
        </div>
        <div>
          <h3 className="mb-4 font-bold">دسترسی سریع</h3>
          <ul className="space-y-2.5 text-sm text-muted">
            {[["/catalog", "کاتالوگ خودرو"], ["/#calculator", "ماشین‌حساب قیمت"], ["/about", "درباره ما"], ["/contact", "درخواست مشاوره"]].map(([h, l]) => (
              <li key={h}><Link href={h} className="transition hover:text-gold hover:ps-1">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-bold">ارتباط با ما</h3>
          <ul className="space-y-3 text-sm text-muted">
            {settings.contactPhone && <li className="flex items-center gap-2"><Phone className="size-4 text-gold" /><a dir="ltr" href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a></li>}
            {settings.contactEmail && <li className="flex items-center gap-2"><Mail className="size-4 text-gold" /><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></li>}
            {settings.address && <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-gold" />{settings.address}</li>}
            {!settings.contactPhone && !settings.contactEmail && !settings.address && <li>برای ارتباط از فرم درخواست مشاوره استفاده کنید.</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-faint">
        © {toFaPlain(new Date().getFullYear())} {settings.siteTitle} — تمامی حقوق محفوظ است. قیمت‌ها تخمینی و وابسته به نرخ روز ارز هستند.
      </div>
    </footer>
  );
}
