import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { SiteFooter } from "@/components/site-footer";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "ترنم شرق چابهار | واردات خودرو از امارات، از چابهار تا سراسر ایران",
  description: "خرید و واردات خودرو از امارات با قیمت نهایی شفاف، محاسبه‌ی لحظه‌ای هزینه‌ها و پشتیبانی کامل تا ترخیص؛ از مجموعه‌ی ترنم شرق چابهار.",
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await db.getSettings();
  return (
    <SiteShell title={s.siteTitle} whatsapp={s.whatsappNumber ? { number: s.whatsappNumber, message: s.whatsappMessage } : undefined}>
      {children}
      <SiteFooter settings={s} />
    </SiteShell>
  );
}
