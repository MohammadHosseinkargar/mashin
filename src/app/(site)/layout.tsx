import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await db.getSettings();
  return (
    <>
      <SiteHeader title={settings.siteTitle} />
      <main className="relative min-h-[70dvh]">{children}</main>
      <SiteFooter settings={settings} />
      <WhatsAppFab number={settings.whatsappNumber} message={settings.whatsappMessage} />
    </>
  );
}
