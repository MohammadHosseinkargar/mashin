"use client";

import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { InstallPrompt } from "@/components/install-prompt";
import { WhatsAppFab } from "@/components/whatsapp-fab";

export function SiteShell({ children, title, whatsapp }: { children: React.ReactNode; title?: string; whatsapp?: { number: string; message: string } }) {
  return (
    <div className="min-h-dvh">
      <SiteHeader title={title ?? "ترنم شرق چابهار"} />
      {/* فضای هدر ثابت بالا و نوار پایینِ موبایل اینجا یک‌بار رزرو می‌شود؛ صفحه‌ها padding اضافه نمی‌گذارند. */}
      <main className="pt-[calc(var(--header-h)+env(safe-area-inset-top))] pb-[calc(var(--nav-h)+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <BottomNav />
      {whatsapp && <WhatsAppFab number={whatsapp.number} message={whatsapp.message} />}
      <InstallPrompt />
    </div>
  );
}
