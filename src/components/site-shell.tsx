"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { InstallPrompt } from "@/components/install-prompt";
import { GlobalHeadScript } from "@/app/global-head-script";

export function SiteShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const mobile = typeof window !== "undefined" && window.innerWidth < 640;
  return (
    <div className="min-h-dvh">
      <SiteHeader title={title ?? "ترنم شرق چابهار"} />
      <main className="pb-24 sm:pb-14">
        {children}
      </main>
      <GlobalHeadScript />
      {/* bottom ios-style nav only on small screens */}
      {mobile && <BottomNav />}
      <InstallPrompt className="pointer-events-none" />
    </div>
  );
}
